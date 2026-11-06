import type { MapTiles } from '@trek/shared';

/** OpenStreetMap's own raster tiles: what a map view draws when the user named none it can use. */
export const OSM_TILES: MapTiles = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  max_zoom: 19,
};

/** Providers whose credit goes beyond OpenStreetMap's, by host suffix. */
const CREDITS: ReadonlyArray<[string, string]> = [['basemaps.cartocdn.com', '© OpenStreetMap contributors © CARTO']];

/** The placeholders a raster template may hold besides {z}/{x}/{y}: Leaflet's shard and retina markers. */
const SHARD = /\{s\}/g;
const RETINA = /\{r\}/g;

/**
 * The raster tiles a map view can draw from the user's tile URL setting: an
 * https template naming {z}, {x} and {y}, with Leaflet's {s} shard pinned to
 * "a" and its {r} retina marker dropped. A template that needs anything else
 * (an API key placeholder, a vector style, plain http) falls back to
 * OpenStreetMap's tiles: the view never guesses a value it was not given.
 */
export function rasterTiles(template: unknown): MapTiles {
  if (typeof template !== 'string' || !template.trim()) return OSM_TILES;
  const url = template.trim().replace(SHARD, 'a').replace(RETINA, '');
  if (!['{z}', '{x}', '{y}'].every((p) => url.includes(p))) return OSM_TILES;
  if (/\{(?![zxy]\})[^}]*\}/.test(url)) return OSM_TILES;
  let host: string;
  try {
    const parsed = new URL(url.replace(/\{[zxy]\}/g, '0'));
    if (parsed.protocol !== 'https:') return OSM_TILES;
    host = parsed.hostname;
  } catch {
    return OSM_TILES;
  }
  const credit = CREDITS.find(([suffix]) => host === suffix || host.endsWith(`.${suffix}`));
  return { url, attribution: credit?.[1] ?? OSM_TILES.attribution, max_zoom: OSM_TILES.max_zoom };
}

/** The origin a tile template loads from, for the view's content security policy. */
export function tileOrigin(tiles: MapTiles): string {
  return new URL(tiles.url.replace(/\{[zxy]\}/g, '0')).origin;
}
