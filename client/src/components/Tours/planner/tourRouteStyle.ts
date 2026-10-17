import type { TourRoutePart } from './tourRouting';

/**
 * PAD-03, PAD-11: the paddle paints of the planner map, resolved from the
 * paddle tokens (`usePaddlePaint`): a portage in earth brown, whitewater and
 * boat passes in amber, a gap in the data or a leg no route was found for in
 * red, each over a rim in the map's own white.
 */
export interface RoutePaint {
  portage: string;
  rapids: string;
  gap: string;
  casing: string;
}

export interface TourRouteStyle {
  /** Per line: dotted (a stretch nobody routed: drawn by hand, carried, or a gap) or solid. */
  walking: boolean[] | null;
  /** Per line: a paddle paint, or the route's own colour where undefined. */
  colors: ({ line: string; casing: string } | undefined)[] | null;
}

function paddleColor(part: TourRoutePart, paint: RoutePaint): { line: string; casing: string } | undefined {
  if (part.land) return { line: paint.portage, casing: paint.casing };
  if (part.mark === 'rapids') return { line: paint.rapids, casing: paint.casing };
  if (part.mark === 'gap' || part.mark === 'unrouted') return { line: paint.gap, casing: paint.casing };
  return undefined;
}

/**
 * How the planner map draws the parts of a tour being edited. What no router
 * planned is dotted, so a routed path and a hand-drawn one never look alike:
 * a hike's hand-drawn stretches, a paddle tour's portages, gaps, unrouted legs
 * and stretches drawn by hand. A paddle tour also colours what the paddler
 * should look at.
 */
export function tourRouteStyle(
  parts: readonly TourRoutePart[] | null,
  isPaddle: boolean,
  paint: RoutePaint
): TourRouteStyle {
  if (!parts?.length) return { walking: null, colors: null };
  const walking = parts.map((part) => part.free || !!part.land || part.mark === 'gap' || part.mark === 'unrouted');
  const colors = parts.map((part) => (isPaddle ? paddleColor(part, paint) : undefined));
  return {
    walking: walking.some(Boolean) ? walking : null,
    colors: colors.some(Boolean) ? colors : null,
  };
}
