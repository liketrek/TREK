import { COLLECTION_TOUR_WAYPOINTS } from '../../db/json-columns';
import type { CollectionTourInsert, CollectionTourRow } from '../../db/repositories/CollectionTours.repository';
import { encodeJson } from '../../utils/json-column';
import { copiedColumns, type TourCopySource } from './tour-copy.helpers';
import { parseRouteGeometry, thinnedLine } from './tours.helpers';
import {
  COLLECTION_TOUR_PREVIEW_POINTS,
  walkStationFacts,
  type BikeProfile,
  type CollectionTourItem,
  type CollectionTourPoint,
  type RunProfile,
  type SkiDiscipline,
  type SkiTechnique,
  type TourOrigin,
  type TourTypeKey,
} from '@trek/shared';

/** MDT-01: a kept multi-day tour's stages, one more than the stops that end one, as the trip's list counts them. */
function keptStageCount(row: Pick<CollectionTourRow, 'waypoints'>): number | null {
  const ends = row.waypoints.filter((point) => point.stage_end === true).length;
  return ends > 0 ? ends + 1 : null;
}

/**
 * LIB-03: a kept tour as the collection lists it, its measures as they were
 * saved, null staying null, with what the trip's list shows of its type (the
 * ski discipline, the run's pace, the bike profile, the stages), so a kept tour looks as it did in the trip it came from.
 */
export function keptTourItem(row: CollectionTourRow): CollectionTourItem {
  return {
    id: row.id,
    collection_id: row.collection_id,
    name: row.name,
    description: row.description,
    tour_type: row.tour_type as TourTypeKey,
    distance: row.distance,
    elevation_gain: row.elevation_gain,
    elevation_loss: row.elevation_loss,
    duration: row.duration,
    planned_duration_minutes: row.planned_duration_minutes,
    break_additional_minutes: row.break_additional_minutes,
    max_hiking_difficulty: row.max_hiking_difficulty,
    wanderer_ref: row.wanderer_ref,
    bike_profile: row.bike_profile as BikeProfile | null,
    run_profile: row.run_profile as RunProfile | null,
    run_pace_seconds_per_km: row.run_pace_seconds_per_km,
    ski_discipline: row.ski_discipline as SkiDiscipline | null,
    ski_technique: row.ski_technique as SkiTechnique | null,
    stage_count: keptStageCount(row),
    origin: row.origin as TourOrigin,
    has_line: row.route_geometry !== null,
    waypoint_count: row.waypoints.length,
    ...walkStationFacts(row.tour_type, row.waypoints),
    source: { tripTitle: row.source_trip_title, tourName: row.source_tour_name },
    saved_by: row.saved_by_name,
    saved_at: row.created_at,
  };
}

/** The kept line thinned for the preview, as plain points. */
export function keptTourLine(row: Pick<CollectionTourRow, 'route_geometry'>): Array<[number, number]> {
  const line = parseRouteGeometry(row.route_geometry).map((point): [number, number] => [point[0], point[1]]);
  return thinnedLine(line, COLLECTION_TOUR_PREVIEW_POINTS);
}

/** The kept control points in route order, as the preview names them. */
export function keptTourPoints(row: Pick<CollectionTourRow, 'waypoints'>): CollectionTourPoint[] {
  return [...row.waypoints]
    .sort((a, b) => a.sequence - b.sequence)
    .map((point) => ({ role: point.role, name: point.name ?? null, shaping: point.shaping === true }));
}

/**
 * What saving a tour into a collection keeps of it: the whole tour as its
 * copy model reads it, under the name chosen, and the trip and tour it came
 * from as they are called now. A point standing for a place of the trip
 * stands for nothing outside it, so that link stays behind. The points are
 * checked against their column's shape as they are encoded; a point that
 * does not fit refuses the whole snapshot before anything is written.
 */
export function keptTourSnapshot(
  source: TourCopySource,
  keep: { collectionId: number; userId: number; name: string; tripTitle: string },
): CollectionTourInsert {
  const { facet } = source;
  return {
    collection_id: keep.collectionId,
    saved_by: keep.userId,
    name: keep.name,
    description: source.description,
    website: source.website,
    route_geometry: source.route_geometry,
    waypoints: encodeJson(
      COLLECTION_TOUR_WAYPOINTS,
      source.waypoints.map((point) => ({ ...point, linked_place_id: null })),
    ),
    ...copiedColumns(facet),
    origin_file_name: facet.origin_file_name,
    source_trip_title: keep.tripTitle,
    source_tour_name: source.name,
  };
}

/**
 * A kept tour as a new tour of a trip is made from it, through the one copy
 * model. With its points left out it keeps its line as saved and takes no
 * points at all: none are made up from the line.
 */
export function keptTourCopySource(row: CollectionTourRow, includeWaypoints: boolean): TourCopySource {
  return {
    place_id: null,
    name: row.name,
    description: row.description,
    website: row.website,
    route_geometry: row.route_geometry,
    facet: {
      ...copiedColumns(row),
      origin_file_name: row.origin_file_name,
      taken_over_from_trip_title: row.source_trip_title,
      taken_over_from_tour_name: row.source_tour_name,
    },
    waypoints: includeWaypoints ? row.waypoints : [],
  };
}
