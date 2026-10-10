/**
 * RateLimitService — the per-IP buckets every auth-adjacent route throttles on.
 * The limit behaviour is the legacy one line for line; what is worth pinning
 * here is that the maps do not grow forever, because the keys come from
 * proxy headers and are therefore attacker-influenced.
 */
import { RateLimitService } from '../../../src/nest/common/rate-limit.service';
import { InMemoryRateLimitStore } from '../../../src/nest/common/rate-limit.store';

import { describe, it, expect } from 'vitest';

const WINDOW = 15 * 60 * 1000;

/** The in-memory store's bucket size, which is the only place the housekeeping is visible. */
function bucketSize(service: RateLimitService, bucket: string): number {
  const store = (service as unknown as { store: InMemoryRateLimitStore }).store;
  return store.size(bucket);
}

describe('RateLimitService', () => {
  it('allows up to max attempts in a window, then refuses', async () => {
    const s = new RateLimitService();
    const now = Date.now();
    for (let i = 0; i < 5; i++) expect(await s.check('login', '1.2.3.4', 5, WINDOW, now)).toBe(true);
    expect(await s.check('login', '1.2.3.4', 5, WINDOW, now)).toBe(false);
  });

  it('starts a fresh window once the old one elapsed', async () => {
    const s = new RateLimitService();
    const now = Date.now();
    for (let i = 0; i < 5; i++) await s.check('login', '1.2.3.4', 5, WINDOW, now);
    expect(await s.check('login', '1.2.3.4', 5, WINDOW, now + WINDOW)).toBe(true);
  });

  it('drops expired records instead of keeping one per address that ever knocked', async () => {
    const s = new RateLimitService();
    const now = Date.now();
    for (let i = 0; i < 100; i++) await s.check('login', `10.0.0.${i}`, 5, WINDOW, now);
    expect(bucketSize(s, 'login')).toBe(100);

    // One request a window later sweeps the hundred stale keys and leaves its own.
    await s.check('login', '10.0.0.0', 5, WINDOW, now + WINDOW);
    expect(bucketSize(s, 'login')).toBe(1);
  });

  it('sweeps each bucket on its own clock, so a busy bucket cannot starve a quiet one', async () => {
    const s = new RateLimitService();
    const now = Date.now();
    await s.check('login', '1.2.3.4', 5, WINDOW, now);
    for (let i = 0; i < 3; i++) await s.check('mfa', `10.0.0.${i}`, 5, WINDOW, now + WINDOW * (i + 1));
    expect(bucketSize(s, 'login')).toBe(1);

    await s.check('login', '5.6.7.8', 5, WINDOW, now + WINDOW);
    expect(bucketSize(s, 'login')).toBe(1);
  });

  it('keeps a record that is still inside its window when the sweep runs', async () => {
    const s = new RateLimitService();
    const now = Date.now();
    await s.check('login', '1.2.3.4', 5, WINDOW, now);
    await s.check('login', '5.6.7.8', 5, WINDOW, now + WINDOW);
    // The second key was written after the sweep, the first one was expired.
    expect(bucketSize(s, 'login')).toBe(1);
    expect(await s.check('login', '1.2.3.4', 5, WINDOW, now + WINDOW)).toBe(true);
  });

  it('reset clears a single bucket, or all of them', async () => {
    const s = new RateLimitService();
    const now = Date.now();
    await s.check('login', '1.2.3.4', 5, WINDOW, now);
    await s.check('mfa', '1.2.3.4', 5, WINDOW, now);
    await s.reset('login');
    expect(bucketSize(s, 'login')).toBe(0);
    expect(bucketSize(s, 'mfa')).toBe(1);
    await s.reset();
    expect(bucketSize(s, 'mfa')).toBe(0);
  });
});
