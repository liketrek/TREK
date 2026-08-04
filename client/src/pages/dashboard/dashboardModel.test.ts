import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { daysUntil, getTripStatus, sortTrips, MS_PER_DAY, type DashboardTrip } from './dashboardModel';

// FE-HOOK-DASHMODEL-001 onwards

const trip = (over: Partial<DashboardTrip>): DashboardTrip =>
  ({ id: 1, title: 't', ...over }) as unknown as DashboardTrip;

const offset = (days: number): string => {
  const d = new Date('2026-07-15T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-15T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('daysUntil', () => {
  it('FE-HOOK-DASHMODEL-001: has no answer without a date', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(undefined)).toBeNull();
  });

  it('FE-HOOK-DASHMODEL-002: counts forwards and backwards from today', () => {
    expect(daysUntil(offset(0))).toBe(0);
    expect(daysUntil(offset(5))).toBe(5);
    expect(daysUntil(offset(-3))).toBe(-3);
  });
});

describe('getTripStatus', () => {
  it('FE-HOOK-DASHMODEL-003: a date range around today is ongoing', () => {
    expect(getTripStatus(trip({ start_date: offset(-2), end_date: offset(2) }))).toBe('ongoing');
  });

  it('FE-HOOK-DASHMODEL-004: a trip without a start date has no status', () => {
    expect(getTripStatus(trip({ start_date: null, end_date: null }))).toBeNull();
  });

  it.each([
    [0, 'today'],
    [1, 'tomorrow'],
    [9, 'future'],
    [-9, 'past'],
  ] as Array<[number, string]>)('FE-HOOK-DASHMODEL-005: a start in %s days is %s', (days, status) => {
    // No end date, so the "ongoing" rule cannot swallow the start-relative states.
    expect(getTripStatus(trip({ start_date: offset(days), end_date: null }))).toBe(status);
  });

  it('FE-HOOK-DASHMODEL-010: a finished date range is past', () => {
    expect(getTripStatus(trip({ start_date: offset(-9), end_date: offset(-8) }))).toBe('past');
  });
});

describe('sortTrips', () => {
  it('FE-HOOK-DASHMODEL-006: running first, then upcoming ascending, then finished descending', () => {
    const sorted = sortTrips([
      trip({ id: 1, start_date: offset(-40), end_date: offset(-30) }),
      trip({ id: 2, start_date: offset(20), end_date: offset(25) }),
      trip({ id: 3, start_date: offset(-1), end_date: offset(3) }),
      trip({ id: 4, start_date: offset(5), end_date: offset(8) }),
      trip({ id: 5, start_date: offset(-10), end_date: offset(-8) }),
    ]);

    expect(sorted.map(t => t.id)).toEqual([3, 4, 2, 5, 1]);
  });

  it('FE-HOOK-DASHMODEL-007: leaves the input array untouched', () => {
    const input = [trip({ id: 1, start_date: offset(10) }), trip({ id: 2, start_date: offset(1) })];

    const sorted = sortTrips(input);

    expect(input.map(t => t.id)).toEqual([1, 2]);
    expect(sorted.map(t => t.id)).toEqual([2, 1]);
  });

  it('FE-HOOK-DASHMODEL-008: dateless trips rank last', () => {
    const sorted = sortTrips([
      trip({ id: 1, start_date: null, end_date: null }),
      trip({ id: 2, start_date: offset(4), end_date: offset(6) }),
    ]);

    expect(sorted.map(t => t.id)).toEqual([2, 1]);
  });
});

describe('MS_PER_DAY', () => {
  it('FE-HOOK-DASHMODEL-009: is one day in milliseconds', () => {
    expect(MS_PER_DAY).toBe(24 * 60 * 60 * 1000);
  });
});
