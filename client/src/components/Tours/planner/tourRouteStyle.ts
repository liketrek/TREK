import type { TourRoutePart } from './tourRouting';

/**
 * PAD-03: a portage on the map, in an earth brown over a rim in the map's own
 * white, dotted the way the map draws a walk: the boat is carried there, not
 * paddled. The colours come resolved from the paddle tokens (`usePaddlePaint`).
 */
export interface PortagePaint {
  line: string;
  casing: string;
}

export interface TourRouteStyle {
  /** Per line: dotted (a hand-drawn stretch of a hike, a portage) or solid. */
  walking: boolean[] | null;
  /** Per line: the portage brown, or the route's own colour where undefined. */
  colors: ({ line: string; casing: string } | undefined)[] | null;
}

/**
 * How the planner map draws the parts of a tour being edited. A hike draws
 * what no router planned dotted, so a routed path and a hand-drawn one never
 * look alike. A paddle tour is drawn by hand throughout, so its water is the
 * plain line and only its portages stand out, dotted and brown.
 */
export function tourRouteStyle(
  parts: readonly TourRoutePart[] | null,
  isPaddle: boolean,
  portage: PortagePaint
): TourRouteStyle {
  if (!parts?.length) return { walking: null, colors: null };
  const walking = parts.map((part) => (isPaddle ? !!part.land : part.free));
  const colors = parts.map((part) => (part.land ? { line: portage.line, casing: portage.casing } : undefined));
  return {
    walking: walking.some(Boolean) ? walking : null,
    colors: colors.some(Boolean) ? colors : null,
  };
}
