/**
 * The positions of the nodes a read needs, held as sorted typed arrays rather
 * than a Set and a Map: a lake-rich region asks for millions of nodes, which
 * as objects would cost several times the memory and run into V8's limit on
 * the size of a Map. Ids are collected first, then sorted once; the pass over
 * the file's nodes fills in their positions at 1e-7 degrees, OSM's own
 * resolution.
 */
export class NodeStore {
  private ids = new Float64Array(1024);
  private count = 0;
  private sealed = false;
  private lats = new Int32Array(0);
  private lons = new Int32Array(0);
  private found = new Uint8Array(0);

  get size(): number {
    return this.count;
  }

  want(id: number): void {
    if (this.sealed) throw new Error('NodeStore is sealed');
    if (this.count === this.ids.length) {
      const grown = new Float64Array(this.ids.length * 2);
      grown.set(this.ids);
      this.ids = grown;
    }
    this.ids[this.count++] = id;
  }

  wantAll(ids: readonly number[]): void {
    for (const id of ids) this.want(id);
  }

  /** Sorts and dedupes the ids; from here on positions can be filled in. */
  seal(): void {
    if (this.sealed) return;
    const sorted = this.ids.subarray(0, this.count).sort();
    let unique = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0 || sorted[i] !== sorted[unique - 1]) sorted[unique++] = sorted[i] as number;
    }
    this.ids = sorted.slice(0, unique);
    this.count = unique;
    this.lats = new Int32Array(unique);
    this.lons = new Int32Array(unique);
    this.found = new Uint8Array(unique);
    this.sealed = true;
  }

  private indexOf(id: number): number {
    let low = 0;
    let high = this.count - 1;
    while (low <= high) {
      const mid = (low + high) >>> 1;
      const at = this.ids[mid] as number;
      if (at === id) return mid;
      if (at < id) low = mid + 1;
      else high = mid - 1;
    }
    return -1;
  }

  /** Records a node's position if the read wants it. */
  offer(id: number, lat: number, lon: number): void {
    const index = this.indexOf(id);
    if (index < 0) return;
    this.lats[index] = Math.round(lat * 1e7);
    this.lons[index] = Math.round(lon * 1e7);
    this.found[index] = 1;
  }

  /** [lat, lon] of a node, or null when the file did not hold it. */
  get(id: number): [number, number] | null {
    const index = this.indexOf(id);
    if (index < 0 || this.found[index] === 0) return null;
    return [(this.lats[index] as number) / 1e7, (this.lons[index] as number) / 1e7];
  }
}
