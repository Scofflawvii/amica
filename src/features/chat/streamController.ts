import { ChatStreamSession } from "./chatSession";
import { Chat } from "./chat"; // Type only (circular at runtime avoided via usage after definition)

/**
 * Orchestrates a single streaming chat session lifecycle, isolating Chat from
 * ChatStreamSession creation and post-processing state transitions.
 */
export class StreamController {
  private chat: any; // use any to avoid circular compile issues
  private activeSession?: ChatStreamSession;

  constructor(chat: Chat) {
    this.chat = chat;
  }

  abortActive() {
    if (this.activeSession) {
      const idx = this.activeSession.streamIdx;
      this.activeSession.abort();
      (this.chat as any).notify?.((o: any) => o.onSessionEnd?.(idx, "aborted"));
    }
  }

  async run(stream: ReadableStream<Uint8Array>) {
    this.chat.currentStreamIdx++;
    const idx = this.chat.currentStreamIdx;
    (this.chat as any).notify?.((o: any) => o.onSessionStart?.(idx));
    this.chat.transitionPublic("processing");
    this.activeSession = new ChatStreamSession(idx, stream, {
      enqueueScreenplay: (sc) =>
        this.chat.ttsJobs.enqueue({ screenplay: sc, streamIdx: idx }),
      thought: (thinking, text) =>
        this.chat.thoughtBubbleMessage(thinking, text),
      setProcessing: (p) => this.chat.setChatProcessing?.(p),
      appendError: (msg) => this.chat.bubbleMessage("assistant", msg),
      isCurrent: (i) => i === this.chat.currentStreamIdx,
    });
    const result = await this.activeSession.process();
    if (this.chat.getState() === "processing")
      this.chat.transitionPublic("idle");
    (this.chat as any).notify?.((o: any) => o.onSessionEnd?.(idx, "completed"));
    return result;
  }
}
