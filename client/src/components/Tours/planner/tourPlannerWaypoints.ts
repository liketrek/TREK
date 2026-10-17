import type { PaddleLock, TourFixedLeg, TourWaypoint, TourWaypointRole } from '@trek/shared';
import type { AutoBase } from './paddleRouting';
import { keepJoinedFixedLegs } from './tourFixedLegs';
import { alignFreeLegs } from './tourRouteActions';

/** A control point of a planned tour, as the editor holds it. */
export interface TourPlannerWaypoint {
  id: string;
  lat: number;
  lng: number;
  role: TourWaypointRole;
  /** The leg to the next waypoint as a fixed line (a via ferrata on the tour), not routed. */
  fixedLeg?: TourFixedLeg | null;
  /** PAD-07: a lock at this point of a paddle tour, with the times expected there. */
  lock?: PaddleLock | null;
  /** P2A-03: a shaping point, there only to steer the route; no stop. */
  shaping?: boolean;
  /** PAD-11: set where the router found a portage or a lock; gone once the paddler touches the point. */
  auto?: AutoBase;
  /** PAD-03: at the last point, the boat is carried on to the next point once it is set; never saved. */
  carryNext?: boolean;
}

/** A saved tour's waypoints as the editor holds them, each under a fresh id. */
export function plannerWaypointsOf(saved: readonly TourWaypoint[], newId: () => string): TourPlannerWaypoint[] {
  return saved.map((point) => ({
    id: newId(),
    lat: point.lat,
    lng: point.lng,
    role: point.role,
    ...(point.fixed_leg ? { fixedLeg: point.fixed_leg } : {}),
    ...(point.lock ? { lock: point.lock } : {}),
    ...(point.shaping ? { shaping: true } : {}),
  }));
}

/**
 * The editor's waypoints as they are saved, in their order: what the server
 * keeps and nothing of the editor's own (ids, automatic marks, a portage
 * waiting for its next point).
 */
export function savedWaypointsOf(points: readonly TourPlannerWaypoint[]): TourWaypoint[] {
  return points.map((point, sequence) => ({
    lat: point.lat,
    lng: point.lng,
    role: point.role,
    sequence,
    ...(point.fixedLeg ? { fixed_leg: point.fixedLeg } : {}),
    ...(point.lock ? { lock: point.lock } : {}),
    ...(point.shaping ? { shaping: true } : {}),
  }));
}

/** Roles from the order; free legs follow their points, and a paddle tour keeps its portages and locks. */
export function normalizePlannerWaypoints(points: TourPlannerWaypoint[], paddle = false): TourPlannerWaypoint[] {
  return keepJoinedFixedLegs(alignFreeLegs(points, paddle)).map((point, index) => ({
    ...point,
    role: index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'via',
  }));
}

function fixedLegKey(leg: TourFixedLeg | null | undefined): string {
  if (!leg) return '';
  return leg.kind === 'ferrata' ? `:${leg.ref}` : `:${leg.kind}:${leg.geometry.length}`;
}

/** What the route depends on: every point, where it is, the fixed line after it and whether it only shapes. */
export function tourWaypointKey(points: TourPlannerWaypoint[]): string {
  return points
    .map(
      (point) =>
        `${point.id}:${point.lat.toFixed(7)}:${point.lng.toFixed(7)}${fixedLegKey(point.fixedLeg)}${point.shaping ? ':shape' : ''}`
    )
    .join('|');
}

/** The line, and what a paddler planned along it that draws no line: a portage's time, a lock, a point the router set. */
export function sameWaypointSnapshot(a: TourPlannerWaypoint[], b: TourPlannerWaypoint[]): boolean {
  const extras = (points: TourPlannerWaypoint[]) =>
    JSON.stringify(
      points.map((point) => [
        point.fixedLeg?.kind === 'portage' ? (point.fixedLeg.extra_minutes ?? null) : null,
        point.lock ?? null,
        !!point.auto,
        !!point.carryNext,
      ])
    );
  return tourWaypointKey(a) === tourWaypointKey(b) && extras(a) === extras(b);
}

/** P2A-03: the points with a shaping point set into the leg after `afterId`; unchanged when there is no such leg. */
export function withShapingPoint(
  points: TourPlannerWaypoint[],
  afterId: string,
  shape: Pick<TourPlannerWaypoint, 'id' | 'lat' | 'lng'>
): TourPlannerWaypoint[] {
  const index = points.findIndex((point) => point.id === afterId);
  if (index < 0 || index >= points.length - 1) return points;
  return [...points.slice(0, index + 1), { ...shape, role: 'via', shaping: true }, ...points.slice(index + 1)];
}

/** P2A-03: a stop made a shaping point, or a shaping point a stop. The ends of a tour are always stops. */
export function withShaping(points: TourPlannerWaypoint[], id: string, shaping: boolean): TourPlannerWaypoint[] {
  return points.map((point, index) => {
    if (point.id !== id || index === 0 || index === points.length - 1) return point;
    if (shaping) return { ...point, shaping: true };
    const { shaping: _dropped, ...stop } = point;
    return stop;
  });
}

/** PAD-11: every leg drawn by hand handed back to the router. */
export function withDrawnLegsRouted(points: TourPlannerWaypoint[]): TourPlannerWaypoint[] {
  return points.map((point) => {
    if (point.fixedLeg?.kind !== 'free') return point;
    const { fixedLeg: _drawn, ...routed } = point;
    return routed;
  });
}
