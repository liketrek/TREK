import type { TourWaypointRow } from '../../db/repositories/TourWaypoints.repository';
import type { TourListRow, TourProvenanceRow, ToursRepository } from '../../db/repositories/Tours.repository';
import { parseRouteGeometry } from './tours.helpers';
import type {
  BikeProfile,
  PaddleBoatType,
  PaddleLakeStyle,
  PaddleWaterContext,
  RunProfile,
  SkiDiscipline,
  SkiTechnique,
  TourOrigin,
} from '@trek/shared';

/** The facet columns a copy carries over as its source has them, measures and settings alike. */
interface TourCopiedColumns {
  tour_type: string;
  distance: number | null;
  elevation_gain: number | null;
  elevation_loss: number | null;
  duration: number | null;
  planned_duration_minutes: number | null;
  break_additional_minutes: number | null;
  difficulty: string | null;
  wanderer_ref: string | null;
  match_confidence: number | null;
  max_hiking_difficulty: number | null;
  bike_profile: string | null;
  run_profile: string | null;
  run_pace_seconds_per_km: number | null;
  ski_discipline: string | null;
  ski_technique: string | null;
  /** A ski tour's piste router options and build as JSON text; absent where a read does not take it. */
  ski_options?: string | null;
  boat_type: string | null;
  water_context: string | null;
  paddle_speed_kmh: number | null;
  portage_speed_kmh: number | null;
  paddle_lake_style: string | null;
  track_marks: string | null;
  hiking_preferences: string | null;
  origin: string;
  /** A copy of a recording was recorded when it was (ACT-01); the assignments stay with the tours they joined. */
  track_started_at: string | null;
  track_ended_at: string | null;
}

/** The facet a copy is made from: the columns it carries over and where the tour came from. */
interface TourCopyFacet extends TourCopiedColumns {
  origin_file_name: string | null;
  taken_over_from_trip_title: string | null;
  taken_over_from_tour_name: string | null;
}

/** The columns as a copy writes them: a ski tour's options are always said, null where there are none. */
type CopiedColumns = Omit<TourCopiedColumns, 'ski_options'> & { ski_options: string | null };

/** The columns a copy carries over, read off any row that has them, and nothing else of it. */
export function copiedColumns(row: TourCopiedColumns): CopiedColumns {
  return {
    tour_type: row.tour_type,
    distance: row.distance,
    elevation_gain: row.elevation_gain,
    elevation_loss: row.elevation_loss,
    duration: row.duration,
    planned_duration_minutes: row.planned_duration_minutes,
    break_additional_minutes: row.break_additional_minutes,
    difficulty: row.difficulty,
    wanderer_ref: row.wanderer_ref,
    match_confidence: row.match_confidence,
    max_hiking_difficulty: row.max_hiking_difficulty,
    bike_profile: row.bike_profile,
    run_profile: row.run_profile,
    run_pace_seconds_per_km: row.run_pace_seconds_per_km,
    ski_discipline: row.ski_discipline,
    ski_technique: row.ski_technique,
    ski_options: row.ski_options ?? null,
    boat_type: row.boat_type,
    water_context: row.water_context,
    paddle_speed_kmh: row.paddle_speed_kmh,
    portage_speed_kmh: row.portage_speed_kmh,
    paddle_lake_style: row.paddle_lake_style,
    track_marks: row.track_marks,
    hiking_preferences: row.hiking_preferences,
    origin: row.origin,
    track_started_at: row.track_started_at,
    track_ended_at: row.track_ended_at,
  };
}

/**
 * What one copy of a tour is made from, whatever it is made into: a copy in
 * its own trip (P2C-07), a take-over from another trip (LIB-02), a tour kept in
 * a collection or a tour made from one (LIB-03). The one model every copy
 * reads and writes, so the line, the type, the measures and the points never
 * come apart on the way.
 */
export interface TourCopySource {
  /** The tour of a trip it is read from; null for a tour kept in a collection, which belongs to no trip. */
  place_id: number | null;
  name: string;
  description: string | null;
  website: string | null;
  /** The line as stored; null for a city walk saved with its stations only (CW-11). */
  route_geometry: string | null;
  facet: TourCopyFacet;
  /** The control points in route order; empty where none come along. */
  waypoints: TourWaypointRow[];
}

/** The trip and tour a copy says it was taken over from, as they were called then. */
export interface TakenOverFrom {
  tripTitle: string;
  tourName: string;
}

/** How a copy relates to where it came from. */
export interface TourCopyLinks {
  /** The tour of the same trip the copy was planned from (P2C-07); null for any other copy. */
  derivedFrom: number | null;
  /** Within its own trip a copy keeps its points' links to the trip's places and the decisions about its obstacles. */
  sameTrip: boolean;
  /** Where the copy was taken over from; left out, it keeps what its source says. */
  takenOverFrom?: TakenOverFrom;
}

/** A saved tour of a trip as a copy is made from it: its row, its provenance, its points. */
export function tourCopySourceOf(
  row: TourListRow,
  provenance: TourProvenanceRow,
  waypoints: TourWaypointRow[],
): TourCopySource {
  return {
    place_id: row.place_id,
    name: row.name,
    description: row.description ?? null,
    website: row.website ?? null,
    route_geometry: provenance.route_geometry,
    facet: {
      ...copiedColumns(row),
      origin_file_name: provenance.origin_file_name,
      taken_over_from_trip_title: provenance.taken_over_from_trip_title,
      taken_over_from_tour_name: provenance.taken_over_from_tour_name,
    },
    waypoints,
  };
}

/**
 * Where a copy's place goes: the line's first point, or for a city walk saved
 * with its stations only its first station. Undefined when there is neither,
 * a source a copy cannot be made from.
 */
export function copyStart(source: Pick<TourCopySource, 'route_geometry' | 'waypoints'>): [number, number] | undefined {
  if (source.route_geometry == null) {
    const first = source.waypoints[0];
    return first ? [first.lat, first.lng] : undefined;
  }
  const point = parseRouteGeometry(source.route_geometry)[0];
  return point ? [point[0], point[1]] : undefined;
}

/** The facet row a copy is written with: every measure and setting as its source has it, its own place and links. */
export function copiedFacet(
  source: TourCopySource,
  placeId: number,
  links: TourCopyLinks,
): Parameters<ToursRepository['insertTour']>[0] {
  const { facet } = source;
  return {
    ...facet,
    place_id: placeId,
    bike_profile: facet.bike_profile as BikeProfile | null,
    run_profile: facet.run_profile as RunProfile | null,
    ski_discipline: facet.ski_discipline as SkiDiscipline | null,
    ski_technique: facet.ski_technique as SkiTechnique | null,
    boat_type: facet.boat_type as PaddleBoatType | null,
    water_context: facet.water_context as PaddleWaterContext | null,
    paddle_lake_style: facet.paddle_lake_style as PaddleLakeStyle | null,
    origin: facet.origin as TourOrigin,
    derived_from_place_id: links.derivedFrom,
    // A copy of a copy names where the first one came from.
    taken_over_from_trip_title: links.takenOverFrom?.tripTitle ?? facet.taken_over_from_trip_title,
    taken_over_from_tour_name: links.takenOverFrom?.tourName ?? facet.taken_over_from_tour_name,
  };
}
