import { describe, test, expect, jest, beforeEach } from "@jest/globals";

jest.mock("../src/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    time: jest.fn(),
    timeEnd: jest.fn(),
  },
}));

function buildChatWith(mocks: { snapshot: any; backend?: any }) {
  jest.resetModules();
  jest.doMock("../src/utils/logger", () => ({
    logger: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      time: jest.fn(),
      timeEnd: jest.fn(),
    },
  }));
  jest.doMock("../src/utils/config", () => ({
    config: (k: string) => (({ system_prompt: "SYS" }) as any)[k] || "",
  }));
  jest.doMock("../src/features/chat/registries", () => ({
    snapshotConfig: () => mocks.snapshot,
    getOrLoadTTSBackend: async () => mocks.backend,
  }));
  const { Chat } = require("../src/features/chat/chat");
  return Chat as typeof import("../src/features/chat/chat").Chat;
}

describe("Chat.fetchAudio edge cases", () => {
  let alert: { error: jest.Mock };
  beforeEach(() => {
    alert = { error: jest.fn() as any };
  });

  test("returns null when muted and skips backend call", async () => {
    const backend = jest.fn(async () => new ArrayBuffer(2));
    const ChatCtor = buildChatWith({
      snapshot: {
        tts_muted: "true",
        tts_backend: "elevenlabs",
        rvc_enabled: "false",
      },
      backend,
    });
    const chat = new ChatCtor();
    chat.initialize(
      {} as any,
      { model: {} } as any,
      alert as any,
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      { enableSSE: false },
    );
    const res = await chat.fetchAudio({
      style: "talk",
      message: "Hello there",
    } as any);
    expect(res).toBeNull();
    expect(backend).not.toHaveBeenCalled();
  });

  test("unknown backend logs warning and returns null", async () => {
    const ChatCtor = buildChatWith({
      snapshot: {
        tts_muted: "false",
        tts_backend: "mystery",
        rvc_enabled: "false",
      },
      backend: undefined,
    });
    const { logger } = require("../src/utils/logger");
    const chat = new ChatCtor();
    chat.initialize(
      {} as any,
      { model: {} } as any,
      alert as any,
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      { enableSSE: false },
    );
    const res = await chat.fetchAudio({ style: "talk", message: "Hi" } as any);
    expect(res).toBeNull();
    expect(logger.warn).toHaveBeenCalled();
  });

  test("backend throws: alert + logger.error invoked", async () => {
    const failing = jest.fn(async () => {
      throw new Error("boom");
    });
    const ChatCtor = buildChatWith({
      snapshot: {
        tts_muted: "false",
        tts_backend: "thrower",
        rvc_enabled: "false",
      },
      backend: failing,
    });
    const { logger } = require("../src/utils/logger");
    const chat = new ChatCtor();
    chat.initialize(
      {} as any,
      { model: {} } as any,
      alert as any,
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      () => {},
      { enableSSE: false },
    );
    const res = await chat.fetchAudio({
      style: "talk",
      message: "Edge",
    } as any);
    expect(res).toBeNull();
    expect(alert.error).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalled();
  });
});
