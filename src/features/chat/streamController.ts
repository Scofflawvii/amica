import { ChatStreamSession } from "./chatSession";
import { Chat } from "./chat"; // Type only
import { TTSJob } from "./speechPipeline";
import { Screenplay } from "./messages";

/**
 * Orchestrates a single streaming chat session lifecycle, isolating Chat from
 * ChatStreamSession creation and post-processing state transitions.
 */
interface ChatNotifier {
  notify(fn: (o: any) => void): void; // existing observer notification signature
}

type EnqueueTTS = { enqueue(v: TTSJob): void };

interface ChatLike extends ChatNotifier {
  currentStreamIdx: number;
  ttsJobs: EnqueueTTS;
  thoughtBubbleMessage(thinking: boolean, text: string): void;
  bubbleMessage(role: string, msg: string): void;
  transitionPublic(next: string): void;
  getState(): string;
}

export class StreamController {
  private chat: ChatLike;
  private activeSession?: ChatStreamSession;

  constructor(chat: Chat) {
    this.chat = chat as unknown as ChatLike;
  }

  abortActive() {
    if (this.activeSession) {
      const idx = this.activeSession.streamIdx;
      this.activeSession.abort();
      this.chat.notify?.((o: any) => o.onSessionEnd?.(idx, "aborted"));
    }
  }

  async run(stream: ReadableStream<Uint8Array>) {
    this.chat.currentStreamIdx++;
    const idx = this.chat.currentStreamIdx;
    this.chat.notify?.((o: any) => o.onSessionStart?.(idx));
    this.chat.transitionPublic("processing");
    this.activeSession = new ChatStreamSession(idx, stream, {
      enqueueScreenplay: (sc) =>
        this.chat.ttsJobs.enqueue({ screenplay: sc, streamIdx: idx }),
      thought: (thinking, text) =>
        this.chat.thoughtBubbleMessage(thinking, text),
      appendError: (msg) => this.chat.bubbleMessage("assistant", msg),
      isCurrent: (i) => i === this.chat.currentStreamIdx,
      setProcessingState: (flag) =>
        this.chat.transitionPublic(flag ? "processing" : "idle"),
    });
    const result = await this.activeSession.process();
    if (this.chat.getState() === "processing")
      this.chat.transitionPublic("idle");
    this.chat.notify?.((o: any) => o.onSessionEnd?.(idx, "completed"));
    return result;
  }
}
