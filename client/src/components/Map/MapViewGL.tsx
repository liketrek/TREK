import { useEffect, useRef, useMemo, useState, createElement, useCallback } from 'react'
import { makeMarkerDraggable, makePoiDraggable, draggedPoiId } from './markerDrag'
import type { RoadtripVia } from '@trek/shared'
import { ALT_CASING, ALT_LABEL_TEXT } from '../Roadtrip/alternativeColors'
import type { AlternativeOverlay } from '../Roadtrip/alternativeOverlays'
import { serviceMarkerHtml, serviceMarkerOuter } from '../Roadtrip/serviceMarker'
import { renderIconMarkup } from '../../utils/iconMarkup'
import type mapboxgl from 'mapbox-gl'
import { useSettingsStore } from '../../store/settingsStore'
import { useAuthStore } from '../../store/authStore'
import { getCached, isLoading, fetchPhoto, onThumbReady, getAllThumbs } from '../../services/photoService'
import { isCustomPlaceImage, photoCacheKey } from './placePhoto'
import { CATEGORY_ICON_MAP } from '../shared/categoryIcons'
import { isStandardFamily, supportsCustom3d, wantsTerrain, addCustom3dBuildings, addTerrainAndSky } from './mapboxSetup'
import { attachLocationMarker, type LocationMarkerHandle } from './locationMarkerMapbox'
import { ReservationMapboxOverlay } from './reservationsMapbox'
import { useTransportRoutes } from '../../hooks/useTransportRoutes'
import { visibleRouteReservations } from '../../utils/reservationRoutes'
import { safeHexColor } from '../../utils/safeColor'
import { escapeHtml } from '@trek/shared'
import { MAPBOX_DEFAULT_STYLE, styleForActiveProvider, basemapLanguage, type GlMapProvider } from './glProviders'
import LocationButton from './LocationButton'
import { useGeolocation } from '../../hooks/useGeolocation'
import type { Day, Place, Reservation, RouteVia } from '../../types'
import { POI_CATEGORY_BY_KEY, type Poi } from './poiCategories'
import { resolveTrackColor, hasManualTrackColor } from './trackColors'
import { buildPoiPopupHtml } from './placePopup'
import { pluginsApi, type PluginMapMarker, type PluginMapLayer } from '../../api/client'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../constants/mapDefaults'
import { computeMapViewport, TILE_SIZE_GL } from '../../utils/mapViewport'

function categoryIconSvg(iconName: string | null | undefined, size: number): string {
  const IconComponent = (iconName && CATEGORY_ICON_MAP[iconName]) || CATEGORY_ICON_MAP['MapPin']
  try {
    return renderIconMarkup(createElement(IconComponent, { size, color: 'white', strokeWidth: 2.5 }))
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
const GPX_HIT_LAYER_ID = 'trip-gpx-hit'

type PlaceWithCoords = Place & { lat: number; lng: number }

function hasValidCoords(place: Place): place is PlaceWithCoords {
  return place.lat != null && place.lng != null && Number.isFinite(place.lat) && Number.isFinite(place.lng)
}

function isValidCoordinate(coord: [number, number] | null | undefined): coord is [number, number] {
  return !!coord && Number.isFinite(coord[0]) && Number.isFinite(coord[1])
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

// Stable identities for the omitted collection props. An inline `= []` / `= {}`
// default allocates a fresh object on every render, and these props sit in the
// dependency arrays of the imperative reconcile effects below — so every render,
// including one caused only by the hover tooltip's state, would tear down and
// rebuild every marker. That is the "marker recreated under the cursor,
// mouseleave never fires" case (#1404).
const NO_PLACES: Place[] = []
const NO_ROUTE_VIAS: RouteVia[] = []
const NO_ROUTE_SEGMENTS: RouteSegment[] = []
const NO_DAY_ORDER: Record<number, number[] | null> = {}
const NO_RESERVATIONS: Reservation[] = []
const NO_CONNECTION_IDS: number[] = []
const NO_POIS: Poi[] = []
const NO_DAYS: Day[] = []

interface Props {
  places: Place[]
  dayPlaces?: Place[]
  // Enables the plugin map contributions (markers + layers). Absent on surfaces
  // without a trip (CollectionMap), which naturally excludes them — same rule as
  // the Leaflet MapPluginMarkers.
  tripId?: number | string
  // Charging stops / rest areas a plugin route places on the drawn day route.
  routeVias?: RouteVia[]
  route?: [number, number][][] | null
  routeSegments?: RouteSegment[]
  selectedPlaceId?: number | null
  onMarkerClick?: (id: number) => void
  hoverDisabled?: boolean
  onMapClick?: (info: { latlng: { lat: number; lng: number } }) => void
  onMapContextMenu?: ((e: { latlng: { lat: number; lng: number }; originalEvent: MouseEvent | TouchEvent }) => void) | null
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
  showTransitRoutes?: boolean
  days?: Day[]
  selectedDayId?: number | null
  showReservationStats?: boolean
  onReservationClick?: (reservationId: number) => void
  pois?: Poi[]
  onPoiClick?: (poi: Poi) => void
  /**
   * A corridor hit dropped somewhere on the map, with the coordinate it landed on.
   * The caller decides whether that point is near enough to the drive to mean anything.
   */
  onPoiDropOnRoute?: (osmId: string, lat: number, lng: number) => void
  /** A click on the drawn route, for putting a via point there (#1797). */
  onRouteClick?: (lat: number, lng: number) => void
  /** The ways of driving one leg, drawn while the picker is open. */
  alternativeRoutes?: AlternativeOverlay[]
  /** Which option is being considered, so it can be lit up in its own colour. */
  activeAlternative?: number | null
  onChooseAlternative?: (index: number) => void
  /** Reports which option the pointer is over, so the list and the map agree. */
  onHighlightAlternative?: (index: number | null) => void
  /**
   * An explicit stretch of map to frame, independent of the day being shown.
   *
   * `fitKey` cannot express this: it carries no coordinates, and each renderer decides
   * for itself that it means "the selected day". Weighing the ways of driving one leg
   * needs that leg on screen, which is neither the day nor the trip.
   */
  focusPoints?: [number, number][]
  /**
   * Let markers stay apart longer than usual.
   *
   * A road trip is read along a line: two stops fifty kilometres apart on the same
   * motorway are the shape of the day, and merging them into one dot hides it.
   */
  clusterLoosely?: boolean
  /** Via points to draw as draggable handles, keyed by day (#1797). */
  roadtripVias?: Record<number, RoadtripVia[]>
  onMoveVia?: (dayId: number, id: number, lat: number, lng: number) => void
  onRemoveVia?: (dayId: number, id: number) => void
  onViewportChange?: (bbox: { south: number; west: number; north: number; east: number }) => void
  glProvider?: GlMapProvider
  /**
   * The GL engine, injected instead of imported. Both SDKs used to be pulled in
   * statically here, so a single 2.8 MB chunk carried mapbox-gl and maplibre-gl
   * together and every map user downloaded both while only one ever ran.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gl: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onMapReady?: (map: any | null) => void
}

/** How eagerly place markers merge into a cluster, outside road trip mode. */
const CLUSTER_RADIUS = 30
const CLUSTER_MAX_ZOOM = 10

/** The cluster source and the three layers over it. Extracted so the rebuild on a mode
 *  change and the initial build cannot drift apart. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function addPlaceClusterLayers(map: any): void {
      map.addSource(PLACE_CLUSTER_SOURCE_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: CLUSTER_RADIUS,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
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
}

function createMarkerElement(place: Place & { category_color?: string; category_icon?: string }, photoUrl: string | null, orderNumbers: number[] | null, selected: boolean): HTMLDivElement {
  // A stop that interrupts the drive gets its own small disc, decided before the photo
  // branch: the brand logo a fuel search comes back with is exactly what this replaces.
  // No number badge either, for the same reason the rail gives it none.
  const service = serviceMarkerHtml(place.stop_type, selected)
  if (service) {
    const outer = serviceMarkerOuter(selected)
    const wrap = document.createElement('div')
    wrap.style.cssText = `width:${outer}px;height:${outer}px;display:flex;align-items:center;justify-content:center`
    wrap.innerHTML = service
    return wrap
  }

  const size = selected ? 44 : 36
  // See MapView: allow-listed rather than escaped, because this is a CSS context.
  const borderColor = selected ? '#111827' : safeHexColor(place.category_color, 'white')
  const borderWidth = selected ? 3 : 2.5
  const shadow = selected
    ? '0 0 0 3px rgba(17,24,39,0.25), 0 4px 14px rgba(0,0,0,0.3)'
    : '0 2px 8px rgba(0,0,0,0.22)'
  const bgColor = safeHexColor(place.category_color, '#6b7280')

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

  const hasPhoto = photoUrl && (photoUrl.startsWith('data:') || photoUrl.startsWith('/api/maps/place-photo/') || photoUrl.startsWith('/uploads/'))
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
        <img src="${escapeHtml(photoUrl)}" width="${size}" height="${size}" style="display:block;border-radius:50%;object-fit:cover;" />
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

// Plugin map contributions (mapMarkerProvider / mapLayerProvider hooks) — the GL
// twins of MapPluginMarkers/MapPluginLayers. Same contract: host-vetted declarative
// data only, tone palette, plugin JS never touches the canvas. Layer features live
// in one geojson source with data-driven paint; the dash style can't be data-driven
// in GL, so the stroke is split across three filtered line layers.
const PLUGIN_LAYER_SOURCE_ID = 'trek-plugin-layers'
const PLUGIN_LINE_LAYER_IDS: Record<'solid' | 'dash' | 'dot', string> = {
  solid: 'trek-plugin-layers-line-solid',
  dash: 'trek-plugin-layers-line-dash',
  dot: 'trek-plugin-layers-line-dot',
}
const PLUGIN_FILL_LAYER_ID = 'trek-plugin-layers-fill'
const PLUGIN_TONE_COLORS: Record<string, string> = {
  default: '#4F46E5',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
}

// GL circle layers size in screen pixels, so a metric circle has to become a
// polygon. Equirectangular approximation — plenty for a display-only overlay.
function circleToRing(center: [number, number], radiusM: number): [number, number][] {
  const [lat, lng] = center
  const dLat = radiusM / 111_320
  const cos = Math.cos((lat * Math.PI) / 180)
  const dLng = radiusM / (111_320 * Math.max(0.01, Math.abs(cos)))
  const ring: [number, number][] = []
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI
    ring.push([lng + Math.cos(a) * dLng, lat + Math.sin(a) * dLat])
  }
  return ring
}

interface PluginLayerGeoFeature {
  type: 'Feature'
  properties: { id: string; color: string; width: number; opacity: number; dash: string; fillOpacity: number; label: string }
  geometry: { type: 'LineString'; coordinates: number[][] } | { type: 'Polygon'; coordinates: number[][][] }
}

function buildPluginLayerData(layers: PluginMapLayer[]) {
  const features = layers.flatMap(layer => layer.features.flatMap((f, i): PluginLayerGeoFeature[] => {
    const color = PLUGIN_TONE_COLORS[f.tone] ?? PLUGIN_TONE_COLORS.default
    const properties = {
      id: `${layer.pluginId}:${layer.id}:${i}`,
      color,
      width: f.width,
      opacity: f.opacity,
      dash: f.dash,
      fillOpacity: f.fill ? Math.min(0.25, f.opacity) : 0,
      label: f.label || '',
    }
    if (f.type === 'polyline' && f.points) {
      return [{
        type: 'Feature' as const,
        properties,
        geometry: { type: 'LineString' as const, coordinates: f.points.map(([lat, lng]) => [lng, lat]) },
      }]
    }
    if (f.type === 'polygon' && f.points) {
      const ring = f.points.map(([lat, lng]) => [lng, lat])
      if (ring.length && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) ring.push(ring[0])
      return [{ type: 'Feature' as const, properties, geometry: { type: 'Polygon' as const, coordinates: [ring] } }]
    }
    if (f.type === 'circle' && f.center && f.radiusM) {
      return [{ type: 'Feature' as const, properties, geometry: { type: 'Polygon' as const, coordinates: [circleToRing(f.center, f.radiusM)] } }]
    }
    return []
  }))
  return { type: 'FeatureCollection' as const, features }
}

function formatViaDwellGl(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h} h ${m} min` : `${m} min`
}

/**
 * A place pin on the map, whatever is carrying it.
 *
 * Mapbox keeps the library's Marker (its terrain path needs the altitude handling that
 * comes with it); MapLibre gets a hand-positioned element, because a Marker repositions
 * itself on every `move` event — one per pointer sample — while the canvas only redraws
 * once per animation frame. Under a heavy style the pins then run ahead of the map and
 * visibly swim during a drag, which the clustered pins never do: those are drawn inside
 * the canvas. Positioning from the map's own `render` event puts both on one clock.
 */
/** What either path accepts for a position — the 3-tuple carries a terrain altitude. */
type PinPosition = [number, number] | [number, number, number] | { lng: number; lat: number }

interface PlacePin {
  el: HTMLElement
  remove: () => void
  getLngLat: () => { lng: number; lat: number }
  setLngLat: (value: PinPosition) => void
  /** Re-reads the map and writes this pin's screen position. No-op for a library marker. */
  reposition: () => void
}

/** Wraps the library's own marker so both paths present the same handle. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function libraryPin(marker: any): PlacePin {
  return {
    el: marker.getElement(),
    remove: () => marker.remove(),
    getLngLat: () => marker.getLngLat(),
    setLngLat: (value) => marker.setLngLat(value),
    reposition: () => {},
  }
}

/** A pin we place ourselves, in the map's render cadence. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function makePlacePin(map: any, layer: HTMLElement, el: HTMLElement, lng: number, lat: number): PlacePin {
  let position = { lng, lat }
  el.style.position = 'absolute'
  el.style.top = '0'
  el.style.left = '0'
  el.style.pointerEvents = 'auto'
  el.style.willChange = 'transform'
  layer.appendChild(el)
  const reposition = (): void => {
    // The map is gone the moment the style rebuilds or the component unmounts, and a
    // queued render can still land after that.
    if (typeof map.project !== 'function') return
    const p = map.project([position.lng, position.lat])
    el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`
  }
  reposition()
  return {
    el,
    remove: () => el.remove(),
    getLngLat: () => ({ ...position }),
    setLngLat: (value) => {
      position = Array.isArray(value)
        ? { lng: value[0], lat: value[1] }
        : { lng: value.lng, lat: value.lat }
      reposition()
    },
    reposition,
  }
}

/**
 * Puts an element on the map as a pin.
 *
 * `layer` is only ever set under MapLibre (that is where it gets created), so passing it
 * along is the whole provider decision: with a layer we position the element ourselves on
 * the map's render clock, without one the library's own Marker does it.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function attachPin(map: any, gl: any, layer: HTMLElement | null, el: HTMLElement, lng: number, lat: number): PlacePin {
  return layer
    ? makePlacePin(map, layer, el, lng, lat)
    : libraryPin(new gl.Marker({ element: el, anchor: 'center' }).setLngLat([lng, lat]).addTo(map))
}

// Tone dot for a plugin marker — visual twin of MapPluginMarkers' divIcon.
function createPluginMarkerElement(tone: PluginMapMarker['tone']): HTMLDivElement {
  const color = PLUGIN_TONE_COLORS[tone] ?? PLUGIN_TONE_COLORS.default
  const el = document.createElement('div')
  el.style.cssText = 'width:16px;height:16px;cursor:pointer;'
  el.innerHTML = `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);box-sizing:border-box;"></span>`
  return el
}

// Popup body for a plugin marker, built with textContent — the values are already
// host-sanitized, but nothing plugin-supplied is ever handed to innerHTML anyway.
function buildPluginMarkerPopup(mk: PluginMapMarker): HTMLDivElement {
  const box = document.createElement('div')
  box.style.cssText = 'min-width:120px;font-size:13px;'
  if (mk.label) {
    const t = document.createElement('div')
    t.style.cssText = `font-weight:600;${mk.popupText ? 'margin-bottom:4px;' : ''}`
    t.textContent = mk.label
    box.appendChild(t)
  }
  if (mk.popupText) {
    const p = document.createElement('div')
    p.style.color = '#4b5563'
    p.textContent = mk.popupText
    box.appendChild(p)
  }
  if (mk.url) {
    const a = document.createElement('a')
    a.href = mk.url // http/https/mailto only — enforced server-side
    a.target = '_blank'
    a.rel = 'noreferrer noopener'
    a.style.cssText = `display:inline-block;margin-top:6px;color:${PLUGIN_TONE_COLORS.default};`
    a.textContent = mk.url
    box.appendChild(a)
  }
  return box
}

// Small coloured pin for an OSM "explore" POI (matches the pill category colour).
// A chain shows its logo instead of the category icon: on a corridor full of petrol
// stations the brand is what the eye is looking for, and the server proxies it so the
// browser never asks Wikimedia which ones are on screen.
function createPoiMarkerElement(category: string, brandWikidata?: string | null): HTMLDivElement {
  const cat = POI_CATEGORY_BY_KEY[category]
  const color = cat?.color || '#6b7280'
  const svg = cat ? renderIconMarkup(createElement(cat.Icon, { size: 13, color: 'white', strokeWidth: 2.5 })) : ''
  const el = document.createElement('div')
  el.style.cssText = 'width:26px;height:26px;cursor:pointer;will-change:transform;'
  el.innerHTML = `<div style="position:relative;width:26px;height:26px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;box-sizing:border-box;overflow:hidden;">${svg}${brandLogoMarkup(brandWikidata)}</div>`
  return el
}

/**
 * Kept as the one place that decides a POI pin carries no brand mark: nothing.
 *
 * The logos turned a corridor full of petrol stations into a row of advertisements, were
 * unreadable at pin size, and a brand with no logo on file fell back to a different
 * picture entirely — so no two pins looked alike. A flat disc in the category's colour
 * with its icon is what the rail, the corridor list and the map all show now.
 */
export function brandLogoMarkup(_brandWikidata?: string | null): string {
  return ''
}

export function MapViewGL({
  places = NO_PLACES,
  dayPlaces = NO_PLACES,
  tripId,
  routeVias = NO_ROUTE_VIAS,
  route = null,
  routeSegments = NO_ROUTE_SEGMENTS,
  selectedPlaceId = null,
  hoverDisabled = false,
  onMarkerClick,
  onMapClick,
  onMapContextMenu = null,
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  fitKey = 0,
  focusPoints,
  clusterLoosely = false,
  dayOrderMap = NO_DAY_ORDER,
  leftWidth = 0,
  rightWidth = 0,
  hasInspector = false,
  hasDayDetail = false,
  reservations = NO_RESERVATIONS,
  visibleConnectionIds = NO_CONNECTION_IDS,
  showTransitRoutes = true,
  days = NO_DAYS,
  selectedDayId = null,
  showReservationStats = false,
  onReservationClick,
  pois = NO_POIS,
  onPoiClick,
  onPoiDropOnRoute,
  onRouteClick,
  alternativeRoutes,
  activeAlternative,
  onChooseAlternative,
  onHighlightAlternative,
  roadtripVias,
  onMoveVia,
  onRemoveVia,
  onViewportChange,
  glProvider = 'mapbox-gl',
  gl,
  onMapReady,
}: Props) {
  const rawMapboxStyle = useSettingsStore(s => s.settings.mapbox_style || MAPBOX_DEFAULT_STYLE)
  const rawMaplibreStyle = useSettingsStore(s => s.settings.maplibre_style || '')
  const mapboxToken = useSettingsStore(s => s.settings.mapbox_access_token || '')
  const mapbox3d = useSettingsStore(s => s.settings.mapbox_3d_enabled !== false)
  const mapboxQuality = useSettingsStore(s => s.settings.mapbox_quality_mode === true)
  const showEndpointLabels = useSettingsStore(s => s.settings.map_booking_labels) === true
  const mapLang = useSettingsStore(s => s.settings.language)
  const isMapLibre = glProvider === 'maplibre-gl'
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
  // True while the camera is moving (flyTo after a click, pan, zoom). Marker
  // elements get rebuilt during the move and re-fire mouseenter under a
  // stationary cursor, which would re-show the card we just cleared (#1404).
  const camMovingRef = useRef(false)

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
  const markersRef = useRef<Map<number, PlacePin>>(new Map())
  // Own layer for the hand-positioned place pins (MapLibre path, see makePlacePin).
  const pinLayerRef = useRef<HTMLDivElement | null>(null)
  const locationMarkerRef = useRef<LocationMarkerHandle | null>(null)
  const reservationOverlayRef = useRef<ReservationMapboxOverlay | null>(null)
  // Refs so the reservation overlay always sees the latest callback /
  // options without forcing a full overlay rebuild on every prop change.
  const onReservationClickRef = useRef(onReservationClick)
  onReservationClickRef.current = onReservationClick
  const poiMarkersRef = useRef<PlacePin[]>([])
  /** Undoes the drag wiring on each POI pin; the pins themselves are rebuilt wholesale. */
  const poiCleanupRef = useRef<(() => void)[]>([])
  const onPoiDropRef = useRef(onPoiDropOnRoute)
  onPoiDropRef.current = onPoiDropOnRoute
  // Plugin map contributions — data fetched per trip, elements owned imperatively
  // like the POI markers so they survive the React render cycle.
  const [pluginMarkers, setPluginMarkers] = useState<PluginMapMarker[]>([])
  const [pluginLayers, setPluginLayers] = useState<PluginMapLayer[]>([])
  const pluginMarkersRef = useRef<PlacePin[]>([])
  const routeViaMarkersRef = useRef<PlacePin[]>([])
  /** The road-trip via handles (#1797) — hand-positioned like the rest, so listed here. */
  const viaPinsRef = useRef<PlacePin[]>([])
  /** The drive-time pills on the offered routes; same treatment. */
  const altLabelsRef = useRef<PlacePin[]>([])
  // Every hand-positioned pin, whichever set it belongs to. They all have to be written
  // in the same frame the canvas draws, or the ones left out swim against the ones in.
  const repositionPins = useCallback(() => {
    markersRef.current.forEach(pin => pin.reposition())
    poiMarkersRef.current.forEach(pin => pin.reposition())
    pluginMarkersRef.current.forEach(pin => pin.reposition())
    routeViaMarkersRef.current.forEach(pin => pin.reposition())
    viaPinsRef.current.forEach(pin => pin.reposition())
    altLabelsRef.current.forEach(pin => pin.reposition())
  }, [])
  // Single reusable hover popup for POI markers. Planned places use the
  // cursor-following React tooltip below so they match the Leaflet map.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any | null>(null)
  const onPoiClickRef = useRef(onPoiClick)
  onPoiClickRef.current = onPoiClick

  /**
   * The via handles.
   *
   * Built as plain elements and attached with the same `attachPin` the place pins use,
   * rather than the library's own marker: under MapLibre those float above the map during
   * a drag instead of sticking to the ground (the reason `attachPin` exists at all). The
   * drag is therefore hand-rolled — pointer events on the element, unproject on move.
   */
  const viaCleanupRef = useRef<(() => void)[]>([])
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    viaCleanupRef.current.forEach(off => off())
    viaCleanupRef.current = []
    viaPinsRef.current.forEach(p => p.remove())
    viaPinsRef.current = []
    for (const via of Object.values(roadtripVias ?? {}).flat()) {
      const el = document.createElement('span')
      el.style.cssText = 'display:block;width:12px;height:12px;border-radius:9999px;background:#0a84ff;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45);cursor:grab;touch-action:none'
      const pin = attachPin(map, gl, pinLayerRef.current, el, via.lng, via.lat)
      viaPinsRef.current.push(pin)
      if (!onMoveVia) continue

      let dragging = false
      // The map starts panning on mousedown/touchstart anywhere on its surface, and a pin
      // sits on that surface. Stopping only pointerdown left both running at once: the
      // handle moved AND the map slid out from under it.
      const swallow = (e: Event) => e.stopPropagation()
      const onDown = (e: PointerEvent) => {
        e.stopPropagation()
        e.preventDefault()
        dragging = true
        el.setPointerCapture(e.pointerId)
        el.style.cursor = 'grabbing'
      }
      const onMove = (e: PointerEvent) => {
        if (!dragging) return
        const rect = map.getContainer().getBoundingClientRect()
        const at = map.unproject([e.clientX - rect.left, e.clientY - rect.top])
        pin.setLngLat([at.lng, at.lat])
      }
      const onUp = (e: PointerEvent) => {
        if (!dragging) return
        dragging = false
        el.style.cursor = 'grab'
        const rect = map.getContainer().getBoundingClientRect()
        const at = map.unproject([e.clientX - rect.left, e.clientY - rect.top])
        onMoveVia(via.day_id, via.id, at.lat, at.lng)
      }
      const onContext = (e: MouseEvent) => { e.preventDefault(); onRemoveVia?.(via.day_id, via.id) }
      el.addEventListener('pointerdown', onDown)
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
      el.addEventListener('pointercancel', onUp)
      el.addEventListener('contextmenu', onContext)
      el.addEventListener('mousedown', swallow)
      el.addEventListener('touchstart', swallow, { passive: true })
      el.addEventListener('dblclick', swallow)
      viaCleanupRef.current.push(() => {
        el.removeEventListener('pointerdown', onDown)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        el.removeEventListener('pointercancel', onUp)
        el.removeEventListener('contextmenu', onContext)
        el.removeEventListener('mousedown', swallow)
        el.removeEventListener('touchstart', swallow)
        el.removeEventListener('dblclick', swallow)
      })
    }
  }, [roadtripVias, mapReady, glProvider, onMoveVia, onRemoveVia])

  /**
   * The offered routes, drawn under the current one.
   *
   * Grey and dashed rather than a set of bright lines: at any moment one of them IS the
   * route, drawn in blue on top, and three more solid colours next to it would read as
   * four equal roads. Hovering an option in the bar lights that one up in its own colour,
   * which is the only moment a second colour helps.
   */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const source = map.getSource?.('route-alternatives')
    if (!source?.setData) return
    source.setData({
      type: 'FeatureCollection',
      features: (alternativeRoutes ?? []).map((alt, i) => ({
        type: 'Feature',
        properties: { index: i, active: activeAlternative === i, color: alt.color },
        geometry: { type: 'LineString', coordinates: alt.coordinates.map(([lat, lng]) => [lng, lat]) },
      })),
    })
  }, [alternativeRoutes, activeAlternative, mapReady, glProvider])

  /**
   * The drive time on each offered route, the way Apple Maps labels them.
   *
   * Hand-positioned pins rather than a symbol layer: a symbol would need the text in the
   * style's own font stack, which differs between the bundled MapLibre styles and Mapbox,
   * and the pill has a shape a text layer cannot draw. They join the render clock like
   * every other pin here, so they stay on their road while the map moves.
   */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    altLabelsRef.current.forEach(p => p.remove())
    altLabelsRef.current = []
    for (const alt of alternativeRoutes ?? []) {
      const el = document.createElement('button')
      el.type = 'button'
      const active = activeAlternative === alt.index
      el.style.cssText = [
        // A rounded rectangle rather than a pill, and roomy enough for a second line —
        // the shape Apple gives these, and the reason "1 h 55 min / Fastest" reads as one
        // label instead of two stacked chips.
        'display:flex;flex-direction:column;align-items:flex-start;white-space:nowrap',
        `background:${alt.labelBg}`,
        `color:${ALT_LABEL_TEXT}`,
        'border:none;border-radius:11px',
        // A <button> does not inherit the page's font, so without this the label reads in
        // the browser's UI face while every other piece of TREK chrome reads in Poppins.
        'font-family:var(--font-system)',
        'padding:6px 11px;font-size:13px;font-weight:600;line-height:1.25',
        'box-shadow:0 2px 10px rgba(0,0,0,.35)',
        'cursor:pointer;pointer-events:auto',
        // The pin is positioned by writing `transform` every frame. Any inherited
        // transition on it makes the label chase the map instead of sticking to the road,
        // and `transform` is exactly what a button picks up from the app's own styles.
        'transition:none !important;animation:none !important',
        'will-change:transform;backface-visibility:hidden',
        active ? 'outline:2px solid #fff;outline-offset:1px' : '',
      ].filter(Boolean).join(';')
      const time = document.createElement('span')
      time.textContent = alt.label
      el.appendChild(time)
      if (alt.note) {
        const note = document.createElement('span')
        note.textContent = alt.note
        note.style.cssText = 'font-size:11.5px;font-weight:500;opacity:.85;line-height:1.2'
        el.appendChild(note)
      }
      // Same reason as the via handles: without this the map pans as the label is pressed.
      el.addEventListener('mousedown', e => e.stopPropagation())
      el.addEventListener('touchstart', e => e.stopPropagation(), { passive: true })
      el.addEventListener('click', e => { e.stopPropagation(); onChooseAlternativeRef.current?.(alt.index) })
      el.addEventListener('mouseenter', () => onHighlightAlternativeRef.current?.(alt.index))
      el.addEventListener('mouseleave', () => onHighlightAlternativeRef.current?.(null))
      altLabelsRef.current.push(attachPin(map, gl, pinLayerRef.current, el, alt.at.lng, alt.at.lat))
    }
    return () => {
      altLabelsRef.current.forEach(p => p.remove())
      altLabelsRef.current = []
    }
  }, [alternativeRoutes, activeAlternative, mapReady, glProvider])

  /** Clicking one of the offered routes takes it, the same as clicking its chip. */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !onChooseAlternative) return
    const onClick = (e: { features?: { properties?: { index?: number } }[] }) => {
      const index = e.features?.[0]?.properties?.index
      if (typeof index === 'number') onChooseAlternative(index)
    }
    const enter = () => { map.getCanvas().style.cursor = 'pointer' }
    const leave = () => { map.getCanvas().style.cursor = '' }
    if (!map.getLayer?.('route-alt-hit')) return
    map.on('click', 'route-alt-hit', onClick)
    map.on('mouseenter', 'route-alt-hit', enter)
    map.on('mouseleave', 'route-alt-hit', leave)
    return () => {
      map.off('click', 'route-alt-hit', onClick)
      map.off('mouseenter', 'route-alt-hit', enter)
      map.off('mouseleave', 'route-alt-hit', leave)
    }
  }, [mapReady, onChooseAlternative])

  /**
   * A click on the route line, which in a GL renderer is a layer rather than an element.
   * `map.on(type, layerId, …)` is the one way to hit it, and it fires before the map's own
   * click, so the handler can keep the add-place menu from opening underneath the via.
   */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || !onRouteClick) return
    const onClick = (e: { lngLat: { lat: number; lng: number }; preventDefault?: () => void }) => {
      e.preventDefault?.()
      onRouteClick(e.lngLat.lat, e.lngLat.lng)
    }
    const enter = () => { map.getCanvas().style.cursor = 'copy' }
    const leave = () => { map.getCanvas().style.cursor = '' }
    for (const layer of ['trip-route-hit']) {
      if (!map.getLayer?.(layer)) continue
      map.on('click', layer, onClick)
      map.on('mouseenter', layer, enter)
      map.on('mouseleave', layer, leave)
    }
    return () => {
      for (const layer of ['trip-route-hit']) {
        map.off('click', layer, onClick)
        map.off('mouseenter', layer, enter)
        map.off('mouseleave', layer, leave)
      }
    }
  }, [mapReady, onRouteClick])

  /**
   * The map takes the drop, not the drawn route: in a GL renderer the line lives in the
   * canvas and has no element to aim at. The coordinate under the pointer says just as
   * much once it is projected onto the routed geometry, and it works the same in all
   * three renderers.
   */
  useEffect(() => {
    const map = mapRef.current
    const container = map?.getContainer?.()
    if (!container || !mapReady || !onPoiDropOnRoute) return
    const onDragOver = (e: DragEvent) => {
      if (!draggedPoiId(e)) return
      e.preventDefault()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
    }
    const onDrop = (e: DragEvent) => {
      const osmId = draggedPoiId(e)
      if (!osmId) return
      e.preventDefault()
      const rect = container.getBoundingClientRect()
      const at = map.unproject([e.clientX - rect.left, e.clientY - rect.top])
      onPoiDropOnRoute(osmId, at.lat, at.lng)
    }
    container.addEventListener('dragover', onDragOver)
    container.addEventListener('drop', onDrop)
    return () => {
      container.removeEventListener('dragover', onDragOver)
      container.removeEventListener('drop', onDrop)
    }
  }, [mapReady, onPoiDropOnRoute])
  const onViewportChangeRef = useRef(onViewportChange)
  onViewportChangeRef.current = onViewportChange
  const onMapReadyRef = useRef(onMapReady)
  onMapReadyRef.current = onMapReady
  const { position: userPosition, mode: trackingMode, error: trackingError, errorCode: trackingErrorCode, cycleMode: cycleTrackingMode, setMode: setTrackingMode } = useGeolocation()
  const onClickRefs = useRef({ marker: onMarkerClick, map: onMapClick, context: onMapContextMenu })
  onClickRefs.current.marker = onMarkerClick
  onClickRefs.current.map = onMapClick
  onClickRefs.current.context = onMapContextMenu
  const hoverDisabledRef = useRef(hoverDisabled)
  hoverDisabledRef.current = hoverDisabled
  // Read inside the map's own click handler, which is registered once at setup.
  const onRouteClickRef = useRef(onRouteClick)
  onRouteClickRef.current = onRouteClick
  const onChooseAlternativeRef = useRef(onChooseAlternative)
  onChooseAlternativeRef.current = onChooseAlternative
  const onHighlightAlternativeRef = useRef(onHighlightAlternative)
  onHighlightAlternativeRef.current = onHighlightAlternative
  // Same gate as the Leaflet renderer: HTML5 drag is a pointer feature, and the
  // day plan the marker would be dropped on is not on screen on a phone anyway.
  const markersDraggableRef = useRef(typeof window !== 'undefined' && navigator.maxTouchPoints === 0)
  const routeCoords = useMemo<[number, number][]>(() => (route || []).flat().filter(isValidCoordinate), [route])
  const routeFitKey = useMemo(
    () => routeCoords.map(([lat, lng]) => `${lat.toFixed(6)},${lng.toFixed(6)}`).join('|'),
    [routeCoords],
  )
  // Set when the map was built already framed on its places, so the fit below knows there is
  // nothing left to do on mount.
  const framedOnMountRef = useRef(false)

  // Build/rebuild the map on provider/style/token/3d change
  useEffect(() => {
    if (!containerRef.current || (!isMapLibre && !mapboxToken)) return
    if (!isMapLibre) gl.accessToken = mapboxToken

    // Open framed on the places rather than on the caller's default: a trip in Japan should
    // show Japan straight away, not the world view followed by a flight across the planet.
    // Reading them here is what makes this "on load" — the map is built once, and the trip's
    // places are already loaded by then (TripPlannerPage holds a splash until they are).
    const framed = computeMapViewport(dayPlaces.length > 0 ? dayPlaces : places, {
      tileSize: TILE_SIZE_GL,
      padding: paddingOpts,
    })
    framedOnMountRef.current = framed !== null
    const initial = framed ?? { center, zoom }

    const mapOptions: Record<string, unknown> = {
      container: containerRef.current,
      style: glStyle,
      center: [initial.center[1], initial.center[0]],
      zoom: initial.zoom,
      pitch: enableMapbox3d ? 45 : 0,
      attributionControl: true,
      antialias: mapboxQuality,
    }
    if (!isMapLibre) mapOptions.projection = mapboxQuality ? 'globe' : 'mercator'
    // MapLibre 5's mouse-rotate inverts its sign at a mid-screen line it gets by
    // re-projecting the map center — a line that drifts with the bearing, so a
    // right-button drag near mid-screen ping-pongs instead of rotating (#1545).
    // aroundCenter: false restores the plain dx-based rotate mapbox-gl uses.
    if (isMapLibre) mapOptions.aroundCenter = false

    const map = new gl.Map(mapOptions as any)
    mapRef.current = map
    popupRef.current = new gl.Popup({
      closeButton: false,
      closeOnClick: false,
      // The tail is off (index.css), and it used to hold ten of these pixels
      // itself — without them the card sat almost on top of the marker.
      offset: 26,
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
      // The ways of driving one leg, offered while the picker is open (#1797). Added
      // BEFORE the route source so its layers sit underneath: the current route stays the
      // brightest thing on the map, and the options read as what they are — suggestions.
      if (!map.getSource('route-alternatives')) {
        map.addSource('route-alternatives', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        // A wide invisible band per option, so a pointer can pick one without hitting
        // the 3px line exactly.
        map.addLayer({
          id: 'route-alt-hit',
          type: 'line',
          source: 'route-alternatives',
          paint: { 'line-color': '#000000', 'line-opacity': 0, 'line-width': 22 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
        // A white casing under the option lines, the same trick the main route uses.
        // Plain grey disappeared on a grey basemap — Positron is mostly greys, and a
        // grey dashed line on it is invisible. The casing gives every option an edge, so
        // it reads on a pale map, a dark one and a satellite tile alike.
        map.addLayer({
          id: 'route-alt-casing',
          type: 'line',
          source: 'route-alternatives',
          paint: { 'line-color': ALT_CASING, 'line-width': 8, 'line-opacity': 0.9 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
        map.addLayer({
          id: 'route-alt-line',
          type: 'line',
          source: 'route-alternatives',
          // Dark and dashed by default so it stays subordinate to the blue route it is an
          // alternative to; the one being considered takes its own colour and thickens.
          // Every option in blue, after Apple Maps: they are all real roads, so the
          // difference between them is emphasis rather than category. The one being
          // considered thickens; nothing turns grey, because grey vanishes on Positron.
          paint: {
            'line-color': ['coalesce', ['get', 'color'], '#7eb8f0'],
            'line-width': ['case', ['boolean', ['get', 'active'], false], 6, 4],
            'line-opacity': ['case', ['boolean', ['get', 'active'], false], 1, 0.9],
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
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
        // An invisible band over the route, purely to be clicked. The drawn line is 8px
        // and a pointer is not that accurate, so aiming at the road was most of why
        // putting a via there felt like it did not work.
        map.addLayer({
          id: 'trip-route-hit',
          type: 'line',
          source: 'trip-route',
          paint: { 'line-color': '#000000', 'line-opacity': 0, 'line-width': 26 },
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
        // Casing under the tracks that carry a picked colour (#776) — keeps them
        // legible on satellite and dark styles. Untouched tracks are filtered
        // out, so they look exactly as they did before.
        map.addLayer({
          id: 'trip-gpx-casing',
          type: 'line',
          source: 'trip-gpx',
          filter: ['==', ['get', 'cased'], true],
          paint: { 'line-color': '#ffffff', 'line-width': 6.5, 'line-opacity': 0.7 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
        map.addLayer({
          id: 'trip-gpx-line',
          type: 'line',
          source: 'trip-gpx',
          paint: {
            'line-color': ['coalesce', ['get', 'color'], '#3b82f6'],
            'line-width': 3.5,
            'line-opacity': ['case', ['==', ['get', 'cased'], true], 0.9, 0.75],
          },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
        // Invisible fat line that catches the click — 3.5px is not a target,
        // and the start markers cluster below zoom 11, so without this a track
        // is unreachable at the very zoom where you compare walks side by side.
        map.addLayer({
          id: GPX_HIT_LAYER_ID,
          type: 'line',
          source: 'trip-gpx',
          paint: { 'line-color': '#000', 'line-width': 14, 'line-opacity': 0 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        })
        const selectTrack = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          // A click on a cluster bubble sitting over a track belongs to the
          // cluster (zoom-to-expand), not to the line underneath it.
          if (
            typeof map.getLayer === 'function'
            && map.getLayer(PLACE_CLUSTER_CIRCLE_LAYER_ID)
            && typeof map.queryRenderedFeatures === 'function'
            && map.queryRenderedFeatures(e.point, { layers: [PLACE_CLUSTER_CIRCLE_LAYER_ID, PLACE_CLUSTER_COUNT_LAYER_ID] }).length > 0
          ) return
          const target = e.originalEvent?.target as HTMLElement | undefined
          if (target?.closest?.('.mapboxgl-marker, .maplibregl-marker')) return
          const placeId = e.features?.[0]?.properties?.place_id
          if (typeof placeId === 'number') onClickRefs.current.marker?.(placeId)
        }
        const setTrackCursor = () => {
          const canvas = typeof map.getCanvas === 'function' ? map.getCanvas() : null
          if (canvas) canvas.style.cursor = 'pointer'
        }
        const clearTrackCursor = () => {
          const canvas = typeof map.getCanvas === 'function' ? map.getCanvas() : null
          if (canvas) canvas.style.cursor = ''
        }
        map.on('click', GPX_HIT_LAYER_ID, selectTrack)
        map.on('mouseenter', GPX_HIT_LAYER_ID, setTrackCursor)
        map.on('mouseleave', GPX_HIT_LAYER_ID, clearTrackCursor)
      }
      if (!map.getSource(PLACE_CLUSTER_SOURCE_ID)) {
        addPlaceClusterLayers(map)
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
      // Plugin layer overlays (mapLayerProvider hook). Inserted BENEATH the day
      // route so core geometry always wins — the GL twin of the Leaflet pane 399.
      // Dash can't be data-driven, hence one filtered line layer per dash style.
      if (!map.getSource(PLUGIN_LAYER_SOURCE_ID)) {
        map.addSource(PLUGIN_LAYER_SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        map.addLayer({
          id: PLUGIN_FILL_LAYER_ID,
          type: 'fill',
          source: PLUGIN_LAYER_SOURCE_ID,
          paint: { 'fill-color': ['get', 'color'], 'fill-opacity': ['get', 'fillOpacity'] },
        }, 'trip-route-casing')
        const dashArrays: Record<string, number[] | undefined> = { solid: undefined, dash: [2, 2], dot: [0, 2] }
        for (const dash of ['solid', 'dash', 'dot'] as const) {
          map.addLayer({
            id: PLUGIN_LINE_LAYER_IDS[dash],
            type: 'line',
            source: PLUGIN_LAYER_SOURCE_ID,
            filter: ['==', ['get', 'dash'], dash],
            paint: {
              'line-color': ['get', 'color'],
              'line-width': ['get', 'width'],
              'line-opacity': ['get', 'opacity'],
              ...(dashArrays[dash] ? { 'line-dasharray': dashArrays[dash] } : {}),
            },
            layout: { 'line-cap': 'round', 'line-join': 'round' },
          }, 'trip-route-casing')
        }
        // A labelled feature answers a click with a plain-text popup (setText —
        // never HTML). Unlabelled features stay inert, like the Leaflet twin.
        const showLabel = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
          const label = e.features?.[0]?.properties?.label
          if (typeof label === 'string' && label && popupRef.current) {
            popupRef.current.setLngLat(e.lngLat).setText(label).addTo(map)
          }
        }
        for (const id of [PLUGIN_FILL_LAYER_ID, ...Object.values(PLUGIN_LINE_LAYER_IDS)]) {
          map.on('click', id, showLabel)
        }
      }
      // Signal that sources/layers are attached so overlay effects can
      // safely add their own sources. Style rebuilds reset this via the
      // cleanup below.
      setMapReady(true)
    })

    // Layer for the hand-positioned place pins, inside the canvas container so it
    // shares the canvas's stacking context — the same place the library puts its own
    // markers. `render` fires exactly when the map has drawn, so the pins land on the
    // frame the user is looking at instead of on the last pointer sample.
    if (isMapLibre) {
      const layer = document.createElement('div')
      layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;'
      map.getCanvasContainer().appendChild(layer)
      pinLayerRef.current = layer
      map.on('render', repositionPins)
    }

    // Set by the long-press handler below: the touchend tap that follows a
    // long-press must not count as a normal map click (#1398).
    let suppressNextClick = false
    map.on('click', (e) => {
      // The tap that ends a long-press would otherwise land here and clear
      // the selection right after the Add-Place form opened (#1398).
      if (suppressNextClick) { suppressNextClick = false; return }
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
      // Same for a click that landed on a track — it selects the track, it does
      // not drop a new place on top of the line.
      if (
        typeof map.getLayer === 'function'
        && map.getLayer(GPX_HIT_LAYER_ID)
        && typeof map.queryRenderedFeatures === 'function'
        && map.queryRenderedFeatures(e.point, { layers: [GPX_HIT_LAYER_ID] }).length > 0
      ) return
      // And for the drive itself while it can be reshaped: that click just put a via
      // there, and it must not also drop a place on top of it (#1797).
      if (
        onRouteClickRef.current
        && typeof map.getLayer === 'function'
        && map.getLayer('trip-route-hit')
        && typeof map.queryRenderedFeatures === 'function'
        && map.queryRenderedFeatures(e.point, { layers: ['trip-route-hit'] }).length > 0
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
    // Clear the hover card (and the anchored POI popup) as soon as the camera
    // starts moving, and keep hover suppressed until it stops: the marker
    // slides away under a stationary cursor, so mouseleave never fires (#1404).
    const onCamStart = () => {
      camMovingRef.current = true
      hoverIdRef.current = null
      setHoverPlace(null)
      setHoverPos(null)
      popupRef.current?.remove()
    }
    const onCamEnd = () => { camMovingRef.current = false }
    map.on('movestart', onCamStart)
    map.on('moveend', onCamEnd)
    // "Add place here" on the GL map (#1398). Three routes into one handler:
    // middle-click (the original binding), a plain right-click via the map's
    // own contextmenu event — both GL libs suppress that event while the
    // right-button rotate/pitch drag is active, so it can't fight the gesture,
    // and it also covers Mac ctrl-click / two-finger tap — and a touch
    // long-press, which neither GL lib synthesizes into contextmenu (Leaflet
    // does, which is why the OSM map already worked on mobile).
    const canvas = map.getCanvasContainer()
    let lastContextFire = 0
    const fireContext = (lngLat: { lat: number; lng: number }, originalEvent: MouseEvent | TouchEvent): boolean => {
      // Android fires a native contextmenu for a long-press on top of our own
      // timer — dedupe so the form doesn't open twice.
      if (Date.now() - lastContextFire < 700) return false
      lastContextFire = Date.now()
      onClickRefs.current.context?.({ latlng: { lat: lngLat.lat, lng: lngLat.lng }, originalEvent })
      return true
    }
    // MapLibre swallows the map contextmenu at the end of a right-button
    // rotate/pitch drag, but mapbox-gl does NOT — and on Windows the DOM
    // contextmenu arrives after mouseup, so every rotate would end by opening
    // the Add-Place form. Track the right-button press position and drop a
    // contextmenu whose pointer travelled like a drag rather than a click.
    let rightDownAt: { x: number; y: number } | null = null
    const onAuxDown = (ev: MouseEvent) => {
      if (ev.button === 2) {
        rightDownAt = { x: ev.clientX, y: ev.clientY }
        return
      }
      if (ev.button !== 1) return
      ev.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const lngLat = map.unproject([ev.clientX - rect.left, ev.clientY - rect.top])
      fireContext({ lat: lngLat.lat, lng: lngLat.lng }, ev)
    }
    // Also suppress the browser's native auxclick menu on middle-click.
    const onAuxClick = (ev: MouseEvent) => {
      if (ev.button === 1) ev.preventDefault()
    }
    canvas.addEventListener('mousedown', onAuxDown)
    canvas.addEventListener('auxclick', onAuxClick)
    map.on('contextmenu', (e: { lngLat: { lat: number; lng: number }; originalEvent: MouseEvent }) => {
      const down = rightDownAt
      rightDownAt = null
      if (down && Math.hypot(e.originalEvent.clientX - down.x, e.originalEvent.clientY - down.y) > 5) return
      fireContext(e.lngLat, e.originalEvent)
    })
    // Touch long-press: 600 ms hold (Leaflet's tapHold feel) with a 10 px
    // move tolerance so slow pans and pinches don't open the form.
    let lpTimer: number | null = null
    let lpStart: { x: number; y: number } | null = null
    const cancelLongPress = () => {
      if (lpTimer !== null) window.clearTimeout(lpTimer)
      lpTimer = null
      lpStart = null
    }
    const onTouchStart = (ev: TouchEvent) => {
      // A fresh gesture clears a stale suppression flag: not every long-press
      // is followed by a click (finger drag after the hold, Android's native
      // contextmenu path), and the flag must never swallow a later real tap.
      suppressNextClick = false
      if (ev.touches.length !== 1) { cancelLongPress(); return }
      if ((ev.target as HTMLElement).closest('.mapboxgl-marker, .maplibregl-marker')) return
      const t = ev.touches[0]
      const start = { x: t.clientX, y: t.clientY }
      lpStart = start
      lpTimer = window.setTimeout(() => {
        lpTimer = null
        const rect = canvas.getBoundingClientRect()
        const lngLat = map.unproject([start.x - rect.left, start.y - rect.top])
        lpStart = null
        // Only suppress the tap when OUR fire opened the form — if the native
        // contextmenu beat us to it (dedupe), no click needs swallowing.
        if (fireContext({ lat: lngLat.lat, lng: lngLat.lng }, ev)) suppressNextClick = true
      }, 600)
    }
    const onTouchMove = (ev: TouchEvent) => {
      const t = ev.touches[0]
      if (lpStart && (!t || Math.hypot(t.clientX - lpStart.x, t.clientY - lpStart.y) > 10)) cancelLongPress()
    }
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: true })
    canvas.addEventListener('touchend', cancelLongPress)
    canvas.addEventListener('touchcancel', cancelLongPress)

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
          // only model the 2-tuple form — PinPosition spells the runtime shape out.
          marker.setLngLat([ll.lng, ll.lat, alt])
        }
      })
    }
    // Terrain altitude sync only matters with mapbox 3D/terrain on; skip the per-frame
    // listener entirely for MapLibre and flat mapbox styles.
    if (enableMapbox3d) map.on('render', syncMarkerAltitudes)

    return () => {
      canvas.removeEventListener('mousedown', onAuxDown)
      canvas.removeEventListener('auxclick', onAuxClick)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', cancelLongPress)
      canvas.removeEventListener('touchcancel', cancelLongPress)
      cancelLongPress()
      map.off('render', repositionPins)
      markersRef.current.forEach(m => m.remove())
      markersRef.current.clear()
      pinLayerRef.current?.remove()
      pinLayerRef.current = null
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
      // Drop the debug handle too, or a style switch keeps every torn-down map
      // (canvas and sources included) alive for the rest of the page's life. The
      // identity check leaves a freshly built map alone if this cleanup runs late.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).__trek_map === map) delete (window as any).__trek_map
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
      // A custom uploaded image is shown directly — never auto-fetch a provider
      // photo for it (that request would 404 for OSM-only places and, worse, the
      // fetched thumb would shadow the user's own image). (#1136)
      if (isCustomPlaceImage(place.image_url)) continue
      const cacheKey = photoCacheKey(place)
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
        const pck = photoCacheKey(place)
        // A custom image wins over the auto-fetched thumb; otherwise fall back to it.
        const photoUrl = isCustomPlaceImage(place.image_url) ? place.image_url! : ((pck && photoUrls[pck]) || place.image_url || null)
        const selected = place.id === selectedPlaceId
        const el = createMarkerElement(place as Place & { category_color?: string; category_icon?: string }, photoUrl, orderNumbers, selected)
        // Drag onto a day in the plan (#891). Markers are rebuilt from scratch
        // on every reconcile, so the listeners go with the element and need no
        // teardown of their own.
        if (markersDraggableRef.current) makeMarkerDraggable(el, place.id)
        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          // Clear the card right away — the flyTo that follows moves the marker
          // out from under the cursor and mouseleave never fires (#1404).
          hoverIdRef.current = null
          setHoverPlace(null)
          setHoverPos(null)
          onClickRefs.current.marker?.(place.id)
        })
        el.addEventListener('mouseenter', (ev) => {
          if (hoverDisabledRef.current || camMovingRef.current) return
          hoverIdRef.current = place.id
          setHoverPlace(place as Place & { category_color?: string; category_icon?: string; category_name?: string })
          setHoverPos({ x: (ev as MouseEvent).clientX, y: (ev as MouseEvent).clientY })
        })
        el.addEventListener('mousemove', (ev) => {
          if (hoverDisabledRef.current || camMovingRef.current) return
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
        markersRef.current.set(place.id, attachPin(map, gl, pinLayerRef.current, el, place.lng, place.lat))
      })
    }

    const source = map.getSource(PLACE_CLUSTER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
    if (!source || typeof map.querySourceFeatures !== 'function') {
      // No cluster source (e.g. style without it / test env): fall back to the
      // original behaviour and draw a marker for every place.
      reconcileMarkers(validPlaces)
      return
    }

    // Road trip mode does not cluster at all: the whole drive has to stay readable
    // zoomed right out, and a day's stops merging into one dot is exactly the shape it
    // is being looked at for. The source is emptied rather than reconfigured — the
    // cluster options can only be set when a GeoJSON source is created, and dropping and
    // re-adding a source under three layers to change a radius is not worth it when the
    // markers are drawn from `places` anyway.
    if (clusterLoosely) {
      source.setData({ type: 'FeatureCollection', features: [] })
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
  }, [places, selectedPlaceId, dayOrderMap, photoUrls, mapReady, glProvider, clusterLoosely])

  // Reconcile OSM "explore" POI markers (imperative, kept separate from the
  // planned-place markers so they don't cluster or get confused with them).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    popupRef.current?.remove() // same orphan-popup guard as the place markers
    poiMarkersRef.current.forEach(m => m.remove())
    poiMarkersRef.current = []
    poiCleanupRef.current.forEach(off => off())
    poiCleanupRef.current = []
    for (const poi of (pois as Poi[])) {
      const el = createPoiMarkerElement(poi.category, poi.brand_wikidata)
      el.addEventListener('mouseenter', () => {
        popupRef.current?.setLngLat([poi.lng, poi.lat]).setHTML(buildPoiPopupHtml(poi)).addTo(map)
      })
      el.addEventListener('mouseleave', () => { popupRef.current?.remove() })
      el.addEventListener('click', (ev) => { ev.stopPropagation(); onPoiClickRef.current?.(poi) })
      // Dragging a hit onto the drive puts it where it is passed, rather than where the
      // corridor happened to project it. Only wired when someone is listening for it.
      if (onPoiDropRef.current) poiCleanupRef.current.push(makePoiDraggable(el, poi.osm_id))
      poiMarkersRef.current.push(attachPin(map, gl, pinLayerRef.current, el, poi.lng, poi.lat))
    }
  }, [pois, mapReady, glProvider])

  // Fetch plugin map contributions (markers + layers) per trip. Fail-safe: an
  // error or missing tripId just means no plugin overlays, the core map is fine.
  useEffect(() => {
    if (tripId == null) { setPluginMarkers([]); setPluginLayers([]); return }
    let alive = true
    pluginsApi.mapMarkers(tripId)
      .then(r => { if (alive) setPluginMarkers(r.markers || []) })
      .catch(() => { if (alive) setPluginMarkers([]) })
    pluginsApi.mapLayers(tripId)
      .then(r => { if (alive) setPluginLayers(r.layers || []) })
      .catch(() => { if (alive) setPluginLayers([]) })
    return () => { alive = false }
  }, [tripId])

  // Update plugin layer geojson
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    const src = map.getSource(PLUGIN_LAYER_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
    if (!src) return
    src.setData(buildPluginLayerData(pluginLayers))
  }, [pluginLayers, mapReady, glProvider])

  // Reconcile the via-point markers of a plugin route (charging stops) — small
  // tone-ringed dots, popup with label + planned stop time on tap.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    routeViaMarkersRef.current.forEach(m => m.remove())
    routeViaMarkersRef.current = []
    for (const v of routeVias) {
      const el = document.createElement('div')
      el.style.cssText = 'width:13px;height:13px;cursor:pointer;'
      const color = PLUGIN_TONE_COLORS[v.tone] ?? PLUGIN_TONE_COLORS.default
      el.innerHTML = `<span style="display:block;width:13px;height:13px;border-radius:50%;background:#fff;border:3.5px solid ${color};box-shadow:0 1px 4px rgba(0,0,0,0.35);box-sizing:border-box"></span>`
      if (v.label || v.dwellSeconds != null) {
        const text = [v.label, v.dwellSeconds != null ? formatViaDwellGl(v.dwellSeconds) : null].filter(Boolean).join(' · ')
        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          popupRef.current?.setLngLat([v.lng, v.lat]).setText(text).addTo(map)
        })
      }
      routeViaMarkersRef.current.push(attachPin(map, gl, pinLayerRef.current, el, v.lng, v.lat))
    }
  }, [routeVias, mapReady, glProvider])

  // Reconcile plugin markers (imperative, same lifecycle as the POI markers).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    pluginMarkersRef.current.forEach(m => m.remove())
    pluginMarkersRef.current = []
    for (const mk of pluginMarkers) {
      const el = createPluginMarkerElement(mk.tone)
      if (mk.label || mk.popupText || mk.url) {
        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          popupRef.current?.setLngLat([mk.lng, mk.lat]).setDOMContent(buildPluginMarkerPopup(mk)).addTo(map)
        })
      }
      const m = attachPin(map, gl, pinLayerRef.current, el, mk.lng, mk.lat)
      pluginMarkersRef.current.push(m)
    }
  }, [pluginMarkers, mapReady, glProvider])

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
          properties: {
            color: resolveTrackColor(place),
            cased: hasManualTrackColor(place),
            place_id: place.id,
          },
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
  const visibleReservations = useMemo(() => (
    visibleRouteReservations(reservations, { visibleConnectionIds, showTransitRoutes, selectedDayId, days })
  ), [reservations, visibleConnectionIds, showTransitRoutes, selectedDayId, days])
  // Real road geometry for car/bus/taxi/bicycle bookings (straight line until it loads/if it fails).
  const transportRoutes = useTransportRoutes(visibleReservations)

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
    }, transportRoutes)
  }, [visibleReservations, transportRoutes, showReservationStats, showEndpointLabels, mapReady, glProvider])

  // Fit bounds on fitKey change — matches the Leaflet BoundsController
  const paddingOpts = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    if (isMobile) return { top: 40, right: 20, bottom: 40, left: 20 }
    const top = 60
    const bottom = hasInspector ? 320 : hasDayDetail ? 280 : 60
    return { top, right: rightWidth + 40, bottom, left: leftWidth + 40 }
  }, [leftWidth, rightWidth, hasInspector, hasDayDetail])

  const prevFitKey = useRef<number | null>(-1)
  const pendingRouteFitRef = useRef<{ fitKey: number | null; routeKey: string } | null>(null)
  const fitRanRef = useRef(false)
  useEffect(() => {
    const fitKeyChanged = fitKey !== prevFitKey.current
    const routeArrivedForPendingFit =
      !fitKeyChanged
      && pendingRouteFitRef.current?.fitKey === fitKey
      && !!routeFitKey
      && routeFitKey !== pendingRouteFitRef.current.routeKey
    if (!fitKeyChanged && !routeArrivedForPendingFit) return
    const map = mapRef.current
    if (!map) return

    // The map was built framed on these very places, so fitting now would only re-do that —
    // and its maxZoom would overrule the gentler zoom a single place opens at. Adopt the
    // current fitKey and stand down; every later fit (picking a day) still runs.
    if (!fitRanRef.current && framedOnMountRef.current) {
      fitRanRef.current = true
      prevFitKey.current = fitKey
      pendingRouteFitRef.current = null
      return
    }
    fitRanRef.current = true
    if (fitKeyChanged) {
      prevFitKey.current = fitKey
      // Only wait for better geometry when a route is already on screen: the day's
      // route lands as straight lines in the same batch as the fit, then upgrades to
      // the real road geometry a moment later. With no route drawn, none is coming for
      // this fit — arming the slot anyway would let a route toggled on much later
      // (after the user has panned somewhere else) yank the camera back.
      pendingRouteFitRef.current = routeFitKey ? { fitKey, routeKey: routeFitKey } : null
    }
    const target = dayPlaces.length > 0 ? dayPlaces : places
    const markerPoints = target.filter(hasValidCoords).map(p => [p.lat, p.lng] as [number, number])
    const fitPoints = routeCoords.length > 0 ? [...routeCoords, ...markerPoints] : markerPoints
    if (fitPoints.length === 0) return
    const bounds = new gl.LngLatBounds()
    fitPoints.forEach(([lat, lng]) => bounds.extend([lng, lat]))
    let fitted = false
    const run = () => {
      try {
        map.fitBounds(bounds, {
          padding: paddingOpts,
          maxZoom: 15,
          pitch: enableMapbox3d ? 45 : 0,
          duration: 400,
        })
        fitted = true
      } catch { /* noop */ }
    }
    run()
    if (!fitted && typeof map.once === 'function') map.once('load', run)
    if (routeArrivedForPendingFit) pendingRouteFitRef.current = null
  }, [fitKey, routeFitKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Frame whatever was handed over. Nothing happens when it empties, so closing the
  // picker leaves the map where the user left it rather than snapping back.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !focusPoints?.length) return
    const bounds = new gl.LngLatBounds()
    focusPoints.forEach(([lat, lng]) => bounds.extend([lng, lat]))
    // A day fit still waiting on its route must not overwrite this a moment later.
    pendingRouteFitRef.current = null
    try {
      map.fitBounds(bounds, {
        padding: paddingOpts,
        maxZoom: 15,
        pitch: enableMapbox3d ? 45 : 0,
        duration: 400,
      })
    } catch { /* noop */ }
  }, [focusPoints]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const jumpedToRef = useRef<[number, number] | null>(null)
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    // Not on mount: the map was just built with its own camera, framed on the places, and
    // jumping to the prop centre here would throw that away and land on the world view.
    // This effect is for *changes* to the prop, which only arrive later.
    const previous = jumpedToRef.current
    jumpedToRef.current = [center[0], center[1]]
    if (!previous || (previous[0] === center[0] && previous[1] === center[1])) return
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
          errorCode={trackingErrorCode}
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
