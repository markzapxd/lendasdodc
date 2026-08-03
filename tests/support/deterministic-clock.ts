export class DeterministicClock {
  private offset = 0;
  private frozen = false;
  private frozenTime = 0;

  now(): number {
    if (this.frozen) return this.frozenTime;
    return Date.now() + this.offset;
  }

  freeze(time?: number): void {
    this.frozen = true;
    this.frozenTime = time ?? Date.now();
  }

  advance(ms: number): void {
    if (this.frozen) {
      this.frozenTime += ms;
    } else {
      this.offset += ms;
    }
  }

  unfreeze(): void {
    this.frozen = false;
  }

  reset(): void {
    this.offset = 0;
    this.frozen = false;
    this.frozenTime = 0;
  }
}
