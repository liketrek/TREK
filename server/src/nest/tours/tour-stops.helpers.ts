import {
  alongRouteM,
  defaultAfterId,
  haversineMetres,
  insertionBlock,
  isClosedLoop,
  withPointAfter,
  type GeometryPoint,
  type HikeStop,
  type InsertionPoint,
  type TourStop,
  type TourWaypoint,
} from '@trek/shared';

/**
 * P6: the pure half of a stop taken into a saved tour or out of it (see
 * TourStopsService). The points of the tour are read as the planner reads
 * them for a found place (poi-insertion.ts in @trek/shared), so the stop goes
 * where the planner would put it and a leg drawn by hand is never cut.
 */

/** How near a saved point must lie to the stop to be the one the save made of it, in metres. */
const SAME_SPOT_M = 30;

/** A saved point as the insertion rule reads it, keeping the point itself. */
export interface StopPoint extends InsertionPoint {
  saved: TourWaypoint;
}

/** The id a point goes by: its key, or its place in the order where it has none yet. */
function idOf(point: TourWaypoint, index: number): string {
  return point.key ?? `#${index}`;
}

export function stopPointsOf(waypoints: readonly TourWaypoint[]): StopPoint[] {
  return waypoints.map((saved, index) => ({
    id: idOf(saved, index),
    lat: saved.lat,
    lng: saved.lng,
    role: saved.role,
    fixedLeg: saved.fixed_leg ?? null,
    ...(saved.shaping ? { shaping: true } : {}),
    saved,
  }));
}

/** Why the stop cannot go after the point named, in words an assistant can pass on. */
const BLOCKED: Readonly<Record<'fixed' | 'free' | 'none', string>> = {
  fixed: 'The leg after that point is a fixed line (a via ferrata, a ferry or a portage): a stop there would cut it.',
  free: 'The leg after that point is drawn by hand: a stop there would redraw it. Put the stop in the planner.',
  none: 'Nothing comes after that point: it is the way back of a loop. Name the point before it.',
};

/**
 * The point the stop goes after: the one named by its key, or the last point
 * before the stop along the saved line. A string says why it cannot go in.
 */
export function afterPointOf(
  points: readonly StopPoint[],
  line: readonly GeometryPoint[],
  stop: Pick<TourStop, 'lat' | 'lng'>,
  afterKey: string | undefined,
): StopPoint | string {
  if (afterKey !== undefined) {
    const named = points.find((point) => point.id === afterKey);
    if (!named) return `This tour has no point with the key ${afterKey}: read it again with get_tour_plan.`;
    if (named.shaping) return 'That point only shapes the line and is no stop: name a stop of the tour.';
    const block = insertionBlock(points, named.id);
    return block ? BLOCKED[block] : named;
  }
  const route = line.length > 1 ? line : null;
  const id = defaultAfterId(points, route, alongRouteM(points, route, stop));
  const chosen = points.find((point) => point.id === id);
  return chosen ?? 'No leg of this tour can take a stop: every one is drawn by hand or a fixed line.';
}

/** A saved point as a hike's update takes it: its spot, and its name, kind and stage end where it has them. */
function hikeStopOf(point: TourWaypoint): HikeStop {
  return {
    lat: point.lat,
    lng: point.lng,
    ...(point.name ? { name: point.name } : {}),
    ...(point.poi_category ? { poi_category: point.poi_category } : {}),
    ...(point.stage_end ? { stage_end: true } : {}),
  };
}

/** The stop as a new saved point would carry it; the server gives it its key on the save. */
function waypointOfStop(stop: TourStop): TourWaypoint {
  return {
    lat: stop.lat,
    lng: stop.lng,
    role: 'via',
    sequence: 0,
    ...(stop.name ? { name: stop.name } : {}),
    ...(stop.poi_category ? { poi_category: stop.poi_category } : {}),
  };
}

/** A hike's points with the stop after `afterId`, as update_tour takes them; null where it cannot go there. */
export function hikePointsWithStop(points: readonly StopPoint[], afterId: string, stop: TourStop): HikeStop[] | null {
  const added: StopPoint = { id: '#new', lat: stop.lat, lng: stop.lng, role: 'via', saved: waypointOfStop(stop) };
  const next = withPointAfter(points, afterId, added);
  return next ? next.map((point) => hikeStopOf(point.saved)) : null;
}

/** Why a stop cannot be taken out of these points, or null when it can. */
export function removalRefusal(points: readonly StopPoint[], key: string): string | null {
  const index = points.findIndex((point) => point.id === key);
  if (index < 0) return `This tour has no point with the key ${key}: read it again with get_tour_plan.`;
  if (points.length <= 2) return 'A tour keeps at least its start and its end: this point cannot be taken out.';
  if (index === 0) return 'The start of a tour is not taken out here: change the start in the planner.';
  if (isClosedLoop(points) && index === points.length - 1)
    return 'The way back of a loop is not taken out here: use the planner.';
  return null;
}

/** A hike's points without the one keyed `key`. */
export function hikePointsWithout(points: readonly StopPoint[], key: string): HikeStop[] {
  return points.filter((point) => point.id !== key).map((point) => hikeStopOf(point.saved));
}

/** The key the save gave the stop: the saved point nearest its spot, within a few metres of it. */
export function keyNear(waypoints: readonly TourWaypoint[], spot: { lat: number; lng: number }): string | null {
  let best: { key: string; metres: number } | null = null;
  for (const point of waypoints) {
    if (!point.key) continue;
    const metres = haversineMetres(point.lat, point.lng, spot.lat, spot.lng);
    if (metres <= SAME_SPOT_M && (!best || metres < best.metres)) best = { key: point.key, metres };
  }
  return best?.key ?? null;
}

/** The key of the point before the one keyed `key`, where it has one. */
export function keyBefore(points: readonly StopPoint[], key: string): string | null {
  const index = points.findIndex((point) => point.id === key);
  return index > 0 ? (points[index - 1]?.saved.key ?? null) : null;
}
