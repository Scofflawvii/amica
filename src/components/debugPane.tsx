import { useEffect, useRef, useState } from "react";
import { Switch } from "@headlessui/react";
import { IconButton } from "@/components/iconButton";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { clsx } from "clsx";
import { config } from "@/utils/config";
import PerfMetrics from "@/components/perfMetrics";
// Portal removed: component rendered within GuiLayer parent portal.

const TOTAL_ITEMS_TO_SHOW = 100;

function SwitchToggle({
  enabled,
  set,
}: {
  enabled: boolean;
  set: (enabled: boolean) => void;
}) {
  return (
    <Switch
      className="group relative ml-1 inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-full focus:ring-0 focus:outline-none"
      checked={enabled}
      onChange={set}>
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute h-full w-full rounded-md"
      />
      <span
        aria-hidden="true"
        className={clsx(
          enabled ? "bg-indigo-200" : "bg-gray-200",
          "pointer-events-none absolute mx-auto h-4 w-9 rounded-full transition-colors duration-200 ease-in-out",
        )}
      />
      <span
        aria-hidden="true"
        className={clsx(
          enabled ? "translate-x-5" : "translate-x-0",
          "pointer-events-none absolute left-0 inline-block h-5 w-5 transform rounded-full border border-gray-200 bg-white shadow ring-0 transition-transform duration-200 ease-in-out",
        )}
      />
    </Switch>
  );
}

export function DebugPane({ onClickClose }: { onClickClose: () => void }) {
  const [typeDebugEnabled, setTypeDebugEnabled] = useState(false);
  const [typeInfoEnabled, setTypeInfoEnabled] = useState(true);
  const [typeWarnEnabled, setTypeWarnEnabled] = useState(true);
  const [typeErrorEnabled, setTypeErrorEnabled] = useState(true);
  const [showPerf, setShowPerf] = useState(true);
  const [leftOffset, setLeftOffset] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcut("Escape", onClickClose);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({
      behavior: "auto",
      block: "center",
    });
  }, []);

  // Auto-detect sidebar bounds to avoid overlap; update on resize
  useEffect(() => {
    const measure = () => {
      if (typeof document === "undefined") return;
      const el = document.getElementById("amica-sidebar");
      const width = typeof window !== "undefined" ? window.innerWidth : 0;
      if (!el) {
        setLeftOffset(0);
        return;
      }
      const r = el.getBoundingClientRect();
      const margin = 12; // breathing room beside sidebar
      // Clamp to right screen bound with a minimum panel width of 320px
      const maxLeft = Math.max(0, width - 320);
      const next = Math.max(0, Math.min(maxLeft, r.right + margin));
      setLeftOffset(next);
    };
    measure();
    window.addEventListener("resize", measure);
    const id = window.setInterval(measure, 1000);
    return () => {
      window.removeEventListener("resize", measure);
      window.clearInterval(id);
    };
  }, []);

  // Shape of a captured console log item (mirrors error handler injection logic)
  interface LogItem {
    ts: number; // timestamp ms
    type: "debug" | "info" | "log" | "warn" | "error";
    arguments: unknown[]; // original console args captured
  }

  // Safely read global logs list.
  const getLogs = (): LogItem[] => {
    const anyWindow = window as unknown as { error_handler_logs?: unknown };
    if (!Array.isArray(anyWindow.error_handler_logs)) return [];
    // Runtime validate minimal structure
    return (anyWindow.error_handler_logs as unknown[]).filter(
      (l): l is LogItem => {
        if (!l || typeof l !== "object") return false;
        const rec = l as Record<string, unknown>;
        if (typeof rec.ts !== "number") return false;
        if (typeof rec.type !== "string") return false;
        if (!["debug", "info", "log", "warn", "error"].includes(rec.type))
          return false;
        if (!Array.isArray(rec.arguments)) return false;
        return true;
      },
    );
  };

  function onClickCopy() {
    navigator.clipboard.writeText(JSON.stringify(getLogs()));
  }

  return (
    <>
      <div className="z-max bg-surface fixed inset-0 text-[hsl(var(--text))]">
        {/* Content panel sits beside the left sidebar; full height, scrolls internally */}
        <div
          className="z-max bg-surface fixed inset-y-0 right-0 text-left text-xs"
          style={{ left: leftOffset }}>
          <div className="bg-surface-alt border-border/50 border-b p-2">
            <IconButton
              iconName="24/Close"
              isProcessing={false}
              className="bg-secondary hover:bg-secondary-hover active:bg-secondary-active"
              onClick={onClickClose}
            />
            <IconButton
              iconName="24/Description"
              isProcessing={false}
              className="bg-primary hover:bg-primary-hover active:bg-primary-active ml-4"
              onClick={onClickCopy}
            />
            <div className="text-muted ml-2 inline-block items-center">
              <span className="px-1">
                <span className="text-muted text-xs">llm: </span>
                <span className="text-xs">{config("chatbot_backend")}</span>
              </span>
              <span className="px-1">
                <span className="text-muted text-xs">tts: </span>
                <span className="text-xs">{config("tts_backend")}</span>
              </span>
              <span className="px-1">
                <span className="text-muted text-xs">stt: </span>
                <span className="text-xs">{config("stt_backend")}</span>
              </span>
              <span className="px-1">
                <span className="text-muted text-xs">bid: </span>
                <span className="text-xs">
                  {process.env.NEXT_PUBLIC_CONFIG_BUILD_ID}
                </span>
              </span>
            </div>
          </div>
          <div className="bg-surface-alt border-border/30 border-b p-2">
            <span className="ml-2">
              <span className="bg-surface-alt text-muted ring-border/40 mx-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                debug
                <SwitchToggle
                  enabled={typeDebugEnabled}
                  set={setTypeDebugEnabled}
                />
              </span>
              <span className="bg-success/15 text-success ring-success/30 mx-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                info
                <SwitchToggle
                  enabled={typeInfoEnabled}
                  set={setTypeInfoEnabled}
                />
              </span>
              <span className="bg-warning/15 text-warning ring-warning/30 mx-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                warn
                <SwitchToggle
                  enabled={typeWarnEnabled}
                  set={setTypeWarnEnabled}
                />
              </span>
              <span className="bg-danger/15 text-danger ring-danger/30 mx-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                error
                <SwitchToggle
                  enabled={typeErrorEnabled}
                  set={setTypeErrorEnabled}
                />
              </span>
              <span className="bg-primary/15 text-primary ring-primary/30 mx-1 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                perf
                <SwitchToggle enabled={showPerf} set={setShowPerf} />
              </span>
            </span>
          </div>
          {showPerf && <PerfMetrics />}
          <div className="relative inline-block max-h-[calc(100vh-140px)] w-full overflow-y-scroll px-2 md:px-8">
            {getLogs()
              .slice(-TOTAL_ITEMS_TO_SHOW)
              .filter((log) => {
                if (log.type === "debug" && !typeDebugEnabled) return false;
                if (
                  (log.type === "info" || log.type === "log") &&
                  !typeInfoEnabled
                )
                  return false;
                if (log.type === "warn" && !typeWarnEnabled) return false;
                if (log.type === "error" && !typeErrorEnabled) return false;
                return true;
              })
              .map((log, idx: number) => (
                <div
                  key={log.ts + idx}
                  className={clsx(
                    "my-0.5 rounded",
                    log.type === "error" ? "bg-danger/20" : "bg-surface-alt",
                  )}>
                  {log.type === "debug" && (
                    <span className="bg-surface-alt text-muted ring-border/40 inline-flex w-12 items-center rounded-md px-2 py-1 font-mono text-xs font-medium ring-1 ring-inset">
                      debug
                    </span>
                  )}
                  {(log.type === "info" || log.type === "log") && (
                    <span className="bg-success/15 text-success ring-success/30 inline-flex w-12 items-center rounded-md px-2 py-1 font-mono text-xs font-medium ring-1 ring-inset">
                      info
                    </span>
                  )}
                  {log.type === "warn" && (
                    <span className="bg-warning/15 text-warning ring-warning/30 inline-flex w-12 items-center rounded-md px-2 py-1 font-mono text-xs font-medium ring-1 ring-inset">
                      warn
                    </span>
                  )}
                  {log.type === "error" && (
                    <span className="bg-danger/15 text-danger ring-danger/30 inline-flex w-12 items-center rounded-md px-2 py-1 font-mono text-xs font-medium ring-1 ring-inset">
                      error
                    </span>
                  )}

                  <small className="text-muted px-1 font-mono">
                    {(log.ts / 1000) | 0}
                  </small>

                  <span className="text-text text-md">
                    {[...log.arguments]
                      .map((v) =>
                        typeof v === "object" ? JSON.stringify(v) : v,
                      )
                      .join(" ")}
                  </span>
                </div>
              ))}
            <div ref={scrollRef} className="my-20" />
            <div className="my-20 h-40 md:my-2 md:h-0" />
          </div>
        </div>
      </div>
    </>
  );
}
