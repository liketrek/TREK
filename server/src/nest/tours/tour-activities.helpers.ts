/**
 * ACT-01: the pure half of a tour's recorded tracks. What a recording measures
 * is read from its own line every time it is asked, so the answer follows the
 * recording and never touches the plan; what an assignment row says about the
 * two tours it joins is mapped here for the list and the detail.
 */
import type { TourActivityRefRow, TourActivityRow } from '../../db/repositories/TourActivities.repository';
import { dbNow, parseDbTimestamp, utcSuffix, type DbTimestamp } from '../../db/types';
import type { PreparedGpxPlace } from '../place-import/place-import.types';
import { computeTourMetrics, parseRouteGeometry } from './tours.helpers';
import type { TourActivity, TourListItem, TourOrigin } from '@trek/shared';

/** Minutes from the first to the last time of a track, pauses included; null unless both are there and in order. */
export function elapsedMinutes(startedAt: string | null, endedAt: string | null): number | null {
  const start = parseDbTimestamp(startedAt);
  const end = parseDbTimestamp(endedAt);
  if (!start || !end || end.getTime() <= start.getTime()) return null;
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

/**
 * One assignment as the detail answers it. The recording's line is the one it
 * kept when someone planned over it since, otherwise its place's own: either
 * way the line it was recorded with, never a plan.
 */
export function toActivity(row: TourActivityRow): TourActivity {
  const geometry = parseRouteGeometry(row.track_recorded_route_geometry ?? row.track_route_geometry);
  const metrics = computeTourMetrics(geometry);
  return {
    id: row.id,
    assignment_id: row.assignment_id,
    day_id: row.day_id,
    assigned_at: utcSuffix(row.assigned_at),
    track: {
      place_id: row.track_place_id,
      name: row.track_name,
      origin: row.track_origin as TourOrigin,
      file_name: row.track_file_name,
      imported_at: utcSuffix(row.track_created_at),
    },
    metrics: {
      distance_km: geometry.length >= 2 ? metrics.distanceKm : null,
      elevation_gain_m: metrics.elevationGainM,
      elevation_loss_m: metrics.elevationLossM,
      started_at: utcSuffix(row.track_started_at),
      ended_at: utcSuffix(row.track_ended_at),
      elapsed_minutes: elapsedMinutes(row.track_started_at, row.track_ended_at),
      point_count: geometry.length,
    },
    geometry,
  };
}

/** An assignment as an MCP tool answers it: everything but the recorded line, which runs to thousands of points. */
export function withoutLine({ geometry: _line, ...activity }: TourActivity): Omit<TourActivity, 'geometry'> {
  return activity;
}

/** What the list says of a tour's assignments: the recordings it has, and the tour it documents itself. */
export function activityFacts(
  placeId: number,
  refs: readonly TourActivityRefRow[],
): Pick<TourListItem, 'activity_tracks' | 'activity_of'> {
  return {
    activity_tracks: refs
      .filter((ref) => ref.place_id === placeId)
      .map(({ id, track_place_id, assignment_id }) => ({ id, track_place_id, assignment_id })),
    activity_of: refs.find((ref) => ref.track_place_id === placeId)?.place_id ?? null,
  };
}

/** The times an import stores for a track, as the DATETIME columns hold them; NULL without. */
function storedTimes(row: PreparedGpxPlace | undefined): { started: DbTimestamp | null; ended: DbTimestamp | null } {
  const times = row?.trackTimes;
  return times
    ? { started: dbNow(new Date(times.startedAt)), ended: dbNow(new Date(times.endedAt)) }
    : { started: null, ended: null };
}

/**
 * The times of each imported place, found by the row it was made from: the
 * same name and start, the first row not taken yet. The import skips a
 * duplicate, so the places are not the rows one by one.
 */
export function trackTimesFor(
  rows: readonly PreparedGpxPlace[],
  places: ReadonlyArray<{ id: number; name: string; lat: number | null; lng: number | null }>,
): Map<number, { started: DbTimestamp | null; ended: DbTimestamp | null }> {
  const taken = new Set<number>();
  const byPlace = new Map<number, { started: DbTimestamp | null; ended: DbTimestamp | null }>();
  for (const place of places) {
    const index = rows.findIndex(
      (row, at) => !taken.has(at) && row.name === place.name && row.lat === place.lat && row.lng === place.lng,
    );
    if (index >= 0) taken.add(index);
    byPlace.set(place.id, storedTimes(rows[index]));
  }
  return byPlace;
}
