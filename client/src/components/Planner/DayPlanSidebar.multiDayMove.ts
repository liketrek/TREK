import type { Day, Reservation } from '../../types';

export type SpanPhase = 'single' | 'start' | 'middle' | 'end';

export interface MultiDayMoveUpdate {
  day_id: number;
  end_day_id: number;
  reservation_time?: string;
  reservation_end_time?: string;
}

/** A day's position in the trip: its day number when it has one, its index otherwise. */
export function getDayOrder(days: Day[], day: Day): number {
  return day.day_number ?? days.indexOf(day);
}

/**
 * The day ids a booking spans after one of its rows is dropped on another day. Dropping the
 * start past the end, or the end before the start, collapses the span onto the target day.
 */
export function computeMultiDayMoveIds(
  days: Day[],
  r: Reservation,
  targetDayId: number,
  phase: SpanPhase
): { day_id: number; end_day_id: number } {
  const startId = r.day_id ?? targetDayId;
  const endId = r.end_day_id ?? startId;
  const order = (id: number) => {
    const d = days.find((x) => x.id === id);
    return d ? getDayOrder(days, d) : 0;
  };
  if (phase === 'single' || startId === endId) return { day_id: targetDayId, end_day_id: targetDayId };
  if (phase === 'start') {
    if (order(targetDayId) > order(endId)) return { day_id: targetDayId, end_day_id: targetDayId };
    return { day_id: targetDayId, end_day_id: endId };
  }
  // phase === 'end'
  if (order(targetDayId) < order(startId)) return { day_id: targetDayId, end_day_id: targetDayId };
  return { day_id: startId, end_day_id: targetDayId };
}

/**
 * The update for a booking dropped on another day. The stored date moves with the day:
 * otherwise the Plan shows the booking on its new day while the Bookings list, the calendar
 * export and a later date edit still read the old one.
 */
export function computeMultiDayMove(
  days: Day[],
  r: Reservation,
  targetDayId: number,
  phase: SpanPhase
): MultiDayMoveUpdate {
  const ids = computeMultiDayMoveIds(days, r, targetDayId, phase);
  const update: MultiDayMoveUpdate = { ...ids };
  const redate = (value: string | null | undefined, dayId: number): string | undefined => {
    const date = days.find((x) => x.id === dayId)?.date;
    if (!value || !date || !/^\d{4}-\d{2}-\d{2}/.test(value) || value.slice(0, 10) === date) return undefined;
    return date + value.slice(10);
  };
  if (ids.day_id !== r.day_id) {
    const time = redate(r.reservation_time, ids.day_id);
    if (time) update.reservation_time = time;
  }
  if (ids.end_day_id !== (r.end_day_id ?? r.day_id)) {
    const end = redate(r.reservation_end_time, ids.end_day_id);
    if (end) update.reservation_end_time = end;
  }
  return update;
}
