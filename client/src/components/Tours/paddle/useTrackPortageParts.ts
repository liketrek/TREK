import { useMemo } from 'react';
import { useTrackMarkToolStore } from '../../../store/trackMarkToolStore';
import { splitTrackByPortages } from '../../../utils/paddleTrackMarks';
import type { TourRoutePart } from '../planner/tourRouting';
import type { TourPlannerController } from '../planner/useTourPlanner';

/**
 * The recorded paddle track in view, cut where portages are marked on it, as
 * the parts the planner map draws: water as the plain line, each carried
 * stretch on its own. Null while no paddle track with a portage is open.
 */
export function useTrackPortageParts(
  planner: Pick<TourPlannerController, 'mode' | 'readOnlyGpxAnalysis'>
): TourRoutePart[] | null {
  const placeId = planner.mode.type === 'view-gpx' ? planner.mode.placeId : null;
  const portages = useTrackMarkToolStore((state) => (state.placeId === placeId ? state.marks.portages : null));
  const line = planner.mode.type === 'view-gpx' ? planner.readOnlyGpxAnalysis?.routeCoordinates : undefined;
  return useMemo(() => {
    if (!line?.length || !portages?.length) return null;
    return splitTrackByPortages(line, portages).map((part) => ({
      coordinates: part.coordinates,
      free: false,
      ...(part.land ? { land: true } : {}),
    }));
  }, [line, portages]);
}
