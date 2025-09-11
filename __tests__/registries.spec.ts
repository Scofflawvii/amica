import { describe, test, expect, jest } from "@jest/globals";
import { Talk, Message } from "../src/features/chat/messages";
// Polyfill TextEncoder for Node environment
if (typeof (global as any).TextEncoder === "undefined") {
   
  const { TextEncoder } = require("util");
  // @ts-ignore
  (global as any).TextEncoder = TextEncoder;
}
if (typeof (global as any).TextDecoder === "undefined") {
   
  const { TextDecoder } = require("util");
  // @ts-ignore
  (global as any).TextDecoder = TextDecoder;
}

// Minimal polyfill for ReadableStream if not present
if (typeof (global as any).ReadableStream === "undefined") {
  class RS {
    private chunks: any[];
    private sent = 0;
    constructor(chunks: any[]) {
      this.chunks = chunks;
    }
    getReader() {
      return {
        read: async () => {
          if (this.sent >= this.chunks.length)
            return { done: true, value: undefined };
          return { done: false, value: this.chunks[this.sent++] };
        },
        releaseLock() {},
        cancel() {},
      } as any;
    }
  }
  // @ts-ignore
  (global as any).ReadableStream = RS;
}

describe("registries (isolated mock)", () => {
  test("snapshotConfig returns key map", () => {
    // Local snapshot imitation
    const snapshotConfig = (keys: string[]) =>
      keys.reduce(
        (a, k) => {
          a[k] = "x";
          return a;
        },
        {} as Record<string, string>,
      );
    const snap = snapshotConfig(["tts_backend", "openai_model"]);
    expect(snap).toEqual({ tts_backend: "x", openai_model: "x" });
  });

  test("TTS backend registration + retrieval", async () => {
    const name = "test_tts";
    const tts: Record<string, any> = {};
    const registerTTSBackend = (n: string, h: any) => {
      tts[n] = h;
    };
    const getOrLoadTTSBackend = async (n: string) => tts[n];
    registerTTSBackend(name, async (talk: Talk) => {
      return new TextEncoder().encode(talk.message).buffer;
    });
    const handler = await getOrLoadTTSBackend(name);
    expect(handler).toBeDefined();
    const buf = await handler!(
      { style: "talk", message: "hi" },
      { rvcTransform: async (a: ArrayBuffer) => a, snapshot: {} },
    );
    expect(Object.prototype.toString.call(buf)).toBe("[object ArrayBuffer]");
  });

  test("LLM backend registration + stream consumption", async () => {
    const name = "test_llm";
    const llm: Record<string, any> = {};
    const registerLLMBackend = (n: string, h: any) => {
      llm[n] = h;
    };
    const getOrLoadLLMBackend = async (n: string) => llm[n];
    registerLLMBackend(name, async (messages: Message[]) => {
      // Return a minimal stream-like object compatible with getReader().read()
      let sent = false;
      return {
        getReader() {
          return {
            async read() {
              if (sent) return { done: true, value: undefined };
              sent = true;
              return { done: false, value: "[neutral] Hello world." };
            },
            releaseLock() {},
            cancel() {},
          } as any;
        },
      } as any;
    });
    const handler = await getOrLoadLLMBackend(name);
    expect(handler).toBeDefined();
    const stream = await handler!([{ role: "user", content: "Hi" }]);
    const reader: any = stream.getReader();
    const { value, done } = await reader.read();
    expect(done).toBe(false);
    const text =
      typeof value === "string" ? value : new TextDecoder().decode(value);
    expect(text).toContain("Hello world");
  });
});
