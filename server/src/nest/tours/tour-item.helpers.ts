/**
 * The read half of ToursService that needs no database: a tour as it is
 * listed, and where it came from as its provenance names it.
 */
import { TOUR_HIKING_PREFERENCES, TOUR_SKI_ROUTE, TOUR_TRACK_MARKS } from '../../db/json-columns';
import type { TourActivityRefRow } from '../../db/repositories/TourActivities.repository';
import type { TourWaypointRow } from '../../db/repositories/TourWaypoints.repository';
import type { TourListRow, TourProvenanceRow } from '../../db/repositories/Tours.repository';
import { utcSuffix } from '../../db/types';
import { decodeJson } from '../../utils/json-column';
import { activityFacts } from './tour-activities.helpers';
import { LOW_CONFIDENCE_THRESHOLD } from './tours.helpers';
import {
  tourStageStopsOf,
  tourTimeEstimate,
  walkStationFacts,
  type BikeProfile,
  type PaddleBoatType,
  type PaddleLakeStyle,
  type PaddleWaterContext,
  type RunProfile,
  type SkiDiscipline,
  type SkiTechnique,
  type TourListItem,
  type TourOrigin,
  type TourProvenanceSource,
} from '@trek/shared';

/** MDT-02: the stops a multi-day tour's stages run between; null where its points do not tell them. */
function stageStopsOrNull(points: Parameters<typeof tourStageStopsOf>[0]): TourListItem['stage_stops'] {
  const stops = tourStageStopsOf(points);
  return stops.length > 0 ? stops : null;
}

/** A ski tour's piste router options and the build its legs ran on, where it keeps them; nothing for any other tour. */
function skiRouteFacts(r: TourListRow): Pick<TourListItem, 'ski_options' | 'ski_route_build' | 'ski_planned_legs'> {
  if (r.tour_type !== 'ski' || !r.ski_options) return {};
  const route = decodeJson(TOUR_SKI_ROUTE, r.ski_options, 'tour');
  if (!route) return {};
  return { ski_options: route.options, ski_route_build: route.build, ski_planned_legs: route.planned_legs ?? null };
}

/**
 * A tour as it is listed; a city walk with the stations its points make and their stays (CW-02, CW-03),
 * every tour with the recordings assigned to it and the tour it documents itself (ACT-01).
 */
export function tourItemOf(
  r: TourListRow,
  points: readonly TourWaypointRow[] = [],
  activities: readonly TourActivityRefRow[] = [],
): TourListItem {
  return {
    place_id: r.place_id,
    name: r.name,
    description: r.description,
    website: r.website,
    tour_type: r.tour_type as TourListItem['tour_type'],
    distance: r.distance,
    elevation_gain: r.elevation_gain,
    elevation_loss: r.elevation_loss,
    duration: r.duration,
    planned_duration_minutes: r.planned_duration_minutes,
    break_additional_minutes: r.break_additional_minutes,
    difficulty: r.difficulty,
    wanderer_ref: r.wanderer_ref,
    match_confidence: r.match_confidence,
    max_hiking_difficulty: r.max_hiking_difficulty,
    derived_from_place_id: r.derived_from_place_id,
    origin: r.origin as TourOrigin,
    bike_profile: r.bike_profile as BikeProfile | null,
    run_profile: r.run_profile as RunProfile | null,
    run_pace_seconds_per_km: r.run_pace_seconds_per_km,
    ski_discipline: r.ski_discipline as SkiDiscipline | null,
    ski_technique: r.ski_technique as SkiTechnique | null,
    ...skiRouteFacts(r),
    boat_type: r.boat_type as PaddleBoatType | null,
    water_context: r.water_context as PaddleWaterContext | null,
    paddle_speed_kmh: r.paddle_speed_kmh,
    portage_speed_kmh: r.portage_speed_kmh,
    paddle_lake_style: r.paddle_lake_style as PaddleLakeStyle | null,
    track_marks: decodeJson(TOUR_TRACK_MARKS, r.track_marks, 'tour'),
    has_recorded_track: Boolean(r.has_recorded_track),
    planned: Boolean(r.planned),
    caution: r.match_confidence !== null && r.match_confidence < LOW_CONFIDENCE_THRESHOLD,
    has_waypoints: Boolean(r.has_waypoints),
    revision: r.revision,
    hiking_preferences: decodeJson(TOUR_HIKING_PREFERENCES, r.hiking_preferences, 'tour'),
    ...walkStationFacts(r.tour_type, points),
    route_pending: Boolean(r.route_missing) && Boolean(r.has_waypoints),
    track_started_at: utcSuffix(r.track_started_at),
    track_ended_at: utcSuffix(r.track_ended_at),
    // TIME-01: what a tour without a planned time is estimated to take, worked out here on every read.
    time_estimate: tourTimeEstimate(r),
    ...activityFacts(r.place_id, activities),
    // MDT-01: a multi-day tour's stages, one more than the stops that end one.
    stage_count: r.stage_ends > 0 ? r.stage_ends + 1 : null,
    // MDT-02: the stops they run between, by which a day holds one of them.
    stage_stops: r.stage_ends > 0 ? stageStopsOrNull(points) : null,
  };
}

/** What the source of a tour carried, read from the tour's own record and its import's snapshot row. */
export function provenanceSource(origin: TourOrigin, row: TourProvenanceRow): TourProvenanceSource {
  if (origin === 'gpx') return { kind: 'gpx', fileName: row.origin_file_name };
  if (origin === 'wanderer') {
    // The reference `instance#trail` is on the tour itself, so a snapshot whose row is missing still names its source.
    const [refInstance, refTrail] = splitWandererRef(row.wanderer_ref);
    return {
      kind: 'wanderer',
      instance: row.source_instance ?? refInstance,
      externalId: row.source_external_id ?? refTrail,
      externalUrl: row.source_external_url,
      externalUpdated: row.source_external_updated,
      importedAt: row.source_imported_at,
    };
  }
  return { kind: 'trek' };
}

function splitWandererRef(ref: string | null): [string, string] {
  const at = ref?.lastIndexOf('#') ?? -1;
  return ref && at > 0 ? [ref.slice(0, at), ref.slice(at + 1)] : ['', ''];
}
