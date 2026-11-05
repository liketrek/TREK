import type mapboxgl from 'mapbox-gl'
import type { GeoPosition } from '../../hooks/useGeolocation'

type MarkerConstructor = new (options?: { element?: HTMLElement; anchor?: string }) => {
  setLngLat: (lngLat: mapboxgl.LngLatLike) => { addTo: (map: mapboxgl.Map) => unknown }
  addTo: (map: mapboxgl.Map) => unknown
  remove: () => void
  getElement: () => HTMLElement
}

// Build the DOM element that backs the mapbox Marker. We animate the
// heading cone via a CSS rotation so the DOM stays stable across updates
// and mapbox doesn't get confused about which element to position.
function buildLocationEl(): { root: HTMLDivElement; cone: HTMLDivElement } {
  const root = document.createElement('div')
  // No inline `position`: the GL marker class keeps the root absolute, which the
  // children's insets resolve against (see the note on markers in MapViewGL).
  root.style.cssText = 'width:28px;height:28px;pointer-events:none;'
  // Accuracy pulse behind the dot
  const pulse = document.createElement('div')
  pulse.style.cssText = `
    position:absolute;inset:-14px;border-radius:50%;
    background:#3b82f6;opacity:0.25;
    animation:trek-location-pulse 2s ease-out infinite;
  `
  // Heading cone (conic gradient fan)
  const cone = document.createElement('div')
  cone.style.cssText = `
    position:absolute;left:50%;top:50%;width:60px;height:60px;
    transform:translate(-50%,-50%) rotate(0deg);
    background:conic-gradient(from -30deg, rgba(59,130,246,0) 0deg, rgba(59,130,246,0.35) 15deg, rgba(59,130,246,0) 60deg, rgba(59,130,246,0) 360deg);
    border-radius:50%;
    mask:radial-gradient(circle, transparent 12px, black 13px);
    -webkit-mask:radial-gradient(circle, transparent 12px, black 13px);
    transition:transform 0.12s ease-out;
    display:none;
  `
  // Blue dot
  const dot = document.createElement('div')
  dot.style.cssText = `
    position:absolute;left:50%;top:50%;
    transform:translate(-50%,-50%);
    width:18px;height:18px;border-radius:50%;
    background:#3b82f6;border:3px solid white;
    box-shadow:0 0 0 1px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.3);
  `
  root.appendChild(pulse)
  root.appendChild(cone)
  root.appendChild(dot)
  return { root, cone }
}

// Inject the pulse keyframes once per document so the animation is
// available for every map instance.
function ensurePulseStyle() {
  if (document.getElementById('trek-location-style')) return
  const s = document.createElement('style')
  s.id = 'trek-location-style'
  s.textContent = `
    @keyframes trek-location-pulse {
      0%   { transform: scale(0.6); opacity: 0.35; }
      70%  { transform: scale(1.6); opacity: 0; }
      100% { transform: scale(1.6); opacity: 0; }
    }
  `
  document.head.appendChild(s)
}

export interface LocationMarkerHandle {
  update: (p: GeoPosition | null) => void
  destroy: () => void
}

// Creates (or reuses) a location marker + accuracy circle on the given
// mapbox map. Returns a handle the caller uses to push position updates
// and clean up. Keeps its own DOM element and GeoJSON source so it can
// coexist with the regular trip markers.
export function attachLocationMarker(map: mapboxgl.Map, MarkerCtor: MarkerConstructor): LocationMarkerHandle {
  ensurePulseStyle()
  const { root, cone } = buildLocationEl()
  const marker = new MarkerCtor({ element: root, anchor: 'center' })

  const ensureAccuracyLayer = () => {
    if (map.getSource('trek-location-accuracy')) return
    try {
      map.addSource('trek-location-accuracy', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      })
      // Draw the accuracy ring as a geographic polygon: it's a real geodesic
      // circle defined in meters, so mapbox automatically scales it with
      // zoom the way Apple/Google Maps does — always the same real-world
      // size regardless of viewport.
      map.addLayer({
        id: 'trek-location-accuracy',
        type: 'fill',
        source: 'trek-location-accuracy',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.14,
          'fill-outline-color': '#3b82f6',
        },
      })
    } catch { /* noop */ }
  }

  // Build a polygon approximating a geodesic circle around (lng, lat)
  // with the given radius in meters. 48 segments is plenty for a smooth
  // edge without paying much CPU per fix.
  const geodesicCircle = (lng: number, lat: number, radiusMeters: number): number[][] => {
    const earth = 6378137
    const d = radiusMeters / earth
    const lat1 = lat * Math.PI / 180
    const lng1 = lng * Math.PI / 180
    const coords: number[][] = []
    const segments = 48
    for (let i = 0; i <= segments; i++) {
      const bearing = (i / segments) * 2 * Math.PI
      const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearing))
      const lng2 = lng1 + Math.atan2(
        Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
        Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
      )
      coords.push([lng2 * 180 / Math.PI, lat2 * 180 / Math.PI])
    }
    return coords
  }

  const setAccuracy = (p: GeoPosition) => {
    const src = map.getSource('trek-location-accuracy') as mapboxgl.GeoJSONSource | undefined
    if (!src) return
    if (!p.accuracy || p.accuracy < 1) {
      src.setData({ type: 'FeatureCollection', features: [] })
      return
    }
    const ring = geodesicCircle(p.lng, p.lat, p.accuracy)
    src.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates: [ring] },
      }],
    })
  }

  let lastPosRef: GeoPosition | null = null

  if (map.loaded()) ensureAccuracyLayer()
  else map.once('load', ensureAccuracyLayer)

  const handle: LocationMarkerHandle = {
    update: (p) => {
      lastPosRef = p
      if (!p) {
        marker.remove()
        const src = map.getSource('trek-location-accuracy') as mapboxgl.GeoJSONSource | undefined
        src?.setData({ type: 'FeatureCollection', features: [] })
        return
      }
      marker.setLngLat([p.lng, p.lat])
      if (!marker.getElement().parentElement) marker.addTo(map)
      if (p.heading !== null && !Number.isNaN(p.heading)) {
        cone.style.display = 'block'
        cone.style.transform = `translate(-50%,-50%) rotate(${p.heading}deg)`
      } else {
        cone.style.display = 'none'
      }
      setAccuracy(p)
    },
    destroy: () => {
      try { marker.remove() } catch { /* noop */ }
      try {
        if (map.getLayer('trek-location-accuracy')) map.removeLayer('trek-location-accuracy')
        if (map.getSource('trek-location-accuracy')) map.removeSource('trek-location-accuracy')
      } catch { /* noop */ }
    },
  }

  return handle
}
