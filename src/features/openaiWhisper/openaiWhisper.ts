import { config } from "@/utils/config";
import { logger } from "@/utils/logger";
const wlog = logger.with({ subsystem: "stt", module: "openaiWhisper" });

export async function openaiWhisper(file: File, prompt?: string) {
  const apiKey = config("openai_whisper_apikey");
  if (!apiKey) {
    throw new Error("Invalid OpenAI Whisper API Key");
  }

  // Request body
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", config("openai_whisper_model"));
  formData.append("language", "en");
  if (prompt) {
    formData.append("prompt", prompt);
  }

  wlog.debug("req", { hasPrompt: Boolean(prompt), fileSize: file.size });

  const res = await fetch(
    `${config("openai_whisper_url")}/v1/audio/transcriptions`,
    {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );
  if (!res.ok) {
    throw new Error(`OpenAI Whisper API Error (${res.status})`);
  }
  const data = await res.json();
  wlog.debug("res", { ok: res.ok, bytes: JSON.stringify(data).length });

  return { text: data.text.trim() };
}
