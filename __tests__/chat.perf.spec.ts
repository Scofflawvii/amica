import { describe, test, expect, jest, beforeEach } from "@jest/globals";

jest.mock("../src/utils/config", () => ({
  config: (k: string) =>
    (
      ({
        system_prompt: "SYS",
        chatbot_backend: "echo",
        reasoning_engine_enabled: "false",
      }) as any
    )[k] || "",
}));

// Mock registries so LLM returns small stream and TTS backend is silent
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
      start(c) {
        last.split(" ").forEach((w) => c.enqueue(w + " "));
        c.close();
      },
    });
  },
}));

import { Chat } from "../src/features/chat/chat";

describe("Chat perf marks", () => {
  let chat: Chat;
  const target = [
    "chat:stream:start",
    "chat:stream:firstToken",
    "chat:stream:firstSentence",
    "chat:stream:done",
  ];
  let beforeCounts: Record<string, number> = {};
  beforeEach(() => {
    chat = new Chat();
    chat.initialize(
      {} as any,
      { model: {} } as any,
      { error: () => {} } as any,
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      { enableSSE: false },
    );
    if (typeof performance.getEntriesByName === "function") {
      beforeCounts = Object.fromEntries(
        target.map((n) => [n, (performance as any).getEntriesByName(n).length]),
      );
    } else {
      beforeCounts = {} as any;
    }
  });

  test("emits stream lifecycle marks", async () => {
    await chat.makeAndHandleStream([
      { role: "system", content: "SYS" },
      { role: "user", content: "Hello perf" },
    ]);
    if (typeof performance.getEntriesByName !== "function") {
      console.warn(
        "performance.getEntriesByName not available; perf test skipped",
      );
      return;
    }
    const missing: string[] = [];
    target.forEach((n) => {
      const before = beforeCounts[n] ?? 0;
      if ((performance as any).getEntriesByName(n).length <= before)
        missing.push(n);
    });
    expect(missing).toEqual([]);
  });
});
