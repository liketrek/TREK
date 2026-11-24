import type { Accommodation, Day } from '../../types';

/** A strict calendar date as a UTC day number, so DST never changes the number of nights. */
function nightNumber(value: string | null | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0, 10) !== value) return null;
  return time / 86_400_000;
}

/** Rank other-day stays by the closest boundary of their complete booking interval. */
export function orderTransitStaysByDate(
  day: Pick<Day, 'date'>,
  days: readonly Pick<Day, 'id' | 'date'>[],
  stays: readonly Accommodation[]
): Accommodation[] {
  const selected = nightNumber(day.date);
  const dates = new Map(days.map((d) => [d.id, nightNumber(d.date)]));
  return stays
    .map((stay) => {
      const start = dates.get(stay.start_day_id);
      const end = dates.get(stay.end_day_id);
      // A partial or invalid interval has no usable proximity and follows every dated stay.
      const lo = start != null && end != null ? Math.min(start, end) : Infinity;
      const hi = start != null && end != null ? Math.max(start, end) : Infinity;
      const distance = selected != null && lo !== Infinity ? Math.max(lo - selected, selected - hi, 0) : Infinity;
      // Earlier check-in, then earlier check-out, then stable booking identity break ties.
      return { stay, rank: [distance, lo, hi, stay.id] };
    })
    .sort((a, b) => {
      for (let i = 0; i < a.rank.length; i++) {
        if (a.rank[i] !== b.rank[i]) return a.rank[i] < b.rank[i] ? -1 : 1;
      }
      return 0;
    })
    .map((row) => row.stay);
}
