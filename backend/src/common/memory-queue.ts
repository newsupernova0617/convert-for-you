export class MemoryQueue<T> {
  private readonly items: T[] = [];

  async push(item: T) {
    this.items.push(item);
  }

  async pop() {
    return this.items.shift();
  }

  get length() {
    return this.items.length;
  }
}
