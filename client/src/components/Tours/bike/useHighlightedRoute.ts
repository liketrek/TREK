import { useMemo } from 'react';
import { useTourRouteHighlightStore } from '../../../store/tourRouteHighlightStore';
import { useHikePaint } from '../hike/hikePaint';
import { useBikePaint } from './bikePaint';
import { withRouteHighlight } from './routeHighlight';

type Lines = Parameters<typeof withRouteHighlight>[1];
type Walking = Parameters<typeof withRouteHighlight>[2];
type Colors = Parameters<typeof withRouteHighlight>[3];

/**
 * BIK-01 to BIK-05 and MAP-03: the planner map's route with the stretches a
 * bike tour's or a hike's card points at laid over it, while `shown` (the
 * tour's own line is on the map); otherwise the lines as they came.
 */
export function useHighlightedRoute(shown: boolean, route: Lines, walking: Walking, colors: Colors) {
  const highlight = useTourRouteHighlightStore((state) => state.highlight);
  const bike = useBikePaint();
  const hike = useHikePaint();
  const paint = useMemo(() => ({ ...bike, ...hike }), [bike, hike]);
  return withRouteHighlight(shown ? highlight : null, route, walking, colors, paint);
}
