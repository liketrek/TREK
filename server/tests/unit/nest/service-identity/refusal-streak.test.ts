/**
 * RefusalStreak: when the refusals of a key add up to giving it up. Three at
 * moments apart do; a burst counts once, and an acceptance starts over.
 */
import { RefusalStreak } from '../../../../src/nest/service-identity/refusal-streak';

import { describe, expect, it } from 'vitest';

const MINUTE = 60_000;

describe('RefusalStreak', () => {
  it('SISTREAK-001: completes on the third refusal ten minutes apart, then starts over', () => {
    const streak = new RefusalStreak();
    expect(streak.hit(0)).toBe(false);
    expect(streak.hit(10 * MINUTE)).toBe(false);
    expect(streak.hit(20 * MINUTE)).toBe(true);
    expect(streak.hit(30 * MINUTE)).toBe(false);
  });

  it('SISTREAK-002: refusals closer together than ten minutes are one', () => {
    const streak = new RefusalStreak();
    for (let i = 0; i < 9; i++) expect(streak.hit(i * MINUTE)).toBe(false);
    expect(streak.hit(10 * MINUTE)).toBe(false);
    expect(streak.hit(20 * MINUTE)).toBe(true);
  });

  it('SISTREAK-003: an acceptance clears what was counted', () => {
    const streak = new RefusalStreak();
    streak.hit(0);
    streak.hit(10 * MINUTE);
    streak.clear();
    expect(streak.hit(11 * MINUTE)).toBe(false);
    expect(streak.hit(21 * MINUTE)).toBe(false);
    expect(streak.hit(31 * MINUTE)).toBe(true);
  });
});
