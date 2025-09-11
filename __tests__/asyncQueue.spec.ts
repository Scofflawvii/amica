import { describe, test, expect } from "@jest/globals";
import { AsyncQueue } from "../src/features/chat/asyncQueue";

describe("AsyncQueue", () => {
  test("enqueue then dequeue resolves immediately", async () => {
    const q = new AsyncQueue<number>();
    q.enqueue(42);
    await expect(q.dequeue()).resolves.toBe(42);
  });

  test("dequeue waits for enqueue", async () => {
    const q = new AsyncQueue<number>();
    const p = q.dequeue();
    let resolved = false;
    p.then(() => {
      resolved = true;
    });
    expect(resolved).toBe(false);
    q.enqueue(7);
    await expect(p).resolves.toBe(7);
  });

  test("clear removes pending items", async () => {
    const q = new AsyncQueue<number>();
    q.enqueue(1);
    q.enqueue(2);
    q.clear();
    expect(q.size()).toBe(0);
  });
});
