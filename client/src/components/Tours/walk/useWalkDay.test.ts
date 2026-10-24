// CW-02, CW-04: the day a city walk's times are shown for. Opened from one of
// its days that day holds; otherwise the first with a start time, or the one
// picked, and another walk starts over.
import { describe, expect, it } from 'vitest';
import { buildAssignment, buildDay, buildPlace } from '../../../../tests/helpers/factories';
import { act, renderHook } from '../../../../tests/helpers/render';
import type { AssignmentsMap, Day } from '../../../types';
import { useWalkDay } from './useWalkDay';

const one = buildDay({ id: 1, date: '2026-10-19' });
const two = buildDay({ id: 2, date: '2026-10-20' });
const three = buildDay({ id: 3, date: '2026-10-21' });
const days: Day[] = [one, two, three];

const entry = (dayId: number, placeId: number, time: string | null, placeTime: string | null = null) =>
  buildAssignment({
    day_id: dayId,
    place_id: placeId,
    assignment_time: time,
    place: buildPlace({ id: placeId, place_time: placeTime }),
  });

// Walk 42 is on day 1 without a time, on day 2 at the place's own 10:00 (overridden to 9:30 PM there)
// and on day 3 at its place time; another place is on day 1 too.
const assignments: AssignmentsMap = {
  '1': [entry(1, 7, '08:00'), entry(1, 42, null)],
  '2': [entry(2, 42, '9:30 PM', '10:00')],
  '3': [entry(3, 42, null, '11:15')],
};

function walkDay(placeId: number | null, fixedDayId: number | null = null, map: AssignmentsMap = assignments) {
  return renderHook(({ id, fixed, entries }) => useWalkDay(id, days, entries, fixed), {
    initialProps: { id: placeId, fixed: fixedDayId, entries: map },
  });
}

describe('useWalkDay', () => {
  it("lists the walk's days in the trip's order with their start, the day's own time before the place's", () => {
    const { result } = walkDay(42);
    expect(result.current.options.map((option) => [option.day.id, option.index, option.start])).toEqual([
      [1, 0, null],
      [2, 1, '21:30'],
      [3, 2, '11:15'],
    ]);
  });

  it('takes the first day with a start time, and the first day where none has one', () => {
    expect(walkDay(42).result.current).toMatchObject({ fixed: false, day: { day: { id: 2 } } });
    const untimed = { '3': [entry(3, 42, null)], '1': [entry(1, 42, 'later')] };
    expect(walkDay(42, null, untimed).result.current.day?.day.id).toBe(1);
  });

  it('keeps the day picked, falls back once the walk left it, and starts over for another walk', () => {
    const view = walkDay(42);
    act(() => view.result.current.choose(3));
    expect(view.result.current.day?.day.id).toBe(3);

    view.rerender({ id: 42, fixed: null, entries: { ...assignments, '3': [] } });
    expect(view.result.current.day?.day.id).toBe(2);

    const other = { '2': [entry(2, 43, '07:00')], '3': [entry(3, 43, '08:00')] };
    view.rerender({ id: 43, fixed: null, entries: other });
    expect(view.result.current.day?.day.id).toBe(2);
  });

  it('holds the day it was opened from, with or without a time, and never another once the walk left it', () => {
    expect(walkDay(42, 1).result.current).toMatchObject({ fixed: true, day: { day: { id: 1 }, start: null } });
    const gone = walkDay(42, 1, { '2': assignments['2'] ?? [] });
    expect(gone.result.current).toMatchObject({ fixed: true, day: null });
    act(() => gone.result.current.choose(2));
    expect(gone.result.current.day).toBeNull();
  });

  it('has no day for no walk, and nothing to pick', () => {
    const { result } = walkDay(null);
    expect(result.current).toMatchObject({ options: [], day: null, fixed: false });
    act(() => result.current.choose(2));
    expect(result.current.day).toBeNull();
  });
});
