import type { TourFixedLeg } from '@trek/shared';

/**
 * The route tools of the tour planner as plain list operations: reversing the
 * tour (PR1-02), closing it back to its start (PR1-01) and drawing a leg by
 * hand (P2A-04). Each takes the ordered waypoints and returns the new order;
 * the planner commits the result as one step of its history, so one undo
 * takes the whole action back.
 */
export interface RoutePoint {
  id: string;
  lat: number;
  lng: number;
  fixedLeg?: TourFixedLeg | null;
}

/** Closer than this, in degrees, two waypoints stand on the same spot (about a centimetre). */
const SAME_SPOT_DEG = 1e-7;

function sameSpot(a: { lat: number; lng: number }, b: { lat: number; lng: number }): boolean {
  return Math.abs(a.lat - b.lat) < SAME_SPOT_DEG && Math.abs(a.lng - b.lng) < SAME_SPOT_DEG;
}

/**
 * Whether the tour ends where it starts. Read from the points themselves, so a
 * saved loop opens as a loop again without a flag of its own; a tour of two
 * points on one spot is no loop, there is nothing to return from.
 */
export function isClosedLoop(points: readonly { lat: number; lng: number }[]): boolean {
  const first = points[0];
  const last = points[points.length - 1];
  return points.length >= 3 && !!first && !!last && sameSpot(first, last);
}

/**
 * The tour taken back from its last point to its start: one end point on the
 * start's spot, not a second copy of the start among the stops. `newId` names
 * it; a tour that already returns, or has nothing to return from, is left as it is.
 */
export function closeLoop<T extends RoutePoint>(points: readonly T[], newId: string): T[] {
  const first = points[0];
  if (!first || points.length < 2 || isClosedLoop(points)) return [...points];
  const { fixedLeg: _leg, ...start } = first;
  return [...points, { ...start, id: newId } as T];
}

/**
 * The same tour the other way round: the last point starts it, the stops run
 * backwards, and a fixed leg (a via ferrata, a hand-drawn stretch) stays on the
 * stretch it covered, its line turned round with it. A loop stays a loop from
 * the same spot.
 */
export function reverseRoute<T extends RoutePoint>(points: readonly T[]): T[] {
  return points.map((_, index) => {
    const point = points[points.length - 1 - index];
    // In the new order the leg after this point is the one that led into it before.
    const before = points[points.length - 2 - index];
    const { fixedLeg: _old, ...rest } = point;
    const leg = before?.fixedLeg;
    if (!leg || index === points.length - 1) return rest as T;
    return { ...rest, fixedLeg: { ...leg, geometry: [...leg.geometry].reverse() } } as T;
  });
}

/** A hand-drawn leg from this point straight to the next. */
export function freeLegBetween(from: { lat: number; lng: number }, to: { lat: number; lng: number }): TourFixedLeg {
  return {
    kind: 'free',
    geometry: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ],
  };
}

/**
 * Every hand-drawn leg redrawn straight to the waypoint that now follows it,
 * so moving a point drags its free legs along instead of tearing them off. A
 * free leg on the last point leads nowhere and goes. With `allFree` every leg
 * becomes hand-drawn, the way a paddle tour is planned.
 */
export function alignFreeLegs<T extends RoutePoint>(points: readonly T[], allFree = false): T[] {
  return points.map((point, index) => {
    const next = points[index + 1];
    const free = allFree || point.fixedLeg?.kind === 'free';
    if (!free) return point;
    if (!next) {
      if (!point.fixedLeg) return point;
      const { fixedLeg: _dropped, ...rest } = point;
      return rest as T;
    }
    return { ...point, fixedLeg: freeLegBetween(point, next) };
  });
}

/**
 * The leg after this waypoint drawn by hand, or routed again. A via ferrata
 * keeps its line; the last point has no leg to change.
 */
export function toggleFreeLeg<T extends RoutePoint>(points: readonly T[], id: string): T[] {
  const index = points.findIndex((point) => point.id === id);
  const point = points[index];
  const next = points[index + 1];
  if (!point || !next || point.fixedLeg?.kind === 'ferrata') return [...points];
  const copy = [...points];
  if (point.fixedLeg?.kind === 'free') {
    const { fixedLeg: _dropped, ...rest } = point;
    copy[index] = rest as T;
  } else {
    copy[index] = { ...point, fixedLeg: freeLegBetween(point, next) };
  }
  return copy;
}
