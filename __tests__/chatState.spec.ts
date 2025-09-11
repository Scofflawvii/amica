import { describe, test, expect } from "@jest/globals";
if (typeof (global as any).ReadableStream === "undefined") {
  (global as any).ReadableStream = class {
    private chunks: any[] = [];
    constructor(opts: any) {
      opts.start({ enqueue: (c: any) => this.chunks.push(c), close: () => {} });
    }
    getReader() {
      let i = 0;
      const enc = new TextEncoder();
      const data = this.chunks;
      return {
        read: async () =>
          i < data.length
            ? { value: enc.encode(data[i++]), done: false }
            : { value: undefined, done: true },
      };
    }
  } as any;
}
if (typeof (global as any).TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  (global as any).TextEncoder = TextEncoder;
  (global as any).TextDecoder = TextDecoder;
}

// A distilled Chat-like state machine unit for isolated testing
enum ChatState {
  Idle = "idle",
  Processing = "processing",
  Speaking = "speaking",
}
class MiniChat {
  private state: ChatState = ChatState.Idle;
  getState() {
    return this.state;
  }
  async handle(stream: ReadableStream<any>) {
    this.state = ChatState.Processing;
    const r = stream.getReader();
    while (!(await r.read()).done) {
      /* consume */
    }
    this.state = ChatState.Idle;
  }
}

function makeStream(text: string) {
  return new ReadableStream({
    start(c) {
      text.split(" ").forEach((w) => c.enqueue(w + " "));
      c.close();
    },
  });
}

describe("MiniChat state transitions", () => {
  test("processing -> idle after stream completes", async () => {
    const chat = new MiniChat();
    const p = chat.handle(makeStream("hello world"));
    expect(chat.getState()).toBe("processing");
    await p;
    expect(chat.getState()).toBe("idle");
  });
});
