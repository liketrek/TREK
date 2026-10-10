import { InMemoryRateLimitStore, RateLimitStore } from './rate-limit.store';
import { Injectable } from '@nestjs/common';

/**
 * Per-IP rate limiting for the auth-adjacent routes. `check` resolves false
 * once a key exceeds `max` within `windowMs` (the caller answers 429).
 *
 * The counting lives in an injected RateLimitStore. RateLimitModule provides
 * the in-memory one; a hand-built service (the no-Nest test harnesses) gets
 * its own in-memory store, exactly as it got its own maps before.
 */
@Injectable()
export class RateLimitService {
  constructor(private readonly store: RateLimitStore = new InMemoryRateLimitStore()) {}

  /** Resolves true when the request is allowed, false when it should be rejected (429). */
  check(bucket: string, key: string, max: number, windowMs: number, now: number): Promise<boolean> {
    return this.store.hit(bucket, key, max, windowMs, now);
  }

  /** Test helper: clear a bucket (mirrors the legacy exported maps used for resets). */
  reset(bucket?: string): Promise<void> {
    return this.store.reset(bucket);
  }
}
