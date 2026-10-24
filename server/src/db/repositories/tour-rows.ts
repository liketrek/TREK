/**
 * The rows the tours repository answers, as its queries read them: counts and
 * flags come back from SQLite and Postgres in different spellings, and are
 * made numbers here.
 */
import type { TourLibraryRow, TourListRow } from './Tours.repository';

export function toLibraryRow<R extends Omit<TourLibraryRow, 'has_waypoints'> & { has_waypoints: unknown }>(
  r: R,
): TourLibraryRow {
  return {
    place_id: r.place_id,
    name: r.name,
    description: r.description,
    tour_type: r.tour_type,
    distance: r.distance,
    elevation_gain: r.elevation_gain,
    elevation_loss: r.elevation_loss,
    duration: r.duration,
    planned_duration_minutes: r.planned_duration_minutes,
    break_additional_minutes: r.break_additional_minutes,
    max_hiking_difficulty: r.max_hiking_difficulty,
    origin: r.origin,
    trip_id: r.trip_id,
    trip_title: r.trip_title,
    has_waypoints: Number(r.has_waypoints),
  };
}

export function toListRow<
  R extends Omit<TourListRow, 'planned' | 'has_waypoints' | 'has_recorded_track' | 'route_missing' | 'stage_ends'> & {
    planned: unknown;
    has_waypoints: unknown;
    has_recorded_track: unknown;
    route_missing: unknown;
    stage_ends: unknown;
  },
>(r: R): TourListRow {
  return {
    ...r,
    planned: Number(r.planned),
    has_waypoints: Number(r.has_waypoints),
    has_recorded_track: Number(r.has_recorded_track),
    route_missing: Number(r.route_missing),
    // Postgres counts in a bigint, which its driver hands back as text.
    stage_ends: Number(r.stage_ends),
  };
}
