import type { AnswerInput } from '../card-types';
import { clipped, finite, recordOf } from '../card-values';
import { climbOf, metresOf, minutesOf, rowsIn, sacStepOf, whole } from './tour-card-values';
import { TOUR_LIST_ROWS, tourTypeKeySchema, type TourListCard, type TourListRow } from '@trek/shared';

/**
 * The tours of a trip (list_tours) or of one of its days (find_tours_for_day)
 * as rows: what each tour is, how long and how high, its stages, and the
 * days it is on. A tour without a name or a type this build knows is left
 * out; an empty list has no card.
 */

/** A saved tour as a row, or null when it cannot be one. */
function rowOf(raw: unknown): TourListRow | null {
  const tour = recordOf(raw);
  const placeId = whole(tour.place_id, 1, Number.MAX_SAFE_INTEGER);
  const name = clipped(tour.name, 120);
  const activity = tourTypeKeySchema.safeParse(tour.tour_type);
  if (placeId === null || !name || !activity.success) return null;
  const distance = finite(tour.distance);
  const estimate = recordOf(tour.time_estimate);
  const days = rowsIn(tour.days)
    .map((day) => whole(day.day_number, 1, 999))
    .filter((number): number is number => number !== null);
  return {
    placeId,
    name,
    activity: activity.data,
    limit: sacStepOf(tour.max_hiking_difficulty),
    distanceM: distance === null ? null : metresOf(distance * 1000),
    ascentM: climbOf(tour.elevation_gain),
    minutes: minutesOf(tour.planned_duration_minutes) ?? minutesOf(tour.duration) ?? minutesOf(estimate.minutes),
    stages: whole(tour.stage_count, 2, 60),
    days: [...new Set(days)].sort((a, b) => a - b).slice(0, 10),
  };
}

/** list_tours, find_tours_for_day: the first rows and how many more there are. */
export function tourListCard({ value, args }: AnswerInput): TourListCard | null {
  const tours = recordOf(value).tours;
  const rows = (Array.isArray(tours) ? tours : []).map(rowOf).filter((row): row is TourListRow => row !== null);
  if (rows.length === 0) return null;
  return {
    kind: 'tourList',
    dayId: whole(args.dayId, 1, Number.MAX_SAFE_INTEGER),
    more: Math.min(rows.length - Math.min(rows.length, TOUR_LIST_ROWS), 10_000),
    rows: rows.slice(0, TOUR_LIST_ROWS),
  };
}
