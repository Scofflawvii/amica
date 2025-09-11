import { describe, expect, test, jest } from "@jest/globals";
// Provide a minimal ReadableStream shim for Node test environment if needed.
if (typeof (global as any).ReadableStream === "undefined") {
  class TestReadableStream<T> {
    private _underlying: any;
    constructor(underlying: any) {
      this._underlying = underlying;
    }
    getReader() {
      const underlying = this._underlying;
      let closed = false;
      return {
        async read() {
          if (closed) return { done: true, value: undefined };
          const chunk = underlying.pull();
          if (chunk === undefined) {
            closed = true;
            return { done: true, value: undefined };
          }
          return { done: false, value: chunk };
        },
        releaseLock() {
          closed = true;
        },
        cancel() {
          closed = true;
        },
      } as any;
    }
  }
  // @ts-ignore
  (global as any).ReadableStream = TestReadableStream;
}
import {
  ChatStreamSession,
  ChatSessionCallbacks,
} from "../src/features/chat/chatSession";
import { Screenplay } from "../src/features/chat/messages";

function makeStream(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  let i = 0;
  return new (global as any).ReadableStream({
    pull() {
      if (i >= chunks.length) return undefined;
      return enc.encode(chunks[i++]);
    },
  });
}

describe("ChatStreamSession", () => {
  test("process returns a string (smoke)", async () => {
    const stream = makeStream(["[neutral] Hi."]);
    const enqueue: Screenplay[] = [];
    const cb: ChatSessionCallbacks = {
      enqueueScreenplay: (sc) => enqueue.push(sc),
      thought: jest.fn(),
      setProcessing: jest.fn(),
      appendError: jest.fn(),
      isCurrent: () => true,
    };
    const session = new ChatStreamSession(1, stream, cb);
    const log = await session.process();
    expect(typeof log).toBe("string");
  });

  test("abort stops further processing", async () => {
    const chunks = [
      "[neutral] First part that will be aborted. Second sentence.",
    ];
    const stream = makeStream(chunks);
    const enqueue: Screenplay[] = [];
    const cb: ChatSessionCallbacks = {
      enqueueScreenplay: (sc) => enqueue.push(sc),
      thought: jest.fn(),
      setProcessing: jest.fn(),
      appendError: jest.fn(),
      isCurrent: () => true,
    };
    const session = new ChatStreamSession(1, stream, cb);
    session.abort();
    const log = await session.process();
    // Aborted early so no screenplay should be enqueued
    expect(enqueue.length).toBe(0);
    expect(log).toBe("");
  });
});
