import { config } from "@/utils/config";
import { logger } from "@/utils/logger";

export async function openaiTTS(message: string) {
  const apiKey = config("openai_tts_apikey");
  if (!apiKey) {
    throw new Error("Invalid OpenAI TTS API Key");
  }

  try {
    const res = await fetch(`${config("openai_tts_url")}/v1/audio/speech`, {
      method: "POST",
      body: JSON.stringify({
        model: config("openai_tts_model"),
        input: message,
        voice: config("openai_tts_voice"),
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });
    if (!res.ok) {
      logger.error("openaiTTS: bad response", {
        status: res.status,
        statusText: res.statusText,
      });
      throw new Error("OpenAI TTS API Error");
    }
    const data = (await res.arrayBuffer()) as any;

    return { audio: data };
  } catch (e) {
    logger.error("openaiTTS: error", e);
    throw new Error("OpenAI TTS API Error");
  }
}
