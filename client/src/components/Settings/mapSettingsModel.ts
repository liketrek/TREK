import { AMAP_ROAD, AMAP_SATELLITE } from '../../constants/mapDefaults';
import type { Place } from '../../types';
import {
  MAPBOX_DEFAULT_STYLE,
  isOpenFreeMapStyle,
  normalizeStyleForProvider,
  type GlMapProvider,
} from '../Map/glProviders';

/**
 * The map settings both shells share: the tile presets, the provider and style rules,
 * and the preview place. The user's map settings and the admin's defaults for users
 * read the same presets, so the two can never offer a different list by accident.
 */

export interface MapPreset {
  name: string;
  url: string;
}

/**
 * The tile presets a user picks from in their own map settings, and the same list
 * an admin picks the default for every user from.
 */
export const MAP_PRESETS: MapPreset[] = [
  { name: 'OpenStreetMap', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' },
  { name: 'OpenStreetMap DE', url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png' },
  // The app default, and a vector style rather than a {z}/{x}/{y} template: no
  // key, no registration, no request limits.
  { name: 'OpenFreeMap Positron', url: 'https://tiles.openfreemap.org/styles/positron' },
  { name: 'OpenFreeMap Bright', url: 'https://tiles.openfreemap.org/styles/bright' },
  // CARTO watermarks keyless tiles since 26.08.2026 and issues keys by mail, so
  // these two need one; without it the map falls back to the default (#2054).
  { name: 'CartoDB Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
  { name: 'CartoDB Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
  { name: 'Stadia Smooth', url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png' },
  // Amap (高德). GCJ-02 tiles: the map switches to a shifted projection for
  // these so markers still land on the right street (see gcj02Crs.ts). The only
  // basemap here that is genuinely good inside mainland China.
  { name: '高德地图 (Amap)', url: AMAP_ROAD },
  { name: '高德卫星 (Amap Satellite)', url: AMAP_SATELLITE },
];

export type MapProvider = 'leaflet' | GlMapProvider;

export function normalizeProvider(value: unknown): MapProvider {
  return value === 'mapbox-gl' || value === 'maplibre-gl' ? value : 'leaflet';
}

export function styleForProvider(provider: MapProvider, style?: string | null): string {
  if (provider === 'leaflet') return style || MAPBOX_DEFAULT_STYLE;
  if (provider === 'mapbox-gl' && isOpenFreeMapStyle(style)) return MAPBOX_DEFAULT_STYLE;
  return normalizeStyleForProvider(provider, style);
}

// Each GL provider has its own style slot, so toggling providers never clobbers the
// other one's style. Leaflet/Mapbox use mapbox_style; MapLibre uses maplibre_style.
export function slotStyle(
  provider: MapProvider,
  s: { mapbox_style?: string; maplibre_style?: string }
): string | undefined {
  return provider === 'maplibre-gl' ? s.maplibre_style : s.mapbox_style;
}

/**
 * Somewhere recognisable for the style preview to render. A city shows off label density,
 * 3D buildings and satellite texture in a way open ocean cannot. It is not a user setting,
 * and no map opens here: each map frames itself on its own places.
 */
export const PREVIEW_CENTER: [number, number] = [48.8566, 2.3522];
export const PREVIEW_ZOOM = 16;

/** The one place the user's map preview shows. */
export function previewPlace(): Place {
  return {
    id: 1,
    trip_id: 1,
    name: 'Preview',
    description: '',
    lat: PREVIEW_CENTER[0],
    lng: PREVIEW_CENTER[1],
    address: '',
    category_id: 0,
    price: null,
    image_url: null,
    google_place_id: null,
    osm_id: null,
    route_geometry: null,
    place_time: null,
    end_time: null,
    created_at: String(new Date()),
  };
}
