// Lightweight performance mark helpers (safe in SSR)
export const perfMark = (name: string) => {
  if (typeof performance !== "undefined" && performance.mark) {
    try {
      performance.mark(name);
    } catch (e) {
      // ignore mark errors (e.g., duplicate names) intentionally
    }
  }
};

export const perfMeasure = (name: string, start: string, end: string) => {
  if (typeof performance !== "undefined" && performance.measure) {
    try {
      performance.measure(name, start, end);
    } catch (e) {
      // ignore measure errors
    }
  }
};

export const logPerfSummaryOnce = (() => {
  let logged = false;
  return () => {
    if (logged || typeof performance === "undefined") return;
    const marks = [
      "vrm:setup:start",
      "vrm:setup:afterViewerSetup",
      "vrm:loadVrm:start",
      "vrm:loadVrm:done",
      "chat:init:start",
      "chat:init:done",
      "amicaLife:init:start",
      "amicaLife:init:done",
      // chat stream lifecycle
      "chat:stream:start",
      "chat:stream:firstToken",
      "chat:stream:firstSentence",
      "chat:stream:done",
      // stt lifecycle
      "stt:vad:start",
      "stt:vad:end",
      "stt:transcribe:start",
      "stt:transcribe:done",
      // tts playback
      "tts:play:start",
      "tts:play:done",
    ];
    const have = marks.filter((m) => performance.getEntriesByName(m).length);
    if (have.length === 0) return;
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

    console.table(measures);
  };
})();
