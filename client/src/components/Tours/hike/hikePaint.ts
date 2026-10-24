import { useMapPaint } from '../../Map/mapPaint';

/**
 * MAP-03 and MAP-04: the colours of what a hike's card draws along the line
 * (styles/hike.css), by name: the SAC grades, the surfaces and the kinds of
 * way. The card takes the CSS variable, which follows the theme on its own;
 * the map reads them resolved (`useHikePaint`). A way whose class is unknown
 * is drawn in the bike paints' grey of the unknown, the one grey the route
 * paints use for what the data does not say. The surface and way keys carry
 * their facet's prefix, so they never meet the bike paints' own names.
 */
const HIKE_PAINT_TOKENS = {
  t1: '--hike-sac-t1',
  t2: '--hike-sac-t2',
  t3: '--hike-sac-t3',
  t4: '--hike-sac-t4',
  t5: '--hike-sac-t5',
  t6: '--hike-sac-t6',
  'surface:paved': '--hike-surface-paved',
  'surface:sett': '--hike-surface-sett',
  'surface:compacted': '--hike-surface-compacted',
  'surface:gravel': '--hike-surface-gravel',
  'surface:ground': '--hike-surface-ground',
  'surface:grass': '--hike-surface-grass',
  'surface:rock': '--hike-surface-rock',
  'surface:wood': '--hike-surface-wood',
  'surface:unpaved': '--hike-surface-unpaved',
  'surface:other': '--hike-surface-other',
  'way:path': '--hike-way-path',
  'way:footway': '--hike-way-footway',
  'way:steps': '--hike-way-steps',
  'way:track': '--hike-way-track',
  'way:cycleway': '--hike-way-cycleway',
  'way:quietRoad': '--hike-way-quiet-road',
  'way:road': '--hike-way-road',
  'way:viaFerrata': '--hike-way-via-ferrata',
  'way:other': '--hike-way-other',
} as const;

export type HikePaintKey = keyof typeof HIKE_PAINT_TOKENS;

/** A colour as a CSS variable, for markup on the page. */
export function hikePaintCss(key: HikePaintKey): string {
  return `var(${HIKE_PAINT_TOKENS[key]})`;
}

/** The colours resolved for map paint, again whenever the theme changes. */
export function useHikePaint(): Record<HikePaintKey, string> {
  return useMapPaint(HIKE_PAINT_TOKENS);
}
