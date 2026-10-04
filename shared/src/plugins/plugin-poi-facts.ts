/**
 * The fixed facts behind a plugin POI category (#1781): which icons one may use and
 * how many a plugin may declare.
 *
 * A file of plain constants with no imports on purpose. Besides the contract in
 * plugin-poi.schema.ts, server/scripts/gen-plugin-facts.ts reads it and writes the
 * same values into plugin-sdk/src/generated/host-facts.ts, so `trek-plugin validate`
 * checks a manifest against the list the host enforces. That script runs in a CI job
 * with only the server installed, which is why nothing here may pull in zod.
 */

/**
 * Lucide icon names a plugin POI category may carry.
 *
 * A closed list rather than any lucide name, for two reasons. The pill and the
 * marker builders resolve the name to a component or an SVG, and a closed list means
 * a plugin can never make the host import something it did not plan to ship. And the
 * choice is small on purpose: these are the shapes the use cases need (trails and
 * trailheads, charging, accessibility, water and toilets, camping, community places).
 * Lucide 0.344 has no toilet glyph, so Bath stands in for that one.
 */
export const PLUGIN_POI_ICONS = [
  'Footprints',
  'Mountain',
  'MountainSnow',
  'Signpost',
  'Trees',
  'TentTree',
  'Tent',
  'Accessibility',
  'Droplet',
  'Droplets',
  'PlugZap',
  'Zap',
  'Bath',
  'Bike',
  'Waves',
  'Landmark',
  'MapPin',
  'Star',
  'Heart',
  'Info',
] as const;

/** How many POI categories one plugin may add to the explore pill. */
export const PLUGIN_POI_MAX_CATEGORIES = 4;

/** Longest category label, in the fallback and in every per-language entry. */
export const PLUGIN_POI_LABEL_MAX = 40;
