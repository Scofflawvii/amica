/**
 * Debug utility for controlled logging.
 * - Zero-cost when disabled (methods become no-ops instead of branching per call)
 * - SSR-safe checks for env, URL ?debug, and localStorage DEBUG flags
 */

import { config } from "./config";

type Variadic = unknown[];

export interface DebugLogger {
  enabled: boolean;
  log: (...args: Variadic) => void;
  warn: (...args: Variadic) => void;
  error: (...args: Variadic) => void; // always logs
  info: (...args: Variadic) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  enable: () => void;
  disable: () => void;
  // Per-level controls
  levels: { log: boolean; info: boolean; warn: boolean };
  setLevels: (
    levels: Partial<{ log: boolean; info: boolean; warn: boolean }>,
  ) => void;
  enableLevel: (level: "log" | "info" | "warn") => void;
  disableLevel: (level: "log" | "info" | "warn") => void;
}

const noop = (..._args: Variadic) => {};

function getInitialEnabled(): boolean {
  // 1) Dev mode on server or client
  const isDev =
    typeof process !== "undefined" && process.env?.NODE_ENV === "development";

  // 2) Config flags
  const cfg = config("debug_mode") === "true" || config("debug_gfx") === "true";

  // 3) Environment variable (server/runtime)
  const envDebug =
    typeof process !== "undefined" &&
    /^(1|true|yes)$/i.test(String(process.env?.DEBUG ?? ""));

  // 4) URL ?debug and localStorage DEBUG on client
  let clientFlag = false;
  if (typeof window !== "undefined") {
    try {
      const qs = new URLSearchParams(window.location.search);
      const q = qs.get("debug");
      if (q !== null) clientFlag = q === "" || /^(1|true|yes)$/i.test(q);

      const ls =
        window.localStorage?.getItem("DEBUG") ??
        window.localStorage?.getItem("debug");
      if (ls != null) clientFlag = /^(1|true|yes)$/i.test(ls);
    } catch {
      // intentionally ignore client storage/url access errors
      // (e.g., privacy mode, disabled cookies)
      /* no-op */
    }
  }

  return isDev || cfg || envDebug || clientFlag;
}

function readBoolConfig(key: string, fallback: boolean): boolean {
  try {
    const val = config(key);
    if (val === "true") return true;
    if (val === "false") return false;
  } catch {
    // config read failed; fall back to provided default
    return fallback;
  }
  return fallback;
}

class Debug implements DebugLogger {
  public enabled: boolean;
  public levels: { log: boolean; info: boolean; warn: boolean };

  // Methods are reassigned to no-op or console counterparts based on enabled state.
  public log: (...args: Variadic) => void = noop;
  public warn: (...args: Variadic) => void = noop;
  public info: (...args: Variadic) => void = noop;
  public time: (label: string) => void = noop as (label: string) => void;
  public timeEnd: (label: string) => void = noop as (label: string) => void;
  // Always log errors
  public error: (...args: Variadic) => void = (...args) =>
    console.error(...args);

  constructor() {
    this.enabled = getInitialEnabled();
    // Default all levels to on when enabled unless explicitly configured
    this.levels = {
      log: readBoolConfig("debug_log", true),
      info: readBoolConfig("debug_info", true),
      warn: readBoolConfig("debug_warn", true),
    };
    this.applyState();
  }

  private applyState() {
    if (this.enabled) {
      this.log = this.levels.log
        ? (...args: Variadic) => console.log(...args)
        : noop;
      this.warn = this.levels.warn
        ? (...args: Variadic) => console.warn(...args)
        : noop;
      this.info = this.levels.info
        ? (...args: Variadic) => console.info(...args)
        : noop;
      this.time = (label: string) => console.time(label);
      this.timeEnd = (label: string) => console.timeEnd(label);
    } else {
      this.log = noop;
      this.warn = noop;
      this.info = noop;
      this.time = noop as (label: string) => void;
      this.timeEnd = noop as (label: string) => void;
    }
  }

  enable(): void {
    this.enabled = true;
    this.applyState();
    if (typeof window !== "undefined") {
      try {
        window.localStorage?.setItem("DEBUG", "1");
      } catch {
        /* no-op */
      }
    }
  }

  disable(): void {
    this.enabled = false;
    this.applyState();
    if (typeof window !== "undefined") {
      try {
        window.localStorage?.removeItem("DEBUG");
      } catch {
        /* no-op */
      }
    }
  }

  setLevels(
    levels: Partial<{ log: boolean; info: boolean; warn: boolean }>,
  ): void {
    this.levels = { ...this.levels, ...levels };
    this.applyState();
  }

  enableLevel(level: "log" | "info" | "warn"): void {
    this.levels[level] = true;
    this.applyState();
  }

  disableLevel(level: "log" | "info" | "warn"): void {
    this.levels[level] = false;
    this.applyState();
  }
}

// Export singleton instance
export const debug = new Debug();

// Convenience exports (dynamic wrappers so toggling at runtime is respected)
export const debugLog = (...args: Variadic) => debug.log(...args);
export const debugWarn = (...args: Variadic) => debug.warn(...args);
export const debugError = (...args: Variadic) => debug.error(...args);
export const debugInfo = (...args: Variadic) => debug.info(...args);
export const debugTime = (label: string) => debug.time(label);
export const debugTimeEnd = (label: string) => debug.timeEnd(label);

// Export for global access (handy during local dev)
declare global {
  interface Window {
    debug: DebugLogger;
  }
}
if (typeof window !== "undefined") {
  window.debug = debug;
}
