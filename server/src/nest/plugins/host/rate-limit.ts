/**
 * Per-plugin RPC rate limiting (#plugins, security hardening).
 *
 * Every ctx.* call a plugin makes is dispatched synchronously IN THE HOST process
 * (better-sqlite3 + the capability router run on the single Node thread), so a
 * plugin in a tight `while (true) ctx.db.query(...)` loop can starve the whole
 * instance — including the supervisor's own reap sweep. A token bucket at the
 * dispatch boundary caps the sustained call rate (with a burst allowance) and an
 * in-flight counter caps concurrency, turning "one plugin freezes TREK for every
 * tenant" into "that one plugin gets throttled".
 *
 * Pure + dependency-free (a clock is injected) so it unit-tests without timers.
 */

/** A refilling token bucket: `capacity` tokens, refilled at `refillPerSec`. */
export class TokenBucket {
  private tokens: number;
  private last: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
    now: number,
  ) {
    this.tokens = capacity;
    this.last = now;
  }

  /** Take one token if available. Returns false when the bucket is empty (throttle). */
  take(now: number): boolean {
    // Refill for the elapsed time, capped at capacity.
    const elapsedSec = Math.max(0, (now - this.last) / 1000);
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSec);
    this.last = now;
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

export interface RpcLimitConfig {
  /** Bucket capacity = burst allowance (calls that can fire back-to-back). */
  burst: number;
  /** Sustained calls per second once the burst is spent. */
  perSec: number;
  /** Max host→plugin dispatches in flight for one plugin at once. */
  maxInFlight: number;
}

// Generous defaults: a legitimate plugin handling a request makes a handful of ctx
// calls; these only bite a runaway loop. Overridable via env for tuning.
export const DEFAULT_RPC_LIMIT: RpcLimitConfig = {
  burst: Number(process.env.TREK_PLUGIN_RPC_BURST) || 60,
  perSec: Number(process.env.TREK_PLUGIN_RPC_PER_SEC) || 20,
  maxInFlight: Number(process.env.TREK_PLUGIN_RPC_INFLIGHT) || 16,
};

// Plugin log volume (ctx.log.*, stdout/stderr, unknown evt topics) reaches the
// host's synchronous error-log INSERT+prune, and — unlike ctx.* calls — bypasses
// the RpcRateLimiter above. A separate, generous bucket throttles it so a
// `while (true) ctx.log.error(...)` loop can't pin the host thread; a legitimate
// plugin logs far below this and never notices. Excess lines are dropped.
export const DEFAULT_LOG_LIMIT = {
  burst: Number(process.env.TREK_PLUGIN_LOG_BURST) || 50,
  perSec: Number(process.env.TREK_PLUGIN_LOG_PER_SEC) || 10,
};

/** Per-plugin limiter: a token bucket + an in-flight gauge. */
export class RpcRateLimiter {
  private readonly bucket: TokenBucket;
  private inFlight = 0;

  constructor(private readonly cfg: RpcLimitConfig, now: number) {
    this.bucket = new TokenBucket(cfg.burst, cfg.perSec, now);
  }

  /** True if a call may proceed now (and reserves an in-flight slot). Call `release()`
   * when the dispatch settles. Returns false when rate- or concurrency-capped. */
  tryAcquire(now: number): boolean {
    if (this.inFlight >= this.cfg.maxInFlight) return false;
    if (!this.bucket.take(now)) return false;
    this.inFlight += 1;
    return true;
  }

  release(): void {
    if (this.inFlight > 0) this.inFlight -= 1;
  }
}
