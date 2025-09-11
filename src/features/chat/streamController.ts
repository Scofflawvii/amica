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
    if (this.activeSession) this.activeSession.abort();
  }

  async run(stream: ReadableStream<Uint8Array>) {
    this.chat.currentStreamIdx++;
    const idx = this.chat.currentStreamIdx;
    // enter processing state
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
    // If still flagged as processing (not speaking) transition idle
    if (this.chat.getState() === "processing")
      this.chat.transitionPublic("idle");
    return result;
  }
}
