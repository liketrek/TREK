import type { TourActivity } from '@trek/shared';
import { useCallback, useEffect } from 'react';
import { useTourActivityCompareStore } from '../../../store/tourActivityCompareStore';

/**
 * ACT-02 from the tour's detail: which of its actual tracks the plan map
 * compares with the plan, and the switch for it. One at a time: comparing
 * another ends the first. The comparison ends with the detail, and when the
 * track it shows is no longer linked to this tour, so the map never compares
 * a plan with a track that is not its own.
 */
export function useActivityComparison(tourPlaceId: number, activities: readonly TourActivity[] | null) {
  const comparedTrack = useTourActivityCompareStore((state) =>
    state.comparison?.tourPlaceId === tourPlaceId ? state.comparison.trackPlaceId : null
  );

  useEffect(() => {
    if (comparedTrack === null || activities === null) return;
    if (!activities.some((activity) => activity.track.place_id === comparedTrack)) {
      useTourActivityCompareStore.getState().clear();
    }
  }, [activities, comparedTrack]);

  useEffect(
    () => () => {
      const { comparison, clear } = useTourActivityCompareStore.getState();
      if (comparison?.tourPlaceId === tourPlaceId) clear();
    },
    [tourPlaceId]
  );

  const toggle = useCallback(
    (trackPlaceId: number) => {
      const { show } = useTourActivityCompareStore.getState();
      show(comparedTrack === trackPlaceId ? null : { tourPlaceId, trackPlaceId });
    },
    [comparedTrack, tourPlaceId]
  );

  return { comparedTrack, toggle };
}

export type ActivityComparisonState = ReturnType<typeof useActivityComparison>;
