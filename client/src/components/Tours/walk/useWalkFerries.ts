import type { PlannableTourType } from '@trek/shared';
import { useCallback, useMemo } from 'react';
import { focusPaddleArea } from '../../../store/paddleObstacleStore';
import { walkTimes, type WalkTimes } from '../planner/stationModel';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import type { WalkFerryCrossing } from '../planner/tourRouting';
import { crossingLine, crossingsMinutesOf, ferryLegOf } from './walkFerry';

interface WalkFerriesInput {
  tourType: PlannableTourType;
  ferries: WalkFerryCrossing[] | null;
  routeCurrent: boolean;
  walkGap: number | null;
  waypoints: TourPlannerWaypoint[];
  editWaypoints: (change: (current: TourPlannerWaypoint[]) => TourPlannerWaypoint[]) => void;
}

/**
 * CW-02, CW-12: a city walk's stays, what of them is known, with the minutes
 * of its crossings by boat, taken or not, which are never walking; null for
 * any other type.
 */
export function useWalkStays(
  tourType: PlannableTourType,
  waypoints: readonly TourPlannerWaypoint[],
  ferries: readonly WalkFerryCrossing[] | null
): WalkTimes | null {
  const ferryMinutes = tourType === 'walk' && ferries ? crossingsMinutesOf(ferries) : undefined;
  return useMemo(() => {
    if (tourType !== 'walk') return null;
    const known = walkTimes(waypoints, null);
    return ferryMinutes === undefined ? known : { ...known, ferryMinutes };
  }, [ferryMinutes, tourType, waypoints]);
}

/** The ferry leg a crossing would be kept as; null where its line is longer than a leg may keep. */
function legOf(crossing: WalkFerryCrossing, points: readonly TourPlannerWaypoint[]) {
  const from = points[crossing.leg];
  const to = points[crossing.leg + 1];
  return from && to && !from.fixedLeg ? ferryLegOf(crossing, from, to) : null;
}

/**
 * CW-12: a city walk's crossings by boat as the planner handles them. A
 * crossing the router took is shown and explained but not saved until the
 * travellers take it as a ferry leg (`accept`, one step of the history), so
 * the boat never passes for walking unnoticed; `acceptable` is false for one
 * too long to keep. `gap` is the leg no way joins at all, while that is why
 * the route failed.
 */
export function useWalkFerries({
  tourType,
  ferries,
  routeCurrent,
  walkGap,
  waypoints,
  editWaypoints,
}: WalkFerriesInput) {
  const crossings = useMemo(
    () => (tourType === 'walk' && routeCurrent ? (ferries ?? []) : []),
    [ferries, routeCurrent, tourType]
  );
  const pending = useMemo(() => crossings.filter((crossing) => !crossing.accepted), [crossings]);
  const acceptable = useCallback((crossing: WalkFerryCrossing) => legOf(crossing, waypoints) !== null, [waypoints]);

  const accept = useCallback(
    (crossing: WalkFerryCrossing) => {
      editWaypoints((current) => {
        const leg = legOf(crossing, current);
        return leg
          ? current.map((point, index) => (index === crossing.leg ? { ...point, fixedLeg: leg } : point))
          : current;
      });
    },
    [editWaypoints]
  );

  /** A ferry leg given back: the leg is planned on foot again, as one step of the history. */
  const release = useCallback(
    (id: string) => {
      editWaypoints((current) =>
        current.map((point) => {
          if (point.id !== id || point.fixedLeg?.kind !== 'ferry') return point;
          const { fixedLeg: _crossing, ...onFoot } = point;
          return onFoot;
        })
      );
    },
    [editWaypoints]
  );

  const show = useCallback((crossing: WalkFerryCrossing) => focusPaddleArea(crossingLine(crossing)), []);

  return {
    crossings,
    pending,
    /** Save waits while a crossing is not taken on purpose. */
    blocksSave: pending.length > 0,
    gap: tourType === 'walk' && walkGap !== null && waypoints[walkGap + 1] ? { leg: walkGap } : null,
    acceptable,
    accept,
    release,
    show,
  };
}
