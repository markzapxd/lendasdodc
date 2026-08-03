type BarrierEntry = {
  readonly expected: number;
  readonly resolvers: Array<() => void>;
};

export class RaceBarrier {
  private waiting: Map<string, BarrierEntry> = new Map();

  async wait(name: string, expected: number): Promise<void> {
    return new Promise((resolve) => {
      const entry = this.waiting.get(name) ?? { expected, resolvers: [] };
      entry.resolvers.push(resolve);
      this.waiting.set(name, entry);

      if (entry.resolvers.length >= entry.expected) {
        this.waiting.delete(name);
        entry.resolvers.forEach((release) => {
          release();
        });
      }
    });
  }

  reset(): void {
    this.waiting.clear();
  }
}
