import { useCallback, type RefObject } from 'react';
import { randomId } from '../../../utils/randomId';
import { withDrawnLegsRouted, withShaping, withShapingPoint, type TourPlannerWaypoint } from './tourPlannerWaypoints';

type Commit = (change: (current: TourPlannerWaypoint[]) => TourPlannerWaypoint[]) => void;

/**
 * P2A-03, P2A-05 and PAD-11: the editor's tools for the line between the
 * stops. A shaping point steers the route without being a stop, a routed leg
 * can be planned afresh, and a paddle tour's legs drawn by hand go back to the
 * router in one step. Each change is one step of the history, through the
 * planner's own commit; nothing here plans a route itself.
 */
export function useRouteShaping({
  commit,
  waypointsRef,
  mayEdit,
  isPaddle,
  retry,
  forgetLeg,
}: {
  commit: Commit;
  waypointsRef: RefObject<TourPlannerWaypoint[]>;
  /** Whether the route may change now: the permission held and no save under way. */
  mayEdit: () => boolean;
  isPaddle: () => boolean;
  /** Plans the route again as it stands. */
  retry: () => void;
  /** Drops the answer kept for a paddle leg, so the router is asked again. */
  forgetLeg: (from: TourPlannerWaypoint, to: TourPlannerWaypoint) => void;
}) {
  /** A shaping point into the leg after `afterId`; its id, or null when there is no such leg. */
  const insertShapingPoint = useCallback(
    (afterId: string, lat: number, lng: number) => {
      if (!mayEdit() || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const points = waypointsRef.current;
      const shape = { id: randomId(), lat, lng };
      if (withShapingPoint(points, afterId, shape) === points) return null;
      commit((current) => withShapingPoint(current, afterId, shape));
      return shape.id;
    },
    [commit, mayEdit, waypointsRef]
  );

  const setWaypointShaping = useCallback(
    (id: string, shaping: boolean) => {
      if (mayEdit()) commit((current) => withShaping(current, id, shaping));
    },
    [commit, mayEdit]
  );

  const routeDrawnLegsOnWater = useCallback(() => {
    if (mayEdit() && isPaddle()) commit(withDrawnLegsRouted);
  }, [commit, isPaddle, mayEdit]);

  /** The routed leg after this waypoint planned afresh, past any answer kept from before. */
  const recomputeLeg = useCallback(
    (id: string) => {
      const points = waypointsRef.current;
      const index = points.findIndex((point) => point.id === id);
      const point = points[index];
      const next = points[index + 1];
      if (!point || !next || point.fixedLeg) return;
      if (isPaddle()) forgetLeg(point, next);
      retry();
    },
    [forgetLeg, isPaddle, retry, waypointsRef]
  );

  return { insertShapingPoint, setWaypointShaping, routeDrawnLegsOnWater, recomputeLeg };
}
