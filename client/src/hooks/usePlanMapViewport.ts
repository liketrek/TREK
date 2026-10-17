import { useCallback, useEffect } from 'react';
import { useTripStore } from '../store/tripStore';

interface Bounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

/**
 * Hands the plan map's viewport to the trip store, where the place search reads
 * it as its first hint (#2620). Returns the callback for the map's
 * `onViewportChange`. While `shown` is false, or once the map is gone, the
 * viewport is cleared: a search opened away from the map has nothing visible
 * to lean on, and falls back to the day and the trip.
 */
export function usePlanMapViewport(tripId: number, shown = true): (bounds: Bounds) => void {
  const setPlanMapViewport = useTripStore((s) => s.setPlanMapViewport);

  useEffect(() => {
    if (!shown) setPlanMapViewport(null);
    return () => setPlanMapViewport(null);
  }, [shown, tripId, setPlanMapViewport]);

  return useCallback(
    (bounds: Bounds) => {
      if (!shown || !Number.isFinite(tripId)) return;
      const { south, west, north, east } = bounds;
      setPlanMapViewport({ tripId, south, west, north, east });
    },
    [shown, tripId, setPlanMapViewport]
  );
}
