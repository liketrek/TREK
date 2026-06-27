import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import maplibregl from 'maplibre-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useSettingsStore } from '../../store/settingsStore'
import { isStandardFamily, supportsCustom3d, wantsTerrain, addCustom3dBuildings, addTerrainAndSky } from '../Map/mapboxSetup'
import { MAPBOX_DEFAULT_STYLE, styleForActiveProvider, basemapLanguage, type GlMapProvider } from '../Map/glProviders'

export interface JourneyMapGLHandle {
  highlightMarker: (id: string | null) => void
  focusMarker: (id: string) => void
  invalidateSize: () => void
}

interface MapEntry {
  id: string
  lat: number
  lng: number
  title?: string | null
  location_name?: string | null
  mood?: string | null
  entry_date: string
  dayColor?: string
  dayLabel?: number
}

interface Props {
  checkins: unknown[]
  entries: MapEntry[]
  trail?: { lat: number; lng: number }[]
  height?: number
  dark?: boolean
  activeMarkerId?: string | null
  onMarkerClick?: (id: string, type?: string) => void
  fullScreen?: boolean
  paddingBottom?: number
  glProvider?: GlMapProvider
}

interface Item {
  id: string
  lat: number
  lng: number
  label: string
  locationName: string
  time: string
  dayColor: string
  dayLabel: number
}

const MARKER_W = 28
const MARKER_H = 36

function buildItems(entries: MapEntry[]): Item[] {
  const items: Item[] = []
  for (const e of entries) {
    if (e.lat && e.lng) {
      items.push({
        id: e.id,
        lat: e.lat,
        lng: e.lng,
        label: e.title || '',
        locationName: e.location_name || '',
        time: e.entry_date,
        dayColor: e.dayColor || '#52525B',
        dayLabel: e.dayLabel ?? 1,
      })
    }
  }
  items.sort((a, b) => a.time.localeCompare(b.time))
  return items
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatEntryDate(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00')
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(d)
  } catch {
    return iso
  }
}

// Inject the popup styles once per document. Two-line frosted-glass card in
// the Apple/Google Maps idiom — title on top, location / date subtly below.
function ensureJourneyPopupStyle() {
  if (document.getElementById('trek-journey-popup-style')) return
  const s = document.createElement('style')
  s.id = 'trek-journey-popup-style'
  s.textContent = `
    .mapboxgl-popup.trek-journey-popup,
    .maplibregl-popup.trek-journey-popup { pointer-events: none; animation: trek-journey-popup-in 180ms ease-out; }
    .mapboxgl-popup.trek-journey-popup .mapboxgl-popup-content,
    .maplibregl-popup.trek-journey-popup .maplibregl-popup-content {
      padding: 9px 14px 10px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border: 1px solid rgba(0, 0, 0, 0.06);
      box-shadow: 0 10px 32px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.06);
      font-family:var(--font-system);
      min-width: 160px;
      max-width: 280px;
    }
    .mapboxgl-popup.trek-journey-popup.trek-dark .mapboxgl-popup-content,
    .maplibregl-popup.trek-journey-popup.trek-dark .maplibregl-popup-content {
      background: rgba(24, 24, 27, 0.88);
      border-color: rgba(255, 255, 255, 0.08);
      color: #FAFAFA;
    }
    .mapboxgl-popup.trek-journey-popup .mapboxgl-popup-tip,
    .maplibregl-popup.trek-journey-popup .maplibregl-popup-tip {
      border-top-color: rgba(255, 255, 255, 0.94);
      border-bottom-color: rgba(255, 255, 255, 0.94);
    }
    .mapboxgl-popup.trek-journey-popup.trek-dark .mapboxgl-popup-tip,
    .maplibregl-popup.trek-journey-popup.trek-dark .maplibregl-popup-tip {
      border-top-color: rgba(24, 24, 27, 0.88);
      border-bottom-color: rgba(24, 24, 27, 0.88);
    }
    .mapboxgl-popup.trek-journey-popup .mapboxgl-popup-close-button,
    .maplibregl-popup.trek-journey-popup .maplibregl-popup-close-button { display: none; }
    .trek-journey-popup-title {
      font-size: 13.5px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #18181B;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .mapboxgl-popup.trek-journey-popup.trek-dark .trek-journey-popup-title,
    .maplibregl-popup.trek-journey-popup.trek-dark .trek-journey-popup-title { color: #FAFAFA; }
    .trek-journey-popup-sub {
      display: flex;
      align-items: baseline;
      gap: 7px;
      margin-top: 3px;
      font-size: 11.5px;
      color: #71717A;
      line-height: 1.35;
      white-space: nowrap;
    }
    .mapboxgl-popup.trek-journey-popup.trek-dark .trek-journey-popup-sub,
    .maplibregl-popup.trek-journey-popup.trek-dark .trek-journey-popup-sub { color: #A1A1AA; }
    .trek-journey-popup-place {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .trek-journey-popup-sep {
      flex: 0 0 auto;
      opacity: 0.55;
      font-weight: 500;
    }
    .trek-journey-popup-date { flex: 0 0 auto; }
    @keyframes trek-journey-popup-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `
  document.head.appendChild(s)
}

function markerHtml(dayColor: string, dayLabel: number, highlighted: boolean): HTMLDivElement {
  const fill = dayColor
  const textColor = '#fff'
  const stroke = highlighted ? '#fff' : 'rgba(255,255,255,0.5)'
  const shadow = highlighted
    ? 'drop-shadow(0 0 10px rgba(0,0,0,0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.4))'
    : 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))'
  const scale = highlighted ? 1.2 : 1
  const label = String(dayLabel)

  // Outer wrap holds the element mapbox positions via `transform: translate(...)`.
  // Anything animated (scale, filter) has to live on an inner child — otherwise
  // the CSS transition would catch the map's per-frame translate updates and
  // the marker smears all over the viewport while scrolling / flying.
  const wrap = document.createElement('div')
  wrap.style.cssText = `width:${MARKER_W}px;height:${MARKER_H}px;cursor:pointer;`
  const inner = document.createElement('div')
  inner.className = 'trek-journey-marker-inner'
  inner.style.cssText = `width:100%;height:100%;transform:scale(${scale});transform-origin:bottom center;transition:transform 0.2s ease;filter:${shadow};`
  inner.innerHTML = `<svg width="${MARKER_W}" height="${MARKER_H}" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 34C14 34 26 22.36 26 13C26 6.37 20.63 1 14 1C7.37 1 2 6.37 2 13C2 22.36 14 34 14 34Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    <circle cx="14" cy="13" r="8" fill="${fill}"/>
    <text x="14" y="13" text-anchor="middle" dominant-baseline="central" fill="${textColor}" font-family="'Poppins',system-ui,sans-serif" font-size="11" font-weight="700">${label}</text>
  </svg>`
  wrap.appendChild(inner)
  return wrap
}

const EMPTY_TRAIL: { lat: number; lng: number }[] = []

const JourneyMapGL = forwardRef<JourneyMapGLHandle, Props>(function JourneyMapGL(
  { entries, trail, height = 220, dark, activeMarkerId, onMarkerClick, fullScreen, paddingBottom, glProvider = 'mapbox-gl' },
  ref
) {
  const stableTrail = trail || EMPTY_TRAIL
  const rawMapboxStyle = useSettingsStore(s => s.settings.mapbox_style || MAPBOX_DEFAULT_STYLE)
  const rawMaplibreStyle = useSettingsStore(s => s.settings.maplibre_style || '')
  const mapboxToken = useSettingsStore(s => s.settings.mapbox_access_token || '')
  const mapbox3d = useSettingsStore(s => s.settings.mapbox_3d_enabled !== false)
  const mapboxQuality = useSettingsStore(s => s.settings.mapbox_quality_mode === true)
  const mapLang = useSettingsStore(s => s.settings.language)
  const isMapLibre = glProvider === 'maplibre-gl'
  const gl = (isMapLibre ? maplibregl : mapboxgl) as any
  const glStyle = styleForActiveProvider(glProvider, rawMapboxStyle, rawMaplibreStyle)
  const enableMapbox3d = !isMapLibre && mapbox3d
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map())
  const itemsRef = useRef<Item[]>([])
  const highlightedRef = useRef<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any | null>(null)
  const onMarkerClickRef = useRef(onMarkerClick)
  onMarkerClickRef.current = onMarkerClick
  const darkRef = useRef(dark)
  darkRef.current = dark

  const showPopup = useCallback((id: string) => {
    const item = itemsRef.current.find(i => i.id === id)
    if (!item || !mapRef.current) return
    ensureJourneyPopupStyle()
    // Primary line: user-given title. If none, fall back to the location
    // name so we always show *something* useful on the top line.
    const primaryRaw = item.label || item.locationName || 'Entry'
    const secondaryPlace = item.label ? item.locationName : ''
    const dateStr = formatEntryDate(item.time)
    const primary = escapeHtml(primaryRaw)
    const place = escapeHtml(secondaryPlace)
    const date = escapeHtml(dateStr)

    const subParts: string[] = []
    if (place) subParts.push(`<span class="trek-journey-popup-place">${place}</span>`)
    if (date) subParts.push(`<span class="trek-journey-popup-date">${date}</span>`)
    const subline = subParts.length === 2
      ? `${subParts[0]}<span class="trek-journey-popup-sep">\u00B7</span>${subParts[1]}`
      : subParts.join('')

    const html = `
      <div class="trek-journey-popup-title">${primary}</div>
      ${subline ? `<div class="trek-journey-popup-sub">${subline}</div>` : ''}
    `
    // Marker is bottom-anchored with a visible height of 36px (1.2× on
    // highlight ≈ 44px), so -46 keeps the popup just clear of the pin top.
    const offset: [number, number] = [0, -46]
    if (popupRef.current) {
      popupRef.current.setLngLat([item.lng, item.lat])
      popupRef.current.setHTML(html)
      popupRef.current.setOffset(offset)
      const el = popupRef.current.getElement()
      if (el) el.classList.toggle('trek-dark', !!darkRef.current)
    } else {
      popupRef.current = new gl.Popup({
        closeButton: false,
        closeOnClick: false,
        closeOnMove: false,
        anchor: 'bottom',
        offset,
        className: `trek-journey-popup${darkRef.current ? ' trek-dark' : ''}`,
        maxWidth: '280px',
      })
        .setLngLat([item.lng, item.lat])
        .setHTML(html)
        .addTo(mapRef.current)
    }
  }, [gl])

  const hidePopup = useCallback(() => {
    if (popupRef.current) {
      try { popupRef.current.remove() } catch { /* noop */ }
      popupRef.current = null
    }
  }, [])

  const setMarkerStyle = useCallback((id: string, highlighted: boolean) => {
    const item = itemsRef.current.find(i => i.id === id)
    const marker = markersRef.current.get(id)
    if (!item || !marker) return
    const el = marker.getElement()
    const currentInner = el.querySelector('.trek-journey-marker-inner') as HTMLDivElement | null
    if (!currentInner) return
    // Only swap the inner element's styles/HTML. Touching `el.style.cssText`
    // would wipe mapbox's positional transform and make the marker flicker.
    const next = markerHtml(item.dayColor, item.dayLabel, highlighted)
    const nextInner = next.querySelector('.trek-journey-marker-inner') as HTMLDivElement
    currentInner.style.cssText = nextInner.style.cssText
    currentInner.innerHTML = nextInner.innerHTML
    el.style.zIndex = highlighted ? '1000' : '0'
  }, [])

  const highlightMarker = useCallback((id: string | null) => {
    const prev = highlightedRef.current
    highlightedRef.current = id
    if (prev && prev !== id) setMarkerStyle(prev, false)
    if (id) {
      setMarkerStyle(id, true)
      showPopup(id)
    } else {
      hidePopup()
    }
  }, [setMarkerStyle, showPopup, hidePopup])

  const focusMarker = useCallback((id: string) => {
    highlightMarker(id)
    const marker = markersRef.current.get(id)
    if (!marker || !mapRef.current) return
    try {
      mapRef.current.flyTo({
        center: marker.getLngLat(),
        zoom: Math.max(mapRef.current.getZoom(), 14),
        pitch: enableMapbox3d ? 45 : 0,
        duration: 600,
      })
    } catch { /* map not yet ready */ }
  }, [highlightMarker, enableMapbox3d])

  const invalidateSize = useCallback(() => {
    try { mapRef.current?.resize() } catch { /* map not yet ready */ }
  }, [])

  useImperativeHandle(ref, () => ({ highlightMarker, focusMarker, invalidateSize }), [highlightMarker, focusMarker, invalidateSize])

  // Build map once per style/token change. Markers and layers are rebuilt
  // inside the same effect so they stay in sync with the active style.
  useEffect(() => {
    if (!containerRef.current || (!isMapLibre && !mapboxToken)) return
    if (!isMapLibre) mapboxgl.accessToken = mapboxToken

    const items = buildItems(entries)
    itemsRef.current = items

    const bounds = new gl.LngLatBounds()
    items.forEach(i => bounds.extend([i.lng, i.lat]))
    stableTrail.forEach(p => bounds.extend([p.lng, p.lat]))
    const hasPoints = items.length > 0 || stableTrail.length > 0

    const mapOptions: Record<string, unknown> = {
      container: containerRef.current,
      style: glStyle,
      center: hasPoints ? bounds.getCenter() : [0, 30],
      zoom: hasPoints ? 2 : 1,
      pitch: enableMapbox3d && fullScreen ? 45 : 0,
      attributionControl: true,
      antialias: mapboxQuality,
    }
    if (!isMapLibre) mapOptions.projection = mapboxQuality ? 'globe' : 'mercator'

    const map = new gl.Map(mapOptions as any)
    mapRef.current = map

    map.on('load', () => {
      if (enableMapbox3d) {
        if (!isStandardFamily(glStyle) && wantsTerrain(glStyle)) addTerrainAndSky(map)
        if (supportsCustom3d(glStyle)) addCustom3dBuildings(map, !!darkRef.current)
      }
      // Flatten Mapbox Standard's built-in DEM so HTML markers (at Z=0)
      // stay pinned to their coordinates at every zoom and pitch.
      if (glStyle === MAPBOX_DEFAULT_STYLE) {
        try { map.setTerrain(null) } catch { /* noop */ }
      }
      // Pin the basemap label language to the UI language so labels don't fall back to the
      // browser/OS locale and stack multiple scripts per place (#1299).
      if (!isMapLibre && isStandardFamily(glStyle)) {
        try { map.setConfigProperty('basemap', 'language', basemapLanguage(mapLang)) } catch { /* style/SDK may not support it */ }
      }

      // route trail — dashed line connecting entries in time order
      if (items.length > 1) {
        const coords = items.map(i => [i.lng, i.lat])
        if (map.getSource('journey-route')) (map.getSource('journey-route') as mapboxgl.GeoJSONSource).setData({
          type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } as GeoJSON.LineString,
        })
        else {
          map.addSource('journey-route', {
            type: 'geojson',
            data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } as GeoJSON.LineString },
          })
          map.addLayer({
            id: 'journey-route-line',
            type: 'line',
            source: 'journey-route',
            paint: {
              'line-color': darkRef.current ? '#71717A' : '#A1A1AA',
              'line-width': 1.5,
              'line-opacity': 0.5,
              'line-dasharray': [2, 3],
            },
            layout: { 'line-cap': 'round', 'line-join': 'round' },
          })
        }
      }

      // markers
      items.forEach((item) => {
        const el = markerHtml(item.dayColor, item.dayLabel, false)
        const marker = new gl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([item.lng, item.lat])
          .addTo(map)
        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          onMarkerClickRef.current?.(item.id)
        })
        markersRef.current.set(item.id, marker)
      })

      // fit bounds to all points
      if (hasPoints) {
        const pb = paddingBottom || 50
        try {
          map.fitBounds(bounds, {
            padding: { top: 50, bottom: pb, left: 50, right: 50 },
            maxZoom: 16,
            pitch: enableMapbox3d && fullScreen ? 45 : 0,
            duration: 0,
          })
        } catch { /* empty bounds */ }
      }
    })

    return () => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current.clear()
      if (popupRef.current) {
        try { popupRef.current.remove() } catch { /* noop */ }
        popupRef.current = null
      }
      highlightedRef.current = null
      try { map.remove() } catch { /* noop */ }
      mapRef.current = null
    }
  }, [entries, stableTrail, glProvider, glStyle, mapboxToken, enableMapbox3d, mapboxQuality, fullScreen, paddingBottom])

  // external activeMarkerId → highlight + flyTo
  useEffect(() => {
    if (!activeMarkerId || !mapRef.current) return
    const t = setTimeout(() => {
      highlightMarker(activeMarkerId)
      const marker = markersRef.current.get(activeMarkerId)
      if (!marker || !mapRef.current) return
      try {
        mapRef.current.flyTo({
          center: marker.getLngLat(),
          zoom: Math.max(mapRef.current.getZoom(), 12),
          pitch: enableMapbox3d && fullScreen ? 45 : 0,
          duration: 500,
        })
      } catch { /* map not ready */ }
    }, 50)
    return () => clearTimeout(t)
  }, [activeMarkerId, highlightMarker, enableMapbox3d, fullScreen])

  if (!isMapLibre && !mapboxToken) {
    return (
      <div
        style={{ position: 'relative', height: height === 9999 ? '100%' : height, width: '100%', borderRadius: 'inherit', overflow: 'hidden' }}
        className="flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-center px-6"
      >
        <div className="text-sm text-zinc-500">
          No Mapbox access token configured.<br />
          <span className="text-xs">Settings → Map → Mapbox GL</span>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: height === 9999 ? '100%' : height, width: '100%', borderRadius: 'inherit', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
})

export default JourneyMapGL
