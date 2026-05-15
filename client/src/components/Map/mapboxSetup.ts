import type mapboxgl from 'mapbox-gl'

// "mapbox/standard" and "mapbox/standard-satellite" ship their own 3D
// buildings and terrain. For every other style we inject a fill-extrusion
// layer against the classic `composite` vector source so the user still
// gets real 3D buildings (not just a tilted 2D view) when they toggle 3D.
export function isStandardFamily(style: string): boolean {
  return style === 'mapbox://styles/mapbox/standard' || style === 'mapbox://styles/mapbox/standard-satellite'
}

// Terrain is only genuinely useful for styles that benefit from elevation
// data. On flat vector styles (streets/light/dark) it nudges route lines
// onto the DEM while HTML markers stay at Z=0, causing a visible drift
// when the map is pitched. Satellite and Outdoors are the intended styles
// for terrain; markers are re-pinned by syncMarkerAltitudes().
export function wantsTerrain(style: string): boolean {
  return style === 'mapbox://styles/mapbox/satellite-v9'
      || style === 'mapbox://styles/mapbox/satellite-streets-v12'
      || style === 'mapbox://styles/mapbox/outdoors-v12'
}

// 3D can be added to every style now — the standard family has it built-in
// and for everything else we either reuse the style's own `composite`
// building layer or attach the public `mapbox-streets-v8` tileset as an
// extra source (needed for pure satellite, which has no vector data).
export function supportsCustom3d(style: string): boolean {
  return !isStandardFamily(style)
}

// Add a 3D buildings extrusion layer to a non-Standard Mapbox style. For
// the pure satellite style we lazily attach `mapbox-streets-v8` as a
// fallback source so real building volumes sit on top of the imagery —
// the Apple Maps-style "3D satellite" look the user asked for.
export function addCustom3dBuildings(map: mapboxgl.Map, dark: boolean) {
  if (map.getLayer('trek-3d-buildings')) return
  const baseColor = dark ? '#3b3b3f' : '#cfd2d6'

  // Styles without a `composite` source (pure satellite) need a fallback
  // vector tileset for building geometry.
  let sourceId = 'composite'
  if (!map.getSource('composite')) {
    sourceId = 'mapbox-streets-v8'
    if (!map.getSource(sourceId)) {
      try {
        map.addSource(sourceId, { type: 'vector', url: 'mapbox://mapbox.mapbox-streets-v8' })
      } catch { return }
    }
  }

  try {
    // Place extrusions below the first label layer so text stays readable.
    const layers = map.getStyle()?.layers || []
    const firstSymbolId = layers.find(l => l.type === 'symbol')?.id
    map.addLayer({
      id: 'trek-3d-buildings',
      source: sourceId,
      'source-layer': 'building',
      filter: ['==', 'extrude', 'true'],
      type: 'fill-extrusion',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': baseColor,
        'fill-extrusion-height': [
          'interpolate', ['linear'], ['zoom'],
          14, 0,
          15.5, ['coalesce', ['get', 'height'], 0],
        ],
        'fill-extrusion-base': [
          'interpolate', ['linear'], ['zoom'],
          14, 0,
          15.5, ['coalesce', ['get', 'min_height'], 0],
        ],
        'fill-extrusion-opacity': 0.85,
      },
    }, firstSymbolId)
  } catch { /* building source-layer unavailable */ }
}

// Terrain + sky that works against any style that has the DEM source.
// The Standard family already handles terrain internally, skip there.
export function addTerrainAndSky(map: mapboxgl.Map) {
  try {
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      })
    }
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.2 })
    if (!map.getLayer('sky')) {
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun-intensity': 15,
        } as unknown as mapboxgl.SkyLayerSpecification['paint'],
      })
    }
  } catch { /* style doesn't support terrain */ }
}
