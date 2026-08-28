export const DEFAULT_MAP_LAT = 0
export const DEFAULT_MAP_LNG = 0
export const DEFAULT_MAP_ZOOM = 2
export const DEFAULT_MAP_CENTER: [number, number] = [DEFAULT_MAP_LAT, DEFAULT_MAP_LNG]

// Tokenless satellite base layer (ESRI World Imagery) — works without an API key.
export const SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
export const SATELLITE_TILE_ATTRIBUTION =
  'Imagery &copy; <a href="https://www.esri.com">Esri</a>, Maxar, Earthstar Geographics'
export const SATELLITE_TILE_MAXZOOM = 19

// OpenFreeMap, the default basemap since CARTO began watermarking keyless tiles
// on 26.08.2026 and moved its key behind a request by mail. No key, no
// registration, no request limits, commercial use allowed, attribution required.
//
// These are MapLibre STYLE documents, not {z}/{x}/{y} templates: OpenFreeMap
// serves vector tiles only. Leaflet draws them through VectorBasemap. Positron
// is the same design CARTO's light basemap was, so the maps look like they did.
export const OFM_POSITRON = 'https://tiles.openfreemap.org/styles/positron'
export const OFM_DARK = 'https://tiles.openfreemap.org/styles/dark'
export const OFM_ATTRIBUTION =
  '<a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'

/**
 * Attribution for whatever basemap a map ended up with. OpenFreeMap asks for a
 * credit of its own, and printing OpenStreetMap alone under its tiles is both
 * wrong and a licence problem, so the URL decides rather than a flag at the
 * call site.
 */
export function attributionForTile(url: string | null | undefined): string {
  if (!url) return OSM_ATTRIBUTION
  if (url.includes('openfreemap.org')) return OFM_ATTRIBUTION
  if (url.includes('arcgisonline.com')) return SATELLITE_TILE_ATTRIBUTION
  return OSM_ATTRIBUTION
}

// CARTO basemaps. Keyless tiles carry an "API KEY REQUIRED" watermark since
// 26.08.2026, so these are always passed through withTileApiKey() (#2054).
// Kept as an opt-in for operators who hold a key; nothing defaults to them.
export const CARTO_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
export const CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
export const CARTO_LIGHT_NOLABELS = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
export const CARTO_DARK_NOLABELS = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
export const CARTO_VOYAGER = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
