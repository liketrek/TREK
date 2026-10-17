/**
 * A binary min-heap of integer ids by a float priority, on typed arrays so a
 * search over a few hundred thousand cells or nodes makes no garbage. An id
 * may be pushed again with a better priority; the stale entry is skipped by
 * the caller when it comes up.
 */
export class MinHeap {
  private ids: Int32Array;
  private keys: Float64Array;
  private length = 0;

  constructor(capacity = 1024) {
    this.ids = new Int32Array(capacity);
    this.keys = new Float64Array(capacity);
  }

  get size(): number {
    return this.length;
  }

  clear(): void {
    this.length = 0;
  }

  push(id: number, key: number): void {
    if (this.length === this.ids.length) this.grow();
    let at = this.length++;
    while (at > 0) {
      const parent = (at - 1) >> 1;
      const parentKey = this.keys[parent] as number;
      if (parentKey <= key) break;
      this.ids[at] = this.ids[parent] as number;
      this.keys[at] = parentKey;
      at = parent;
    }
    this.ids[at] = id;
    this.keys[at] = key;
  }

  peekKey(): number {
    return this.keys[0] as number;
  }

  /** The id with the lowest priority, taken off; call only while `size` > 0. */
  pop(): number {
    const top = this.ids[0] as number;
    const last = --this.length;
    if (last > 0) {
      const id = this.ids[last] as number;
      const key = this.keys[last] as number;
      let at = 0;
      for (;;) {
        let child = at * 2 + 1;
        if (child >= last) break;
        if (child + 1 < last && (this.keys[child + 1] as number) < (this.keys[child] as number)) child++;
        if ((this.keys[child] as number) >= key) break;
        this.ids[at] = this.ids[child] as number;
        this.keys[at] = this.keys[child] as number;
        at = child;
      }
      this.ids[at] = id;
      this.keys[at] = key;
    }
    return top;
  }

  private grow(): void {
    const ids = new Int32Array(this.ids.length * 2);
    const keys = new Float64Array(this.keys.length * 2);
    ids.set(this.ids);
    keys.set(this.keys);
    this.ids = ids;
    this.keys = keys;
  }
}
