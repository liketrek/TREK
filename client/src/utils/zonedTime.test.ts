import { describe, expect, it } from 'vitest';

import { zonedInstant } from './zonedTime';

describe('zonedInstant', () => {
  it('reads a wall-clock time in its own zone', () => {
    // NZDT is UTC+13 and PST UTC-8 in late November.
    expect(zonedInstant('2026-11-20T20:20', 'Pacific/Auckland')).toBe(Date.UTC(2026, 10, 20, 7, 20));
    expect(zonedInstant('2026-11-20T17:00', 'America/Los_Angeles')).toBe(Date.UTC(2026, 10, 21, 1, 0));
  });

  it('puts the Auckland departure before the Los Angeles one of the same date (#2929)', () => {
    const fromAuckland = zonedInstant('2026-11-20T20:20', 'Pacific/Auckland') as number;
    const fromLosAngeles = zonedInstant('2026-11-20T17:00', 'America/Los_Angeles') as number;
    expect(fromAuckland).toBeLessThan(fromLosAngeles);
  });

  it('follows daylight saving time', () => {
    expect(zonedInstant('2026-07-01T12:00', 'Europe/Berlin')).toBe(Date.UTC(2026, 6, 1, 10, 0));
    expect(zonedInstant('2026-01-01T12:00', 'Europe/Berlin')).toBe(Date.UTC(2026, 0, 1, 11, 0));
  });

  it('accepts a time with seconds', () => {
    expect(zonedInstant('2026-01-01T12:00:00', 'UTC')).toBe(Date.UTC(2026, 0, 1, 12, 0));
  });

  it('names no instant without a date or a zone', () => {
    expect(zonedInstant('17:00', 'America/Los_Angeles')).toBeNull();
    expect(zonedInstant('2026-11-20T17:00', null)).toBeNull();
    expect(zonedInstant('2026-11-20T17:00', '')).toBeNull();
    expect(zonedInstant(null, 'America/Los_Angeles')).toBeNull();
  });

  it('names no instant for an unknown zone', () => {
    expect(zonedInstant('2026-11-20T17:00', 'Not/AZone')).toBeNull();
  });
});
