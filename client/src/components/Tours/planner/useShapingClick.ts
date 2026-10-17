import { useCallback } from 'react';
import { legStartAt } from './routeLegAt';
import type { TourPlannerController } from './useTourPlanner';

/**
 * P2A-03: a click on the route being edited sets a shaping point where it
 * landed, in the leg that runs there, and selects it, ready to be dragged
 * where the route should go. Undefined while the points cannot be moved, or
 * while a click on the line picks a spot for something else.
 */
export function useShapingClick(
  planner: Pick<TourPlannerController, 'waypoints' | 'route' | 'insertShapingPoint' | 'setSelectedWaypointId'>,
  { editable, picking }: { editable: boolean; picking: boolean }
): ((lat: number, lng: number) => void) | undefined {
  const { waypoints, route, insertShapingPoint, setSelectedWaypointId } = planner;
  const shapeAt = useCallback(
    (lat: number, lng: number) => {
      const after = legStartAt(waypoints, route, lat, lng);
      if (!after) return;
      const id = insertShapingPoint(after, lat, lng);
      if (id) setSelectedWaypointId(id);
    },
    [insertShapingPoint, route, setSelectedWaypointId, waypoints]
  );
  return editable && !picking ? shapeAt : undefined;
}
