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

// CARTO basemaps. Keyless tiles carry an "API KEY REQUIRED" watermark since
// 26.08.2026, so these are always passed through withTileApiKey() (#2054).
export const CARTO_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
export const CARTO_DARK = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
export const CARTO_LIGHT_NOLABELS = 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png'
export const CARTO_DARK_NOLABELS = 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
export const CARTO_VOYAGER = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
