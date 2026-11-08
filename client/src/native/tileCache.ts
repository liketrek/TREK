import { hasNativeFeature } from './capabilities';
import { GL_MAPS_THROUGH_APP_SCHEMES } from './glSchemes';
import { isNativeApp, isNativeIos } from './platform';

/**
 * The iOS app's own tile store (TrekTileSchemeHandler.swift), reached through
 * the trek-tile:// scheme.
 *
 * WKWebView runs no service worker for a self-hosted server, so on iOS nothing
 * kept the map tiles a user had looked at. Binaries that report the tileCache
 * feature serve every trek-tile:// request from a store on disk, filled as the
 * tiles are viewed and kept for at most 30 days (Mapbox's limit for a device
 * cache, applied to every provider alike), and from the network otherwise. The
 * URL keeps its host and path, only the scheme changes, so the handler knows
 * where the tile really lives.
 *
 * Nothing is prefetched through here: Mapbox forbids bulk downloads, and the
 * OpenFreeMap region a trip stores goes through Cache Storage (offlineTiles.ts).
 */
const TILE_CACHE_SCHEME = 'trek-tile';

/**
 * Whether the app keeps the Mapbox map's resources itself, so a Mapbox map works
 * offline where it was viewed. On Android the app's WebView client takes those
 * requests as they are (tiles/TrekTileStore.kt), so only iOS rewrites URLs.
 */
export function tileCacheActive(): boolean {
  return isNativeApp() && hasNativeFeature('tileCache');
}

/** Whether a GL map keeps what it showed in the store (see glSchemes.ts for why not, for now). */
export function glTileStoreActive(): boolean {
  return GL_MAPS_THROUGH_APP_SCHEMES && tileSchemeActive();
}

/** Whether URLs go through the trek-tile:// scheme: the iOS store only. */
function tileSchemeActive(): boolean {
  return isNativeIos() && hasNativeFeature('tileCache');
}

/** https://host/path?query -> trek-tile://host/path?query. Anything else stays. */
export function toTileCacheUrl(url: string): string {
  return url.startsWith('https://') ? `${TILE_CACHE_SCHEME}://${url.slice('https://'.length)}` : url;
}

/** A raster tile template for Leaflet, through the store where the app has one. */
export function nativeRasterTemplate(template: string): string {
  return tileSchemeActive() ? toTileCacheUrl(template) : template;
}

const MAPBOX_HOST = /^https:\/\/(?:api\.mapbox\.com|[a-z0-9-]+\.tiles\.mapbox\.com)\//i;
/** What a map draws; telemetry and anything else keeps going straight out. */
const CACHED_RESOURCES = new Set([
  'Style',
  'Source',
  'Tile',
  'Glyphs',
  'SpriteImage',
  'SpriteJSON',
  'Image',
  'Iconset',
  'Model',
]);

/**
 * Mapbox GL's transformRequest for the iOS app: the map's own resources from
 * Mapbox's servers go through the store, events and sessions never do.
 */
export function mapboxTileCacheRequest(url: string, resourceType?: string): { url: string } {
  if (!glTileStoreActive() || !MAPBOX_HOST.test(url)) return { url };
  if (resourceType && !CACHED_RESOURCES.has(resourceType)) return { url };
  return { url: toTileCacheUrl(url) };
}
