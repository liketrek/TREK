import { chosenAfterId, insertionPreview } from '@trek/shared';
import { useMemo } from 'react';
import { useTourPoiStore } from '../../../store/tourPoiStore';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { useSelectedPoi } from './useTourPoiSearch';

/**
 * PLN-04: while a place's card is open, the straight lines it would add to
 * the tour in the slot picked for it, for the map to draw dashed before
 * anything is taken in. Nothing while it cannot be taken in there.
 */
export function usePoiInsertionPreview(
  planner: Pick<TourPlannerController, 'waypoints' | 'route' | 'canEdit'>
): Array<[number, number]> | null {
  const poi = useSelectedPoi();
  const slot = useTourPoiStore((state) => state.slot);
  const { waypoints, route, canEdit } = planner;
  return useMemo(() => {
    if (!poi || !canEdit) return null;
    const afterId = chosenAfterId(waypoints, route, poi, slot);
    return afterId ? insertionPreview(waypoints, afterId, poi) : null;
  }, [canEdit, poi, route, slot, waypoints]);
}

interface DrawnLines {
  route: [number, number][][] | null;
  routeWalking: boolean[] | null;
  routeColors: ({ line: string; casing: string } | undefined)[] | null;
}

/**
 * The planner map's lines with the preview laid over them as a dotted stretch
 * in the route's own blue, as the map draws a walked or unrouted bit: it
 * reads as a part of this tour that is not planned yet.
 */
export function withPreviewLine<T extends DrawnLines>(drawn: T, line: Array<[number, number]> | null): T {
  if (!line) return drawn;
  const route = drawn.route ?? [];
  return {
    ...drawn,
    route: [...route, line],
    routeWalking: [...(drawn.routeWalking ?? route.map(() => false)), true],
    routeColors: drawn.routeColors ? [...drawn.routeColors, undefined] : null,
  };
}
