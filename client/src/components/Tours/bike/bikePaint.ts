import { useMapPaint } from '../../Map/mapPaint';
import type { SurfaceClass, TrailClass } from './routeWays';

/**
 * The colours of a bike tour's or a run's surfaces and grades (styles/bike.css),
 * by name. The cards take the CSS variable, which follows the theme on its
 * own; the map reads them resolved (`useBikePaint`). A kind of way has no
 * colour of its own: it is pointed at in the accent.
 */
const BIKE_PAINT_TOKENS = {
  paved: '--bike-surface-paved',
  rough: '--bike-surface-rough',
  compacted: '--bike-surface-compacted',
  gravel: '--bike-surface-gravel',
  ground: '--bike-surface-ground',
  unknown: '--bike-surface-unknown',
  s0: '--bike-trail-s0',
  s1: '--bike-trail-s1',
  s2: '--bike-trail-s2',
  s3: '--bike-trail-s3',
  s4: '--bike-trail-s4',
  way: '--accent',
  casing: '--bike-highlight-casing',
} as const;

export type BikePaintKey = keyof typeof BIKE_PAINT_TOKENS;

/** The paint of a trail class; a way without a grade, or not asked about, in the grey of the unknown. */
export function trailPaintKey(key: TrailClass): BikePaintKey {
  return key === 'none' || key === 'unasked' ? 'unknown' : key;
}

/** The paint of a surface class. */
export function surfacePaintKey(key: SurfaceClass): BikePaintKey {
  return key;
}

/** A colour as a CSS variable, for markup on the page. */
export function bikePaintCss(key: BikePaintKey): string {
  return `var(${BIKE_PAINT_TOKENS[key]})`;
}

/** The colours resolved for map paint, again whenever the theme changes. */
export function useBikePaint(): Record<BikePaintKey, string> {
  return useMapPaint(BIKE_PAINT_TOKENS);
}
