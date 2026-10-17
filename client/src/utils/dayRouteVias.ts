import type { RoadtripVia } from '@trek/shared';
import { isCarrierMode, mergeRouteSegments, viasOnLeg } from '@trek/shared/roadtrip';
import type { Assignment, AssignmentsMap, DistanceUnit, RouteSegment } from '../types';

/**
 * The stops of a day as the road trip counts them, in the order it drives them.
 *
 * This is the index space a via's `after_order_index` lives in: the STORED list, sorted
 * by `order_index` and filtered to the rows with coordinates. The stop a lodging booking
 * put on the day and the service stops are counted too, even where the day list hides
 * them, because the rail and the server count them.
 */
export function roadtripStopList(dayAssignments: readonly Assignment[] | undefined): Assignment[] {
  return (dayAssignments ?? [])
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .filter((a) => typeof a.place?.lat === 'number' && typeof a.place?.lng === 'number');
}

/** The trip's vias, keyed by the day they are filed against. */
export type ViasByDay = Record<number, readonly RoadtripVia[]>;

/** The vias shaping the drive between two assignments of a day, in driving order. */
export type DayViaLookup = (dayId: number, fromAssignmentId: number, toAssignmentId: number) => readonly RoadtripVia[];

const NONE: readonly RoadtripVia[] = [];

/**
 * The road a traveller picked in the road trip, for the views that draw a day without it.
 *
 * A chosen alternative or a hand-bent drive is stored as vias filed against the stop
 * they leave, so the day view asks for the same points between the same two stops. Only
 * between two stops that follow each other in the stored list: with a stop the day list
 * hides in between, the vias belong to a leg the day view does not draw, and bending the
 * shortcut through them would be a road nobody chose.
 *
 * Null when the trip has no vias, so a trip without a road trip routes exactly as before.
 */
export function dayViaLookup(stored: AssignmentsMap, viasByDay: ViasByDay | undefined): DayViaLookup | null {
  if (!viasByDay || !Object.values(viasByDay).some((list) => list.length)) return null;
  const indexByDay = new Map<number, Map<number, number>>();
  return (dayId, fromAssignmentId, toAssignmentId) => {
    const vias = viasByDay[dayId];
    if (!vias?.length) return NONE;
    let index = indexByDay.get(dayId);
    if (!index) {
      index = new Map(roadtripStopList(stored[String(dayId)]).map((a, i) => [a.id, i]));
      indexByDay.set(dayId, index);
    }
    const from = index.get(fromAssignmentId);
    if (from === undefined || index.get(toAssignmentId) !== from + 1) return NONE;
    return viasOnLeg({ ownerDayId: dayId, ownerIndex: from }, {}, vias);
  };
}

/**
 * The vias of one leg of a drawn day: none unless both ends are planned stops, and none
 * on a ride, which is no road.
 */
export function viasOnDayLeg(
  lookup: DayViaLookup | null,
  dayId: number,
  mode: string,
  from: { assignmentId?: number },
  to: { assignmentId?: number }
): readonly RoadtripVia[] {
  if (!lookup || isCarrierMode(mode) || from.assignmentId == null || to.assignmentId == null) return NONE;
  return lookup(dayId, from.assignmentId, to.assignmentId);
}

/** A stable key for the via list, so a routing effect re-runs when the road changes and only then. */
export function viaKeyOf(viasByDay: ViasByDay | undefined): string {
  return Object.entries(viasByDay ?? {})
    .map(
      ([dayId, vias]) =>
        `${dayId}:${vias.map((v) => `${v.after_order_index}@${v.lat.toFixed(5)},${v.lng.toFixed(5)}`).join('|')}`
    )
    .sort((a, b) => a.localeCompare(b))
    .join(';');
}

/**
 * The waypoints to ask the router for: the stops with the vias of each leg threaded in
 * between. `stopAt[i]` is the waypoint the i-th stop became, which is how the answer's
 * legs (one per waypoint pair) are folded back to one per stop pair.
 */
export function threadVias<P extends { lat: number; lng: number }>(
  points: readonly P[],
  viasBetween: (from: P, to: P) => readonly { lat: number; lng: number }[]
): { waypoints: { lat: number; lng: number }[]; stopAt: number[] } {
  const waypoints: { lat: number; lng: number }[] = [];
  const stopAt: number[] = [];
  points.forEach((point, i) => {
    stopAt.push(waypoints.length);
    waypoints.push({ lat: point.lat, lng: point.lng });
    if (i < points.length - 1)
      for (const via of viasBetween(point, points[i + 1])) waypoints.push({ lat: via.lat, lng: via.lng });
  });
  return { waypoints, stopAt };
}

/**
 * The router's legs read as one leg per stop pair again. Untouched when nothing was
 * threaded, or when the answer does not have a leg per waypoint pair (a plugin route may
 * not), since the pieces could not be told apart then.
 */
export function foldViaLegs(legs: RouteSegment[], stopAt: number[], unit: DistanceUnit | undefined): RouteSegment[] {
  const waypointCount = stopAt.length ? stopAt[stopAt.length - 1] + 1 : 0;
  if (waypointCount === stopAt.length || legs.length !== waypointCount - 1) return legs;
  const folded: RouteSegment[] = [];
  for (let i = 0; i < stopAt.length - 1; i++) {
    const parts = legs.slice(stopAt[i], stopAt[i + 1]);
    if (parts.length)
      folded.push(mergeRouteSegments(parts, unit === 'imperial' ? 'imperial' : 'metric') as RouteSegment);
  }
  return folded;
}
