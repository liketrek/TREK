import { useMemo } from 'react';
import { useTripStore } from '../../store/tripStore';
import type { AssignmentsMap, Day } from '../../types';
import { formatDate } from '../../utils/formatters';

type Translate = (key: string, params?: Record<string, unknown>) => string;

export interface TourDay {
  day: Day;
  /** The day's position in the trip, so `index + 1` is the number the plan shows. */
  index: number;
}

/**
 * The days of the trip a tour is on, in the order of the trip and each once,
 * read from the day lists themselves rather than from the tour list's
 * `planned` flag, so a tour put on a day or taken off one shows it at once.
 */
export function tourDaysOf(placeId: number, days: readonly Day[], assignments: AssignmentsMap): TourDay[] {
  return days.flatMap((day, index) =>
    (assignments[String(day.id)] ?? []).some((assignment) => assignment.place_id === placeId) ? [{ day, index }] : []
  );
}

/** `tourDaysOf` for one tour, following the store's day lists. */
export function useTourDays(placeId: number, days: readonly Day[]): TourDay[] {
  const assignments = useTripStore((state) => state.assignments);
  return useMemo(() => tourDaysOf(placeId, days, assignments ?? {}), [placeId, days, assignments]);
}

/** "Day 2, Tue, Jul 8: Lakes" as far as the day has a date and a title. */
export function dayMenuLabel(day: Day, index: number, t: Translate, locale: string): string {
  const date = formatDate(day.date, locale);
  const head = date ? `${t('dayplan.dayN', { n: index + 1 })}, ${date}` : t('dayplan.dayN', { n: index + 1 });
  return day.title ? `${head}: ${day.title}` : head;
}
