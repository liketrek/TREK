/**
 * Whether the GL maps (the Leaflet map's vector basemap and Mapbox GL) read
 * their style and tiles through the app's own URL schemes, trek-offline:// and
 * trek-tile://, for the offline copy.
 *
 * Off: on iPadOS 26 both drew nothing in the app (the vector basemap white,
 * Mapbox black) while the 3D map, the Mapbox preview in the settings and the
 * raster maps, which do not go through those schemes for a GL map, drew
 * normally. The same maps draw normally in a browser. Until that is traced on a
 * device, the GL maps load straight from their servers in the app, as they do
 * in a browser, and keep no offline copy; the raster maps (Topo, satellite, a
 * raster template of the user's) keep going through the tile store.
 */
export const GL_MAPS_THROUGH_APP_SCHEMES = false;
