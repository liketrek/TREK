import { z } from 'zod';

/**
 * Places a `searchProvider` plugin found (#2221). GET /api/plugin-search answers an
 * explicit search, GET /api/plugin-search/suggest the query while it is being typed,
 * and both send this row: the record the core search returns, plus the rating only a
 * plugin index can carry and the plugin that answered.
 *
 * The host has already capped, range-checked and namespaced every field
 * (plugin-search.helpers.ts). The client checks the answer against this again before
 * a row reaches the list, because a plugin is somebody else's code.
 */

/** Most rows one typed-ahead answer carries, all providers together. */
export const PLUGIN_SEARCH_SUGGEST_MAX = 3;

export const pluginSearchHitSchema = z.object({
  /** `plugin:<pluginId>:<id>`, so it can never collide with an OSM or index id. */
  osm_id: z.string().startsWith('plugin:'),
  name: z.string().min(1),
  address: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /** Zero to five, or null. Open data has no rating at all. */
  rating: z.number().min(0).max(5).nullable(),
  website: z.string().nullable(),
  phone: z.string().nullable(),
  category: z.string().nullable(),
  description: z.string().nullable(),
  /** `plugin:<pluginId>`, which the list shows as the plugin's name. */
  source: z.string().startsWith('plugin:'),
  pluginId: z.string(),
});
export type PluginSearchHit = z.infer<typeof pluginSearchHitSchema>;

export const pluginSuggestResultSchema = z.object({
  places: z.array(pluginSearchHitSchema).max(PLUGIN_SEARCH_SUGGEST_MAX),
});
export type PluginSuggestResult = z.infer<typeof pluginSuggestResultSchema>;
