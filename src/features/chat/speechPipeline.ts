import { perfMark } from "@/utils/perf";
import { logger } from "@/utils/logger";
import { Screenplay, Talk } from "./messages";
import { ChatState } from "./chat";

// Minimal Chat-like surface we depend on (structural typing)
export interface ChatSpeechHost {
  currentStreamIdx: number;
  ttsJobs: { dequeue(): Promise<any>; enqueue(v: any): void; clear(): void };
  speakJobs: { dequeue(): Promise<any>; enqueue(v: any): void; clear(): void };
  fetchAudio(talk: Talk): Promise<ArrayBuffer | null>;
  appendAssistantBuffered(text: string, flushNow?: boolean): any;
  viewer?: {
    model?: { speak?: (a: ArrayBuffer, s: Screenplay) => Promise<void> };
  };
  setChatSpeaking?: (b: boolean) => void;
  isAwake(): boolean;
  updateAwake(): void;
  transitionPublic(next: string): void;
  getState(): ChatState | string;
}

// All state transitions flow through Chat.transitionPublic for consistency.

/**
 * Handles the background loops that transform screenplay -> audio (TTS) -> speak.
 * Extracted from Chat to simplify future unit testing & further decomposition.
 */
export class SpeechPipeline {
  private host: ChatSpeechHost;
  private ttsLoopStarted = false;
  private speakLoopStarted = false;
  constructor(host: ChatSpeechHost) {
    this.host = host;
  }

  start() {
    this.processTtsJobs();
    this.processSpeakJobs();
  }

  // Former Chat.processTtsJobs
  private processTtsJobs() {
    if (this.ttsLoopStarted) return;
    this.ttsLoopStarted = true;
    (async () => {
      for (;;) {
        const job = await this.host.ttsJobs.dequeue().catch(() => undefined);
        if (!job) continue;
        if (job.streamIdx !== this.host.currentStreamIdx) continue; // stale
        try {
          const audioBuffer = await this.host.fetchAudio(job.screenplay.talk);
          this.host.speakJobs.enqueue({
            audioBuffer,
            screenplay: job.screenplay,
            streamIdx: job.streamIdx,
          });
        } catch (e) {
          logger.error("TTS job failure", e);
        }
      }
    })();
  }

  // Former Chat.processSpeakJobs
  private processSpeakJobs() {
    if (this.speakLoopStarted) return;
    this.speakLoopStarted = true;
    (async () => {
      for (;;) {
        const speak = await this.host.speakJobs
          .dequeue()
          .catch(() => undefined);
        if (!speak) continue;
        if (speak.streamIdx !== this.host.currentStreamIdx) continue; // stale

        const lt = (window as any).chatvrm_latency_tracker;
        if (lt?.active) {
          const ms = Date.now() - lt.start;
          logger.debug("performance_latency", { ms });
          lt.active = false;
        }

        this.host.appendAssistantBuffered(speak.screenplay.text, true);

        if (speak.audioBuffer) {
          perfMark("tts:play:start");
          this.host.transitionPublic("speaking");
          try {
            this.host.setChatSpeaking?.(true);
            await this.host.viewer?.model?.speak?.(
              speak.audioBuffer,
              speak.screenplay,
            );
          } catch (e) {
            logger.error("speak error", e);
          } finally {
            this.host.setChatSpeaking?.(false);
            this.host.transitionPublic("idle");
            perfMark("tts:play:done");
            if (this.host.isAwake()) this.host.updateAwake();
          }
        }
      }
    })();
  }
}
