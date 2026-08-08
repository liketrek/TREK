import { Injectable } from '@nestjs/common';

interface Attempt { count: number; first: number }

/**
 * In-memory per-IP rate limiter, ported 1:1 from the legacy auth route's
 * `rateLimiter`. Each named bucket keeps its own attempt map; `check` returns
 * false once a key exceeds `max` within `windowMs` (the caller answers 429).
 *
 * The legacy route also ran a setInterval to garbage-collect expired records;
 * that was pure memory housekeeping (the window check below already treats an
 * expired record as fresh), so it is intentionally omitted — the limit
 * behaviour is identical and there's no dangling timer to leak in tests.
 */
@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, Map<string, Attempt>>();

  private store(bucket: string): Map<string, Attempt> {
    let s = this.buckets.get(bucket);
    if (!s) { s = new Map(); this.buckets.set(bucket, s); }
    return s;
  }

  /** Returns true when the request is allowed, false when it should be rejected (429). */
  check(bucket: string, key: string, max: number, windowMs: number, now: number): boolean {
    const store = this.store(bucket);
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

  /** Test helper: clear a bucket (mirrors the legacy exported maps used for resets). */
  reset(bucket?: string): void {
    if (bucket) this.buckets.get(bucket)?.clear();
    else this.buckets.clear();
  }
}
