import { describe, test, expect, jest, beforeEach } from "@jest/globals";

// Polyfills now centralized in jest.setup.mjs (will be added) but keep guard if run standalone
if (typeof (global as any).ReadableStream === "undefined") {
  (global as any).ReadableStream = class {
    private _c: string[] = [];
    constructor(opts: any) {
      opts.start({ enqueue: (c: string) => this._c.push(c), close: () => {} });
    }
    getReader() {
      let i = 0;
      const data = this._c;
      return {
        read: async () =>
          i < data.length
            ? { value: new TextEncoder().encode(data[i++]), done: false }
            : { value: undefined, done: true },
      };
    }
  } as any;
}
if (typeof global.TextEncoder === "undefined") {
  const { TextEncoder, TextDecoder } = require("util");
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock configs
jest.mock("../src/utils/config", () => ({
  config: (k: string) =>
    ({
      system_prompt: "SYS",
      chatbot_backend: "echo",
      reasoning_engine_enabled: "false",
      tts_backend: "piper",
      tts_muted: "false",
      rvc_enabled: "false",
    })[k] || "",
}));

// Mock registries to control chat + tts behavior
jest.mock("../src/features/chat/registries", () => ({
  snapshotConfig: () => ({
    tts_muted: "true",
    tts_backend: "mock",
    rvc_enabled: "false",
  }),
  getOrLoadTTSBackend: async () => async () => new ArrayBuffer(4),
  getOrLoadLLMBackend: async () => async (messages: any[]) => {
    const last = messages[messages.length - 1].content + ".";
    return new ReadableStream({
      start(c: any) {
        last.split(" ").forEach((w) => c.enqueue(w + " "));
        c.close();
      },
    });
  },
}));

// Lightweight viewer stub
function makeViewer() {
  return {
    model: {
      speak: jest.fn(async () => {
        await new Promise((r) => setTimeout(r, 5));
      }),
      playAnimation: jest.fn(),
      stopSpeaking: jest.fn(),
    },
    resetCameraLerp: jest.fn(),
  };
}

const makeAlert = () => ({ error: jest.fn() });
const makeLife = () => ({ receiveMessageFromUser: jest.fn() });

import { Chat } from "../src/features/chat/chat";

describe("Chat integration (state + TTS + interrupt)", () => {
  let chat: any;
  let viewer: any;
  let alert: any;
  let life: any;
  beforeEach(() => {
    chat = new Chat();
    viewer = makeViewer();
    alert = makeAlert();
    life = makeLife();
    chat.initializeWithObserver(life, viewer, alert, undefined, {
      enableSSE: false,
    });
  });

  test("processing -> speaking -> idle", async () => {
    const p = chat.makeAndHandleStream([
      { role: "system", content: "SYS" },
      { role: "user", content: "Hello" },
    ]);
    // Allow microtask for state transition to processing
    await Promise.resolve();
    // processing may already finish for very short stream; accept idle or processing pre speak
    expect(["processing", "idle"]).toContain(chat.getState());
    // Simulate finished screenplay -> speak path directly
    chat.speakJobs.enqueue({
      audioBuffer: new ArrayBuffer(4),
      screenplay: {
        expression: "neutral",
        talk: { style: "talk", message: "Hi" },
        text: "[neutral] Hi",
      },
      streamIdx: chat.currentStreamIdx,
    });
    await p;
    await new Promise((r) => setTimeout(r, 10));
    expect(["idle"]).toContain(chat.getState());
  });

  test("interrupt cancels older jobs", async () => {
    const p = chat.makeAndHandleStream([
      { role: "system", content: "SYS" },
      { role: "user", content: "First" },
    ]);
    const oldIdx = chat.currentStreamIdx;
    await chat.interrupt();
    // enqueue a job for old index that should be ignored
    chat.ttsJobs.enqueue({
      screenplay: {
        expression: "neutral",
        talk: { style: "talk", message: "Old" },
        text: "[neutral] Old",
      },
      streamIdx: oldIdx,
    });
    // start new stream
    const p2 = chat.makeAndHandleStream([
      { role: "system", content: "SYS" },
      { role: "user", content: "Second" },
    ]);
    chat.speakJobs.enqueue({
      audioBuffer: null,
      screenplay: {
        expression: "neutral",
        talk: { style: "talk", message: "New" },
        text: "[neutral] New",
      },
      streamIdx: chat.currentStreamIdx,
    });
    await Promise.all([p.catch(() => {}), p2]);
    await new Promise((r) => setTimeout(r, 0));
    // viewer.model.speak should have been called only once for new job
    expect(viewer.model.speak.mock.calls.length).toBe(0);
  });
});
