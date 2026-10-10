/**
 * The counters behind RateLimitService, as an injectable port.
 *
 * Today they live in this process's memory, which is right while TREK runs
 * as one process; with several, each would count on its own and a client
 * could spread its attempts over them. A store shared between processes
 * replaces InMemoryRateLimitStore in RateLimitModule without touching the
 * service or its callers. Both methods return a promise, because such a
 * store lives in the database or on the network.
 */
export abstract class RateLimitStore {
  /**
   * Count one attempt by `key` in `bucket` at `now`. False when the key has
   * already used `max` attempts in the current `windowMs` window (the caller
   * answers 429), true otherwise.
   */
  abstract hit(bucket: string, key: string, max: number, windowMs: number, now: number): Promise<boolean>;
  /** Clear one bucket, or every bucket. */
  abstract reset(bucket?: string): Promise<void>;
}

interface Attempt {
  count: number;
  first: number;
}

/**
 * The current behaviour, ported 1:1 from the legacy auth route's
 * `rateLimiter`: each named bucket keeps its own attempt map.
 *
 * The legacy route ran a setInterval to garbage-collect expired records. There
 * is no timer here (a dangling one leaks in tests) but the housekeeping is
 * back as a lazy sweep driven by the `now` the caller already passes: keys are
 * per-IP and proxy-header derived, so without it a bucket grows for every
 * address that ever knocked and never shrinks again. An expired record is
 * treated as fresh by the window check below, so dropping it changes nothing
 * about who gets a 429.
 */
export class InMemoryRateLimitStore extends RateLimitStore {
  private readonly buckets = new Map<string, Map<string, Attempt>>();
  /** Last sweep per bucket, so a busy bucket doesn't keep a quiet one from being cleaned. */
  private readonly lastSweep = new Map<string, number>();

  hit(bucket: string, key: string, max: number, windowMs: number, now: number): Promise<boolean> {
    return Promise.resolve(this.count(bucket, key, max, windowMs, now));
  }

  reset(bucket?: string): Promise<void> {
    if (bucket) this.buckets.get(bucket)?.clear();
    else {
      this.buckets.clear();
      this.lastSweep.clear();
    }
    return Promise.resolve();
  }

  /** How many keys a bucket holds right now; the housekeeping is only visible here. */
  size(bucket: string): number {
    return this.buckets.get(bucket)?.size ?? 0;
  }

  /** The window check and the count, in one synchronous step so two hits cannot interleave. */
  private count(bucket: string, key: string, max: number, windowMs: number, now: number): boolean {
    const store = this.store(bucket);
    this.sweep(bucket, store, windowMs, now);
    const record = store.get(key);
    if (record && record.count >= max && now - record.first < windowMs) {
      return false;
    }
    if (!record || now - record.first >= windowMs) {
      store.set(key, { count: 1, first: now });
    } else {
      record.count++;
    }
    return true;
  }

  private store(bucket: string): Map<string, Attempt> {
    let s = this.buckets.get(bucket);
    if (!s) {
      s = new Map();
      this.buckets.set(bucket, s);
    }
    return s;
  }

  /** Drops records whose window has elapsed, at most once per window per bucket. */
  private sweep(bucket: string, store: Map<string, Attempt>, windowMs: number, now: number): void {
    if (now - (this.lastSweep.get(bucket) ?? 0) < windowMs) return;
    for (const [k, record] of store) {
      if (now - record.first >= windowMs) store.delete(k);
    }
    this.lastSweep.set(bucket, now);
  }
}
