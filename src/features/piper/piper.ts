import { config } from "@/utils/config";
import { logger } from "@/utils/logger";
const tlog = logger.with({ subsystem: "tts", module: "piper" });

export async function piper(message: string): Promise<{ audio: ArrayBuffer }> {
  try {
    const url = new URL(config("piper_url"));
    url.searchParams.append("text", message);

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`piper HTTP ${res.status}: ${text}`);
    }

    const data = await res.arrayBuffer();
    return { audio: data };
  } catch (error) {
    tlog.error("Error in piper", error);
    throw error;
  }
}
