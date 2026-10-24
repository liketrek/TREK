import type {
  PaddleLock,
  PlannableTourType,
  StationImportance,
  TourFixedLeg,
  TourPoiCategory,
  TourWaypoint,
  TourWaypointRole,
} from '@trek/shared';
import { rideLegs, withoutHorseRoutes } from '../horse/horseLegs';
import { walkOnly } from '../walk/walkFerry';
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
  /** PR1-10: the place of the trip this point stands for, chosen on purpose; the point keeps its own spot. */
  linkedPlaceId?: number;
  /** CW-03: the point's saved key, the same across saves, which a city walk's visits hang on. */
  key?: string;
  /** The point's own name: a city walk's station, a place found along the route. */
  name?: string | null;
  /** CW-02: a station's stay; null not known, 0 a point passed through. */
  stayMinutes?: number | null;
  /** CW-03: how much a station matters; absent is normal. */
  importance?: StationImportance | null;
  /** CW-10: a station a proposed change must leave where it is. */
  protected?: boolean;
  /** CW-04: the station's opening hours as OpenStreetMap writes them. */
  openingHours?: string | null;
  /** PLN-03: the kind of place the point was taken in from along the tour, whose icon its row carries. */
  poiCategory?: TourPoiCategory | null;
  /** MDT-01: a stop where a stage of a multi-day tour ends and the next begins. */
  stageEnd?: boolean;
}

/** Stops are numbered on their own, as on the map: a shaping point (P2A-03) takes no number. */
export function stopNumbersOf(points: ReadonlyArray<Pick<TourPlannerWaypoint, 'id' | 'shaping'>>): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const point of points) if (!point.shaping) numbers.set(point.id, numbers.size + 1);
  return numbers;
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
    ...(point.linked_place_id ? { linkedPlaceId: point.linked_place_id } : {}),
    ...(point.key ? { key: point.key } : {}),
    ...(point.name ? { name: point.name } : {}),
    ...(point.stay_minutes != null ? { stayMinutes: point.stay_minutes } : {}),
    ...(point.importance ? { importance: point.importance } : {}),
    ...(point.protected ? { protected: true } : {}),
    ...(point.opening_hours ? { openingHours: point.opening_hours } : {}),
    ...(point.poi_category ? { poiCategory: point.poi_category } : {}),
    ...(point.stage_end ? { stageEnd: true } : {}),
  }));
}

/**
 * The editor's waypoints as they are saved, in their order: what the server
 * keeps and nothing of the editor's own (ids, automatic marks, a portage
 * waiting for its next point).
 */
export function savedWaypointsOf(points: readonly TourPlannerWaypoint[], tourType?: PlannableTourType): TourWaypoint[] {
  // A stay, an importance and a protection belong to a city walk's stations; another type sends none.
  const walk = tourType === 'walk';
  return points.map((point, sequence) => ({
    lat: point.lat,
    lng: point.lng,
    role: point.role,
    sequence,
    ...(point.fixedLeg ? { fixed_leg: point.fixedLeg } : {}),
    ...(point.lock ? { lock: point.lock } : {}),
    ...(point.shaping ? { shaping: true } : {}),
    ...(point.linkedPlaceId ? { linked_place_id: point.linkedPlaceId } : {}),
    ...(point.key ? { key: point.key } : {}),
    ...(point.name ? { name: point.name } : {}),
    ...(walk && point.stayMinutes != null ? { stay_minutes: point.stayMinutes } : {}),
    ...(walk && point.importance ? { importance: point.importance } : {}),
    ...(walk && point.protected ? { protected: true } : {}),
    ...(point.openingHours ? { opening_hours: point.openingHours } : {}),
    ...(point.poiCategory ? { poi_category: point.poiCategory } : {}),
    ...(point.stageEnd ? { stage_end: true } : {}),
  }));
}

/** PR1-10: the point no longer standing for a place; moved away from it, it is a point of its own. */
export function unlinkedPoint<T extends TourPlannerWaypoint>(point: T): T {
  if (!point.linkedPlaceId) return point;
  const { linkedPlaceId: _place, ...free } = point;
  return free as T;
}

/** BIK-01: a bike tour rides no via ferrata; a leg that followed one is planned by the router again. */
export function ridablePoints(points: TourPlannerWaypoint[]): TourPlannerWaypoint[] {
  return points.some((point) => point.fixedLeg?.kind === 'ferrata')
    ? points.map((point) => (point.fixedLeg?.kind === 'ferrata' ? { ...point, fixedLeg: null } : point))
    : points;
}

/**
 * Roles from the order; free legs follow their points, and a paddle tour keeps
 * its portages and locks. A ride (HOR-01) has every leg on a horse route or
 * drawn by hand; any other type gives a horse route section back to the router,
 * and only a city walk keeps a crossing by boat (CW-12). A stage end (MDT-01) stays only where one can be: at a stop between start and
 * end. A mark that ends up elsewhere after a change (its point moved to an end,
 * made a shaping point) is dropped here, and the planner says so rather than
 * move it to another point.
 */
export function normalizePlannerWaypoints(
  points: TourPlannerWaypoint[],
  tourType: PlannableTourType = 'hike'
): TourPlannerWaypoint[] {
  const joined = keepJoinedFixedLegs(alignFreeLegs(points, tourType === 'kayak'));
  const typed = tourType === 'horse' ? rideLegs(joined) : withoutHorseRoutes(walkOnly(joined, tourType));
  return typed.map((point, index) => {
    const role = index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'via';
    if (!point.stageEnd || (role === 'via' && !point.shaping)) return { ...point, role };
    const { stageEnd: _dropped, ...rest } = point;
    return { ...rest, role };
  });
}

function fixedLegKey(leg: TourFixedLeg | null | undefined): string {
  if (!leg) return '';
  if (leg.kind === 'ferrata') return `:${leg.ref}`;
  // A section taken the other way round has the same ref and length: its first point tells them apart.
  if (leg.kind === 'horse_route') return `:${leg.ref}:${leg.geometry.length}:${leg.geometry[0]?.join(',')}`;
  return `:${leg.kind}:${leg.geometry.length}`;
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

/**
 * What was planned along the line that draws no line: a portage's time, a
 * lock, a point the router set, the place a point stands for. With
 * {@link tourWaypointKey} it is what a route is planned from.
 */
export function routeExtrasKey(points: TourPlannerWaypoint[]): string {
  return JSON.stringify(
    points.map((point) => [
      point.fixedLeg?.kind === 'portage' ? (point.fixedLeg.extra_minutes ?? null) : null,
      point.lock ?? null,
      !!point.auto,
      !!point.carryNext,
      point.linkedPlaceId ?? null,
    ])
  );
}

/**
 * CW-02: everything a route is planned from: every point with all it holds but
 * a station's own fields (its name, stay, importance, protection, opening
 * hours and the kind of place it was found as), the key a save gave it and
 * (MDT-01) whether a stage ends there. A change to those alone leaves the
 * route as it is; any other change plans it again.
 */
export function routeInputsKey(points: readonly TourPlannerWaypoint[]): string {
  return JSON.stringify(
    points.map(
      ({
        name: _name,
        stayMinutes: _stay,
        importance: _importance,
        protected: _protected,
        openingHours: _hours,
        poiCategory: _kind,
        key: _key,
        stageEnd: _stage,
        ...routed
      }) => routed
    )
  );
}

/** CW-01 to CW-04: what a city walk's station holds besides its spot, none of which the route depends on. */
function stationFieldsKey(points: TourPlannerWaypoint[]): string {
  return JSON.stringify(
    points.map((point) => [
      point.name ?? null,
      point.stayMinutes ?? null,
      point.importance ?? null,
      !!point.protected,
      point.openingHours ?? null,
      point.poiCategory ?? null,
    ])
  );
}

/** MDT-01: where the stages end, which the route does not depend on either. */
function stageEndsKey(points: TourPlannerWaypoint[]): string {
  return points.map((point) => (point.stageEnd ? '1' : '0')).join('');
}

/** The same step of the history: the line, what was planned along it, every station's own fields and the stage ends. */
export function sameWaypointSnapshot(a: TourPlannerWaypoint[], b: TourPlannerWaypoint[]): boolean {
  return (
    tourWaypointKey(a) === tourWaypointKey(b) &&
    routeExtrasKey(a) === routeExtrasKey(b) &&
    stationFieldsKey(a) === stationFieldsKey(b) &&
    stageEndsKey(a) === stageEndsKey(b)
  );
}

/**
 * CW-03: the keys a save was answered with, taken over by position. The server
 * keeps the points of a save in their order and gives one sent without a key
 * a key of its own; sent back with the next save, it keeps the visits made on
 * that station. An answer of another length is left alone, and nothing new
 * answers the same array.
 */
export function withSavedKeys(points: TourPlannerWaypoint[], saved: readonly TourWaypoint[]): TourPlannerWaypoint[] {
  if (saved.length !== points.length) return points;
  const keyed = points.map((point, index) => {
    const key = saved[index]?.key;
    return key && key !== point.key ? { ...point, key } : point;
  });
  return keyed.some((point, index) => point !== points[index]) ? keyed : points;
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

/**
 * RTE-02: the points with shaping points set, in their order, into the routed
 * leg from `afterId` to `beforeId`; unchanged when the two are no longer
 * neighbours or the leg between them is a fixed line, so a choice worked out
 * for one leg never lands in another.
 */
export function withShapingPoints(
  points: TourPlannerWaypoint[],
  afterId: string,
  beforeId: string,
  shapes: ReadonlyArray<Pick<TourPlannerWaypoint, 'id' | 'lat' | 'lng'>>
): TourPlannerWaypoint[] {
  const index = points.findIndex((point) => point.id === afterId);
  if (index < 0 || points[index + 1]?.id !== beforeId || points[index].fixedLeg || shapes.length === 0) return points;
  const inserted = shapes.map((shape) => ({ ...shape, role: 'via' as const, shaping: true }));
  return [...points.slice(0, index + 1), ...inserted, ...points.slice(index + 1)];
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
