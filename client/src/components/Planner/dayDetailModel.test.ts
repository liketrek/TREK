// FE-PLANNER-DAYDETAILMODEL-001 to -005: the day detail derivations the desktop day
// panel and the phone day sheet share.
import { describe, expect, it } from 'vitest';

import { buildReservation } from '../../../tests/helpers/factories';
import { dayBookings, stayDayLabel, toDisplayTemp } from './dayDetailModel';

const t = (key: string) => `t:${key}`;

describe('dayBookings', () => {
  it('FE-PLANNER-DAYDETAILMODEL-001: the day keeps what hangs on its stops and what is booked on it, hotels aside', () => {
    const onStop = buildReservation({ id: 1, type: 'restaurant', assignment_id: 11, day_id: 9 });
    const onDay = buildReservation({ id: 2, type: 'event', assignment_id: null, day_id: 4 });
    const hotel = buildReservation({ id: 3, type: 'hotel', assignment_id: 11, day_id: 4 });
    const otherDay = buildReservation({ id: 4, type: 'tour', assignment_id: 99, day_id: 5 });
    const result = dayBookings(4, [{ id: 11 }, { id: 12 }], [onStop, onDay, hotel, otherDay]);
    expect(result.map((r) => r.id)).toEqual([1, 2]);
  });

  it('FE-PLANNER-DAYDETAILMODEL-002: a booking on a stop of another day falls back to its own day', () => {
    const moved = buildReservation({ id: 5, type: 'event', assignment_id: 77, day_id: 4 });
    expect(dayBookings(4, [{ id: 11 }], [moved]).map((r) => r.id)).toEqual([5]);
    expect(dayBookings(6, [{ id: 11 }], [moved])).toEqual([]);
  });
});

describe('toDisplayTemp', () => {
  it('FE-PLANNER-DAYDETAILMODEL-003: rounds in the user unit, and a missing value stays unreadable', () => {
    expect(toDisplayTemp(21.4, false)).toBe(21);
    expect(toDisplayTemp(21.4, true)).toBe(71);
    expect(toDisplayTemp(-0.6, false)).toBe(-1);
    expect(toDisplayTemp(undefined, false)).toBeNaN();
    expect(toDisplayTemp(undefined, true)).toBeNaN();
  });
});

describe('stayDayLabel', () => {
  const stay = { start_day_id: 2, end_day_id: 4 };

  it('FE-PLANNER-DAYDETAILMODEL-004: names the check-in and the check-out day', () => {
    expect(stayDayLabel(stay, 2, t)).toBe('t:day.checkIn');
    expect(stayDayLabel(stay, 4, t)).toBe('t:day.checkOut');
    expect(stayDayLabel({ start_day_id: 3, end_day_id: 3 }, 3, t)).toBe('t:day.checkIn & t:day.checkOut');
  });

  it('FE-PLANNER-DAYDETAILMODEL-005: a night in between, or no day at all, has no label', () => {
    expect(stayDayLabel(stay, 3, t)).toBeNull();
    expect(stayDayLabel(stay, undefined, t)).toBeNull();
  });
});
