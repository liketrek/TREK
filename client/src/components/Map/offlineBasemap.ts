import { OFM_DARK, OFM_POSITRON } from '../../constants/mapDefaults';
import { isNativeIos } from '../../native/platform';
import { isVectorStyle } from '../../utils/tileUrl';
import { normalizeStyleForProvider, type GlMapProvider } from './glProviders';

/**
 * The basemap a map falls back to offline, so that whatever the user picked
 * online (Mapbox, a raster template, another OpenFreeMap style) they never
 * face a grey map once the connection goes.
 *
 * The two OpenFreeMap styles below are the ones "prepare for offline" stores
 * for every trip, whatever the configured provider (sync/tilePrefetcher.ts):
 * both share one planet tile set, so the dark one only adds its style, sprite
 * and glyphs. A fallback has to be exactly a style that was stored, or its
 * sprite and labels are missing offline.
 */
export const OFFLINE_STYLES: readonly string[] = [OFM_POSITRON, OFM_DARK];

/** The stored style that matches the colour scheme. */
export function offlineStyleFor(dark: boolean): string {
  return dark ? OFM_DARK : OFM_POSITRON;
}

/** Hosts whose tiles may not be stored for offline use at all (OSM tile usage policy). */
const NO_OFFLINE_HOSTS = ['tile.openstreetmap.org'];

export function isOfflineForbiddenTemplate(template: string): boolean {
  try {
    const host = new URL(template.replace(/\{s\}/g, 'a')).hostname;
    return NO_OFFLINE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

/**
 * Whether a GL map can be drawn offline as configured. Only MapLibre on one of
 * the stored styles can: Mapbox has nothing stored to draw from, and another
 * OpenFreeMap style lacks its sprite and glyphs offline.
 */
export function glWorksOffline(provider: GlMapProvider, maplibreStyle: string | null | undefined): boolean {
  return provider === 'maplibre-gl' && OFFLINE_STYLES.includes(normalizeStyleForProvider('maplibre-gl', maplibreStyle));
}

/**
 * Whether the Leaflet map's basemap can be drawn offline as configured. A
 * stored vector style can. A raster template can where the service worker
 * serves the prefetched tiles, which the iOS app's WebView does not run for a
 * self-hosted server, and never for a host whose tiles may not be stored.
 */
export function leafletWorksOffline(tileUrl: string, nativeIos: boolean = isNativeIos()): boolean {
  if (isVectorStyle(tileUrl)) return OFFLINE_STYLES.includes(tileUrl);
  return !nativeIos && !isOfflineForbiddenTemplate(tileUrl);
}
