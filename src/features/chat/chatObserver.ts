export interface ChatObserver {
  onChatLog?(log: any[]): void;
  onUserMessage?(message: string): void;
  onAssistantMessage?(message: string): void;
  onShownMessage?(role: string): void;
  onProcessingChange?(processing: boolean): void;
  onSpeakingChange?(speaking: boolean): void;
  onThoughtMessage?(thought: string): void;
  // Extended coverage
  onStateChange?(next: string, prev: string): void;
  onAssistantDelta?(delta: string): void; // partial assistant chunk
  onAssistantFlush?(full: string): void; // after buffered flush
  onSessionStart?(streamIdx: number): void;
  onSessionEnd?(streamIdx: number, reason: "completed" | "aborted"): void;
  onInterrupt?(): void;
}
