import type { PaddleLock } from '@trek/shared';
import { useCallback } from 'react';
import { setPortageExtraMinutes, setWaypointLock, togglePortageLeg } from '../planner/tourRouteActions';
import type { TourPlannerController } from '../planner/useTourPlanner';

/** The paddle edits of the planner's waypoint rows, each one step of its history. */
export function usePaddleWaypointActions(planner: TourPlannerController) {
  const { editPaddlePoints } = planner;
  return {
    togglePortage: useCallback(
      (id: string) => editPaddlePoints((points) => togglePortageLeg(points, id)),
      [editPaddlePoints]
    ),
    setPortageExtra: useCallback(
      (id: string, minutes: number | null) => editPaddlePoints((points) => setPortageExtraMinutes(points, id, minutes)),
      [editPaddlePoints]
    ),
    setLock: useCallback(
      (id: string, lock: PaddleLock | null) => editPaddlePoints((points) => setWaypointLock(points, id, lock)),
      [editPaddlePoints]
    ),
  };
}
