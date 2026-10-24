import { isClosedLoop, withPointAppended, type PlannableTourType, type TourFixedLeg } from '@trek/shared';
import { useCallback, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { randomId } from '../../../utils/randomId';
import { holdsHorseSection } from '../horse/horseLegs';
import { unlinkedPoint, type TourPlannerWaypoint } from './tourPlannerWaypoints';
import { closeLoop, reverseRoute, toggleFreeLeg } from './tourRouteActions';

type WaypointChange = TourPlannerWaypoint[] | ((current: TourPlannerWaypoint[]) => TourPlannerWaypoint[]);

export interface WaypointCommandsOptions {
  /** Lays a change in as one step of the history; the planner's own commit. */
  commitWaypoints: (next: WaypointChange) => void;
  editPermissionRef: RefObject<boolean>;
  saveInFlightRef: RefObject<boolean>;
  waypointsRef: RefObject<TourPlannerWaypoint[]>;
  tourTypeRef: RefObject<PlannableTourType>;
  setSelectedWaypointId: Dispatch<SetStateAction<string | null>>;
}

/**
 * The points a fixed leg is added as: one at the line's start that carries it,
 * and one at its end. It goes onto the end, or after the point `after` names
 * when that is a stop inside the route; a stop that carries a fixed leg of its
 * own keeps it, so the new leg goes after the point that leg ends at.
 */
export function withFixedLegInserted(
  current: TourPlannerWaypoint[],
  added: TourPlannerWaypoint[],
  after?: string | null
): TourPlannerWaypoint[] {
  const index = after ? current.findIndex((point) => point.id === after) : -1;
  if (index < 0) return [...current, ...added];
  const at = index + 1 + (current[index].fixedLeg ? 1 : 0);
  return [...current.slice(0, at), ...added, ...current.slice(at)];
}

/** The points with one moved to a new spot; in a loop the start and the way back are one spot, so both move. */
export function withPointMoved(points: TourPlannerWaypoint[], id: string, lat: number, lng: number) {
  const loopEnds =
    isClosedLoop(points) && (id === points[0].id || id === points[points.length - 1].id)
      ? new Set([points[0].id, points[points.length - 1].id])
      : new Set([id]);
  // A point moved stands for no place any more (PR1-10): it is where the hand put it.
  return points.map((point) => (loopEnds.has(point.id) ? unlinkedPoint({ ...point, lat, lng }) : point));
}

/** The points with one swapped with its neighbour; unchanged when there is no neighbour that way. */
export function withPointSwapped(current: TourPlannerWaypoint[], id: string, direction: -1 | 1) {
  const index = current.findIndex((point) => point.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= current.length) return current;
  const next = [...current];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/** The points with one taken out and put back before or after another; unchanged when either is missing. */
export function withPointReordered(
  current: TourPlannerWaypoint[],
  id: string,
  targetId: string,
  placement: 'before' | 'after'
) {
  const fromIndex = current.findIndex((point) => point.id === id);
  const targetIndex = current.findIndex((point) => point.id === targetId);
  if (fromIndex < 0 || targetIndex < 0) return current;
  const next = [...current];
  const [moved] = next.splice(fromIndex, 1);
  const targetAfterRemoval = next.findIndex((point) => point.id === targetId);
  const insertIndex = targetAfterRemoval + (placement === 'after' ? 1 : 0);
  next.splice(insertIndex, 0, moved);
  return next;
}

/**
 * The tour planner's commands on its points: adding, moving, removing and
 * reordering them, a fixed leg, a loop back to the start and the reverse. Each
 * is one step of the history through the planner's commit, and none acts while
 * the viewer may not edit; the ones a save in flight would race wait for it too.
 */
export function useWaypointCommands({
  commitWaypoints,
  editPermissionRef,
  saveInFlightRef,
  waypointsRef,
  tourTypeRef,
  setSelectedWaypointId,
}: WaypointCommandsOptions) {
  const addWaypoint = useCallback(
    (lat: number, lng: number) => {
      if (!editPermissionRef.current) return;
      const id = randomId();
      commitWaypoints((current) => withPointAppended<TourPlannerWaypoint>(current, { id, lat, lng, role: 'end' }));
      setSelectedWaypointId(id);
    },
    [commitWaypoints, editPermissionRef, setSelectedWaypointId]
  );

  /** A fixed leg onto the tour, as one step of the history (see withFixedLegInserted for where it goes). */
  const appendFixedLeg = useCallback(
    (leg: TourFixedLeg, after?: string | null) => {
      if (!editPermissionRef.current) return;
      const first = leg.geometry[0];
      const last = leg.geometry[leg.geometry.length - 1];
      if (!first || !last) return;
      const startId = randomId();
      const endId = randomId();
      const added: TourPlannerWaypoint[] = [
        { id: startId, lat: Number(first[0]), lng: Number(first[1]), role: 'via', fixedLeg: leg },
        { id: endId, lat: Number(last[0]), lng: Number(last[1]), role: 'end' },
      ];
      commitWaypoints((current) => withFixedLegInserted(current, added, after));
      setSelectedWaypointId(endId);
    },
    [commitWaypoints, editPermissionRef, setSelectedWaypointId]
  );

  const setWaypointPosition = useCallback(
    (id: string, lat: number, lng: number) => {
      if (!editPermissionRef.current || saveInFlightRef.current || !Number.isFinite(lat) || !Number.isFinite(lng))
        return false;
      const current = waypointsRef.current.find((point) => point.id === id);
      if (!current) return false;
      if (current.lat === lat && current.lng === lng) return true;
      // HOR-01: a ride's point at a horse route section stays where the route has it.
      if (tourTypeRef.current === 'horse' && holdsHorseSection(waypointsRef.current, id)) return false;
      commitWaypoints((list) => withPointMoved(list, id, lat, lng));
      return true;
    },
    [commitWaypoints, editPermissionRef, saveInFlightRef, tourTypeRef, waypointsRef]
  );

  /** PR1-01: the tour taken back from its last point to its start, as one step. */
  const returnToStart = useCallback(() => {
    if (!editPermissionRef.current || saveInFlightRef.current) return;
    commitWaypoints((current) => closeLoop(current, randomId()));
  }, [commitWaypoints, editPermissionRef, saveInFlightRef]);

  /** PR1-02: the tour the other way round, as one step. */
  const reverse = useCallback(() => {
    if (!editPermissionRef.current || saveInFlightRef.current) return;
    commitWaypoints((current) => reverseRoute(current));
  }, [commitWaypoints, editPermissionRef, saveInFlightRef]);

  /** PAD-03/PAD-07: a paddler's change to the control points (a portage, a lock), as one step. */
  const editPaddlePoints = useCallback(
    (change: (current: TourPlannerWaypoint[]) => TourPlannerWaypoint[]) => {
      if (!editPermissionRef.current || saveInFlightRef.current || tourTypeRef.current !== 'kayak') return;
      commitWaypoints(change);
    },
    [commitWaypoints, editPermissionRef, saveInFlightRef, tourTypeRef]
  );

  /** P2A-04: the leg after this waypoint drawn by hand, or routed again (a paddle tour's on the water). */
  const toggleWaypointFreeLeg = useCallback(
    (id: string) => {
      if (!editPermissionRef.current || saveInFlightRef.current) return;
      commitWaypoints((current) => toggleFreeLeg(current, id));
    },
    [commitWaypoints, editPermissionRef, saveInFlightRef]
  );

  const removeWaypoint = useCallback(
    (id: string) => {
      if (!editPermissionRef.current) return;
      commitWaypoints((current) => current.filter((point) => point.id !== id));
      setSelectedWaypointId((current) => (current === id ? null : current));
    },
    [commitWaypoints, editPermissionRef, setSelectedWaypointId]
  );

  const moveWaypoint = useCallback(
    (id: string, direction: -1 | 1) => commitWaypoints((current) => withPointSwapped(current, id, direction)),
    [commitWaypoints]
  );

  const reorderWaypoint = useCallback(
    (id: string, targetId: string, placement: 'before' | 'after') => {
      if (!editPermissionRef.current || saveInFlightRef.current || id === targetId) return;
      commitWaypoints((current) => withPointReordered(current, id, targetId, placement));
    },
    [commitWaypoints, editPermissionRef, saveInFlightRef]
  );

  return {
    addWaypoint,
    appendFixedLeg,
    setWaypointPosition,
    returnToStart,
    reverse,
    editPaddlePoints,
    toggleWaypointFreeLeg,
    removeWaypoint,
    moveWaypoint,
    reorderWaypoint,
  };
}
