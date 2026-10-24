import { useMapPaint } from '../../Map/mapPaint';

/** CW-12: the colours of a walk's crossing by boat and of a route kept from before (styles/walkRoute.css). */
const WALK_ROUTE_TOKENS = {
  ferry: '--map-walk-ferry',
  stale: '--map-route-stale',
} as const;

/** A crossing's water blue, for markup on the page. */
export const FERRY_CSS_COLOR = `var(${WALK_ROUTE_TOKENS.ferry})`;

/** The colours resolved for map paint, again whenever the theme changes. */
export function useWalkRoutePaint() {
  return useMapPaint(WALK_ROUTE_TOKENS);
}
