import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  daysUntil,
  getDepartureTransport,
  getTripStatus,
  localIsoToday,
  sortTrips,
  zonedLocalDateTimeToEpoch,
} from './dashboardModel';

/**
 * The dashboard classifies trips against the user's WALL CLOCK — `daysUntil`
 * always did (it parses dates as local midnight). But the "ongoing" check and
 * the sort ranking derived "today" from `toISOString()`, which is UTC — so in
 * any non-UTC timezone, between local midnight and the UTC rollover, a trip
 * that ended yesterday still ranked as "running" and a trip starting today
 * wasn't "ongoing". These tests pin the clock inside that window (00:30 local).
 * On a UTC machine local == UTC and the old bug is unobservable, so the
 * regression cases below are vacuous there — they bite on any offset TZ.
 */
describe('dashboardModel — "today" is the user\'s local date', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Local 2026-08-25 00:30 — for any TZ ahead of UTC, the UTC date is still 08-24.
    vi.setSystemTime(new Date(2026, 7, 25, 0, 30));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('localIsoToday() is the local calendar date, not the UTC one', () => {
    expect(localIsoToday()).toBe('2026-08-25');
  });

  it('daysUntil counts from local midnight', () => {
    expect(daysUntil('2026-08-25')).toBe(0);
    expect(daysUntil('2026-08-26')).toBe(1);
    expect(daysUntil('2026-08-24')).toBe(-1);
    expect(daysUntil(null)).toBeNull();
  });

  it('a trip spanning the local today is ongoing', () => {
    expect(getTripStatus({ start_date: '2026-08-25', end_date: '2026-08-26' } as never)).toBe('ongoing');
  });

  it('a trip starting on the local today (no end) is "today"', () => {
    expect(getTripStatus({ start_date: '2026-08-25', end_date: null } as never)).toBe('today');
  });

  it('a trip that ended yesterday (local) is past — and sorts after one starting today', () => {
    expect(getTripStatus({ start_date: '2026-08-20', end_date: '2026-08-24' } as never)).toBe('past');

    const endedYesterday = { id: 1, start_date: '2026-08-20', end_date: '2026-08-24' };
    const startsToday = { id: 2, start_date: '2026-08-25', end_date: '2026-08-26' };
    const sorted = sortTrips([endedYesterday, startsToday] as never[]);
    expect(sorted.map((t: { id: number }) => t.id)).toEqual([2, 1]);
  });
});

describe('dashboardModel — departure transport countdown', () => {
  const booking = (over: Record<string, unknown>) =>
    ({
      id: 1,
      title: 'Flight CX1',
      type: 'flight',
      status: 'confirmed',
      reservation_time: null,
      endpoints: [
        {
          role: 'from',
          sequence: 0,
          local_date: '2026-10-01',
          local_time: '09:30',
          timezone: 'Asia/Hong_Kong',
          lat: 22.3,
          lng: 114.2,
        },
      ],
      ...over,
    }) as never;

  it('resolves the first fully timed non-cancelled transport in its origin timezone', () => {
    const now = Date.parse('2026-09-30T00:00:00Z');
    const result = getDepartureTransport([booking({})], [], now);
    expect(result).toMatchObject({ reservationId: 1, localTime: '09:30', timeZone: 'Asia/Hong_Kong' });
    expect(result!.departureAt).toBe(Date.parse('2026-10-01T01:30:00Z'));
  });

  it('does not silently replace an incomplete first transport with a later one', () => {
    const first = booking({
      id: 1,
      endpoints: [
        { role: 'from', sequence: 0, local_date: '2026-10-01', local_time: null, timezone: 'Asia/Hong_Kong' },
      ],
    });
    const later = booking({
      id: 2,
      endpoints: [
        { role: 'from', sequence: 0, local_date: '2026-10-02', local_time: '10:00', timezone: 'Asia/Hong_Kong' },
      ],
    });
    expect(getDepartureTransport([later, first], [], Date.parse('2026-09-30T00:00:00Z'))).toBeNull();
  });

  it('ignores a cancelled transport and rejects a DST gap', () => {
    const cancelled = booking({ id: 1, status: 'cancelled' });
    const active = booking({ id: 2 });
    expect(getDepartureTransport([cancelled, active], [], Date.parse('2026-09-30T00:00:00Z'))?.reservationId).toBe(2);
    expect(zonedLocalDateTimeToEpoch('2026-03-29', '02:30', 'Europe/Berlin')).toBeNull();
  });
});
