import { openaiWhisper } from "@/features/openaiWhisper/openaiWhisper";
import { whispercpp } from "@/features/whispercpp/whispercpp";
import { config } from "@/utils/config";
import { logger } from "@/utils/logger";
const xlog = logger.with({
  subsystem: "externalAPI",
  module: "voiceProcessor",
});

export async function transcribeVoice(audio: File): Promise<string> {
  try {
    switch (config("stt_backend")) {
      case "whisper_openai": {
        const result = await openaiWhisper(audio);
        return result?.text;
      }
      case "whispercpp": {
        const result = await whispercpp(audio);
        return result?.text;
      }
      default:
        throw new Error("Invalid STT backend configuration.");
    }
  } catch (error) {
    xlog.error("Transcription error", error);
    throw new Error("Failed to transcribe audio.");
  }
}
