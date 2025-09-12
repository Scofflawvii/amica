import { Screenplay } from "./messages";
import { processResponse } from "@/utils/processResponse";
import { perfMark } from "@/utils/perf";

export interface ChatSessionCallbacks {
  enqueueScreenplay(screenplay: Screenplay): void;
  thought(isThinking: boolean, text: string): void;
  setProcessingState(p: boolean): void;
  appendError(msg: string): void;
  isCurrent(streamIdx: number): boolean;
}

export class ChatStreamSession {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private sentences: string[] = [];
  private aiTextLog = "";
  private tag = "";
  private isThinking = false;
  private rolePlay = "";
  private receivedMessage = "";
  private firstToken = false;
  private firstSentence = false;
  private aborted = false;

  constructor(
    public streamIdx: number,
    stream: ReadableStream<Uint8Array>,
    private cb: ChatSessionCallbacks,
  ) {
    this.reader = stream.getReader();
  }

  abort() {
    this.aborted = true;
    try {
      this.reader.cancel();
    } catch (e) {
      /* reader cancel ignored */
    }
  }

  async process() {
    this.cb.setProcessingState(true);
    console.time("chat stream processing");
    console.time("performance_time_to_first_token");
    console.time("performance_time_to_first_sentence");
    try {
      while (!this.aborted) {
        if (!this.cb.isCurrent(this.streamIdx)) break;
        const { done, value } = await this.reader.read();
        if (!this.firstToken) {
          console.timeEnd("performance_time_to_first_token");
          this.firstToken = true;
          perfMark("chat:stream:firstToken");
        }
        if (done) break;
        this.receivedMessage += value;
        this.receivedMessage = this.receivedMessage.trimStart();
        const proc = processResponse({
          sentences: this.sentences,
          aiTextLog: this.aiTextLog,
          receivedMessage: this.receivedMessage,
          tag: this.tag,
          isThinking: this.isThinking,
          rolePlay: this.rolePlay,
          callback: (talks: Screenplay[]) => {
            if (!this.cb.isCurrent(this.streamIdx)) return true;
            if (talks.length === 0) return false; // nothing to process yet
            const first = talks[0];
            if (!first) return false; // defensive for TS noUncheckedIndexedAccess
            if (!this.isThinking) this.cb.enqueueScreenplay(first);
            this.cb.thought(this.isThinking, first.text);
            if (!this.firstSentence) {
              console.timeEnd("performance_time_to_first_sentence");
              this.firstSentence = true;
              perfMark("chat:stream:firstSentence");
            }
            return false;
          },
        });
        this.sentences = proc.sentences;
        this.aiTextLog = proc.aiTextLog;
        this.receivedMessage = proc.receivedMessage;
        this.tag = proc.tag;
        this.isThinking = proc.isThinking;
        this.rolePlay = proc.rolePlay;
        if (proc.shouldBreak) break;
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      this.cb.appendError(msg);
    } finally {
      if (!(this as any).reader?.closed)
        try {
          this.reader.releaseLock();
        } catch (e) {
          /* release lock ignored */
        }
      console.timeEnd("chat stream processing");
      if (this.cb.isCurrent(this.streamIdx)) this.cb.setProcessingState(false);
      perfMark("chat:stream:done");
    }
    return this.aiTextLog;
  }
}
