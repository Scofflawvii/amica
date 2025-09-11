import { Chat } from "../chat";

// Mock TTS registry to prevent actual backend loading
jest.mock("../registries", () => ({
  getOrLoadTTSBackend: async () => async () => null,
  snapshotConfig: () => ({ tts_muted: "true" }),
  getOrLoadLLMBackend: async () => async (_messages: unknown[]) =>
    new ReadableStream({
      start(c) {
        c.enqueue(new TextEncoder().encode("mock reply"));
        c.close();
      },
    }),
}));

const makeStream = (parts: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      for (const p of parts) controller.enqueue(new TextEncoder().encode(p));
      controller.close();
    },
  });

const initChat = (observer?: Record<string, unknown>) => {
  const chat = new Chat();
  chat.initialize(
    {} as any, // amicaLife
    {} as any, // viewer
    { error: () => {} }, // alert
    () => {},
    () => {},
    () => {},
    () => {},
    () => {},
    () => {},
    () => {},
    { enableSSE: false, observer },
  );
  return chat;
};

describe("ChatObserver extended", () => {
  beforeAll(() => {
    // synchronous flush for buffered assistant text
    // Force sync flush for buffering during tests
     
    (global as any).requestAnimationFrame = (cb: () => void) => {
      cb();
      return 0;
    };
  });

  it("emits session start/end and state changes", async () => {
    const events: Array<[string, string?, string?]> = [];
    const observer = {
      onSessionStart: (i: number) => events.push(["start", String(i)]),
      onSessionEnd: (i: number, r: string) =>
        events.push(["end", String(i), r]),
      onStateChange: (n: string, p: string) => events.push(["state", p, n]),
    };
    const chat = initChat(observer);
    const stream = makeStream(["hello world"]);
    await chat.handleChatResponseStream(stream);
    // Expect at least one start, one end (completed) and state transitions processing->idle
    expect(events.find((e) => e[0] === "start")).toBeTruthy();
    expect(
      events.find((e) => e[0] === "end" && e[2] === "completed"),
    ).toBeTruthy();
    expect(
      events.find(
        (e) => e[0] === "state" && e[1] === "idle" && e[2] === "processing",
      ),
    ).toBeTruthy();
    expect(
      events.find(
        (e) => e[0] === "state" && e[1] === "processing" && e[2] === "idle",
      ),
    ).toBeTruthy();
  });

  it("emits assistant delta and flush", () => {
    const deltas: string[] = [];
    const flushes: string[] = [];
    const observer = {
      onAssistantDelta: (d: string) => deltas.push(d),
      onAssistantFlush: (f: string) => flushes.push(f),
    };
    const chat = initChat(observer);
    chat.bubbleMessage("assistant", "Hello ");
    chat.bubbleMessage("assistant", "world");
    expect(deltas).toEqual(["Hello ", "world"]);
    expect(flushes[flushes.length - 1]).toBe("Hello world");
  });

  it("emits interrupt event and aborted session end", async () => {
    const events: Array<[string, string?, string?]> = [];
    const observer = {
      onSessionStart: (i: number) => events.push(["start", String(i)]),
      onSessionEnd: (i: number, r: string) =>
        events.push(["end", String(i), r]),
      onInterrupt: () => events.push(["interrupt"]),
    };
    const chat = initChat(observer);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("slow part 1"));
        // do not close yet to simulate longer session
      },
    });
    // Fire and forget (no await) then interrupt quickly
    chat.handleChatResponseStream(stream);
    await chat.interrupt();
    expect(events.find((e) => e[0] === "interrupt")).toBeTruthy();
    expect(
      events.find((e) => e[0] === "end" && e[2] === "aborted"),
    ).toBeTruthy();
  });
});
