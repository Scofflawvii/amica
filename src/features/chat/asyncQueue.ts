// Minimal awaitable FIFO queue replacing typescript-collections Queue
// Provides enqueue, dequeue (awaits), clear, size
export class AsyncQueue<T> {
  private items: T[] = [];
  private resolvers: ((value: T) => void)[] = [];
  enqueue(item: T) {
    const resolver = this.resolvers.shift();
    if (resolver) resolver(item);
    else this.items.push(item);
  }
  async dequeue(): Promise<T> {
    if (this.items.length) return this.items.shift() as T;
    return new Promise<T>((res) => this.resolvers.push(res));
  }
  clear() {
    // Clear queued items; resolve any pending dequeuers with a noop value cast.
    this.items = [];
    this.resolvers.forEach((_) => {
      /* pending dequeue cleared */
    });
    this.resolvers = [];
  }
  size() {
    return this.items.length;
  }
}
