import { WaveFile } from "wavefile";
import { logger } from "@/utils/logger";
import { updateFileProgress } from "@/utils/progress";
import { convertNumberToWordsEN } from "@/utils/numberSpelling";

type SpeechT5WorkerMessage = {
  status: "ready" | "progress" | "done" | "complete";
  file?: string;
  progress?: number;
  data?: { audio: Float32Array };
};

export async function speecht5(
  message: string,
  speakerEmbeddingsUrl: string,
): Promise<{ audio: ArrayBuffer }> {
  // empty cache
  window.chatvrm_worker_speecht5_audiocache = null;

  message = message
    .trim()
    .split(/(-?\d+)/)
    .map((s) => {
      if (s.match(/^-?\d+$/)) {
        return convertNumberToWordsEN(parseInt(s));
      } else {
        return s;
      }
    })
    .join("");

  // initialize worker if not already initialized
  if (!window.chatvrm_worker_speecht5) {
    window.chatvrm_worker_speecht5 = new Worker(
      new URL("../../workers/speecht5.js", import.meta.url),
      {
        type: "module",
      },
    );

    window.chatvrm_worker_speecht5.addEventListener(
      "message",
      (event: MessageEvent<SpeechT5WorkerMessage>) => {
        const message = event.data;
        // debug message payload only when needed
        switch (message.status) {
          case "ready":
            logger.debug("speecht5 worker ready");
            break;
          case "progress":
            if (message.file)
              updateFileProgress(message.file, message.progress ?? 0);
            break;
          case "done":
            logger.debug("speecht5 done", { file: message.file });
            if (message.file) updateFileProgress(message.file, 100);
            break;
          case "complete":
            logger.debug("speecht5 complete");
            window.chatvrm_worker_speecht5_audiocache =
              message.data?.audio ?? null;
            break;
        }
      },
    );
  }

  // clear cache
  window.chatvrm_worker_speecht5_audiocache = null;

  // start job
  window.chatvrm_worker_speecht5!.postMessage({
    text: message,
    speaker_embeddings: speakerEmbeddingsUrl,
  });

  // wait for job to complete
  await new Promise((resolve) => {
    logger.debug("speecht5 waiting for job to complete");
    const checkJob = async () => {
      while (true) {
        if (window.chatvrm_worker_speecht5_audiocache !== null) {
          resolve(null);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };
    checkJob();
  });

  let wav = new WaveFile();
  const audio = window.chatvrm_worker_speecht5_audiocache;
  if (!audio) {
    throw new Error("SpeechT5 produced no audio data");
  }
  wav.fromScratch(1, 16000, "32f", audio);
  const wavBuffer = wav.toBuffer();
  const wavBlob = new Blob([wavBuffer.slice()], { type: "audio/wav" });
  const arrayBuffer = await wavBlob.arrayBuffer();

  return { audio: arrayBuffer };
}
