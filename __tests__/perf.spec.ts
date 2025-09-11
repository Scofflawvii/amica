import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { perfMark, perfMeasure, logPerfSummaryOnce } from "../src/utils/perf";

// Helper to see if performance API available
const hasPerf = typeof performance !== "undefined" && !!performance.mark;

// Reset potential prior state (logPerfSummaryOnce caches a flag internally, so we require fresh module in some tests)
function reloadPerfModule() {
   
  jest.resetModules();
  const mod = require("../src/utils/perf");
  return mod as typeof import("../src/utils/perf");
}

describe("perf utilities", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("perfMark + perfMeasure produce a measure entry when performance supported", () => {
    if (!hasPerf) {
      expect(true).toBe(true);
      return;
    }
    perfMark("a:start");
    perfMark("a:end");
    perfMeasure("a:total", "a:start", "a:end");
    const entries = performance.getEntriesByName("a:total");
    expect(entries.length).toBeGreaterThan(0);
  });

  test("logPerfSummaryOnce logs only once and includes expected chat stream metrics", () => {
    if (!hasPerf) {
      expect(true).toBe(true);
      return;
    }
    // Create required marks
    perfMark("chat:stream:start");
    perfMark("chat:stream:firstToken");
    perfMark("chat:stream:firstSentence");
    perfMark("chat:stream:done");
    const tableSpy = jest.spyOn(console, "table").mockImplementation(() => {
      /* noop */
    });
    logPerfSummaryOnce();
    expect(tableSpy).toHaveBeenCalledTimes(1);
    const firstArg = tableSpy.mock.calls[0][0];
    // Should include latency keys (may have numeric values)
    expect(Object.keys(firstArg)).toEqual(
      expect.arrayContaining([
        "chat:stream:firstTokenLatency",
        "chat:stream:firstSentenceLatency",
        "chat:stream:total",
      ]),
    );
    logPerfSummaryOnce(); // second call should not log again
    expect(tableSpy).toHaveBeenCalledTimes(1);
  });

  test("safe when performance undefined", () => {
    const original = (global as any).performance;
    // @ts-ignore
    delete (global as any).performance;
    const {
      perfMark: pm,
      perfMeasure: pms,
      logPerfSummaryOnce: lps,
    } = reloadPerfModule();
    expect(() => {
      pm("x");
    }).not.toThrow();
    expect(() => {
      pms("m", "a", "b");
    }).not.toThrow();
    expect(() => {
      lps();
    }).not.toThrow();
    (global as any).performance = original;
  });
});
