import { config } from "@/utils/config";
import { logger } from "@/utils/logger";
const wlog = logger.with({ subsystem: "stt", module: "whispercpp" });

export async function whispercpp(file: File, prompt?: string) {
  // Request body
  const formData = new FormData();
  formData.append("file", file);
  if (prompt) {
    formData.append("prompt", prompt);
  }

  wlog.debug("req", { hasPrompt: Boolean(prompt), fileSize: file.size });

  const res = await fetch(`${config("whispercpp_url")}/inference`, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "text/html",
    },
  });
  if (!res.ok) {
    throw new Error(`Whisper.cpp API Error (${res.status})`);
  }
  const data = await res.json();
  wlog.debug("res", { ok: res.ok, bytes: JSON.stringify(data).length });

  return { text: data.text.trim() };
}
