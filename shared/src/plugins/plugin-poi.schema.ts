import { SUPPORTED_LANGUAGE_CODES } from '../i18n/languages';
import { PLUGIN_POI_ICONS, PLUGIN_POI_LABEL_MAX } from './plugin-poi-facts';

import { z } from 'zod';

/**
 * Plugin POI categories (#1781): a plugin adds its own chips to the trip map's
 * "Explore places" pill and answers the searches for them.
 *
 * Three wire shapes live here. The declared category is what GET /api/plugins hands
 * the client for every active plugin holding `hook:poi-category-provider`. The query
 * and the response are GET /api/plugin-pois, the route the client calls when one of
 * those chips is active. The response POI is the same row /api/maps/pois returns, so
 * the map draws a plugin POI through the code path a core one takes, plus the fields
 * only a plugin answer has (its details list, the category's icon and colour).
 */

/** A category id as the manifest declares it. Same shape as a route profile id. */
export const PLUGIN_POI_CATEGORY_ID_RE = /^[a-z][a-z0-9-]{0,23}$/;
/** A plugin id, as the manifest parser accepts it. */
export const PLUGIN_POI_PLUGIN_ID_RE = /^[a-z][a-z0-9-]{2,39}$/;
/**
 * A category colour. Only `#rrggbb`, because the client writes it into marker
 * markup and a CSS background: anything looser (`url(...)`, a second declaration
 * after a semicolon) would let a plugin restyle the map or turn every viewer into a
 * beacon for its own server.
 */
export const PLUGIN_POI_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Most POIs one plugin answer may carry, the same share a core category gets. */
export const PLUGIN_POI_HIT_CAP = 60;
/** Most detail rows one POI may carry, and the length of each half. */
export const PLUGIN_POI_DETAILS_MAX = 6;
export const PLUGIN_POI_DETAIL_LABEL_MAX = 40;
export const PLUGIN_POI_DETAIL_VALUE_MAX = 120;

export type PluginPoiIcon = (typeof PLUGIN_POI_ICONS)[number];

const LANGUAGE_CODES: ReadonlySet<string> = new Set(SUPPORTED_LANGUAGE_CODES);
const ICONS: ReadonlySet<string> = new Set(PLUGIN_POI_ICONS);

export function isPluginPoiIcon(value: unknown): value is PluginPoiIcon {
  return typeof value === 'string' && ICONS.has(value);
}

export function isPluginPoiColor(value: unknown): value is string {
  return typeof value === 'string' && PLUGIN_POI_COLOR_RE.test(value);
}

const categoryLabel = z.string().trim().min(1).max(PLUGIN_POI_LABEL_MAX);

/** One category a plugin declared, as the feed serves it after re-validation. */
export const pluginPoiCategorySchema = z.object({
  id: z.string().regex(PLUGIN_POI_CATEGORY_ID_RE),
  /** Shown when `labels` has nothing for the user's language. Plain text, never a key. */
  label: categoryLabel,
  /** Per-language labels keyed by TREK language code (`de`, `zh-TW`, ...). */
  labels: z
    .record(
      z.string().refine((code) => LANGUAGE_CODES.has(code)),
      categoryLabel,
    )
    .optional(),
  icon: z.enum(PLUGIN_POI_ICONS),
  color: z.string().regex(PLUGIN_POI_COLOR_RE),
});
export type PluginPoiCategory = z.infer<typeof pluginPoiCategorySchema>;

/** The label to show for `language`, falling back to the plugin's own default. */
export function pluginPoiCategoryLabel(
  category: Pick<PluginPoiCategory, 'label' | 'labels'>,
  language: string,
): string {
  // Own keys only, so an inherited name such as `toString` never reads as a label.
  // Object.entries rather than Object.hasOwn because the client compiles this file
  // against an ES2020 lib, where Object.hasOwn does not exist.
  const localized = Object.entries(category.labels ?? {}).find(([code]) => code === language)?.[1];
  return localized ?? category.label;
}

/**
 * The pill key of a plugin category. The `plugin:` prefix and the slash keep it apart
 * from every core key and from every other plugin's, which matters because the key
 * doubles as the marker cache key and the explore state key on the client.
 */
export function pluginPoiCategoryKey(pluginId: string, categoryId: string): string {
  return `plugin:${pluginId}/${categoryId}`;
}

/** The inverse of pluginPoiCategoryKey; null for anything that is not one. */
export function parsePluginPoiCategoryKey(key: string): { pluginId: string; categoryId: string } | null {
  if (!key.startsWith('plugin:')) return null;
  const rest = key.slice('plugin:'.length);
  const slash = rest.indexOf('/');
  if (slash < 0) return null;
  const pluginId = rest.slice(0, slash);
  const categoryId = rest.slice(slash + 1);
  if (!PLUGIN_POI_PLUGIN_ID_RE.test(pluginId) || !PLUGIN_POI_CATEGORY_ID_RE.test(categoryId)) return null;
  return { pluginId, categoryId };
}

/**
 * A bbox whose edges are the right way round. Shared by the query schema and the
 * MCP tool, which takes the same box as numbers.
 */
export function isOrderedPoiBbox(b: { south: number; west: number; north: number; east: number }): boolean {
  return b.south <= b.north && b.west <= b.east;
}

// Query values arrive as strings. A blank one is missing, not zero: Number('') is 0,
// and a bbox edge silently read as the equator would search the wrong continent.
const queryNumber = z.string().trim().min(1).pipe(z.coerce.number());

/**
 * GET /api/plugin-pois query. Latitudes must be real ones; longitudes may run past
 * the antimeridian, because a map that has been panned round the globe reports its
 * edges unwrapped and the server folds the window back itself.
 */
export const pluginPoiQuerySchema = z
  .object({
    pluginId: z.string().regex(PLUGIN_POI_PLUGIN_ID_RE),
    category: z.string().regex(PLUGIN_POI_CATEGORY_ID_RE),
    south: queryNumber.pipe(z.number().min(-90).max(90)),
    west: queryNumber,
    north: queryNumber.pipe(z.number().min(-90).max(90)),
    east: queryNumber,
    lang: z.string().max(35).optional(),
  })
  // The edges are picked out rather than the object handed over whole: the client
  // compiles this file without strict mode, where zod types the piped edges as
  // optional keys and the whole object would not fit isOrderedPoiBbox's parameter.
  .refine(({ south, west, north, east }) => isOrderedPoiBbox({ south, west, north, east }), {
    message: 'Invalid bbox',
    path: ['bbox'],
  });
export type PluginPoiQueryInput = z.input<typeof pluginPoiQuerySchema>;
export type PluginPoiQuery = z.output<typeof pluginPoiQuerySchema>;

/** One row of what a plugin knows that open data does not (trail length, step-free). */
export const pluginPoiDetailSchema = z.object({
  label: z.string().min(1).max(PLUGIN_POI_DETAIL_LABEL_MAX),
  value: z.string().min(1).max(PLUGIN_POI_DETAIL_VALUE_MAX),
});
export type PluginPoiDetail = z.infer<typeof pluginPoiDetailSchema>;

/**
 * One POI a plugin answered, in the row shape of GET /api/maps/pois. The OSM-only
 * fields are always null: a plugin answer has no opening-hours tag or brand id, and
 * saying so keeps the client from reading a plugin row as a thin OSM one.
 */
export const pluginPoiSchema = z.object({
  /** `plugin:<pluginId>:<id>`, so it can never collide with an OSM or index id. */
  osm_id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  /** The pill key, `plugin:<pluginId>/<categoryId>`. */
  category: z.string(),
  poi_type: z.string(),
  address: z.string().nullable(),
  website: z.string().nullable(),
  phone: z.string().nullable(),
  opening_hours: z.null(),
  cuisine: z.null(),
  brand: z.null(),
  brand_wikidata: z.null(),
  charging: z.null(),
  /** `plugin:<pluginId>`. */
  source: z.string(),
  pluginId: z.string(),
  rating: z.number().min(0).max(5).nullable(),
  details: z.array(pluginPoiDetailSchema).max(PLUGIN_POI_DETAILS_MAX),
  /** The declaring category's icon and colour, already checked against the allow-list. */
  icon: z.enum(PLUGIN_POI_ICONS),
  color: z.string().regex(PLUGIN_POI_COLOR_RE),
});
export type PluginPoi = z.infer<typeof pluginPoiSchema>;

export const pluginPoiResponseSchema = z.object({
  pois: z.array(pluginPoiSchema).max(PLUGIN_POI_HIT_CAP),
  /** `plugin:<pluginId>`, the attribution the core route reports as `openstreetmap`. */
  source: z.string(),
  /** The plugin answered more than the cap, or more than the host would read. */
  truncated: z.boolean(),
  /** The viewport was larger than a search window and was narrowed to its centre. */
  clamped: z.boolean(),
});
export type PluginPoiResponse = z.infer<typeof pluginPoiResponseSchema>;
