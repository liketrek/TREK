import type { PaddleLock, TourFixedLeg } from '@trek/shared';

/**
 * The route tools of the tour planner as plain list operations: reversing the
 * tour (PR1-02), closing it back to its start (PR1-01) and drawing a leg by
 * hand (P2A-04), and a paddle tour's portages and locks (PAD-03, PAD-07). Each
 * takes the ordered waypoints and returns the new order;
 * the planner commits the result as one step of its history, so one undo
 * takes the whole action back.
 */
export interface RoutePoint {
  id: string;
  lat: number;
  lng: number;
  fixedLeg?: TourFixedLeg | null;
  lock?: PaddleLock | null;
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
  const { fixedLeg: _leg, lock: _lock, ...start } = first;
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

/** A portage from this point straight to the next: the boat is carried, on land. */
export function portageLegBetween(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  extraMinutes: number | null = null
): TourFixedLeg {
  return { ...freeLegBetween(from, to), kind: 'portage', extra_minutes: extraMinutes };
}

function isPortage(leg: TourFixedLeg | null | undefined): leg is Extract<TourFixedLeg, { kind: 'portage' }> {
  return leg?.kind === 'portage';
}

/**
 * A portage's time for getting out and back in belongs to its first leg. After
 * a reversal or a removal another leg can lead the portage; the time moves to
 * it rather than getting lost in the middle.
 */
function extrasOnFirstLeg<T extends RoutePoint>(points: T[]): T[] {
  let runStart = -1;
  points.forEach((point, index) => {
    const leg = point.fixedLeg;
    if (!isPortage(leg)) {
      runStart = -1;
      return;
    }
    if (runStart < 0) {
      runStart = index;
      return;
    }
    const first = points[runStart].fixedLeg;
    if (leg.extra_minutes != null && isPortage(first) && first.extra_minutes == null) {
      points[runStart] = { ...points[runStart], fixedLeg: { ...first, extra_minutes: leg.extra_minutes } };
    }
    if (leg.extra_minutes != null) points[index] = { ...point, fixedLeg: { ...leg, extra_minutes: null } };
  });
  return points;
}

/**
 * Every hand-drawn leg, and every portage, redrawn straight to the waypoint
 * that now follows it, so moving a point drags them along instead of tearing
 * them off. A leg on the last point leads nowhere and goes, and so does a lock
 * nobody paddles to on a tour that is no paddle tour. With `allFree` every
 * leg that is not a portage becomes hand-drawn, the way a paddle tour is planned.
 */
export function alignFreeLegs<T extends RoutePoint>(points: readonly T[], allFree = false): T[] {
  const aligned = points.map((point, index) => {
    const next = points[index + 1];
    const leg = point.fixedLeg;
    const kept = allFree ? point : dropPaddleOnly(point);
    const free = allFree || leg?.kind === 'free';
    if (!free && !(allFree && isPortage(leg))) return kept;
    if (!next) {
      if (!kept.fixedLeg) return kept;
      const { fixedLeg: _dropped, ...rest } = kept;
      return rest as T;
    }
    return {
      ...kept,
      fixedLeg: isPortage(leg)
        ? portageLegBetween(point, next, leg.extra_minutes ?? null)
        : freeLegBetween(point, next),
    };
  });
  return allFree ? extrasOnFirstLeg(aligned) : aligned;
}

/** A hike carries no boat: a portage turns back into a routed leg and a lock goes. */
function dropPaddleOnly<T extends RoutePoint>(point: T): T {
  const { lock: _lock, ...rest } = point;
  if (!isPortage(point.fixedLeg)) return (point.lock ? rest : point) as T;
  const { fixedLeg: _leg, ...plain } = rest;
  return plain as T;
}

/** PAD-03: the leg after this point carried as a portage, or paddled again. */
export function togglePortageLeg<T extends RoutePoint>(points: readonly T[], id: string): T[] {
  const index = points.findIndex((point) => point.id === id);
  const point = points[index];
  const next = points[index + 1];
  if (!point || !next) return [...points];
  const copy = [...points];
  copy[index] = {
    ...point,
    fixedLeg: isPortage(point.fixedLeg) ? freeLegBetween(point, next) : portageLegBetween(point, next),
  };
  return copy;
}

/** PAD-07: the time for getting out and back in at the portage that starts after this point. */
export function setPortageExtraMinutes<T extends RoutePoint>(
  points: readonly T[],
  id: string,
  minutes: number | null
): T[] {
  return points.map((point) =>
    point.id === id && isPortage(point.fixedLeg)
      ? { ...point, fixedLeg: { ...point.fixedLeg, extra_minutes: minutes } }
      : point
  );
}

/** PAD-07: a lock at this point with the times expected there, or no lock (null). */
export function setWaypointLock<T extends RoutePoint>(points: readonly T[], id: string, lock: PaddleLock | null): T[] {
  return points.map((point) => {
    if (point.id !== id) return point;
    if (lock) return { ...point, lock };
    const { lock: _dropped, ...rest } = point;
    return rest as T;
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
