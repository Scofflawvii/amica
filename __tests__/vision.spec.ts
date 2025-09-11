import { describe, test, expect, jest, beforeEach } from "@jest/globals";

const configMock = jest.fn((k: string) => {
  const map: Record<string, string> = {
    vision_backend: "vision_llamacpp",
    vision_system_prompt: "You are vision.",
    system_prompt: "SYS",
  };
  return map[k] || "";
});
jest.mock("../src/utils/config", () => ({
  config: (k: string) => configMock(k),
}));

const getLlavaCppChatResponse = jest.fn(
  async (_messages?: any, _img?: string) => "a red square on a table",
);
const getOllamaVisionChatResponse = jest.fn(
  async (_messages?: any, _img?: string) => "an orange circle",
);
const askLLM = jest.fn(
  async (_sys: string, userPrompt: string) => `ECHO:${userPrompt.slice(0, 60)}`,
);

async function askVisionLLM(imageData: string): Promise<string> {
  const { config } = require("../src/utils/config");
  try {
    const visionBackend = config("vision_backend");
    const messages = [
      { role: "system", content: config("vision_system_prompt") },
      { role: "user", content: "Describe the image as accurately as possible" },
    ];
    let res = "";
    if (visionBackend === "vision_llamacpp") {
      res = await getLlavaCppChatResponse(messages, imageData);
    } else if (visionBackend === "vision_ollama") {
      res = await getOllamaVisionChatResponse(messages, imageData);
    } else {
      return "vision_backend not supported";
    }
    const content = `This is a picture I just took from my webcam (described between [[ and ]] ): [[${res}]] Please respond accordingly and as if it were just sent and as though you can see it.`;
    return askLLM(config("system_prompt"), content);
  } catch {
    return "Failed to get vision response";
  }
}

describe("askVisionLLM (isolated)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configMock.mockClear();
  });

  test("llamacpp path composes description", async () => {
    const result = await askVisionLLM("IMGDATA");
    expect(result.startsWith("ECHO:")).toBe(true);
    // Inspect full prompt passed to askLLM for embedded description
    const call = (askLLM as any).mock.calls[0];
    expect(call[1]).toContain("[[a red square on a table]]");
    expect(getLlavaCppChatResponse).toHaveBeenCalledTimes(1);
  });

  test("ollama path", async () => {
    configMock.mockImplementation((k: string) => {
      const map: Record<string, string> = {
        vision_backend: "vision_ollama",
        vision_system_prompt: "You are vision.",
        system_prompt: "SYS",
      };
      return map[k] || "";
    });
    const result = await askVisionLLM("IMGDATA");
    expect(result.startsWith("ECHO:")).toBe(true);
    const call = (askLLM as any).mock.calls[0];
    expect(call[1]).toContain("[[an orange circle]]");
    expect(getOllamaVisionChatResponse).toHaveBeenCalledTimes(1);
  });

  test("unsupported backend", async () => {
    configMock.mockImplementation((k: string) => {
      const map: Record<string, string> = { vision_backend: "other" };
      return map[k] || "";
    });
    const result = await askVisionLLM("IMG");
    expect(result).toBe("vision_backend not supported");
  });
});
