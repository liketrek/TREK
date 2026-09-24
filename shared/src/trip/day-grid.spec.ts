import {
  type DayGridDay,
  type DayGridStay,
  addIsoDays,
  nextTripDate,
  planDatedAppend,
  planDayGrid,
  resolveDayGridRange,
} from './day-grid';
import { MAX_TRIP_DAYS } from './trip.schema';

import { describe, expect, it } from 'vitest';

describe('addIsoDays', () => {
  it('steps over the ends of months and years, and back', () => {
    expect(addIsoDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addIsoDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addIsoDays('2027-01-01', -1)).toBe('2026-12-31');
    expect(addIsoDays('2026-06-07', 0)).toBe('2026-06-07');
  });

  it('knows the leap day, and a year without one', () => {
    expect(addIsoDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addIsoDays('2028-02-29', 1)).toBe('2028-03-01');
    expect(addIsoDays('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('counts calendar days across a daylight saving change', () => {
    // Europe moves its clocks on these Sundays; a local-time step would slip a day.
    expect(addIsoDays('2026-03-28', 2)).toBe('2026-03-30');
    expect(addIsoDays('2026-10-24', 2)).toBe('2026-10-26');
  });
});

describe('nextTripDate', () => {
  it('is the day after the end date when no day lies beyond it', () => {
    expect(nextTripDate('2026-10-12', ['2026-10-10', '2026-10-11', '2026-10-12', null])).toBe('2026-10-13');
    expect(nextTripDate('2026-10-12', [])).toBe('2026-10-13');
  });

  it('is the day after the latest day date when that lies past the end date', () => {
    expect(nextTripDate('2026-10-12', ['2026-10-12', '2026-10-15', undefined, '2026-10-14'])).toBe('2026-10-16');
  });

  it('is null for a trip without an end date', () => {
    expect(nextTripDate(null, ['2026-10-12'])).toBeNull();
    expect(nextTripDate(undefined, [])).toBeNull();
    expect(nextTripDate('', [])).toBeNull();
  });
});

describe('planDatedAppend', () => {
  it('gives the next date and lets the trip grow to it', () => {
    expect(planDatedAppend({ start_date: '2026-10-10', end_date: '2026-10-12' }, ['2026-10-12'])).toEqual({
      date: '2026-10-13',
      fits: true,
    });
  });

  it('refuses nothing up to the day limit and the day past it', () => {
    const start = '2026-01-01';
    const lastAllowed = addIsoDays(start, MAX_TRIP_DAYS - 1);
    expect(planDatedAppend({ start_date: start, end_date: addIsoDays(lastAllowed, -1) }, [])).toEqual({
      date: lastAllowed,
      fits: true,
    });
    expect(planDatedAppend({ start_date: start, end_date: lastAllowed }, [])).toEqual({
      date: addIsoDays(lastAllowed, 1),
      fits: false,
    });
  });

  it('has nothing to plan for a trip missing either date', () => {
    expect(planDatedAppend({ start_date: null, end_date: '2026-10-12' }, [])).toBeNull();
    expect(planDatedAppend({ start_date: '2026-10-10', end_date: null }, [])).toBeNull();
    expect(planDatedAppend({}, ['2026-10-10'])).toBeNull();
  });
});

describe('resolveDayGridRange', () => {
  const dated = { start_date: '2026-10-01', end_date: '2026-10-10' };

  it('keeps a stored date the update leaves out, and clears one it sends as null', () => {
    expect(resolveDayGridRange(dated, { end_date: '2026-10-08' })).toEqual({
      newStart: '2026-10-01',
      newEnd: '2026-10-08',
      dayCount: undefined,
      regenerate: true,
    });
    expect(resolveDayGridRange(dated, { start_date: null, end_date: null })).toMatchObject({
      newStart: null,
      newEnd: null,
      regenerate: true,
    });
  });

  it('rebuilds nothing when the dates stay and no day count comes', () => {
    expect(resolveDayGridRange(dated, {}).regenerate).toBe(false);
    expect(resolveDayGridRange(dated, { ...dated }).regenerate).toBe(false);
    const undated = { start_date: null, end_date: null };
    expect(resolveDayGridRange(undated, { ...undated }).regenerate).toBe(false);
  });

  it('rebuilds on any day count, held to 1..MAX_TRIP_DAYS, and reads 0 or null as none', () => {
    const undated = { start_date: null, end_date: null };
    expect(resolveDayGridRange(undated, { day_count: 5 })).toMatchObject({ dayCount: 5, regenerate: true });
    expect(resolveDayGridRange(undated, { day_count: MAX_TRIP_DAYS + 5 }).dayCount).toBe(MAX_TRIP_DAYS);
    expect(resolveDayGridRange(undated, { day_count: -3 }).dayCount).toBe(1);
    expect(resolveDayGridRange(undated, { day_count: 0 })).toMatchObject({ dayCount: undefined, regenerate: false });
    expect(resolveDayGridRange(undated, { day_count: null })).toMatchObject({ dayCount: undefined, regenerate: false });
  });
});

describe('planDayGrid', () => {
  // The trip of the plan: Oct 1 to 10 with a day each (ids 1 to 10), then two
  // days without a date: 11 is empty, 12 has a place on it.
  const tenDays: DayGridDay[] = [
    ...Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      day_number: i + 1,
      date: addIsoDays('2026-10-01', i),
      hasPlanItems: true,
    })),
    { id: 11, day_number: 11, date: null, hasPlanItems: false },
    { id: 12, day_number: 12, date: null, hasPlanItems: true },
  ];
  const plan = (startDate: string | null, endDate: string | null, stays: DayGridStay[] = []) =>
    planDayGrid({ days: tenDays, stays, startDate, endDate });
  const ids = (p: ReturnType<typeof plan>) => p.rows.map((r) => r.id);
  const gone = (p: ReturnType<typeof plan>) => p.removed.map((r) => `${r.id}:${r.reason}`);

  it('an earlier end takes the last days with everything on them, and the empty spare day', () => {
    const p = plan('2026-10-01', '2026-10-08');
    expect(ids(p)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 12]);
    expect(p.rows.at(-2)).toEqual({ id: 8, date: '2026-10-08' });
    expect(p.rows.at(-1)).toEqual({ id: 12, date: null });
    expect(gone(p)).toEqual(['9:overflow', '10:overflow', '11:spare']);
    expect(p.removed[0]).toEqual({ id: 9, day_number: 9, date: '2026-10-09', reason: 'overflow' });
  });

  it('a later start and the same end still takes the last days, the plans move with the dates', () => {
    const p = plan('2026-10-03', '2026-10-10');
    expect(p.rows.slice(0, 8)).toEqual(
      Array.from({ length: 8 }, (_, i) => ({ id: i + 1, date: addIsoDays('2026-10-03', i) })),
    );
    expect(gone(p)).toEqual(['9:overflow', '10:overflow', '11:spare']);
  });

  it('moving the whole range keeps every dated day and drops only the empty spare day', () => {
    const p = plan('2026-10-05', '2026-10-14');
    expect(ids(p)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]);
    expect(p.rows[9]).toEqual({ id: 10, date: '2026-10-14' });
    expect(gone(p)).toEqual(['11:spare']);
  });

  it('a later end dates the first spare day and removes nothing', () => {
    const p = plan('2026-10-01', '2026-10-11');
    expect(p.rows.slice(9)).toEqual([
      { id: 10, date: '2026-10-10' },
      { id: 11, date: '2026-10-11' },
      { id: 12, date: null },
    ]);
    expect(p.removed).toEqual([]);
  });

  it('a range longer than all days adds new empty days after the spare ones', () => {
    const p = plan('2026-10-01', '2026-10-14');
    expect(ids(p)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, null, null]);
    expect(p.rows.at(-1)).toEqual({ id: null, date: '2026-10-14' });
    expect(p.removed).toEqual([]);
  });

  it('clearing the dates without a count keeps every day and takes all dates away', () => {
    const p = plan(null, null);
    expect(ids(p)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(p.rows.every((r) => r.date === null)).toBe(true);
    expect(p.removed).toEqual([]);
  });

  it('a stay from a removed day to a spare day goes with the removed day, so the spare day is empty', () => {
    const p = plan('2026-10-01', '2026-10-09', [{ start_day_id: 10, end_day_id: 11 }]);
    expect(gone(p)).toEqual(['10:overflow', '11:spare']);
  });

  it('a stay that stands keeps the spare day it checks out on', () => {
    const p = plan('2026-10-01', '2026-10-09', [{ start_day_id: 9, end_day_id: 11 }]);
    expect(gone(p)).toEqual(['10:overflow']);
    expect(ids(p).slice(-2)).toEqual([11, 12]);
  });

  it('reads the order from the day numbers, whatever order the rows come in', () => {
    const shuffled = [tenDays[4]!, tenDays[11]!, tenDays[0]!, tenDays[9]!, tenDays[10]!];
    const p = planDayGrid({ days: shuffled, stays: [], startDate: '2026-11-01', endDate: '2026-11-02' });
    expect(p.rows).toEqual([
      { id: 1, date: '2026-11-01' },
      { id: 5, date: '2026-11-02' },
      { id: 12, date: null },
    ]);
    expect(gone(p)).toEqual(['10:overflow', '11:spare']);
  });

  describe('without dates', () => {
    const undated = (n: number, planned: number[] = [], stays: DayGridStay[] = [], dayCount?: number) =>
      planDayGrid({
        days: Array.from({ length: n }, (_, i) => ({
          id: i + 1,
          day_number: i + 1,
          date: i < 2 ? '2026-10-01' : null,
          hasPlanItems: planned.includes(i + 1),
        })),
        stays,
        startDate: null,
        endDate: null,
        dayCount,
      });

    it('trims to the count from the back, and only empty days', () => {
      const p = undated(6, [5, 6], [{ start_day_id: 3, end_day_id: 3 }], 2);
      expect(p.removed.map((r) => r.id)).toEqual([4, 2, 1]);
      expect(p.removed.every((r) => r.reason === 'spare')).toBe(true);
      expect(p.rows).toEqual([
        { id: 3, date: null },
        { id: 5, date: null },
        { id: 6, date: null },
      ]);
      expect(p.removed.at(-1)).toMatchObject({ id: 1, date: '2026-10-01' });
    });

    it('adds empty days up to the count, and seven for a trip that has none', () => {
      expect(undated(2, [], [], 4).rows).toEqual([
        { id: 1, date: null },
        { id: 2, date: null },
        { id: null, date: null },
        { id: null, date: null },
      ]);
      expect(undated(0).rows).toHaveLength(7);
      expect(undated(3, [], [], MAX_TRIP_DAYS + 1).rows).toHaveLength(MAX_TRIP_DAYS);
    });
  });
});
