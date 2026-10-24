import type { TourListItem } from '@trek/shared';
import { tourDayTimeOf, type TourDayEntry, type TourDayTime } from './tourDayTime';
import { formatPlannedTourDuration, tourDayMinutes, tourPlannedTimes } from './tourPresentation';

/** TIME-02: the words the day plan says a tour's worked-out time in, apart from the components showing them. */

export type Translate = (key: string, params?: Record<string, unknown>) => string;

/** A total as said beside a worked-out end: `≈` for an estimate, `≥` where a stay is not known yet. */
export function totalText(time: Pick<TourDayTime, 'totalMinutes' | 'estimated' | 'atLeast'>): string {
  const total = formatPlannedTourDuration(time.totalMinutes ?? 0);
  if (time.estimated) return `≈ ${total}`;
  return time.atLeast ? `≥ ${total}` : total;
}

/**
 * TIME-02: what the time fields of a tour's day entry say below them, while
 * no end is typed: the end the start and the tour's time work out to, or,
 * before a start is picked, that one will. Nothing where the tour has no
 * known time or the day holds one stage of a multi-day tour.
 */
export function workedOutEndHint(
  entry: TourDayEntry,
  tour: TourListItem | null | undefined,
  t: Translate,
  clock: (value: string) => string
): string | null {
  if (!tour || entry.stageKey || (entry.end ?? '') !== '') return null;
  const time = tourDayTimeOf(entry, tour);
  if (time?.workedOut && time.end) {
    return t('tours.dayTime.formHint', { time: clock(time.end), total: totalText(time) });
  }
  const total = tourDayMinutes(tourPlannedTimes(tour));
  if (time || !total) return null;
  const said = totalText({ totalMinutes: total.minutes, estimated: total.estimated, atLeast: total.atLeast });
  return t('tours.dayTime.formNoStart', { total: said });
}
