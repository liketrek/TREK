import { computeTourMetrics, type TourListItem } from '@trek/shared';
import { skiRouteKey, type SkiTourRoute } from '../planner/skiRouting';
import { tourWaypointKey, type TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import type { SavedSkiSeed } from '../planner/useTourRoute';
import type { SkiChoice } from './skiChoice';

/**
 * How far in km the length of the line read may stray from the length the
 * tour was saved with. Both are worked out the same way from the same points,
 * so a line that strays further is another save's.
 */
const SAME_LINE_KM = 0.005;

/** A line as its place keeps it: every point with its height, or nothing. */
function savedLineOf(routeGeometry: unknown): [number, number, number][] | null {
  let points: unknown = routeGeometry;
  if (typeof routeGeometry === 'string') {
    try {
      points = JSON.parse(routeGeometry);
    } catch {
      // Not a line at all: the tour is planned afresh.
      return null;
    }
  }
  if (!Array.isArray(points) || points.length < 2) return null;
  const line: [number, number, number][] = [];
  for (const point of points) {
    if (!Array.isArray(point) || point.length < 3) return null;
    const [lat, lng, height] = point as unknown[];
    if (![lat, lng, height].every((value) => typeof value === 'number' && Number.isFinite(value))) return null;
    line.push([lat as number, lng as number, height as number]);
  }
  return line;
}

type SavedSkiTour = Pick<
  TourListItem,
  'tour_type' | 'ski_discipline' | 'distance' | 'duration' | 'ski_route_build' | 'ski_planned_legs'
>;

/**
 * The legs the router planned, as the tour names them. A tour that does not
 * name them was planned throughout only when it kept the router's time.
 */
function plannedLegsOf(tour: SavedSkiTour, legCount: number): number[] {
  if (tour.ski_planned_legs) return [...tour.ski_planned_legs];
  if (!tour.ski_route_build || tour.duration == null) return [];
  return Array.from({ length: legCount }, (_, index) => index);
}

/**
 * SKI-02: a saved ski tour as the planner opens it: the line, the time and
 * the build it was saved with, so nothing is asked of the piste router until
 * a point or an option changes, and a tour opened offline or while the piste
 * data cannot be reached shows what was planned instead of straight lines.
 * Null when there is nothing to open it with: a tour of another type or
 * without a discipline, no line kept on this device, a line without every
 * height, or a line of another save than the tour's.
 */
export function savedSkiRoute(tour: SavedSkiTour, routeGeometry: unknown, legCount: number): SkiTourRoute | null {
  if (tour.tour_type !== 'ski' || !tour.ski_discipline || tour.distance == null) return null;
  const line = savedLineOf(routeGeometry);
  if (!line) return null;
  const { distanceKm } = computeTourMetrics(line);
  if (Math.abs(distanceKm - tour.distance) > SAME_LINE_KM) return null;
  const coordinates = line.map(([lat, lng]): [number, number] => [lat, lng]);
  return {
    coordinates,
    parts: [{ coordinates, free: false }],
    distanceMeters: distanceKm * 1000,
    durationSeconds: tour.duration == null ? null : tour.duration * 60,
    legs: [],
    problems: [],
    elevations: line,
    build: tour.ski_route_build ?? null,
    stale: false,
    areaNames: [],
    colourScheme: 'europe',
    attribution: null,
    plannedLegs: plannedLegsOf(tour, legCount),
    saved: true,
  };
}

/**
 * What the planner hands its route when it opens a saved ski tour: the route
 * as saved, for exactly the points and the ski choice it opens with. Null
 * when the tour opens to be planned afresh.
 */
export function savedSkiSeed(
  tour: SavedSkiTour,
  routeGeometry: unknown,
  waypoints: TourPlannerWaypoint[],
  choice: SkiChoice
): SavedSkiSeed | null {
  const route = savedSkiRoute(tour, routeGeometry, Math.max(0, waypoints.length - 1));
  return route ? { route, waypointKey: tourWaypointKey(waypoints), skiKey: skiRouteKey(choice) } : null;
}
