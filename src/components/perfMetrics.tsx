import React, { useCallback, useEffect, useMemo, useState } from "react";

type PerfMetric = {
  key: string;
  label: string;
  ms: number | null; // null means unavailable yet
};

interface PerfSnapshot {
  timestamp: number;
  metrics: PerfMetric[];
}

// Utility: get mark startTime
const markTime = (name: string): number | undefined => {
  if (typeof performance === "undefined") return undefined;
  const entries = performance.getEntriesByName(name, "mark");
  if (!entries.length) return undefined;
  const last = entries[entries.length - 1];
  return (last as PerformanceMark).startTime;
};

// Utility: get (or compute) measure between two marks
const measureBetween = (
  label: string,
  start: string,
  end: string,
): number | null => {
  if (typeof performance === "undefined") return null;
  // Prefer existing measure
  const existing = performance.getEntriesByName(label, "measure");
  if (existing.length)
    return (existing[existing.length - 1] as PerformanceMeasure).duration;
  const a = markTime(start);
  const b = markTime(end);
  if (a === undefined || b === undefined) return null;
  return b - a;
};

// Collect counts for dynamic patterns (e.g. tts backend invocations)
const _countMarks = (prefix: string): number => {
  if (typeof performance === "undefined") return 0;
  return performance
    .getEntriesByType("mark")
    .filter((m) => m.name.startsWith(prefix)).length;
};

const formatMs = (ms: number | null) => (ms == null ? "—" : ms.toFixed(1));

function buildMetrics(): PerfMetric[] {
  const m = (label: string, start: string, end: string): PerfMetric => ({
    key: label,
    label,
    ms: measureBetween(label, start, end),
  });

  const out: PerfMetric[] = [
    m("vrm:setup", "vrm:setup:start", "vrm:setup:afterViewerSetup"),
    m("vrm:loadVrm", "vrm:loadVrm:start", "vrm:loadVrm:done"),
    m("chat:init", "chat:init:start", "chat:init:done"),
    m("amicaLife:init", "amicaLife:init:start", "amicaLife:init:done"),
    m(
      "chat:stream:firstTokenLatency",
      "chat:stream:start",
      "chat:stream:firstToken",
    ),
    m(
      "chat:stream:firstSentenceLatency",
      "chat:stream:start",
      "chat:stream:firstSentence",
    ),
    m("chat:stream:total", "chat:stream:start", "chat:stream:done"),
    m("stt:vad", "stt:vad:start", "stt:vad:end"),
    m("stt:transcribe", "stt:transcribe:start", "stt:transcribe:done"),
    m("tts:play", "tts:play:start", "tts:play:done"),
  ];
  return out;
}

export const PerfMetrics: React.FC = () => {
  const [snapshot, setSnapshot] = useState<PerfSnapshot>(() => ({
    timestamp: performance?.now?.() || 0,
    metrics: buildMetrics(),
  }));

  const refresh = useCallback(() => {
    setSnapshot({ timestamp: performance.now(), metrics: buildMetrics() });
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const ttsBackendCounts = useMemo(() => {
    if (typeof performance === "undefined") return [] as string[];
    const markNames = performance
      .getEntriesByType("mark")
      .map((m) => (m as PerformanceMark).name);
    const backendStarts = markNames.filter(
      (n) => n.startsWith("tts:") && n.endsWith(":start"),
    );
    const counts: Record<string, number> = {};
    backendStarts.forEach((n) => {
      const backend = n.split(":")[1];
      if (!backend) return;
      counts[backend] = (counts[backend] || 0) + 1;
    });
    return Object.entries(counts).map(([k, v]) => `${k}×${v}`);
  }, [snapshot.timestamp]);

  const onCopy = () => {
    const data = Object.fromEntries(
      snapshot.metrics.map((m) => [
        m.label,
        m.ms == null ? null : +m.ms.toFixed(2),
      ]),
    );
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  };

  const onReset = () => {
    if (typeof performance === "undefined") return;
    performance.clearMarks();
    performance.clearMeasures();
    refresh();
  };

  return (
    <div className="border-border/40 my-2 rounded-md border bg-[hsl(var(--surface-alt))] p-2 font-mono text-xs">
      <div className="mb-1 flex items-center gap-2">
        <span className="font-semibold tracking-wide">Performance Metrics</span>
        <button
          onClick={refresh}
          className="bg-primary hover:bg-primary-hover active:bg-primary-active rounded px-2 py-0.5 text-[10px] text-white">
          Refresh
        </button>
        <button
          onClick={onCopy}
          className="bg-secondary hover:bg-secondary-hover active:bg-secondary-active rounded px-2 py-0.5 text-[10px] text-white">
          Copy JSON
        </button>
        <button
          onClick={onReset}
          className="bg-danger hover:bg-danger/80 rounded px-2 py-0.5 text-[10px] text-white">
          Reset
        </button>
        <span className="text-muted ml-auto">
          {snapshot.timestamp.toFixed(0)}ms
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 md:grid-cols-3">
        {snapshot.metrics.map((m) => (
          <div key={m.key} className="flex items-center justify-between gap-2">
            <span className="text-muted/80 truncate">{m.label}</span>
            <span className="text-text text-right tabular-nums">
              {formatMs(m.ms)}
              {m.ms != null && <span className="text-muted/50 ml-0.5">ms</span>}
            </span>
          </div>
        ))}
      </div>
      <div className="text-muted mt-2 flex flex-wrap items-center gap-2 text-[10px]">
        <span className="font-semibold">TTS calls:</span>
        {ttsBackendCounts.length === 0 && <span>none</span>}
        {ttsBackendCounts.map((v) => (
          <span
            key={v}
            className="ring-border/20 rounded bg-[hsl(var(--surface-alt))] px-1 py-0.5 ring-1">
            {v}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PerfMetrics;
