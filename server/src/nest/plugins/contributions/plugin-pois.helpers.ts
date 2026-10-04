import {
  PLUGIN_POI_DETAIL_LABEL_MAX,
  PLUGIN_POI_DETAIL_VALUE_MAX,
  PLUGIN_POI_DETAILS_MAX,
  PLUGIN_POI_HIT_CAP,
  pluginPoiCategoryKey,
  type PluginPoi,
  type PluginPoiCategory,
  type PluginPoiDetail,
} from '@trek/shared';
import { clampPoiBbox, type PoiBbox } from '../../maps/maps.helpers';
import { sanitiseAssistantText } from '../text-sanitize';
import { normalizeSearchHit } from './plugin-search.helpers';

/**
 * Turning what a `poiCategoryProvider` answers into explore-pill POIs (#1781).
 *
 * Shared by the REST route and the MCP tool for the reason plugin-search.helpers.ts
 * gives: a cap that held on one path and not the other would be a hole with a second
 * door. Each hit goes through the search normalizer first, so a place from a category
 * chip is capped, namespaced and url-checked exactly like one from a search, and only
 * then gains what a POI row carries.
 */

// How much of a plugin's answer the host is willing to walk. Bounds the WORK, not
// only the output: an answer of a million malformed rows would otherwise be read in
// full on the host's event loop before the cap ever applied.
const MAX_RAW_POIS = PLUGIN_POI_HIT_CAP * 4;
const MAX_RAW_DETAILS = PLUGIN_POI_DETAILS_MAX * 4;

/**
 * The box a provider is asked about: the viewport narrowed to the same search window
 * the Overpass path uses, then folded back onto the globe. A map panned across the
 * antimeridian reports its edges unwrapped (a west of 190), and no provider should
 * have to know that.
 */
export function pluginPoiWindow(bbox: PoiBbox): { bounds: PoiBbox; clamped: boolean } {
  const narrowed = clampPoiBbox(bbox);
  const b = narrowed.bbox;
  const shift = Math.round((b.west + b.east) / 2 / 360) * 360;
  const west = b.west - shift;
  const east = b.east - shift;
  const bounds = {
    south: Math.max(-90, b.south),
    west: Math.max(-180, west),
    north: Math.min(90, b.north),
    east: Math.min(180, east),
  };
  const cut = bounds.south !== b.south || bounds.north !== b.north || bounds.west !== west || bounds.east !== east;
  return { bounds, clamped: narrowed.clamped || cut };
}

function detailText(v: unknown, max: number): string {
  // A string, or a figure a plugin sent as one. An object would read "[object Object]".
  if (typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && Number.isFinite(v))) {
    return sanitiseAssistantText(String(v), max);
  }
  return '';
}

/**
 * The rows only a plugin can answer (trail length, step-free entrance, water type).
 * Flattened to one line each and emoji-stripped, like MCP tool text: the list is shown
 * in the map popup and also handed to an assistant.
 */
export function normalizePoiDetails(raw: unknown): PluginPoiDetail[] {
  if (!Array.isArray(raw)) return [];
  const out: PluginPoiDetail[] = [];
  for (const d of raw.slice(0, MAX_RAW_DETAILS)) {
    if (out.length >= PLUGIN_POI_DETAILS_MAX) break;
    if (!d || typeof d !== 'object') continue;
    const row = d as Record<string, unknown>;
    const label = detailText(row.label, PLUGIN_POI_DETAIL_LABEL_MAX);
    const value = detailText(row.value, PLUGIN_POI_DETAIL_VALUE_MAX);
    if (label && value) out.push({ label, value });
  }
  return out;
}

function inside(bounds: PoiBbox, lat: number, lng: number): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}

/**
 * The POIs of one plugin answer: well-formed, inside the box the plugin was asked
 * about, unique by id, and at most the per-category share a core category gets.
 * `truncated` says the plugin sent more than that (or more than the host would read).
 */
export function normalizePluginPois(
  pluginId: string,
  category: PluginPoiCategory,
  bounds: PoiBbox,
  raw: unknown[],
): { pois: PluginPoi[]; truncated: boolean } {
  const key = pluginPoiCategoryKey(pluginId, category.id);
  const byId = new Map<string, PluginPoi>();
  let truncated = raw.length > MAX_RAW_POIS;
  for (const entry of raw.slice(0, MAX_RAW_POIS)) {
    const hit = normalizeSearchHit(pluginId, entry);
    if (!hit || !inside(bounds, hit.lat, hit.lng) || byId.has(hit.osm_id)) continue;
    if (byId.size >= PLUGIN_POI_HIT_CAP) {
      truncated = true;
      break;
    }
    byId.set(hit.osm_id, {
      osm_id: hit.osm_id,
      name: hit.name,
      lat: hit.lat,
      lng: hit.lng,
      // The host names the category, never the plugin: a hit claiming another
      // plugin's key (or a core one) would otherwise restyle markers it does not own.
      category: key,
      poi_type: key,
      address: hit.address || null,
      website: hit.website,
      phone: hit.phone,
      opening_hours: null,
      cuisine: null,
      brand: null,
      brand_wikidata: null,
      charging: null,
      source: hit.source,
      pluginId,
      rating: hit.rating,
      details: normalizePoiDetails((entry as Record<string, unknown>).details),
      icon: category.icon,
      color: category.color,
    });
  }
  return { pois: [...byId.values()], truncated };
}
