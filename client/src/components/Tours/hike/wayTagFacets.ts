import type { TourTrailGrade } from '@trek/shared';
import type { HikeFacetSpec } from './hikeFacets';
import type { HikePaintKey } from './hikePaint';

/**
 * MAP-04: the surfaces and the kinds of way along a hike, read from the
 * `surface` and `highway` values OpenStreetMap records for the ways under
 * it, never from the router's reading of them (normalised, and a default
 * where nothing is recorded). Each group lists the OpenStreetMap values it
 * takes, and only those: a value outside every group, or two joined by `;`,
 * is unclear rather than placed in the nearest group. The examples a group
 * is named after promise nothing about coverage.
 */

type HikeSurfaceClass =
  'paved' | 'sett' | 'compacted' | 'gravel' | 'ground' | 'grass' | 'rock' | 'wood' | 'unpaved' | 'other';

type HikeWayClass = 'path' | 'footway' | 'steps' | 'track' | 'cycleway' | 'quietRoad' | 'road' | 'viaFerrata' | 'other';

/** The `surface` values of each group, smooth and sealed first, then loose, natural and built over. */
const SURFACE_GROUPS: Readonly<Record<HikeSurfaceClass, readonly string[]>> = {
  paved: ['asphalt', 'concrete', 'concrete:plates', 'concrete:lanes', 'chipseal', 'paved'],
  sett: ['paving_stones', 'paving_stones:lanes', 'sett', 'cobblestone', 'unhewn_cobblestone', 'bricks', 'grass_paver'],
  compacted: ['compacted', 'fine_gravel'],
  gravel: ['gravel', 'pebblestone', 'shells'],
  ground: ['ground', 'dirt', 'earth', 'soil', 'mud', 'sand', 'woodchips'],
  grass: ['grass'],
  rock: ['rock', 'bare_rock', 'stone', 'stepping_stones'],
  wood: ['wood', 'metal', 'metal_grid'],
  // OpenStreetMap only says the way is not paved, not what it is instead.
  unpaved: ['unpaved'],
  other: ['artificial_turf', 'tartan', 'rubber', 'clay', 'acrylic', 'carpet', 'plastic', 'snow', 'ice', 'salt'],
};

/** The `highway` values of each group, the ways made for walking first, then those shared with traffic. */
const WAY_GROUPS: Readonly<Record<HikeWayClass, readonly string[]>> = {
  path: ['path', 'bridleway'],
  footway: ['footway', 'pedestrian'],
  steps: ['steps'],
  track: ['track'],
  cycleway: ['cycleway'],
  quietRoad: ['residential', 'living_street', 'service', 'unclassified'],
  road: [
    'tertiary',
    'tertiary_link',
    'secondary',
    'secondary_link',
    'primary',
    'primary_link',
    'trunk',
    'trunk_link',
    'road',
  ],
  viaFerrata: ['via_ferrata'],
  other: ['corridor', 'platform', 'busway', 'construction', 'elevator'],
};

/**
 * A facet that sorts one written value by its groups. The value is looked up
 * as OpenStreetMap writes its values, in lower case and trimmed; what the
 * card shows is the value as it was written.
 */
function groupedFacet<K extends string>(
  field: 'surface' | 'highway',
  groups: Readonly<Record<K, readonly string[]>>,
  paint: (key: K) => HikePaintKey
): HikeFacetSpec<K> {
  const classes = Object.keys(groups) as K[];
  const groupOf = new Map<string, K>(classes.flatMap((key) => groups[key].map((value) => [value, key] as const)));
  return {
    classes,
    read: (grade: TourTrailGrade | undefined) => {
      const written = grade?.[field] ?? null;
      if (!written) return { key: 'untagged', written: null };
      return { key: groupOf.get(written.trim().toLowerCase()) ?? 'unclear', written };
    },
    paint,
  };
}

export const SURFACE_FACET = groupedFacet<HikeSurfaceClass>('surface', SURFACE_GROUPS, (key) => `surface:${key}`);

export const WAY_FACET = groupedFacet<HikeWayClass>('highway', WAY_GROUPS, (key) => `way:${key}`);
