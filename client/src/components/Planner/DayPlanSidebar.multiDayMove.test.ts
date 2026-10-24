// FE-PLANNER-DAYPLAN-117/118: where a booking lands when one of its rows is dropped on another
// day. FE-PLANNER-DAYPLAN-116 in DayPlanSidebar.test.tsx still drives the same move through a
// real drag and drop, so the wiring stays covered there.
import { describe, expect, it } from 'vitest';

import { buildDay, buildReservation } from '../../../tests/helpers/factories';
import { computeMultiDayMove, computeMultiDayMoveIds, getDayOrder } from './DayPlanSidebar.multiDayMove';

const fourDays = () =>
  [9, 10, 11, 12].map((id, i) => buildDay({ id, day_number: i + 1, date: `2025-06-0${i + 1}`, title: `Day ${i + 1}` }));

const longFlight = () =>
  buildReservation({
    id: 400,
    type: 'flight',
    title: 'Long flight',
    day_id: 10,
    end_day_id: 12,
    reservation_time: '2025-06-02T10:00:00',
  });

describe('computeMultiDayMove', () => {
  it('FE-PLANNER-DAYPLAN-117: dragging a span end before its start collapses it, otherwise it just shortens', () => {
    const days = fourDays();
    // The end stays after the start, so only the end day changes and the start time stays put.
    expect(computeMultiDayMove(days, longFlight(), 11, 'end')).toEqual({ day_id: 10, end_day_id: 11 });
    // Day 1 sits before the start, so the booking collapses onto it and its time follows.
    expect(computeMultiDayMove(days, longFlight(), 9, 'end')).toEqual({
      day_id: 9,
      end_day_id: 9,
      reservation_time: '2025-06-01T10:00:00',
    });
  });

  it('FE-PLANNER-DAYPLAN-118: a single-day booking dragged to another day moves wholesale', () => {
    const days = [
      buildDay({ id: 10, date: '2025-06-01', title: 'Day 1' }),
      buildDay({ id: 11, date: '2025-06-02', title: 'Day 2' }),
    ];
    const train = buildReservation({
      id: 401,
      type: 'train',
      title: 'Regional train',
      day_id: 10,
      reservation_time: '2025-06-01T10:00:00',
    });
    expect(computeMultiDayMove(days, train, 11, 'single')).toEqual({
      day_id: 11,
      end_day_id: 11,
      reservation_time: '2025-06-02T10:00:00',
    });
  });

  it('moves the end time with the end day and leaves a time without a date alone', () => {
    const days = fourDays();
    const stay = buildReservation({
      id: 402,
      day_id: 10,
      end_day_id: 11,
      reservation_time: '10:00',
      reservation_end_time: '2025-06-03T09:00:00',
    });
    expect(computeMultiDayMove(days, stay, 12, 'end')).toEqual({
      day_id: 10,
      end_day_id: 12,
      reservation_end_time: '2025-06-04T09:00:00',
    });
    expect(computeMultiDayMove(days, stay, 9, 'start')).toEqual({ day_id: 9, end_day_id: 11 });
  });

  it('dragging a span start past its end collapses the booking onto the target day', () => {
    expect(computeMultiDayMoveIds(fourDays(), { ...longFlight(), day_id: 9, end_day_id: 10 }, 12, 'start')).toEqual({
      day_id: 12,
      end_day_id: 12,
    });
  });
});

describe('getDayOrder', () => {
  it('reads the day number and falls back to the position in the list', () => {
    const days = fourDays();
    expect(getDayOrder(days, days[2])).toBe(3);
    const unnumbered = { ...days[1], day_number: undefined };
    expect(getDayOrder([days[0], unnumbered], unnumbered)).toBe(1);
  });
});
