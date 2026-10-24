import type { PlannableTourType } from '@trek/shared';
import { useCallback, useMemo, useState } from 'react';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import {
  canEndStage,
  stageEndCount,
  tourStagesOf,
  withoutStageEnds,
  withStageEnd,
  type PaddleStageInputs,
} from './tourStages';

interface TourStagesOptions {
  waypoints: TourPlannerWaypoint[];
  /** The route as planned for exactly these points; null while it is not. */
  line: ReadonlyArray<readonly number[]> | null;
  tourType: PlannableTourType;
  routerSeconds: number | null;
  paddle: PaddleStageInputs | null;
  /** A run's pace, seconds per kilometre; its stages are timed at it as the whole run is. */
  runPaceSecondsPerKm: number | null;
  /** The planner's own change of the points: one step of the history, the draft unsaved again. */
  commit: (change: (current: TourPlannerWaypoint[]) => TourPlannerWaypoint[]) => void;
  /** Whether the points may change now: the viewer may edit and no save is on its way. */
  mayEdit: () => boolean;
  /** The draft the planner holds; a choice of a multi-day tour without a stage end yet belongs to it alone. */
  draftKey: string;
  /** How many stage ends the last change of the points could not keep. */
  lost: number;
}

/**
 * MDT-01: the stages of the tour in the planner, and how they are set. A tour
 * is a multi-day tour once one of its stops ends a stage; before that the
 * traveller can choose it and is shown where to set the first stage end. Back
 * to a day tour every stage end goes, as one step that undo brings back. The
 * route is never planned again for a stage change: the line stays the one
 * line, and the stages are cut from it.
 */
export function useTourStages({
  waypoints,
  line,
  tourType,
  routerSeconds,
  paddle,
  runPaceSecondsPerKm,
  commit,
  mayEdit,
  draftKey,
  lost,
}: TourStagesOptions) {
  const [chosenFor, setChosenFor] = useState<string | null>(null);
  const endCount = stageEndCount(waypoints);
  const multiDay = endCount > 0 || chosenFor === draftKey;
  const stages = useMemo(
    () =>
      multiDay ? tourStagesOf({ points: waypoints, line, tourType, routerSeconds, paddle, runPaceSecondsPerKm }) : [],
    [line, multiDay, paddle, routerSeconds, runPaceSecondsPerKm, tourType, waypoints]
  );

  const setMultiDay = useCallback(
    (on: boolean) => {
      if (!mayEdit()) return;
      setChosenFor(on ? draftKey : null);
      if (!on) commit(withoutStageEnds);
    },
    [commit, draftKey, mayEdit]
  );

  const toggleStageEnd = useCallback(
    (id: string) => {
      if (!mayEdit()) return;
      commit((current) => withStageEnd(current, id, !current.find((point) => point.id === id)?.stageEnd));
    },
    [commit, mayEdit]
  );

  const canEnd = useCallback((id: string) => canEndStage(waypoints, id), [waypoints]);

  return { multiDay, stages, endCount, lost, setMultiDay, toggleStageEnd, canEnd };
}

export type TourStagesController = ReturnType<typeof useTourStages>;
