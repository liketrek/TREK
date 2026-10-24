import { isClosedLoop, turnedSignposted, type PaddleLock, type TourFixedLeg } from '@trek/shared';

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
  /**
   * PAD-03: the boat is carried on from this point, the last of the tour so
   * far; the portage is drawn to the next point once it is set. The planner's
   * own, never saved.
   */
  carryNext?: boolean;
}

/** What makes the start a station of a city walk (CW-01 to CW-04), and its saved key (CW-03). */
interface StationParts {
  key?: string;
  name?: string | null;
  stayMinutes?: number | null;
  importance?: string | null;
  protected?: boolean;
  openingHours?: string | null;
  poiCategory?: string | null;
}

/** A point split into what makes it a station and the rest of it; a part it does not have is left out. */
function stationSplit<T extends RoutePoint>(point: T & StationParts): { station: StationParts; rest: T } {
  const { key, name, stayMinutes, importance, protected: kept, openingHours, poiCategory, ...rest } = point;
  const parts: StationParts = { key, name, stayMinutes, importance, protected: kept, openingHours, poiCategory };
  const station = Object.fromEntries(Object.entries(parts).filter(([, value]) => value !== undefined));
  return { station, rest: rest as T };
}

/**
 * The tour taken back from its last point to its start: one end point on the
 * start's spot, not a second copy of the start among the stops. `newId` names
 * it; a tour that already returns, or has nothing to return from, is left as it is.
 * The way back is no station of its own, so it takes neither the start's key
 * nor its name, stay, importance, protection or opening hours.
 */
export function closeLoop<T extends RoutePoint>(points: readonly T[], newId: string): T[] {
  const first = points[0];
  if (!first || points.length < 2 || isClosedLoop(points)) return [...points];
  const { fixedLeg: _leg, lock: _lock, ...start } = stationSplit(first).rest;
  return [...points, { ...start, id: newId } as T];
}

/** A fixed leg run the other way: its line turned round, and a horse route section's signposting with it. */
function turnedLeg(leg: TourFixedLeg): TourFixedLeg {
  const geometry = [...leg.geometry].reverse();
  if (leg.kind !== 'horse_route') return { ...leg, geometry };
  return { ...leg, geometry, signposted: turnedSignposted(leg.signposted) };
}

/**
 * The same tour the other way round: the last point starts it, the stops run
 * backwards, and a fixed leg (a via ferrata, a hand-drawn stretch, a section of
 * a horse route) stays on the stretch it covered, its line turned round with
 * it. A loop stays a loop from the same spot, and its start stays the station
 * there: the way back is no station, so the start's key, name and stay stay
 * first (CW-02, CW-03).
 */
export function reverseRoute<T extends RoutePoint>(points: readonly T[]): T[] {
  const reversed = points.map((_, index) => {
    const point = points[points.length - 1 - index];
    // In the new order the leg after this point is the one that led into it before.
    const before = points[points.length - 2 - index];
    const { fixedLeg: _old, ...rest } = point;
    const leg = before?.fixedLeg;
    if (!leg || index === points.length - 1) return rest as T;
    return { ...rest, fixedLeg: turnedLeg(leg) } as T;
  });
  if (!isClosedLoop(points)) return reversed;
  const start = stationSplit(reversed[0]);
  const back = stationSplit(reversed[reversed.length - 1]);
  return [{ ...start.rest, ...back.station } as T, ...reversed.slice(1, -1), { ...back.rest, ...start.station } as T];
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

/** A line still joins its points when its ends lie this close to them, in degrees (about two metres). */
const JOINS_DEG = 2e-5;

function stillJoins(leg: TourFixedLeg, from: { lat: number; lng: number }, to: { lat: number; lng: number }): boolean {
  const first = leg.geometry[0];
  const last = leg.geometry[leg.geometry.length - 1];
  const near = (end: readonly unknown[] | undefined, point: { lat: number; lng: number }) =>
    !!end && Math.abs(Number(end[0]) - point.lat) < JOINS_DEG && Math.abs(Number(end[1]) - point.lng) < JOINS_DEG;
  return near(first, from) && near(last, to);
}

/**
 * Every hand-drawn leg redrawn straight to the waypoint that now follows it,
 * so moving a point drags it along instead of tearing it off; a leg on the
 * last point leads nowhere and goes. On a hike a portage and a lock are a
 * paddler's and go. On a paddle tour (`paddle`) a via ferrata is a hiker's
 * and goes back to the router; a portage and a lock stay, a portage is
 * dragged along like a drawn leg, and a portage or drawn leg whose line has
 * a shape of its own (a portage way the router followed) keeps it while its
 * ends still meet their points. A leg without a line stays routed. A portage
 * asked for at the last point of a paddle tour becomes one once a point follows.
 */
export function alignFreeLegs<T extends RoutePoint>(points: readonly T[], paddle = false): T[] {
  const aligned = points.map((current, index) => {
    const next = points[index + 1];
    const { carryNext, ...own } = current;
    if (carryNext && paddle) {
      if (!next) return current;
      return { ...own, fixedLeg: portageLegBetween(current, next) } as T;
    }
    const point = (carryNext ? own : current) as T;
    const kept = paddle ? dropHikeOnly(point) : dropPaddleOnly(point);
    const leg = kept.fixedLeg;
    const follows = leg?.kind === 'free' || (paddle && isPortage(leg));
    if (!follows || !leg) return kept;
    if (!next) {
      const { fixedLeg: _dropped, ...rest } = kept;
      return rest as T;
    }
    if (paddle && leg.geometry.length > 2 && stillJoins(leg, point, next)) return kept;
    return {
      ...kept,
      fixedLeg: isPortage(leg)
        ? portageLegBetween(point, next, leg.extra_minutes ?? null)
        : freeLegBetween(point, next),
    };
  });
  return paddle ? extrasOnFirstLeg(aligned) : aligned;
}

/** A boat climbs no via ferrata: its leg goes back to the router, on the water. */
function dropHikeOnly<T extends RoutePoint>(point: T): T {
  if (point.fixedLeg?.kind !== 'ferrata') return point;
  const { fixedLeg: _ferrata, ...routed } = point;
  return routed as T;
}

/** A hike carries no boat: a portage turns back into a routed leg and a lock goes. */
function dropPaddleOnly<T extends RoutePoint>(point: T): T {
  const { lock: _lock, ...rest } = point;
  if (!isPortage(point.fixedLeg)) return (point.lock ? rest : point) as T;
  const { fixedLeg: _leg, ...plain } = rest;
  return plain as T;
}

/**
 * PAD-03: the leg after this point carried as a portage, or planned on the water again. At
 * the last point there is no leg yet: the portage waits for the next point.
 */
export function togglePortageLeg<T extends RoutePoint>(points: readonly T[], id: string): T[] {
  const index = points.findIndex((point) => point.id === id);
  const point = points[index];
  const next = points[index + 1];
  if (!point) return [...points];
  const copy = [...points];
  if (!next) {
    const { carryNext, ...own } = point;
    copy[index] = (carryNext ? own : { ...point, carryNext: true }) as T;
    return copy;
  }
  if (isPortage(point.fixedLeg)) {
    // Paddled again means planned on the water again, not drawn by hand: the leg keeps no line of its own.
    const { fixedLeg: _portage, ...routed } = point;
    copy[index] = routed as T;
    return copy;
  }
  copy[index] = { ...point, fixedLeg: portageLegBetween(point, next) };
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
 * The leg after this waypoint drawn by hand, or routed again (on a paddle
 * tour: on the water). A via ferrata, a portage, a horse route section and a
 * walk's crossing by boat keep their line; the last point has no leg to change.
 */
export function toggleFreeLeg<T extends RoutePoint>(points: readonly T[], id: string): T[] {
  const index = points.findIndex((point) => point.id === id);
  const point = points[index];
  const next = points[index + 1];
  const kind = point?.fixedLeg?.kind;
  if (!point || !next || kind === 'ferrata' || kind === 'horse_route' || kind === 'ferry' || isPortage(point.fixedLeg))
    return [...points];
  const copy = [...points];
  if (point.fixedLeg?.kind === 'free') {
    const { fixedLeg: _dropped, ...rest } = point;
    copy[index] = rest as T;
  } else {
    copy[index] = { ...point, fixedLeg: freeLegBetween(point, next) };
  }
  return copy;
}
