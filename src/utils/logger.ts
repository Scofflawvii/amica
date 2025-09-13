// Structured logger with environment-aware formatting and contextual children.
// Non-breaking: retains info/warn/error/time/timeEnd signatures.

export type Level = "debug" | "info" | "warn" | "error";

const levelOrder: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

type Ctx = Record<string, unknown>;

type LogFn = (msg: unknown, ...args: unknown[]) => void;

export interface Logger {
  debug: LogFn;
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  /**
   * Create a child logger with merged context.
   */
  with: (ctx: Ctx) => Logger;
}

const nowISO = () => new Date().toISOString();

const isProd = (() => {
  try {
    return (
      typeof process !== "undefined" && process.env?.NODE_ENV === "production"
    );
  } catch {
    return false;
  }
})();

function computeInitialLevel(): Level {
  try {
    // URL override (?log=debug)
    if (typeof window !== "undefined") {
      const qp = new URLSearchParams(window.location.search);
      const qlvl = qp.get("log");
      if (qlvl && qlvl.toLowerCase() in levelOrder)
        return qlvl.toLowerCase() as Level;
      // Local storage override
      const slvl =
        window.localStorage?.getItem("LOG_LEVEL") ??
        window.localStorage?.getItem("log_level");
      if (slvl && slvl.toLowerCase() in levelOrder)
        return slvl.toLowerCase() as Level;
    }
    // Env vars (build/runtime)
    const lvl =
      (typeof process !== "undefined"
        ? process.env?.NEXT_PUBLIC_LOG_LEVEL
        : undefined) ??
      (typeof process !== "undefined" ? process.env?.LOG_LEVEL : undefined);
    if (lvl && typeof lvl === "string" && lvl.toLowerCase() in levelOrder) {
      return lvl.toLowerCase() as Level;
    }
  } catch {
    /* noop */
  }
  return isProd ? ("info" as Level) : ("debug" as Level);
}

let currentLevel: Level = computeInitialLevel();

export function setLogLevel(level: Level) {
  if (!(level in levelOrder)) return;
  currentLevel = level;
  if (typeof window !== "undefined") {
    try {
      window.localStorage?.setItem("LOG_LEVEL", level);
    } catch {
      /* noop */
    }
  }
}

export function getLogLevel(): Level {
  return currentLevel;
}

function shouldLog(level: Level): boolean {
  return levelOrder[level] >= levelOrder[currentLevel];
}

function toErrorLike(
  val: unknown,
): { message?: string | undefined; stack?: string | undefined } | undefined {
  if (!val) return undefined;
  if (val instanceof Error)
    return { message: val.message, stack: val.stack ?? undefined };
  if (
    typeof val === "object" &&
    val &&
    "message" in (val as Record<string, unknown>)
  ) {
    const v = val as Record<string, unknown> & { stack?: unknown };
    return {
      message:
        typeof v.message === "string"
          ? v.message
          : v.message !== undefined
            ? String(v.message)
            : undefined,
      stack: typeof v.stack === "string" ? v.stack : undefined,
    };
  }
  return undefined;
}

function safeJson(value: unknown): unknown {
  try {
    JSON.stringify(value);
    return value;
  } catch {
    // Fallback if circular
    return String(value);
  }
}

function createLogger(baseCtx: Ctx = {}): Logger {
  const format = (level: Level, msg: unknown, rest: unknown[]) => {
    // Extract first error-like from args for clearer output
    const errLike = rest.map(toErrorLike).find(Boolean);
    const dataArgs = rest.filter((a) => a !== errLike);

    if (isProd) {
      const payload: Record<string, unknown> = {
        level,
        time: nowISO(),
        msg: typeof msg === "string" ? msg : safeJson(msg),
        ...baseCtx,
      };
      if (dataArgs.length === 1 && typeof dataArgs[0] === "object") {
        Object.assign(payload, safeJson(dataArgs[0]));
      } else if (dataArgs.length > 0) {
        payload.data = dataArgs.map(safeJson);
      }
      if (errLike) payload.error = errLike;
      const line = JSON.stringify(payload);
      // Respect level sinks while keeping JSON line format
      if (level === "error") console.error(line);
      else if (level === "warn") console.warn(line);
      else console.log(line);
      return;
    }

    // Dev: pretty console with context prefix
    const prefixParts = [
      `[${level.toUpperCase()}]`,
      baseCtx && Object.keys(baseCtx).length ? JSON.stringify(baseCtx) : "",
    ].filter(Boolean);
    const prefix = prefixParts.join(" ");
    const sink =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : level === "debug"
            ? (console.debug ?? console.log)
            : console.log;
    if (errLike)
      sink(prefix, msg, ...dataArgs, "\n", errLike.stack ?? errLike.message);
    else sink(prefix, msg, ...dataArgs);
  };

  const bind =
    (level: Level): LogFn =>
    (msg: unknown, ...args: unknown[]) => {
      if (!shouldLog(level)) return;
      format(level, msg, args);
    };

  return {
    debug: bind("debug"),
    info: bind("info"),
    warn: bind("warn"),
    error: bind("error"),
    time: (label: string) => console.time?.(label),
    timeEnd: (label: string) => console.timeEnd?.(label),
    with: (ctx: Ctx) => createLogger({ ...baseCtx, ...ctx }),
  };
}

export const logger: Logger = createLogger();
