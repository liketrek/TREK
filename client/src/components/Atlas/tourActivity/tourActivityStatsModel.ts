import {
  isTourActivityDone,
  plannableTourTypeSchema,
  type TourActivityStatsEntry,
  type TourActivitySum,
  type TourTypeKey,
} from '@trek/shared';

/**
 * STA-02: the periods and types the Atlas narrows the user's tour activities
 * by, and how a sum reads. Pure, so the hook and its views share one answer.
 */

/** All time, the calendar year, the last twelve months, or one earlier year. */
export type ActivityPeriod = 'all' | 'thisYear' | 'last12' | `year:${number}`;

/** One type, or every type at once. */
export type ActivityType = TourTypeKey | 'all';

interface PeriodRange {
  from: string | null;
  to: string | null;
}

/** The days a period covers, both included, for `today` (YYYY-MM-DD in the user's own calendar). */
export function periodRange(period: ActivityPeriod, today: string): PeriodRange {
  const year = Number(today.slice(0, 4));
  if (period === 'thisYear') return { from: `${year}-01-01`, to: `${year}-12-31` };
  // A year back to the day, today included: the same day a year ago is the first one.
  if (period === 'last12') return { from: `${year - 1}${today.slice(4)}`, to: today };
  if (period.startsWith('year:')) {
    const chosen = period.slice(5);
    return { from: `${chosen}-01-01`, to: `${chosen}-12-31` };
  }
  return { from: null, to: null };
}

/**
 * The periods worth offering: all time, this year and the last twelve months,
 * then each earlier year a done tour is in, the newest first. A year without
 * a tour would only ever show nothing.
 */
export function periodOptions(entries: readonly TourActivityStatsEntry[], today: string): ActivityPeriod[] {
  const thisYear = today.slice(0, 4);
  const years = new Set(
    entries
      .filter((entry) => isTourActivityDone(entry, today))
      .map((entry) => entry.date.slice(0, 4))
      .filter((year) => year < thisYear)
  );
  const earlier = [...years].sort((a, b) => b.localeCompare(a)).map((year): ActivityPeriod => `year:${Number(year)}`);
  return ['all', 'thisYear', 'last12', ...earlier];
}

/** The types a done tour has, in the order tours are planned in, the older types after them. */
export function typeOptions(entries: readonly TourActivityStatsEntry[], today: string): ActivityType[] {
  const present = new Set(entries.filter((entry) => isTourActivityDone(entry, today)).map((entry) => entry.tour_type));
  const planned: readonly string[] = plannableTourTypeSchema.options;
  const ordered = [...present].sort((a, b) => rank(planned, a) - rank(planned, b) || a.localeCompare(b));
  return ['all', ...ordered];
}

function rank(order: readonly string[], value: string): number {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

/** The year of a `year:` period, or null for the others. */
export function periodYear(period: ActivityPeriod): number | null {
  return period.startsWith('year:') ? Number(period.slice(5)) : null;
}

/**
 * A sum as it is said: nothing when nobody knows the value, else the value,
 * marked as at least that much when some of the tours lack it.
 */
export function sumReading(
  sum: TourActivitySum,
  format: (value: number) => string
): { text: string; partial: boolean } | null {
  if (sum.value === null) return null;
  const partial = sum.known < sum.of;
  return { text: partial ? `≥ ${format(sum.value)}` : format(sum.value), partial };
}

/** A formatted measure split into its number and its unit, so the number can stand large ("128.4", "km"). */
export function splitMeasure(text: string): { value: string; unit: string } {
  const at = text.lastIndexOf(' ');
  return at === -1 ? { value: text, unit: '' } : { value: text.slice(0, at), unit: text.slice(at + 1) };
}
