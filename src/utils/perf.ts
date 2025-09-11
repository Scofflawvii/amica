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
     
    console.table(measures);
  };
})();
