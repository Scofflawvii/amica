/**
 * Debug utility for controlled logging
 * Can be toggled via config or environment variables
 */

import { config } from './config';

export interface DebugLogger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
  enabled: boolean;
}

class Debug implements DebugLogger {
  public enabled: boolean;

  constructor() {
    // Enable debug in development or if explicitly enabled in config
    this.enabled = 
      process.env.NODE_ENV === 'development' || 
      config('debug_mode') === 'true' ||
      config('debug_gfx') === 'true';
  }

  log(...args: any[]): void {
    if (this.enabled) {
      console.log(...args);
    }
  }

  warn(...args: any[]): void {
    if (this.enabled) {
      console.warn(...args);
    }
  }

  error(...args: any[]): void {
    // Always show errors, even in production
    console.error(...args);
  }

  info(...args: any[]): void {
    if (this.enabled) {
      console.info(...args);
    }
  }

  time(label: string): void {
    if (this.enabled) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.enabled) {
      console.timeEnd(label);
    }
  }

  // Toggle debug at runtime
  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }
}

// Export singleton instance
export const debug = new Debug();

// Convenience exports for common patterns
export const debugLog = debug.log.bind(debug);
export const debugWarn = debug.warn.bind(debug);
export const debugError = debug.error.bind(debug);
export const debugInfo = debug.info.bind(debug);
export const debugTime = debug.time.bind(debug);
export const debugTimeEnd = debug.timeEnd.bind(debug);

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).debug = debug;
}
