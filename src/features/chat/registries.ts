import { Talk, Message } from "./messages";
import { config } from "@/utils/config";
import { perfMark } from "@/utils/perf";

export type TTSHandlerContext = {
  rvcTransform: (audio: ArrayBuffer) => Promise<ArrayBuffer>;
  snapshot: Record<string, string>;
};
export type TTSHandler = (
  talk: Talk,
  ctx: TTSHandlerContext,
) => Promise<ArrayBuffer | null>;

const ttsRegistry: Record<string, TTSHandler> = {};
const ttsDynamicFlags: Record<string, boolean> = {};

// LLM registry (stream-producing handlers)
export type LLMStreamHandler = (
  messages: Message[],
) => Promise<ReadableStream<Uint8Array>>;
const llmRegistry: Record<string, LLMStreamHandler> = {};
const llmDynamicFlags: Record<string, boolean> = {};

export function registerLLMBackend(
  name: string,
  handler: LLMStreamHandler,
  lazy = false,
) {
  llmRegistry[name] = handler;
  if (lazy) llmDynamicFlags[name] = true;
}
export function getLLMBackend(name: string) {
  return llmRegistry[name];
}

async function ensureLLMLoaded(name: string) {
  if (!llmDynamicFlags[name]) return;
  const label = `llm:load:${name}`;
  console.time?.(label);
  perfMark(`${label}:start`);
  try {
    // (Placeholder) dynamic loading example; currently all eager
    switch (name) {
      default:
        break;
    }
  } finally {
    delete llmDynamicFlags[name];
    perfMark(`${label}:done`);
    console.timeEnd?.(label);
  }
}

export async function getOrLoadLLMBackend(name: string) {
  await ensureLLMLoaded(name);
  return getLLMBackend(name);
}

export function registerTTSBackend(
  name: string,
  handler: TTSHandler,
  lazy = false,
) {
  ttsRegistry[name] = handler;
  if (lazy) ttsDynamicFlags[name] = true;
}
export function getTTSBackend(name: string) {
  return ttsRegistry[name];
}

export function snapshotConfig(keys: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of keys) out[k] = config(k);
  return out;
}

// Dynamic loader map for seldom-used backends
async function ensureTTSLoaded(name: string) {
  if (!ttsDynamicFlags[name]) return; // not lazy or already loaded
  const label = `tts:load:${name}`;
  console.time?.(label);
  perfMark(`${label}:start`);
  try {
    switch (name) {
      case "piper": {
        const { piper } = await import("@/features/piper/piper");
        registerTTSBackend("piper", async (talk, ctx) => {
          const voice = await piper(talk.message);
          return voice.audio && ctx.snapshot["rvc_enabled"] === "true"
            ? ctx.rvcTransform(voice.audio)
            : voice.audio;
        });
        break;
      }
      case "coquiLocal": {
        const { coquiLocal } = await import("@/features/coquiLocal/coquiLocal");
        registerTTSBackend("coquiLocal", async (talk) => {
          const voice = await coquiLocal(talk.message);
          return voice.audio;
        });
        break;
      }
      case "kokoro": {
        const { kokoro } = await import("../kokoro/kokoro");
        registerTTSBackend("kokoro", async (talk) => {
          const voice = await kokoro(talk.message);
          return voice.audio;
        });
        break;
      }
    }
  } finally {
    delete ttsDynamicFlags[name];
    perfMark(`${label}:done`);
    console.timeEnd?.(label);
  }
}

export async function getOrLoadTTSBackend(name: string) {
  await ensureTTSLoaded(name);
  return getTTSBackend(name);
}

// Eager lightweight backends
import { elevenlabs } from "@/features/elevenlabs/elevenlabs";
import { speecht5 } from "@/features/speecht5/speecht5";
import { openaiTTS } from "@/features/openaiTTS/openaiTTS";
import { localXTTSTTS } from "@/features/localXTTS/localXTTS";

// LLM backend imports & registration
import { getEchoChatResponseStream } from "./echoChat";
import { getArbiusChatResponseStream } from "./arbiusChat";
import { getOpenAiChatResponseStream } from "./openAiChat";
import { getLlamaCppChatResponseStream } from "./llamaCppChat";
import { getWindowAiChatResponseStream } from "./windowAiChat";
import { getOllamaChatResponseStream } from "./ollamaChat";
import { getKoboldAiChatResponseStream } from "./koboldAiChat";
import { getOpenRouterChatResponseStream } from "./openRouterChat";
import { getReasoingEngineChatResponseStream } from "./reasoiningEngineChat";

registerLLMBackend("echo", async (messages) =>
  getEchoChatResponseStream(messages),
);
registerLLMBackend("arbius_llm", async (messages) =>
  getArbiusChatResponseStream(messages),
);
registerLLMBackend("chatgpt", async (messages) =>
  getOpenAiChatResponseStream(messages),
);
registerLLMBackend("llamacpp", async (messages) =>
  getLlamaCppChatResponseStream(messages),
);
registerLLMBackend("windowai", async (messages) =>
  getWindowAiChatResponseStream(messages),
);
registerLLMBackend("ollama", async (messages) =>
  getOllamaChatResponseStream(messages),
);
registerLLMBackend("koboldai", async (messages) =>
  getKoboldAiChatResponseStream(messages),
);
registerLLMBackend("openrouter", async (messages) =>
  getOpenRouterChatResponseStream(messages),
);
// Reasoning engine wrapper (still optional via config flag)
registerLLMBackend("reasoning_engine", async (messages) => {
  const systemPrompt = messages.find((m) => m.role === "system")!;
  const conversationMessages = messages.filter((m) => m.role !== "system");
  return getReasoingEngineChatResponseStream(
    systemPrompt,
    conversationMessages,
  );
});

registerTTSBackend("none", async () => null);
registerTTSBackend("elevenlabs", async (talk, ctx) => {
  const voice = await elevenlabs(
    talk.message,
    ctx.snapshot["elevenlabs_voiceid"],
    talk.style,
  );
  return voice.audio && ctx.snapshot["rvc_enabled"] === "true"
    ? ctx.rvcTransform(voice.audio)
    : voice.audio;
});
registerTTSBackend("speecht5", async (talk, ctx) => {
  const voice = await speecht5(
    talk.message,
    ctx.snapshot["speecht5_speaker_embedding_url"],
  );
  return voice.audio && ctx.snapshot["rvc_enabled"] === "true"
    ? ctx.rvcTransform(voice.audio)
    : voice.audio;
});
registerTTSBackend("openai_tts", async (talk, ctx) => {
  const voice = await openaiTTS(talk.message);
  return voice.audio && ctx.snapshot["rvc_enabled"] === "true"
    ? ctx.rvcTransform(voice.audio)
    : voice.audio;
});
registerTTSBackend("localXTTS", async (talk, ctx) => {
  const voice = await localXTTSTTS(talk.message);
  return voice.audio && ctx.snapshot["rvc_enabled"] === "true"
    ? ctx.rvcTransform(voice.audio)
    : voice.audio;
});

// Mark heavy ones for lazy load
registerTTSBackend("piper", async () => null, true);
registerTTSBackend("coquiLocal", async () => null, true);
registerTTSBackend("kokoro", async () => null, true);
