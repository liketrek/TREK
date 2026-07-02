import { useEffect, useRef, useMemo, useState, createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import mapboxgl from 'mapbox-gl'
import maplibregl from 'maplibre-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useSettingsStore } from '../../store/settingsStore'
import { useAuthStore } from '../../store/authStore'
import { getCached, isLoading, fetchPhoto, onThumbReady, getAllThumbs } from '../../services/photoService'
import { CATEGORY_ICON_MAP } from '../shared/categoryIcons'
import { isStandardFamily, supportsCustom3d, wantsTerrain, addCustom3dBuildings, addTerrainAndSky } from './mapboxSetup'
import { attachLocationMarker, type LocationMarkerHandle } from './locationMarkerMapbox'
import { ReservationMapboxOverlay } from './reservationsMapbox'
import { MAPBOX_DEFAULT_STYLE, styleForActiveProvider, basemapLanguage, type GlMapProvider } from './glProviders'
import LocationButton from './LocationButton'
import { useGeolocation } from '../../hooks/useGeolocation'
import type { Place, Reservation } from '../../types'
import { POI_CATEGORY_BY_KEY, type Poi } from './poiCategories'
import { buildPoiPopupHtml } from './placePopup'

function categoryIconSvg(iconName: string | null | undefined, size: number): string {
  const IconComponent = (iconName && CATEGORY_ICON_MAP[iconName]) || CATEGORY_ICON_MAP['MapPin']
  try {
    return renderToStaticMarkup(createElement(IconComponent, { size, color: 'white', strokeWidth: 2.5 }))
  } catch { return '' }
}

// Marker grouping for the GL map (#1385): MapLibre/Mapbox can't show the rich
// HTML photo markers *and* cluster them natively, so we feed the place points
// into a clustered GeoJSON source. The cluster bubbles render as GL circles +
// a count label; the individual rich HTML markers are then only drawn for the
// points the source reports as currently unclustered. Grouping is always on,
// matching the Leaflet map's MarkerClusterGroup.
const PLACE_CLUSTER_SOURCE_ID = 'trip-place-clusters'
const PLACE_CLUSTER_CIRCLE_LAYER_ID = 'trip-place-clusters-circle'
const PLACE_CLUSTER_COUNT_LAYER_ID = 'trip-place-clusters-count'
const PLACE_UNCLUSTERED_LAYER_ID = 'trip-place-unclustered-hit'

type PlaceWithCoords = Place & { lat: number; lng: number }

function hasValidCoords(place: Place): place is PlaceWithCoords {
  return place.lat != null && place.lng != null && Number.isFinite(place.lat) && Number.isFinite(place.lng)
}

function buildPlaceClusterData(places: Place[]) {
  return {
    type: 'FeatureCollection' as const,
    features: places.filter(hasValidCoords).map(place => ({
      type: 'Feature' as const,
      properties: { placeId: place.id },
      geometry: { type: 'Point' as const, coordinates: [place.lng, place.lat] },
    })),
  }
}

interface RouteSegment {
  mid: [number, number]
  from: [number, number]
  to: [number, number]
  walkingText?: string
  drivingText?: string
}

interface Props {
  places: Place[]
  dayPlaces?: Place[]
  route?: [number, number][][] | null
  routeSegments?: RouteSegment[]
  selectedPlaceId?: number | null
  onMarkerClick?: (id: number) => void
  hoverDisabled?: boolean
  onMapClick?: (info: { latlng: { lat: number; lng: number } }) => void
  onMapContextMenu?: ((e: { latlng: { lat: number; lng: number }; originalEvent: MouseEvent }) => void) | null
  center?: [number, number]
  zoom?: number
  fitKey?: number | null
  dayOrderMap?: Record<number, number[] | null>
  leftWidth?: number
  rightWidth?: number
  hasInspector?: boolean
  hasDayDetail?: boolean
  reservations?: Reservation[]
  visibleConnectionIds?: number[]
  showReservationStats?: boolean
  onReservationClick?: (reservationId: number) => void
  pois?: Poi[]
  onPoiClick?: (poi: Poi) => void
  onViewportChange?: (bbox: { south: number; west: number; north: number; east: number }) => void
  glProvider?: GlMapProvider
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMapReady?: (map: any | null) => void
}

function createMarkerElement(place: Place & { category_color?: string; category_icon?: string }, photoUrl: string | null, orderNumbers: number[] | null, selected: boolean): HTMLDivElement {
  const size = selected ? 44 : 36
  const borderColor = selected ? '#111827' : (place.category_color || 'white')
  const borderWidth = selected ? 3 : 2.5
  const shadow = selected
    ? '0 0 0 3px rgba(17,24,39,0.25), 0 4px 14px rgba(0,0,0,0.3)'
    : '0 2px 8px rgba(0,0,0,0.22)'
  const bgColor = place.category_color || '#6b7280'

  // The visual circle is `size` + 2*border on each side. To make the
  // mapbox `anchor: 'center'` land on the real visual middle of the marker
  // (rather than just the inner content box), the wrapper has to be the
  // full outer size. If we gave the wrapper only `size`, the border would
  // bleed outside it and the route lines would appear slightly off.
  const outer = size + borderWidth * 2

  let badgeHtml = ''
  if (orderNumbers && orderNumbers.length > 0) {
    const label = orderNumbers.join(' · ')
    badgeHtml = `<span style="
      position:absolute;bottom:-2px;right:-2px;
      min-width:18px;height:${orderNumbers.length > 1 ? 16 : 18}px;border-radius:${orderNumbers.length > 1 ? 8 : 9}px;
      padding:0 ${orderNumbers.length > 1 ? 4 : 3}px;
      background:rgba(255,255,255,0.94);
      border:1.5px solid rgba(0,0,0,0.15);
      box-shadow:0 1px 4px rgba(0,0,0,0.18);
      display:flex;align-items:center;justify-content:center;
      font-size:${orderNumbers.length > 1 ? 7.5 : 9}px;font-weight:800;color:#111827;
      font-family:var(--font-system);line-height:1;
      box-sizing:border-box;white-space:nowrap;
    ">${label}</span>`
  }

  const wrap = document.createElement('div')
  // Do NOT set `position: relative` here — GL map libraries ship
  // marker classes with `position: absolute` and rely on it. An inline
  // `position: relative` here overrides the class, turns every marker into
  // a static block element, and stacks them in document order inside the
  // canvas container. The result looks exactly like "markers drift as the
  // map zooms" because each marker's transform is then applied relative
  // to its stacked slot, not to the map viewport.
  wrap.style.cssText = `width:${outer}px;height:${outer}px;cursor:pointer;`

  const hasPhoto = photoUrl && (photoUrl.startsWith('data:') || photoUrl.startsWith('/api/maps/place-photo/'))
  if (hasPhoto) {
    wrap.innerHTML = `
      <div style="
        position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
        width:${size}px;height:${size}px;border-radius:50%;
        border:${borderWidth}px solid ${borderColor};
        box-shadow:${shadow};
        overflow:hidden;background:${bgColor};
        box-sizing:content-box;
      ">
        <img src="${photoUrl}" width="${size}" height="${size}" style="display:block;border-radius:50%;object-fit:cover;" />
      </div>
      ${badgeHtml}
    `
  } else {
    wrap.innerHTML = `
      <div style="
        position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
        width:${size}px;height:${size}px;border-radius:50%;
        border:${borderWidth}px solid ${borderColor};
        box-shadow:${shadow};
        background:${bgColor};
        display:flex;align-items:center;justify-content:center;
        box-sizing:content-box;
      ">
        ${categoryIconSvg(place.category_icon, selected ? 18 : 15)}
      </div>
      ${badgeHtml}
    `
  }
  return wrap
}

// Small coloured pin for an OSM "explore" POI (matches the pill category colour).
function createPoiMarkerElement(category: string): HTMLDivElement {
  const cat = POI_CATEGORY_BY_KEY[category]
  const color = cat?.color || '#6b7280'
  const svg = cat ? renderToStaticMarkup(createElement(cat.Icon, { size: 13, color: 'white', strokeWidth: 2.5 })) : ''
  const el = document.createElement('div')
  el.style.cssText = 'width:26px;height:26px;cursor:pointer;'
  el.innerHTML = `<div style="width:26px;height:26px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;box-sizing:border-box;">${svg}</div>`
  return el
}

export function MapViewGL({
  places = [],
  dayPlaces = [],
  route = null,
  routeSegments = [],
  selectedPlaceId = null,
  hoverDisabled = false,
  onMarkerClick,
  onMapClick,
  onMapContextMenu = null,
  center = [48.8566, 2.3522],
  zoom = 10,
  fitKey = 0,
  dayOrderMap = {},
  leftWidth = 0,
  rightWidth = 0,
  hasInspector = false,
  hasDayDetail = false,
  reservations = [],
  visibleConnectionIds = [],
  showReservationStats = false,
  onReservationClick,
  pois = [],
  onPoiClick,
  onViewportChange,
  glProvider = 'mapbox-gl',
  onMapReady,
}: Props) {
  const rawMapboxStyle = useSettingsStore(s => s.settings.mapbox_style || MAPBOX_DEFAULT_STYLE)
  const rawMaplibreStyle = useSettingsStore(s => s.settings.maplibre_style || '')
  const mapboxToken = useSettingsStore(s => s.settings.mapbox_access_token || '')
  const mapbox3d = useSettingsStore(s => s.settings.mapbox_3d_enabled !== false)
  const mapboxQuality = useSettingsStore(s => s.settings.mapbox_quality_mode === true)
  const showEndpointLabels = useSettingsStore(s => s.settings.map_booking_labels) !== false
  const mapLang = useSettingsStore(s => s.settings.language)
  const isMapLibre = glProvider === 'maplibre-gl'
  const gl = (isMapLibre ? maplibregl : mapboxgl) as any
  const glStyle = styleForActiveProvider(glProvider, rawMapboxStyle, rawMaplibreStyle)
  const enableMapbox3d = !isMapLibre && mapbox3d
  const placesPhotosEnabled = useAuthStore(s => s.placesPhotosEnabled)
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>(getAllThumbs)
  const [mapReady, setMapReady] = useState(false)
  // Hover tooltip — a cursor-following name/category/address card, matching the
  // Leaflet map's overlay exactly (no anchored popup, no photo thumbnail).
  const [hoverPlace, setHoverPlace] = useState<(Place & { category_color?: string | null; category_icon?: string | null; category_name?: string | null }) | null>(null)
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const hoverIdRef = useRef<number | null>(null)

  // Selecting a place rebuilds its marker element, so the browser never fires
  // mouseleave on the removed node and the fixed-position hover card gets
  // orphaned (it stays put and drifts with page scroll). Clear it on selection
  // change and on any scroll so it can't get stuck.
  useEffect(() => { hoverIdRef.current = null; setHoverPlace(null); setHoverPos(null) }, [selectedPlaceId])
  useEffect(() => {
    if (!hoverPlace) return
    const clear = () => { hoverIdRef.current = null; setHoverPlace(null); setHoverPos(null) }
    window.addEventListener('scroll', clear, true)
    return () => window.removeEventListener('scroll', clear, true)
  }, [hoverPlace])
  const containerRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<number, any>>(new Map())
  const locationMarkerRef = useRef<LocationMarkerHandle | null>(null)
  const reservationOverlayRef = useRef<ReservationMapboxOverlay | null>(null)
  // Refs so the reservation overlay always sees the latest callback /
  // options without forcing a full overlay rebuild on every prop change.
  const onReservationClickRef = useRef(onReservationClick)
  onReservationClickRef.current = onReservationClick
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poiMarkersRef = useRef<any[]>([])
  // Single reusable hover popup (name/category/address card) shared by planned
  // places and POI markers — mirrors the Leaflet map's hover tooltip.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any | null>(null)
  const onPoiClickRef = useRef(onPoiClick)
  onPoiClickRef.current = onPoiClick
  const onViewportChangeRef = useRef(onViewportChange)
  onViewportChangeRef.current = onViewportChange
  const onMapReadyRef = useRef(onMapReady)
  onMapReadyRef.current = onMapReady
  const { position: userPosition, mode: trackingMode, error: trackingError, cycleMode: cycleTrackingMode, setMode: setTrackingMode } = useGeolocation()
  const onClickRefs = useRef({ marker: onMarkerClick, map: onMapClick, context: onMapContextMenu })
  onClickRefs.current.marker = onMarkerClick
  onClickRefs.current.map = onMapClick
  onClickRefs.current.context = onMapContextMenu
  const hoverDisabledRef = useRef(hoverDisabled)
  hoverDisabledRef.current = hoverDisabled

  // Build/rebuild the map on provider/style/token/3d change
  useEffect(() => {
    if (!containerRef.current || (!isMapLibre && !mapboxToken)) return
    if (!isMapLibre) mapboxgl.accessToken = mapboxToken

    const mapOptions: Record<string, unknown> = {
      container: containerRef.current,
      style: glStyle,
      center: [center[1], center[0]],
      zoom,
      pitch: enableMapbox3d ? 45 : 0,
      attributionControl: true,
      antialias: mapboxQuality,
    }
    if (!isMapLibre) mapOptions.projection = mapboxQuality ? 'globe' : 'mercator'

    const map = new gl.Map(mapOptions as any)
    mapRef.current = map
    popupRef.current = new gl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 18,
      maxWidth: '240px',
      className: 'trek-map-popup',
    })
    // Hand the map out so the trip planner can render its own compass pill next to
    // the POI pill (a custom round control instead of Mapbox's default top-right one).
    onMapReadyRef.current?.(map)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__trek_map = map

    map.on('load', () => {
      if (enableMapbox3d) {
        // Terrain is only valuable on satellite styles — on clean vector
        // styles it makes route lines drift off the HTML markers because
        // the lines snap to DEM height while markers stay at sea level.
        if (!isStandardFamily(glStyle) && wantsTerrain(glStyle)) addTerrainAndSky(map)
        if (supportsCustom3d(glStyle)) {
          const dark = document.documentElement.classList.contains('dark')
          addCustom3dBuildings(map, dark)
        }
      }

      // Mapbox Standard ships its own DEM-based terrain that kicks in
      // below zoom 13.7. HTML markers project at sea level, so when the
      // terrain exaggeration ramps up at lower zooms the markers drift
      // away from the 3D buildings and route lines they belong to. The
      // non-satellite Standard style still looks great without terrain,
      // so flatten it out to keep markers pinned. (Satellite variants
      // are left alone — the DEM is what gives them their character.)
      if (glStyle === MAPBOX_DEFAULT_STYLE) {
        try { map.setTerrain(null) } catch { /* noop */ }
      }
      // initial route source — kept around so updates can setData() cheaply
      if (!map.getSource('trip-route')) {
        map.addSource('trip-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        // Apple-Maps style: a darker-blue casing under a bright-blue core, both
        // rounded. Casing is added first so it sits beneath the core line.
        map.addLayer({
          id: 'trip-route-casing',
          type: 'line',
          source: 'trip-route',
          paint: { 'line-color': '#0a5cc2', 'line-width': 8 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
        map.addLayer({
          id: 'trip-route-line',
          type: 'line',
          source: 'trip-route',
          paint: { 'line-color': '#0a84ff', 'line-width': 5 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
      }
      // gpx geometries source (place.route_geometry)
      if (!map.getSource('trip-gpx')) {
        map.addSource('trip-gpx', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        map.addLayer({
          id: 'trip-gpx-line',
          type: 'line',
          source: 'trip-gpx',
          paint: {
            'line-color': ['coalesce', ['get', 'color'], '#3b82f6'],
            'line-width': 3.5,
            'line-opacity': 0.75,
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
      }
      if (!map.getSource(PLACE_CLUSTER_SOURCE_ID)) {
        map.addSource(PLACE_CLUSTER_SOURCE_ID, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          cluster: true,
          clusterRadius: 30,
          clusterMaxZoom: 10,
        })
        map.addLayer({
          id: PLACE_CLUSTER_CIRCLE_LAYER_ID,
          type: 'circle',
          source: PLACE_CLUSTER_SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#111827',
            'circle-opacity': 0.97,
            'circle-radius': ['step', ['get', 'point_count'], 18, 10, 21, 50, 24],
            'circle-stroke-width': 2.5,
            'circle-stroke-color': 'rgba(255,255,255,0.9)',
          },
        })
        map.addLayer({
          id: PLACE_CLUSTER_COUNT_LAYER_ID,
          type: 'symbol',
          source: PLACE_CLUSTER_SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
            'text-allow-overlap': true,
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': 'rgba(17,24,39,0.35)',
            'text-halo-width': 1,
          },
        })
        map.addLayer({
          id: PLACE_UNCLUSTERED_LAYER_ID,
          type: 'circle',
          source: PLACE_CLUSTER_SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-radius': 24,
            'circle-opacity': 0,
            'circle-stroke-opacity': 0,
          },
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const zoomToCluster = (e: any) => {
          const features = typeof map.queryRenderedFeatures === 'function'
            ? map.queryRenderedFeatures(e.point, { layers: [PLACE_CLUSTER_CIRCLE_LAYER_ID, PLACE_CLUSTER_COUNT_LAYER_ID] })
            : []
          const feature = features?.[0]
          const clusterId = feature?.properties?.cluster_id
          const coordinates = feature?.geometry?.coordinates
          if (clusterId == null || !Array.isArray(coordinates)) return
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const source = map.getSource(PLACE_CLUSTER_SOURCE_ID) as any
          const easeToZoom = (nextZoom: number) => {
            try { map.easeTo({ center: coordinates, zoom: nextZoom, duration: 350 }) } catch { /* noop */ }
          }
          try {
            const maybeZoom = source?.getClusterExpansionZoom?.(clusterId, (err: Error | null, nextZoom: number) => {
              if (!err && typeof nextZoom === 'number') easeToZoom(nextZoom)
            })
            if (typeof maybeZoom === 'number') easeToZoom(maybeZoom)
            else if (maybeZoom && typeof maybeZoom.then === 'function') maybeZoom.then(easeToZoom).catch(() => {})
          } catch { /* noop */ }
        }
        const setClusterCursor = () => {
          const canvas = typeof map.getCanvas === 'function' ? map.getCanvas() : null
          if (canvas) canvas.style.cursor = 'pointer'
        }
        const clearClusterCursor = () => {
          const canvas = typeof map.getCanvas === 'function' ? map.getCanvas() : null
          if (canvas) canvas.style.cursor = ''
        }
        map.on('click', PLACE_CLUSTER_CIRCLE_LAYER_ID, zoomToCluster)
        map.on('click', PLACE_CLUSTER_COUNT_LAYER_ID, zoomToCluster)
        map.on('mouseenter', PLACE_CLUSTER_CIRCLE_LAYER_ID, setClusterCursor)
        map.on('mouseleave', PLACE_CLUSTER_CIRCLE_LAYER_ID, clearClusterCursor)
      }
      // Signal that sources/layers are attached so overlay effects can
      // safely add their own sources. Style rebuilds reset this via the
      // cleanup below.
      setMapReady(true)
    })

    map.on('click', (e) => {
      const t = e.originalEvent.target as HTMLElement
      if (t.closest('.mapboxgl-marker, .maplibregl-marker')) return // markers handle their own click
      // A click that lands on a cluster bubble is the cluster's to handle
      // (zoom-to-expand), not an "add place here" map click.
      if (
        typeof map.getLayer === 'function'
        && map.getLayer(PLACE_CLUSTER_CIRCLE_LAYER_ID)
        && typeof map.queryRenderedFeatures === 'function'
        && map.queryRenderedFeatures(e.point, { layers: [PLACE_CLUSTER_CIRCLE_LAYER_ID, PLACE_CLUSTER_COUNT_LAYER_ID] }).length > 0
      ) return
      onClickRefs.current.map?.({ latlng: { lat: e.lngLat.lat, lng: e.lngLat.lng } })
    })
    // Emit the viewport bbox (pan/zoom + once on first idle) so the POI-explore
    // pill can fetch OSM places for the visible area.
    const emitViewport = () => {
      const b = map.getBounds()
      onViewportChangeRef.current?.({ south: b.getSouth(), west: b.getWest(), north: b.getNorth(), east: b.getEast() })
    }
    map.on('moveend', emitViewport)
    map.once('idle', emitViewport)
    // In the GL map the right mouse button is reserved for the
    // built-in rotate/pitch gesture, so we bind the "add place" action
    // to the middle mouse button (button === 1) instead.
    const canvas = map.getCanvasContainer()
    const onAuxDown = (ev: MouseEvent) => {
      if (ev.button !== 1) return
      ev.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const lngLat = map.unproject([ev.clientX - rect.left, ev.clientY - rect.top])
      onClickRefs.current.context?.({
        latlng: { lat: lngLat.lat, lng: lngLat.lng },
        originalEvent: ev,
      })
    }
    // Also suppress the browser's native auxclick menu on middle-click.
    const onAuxClick = (ev: MouseEvent) => {
      if (ev.button === 1) ev.preventDefault()
    }
    canvas.addEventListener('mousedown', onAuxDown)
    canvas.addEventListener('auxclick', onAuxClick)

    // Drop follow mode if the user pans the map manually — matches the
    // Apple Maps behaviour where the blue dot stays but the map no longer
    // chases it until the user taps the button again.
    map.on('dragstart', () => {
      setTrackingMode(prev => prev === 'follow' ? 'show' : prev)
    })

    // Keep HTML markers glued to the terrain / 3D ground. Mapbox projects
    // HTML markers at altitude=0 (sea level) by default, so as soon as the
    // style has a terrain DEM (Standard, Standard Satellite, custom terrain)
    // the markers drift off the places when the camera pitches or zooms —
    // the buildings rise from DEM height, the marker stays at sea level,
    // and the pixel offset grows as the perspective changes.
    //
    // Pushing `[lng, lat, elevation]` through setLngLat tells mapbox to
    // project the marker onto the same ground the route line sits on.
    // We re-apply this every render because DEM tiles stream in async.
    let lastAltUpdate = 0
    const syncMarkerAltitudes = () => {
      const now = performance.now()
      if (now - lastAltUpdate < 80) return // ~12Hz is plenty
      lastAltUpdate = now
      markersRef.current.forEach(marker => {
        const ll = marker.getLngLat()
        let alt = 0
        try {
          const e = typeof map.queryTerrainElevation === 'function'
            ? map.queryTerrainElevation([ll.lng, ll.lat])
            : null
          if (typeof e === 'number' && Number.isFinite(e)) alt = e
        } catch { /* terrain not ready */ }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const curAlt = (ll as any).alt ?? 0
        if (Math.abs(curAlt - alt) > 0.25) {
          // mapbox-gl accepts a third altitude element at runtime, but its typings
          // only model the 2-tuple form, so cast to LngLatLike.
          marker.setLngLat([ll.lng, ll.lat, alt] as unknown as mapboxgl.LngLatLike)
        }
      })
    }
    // Terrain altitude sync only matters with mapbox 3D/terrain on; skip the per-frame
    // listener entirely for MapLibre and flat mapbox styles.
    if (enableMapbox3d) map.on('render', syncMarkerAltitudes)

    return () => {
      canvas.removeEventListener('mousedown', onAuxDown)
      canvas.removeEventListener('auxclick', onAuxClick)
      markersRef.current.forEach(m => m.remove())
      markersRef.current.clear()
      if (popupRef.current) { popupRef.current.remove(); popupRef.current = null }
      onMapReadyRef.current?.(null)
      if (reservationOverlayRef.current) {
        reservationOverlayRef.current.destroy()
        reservationOverlayRef.current = null
      }
      if (locationMarkerRef.current) {
        locationMarkerRef.current.destroy()
        locationMarkerRef.current = null
      }
      try { map.remove() } catch { /* noop */ }
      mapRef.current = null
      setMapReady(false)
    }
  }, [glProvider, glStyle, mapboxToken, enableMapbox3d, mapboxQuality]) // rebuild on provider/style changes only

  // Pin the basemap label language to the UI language so labels don't fall back to the
  // browser/OS locale and stack multiple scripts per place (e.g. "India/भारत/India", #1299).
  // Mapbox Standard exposes this via a basemap config property; classic and MapLibre styles
  // are left as-is. Runs on load (mapReady) and whenever the UI language changes.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || isMapLibre || !isStandardFamily(glStyle)) return
    try { map.setConfigProperty('basemap', 'language', basemapLanguage(mapLang)) } catch { /* style/SDK may not support the basemap language property */ }
  }, [mapLang, mapReady, isMapLibre, glStyle])

  // Photo loading — mirrors the Leaflet MapView. Updates via RAF to batch
  // simultaneous thumb arrivals into one re-render.
  const pendingThumbsRef = useRef<Record<string, string>>({})
  const thumbRafRef = useRef<number | null>(null)
  const placeIds = useMemo(() => places.map(p => p.id).join(','), [places])
  useEffect(() => {
    if (!places || places.length === 0 || !placesPhotosEnabled) return
    const cleanups: (() => void)[] = []

    const setThumb = (cacheKey: string, thumb: string) => {
      pendingThumbsRef.current[cacheKey] = thumb
      if (thumbRafRef.current !== null) return
      thumbRafRef.current = requestAnimationFrame(() => {
        thumbRafRef.current = null
        const pending = pendingThumbsRef.current
        pendingThumbsRef.current = {}
        setPhotoUrls(prev => {
          const hasChange = Object.entries(pending).some(([k, v]) => prev[k] !== v)
          return hasChange ? { ...prev, ...pending } : prev
        })
      })
    }

    for (const place of places) {
      const cacheKey = place.google_place_id || place.osm_id || `${place.lat},${place.lng}`
      if (!cacheKey) continue
      const cached = getCached(cacheKey)
      if (cached?.thumbDataUrl) {
        setThumb(cacheKey, cached.thumbDataUrl)
        continue
      }
      cleanups.push(onThumbReady(cacheKey, thumb => setThumb(cacheKey, thumb)))
      if (!cached && !isLoading(cacheKey)) {
        const photoId =
          (place.image_url?.startsWith('/api/maps/place-photo/') ? place.image_url : null)
          || place.google_place_id
          || place.osm_id
          || place.image_url
        if (photoId || (place.lat && place.lng)) {
          fetchPhoto(cacheKey, photoId || `coords:${place.lat}:${place.lng}`, place.lat, place.lng, place.name)
        }
      }
    }

    return () => {
      cleanups.forEach(fn => fn())
      if (thumbRafRef.current !== null) {
        cancelAnimationFrame(thumbRafRef.current)
        thumbRafRef.current = null
      }
    }
  }, [placeIds, placesPhotosEnabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reconcile markers with places + photos. The clustered GeoJSON source decides
  // which points are currently unclustered, and we render the existing rich HTML
  // marker DOM only for those visible leaves — clustered points show up as the GL
  // cluster bubble + count instead.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    // Markers are about to be rebuilt; drop any open hover popup first. A marker
    // recreated under the pointer (e.g. when its photo streams in) never fires
    // mouseleave, which would otherwise leave the popup orphaned on the map.
    popupRef.current?.remove()
    const validPlaces = places.filter(hasValidCoords)

    const reconcileMarkers = (visiblePlaces: PlaceWithCoords[]) => {
      const ids = new Set(visiblePlaces.map(p => p.id))

      markersRef.current.forEach((marker, id) => {
        if (!ids.has(id)) {
          marker.remove()
          markersRef.current.delete(id)
          // Removing a marker under the cursor (e.g. it just got clustered) never
          // fires mouseleave, so drop its tooltip here to avoid orphaning it.
          if (hoverIdRef.current === id) { hoverIdRef.current = null; setHoverPlace(null); setHoverPos(null) }
        }
      })

      visiblePlaces.forEach(place => {
        const orderNumbers = dayOrderMap[place.id] ?? null
        const pck = place.google_place_id || place.osm_id || `${place.lat},${place.lng}`
        const photoUrl = (pck && photoUrls[pck]) || place.image_url || null
        const selected = place.id === selectedPlaceId
        const el = createMarkerElement(place as Place & { category_color?: string; category_icon?: string }, photoUrl, orderNumbers, selected)
        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          onClickRefs.current.marker?.(place.id)
        })
        el.addEventListener('mouseenter', (ev) => {
          if (hoverDisabledRef.current) return
          hoverIdRef.current = place.id
          setHoverPlace(place as Place & { category_color?: string; category_icon?: string; category_name?: string })
          setHoverPos({ x: (ev as MouseEvent).clientX, y: (ev as MouseEvent).clientY })
        })
        el.addEventListener('mousemove', (ev) => {
          if (hoverDisabledRef.current) return
          setHoverPos({ x: (ev as MouseEvent).clientX, y: (ev as MouseEvent).clientY })
        })
        el.addEventListener('mouseleave', () => {
          if (hoverDisabledRef.current) return
          hoverIdRef.current = null
          setHoverPlace(null)
          setHoverPos(null)
        })
        // Recreate marker each time rather than patching internal state —
        // mapbox-gl's internal _element bookkeeping breaks under DOM swaps.
        const existing = markersRef.current.get(place.id)
        if (existing) existing.remove()
        // Default (viewport-aligned) anchors keep the marker parallel to the
        // screen so its pixel centre lines up with the route line at any
        // pitch. Tried `pitchAlignment: 'map'` to snap markers onto terrain,
        // but it rotates the element by the pitch angle and visually offsets
        // the anchor by ~100px at 45° tilt, which caused the observed drift.
        const m = new gl.Marker({ element: el, anchor: 'center' })
          .setLngLat([place.lng, place.lat])
          .addTo(map)
        markersRef.current.set(place.id, m)
      })
    }

    const source = map.getSource(PLACE_CLUSTER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
    if (!source || typeof map.querySourceFeatures !== 'function') {
      // No cluster source (e.g. style without it / test env): fall back to the
      // original behaviour and draw a marker for every place.
      reconcileMarkers(validPlaces)
      return
    }

    source.setData(buildPlaceClusterData(places) as any)
    const placesById = new Map<number, PlaceWithCoords>(validPlaces.map(place => [place.id, place]))
    let raf: number | null = null
    const runReconcile = () => {
      raf = null
      const features = map.querySourceFeatures(PLACE_CLUSTER_SOURCE_ID, { filter: ['!', ['has', 'point_count']] }) || []
      const seen = new Set<number>()
      const visiblePlaces: PlaceWithCoords[] = []
      for (const feature of features) {
        const rawId = feature?.properties?.placeId
        const id = typeof rawId === 'string' ? Number(rawId) : rawId
        if (typeof id !== 'number' || Number.isNaN(id) || seen.has(id)) continue
        const place = placesById.get(id)
        if (!place) continue
        seen.add(id)
        visiblePlaces.push(place)
      }
      reconcileMarkers(visiblePlaces)
    }
    const scheduleReconcile = () => {
      if (raf !== null) return
      raf = requestAnimationFrame(runReconcile)
    }

    // Cluster membership only settles once the source has (re)indexed and the
    // viewport stops moving, so reconcile on the next frame and on every
    // idle/move/zoom.
    scheduleReconcile()
    map.once('idle', scheduleReconcile)
    map.on('moveend', scheduleReconcile)
    map.on('zoomend', scheduleReconcile)

    return () => {
      if (raf !== null) cancelAnimationFrame(raf)
      map.off('moveend', scheduleReconcile)
      map.off('zoomend', scheduleReconcile)
      map.off('idle', scheduleReconcile)
    }
  }, [places, selectedPlaceId, dayOrderMap, photoUrls, mapReady, glProvider])

  // Reconcile OSM "explore" POI markers (imperative, kept separate from the
  // planned-place markers so they don't cluster or get confused with them).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    popupRef.current?.remove() // same orphan-popup guard as the place markers
    poiMarkersRef.current.forEach(m => m.remove())
    poiMarkersRef.current = []
    for (const poi of (pois as Poi[])) {
      const el = createPoiMarkerElement(poi.category)
      el.addEventListener('mouseenter', () => {
        popupRef.current?.setLngLat([poi.lng, poi.lat]).setHTML(buildPoiPopupHtml(poi)).addTo(map)
      })
      el.addEventListener('mouseleave', () => { popupRef.current?.remove() })
      el.addEventListener('click', (ev) => { ev.stopPropagation(); onPoiClickRef.current?.(poi) })
      const m = new gl.Marker({ element: el, anchor: 'center' }).setLngLat([poi.lng, poi.lat]).addTo(map)
      poiMarkersRef.current.push(m)
    }
  }, [pois, mapReady, glProvider])

  // Update route geojson
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const src = map.getSource('trip-route') as mapboxgl.GeoJSONSource | undefined
    if (!src) return
    const features = (route || []).filter(seg => seg && seg.length > 1).map(seg => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: seg.map(([lat, lng]) => [lng, lat]) },
    }))
    src.setData({ type: 'FeatureCollection', features })
  }, [route, mapReady])

  // Travel times now live in the day sidebar (per-segment connectors), not on the map.

  // Update GPX geometries
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const src = map.getSource('trip-gpx') as mapboxgl.GeoJSONSource | undefined
    if (!src) return
    const features = places.flatMap(place => {
      if (!place.route_geometry) return []
      try {
        const coords = JSON.parse(place.route_geometry) as [number, number][]
        if (!coords || coords.length < 2) return []
        return [{
          type: 'Feature' as const,
          properties: { color: (place as Place & { category_color?: string }).category_color || '#3b82f6' },
          geometry: { type: 'LineString' as const, coordinates: coords.map(([lat, lng]) => [lng, lat]) },
        }]
      } catch { return [] }
    })
    src.setData({ type: 'FeatureCollection', features })
  }, [places, mapReady])

  // Reservation overlay — mirrors the Leaflet ReservationOverlay: great-
  // circle arcs for flights/cruises, straight lines for trains/cars,
  // clickable endpoint badges, rotating mid-arc stats label for flights.
  // The overlay is a small imperative manager that owns its own source,
  // layer, and HTML markers; it lives next to the map for the map's
  // lifetime and is rebuilt when the style/token/3d effect rebuilds.
  //
  // `visibleConnectionIds` is driven by the per-reservation toggle in
  // DayPlanSidebar — nothing is rendered until the user enables a
  // booking's route, matching the Leaflet MapView's behaviour.
  const visibleReservations = useMemo(() => {
    const set = new Set(visibleConnectionIds || [])
    // Transit journeys are part of the plan itself — always on the map (#1065).
    return reservations.filter(r => r.type === 'transit' || set.has(r.id))
  }, [reservations, visibleConnectionIds])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    if (!reservationOverlayRef.current) {
      reservationOverlayRef.current = new ReservationMapboxOverlay(map, {
        showConnections: true,
        showStats: showReservationStats,
        showEndpointLabels,
        onEndpointClick: (id) => onReservationClickRef.current?.(id),
      }, gl.Marker as any)
    }
    reservationOverlayRef.current.update(visibleReservations, {
      showConnections: true,
      showStats: showReservationStats,
      showEndpointLabels,
      onEndpointClick: (id) => onReservationClickRef.current?.(id),
    })
  }, [visibleReservations, showReservationStats, showEndpointLabels, mapReady, glProvider])

  // Fit bounds on fitKey change — matches the Leaflet BoundsController
  const paddingOpts = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    if (isMobile) return { top: 40, right: 20, bottom: 40, left: 20 }
    const top = 60
    const bottom = hasInspector ? 320 : hasDayDetail ? 280 : 60
    return { top, right: rightWidth + 40, bottom, left: leftWidth + 40 }
  }, [leftWidth, rightWidth, hasInspector, hasDayDetail])

  const prevFitKey = useRef(-1)
  useEffect(() => {
    if (fitKey === prevFitKey.current) return
    prevFitKey.current = fitKey
    const map = mapRef.current
    if (!map) return
    const target = dayPlaces.length > 0 ? dayPlaces : places
    const valid = target.filter(p => p.lat && p.lng)
    if (valid.length === 0) return
    const bounds = new gl.LngLatBounds()
    valid.forEach(p => bounds.extend([p.lng, p.lat]))
    const run = () => {
      try {
        map.fitBounds(bounds, {
          padding: paddingOpts,
          maxZoom: 15,
          pitch: enableMapbox3d ? 45 : 0,
          duration: 400,
        })
      } catch { /* noop */ }
    }
    if (map.loaded()) run()
    else map.once('load', run)
  }, [fitKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // flyTo selected place
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedPlaceId) return
    const target = places.find(p => p.id === selectedPlaceId) || dayPlaces.find(p => p.id === selectedPlaceId)
    if (!target?.lat || !target?.lng) return
    try {
      map.flyTo({
        center: [target.lng, target.lat],
        zoom: Math.max(map.getZoom(), 14),
        pitch: enableMapbox3d ? 45 : 0,
        duration: 400,
        // Account for the side panels and the bottom inspector / day-detail panel
        // so the selected pin lands in the centre of the *visible* map area rather
        // than the geometric centre (where the bottom panel would cover it).
        padding: paddingOpts,
      })
    } catch { /* noop */ }
  }, [selectedPlaceId, enableMapbox3d]) // eslint-disable-line react-hooks/exhaustive-deps

  // External center/zoom prop changes — jump without animation
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    try { map.jumpTo({ center: [center[1], center[0]], zoom }) } catch { /* noop */ }
  }, [center[0], center[1]]) // eslint-disable-line react-hooks/exhaustive-deps

  // Blue dot rendering + follow-mode camera. Attach the marker lazily the
  // first time a fix arrives so the layers sit on top of everything else
  // added so far, and destroy it when tracking is turned off.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (trackingMode === 'off') {
      if (locationMarkerRef.current) {
        locationMarkerRef.current.update(null)
      }
      return
    }
    if (!userPosition) return
    const apply = () => {
      if (!locationMarkerRef.current) locationMarkerRef.current = attachLocationMarker(map, gl.Marker as any)
      locationMarkerRef.current.update(userPosition)
      if (trackingMode === 'follow') {
        // easeTo is gentler than flyTo for continuous updates
        try {
          map.easeTo({
            center: [userPosition.lng, userPosition.lat],
            bearing: userPosition.heading ?? map.getBearing(),
            zoom: Math.max(map.getZoom(), 16),
            duration: 350,
          })
        } catch { /* noop */ }
      }
    }
    if (map.loaded()) apply()
    else map.once('load', apply)
  }, [userPosition, trackingMode, glProvider])

  if (!isMapLibre && !mapboxToken) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-center px-6">
        <div className="text-sm text-zinc-500">
          No Mapbox access token configured.<br />
          <span className="text-xs">Settings → Map → Mapbox GL</span>
        </div>
      </div>
    )
  }

  // Desktop browsers only get IP-based geolocation (city-level accuracy),
  // so the button would be misleading. Mobile, where real GPS lives, keeps it.
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  // When the day-detail panel is open it slides up over the map (bottom: navh+20,
  // height var(--day-panel-h)) and covers the button's band, so lift the button
  // above it; otherwise keep the plain bottom-nav offset. #1348
  const buttonBottom = hasDayDetail
    ? 'calc(var(--bottom-nav-h, 84px) + 20px + var(--day-panel-h, 0px) + 12px)'
    : 'calc(var(--bottom-nav-h, 84px) + 12px)'

  const HoverIcon = (hoverPlace?.category_icon && CATEGORY_ICON_MAP[hoverPlace.category_icon]) || CATEGORY_ICON_MAP['MapPin']

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />
      {isMobile && (
        <LocationButton
          mode={trackingMode}
          error={trackingError}
          onClick={cycleTrackingMode}
          bottomOffset={buttonBottom as unknown as number}
        />
      )}
      {/* Hover tooltip — cursor-following name/category/address card, identical to
          the Leaflet map's overlay (no anchored popup, no photo). */}
      {!hoverDisabled && hoverPlace && hoverPos && !isMobile && (
        <div data-testid="tooltip" style={{
          position: 'fixed',
          left: hoverPos.x + 14,
          top: hoverPos.y - 10,
          zIndex: 9999,
          pointerEvents: 'none',
          background: 'white',
          borderRadius: 8,
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          padding: '6px 10px',
          fontFamily: 'var(--font-system)',
          maxWidth: 220,
          whiteSpace: 'nowrap',
        }}>
          <div style={{ fontWeight: 600, fontSize: 12, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {hoverPlace.name}
          </div>
          {hoverPlace.category_name && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
              <HoverIcon size={10} style={{ color: hoverPlace.category_color || '#6b7280', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#6b7280' }}>{hoverPlace.category_name}</span>
            </div>
          )}
          {hoverPlace.address && (
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {hoverPlace.address}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
