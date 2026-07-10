/**
 * Per-plugin daily broker budget (#plugins hardening): a per-kind daily counter
 * with a UTC-midnight rollover, clock injected so it tests without timers.
 */
import { describe, it, expect } from 'vitest';
import { DailyBudget, envCap } from '../../../src/nest/plugins/host/daily-budget';

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

  it('a cap of 0 disables the broker entirely (take always refuses)', () => {
    const b = new DailyBudget({ aiPerDay: 0, notifyPerDay: 5 }, t('2026-07-10T12:00:00Z'));
    expect(b.take('ai', t('2026-07-10T12:00:00Z'))).toBe(false);   // 0 means off, not unlimited
    expect(b.take('notify', t('2026-07-10T12:00:00Z'))).toBe(true);
  });

  it('envCap honours a literal 0 and only falls back on absent/malformed values', () => {
    const KEY = 'TREK_TEST_CAP_XYZ';
    delete process.env[KEY];
    expect(envCap(KEY, 200)).toBe(200);      // absent -> default
    process.env[KEY] = '0';
    expect(envCap(KEY, 200)).toBe(0);        // literal 0 honoured (would have been 200 with `|| def`)
    process.env[KEY] = '50';
    expect(envCap(KEY, 200)).toBe(50);
    process.env[KEY] = 'nonsense';
    expect(envCap(KEY, 200)).toBe(200);      // malformed -> default
    process.env[KEY] = '-5';
    expect(envCap(KEY, 200)).toBe(200);      // negative -> default
    delete process.env[KEY];
  });
});
