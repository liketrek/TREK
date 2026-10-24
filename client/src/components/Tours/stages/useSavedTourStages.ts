import type { TourListItem, TourWaypoint } from '@trek/shared';
import { useEffect, useMemo, useState } from 'react';
import { tourPointsRepo } from '../../../repo/tourPointsRepo';
import { useTripStore } from '../../../store/tripStore';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { savedStagePoints, savedTourStagesOf, type SavedTourStage } from './savedTourStages';
import { stageTotalsOf, type StageTotals } from './tourStages';

type Loaded = { revision: string; points: readonly TourWaypoint[] } | { revision: string; failed: true };

export interface SavedTourStages {
  status: 'idle' | 'loading' | 'ready' | 'error';
  stages: SavedTourStage[];
  totals: StageTotals | null;
  /** The saved points the stages were read off, to name their stops. */
  points: TourPlannerWaypoint[];
}

const NONE: SavedTourStages = { status: 'idle', stages: [], totals: null, points: [] };

/**
 * MDT-02: the stages of a saved multi-day tour with what each measures, for
 * the list and the day plan. The points come through the tour repo, read from
 * the cache offline, and are read again once the tour's revision moves on, so
 * a saved change to the route shows here at once; the line is the trip's own
 * copy of the place, which a change updates too. Nothing is read while
 * `enabled` is off (a folded row) or the tour has no stages, and the rows
 * showing the same tour at once share one read.
 */
export function useSavedTourStages(
  tripId: number | string | null | undefined,
  tour: TourListItem,
  enabled: boolean
): SavedTourStages {
  const routeGeometry = useTripStore(
    (state) => state.places.find((place) => place.id === tour.place_id)?.route_geometry
  );
  const revision = `${tour.place_id}:${tour.revision ?? 0}`;
  const wanted = enabled && tripId != null && (tour.stage_count ?? 0) > 1;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!wanted || tripId == null) return undefined;
    const held = tourPointsRepo.hold(tripId, tour.place_id, revision);
    let live = true;
    held.points.then(
      (points) => {
        if (live) setLoaded({ revision, points });
      },
      () => {
        if (live) setLoaded({ revision, failed: true });
      }
    );
    return () => {
      live = false;
      held.release();
    };
  }, [revision, tour.place_id, tripId, wanted]);

  return useMemo(() => {
    if (!wanted) return NONE;
    if (!loaded || loaded.revision !== revision) return { ...NONE, status: 'loading' };
    if ('failed' in loaded) return { ...NONE, status: 'error' };
    const points = savedStagePoints(tour, loaded.points);
    const stages = savedTourStagesOf(tour, points, routeGeometry);
    return { status: 'ready', stages, totals: stageTotalsOf(stages), points };
  }, [loaded, revision, routeGeometry, tour, wanted]);
}
