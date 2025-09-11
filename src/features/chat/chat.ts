import { Message, Role, Screenplay, Talk } from "./messages";
import { Viewer } from "@/features/vrmViewer/viewer";
import { Alert } from "@/features/alert/alert";
import { AmicaLife } from "@/features/amicaLife/amicaLife";
import { config, updateConfig } from "@/utils/config";
import { cleanTalk } from "@/utils/cleanTalk";
import { wait } from "@/utils/wait";
import isDev from "@/utils/isDev";
import { perfMark } from "@/utils/perf";
import {
  isCharacterIdle,
  characterIdleTime,
  resetIdleTimer,
} from "@/utils/isIdle";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { getEchoChatResponseStream } from "./echoChat";
// Removed direct backend imports; resolution now via registry in getChatResponseStream.
import { getOpenAiVisionChatResponse } from "./openAiChat";
import { getLlavaCppChatResponse } from "./llamaCppChat";
import { getOllamaVisionChatResponse } from "./ollamaChat";
import { AsyncQueue } from "./asyncQueue";
import {
  getOrLoadTTSBackend,
  snapshotConfig,
  getOrLoadLLMBackend,
} from "./registries";
import { rvc } from "@/features/rvc/rvc";
import { ChatStreamSession } from "./chatSession";
import { handleUserInput } from "../externalAPI/externalAPI";

type Speak = {
  audioBuffer: ArrayBuffer | null;
  screenplay: Screenplay;
  streamIdx: number;
};
type TTSJob = { screenplay: Screenplay; streamIdx: number };

enum ChatState {
  Idle = "idle",
  Processing = "processing",
  Speaking = "speaking",
  Thinking = "thinking",
}

type VisionBackend = "vision_llamacpp" | "vision_ollama" | "vision_openai";

export class Chat {
  public initialized: boolean;
  public amicaLife?: AmicaLife;
  public viewer?: Viewer;
  public alert?: Alert;
  public setChatLog?: (messageLog: Message[]) => void;
  public setUserMessage?: (message: string) => void;
  public setAssistantMessage?: (message: string) => void;
  public setShownMessage?: (role: Role) => void;
  public setChatProcessing?: (processing: boolean) => void;
  public setChatSpeaking?: (speaking: boolean) => void;
  public setThoughtMessage?: (message: string) => void;
  public stream: ReadableStream<Uint8Array> | null; // legacy
  public streams: ReadableStream<Uint8Array>[]; // legacy
  public reader: ReadableStreamDefaultReader<Uint8Array> | null; // legacy
  public readers: ReadableStreamDefaultReader<Uint8Array>[]; // legacy
  public ttsJobs: AsyncQueue<TTSJob>;
  public speakJobs: AsyncQueue<Speak>;
  private currentAssistantMessage: string;
  private currentUserMessage: string;
  private thoughtMessage: string;
  private lastAwake: number;
  public messageList: Message[];
  public currentStreamIdx: number;
  private eventSource: EventSource | null = null;
  private activeSession?: ChatStreamSession;
  private state: ChatState = ChatState.Idle;
  private assistantBuffer = "";
  private assistantFlushScheduled = false;
  private ttsLoopStarted = false;
  private speakLoopStarted = false;
  constructor() {
    this.initialized = false;
    this.stream = null;
    this.reader = null;
    this.streams = [];
    this.readers = [];
    this.ttsJobs = new AsyncQueue<TTSJob>();
    this.speakJobs = new AsyncQueue<Speak>();
    this.currentAssistantMessage = "";
    this.currentUserMessage = "";
    this.thoughtMessage = "";
    this.messageList = [];
    this.currentStreamIdx = 0;
    this.lastAwake = 0;
    const noop = () => {};
    this.setChatLog = noop as any;
    this.setUserMessage = noop as any;
    this.setAssistantMessage = noop as any;
    this.setShownMessage = noop as any;
    this.setChatProcessing = noop as any;
    this.setChatSpeaking = noop as any;
    this.setThoughtMessage = noop as any;
  }

  public initialize(
    amicaLife: AmicaLife,
    viewer: Viewer,
    alert: Alert,
    setChatLog: (messageLog: Message[]) => void,
    setUserMessage: (message: string) => void,
    setAssistantMessage: (message: string) => void,
    setThoughtMessage: (message: string) => void,
    setShownMessage: (role: Role) => void,
    setChatProcessing: (processing: boolean) => void,
    setChatSpeaking: (speaking: boolean) => void,
  ) {
    this.amicaLife = amicaLife;
    this.viewer = viewer;
    this.alert = alert;
    this.setChatLog = setChatLog;
    this.setUserMessage = setUserMessage;
    this.setAssistantMessage = setAssistantMessage;
    this.setShownMessage = setShownMessage;
    this.setThoughtMessage = setThoughtMessage;
    this.setChatProcessing = setChatProcessing;
    this.setChatSpeaking = setChatSpeaking;
    this.processTtsJobs();
    this.processSpeakJobs();
    this.updateAwake();
    this.initialized = true;
    this.initSSE();
  }

  public setMessageList(messages: Message[]) {
    this.messageList = messages;
    this.currentAssistantMessage = "";
    this.currentUserMessage = "";
    this.setChatLog!(this.messageList);
    this.setAssistantMessage!("");
    this.setUserMessage!("");
    this.currentStreamIdx++;
  }

  public async handleRvc(audio: ArrayBuffer) {
    const blob = new Blob([audio], { type: "audio/wav" });
    const voice = await rvc(
      blob,
      config("rvc_model_name"),
      config("rvc_index_path"),
      parseInt(config("rvc_f0_upkey")),
      config("rvc_f0_method"),
      config("rvc_index_rate"),
      parseInt(config("rvc_filter_radius")),
      parseInt(config("rvc_resample_sr")),
      parseInt(config("rvc_rms_mix_rate")),
      parseInt(config("rvc_protect")),
    );
    return voice.audio;
  }

  public idleTime(): number {
    return characterIdleTime(this.lastAwake);
  }

  public isAwake() {
    return !isCharacterIdle(this.lastAwake);
  }

  public updateAwake() {
    this.lastAwake = Date.now();
    resetIdleTimer();
  }

  public async processTtsJobs() {
    if (this.ttsLoopStarted) return;
    this.ttsLoopStarted = true;
    (async () => {
      for (;;) {
        const job = await this.ttsJobs.dequeue().catch(() => undefined);
        if (!job) continue;
        if (job.streamIdx !== this.currentStreamIdx) continue;
        try {
          const audioBuffer = await this.fetchAudio(job.screenplay.talk);
          this.speakJobs.enqueue({
            audioBuffer,
            screenplay: job.screenplay,
            streamIdx: job.streamIdx,
          });
        } catch (e) {
          console.error("TTS job failure", e);
        }
      }
    })();
  }

  public async processSpeakJobs() {
    if (this.speakLoopStarted) return;
    this.speakLoopStarted = true;
    (async () => {
      for (;;) {
        const speak = await this.speakJobs.dequeue().catch(() => undefined);
        if (!speak) continue;
        if (speak.streamIdx !== this.currentStreamIdx) continue;

        const lt = (window as any).chatvrm_latency_tracker;
        if (lt?.active) {
          const ms = Date.now() - lt.start;
          console.log("performance_latency", ms);
          lt.active = false;
        }

        this.appendAssistantBuffered(speak.screenplay.text, true);

        if (speak.audioBuffer) {
          perfMark("tts:play:start");
          this.transition(ChatState.Speaking);
          try {
            this.setChatSpeaking!(true);
            await this.viewer!.model?.speak(
              speak.audioBuffer,
              speak.screenplay,
            );
          } catch (e) {
            console.error("speak error", e);
          } finally {
            this.setChatSpeaking!(false);
            this.transition(ChatState.Idle);
            perfMark("tts:play:done");
            if (this.isAwake()) this.updateAwake();
          }
        }
      }
    })();
  }

  private appendAssistantBuffered(text: string, flushNow = false) {
    if (!text) return;
    this.assistantBuffer += text;
    if (flushNow) {
      this.flushAssistantBuffer();
      return;
    }
    if (this.assistantFlushScheduled) return;
    this.assistantFlushScheduled = true;
    requestAnimationFrame(() => this.flushAssistantBuffer());
  }

  private flushAssistantBuffer() {
    if (this.assistantBuffer === "") {
      this.assistantFlushScheduled = false;
      return;
    }
    this.currentAssistantMessage += this.assistantBuffer;
    this.assistantBuffer = "";
    this.assistantFlushScheduled = false;
    this.setAssistantMessage!(this.currentAssistantMessage);
    this.setChatLog!([
      ...this.messageList,
      { role: "assistant", content: this.currentAssistantMessage },
    ]);
    this.setShownMessage!("assistant");
  }

  public thoughtBubbleMessage(isThinking: boolean, thought: string) {
    if (!isThinking) {
      this.thoughtMessage = "";
      this.setThoughtMessage!("");
      return;
    }
    if (this.thoughtMessage !== "") this.thoughtMessage += " ";
    this.thoughtMessage += thought;
    this.setThoughtMessage!(this.thoughtMessage);
  }

  public bubbleMessage(role: Role, text: string) {
    if (role === "user") {
      if (this.currentUserMessage !== "") this.currentUserMessage += " ";
      this.currentUserMessage += text;
      this.setUserMessage!(this.currentUserMessage);
      this.setAssistantMessage!("");
      if (this.currentAssistantMessage !== "") {
        this.messageList.push({
          role: "assistant",
          content: this.currentAssistantMessage,
        });
        this.currentAssistantMessage = "";
      }
      this.setChatLog!([
        ...this.messageList,
        { role: "user", content: this.currentUserMessage },
      ]);
    }

    if (role === "assistant") {
      if (
        this.currentAssistantMessage !== "" &&
        !this.isAwake() &&
        config("amica_life_enabled") === "true"
      ) {
        this.messageList.push({
          role: "assistant",
          content: this.currentAssistantMessage,
        });
        this.currentAssistantMessage = text;
        this.setAssistantMessage!(this.currentAssistantMessage);
      } else if (config("chatbot_backend") === "moshi") {
        if (this.currentAssistantMessage !== "") {
          this.messageList.push({
            role: "assistant",
            content: this.currentAssistantMessage,
          });
        }
        this.currentAssistantMessage = text;
        this.setAssistantMessage!(this.currentAssistantMessage);
        this.setUserMessage!("");
      } else {
        this.appendAssistantBuffered(text);
        this.setUserMessage!("");
      }

      if (this.currentUserMessage !== "") {
        this.messageList.push({
          role: "user",
          content: this.currentUserMessage,
        });
        this.currentUserMessage = "";
      }
    }
    this.setShownMessage!(role);
  }

  public async interrupt() {
    this.currentStreamIdx++;
    if (this.activeSession) this.activeSession.abort();
    this.ttsJobs.clear();
    this.speakJobs.clear();
    this.assistantBuffer = "";
    try {
      (this.viewer as any)?.model?.stopSpeaking?.();
    } catch (e) {
      /* ignore stopSpeaking errors */
    }
  }

  public async receiveMessageFromUser(message: string, amicaLife: boolean) {
    perfMark("chat:user:send:start");
    if (!message) return;
    console.time("performance_interrupting");
    await this.interrupt();
    console.timeEnd("performance_interrupting");
    await wait(0);
    if (!amicaLife) {
      await handleUserInput(message);
      this.amicaLife?.receiveMessageFromUser(message);
      if (!/\[.*?\]/.test(message)) message = `[neutral] ${message}`;
      this.updateAwake();
      this.bubbleMessage("user", message);
    }
    const messages: Message[] = [
      { role: "system", content: config("system_prompt") },
      ...this.messageList,
      { role: "user", content: amicaLife ? message : this.currentUserMessage },
    ];
    perfMark("chat:stream:start");
    await this.makeAndHandleStream(messages);
  }

  public initSSE() {
    if (!isDev || config("external_api_enabled") !== "true") return;
    this.closeSSE();
    this.eventSource = new EventSource("/api/amicaHandler");
    this.eventSource.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { type, data } = msg;
        switch (type) {
          case "normal": {
            const messages: Message[] = [
              { role: "system", content: config("system_prompt") },
              ...this.messageList,
              { role: "user", content: data },
            ];
            const stream = await getEchoChatResponseStream(messages);
            this.handleChatResponseStream(stream);
            break;
          }
          case "animation": {
            const animation = await loadVRMAnimation(`/animations/${data}`);
            if (!animation) throw new Error("Loading animation failed");
            this.viewer?.model?.playAnimation(animation, data);
            requestAnimationFrame(() => this.viewer?.resetCameraLerp());
            break;
          }
          case "playback": {
            this.viewer?.startRecording();
            setTimeout(() => {
              this.viewer?.stopRecording((videoBlob) => {
                const url = URL.createObjectURL(videoBlob!);
                const a = document.createElement("a");
                a.href = url;
                a.download = "recording.webm";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              });
            }, data);
            break;
          }
          case "systemPrompt": {
            updateConfig("system_prompt", data);
            break;
          }
          default:
            console.warn("Unknown message type", type);
        }
      } catch (e) {
        console.error("Error parsing SSE message", e);
      }
    };
    this.eventSource.addEventListener("end", () => {
      this.eventSource?.close();
    });
    this.eventSource.onerror = () => {
      this.eventSource?.close();
      setTimeout(() => this.initSSE(), 500);
    };
  }

  public closeSSE() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  public async makeAndHandleStream(messages: Message[]) {
    let stream: ReadableStream<Uint8Array> | null = null;
    try {
      stream = await this.getChatResponseStream(messages);
    } catch (e: any) {
      const msg = e.toString();
      this.alert?.error("Failed to get chat response", msg);
      return msg;
    }
    if (!stream) {
      const msg = "Null stream";
      this.alert?.error("Null stream", msg);
      return msg;
    }
    return await this.handleChatResponseStream(stream);
  }

  public async handleChatResponseStream(stream: ReadableStream<Uint8Array>) {
    this.currentStreamIdx++;
    const idx = this.currentStreamIdx;
    this.activeSession = new ChatStreamSession(idx, stream, {
      enqueueScreenplay: (sc) =>
        this.ttsJobs.enqueue({ screenplay: sc, streamIdx: idx }),
      thought: (thinking, text) => this.thoughtBubbleMessage(thinking, text),
      setProcessing: (p) => this.setChatProcessing!(p),
      appendError: (msg) => this.bubbleMessage("assistant", msg),
      isCurrent: (i) => i === this.currentStreamIdx,
    });
    return await this.activeSession.process();
  }

  async fetchAudio(talk: Talk): Promise<ArrayBuffer | null> {
    talk = cleanTalk(talk);
    const snapshot = snapshotConfig([
      "tts_muted",
      "tts_backend",
      "rvc_enabled",
      "elevenlabs_voiceid",
      "speecht5_speaker_embedding_url",
    ]);
    if (talk.message.trim() === "" || snapshot.tts_muted === "true")
      return null;
    const backend = snapshot.tts_backend;
    const handler = await getOrLoadTTSBackend(backend);
    if (!handler) {
      console.warn("Unknown tts backend", backend);
      return null;
    }
    perfMark(`tts:${backend}:start`);
    try {
      return await handler(talk, {
        rvcTransform: (a) => this.handleRvc(a),
        snapshot,
      });
    } catch (e: any) {
      console.error(e.toString());
      this.alert?.error("Failed to get TTS response", e.toString());
      return null;
    } finally {
      perfMark(`tts:${backend}:done`);
    }
  }

  public async getChatResponseStream(messages: Message[]) {
    const backend = config("chatbot_backend") || "echo";
    const reasoning = config("reasoning_engine_enabled") === "true";
    const chosen = reasoning ? "reasoning_engine" : backend;
    const handler = await getOrLoadLLMBackend(chosen);
    if (!handler) return getEchoChatResponseStream(messages);
    return handler(messages);
  }

  public async getVisionResponse(imageData: string) {
    try {
      const visionBackend = config("vision_backend") as VisionBackend;
      let res = "";
      const buildDescribeMsg = (): Message => ({
        role: "user",
        content: "Describe the image as accurately as possible",
      });
      if (visionBackend === "vision_llamacpp") {
        const messages: Message[] = [
          { role: "system", content: config("vision_system_prompt") },
          ...this.messageList,
          buildDescribeMsg(),
        ];
        res = await getLlavaCppChatResponse(messages, imageData);
      } else if (visionBackend === "vision_ollama") {
        const messages: Message[] = [
          { role: "system", content: config("vision_system_prompt") },
          ...this.messageList,
          buildDescribeMsg(),
        ];
        res = await getOllamaVisionChatResponse(messages, imageData);
      } else if (visionBackend === "vision_openai") {
        const messages: Message[] = [
          { role: "user", content: config("vision_system_prompt") },
          ...(this.messageList as any[]),
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe the image as accurately as possible",
              },
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${imageData}` },
              },
            ],
          },
        ];
        res = await getOpenAiVisionChatResponse(messages);
      } else {
        console.warn("vision_backend not supported", visionBackend);
        return;
      }
      await this.makeAndHandleStream([
        { role: "system", content: config("system_prompt") },
        ...this.messageList,
        {
          role: "user",
          content: `This is a picture I just took from my webcam (described between [[ and ]] ): [[${res}]] Please respond accordingly and as if it were just sent and as though you can see it.`,
        },
      ]);
    } catch (e: any) {
      this.alert?.error("Failed to get vision response", e.toString());
    }
  }

  private transition(next: ChatState) {
    if (this.state === next) return;
    this.state = next;
    if (next === ChatState.Processing) this.setChatProcessing!(true);
    if (next === ChatState.Idle) this.setChatProcessing!(false);
  }
}
