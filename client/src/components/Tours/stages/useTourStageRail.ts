import type { TourListItem } from '@trek/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { showStage } from './stageActions';

type RailPlanner = Pick<
  TourPlannerController,
  'mode' | 'waypoints' | 'stages' | 'routeAnalysis' | 'setSelectedWaypointId' | 'setRouteProfileFocus'
>;

/** A stage asked for while its tour was still being opened: which tour, which stage, and what was open before. */
interface PendingStage {
  placeId: number;
  key: string;
  from: number | null;
}

const openPlaceId = (planner: Pick<TourPlannerController, 'mode'>) =>
  planner.mode.type === 'edit-saved' ? planner.mode.placeId : null;

/**
 * MDT-02: the multi-day tours unfolded in the planner's list, and a stage
 * opened from there: the tour opens in the planner as any tour does (asking
 * first when the open draft has unsaved changes), and once its points are in,
 * the stage is shown as the planner's own list of stages shows it. A stage of
 * the tour already open is shown at once. Asking for another tour, or opening
 * another one, lets the stage go, and so does an open the planner does not
 * carry out (`cancel`: the unsaved changes kept, the tour failing to open), so
 * a later open of that tour from its row does not show a stage nobody asked
 * for then. A stage the opened tour no longer has is let go as well.
 */
export function useTourStageRail(planner: RailPlanner, openTour: (tour: TourListItem) => void) {
  const [unfolded, setUnfolded] = useState<ReadonlySet<number>>(() => new Set());
  const [pending, setPending] = useState<PendingStage | null>(null);
  // The stage asked for that the effect below has settled (shown, or let go as stale); it is not shown twice.
  const settled = useRef<PendingStage | null>(null);

  const isUnfolded = useCallback((placeId: number) => unfolded.has(placeId), [unfolded]);
  const toggle = useCallback((placeId: number) => {
    setUnfolded((current) => {
      const next = new Set(current);
      if (!next.delete(placeId)) next.add(placeId);
      return next;
    });
  }, []);

  const openStage = useCallback(
    (tour: TourListItem, key: string) => {
      const open = openPlaceId(planner);
      setPending({ placeId: tour.place_id, key, from: open });
      if (open !== tour.place_id) openTour(tour);
    },
    [openTour, planner]
  );
  const cancel = useCallback(() => setPending(null), []);

  const open = openPlaceId(planner);
  const { waypoints } = planner;
  const { stages } = planner.stages;
  // Another tour opened instead: the stage asked for is no longer wanted. Let go
  // while rendering, as React adjusts state to a changed input, not in an effect.
  if (pending && open !== pending.placeId && open !== pending.from) setPending(null);
  useEffect(() => {
    if (!pending || settled.current === pending || open !== pending.placeId) return;
    const start = waypoints.find((point) => point.key === pending.key);
    const stage = start && stages.find((item) => item.fromId === start.id);
    if (!stage) {
      // The tour's points are in and no stage starts at that stop: the list it came from was stale.
      if (waypoints.length > 0) settled.current = pending;
      return;
    }
    showStage(planner, stage);
    settled.current = pending;
  }, [open, pending, planner, stages, waypoints]);

  return { isUnfolded, toggle, openStage, cancel };
}
