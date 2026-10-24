/**
 * MCP-T03/T04: what a save of a confirmed change and the taking back of one
 * have in common: the write of the tour's line and points through the write
 * the planner's save uses, with the tour's own name, type and options kept as
 * they are, and the tour as the answer of either gives it once written.
 */
import type { TourCreateCommand } from './tours.service';
import {
  plannableTourTypeSchema,
  walkStationsOf,
  type GeometryPoint,
  type TourDetailResponse,
  type TourListItem,
  type TourWaypoint,
} from '@trek/shared';

/** The line and points a write puts on the tour, and the revision it is based on. */
export interface TourLineWrite {
  route_geometry: GeometryPoint[] | null;
  duration_seconds: number | null;
  waypoints: TourWaypoint[];
  expected_revision: number;
}

/**
 * The write of a tour's line and points, everything else of the tour as it
 * is: a change of stations, or taking one back, changes nothing else. Every
 * setting of every type goes along, so a type that is no city walk keeps its
 * profile, pace, discipline or boat through such a write as well.
 */
export function tourWriteOf(tour: TourListItem, line: TourLineWrite): TourCreateCommand {
  return {
    name: tour.name,
    // Only a type that takes changes gets here, and each of them is one the planner draws.
    tour_type: plannableTourTypeSchema.parse(tour.tour_type),
    ...line,
    max_hiking_difficulty: tour.max_hiking_difficulty,
    hiking_preferences: tour.hiking_preferences,
    bike_profile: tour.bike_profile,
    run_profile: tour.run_profile,
    run_pace_seconds_per_km: tour.run_pace_seconds_per_km,
    ski_discipline: tour.ski_discipline,
    ski_technique: tour.ski_technique,
    ski_options: tour.ski_options,
    ski_route_build: tour.ski_route_build,
    ski_planned_legs: tour.ski_planned_legs,
    boat_type: tour.boat_type,
    water_context: tour.water_context,
    paddle_speed_kmh: tour.paddle_speed_kmh,
    portage_speed_kmh: tour.portage_speed_kmh,
    paddle_lake_style: tour.paddle_lake_style,
  };
}

/** The tour as now saved, read back through the read the app uses, at the revision the write raised it to. */
export function writtenTour(detail: TourDetailResponse, revision: number) {
  return {
    place_id: detail.tour.place_id,
    name: detail.tour.name,
    tour_type: detail.tour.tour_type,
    revision,
    distance_km: detail.tour.distance,
    walking_minutes: detail.tour.duration,
    route_pending: detail.tour.route_pending === true,
  };
}

/** The stations of the tour as now saved, in order, with their keys. */
export function writtenStations(detail: TourDetailResponse) {
  return walkStationsOf(detail.waypoints).map((station, index) => ({
    position: index + 1,
    key: station.key ?? null,
    name: station.name ?? null,
  }));
}
