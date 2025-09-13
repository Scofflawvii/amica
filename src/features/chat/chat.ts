import { Message, Role, Screenplay, Talk } from "./messages";
// Avoid eager importing heavy classes so tests can import Chat without pulling three.js.
// Lightweight structural typing for the viewer's model to avoid importing heavy VRM / three types
interface SpeakCapableModel {
  speak?: (audio: ArrayBuffer, screenplay: Screenplay) => Promise<void>;
  playEmotion?: (expression: string) => Promise<void> | void;
  // Optional stopSpeaking hook used on interrupt
  stopSpeaking?: () => void;
}
interface Viewer {
  model?: SpeakCapableModel; // typically a VRM or proxy wrapper
  resetCameraLerp?: () => void;
  startRecording?: () => void;
  // Accept callback param that may receive Blob or null (runtime may yield null)
  stopRecording?: (cb: (b: Blob | null) => void) => void;
}
// Align with concrete Alert class where error(title,message) expects both params
type Alert = { error: (title: string, message: string) => void };
type AmicaLife = { receiveMessageFromUser?: (m: string) => void };
import { config, updateConfig } from "@/utils/config";
import { cleanTalk } from "@/utils/cleanTalk";
import { wait } from "@/utils/wait";
import isDev from "@/utils/isDev";
import { perfMark } from "@/utils/perf";
import { logger } from "@/utils/logger";
import {
  isCharacterIdle,
  characterIdleTime,
  resetIdleTimer,
} from "@/utils/isIdle";
import { getEchoChatResponseStream } from "./echoChat";
// Removed direct backend imports; resolution now via registry in getChatResponseStream.
import { getOpenAiVisionChatResponse } from "./openAiChat";
import { getLlavaCppChatResponse } from "./llamaCppChat";
import { getOllamaVisionChatResponse } from "./ollamaChat";
import { AsyncQueue } from "./asyncQueue";
import { SpeechPipeline } from "./speechPipeline";
import { ChatObserver } from "./chatObserver";
import { StreamController } from "./streamController";
import {
  getOrLoadTTSBackend,
  snapshotConfig,
  getOrLoadLLMBackend,
} from "./registries";
// import { ChatStreamSession } from "./chatSession"; // unused here

type Speak = {
  audioBuffer: ArrayBuffer | null;
  screenplay: Screenplay;
  streamIdx: number;
};
type TTSJob = { screenplay: Screenplay; streamIdx: number };

export enum ChatState {
  Idle = "idle",
  Processing = "processing",
  Speaking = "speaking",
  Thinking = "thinking",
}
export type ChatStateString = `${ChatState}`;

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
  private streamController?: StreamController;
  private state: ChatState = ChatState.Idle;
  private assistantBuffer = "";
  private assistantFlushScheduled = false;
  private speechPipeline?: SpeechPipeline;
  private observers: ChatObserver[] = [];
  /** Expose current state for tests / UI */
  public getState() {
    return this.state;
  }
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
    // Map legacy setters to observer notifications so existing code keeps working
    this.setChatLog = (log: Message[]) =>
      this.notify((o) => o.onChatLog?.(log));
    this.setUserMessage = (m: string) =>
      this.notify((o) => o.onUserMessage?.(m));
    this.setAssistantMessage = (m: string) =>
      this.notify((o) => o.onAssistantMessage?.(m));
    this.setShownMessage = (r: Role) =>
      this.notify((o) => o.onShownMessage?.(r));
    this.setChatProcessing = (p: boolean) =>
      this.notify((o) => o.onProcessingChange?.(p));
    this.setChatSpeaking = (s: boolean) =>
      this.notify((o) => o.onSpeakingChange?.(s));
    this.setThoughtMessage = (t: string) =>
      this.notify((o) => o.onThoughtMessage?.(t));
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
    options?: { enableSSE?: boolean; observer?: ChatObserver },
  ) {
    this.amicaLife = amicaLife;
    this.viewer = viewer;
    this.alert = alert;
    if (!globalThis.__amica_init_warned) {
      globalThis.__amica_init_warned = true;
      // One-time deprecation notice
      logger.warn(
        "Chat.initialize legacy setter signature is deprecated; migrate to initializeWithObserver()",
      );
    }
    const legacyObserver: ChatObserver = {
      onChatLog: setChatLog,
      onUserMessage: setUserMessage,
      onAssistantMessage: setAssistantMessage,
      onShownMessage: setShownMessage,
      onThoughtMessage: setThoughtMessage,
      onProcessingChange: setChatProcessing,
      onSpeakingChange: setChatSpeaking,
    };
    this.addObserver(legacyObserver);
    if (options?.observer) this.addObserver(options.observer);
    // Initialize background speech pipeline
    this.speechPipeline = new SpeechPipeline(this);
    this.speechPipeline.start();
    this.streamController = new StreamController(this);
    this.updateAwake();
    this.initialized = true;
    if (options?.enableSSE !== false) this.initSSE();
  }

  /**
   * New initialization path for observer-driven UI. Avoids needing to pass legacy
   * setter callbacks – instead caller provides a single observer (or array via
   * successive addObserver calls). Backwards compatible: leaves legacy public
   * initialize untouched so existing code / tests remain valid.
   */
  public initializeWithObserver(
    amicaLife: AmicaLife,
    viewer: Viewer,
    alert: Alert,
    observer?: ChatObserver,
    options?: { enableSSE?: boolean },
  ) {
    if (this.initialized) return; // idempotent safeguard
    const noop = () => {};
    // Reuse original initialize supplying no-op legacy setters so internal logic works.
    const initOpts: { enableSSE?: boolean; observer?: ChatObserver } = {};
    if (typeof options?.enableSSE === "boolean")
      initOpts.enableSSE = options.enableSSE;
    if (observer) initOpts.observer = observer;
    this.initialize(
      amicaLife,
      viewer,
      alert,
      noop,
      noop,
      noop,
      noop,
      noop,
      noop,
      noop,
      initOpts,
    );
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
    const { rvc } = await import("@/features/rvc/rvc");
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

  // Backwards compatibility no-ops (previous public methods referenced in older code)
  public async processTtsJobs() {
    /* moved to SpeechPipeline */
  }
  public async processSpeakJobs() {
    /* moved to SpeechPipeline */
  }

  // Observer management
  public addObserver(obs: ChatObserver) {
    this.observers.push(obs);
  }
  public removeObserver(obs: ChatObserver) {
    this.observers = this.observers.filter((o) => o !== obs);
  }
  private notify(fn: (o: ChatObserver) => void) {
    for (const o of this.observers) fn(o);
  }

  private appendAssistantBuffered(text: string, flushNow = false) {
    if (!text) return;
    this.assistantBuffer += text;
    // Notify delta immediately for streaming UI / metrics
    this.notify((o) => o.onAssistantDelta?.(text));
    if (flushNow) {
      this.flushAssistantBuffer();
      return;
    }
    if (this.assistantFlushScheduled) return;
    this.assistantFlushScheduled = true;
    requestAnimationFrame(() => this.flushAssistantBuffer());
  }

  // Public bridge for SpeechPipeline to avoid exposing private method
  public appendAssistantBufferedPublic(text: string, flushNow = false) {
    this.appendAssistantBuffered(text, flushNow);
  }

  private flushAssistantBuffer() {
    if (this.assistantBuffer === "") {
      this.assistantFlushScheduled = false;
      return;
    }
    this.currentAssistantMessage += this.assistantBuffer;
    this.assistantBuffer = "";
    this.assistantFlushScheduled = false;
    // Ordering contract: delta(s) already emitted. Now flush -> chat log -> shown message.
    this.setAssistantMessage!(this.currentAssistantMessage); // emits onAssistantMessage
    this.notify((o) => o.onAssistantFlush?.(this.currentAssistantMessage)); // flush aggregate
    this.setChatLog!([
      ...this.messageList,
      { role: "assistant", content: this.currentAssistantMessage },
    ]); // log reflects full assistant message
    this.setShownMessage!("assistant"); // UI focus swap
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
    this.notify((o) => o.onInterrupt?.());
    this.streamController?.abortActive();
    this.ttsJobs.clear();
    this.speakJobs.clear();
    this.assistantBuffer = "";
    try {
      this.viewer?.model?.stopSpeaking?.();
    } catch {
      /* ignore stopSpeaking errors */
    }
  }

  public async receiveMessageFromUser(message: string, amicaLife: boolean) {
    perfMark("chat:user:send:start");
    if (!message) return;
    logger.time("performance_interrupting");
    await this.interrupt();
    logger.timeEnd("performance_interrupting");
    await wait(0);
    if (!amicaLife) {
      const { handleUserInput } = await import("../externalAPI/externalAPI");
      await handleUserInput(message);
      this.amicaLife?.receiveMessageFromUser?.(message);
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
        const msg: { type?: string; data?: unknown } = JSON.parse(event.data);
        const { type, data } = msg;
        switch (type) {
          case "normal": {
            if (typeof data !== "string") break;
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
            if (typeof data !== "string") break;
            const { loadVRMAnimation } = await import(
              "@/lib/VRMAnimation/loadVRMAnimation"
            );
            const animation = await loadVRMAnimation(`/animations/${data}`);
            if (!animation) throw new Error("Loading animation failed");
            (
              this.viewer?.model as unknown as {
                playAnimation?: (
                  a: unknown,
                  n: string,
                ) => Promise<number> | void;
              }
            )?.playAnimation?.(animation, data);
            requestAnimationFrame(() => this.viewer?.resetCameraLerp?.());
            break;
          }
          case "playback": {
            const delay = typeof data === "number" ? data : 0;
            this.viewer?.startRecording?.();
            setTimeout(() => {
              this.viewer?.stopRecording?.((videoBlob) => {
                if (!videoBlob) return;
                const url = URL.createObjectURL(videoBlob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "recording.webm";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              });
            }, delay);
            break;
          }
          case "systemPrompt": {
            if (typeof data === "string") updateConfig("system_prompt", data);
            break;
          }
          default:
            logger.warn("Unknown message type", type);
        }
      } catch (e) {
        logger.error("Error parsing SSE message", e);
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.alert?.error("Failed to get chat response", msg);
      logger.error("Failed to get chat response", msg);
      return msg;
    }
    if (!stream) {
      const msg = "Null stream";
      this.alert?.error("Null stream", msg);
      logger.warn("Null chat stream");
      return msg;
    }
    return await this.handleChatResponseStream(stream);
  }

  public async handleChatResponseStream(stream: ReadableStream<Uint8Array>) {
    return this.streamController!.run(stream);
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
    const backend = snapshot.tts_backend || "none";
    const handler = await getOrLoadTTSBackend(backend);
    if (!handler) {
      logger.warn("Unknown tts backend", backend);
      return null;
    }
    perfMark(`tts:${backend}:start`);
    try {
      return await handler(talk, {
        rvcTransform: (a) => this.handleRvc(a),
        snapshot,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error("TTS handler failed", msg);
      this.alert?.error("Failed to get TTS response", msg);
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
          ...this.messageList,
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
        logger.warn("vision_backend not supported", visionBackend);
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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.alert?.error("Failed to get vision response", msg);
      logger.error("Failed to get vision response", msg);
    }
  }

  // Internal + used by StreamController (exposed via indirection for type-safety)
  private transition(next: ChatState) {
    if (this.state === next) return;
    const prev = this.state;
    this.state = next;
    this.notify((o) => o.onStateChange?.(next, prev));
    if (next === ChatState.Processing) this.setChatProcessing!(true);
    if (next === ChatState.Idle) this.setChatProcessing!(false);
  }

  // Bridge for StreamController (string input to avoid enum import cycle there)
  public transitionPublic(next: string) {
    switch (next) {
      case "processing":
        this.transition(ChatState.Processing);
        break;
      case "idle":
        this.transition(ChatState.Idle);
        break;
      case "speaking":
        this.transition(ChatState.Speaking);
        break;
    }
  }
}
