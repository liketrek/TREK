/**
 * Per-plugin RPC rate limiter (#plugins hardening): a token bucket + an in-flight
 * gauge, clock injected so it tests without timers.
 */
import { describe, it, expect } from 'vitest';
import { TokenBucket, RpcRateLimiter } from '../../../src/nest/plugins/host/rate-limit';

describe('TokenBucket', () => {
  it('allows a burst up to capacity, then throttles until it refills', () => {
    const b = new TokenBucket(3, 1, 0); // 3 burst, 1/sec
    expect(b.take(0)).toBe(true);
    expect(b.take(0)).toBe(true);
    expect(b.take(0)).toBe(true);
    expect(b.take(0)).toBe(false); // burst spent
    // 1s later one token has refilled
    expect(b.take(1000)).toBe(true);
    expect(b.take(1000)).toBe(false);
  });

  it('never refills above capacity even after a long idle', () => {
    const b = new TokenBucket(2, 5, 0);
    // idle 10s would add 50 tokens uncapped — must cap at 2
    expect(b.take(10_000)).toBe(true);
    expect(b.take(10_000)).toBe(true);
    expect(b.take(10_000)).toBe(false);
  });
});

describe('RpcRateLimiter', () => {
  it('rate-limits via the bucket and reserves/releases in-flight slots', () => {
    const l = new RpcRateLimiter({ burst: 2, perSec: 1, maxInFlight: 5 }, 0);
    expect(l.tryAcquire(0)).toBe(true);
    expect(l.tryAcquire(0)).toBe(true);
    expect(l.tryAcquire(0)).toBe(false); // bucket empty
  });

  it('caps concurrency independently of the token bucket', () => {
    const l = new RpcRateLimiter({ burst: 100, perSec: 100, maxInFlight: 2 }, 0);
    expect(l.tryAcquire(0)).toBe(true); // in-flight 1
    expect(l.tryAcquire(0)).toBe(true); // in-flight 2
    expect(l.tryAcquire(0)).toBe(false); // concurrency cap hit despite tokens left
    l.release();                         // in-flight 1
    expect(l.tryAcquire(0)).toBe(true);  // slot freed
  });

  it('release never underflows below zero', () => {
    const l = new RpcRateLimiter({ burst: 1, perSec: 1, maxInFlight: 1 }, 0);
    l.release(); l.release(); // no-op when nothing is in flight
    expect(l.tryAcquire(0)).toBe(true);
  });
});
