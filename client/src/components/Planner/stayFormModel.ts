import type { Accommodation, Day } from '../../types';
import { stayPlaces } from '../../utils/stayPlaces';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * The stay editor both shells show over the same rules: the desktop day panel's
 * hotel picker and the phone's accommodation sheet. Each keeps its own state; the
 * shape of a range, the day options, the places on offer and the request body are
 * worked out here.
 */

/** The days a stay spans; `N` is how a shell writes "no day yet". */
export interface StayRange<N extends number | undefined> {
  start: N;
  end: N;
}

/** The stay's own fields as the editor holds them; `P` is how a shell writes "no place picked". */
export interface StayFormFields<P> {
  check_in: string;
  check_in_end: string;
  check_out: string;
  confirmation: string;
  place_id: P;
}

/** The day options of the range pickers: the day's title, its date as the badge, or its number when titled. */
export function stayDayOptions(days: Day[], t: Translate, locale: string) {
  return days.map((d, i) => ({
    value: d.id,
    label: d.title || t('planner.dayN', { n: i + 1 }),
    badge: d.date
      ? new Date(d.date + 'T00:00:00Z').toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' })
      : d.title
        ? t('planner.dayN', { n: i + 1 })
        : undefined,
  }));
}

const position = (days: { id: number }[], id: number | undefined) => days.findIndex((d) => d.id === id);

/** A new first day; a range that would end before it is pulled along to it. */
export function stayRangeFromStart<N extends number | undefined>(
  days: { id: number }[],
  prev: StayRange<N>,
  id: number
): StayRange<N | number> {
  return { start: id, end: position(days, id) > position(days, prev.end) ? id : prev.end };
}

/** A new last day; a range that would start after it is pulled back to it. */
export function stayRangeFromEnd<N extends number | undefined>(
  days: { id: number }[],
  prev: StayRange<N>,
  id: number
): StayRange<N | number> {
  return { start: position(days, id) < position(days, prev.start) ? id : prev.start, end: id };
}

/**
 * The day after the given one, which is where a new stay checks out by default: a
 * stay virtually never checks out the day it checks in. Undefined on the trip's
 * last day or for a day the trip does not have.
 */
export function stayCheckoutDay(days: { id: number }[], dayId: number | undefined): number | undefined {
  const idx = position(days, dayId);
  return (idx >= 0 && days[idx + 1]?.id) || undefined;
}

/** The editor's fields for an existing stay; `emptyPlace` stands in for a stay without a place. */
export function stayFormFrom<P>(
  acc: Pick<Accommodation, 'check_in' | 'check_in_end' | 'check_out' | 'confirmation' | 'place_id'>,
  emptyPlace: P
): StayFormFields<number | P> {
  return {
    check_in: acc.check_in || '',
    check_in_end: acc.check_in_end || '',
    check_out: acc.check_out || '',
    confirmation: acc.confirmation || '',
    place_id: acc.place_id ?? emptyPlace,
  };
}

/**
 * The places a stay can be at (no GPX tracks, but always the one already picked),
 * narrowed to a category when one is chosen.
 */
export function stayPlaceChoices<P extends { id: number; route_geometry?: string | null; category_id?: number | null }>(
  places: P[],
  placeId: number | string | null | undefined,
  categoryId: number | null
): P[] {
  const offered = stayPlaces<P>(places, placeId);
  return categoryId != null ? offered.filter((p) => p.category_id === categoryId) : offered;
}

/** The request body for creating or updating a stay; empty times and codes are sent as null. */
export function stayRequestBody<P, N extends number | undefined>(form: StayFormFields<P>, range: StayRange<N>) {
  return {
    place_id: form.place_id,
    start_day_id: range.start,
    end_day_id: range.end,
    check_in: form.check_in || null,
    check_in_end: form.check_in_end || null,
    check_out: form.check_out || null,
    confirmation: form.confirmation || null,
  };
}
