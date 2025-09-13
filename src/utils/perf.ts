import { logger } from "@/utils/logger";
// Lightweight performance mark helpers (safe in SSR)
export const perfMark = (name: string) => {
  if (typeof performance !== "undefined" && performance.mark) {
    try {
      performance.mark(name);
    } catch {
      // ignore mark errors (e.g., duplicate names) intentionally
    }
  }
};

export const perfMeasure = (name: string, start: string, end: string) => {
  if (typeof performance !== "undefined" && performance.measure) {
    try {
      performance.measure(name, start, end);
    } catch {
      // ignore measure errors
    }
  }
};

export const logPerfSummaryOnce = (() => {
  let logged = false;
  return () => {
    if (logged || typeof performance === "undefined") return;
    logged = true;
    const measures: Record<string, number> = {};
    const measureIf = (label: string, a: string, b: string) => {
      if (
        performance.getEntriesByName(a).length &&
        performance.getEntriesByName(b).length
      ) {
        perfMeasure(label, a, b);
        const entry = performance.getEntriesByName(label).pop();
        if (entry) measures[label] = +entry.duration.toFixed(1);
      }
    };
    measureIf("vrm:setup", "vrm:setup:start", "vrm:setup:afterViewerSetup");
    measureIf("vrm:loadVrm", "vrm:loadVrm:start", "vrm:loadVrm:done");
    measureIf("chat:init", "chat:init:start", "chat:init:done");
    measureIf("amicaLife:init", "amicaLife:init:start", "amicaLife:init:done");
    measureIf(
      "chat:stream:firstTokenLatency",
      "chat:stream:start",
      "chat:stream:firstToken",
    );
    measureIf(
      "chat:stream:firstSentenceLatency",
      "chat:stream:start",
      "chat:stream:firstSentence",
    );
    measureIf("chat:stream:total", "chat:stream:start", "chat:stream:done");
    measureIf("stt:vad", "stt:vad:start", "stt:vad:end");
    measureIf("stt:transcribe", "stt:transcribe:start", "stt:transcribe:done");
    measureIf("tts:play", "tts:play:start", "tts:play:done");

    // Log a single structured line; in dev it will pretty-print, in prod it's JSON
    logger.info("perf summary", { measures });
  };
})();
