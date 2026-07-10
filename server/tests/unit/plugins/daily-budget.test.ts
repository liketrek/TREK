/**
 * Per-plugin daily broker budget (#plugins hardening): a per-kind daily counter
 * with a UTC-midnight rollover, clock injected so it tests without timers.
 */
import { describe, it, expect } from 'vitest';
import { DailyBudget } from '../../../src/nest/plugins/host/daily-budget';

const CFG = { aiPerDay: 3, notifyPerDay: 2 };
const t = (iso: string) => new Date(iso).getTime();

describe('DailyBudget', () => {
  it('allows up to the per-kind daily cap, then refuses', () => {
    const b = new DailyBudget(CFG, t('2026-07-10T09:00:00Z'));
    expect(b.take('ai', t('2026-07-10T09:00:00Z'))).toBe(true);
    expect(b.take('ai', t('2026-07-10T10:00:00Z'))).toBe(true);
    expect(b.take('ai', t('2026-07-10T11:00:00Z'))).toBe(true);
    expect(b.take('ai', t('2026-07-10T12:00:00Z'))).toBe(false); // ai cap 3 spent
    // notify is a separate budget, still available
    expect(b.take('notify', t('2026-07-10T12:00:00Z'))).toBe(true);
    expect(b.take('notify', t('2026-07-10T12:00:00Z'))).toBe(true);
    expect(b.take('notify', t('2026-07-10T12:00:00Z'))).toBe(false); // notify cap 2 spent
  });

  it('resets both counters at UTC midnight', () => {
    const b = new DailyBudget(CFG, t('2026-07-10T23:00:00Z'));
    expect(b.take('ai', t('2026-07-10T23:00:00Z'))).toBe(true);
    expect(b.take('ai', t('2026-07-10T23:30:00Z'))).toBe(true);
    expect(b.take('ai', t('2026-07-10T23:45:00Z'))).toBe(true);
    expect(b.take('ai', t('2026-07-10T23:59:00Z'))).toBe(false); // spent for the 10th
    expect(b.take('ai', t('2026-07-11T00:01:00Z'))).toBe(true);   // new UTC day -> reset
  });

  it('seeds today\'s already-spent counts so a restart continues the same day', () => {
    const b = new DailyBudget(CFG, t('2026-07-10T12:00:00Z'), { ai: 2, notify: 2 });
    expect(b.take('ai', t('2026-07-10T12:00:00Z'))).toBe(true);   // 3rd ai
    expect(b.take('ai', t('2026-07-10T12:00:00Z'))).toBe(false);  // cap already reached
    expect(b.take('notify', t('2026-07-10T12:00:00Z'))).toBe(false); // seeded at cap
  });

  it('reports usage for the admin view', () => {
    const b = new DailyBudget(CFG, t('2026-07-10T12:00:00Z'), { ai: 1 });
    b.take('ai', t('2026-07-10T12:00:00Z'));
    expect(b.used(t('2026-07-10T12:00:00Z'))).toMatchObject({ ai: 2, aiMax: 3, notify: 0, notifyMax: 2 });
  });
});
