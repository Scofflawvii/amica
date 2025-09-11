import { Chat } from "../chat";
jest.mock("../registries", () => ({
  getOrLoadTTSBackend: async () => async () => null,
  snapshotConfig: () => ({ tts_muted: "true" }),
  getOrLoadLLMBackend: async () => async () =>
    new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode("mock"));
        c.close();
      },
    }),
}));

describe("ChatObserver", () => {
  it("notifies observer for processing and assistant message changes", async () => {
    const events: Record<string, any[]> = {};
    const push = (k: string, v: any) => {
      (events[k] ||= []).push(v);
    };

    const observer = {
      onProcessingChange: (p: boolean) => push("processing", p),
      onAssistantMessage: (m: string) => push("assistant", m),
    };

    // Provide minimal required options; relying on underlying mocks/spies.
    const chat = new Chat();
    // inject observer directly (private method cast)
    (chat as unknown as { addObserver: (o: unknown) => void }).addObserver(
      observer,
    );
    (
      chat as unknown as { notify: (fn: (o: typeof observer) => void) => void }
    ).notify((o) => o.onProcessingChange?.(true));
    (
      chat as unknown as { notify: (fn: (o: typeof observer) => void) => void }
    ).notify((o) => o.onAssistantMessage?.("hello"));

    expect(events.processing).toContain(true);
    expect(events.assistant).toContain("hello");
  });
});
