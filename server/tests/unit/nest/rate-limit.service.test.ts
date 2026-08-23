/**
 * RateLimitService — the per-IP buckets every auth-adjacent route throttles on.
 * The limit behaviour is the legacy one line for line; what is worth pinning
 * here is that the maps do not grow forever, because the keys come from
 * proxy headers and are therefore attacker-influenced.
 */
import { describe, it, expect } from 'vitest';
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';

const WINDOW = 15 * 60 * 1000;

/** The private bucket map, which is the only place the housekeeping is visible. */
function bucketSize(service: RateLimitService, bucket: string): number {
  const buckets = (service as unknown as { buckets: Map<string, Map<string, unknown>> }).buckets;
  return buckets.get(bucket)?.size ?? 0;
}

describe('RateLimitService', () => {
  it('allows up to max attempts in a window, then refuses', () => {
    const s = new RateLimitService();
    const now = Date.now();
    for (let i = 0; i < 5; i++) expect(s.check('login', '1.2.3.4', 5, WINDOW, now)).toBe(true);
    expect(s.check('login', '1.2.3.4', 5, WINDOW, now)).toBe(false);
  });

  it('starts a fresh window once the old one elapsed', () => {
    const s = new RateLimitService();
    const now = Date.now();
    for (let i = 0; i < 5; i++) s.check('login', '1.2.3.4', 5, WINDOW, now);
    expect(s.check('login', '1.2.3.4', 5, WINDOW, now + WINDOW)).toBe(true);
  });

  it('drops expired records instead of keeping one per address that ever knocked', () => {
    const s = new RateLimitService();
    const now = Date.now();
    for (let i = 0; i < 100; i++) s.check('login', `10.0.0.${i}`, 5, WINDOW, now);
    expect(bucketSize(s, 'login')).toBe(100);

    // One request a window later sweeps the hundred stale keys and leaves its own.
    s.check('login', '10.0.0.0', 5, WINDOW, now + WINDOW);
    expect(bucketSize(s, 'login')).toBe(1);
  });

  it('sweeps each bucket on its own clock, so a busy bucket cannot starve a quiet one', () => {
    const s = new RateLimitService();
    const now = Date.now();
    s.check('login', '1.2.3.4', 5, WINDOW, now);
    for (let i = 0; i < 3; i++) s.check('mfa', `10.0.0.${i}`, 5, WINDOW, now + WINDOW * (i + 1));
    expect(bucketSize(s, 'login')).toBe(1);

    s.check('login', '5.6.7.8', 5, WINDOW, now + WINDOW);
    expect(bucketSize(s, 'login')).toBe(1);
  });

  it('keeps a record that is still inside its window when the sweep runs', () => {
    const s = new RateLimitService();
    const now = Date.now();
    s.check('login', '1.2.3.4', 5, WINDOW, now);
    s.check('login', '5.6.7.8', 5, WINDOW, now + WINDOW);
    // The second key was written after the sweep, the first one was expired.
    expect(bucketSize(s, 'login')).toBe(1);
    expect(s.check('login', '1.2.3.4', 5, WINDOW, now + WINDOW)).toBe(true);
  });

  it('reset clears a single bucket, or all of them', () => {
    const s = new RateLimitService();
    const now = Date.now();
    s.check('login', '1.2.3.4', 5, WINDOW, now);
    s.check('mfa', '1.2.3.4', 5, WINDOW, now);
    s.reset('login');
    expect(bucketSize(s, 'login')).toBe(0);
    expect(bucketSize(s, 'mfa')).toBe(1);
    s.reset();
    expect(bucketSize(s, 'mfa')).toBe(0);
  });
});
