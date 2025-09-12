import type { Message, Role } from "./messages";

// Keep in sync with ChatState enum values in chat.ts (duplicated here intentionally to avoid circular import)
export type ChatStateString = "idle" | "processing" | "speaking" | "thinking";

export interface ChatObserver {
  /** Full chat log update */
  onChatLog?(log: Message[]): void;
  /** User composed / submitted message (canonical text) */
  onUserMessage?(message: string): void;
  /** Assistant accumulated (streaming) or final message */
  onAssistantMessage?(message: string): void;
  /** Which role's message is currently surfaced in primary UI */
  onShownMessage?(role: Role): void;
  /** Processing state (LLM + ancillary work) */
  onProcessingChange?(processing: boolean): void;
  /** Speaking (audio synthesis / playback) state */
  onSpeakingChange?(speaking: boolean): void;
  /** Internal chain-of-thought / reasoning string (if surfaced) */
  onThoughtMessage?(thought: string): void;
  // Extended coverage
  onStateChange?(next: ChatStateString, prev: ChatStateString): void;
  /** Partial assistant streaming delta */
  onAssistantDelta?(delta: string): void; // partial assistant chunk
  /** Assistant message flushed after buffering */
  onAssistantFlush?(full: string): void; // after buffered flush
  /** New streaming session started */
  onSessionStart?(streamIdx: number): void;
  /** Streaming session ended */
  onSessionEnd?(streamIdx: number, reason: "completed" | "aborted"): void;
  /** External interruption (user stop, navigation, etc.) */
  onInterrupt?(): void;
}
