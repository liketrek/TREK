import { MAX_TRIP_DAYS, tripSpanDays } from './trip.schema';

/**
 * Pure rules for the day rows of a dated trip, for both sides of the wire. The
 * server writes by them and the planner shows by them, so a date the planner
 * promises before a write is the date the write stores.
 */

const MS_PER_DAY = 86_400_000;

/**
 * Add `n` calendar days to a YYYY-MM-DD date, entirely in UTC.
 *
 * Never through a local-time Date: `new Date('2026-06-07T00:00:00')` is local
 * midnight, and the round trip through toISOString() lands on the day before
 * wherever the clock sits east of Greenwich.
 */
export function addIsoDays(date: string, n: number): string {
  const [y = NaN, m = NaN, d = NaN] = date.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d) + n * MS_PER_DAY);
  const yyyy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** The day after the later of `endDate` and the latest date a day carries. ISO dates compare as strings. */
function dayAfterLatest(endDate: string, dayDates: readonly (string | null | undefined)[]): string {
  const latest = dayDates.reduce<string>((last, date) => (date && date > last ? date : last), endDate);
  return addIsoDays(latest, 1);
}

/**
 * The date a day added "with a date" gets: the day after the trip's end date,
 * or after the latest date a day carries when one lies further out. Null for a
 * trip without an end date.
 *
 * The two agree on any trip the planner wrote. Reading the days as well keeps
 * the new day off a date another day already has, whatever state the range is in.
 */
export function nextTripDate(
  endDate: string | null | undefined,
  dayDates: readonly (string | null | undefined)[],
): string | null {
  return endDate ? dayAfterLatest(endDate, dayDates) : null;
}

/** A day added with a date: the date it gets, and whether the trip may still grow to it. */
export interface DatedAppendPlan {
  date: string;
  fits: boolean;
}

/**
 * What adding the next dated day would do to a trip. Null for a trip without
 * dates, which only takes days without one. `fits` is false when the longer
 * range would pass MAX_TRIP_DAYS. The server refuses by this and the planner
 * greys its button by it, so the two cannot disagree about the limit.
 */
export function planDatedAppend(
  trip: { start_date?: string | null; end_date?: string | null },
  dayDates: readonly (string | null | undefined)[],
): DatedAppendPlan | null {
  if (!trip.start_date || !trip.end_date) return null;
  const date = dayAfterLatest(trip.end_date, dayDates);
  return { date, fits: tripSpanDays(trip.start_date, date) <= MAX_TRIP_DAYS };
}

/** The dates and day count an update leaves a trip with, and whether its day rows are rebuilt. */
export interface DayGridRange {
  newStart: string | null | undefined;
  newEnd: string | null | undefined;
  /** A requested day count, held to 1..MAX_TRIP_DAYS; undefined when none came. */
  dayCount: number | undefined;
  /** True when a date moves or a day count arrives: the day rows are laid out anew. */
  regenerate: boolean;
}

/**
 * Where an update takes a trip's range. A field left out keeps the stored
 * value, an explicit null clears it. The server rebuilds the day rows exactly
 * when `regenerate` is true, and the trip dialog asks the same question before
 * it saves, so a warning about lost days never fires for a save that loses none.
 * Refusing a bad range stays with the server.
 */
export function resolveDayGridRange(
  prev: { start_date?: string | null; end_date?: string | null },
  data: { start_date?: string | null; end_date?: string | null; day_count?: number | null },
): DayGridRange {
  const newStart = data.start_date !== undefined ? data.start_date : prev.start_date;
  const newEnd = data.end_date !== undefined ? data.end_date : prev.end_date;
  const dayCount = data.day_count ? Math.min(Math.max(Number(data.day_count) || 7, 1), MAX_TRIP_DAYS) : undefined;
  const regenerate = newStart !== prev.start_date || newEnd !== prev.end_date || dayCount !== undefined;
  return { newStart, newEnd, dayCount, regenerate };
}

/** A day row as the layout reads it. */
export interface DayGridDay {
  id: number;
  day_number: number;
  date: string | null | undefined;
  /** Places planned on the day, or notes on it. A day title or text does not count. */
  hasPlanItems: boolean;
}

/** A stay by the two days it checks in and out on. */
export interface DayGridStay {
  start_day_id: number;
  end_day_id: number;
}

/**
 * Why a day goes. `overflow`: a dated day past the new range, removed with
 * everything on it. `spare`: a day with nothing planned that the new layout has
 * no place for.
 */
export type DayGridRemovalReason = 'overflow' | 'spare';

export interface DayGridRemoval {
  id: number;
  /** Where the day stood before, and the date it had. */
  day_number: number;
  date: string | null;
  reason: DayGridRemovalReason;
}

/** One row of the new layout: an existing day by its id, or a new one (null). */
export interface DayGridRow {
  id: number | null;
  date: string | null;
}

/** The day rows a trip ends up with, in order (index + 1 is the day number), and the days that go. */
export interface DayGridPlan {
  rows: DayGridRow[];
  removed: DayGridRemoval[];
}

const byDayNumber = (a: DayGridDay, b: DayGridDay): number => a.day_number - b.day_number;

const removal = (day: DayGridDay, reason: DayGridRemovalReason): DayGridRemoval => ({
  id: day.id,
  day_number: day.day_number,
  date: day.date || null,
  reason,
});

/** Nothing planned on the day and no stay checking in or out on it. */
const isEmptyDay = (day: DayGridDay, stays: readonly DayGridStay[]): boolean =>
  !day.hasPlanItems && !stays.some((s) => s.start_day_id === day.id || s.end_day_id === day.id);

/**
 * The day rows a trip gets for a range, the rule the server writes by
 * (TripsService.generateDays carries this plan out) and the trip dialog warns
 * by before it saves.
 *
 * With dates, plans follow their position: the n-th dated day takes the n-th
 * date of the new range, so shortening a trip always takes the last dated days,
 * with everything on them, even when it was the start that moved. Days without
 * a date fill any dates left over, then new empty days do. Days without a date
 * that are still over are dropped when empty and kept, undated, at the end when
 * not. A stay on a dropped dated day goes with that day, so it no longer keeps a
 * spare day it touched.
 *
 * Without dates every day loses its date and the trip is held to `dayCount`
 * days (its current count when none is given): short of it, empty days are
 * added at the end; over it, empty days go, the highest numbers first. A day
 * with something planned on it is never dropped, even if that leaves the trip
 * over the count.
 */
export function planDayGrid(input: {
  days: readonly DayGridDay[];
  stays: readonly DayGridStay[];
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  dayCount?: number;
}): DayGridPlan {
  const { days, stays, startDate, endDate, dayCount } = input;

  if (!startDate || !endDate) {
    const ordered = [...days].sort(byDayNumber);
    const target = Math.min(Math.max(dayCount ?? (ordered.length || 7), 1), MAX_TRIP_DAYS);
    const surplus = ordered.length - target;
    const removed =
      surplus > 0
        ? ordered
            .filter((day) => isEmptyDay(day, stays))
            .reverse()
            .slice(0, surplus)
            .map((day) => removal(day, 'spare'))
        : [];
    const gone = new Set(removed.map((r) => r.id));
    const rows: DayGridRow[] = ordered.filter((day) => !gone.has(day.id)).map((day) => ({ id: day.id, date: null }));
    for (let i = 0; i < -surplus; i++) rows.push({ id: null, date: null });
    return { rows, removed };
  }

  const dated = days.filter((day) => day.date).sort(byDayNumber);
  const undated = days.filter((day) => !day.date).sort(byDayNumber);
  const span = tripSpanDays(startDate, endDate);

  const rows: DayGridRow[] = [];
  let used = 0;
  for (let i = 0; i < span; i++) {
    const date = addIsoDays(startDate, i);
    if (i < dated.length) rows.push({ id: dated[i]!.id, date });
    else if (used < undated.length) rows.push({ id: undated[used++]!.id, date });
    else rows.push({ id: null, date });
  }

  const overflow = dated.slice(Math.max(span, 0));
  const gone = new Set(overflow.map((day) => day.id));
  const standing = stays.filter((s) => !gone.has(s.start_day_id) && !gone.has(s.end_day_id));
  const removed = overflow.map((day) => removal(day, 'overflow'));
  for (const day of undated.slice(used)) {
    if (isEmptyDay(day, standing)) removed.push(removal(day, 'spare'));
    else rows.push({ id: day.id, date: null });
  }
  return { rows, removed };
}
