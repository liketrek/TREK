import { isEffectivelyOffline } from '../sync/networkMode';

/**
 * Whether the GL maps (the Leaflet map's vector basemap and Mapbox GL) read
 * their style and tiles through the app's own URL schemes, trek-offline:// and
 * trek-tile://, for the offline copy.
 *
 * Off: on iPadOS 26 both drew nothing in the app (the vector basemap white,
 * Mapbox black) while the 3D map, the Mapbox preview in the settings and the
 * raster maps, which do not go through those schemes for a GL map, drew
 * normally. The same maps draw normally in a browser. Until that is traced on a
 * device, the GL maps load straight from their servers in the app while it is
 * online, as they do in a browser; offline they read the stored copy as before
 * (glMapsThroughAppSchemes). The raster maps (Topo, satellite, a raster
 * template of the user's) keep going through the tile store throughout.
 */
export const GL_MAPS_THROUGH_APP_SCHEMES = false;

/**
 * Whether a MapLibre basemap goes through trek-offline:// right now: always
 * while the switch above is on, and otherwise while the app is offline (or set
 * to be). Offline the stored copy is all there is to draw, so nothing is lost
 * by trying it; online the map loads straight from its server. Mapbox does not
 * follow: offline it gives way to the stored MapLibre basemap anyway.
 */
export function glMapsThroughAppSchemes(): boolean {
  return GL_MAPS_THROUGH_APP_SCHEMES || isEffectivelyOffline();
}
