// Simple logger wrapper to allow mocking in tests and future enhancement.
export const logger = {
  info: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  time: (label: string) => console.time?.(label),
  timeEnd: (label: string) => console.timeEnd?.(label),
};

export type Logger = typeof logger;
