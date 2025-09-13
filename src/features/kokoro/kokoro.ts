import { config } from "@/utils/config";
import { logger } from "@/utils/logger";

const tlog = logger.with({ subsystem: "tts", module: "kokoro" });

export async function kokoro(message: string) {
  try {
    const res = await fetch(`${config("kokoro_url")}/tts`, {
      method: "POST",
      body: JSON.stringify({
        text: message,
        voice: config("kokoro_voice"),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      tlog.error("kokoro tts non-ok response", { status: res.status });
      throw new Error("Kokoro TTS API Error");
    }
    const data: ArrayBuffer = await res.arrayBuffer();
    return { audio: data };
  } catch (e) {
    tlog.error("kokoro tts error", e);
    throw new Error("Kokoro TTS API Error");
  }
}

export async function kokoroVoiceList() {
  try {
    const response = await fetch(`${config("kokoro_url")}/voices`, {
      method: "GET",
      headers: {
        Accept: "application/text",
      },
    });

    return response.json();
  } catch (error) {
    tlog.error("Error fetching kokoro voice", error);
    throw error;
  }
}
