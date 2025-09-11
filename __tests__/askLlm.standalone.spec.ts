import { describe, expect, test, jest } from "@jest/globals";
import { askLLM } from "../src/utils/askLlm";

// Mock config to force echo backend for determinism
jest.mock("../src/utils/config", () => ({
  config: (k: string) => {
    if (k === "chatbot_backend") return "echo";
    return "SYS";
  },
}));

// Mock echo stream to emit predictable content
jest.mock("../src/features/chat/echoChat", () => ({
  getEchoChatResponseStream: async (messages: any[]) =>
    new ReadableStream({
      start(c) {
        const payload = messages.map((m) => m.content).join("|");
        c.enqueue(new TextEncoder().encode(payload));
        c.close();
      },
    }),
}));

describe("askLLM standalone (no Chat instance)", () => {
  test("returns non-empty string result", async () => {
    const res = await askLLM("SYSTEM_PROMPT", "User says hi", null);
    expect(typeof res).toBe("string");
    expect(res.length).toBeGreaterThan(0);
  });
});
