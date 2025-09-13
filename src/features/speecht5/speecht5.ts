import { WaveFile } from "wavefile";
import { logger } from "@/utils/logger";
import { updateFileProgress } from "@/utils/progress";
import { convertNumberToWordsEN } from "@/utils/numberSpelling";

export async function speecht5(message: string, speakerEmbeddingsUrl: string) {
  // empty cache
  (window as any).chatvrm_worker_speecht5_audiocache =
    null as Float32Array | null;

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
  if (
    !Object.prototype.hasOwnProperty.call(window, "chatvrm_worker_speecht5")
  ) {
    (window as any).chatvrm_worker_speecht5 = new Worker(
      new URL("../../workers/speecht5.js", import.meta.url),
      {
        type: "module",
      },
    );

    (window as any).chatvrm_worker_speecht5.addEventListener(
      "message",
      (
        event: MessageEvent<{
          status: "ready" | "progress" | "done" | "complete";
          file?: string;
          progress?: number;
          data?: { audio: Float32Array };
        }>,
      ) => {
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
            (window as any).chatvrm_worker_speecht5_audiocache =
              message.data?.audio ?? null;
            break;
        }
      },
    );
  }

  // clear cache
  (window as any).chatvrm_worker_speecht5_audiocache =
    null as Float32Array | null;

  // start job
  (window as any).chatvrm_worker_speecht5.postMessage({
    text: message,
    speaker_embeddings: speakerEmbeddingsUrl,
  });

  // wait for job to complete
  await new Promise((resolve) => {
    logger.debug("speecht5 waiting for job to complete");
    const checkJob = async () => {
      while (true) {
        if ((window as any).chatvrm_worker_speecht5_audiocache !== null) {
          resolve(null);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    };
    checkJob();
  });

  let wav = new WaveFile();
  wav.fromScratch(
    1,
    16000,
    "32f",
    (window as any).chatvrm_worker_speecht5_audiocache,
  );
  const wavBuffer = wav.toBuffer();
  const wavBlob = new Blob([wavBuffer.slice()], { type: "audio/wav" });
  const arrayBuffer = await wavBlob.arrayBuffer();

  return { audio: arrayBuffer };
}
