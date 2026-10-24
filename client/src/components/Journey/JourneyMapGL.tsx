import { useEffect, useRef, useImperativeHandle, useCallback, type Ref } from 'react'
import type mapboxgl from 'mapbox-gl'
import { useSettingsStore } from '../../store/settingsStore'
import { isStandardFamily, supportsCustom3d, wantsTerrain, addCustom3dBuildings, addTerrainAndSky } from '../Map/mapboxSetup'
import { MAPBOX_DEFAULT_STYLE, styleForActiveProvider, basemapLanguage, type GlMapProvider } from '../Map/glProviders'
import type { JourneyTrack } from '@trek/shared'
import { SHOT_INDEX_ATTR, ensureJourneyPopupStyle, formatMarkerDate, journeyPopupHtml } from './journeyMapPopup'
import { clusterPhotos, photoMarkerHtml, type MapPhoto } from './journeyPhotoLayer'
import { MARK_CLUSTER_PX, PLANNED_BADGE_SVG, clusterPoints, markHitSvg, type JourneyMapMark } from './journeyMapMarks'
import { isPlannedTrack, type JourneyMapLayerVisibility } from './journeyMapLayers'

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
  /** Thumbnails for the marker card, already resolved by the caller (the share view signs its own). */
  photoUrls?: string[]
}

interface Props {
  ref?: Ref<JourneyMapGLHandle>
  checkins: unknown[]
  entries: MapEntry[]
  trail?: { lat: number; lng: number }[]
  /** Routed GPX geometries from the journey's trips (#1260). */
  tracks?: JourneyTrack[]
  height?: number
  dark?: boolean
  activeMarkerId?: string | null
  onMarkerClick?: (id: string, type?: string) => void
  fullScreen?: boolean
  /** See the Leaflet twin: no marker labels where a carousel already names the entry. */
  hideMarkerTooltip?: boolean
  /**
   * Open the entry's photos from the card's thumbnail strip.
   *
   * Wiring it is what makes the strip take the pointer at all; without it the
   * card stays the inert label it has always been.
   */
  onMarkerPhotoClick?: (entryId: string, photoIndex: number) => void
  /** Photos placed by their own capture coordinates, clustered by proximity (#2453). */
  photos?: MapPhoto[]
  onPhotoClick?: (photoIds: string[]) => void
  paddingBottom?: number
  /** See the Leaflet twin (JRN-04): hidden layers go off the map in place. */
  layerVisibility?: JourneyMapLayerVisibility
  marks?: JourneyMapMark[]
  onMarksPick?: (marks: JourneyMapMark[]) => void
  plannedEntryIds?: ReadonlySet<string>
  glProvider?: GlMapProvider
  /**
   * The GL engine, injected instead of imported. Both SDKs used to be pulled in
   * statically here, so a single 2.8 MB chunk carried mapbox-gl and maplibre-gl
   * together and every map user downloaded both while only one ever ran.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  gl: any
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
  photoUrls: string[]
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
        photoUrls: e.photoUrls ?? [],
      })
    }
  }
  items.sort((a, b) => a.time.localeCompare(b.time))
  return items
}

/** The map's own layers each switch takes off and puts back. */
const LAYER_IDS: Record<keyof JourneyMapLayerVisibility, string[]> = {
  plan: ['journey-tracks-planned-casing', 'journey-tracks-planned'],
  recorded: ['journey-tracks-casing', 'journey-tracks-line'],
  entries: ['journey-route-line'],
}
const EVERY_LAYER: JourneyMapLayerVisibility = { plan: true, recorded: true, entries: true }
const NO_PLANNED: ReadonlySet<string> = new Set()

function markerHtml(dayColor: string, dayLabel: number, highlighted: boolean, planned = false): HTMLDivElement {
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
    ${planned ? PLANNED_BADGE_SVG : ''}
  </svg>`
  wrap.appendChild(inner)
  return wrap
}

const EMPTY_TRAIL: { lat: number; lng: number }[] = []
const EMPTY_TRACKS: JourneyTrack[] = []
/** Fallback when a track carries no colour of its own, matching the planner's default. */
const TRACK_FALLBACK_COLOR = '#4f46e5'

function markBounds(gl: Props['gl'], marks: JourneyMapMark[], points: [number, number][] = []) {
  const bounds = new gl.LngLatBounds()
  points.forEach(point => bounds.extend(point))
  marks.forEach(mark => bounds.extend([mark.lng, mark.lat]))
  return bounds
}

function fitOptions(paddingBottom: number | undefined, tilted: boolean | undefined) {
  return {
    padding: { top: 50, bottom: paddingBottom || 50, left: 50, right: 50 },
    maxZoom: 16,
    pitch: tilted ? 45 : 0,
    duration: 0,
  }
}

function JourneyMapGL(
  { entries, trail, tracks, height = 220, dark, activeMarkerId, onMarkerClick, fullScreen, paddingBottom, glProvider = 'mapbox-gl', gl, hideMarkerTooltip, onMarkerPhotoClick, photos, onPhotoClick, layerVisibility = EVERY_LAYER, marks, onMarksPick, plannedEntryIds = NO_PLANNED, ref }: Props,
) {
  const hideMarkerTooltipRef = useRef(hideMarkerTooltip)
  hideMarkerTooltipRef.current = hideMarkerTooltip
  const onMarkerPhotoClickRef = useRef(onMarkerPhotoClick)
  onMarkerPhotoClickRef.current = onMarkerPhotoClick
  /** Which entry the card is currently describing, for the delegated photo click. */
  const popupItemIdRef = useRef<string | null>(null)
  const stableTrail = trail || EMPTY_TRAIL
  const stableTracks = tracks || EMPTY_TRACKS
  const rawMapboxStyle = useSettingsStore(s => s.settings.mapbox_style || MAPBOX_DEFAULT_STYLE)
  const rawMaplibreStyle = useSettingsStore(s => s.settings.maplibre_style || '')
  const mapboxToken = useSettingsStore(s => s.settings.mapbox_access_token || '')
  const mapbox3d = useSettingsStore(s => s.settings.mapbox_3d_enabled !== false)
  const mapboxQuality = useSettingsStore(s => s.settings.mapbox_quality_mode === true)
  const mapLang = useSettingsStore(s => s.settings.language)
  const isMapLibre = glProvider === 'maplibre-gl'
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
  const onPhotoClickRef = useRef(onPhotoClick)
  onPhotoClickRef.current = onPhotoClick
  const photoMarkersRef = useRef<{ remove: () => void }[]>([])
  const markMarkersRef = useRef<{ remove: () => void }[]>([])
  const onMarksPickRef = useRef(onMarksPick)
  const marksRef = useRef(marks)
  // As on the Leaflet map: the plan and the stays arrive after the entries, so
  // the first view is framed again around both, unless the reader moved it.
  const entryPointsRef = useRef<[number, number][]>([])
  const marksFramedRef = useRef(false)
  const readerMovedRef = useRef(false)
  const visibilityRef = useRef(layerVisibility)
  const shownRef = useRef<JourneyMapLayerVisibility>(layerVisibility)
  const plannedRef = useRef(plannedEntryIds)
  const iconPlannedRef = useRef<ReadonlySet<string>>(plannedEntryIds)
  // Before the map effects below, so a rebuild draws with what the reader shows now.
  useEffect(() => {
    onMarksPickRef.current = onMarksPick
    marksRef.current = marks
    visibilityRef.current = layerVisibility
    plannedRef.current = plannedEntryIds
  })
  const darkRef = useRef(dark)
  darkRef.current = dark
  const mapLangRef = useRef(mapLang)
  mapLangRef.current = mapLang

  const showPopup = useCallback((id: string) => {
    // See `hideMarkerTooltip` on the Leaflet twin: below the carousel the card
    // already says this, and the popup only covers the map to repeat it.
    if (hideMarkerTooltipRef.current) return
    const item = itemsRef.current.find(i => i.id === id)
    if (!item || !mapRef.current) return
    ensureJourneyPopupStyle()
    // Primary line: user-given title. If none, fall back to the location
    // name so we always show *something* useful on the top line.
    const html = journeyPopupHtml({
      title: item.label || item.locationName || 'Entry',
      place: item.label ? item.locationName : '',
      date: formatMarkerDate(item.time),
      photoUrls: item.photoUrls,
    })

    // Marker is bottom-anchored with a visible height of 36px (1.2× on
    // highlight ≈ 44px), so -46 keeps the popup just clear of the pin top.
    const offset: [number, number] = [0, -46]
    popupItemIdRef.current = item.id
    const interactive = !!onMarkerPhotoClickRef.current && item.photoUrls.length > 0
    if (popupRef.current) {
      popupRef.current.setLngLat([item.lng, item.lat])
      popupRef.current.setHTML(html)
      popupRef.current.setOffset(offset)
      const el = popupRef.current.getElement()
      if (el) {
        el.classList.toggle('trek-dark', !!darkRef.current)
        el.classList.toggle('is-interactive', interactive)
      }
    } else {
      popupRef.current = new gl.Popup({
        closeButton: false,
        closeOnClick: false,
        closeOnMove: false,
        anchor: 'bottom',
        offset,
        className: `trek-journey-popup${darkRef.current ? ' trek-dark' : ''}${interactive ? ' is-interactive' : ''}`,
        maxWidth: '280px',
      })
        .setLngLat([item.lng, item.lat])
        .setHTML(html)
        .addTo(mapRef.current)
      // Delegated, and bound once for the popup's whole life: setHTML replaces the
      // strip on every entry, so a listener on the thumbnails themselves would have
      // to be rebound each time and would leak the ones it forgot.
      popupRef.current.getElement()?.addEventListener('click', (ev: Event) => {
        const shot = (ev.target as HTMLElement | null)?.closest(`[${SHOT_INDEX_ATTR}]`)
        const entryId = popupItemIdRef.current
        if (!shot || !entryId) return
        ev.stopPropagation()
        onMarkerPhotoClickRef.current?.(entryId, Number(shot.getAttribute(SHOT_INDEX_ATTR)))
      })
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
    const next = markerHtml(item.dayColor, item.dayLabel, highlighted, plannedRef.current.has(id))
    const nextInner = next.querySelector('.trek-journey-marker-inner') as HTMLDivElement
    currentInner.style.cssText = nextInner.style.cssText
    currentInner.innerHTML = nextInner.innerHTML
    el.style.zIndex = highlighted ? '1000' : '1'
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

  /** Pan to the marker and leave the zoom alone — see the Leaflet twin for why. */
  const focusMarker = useCallback((id: string) => {
    highlightMarker(id)
    const marker = markersRef.current.get(id)
    if (!marker || !mapRef.current) return
    try {
      mapRef.current.easeTo({
        center: marker.getLngLat(),
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
    if (!isMapLibre) gl.accessToken = mapboxToken

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
      // Collapsed to its ⓘ button rather than a strip of text: the phone lays a card
      // carousel across the bottom of this map and the strip read through it. The
      // credit stays one tap away, which is what the OSM licence asks for.
      attributionControl: { compact: true },
      antialias: mapboxQuality,
    }
    if (!isMapLibre) mapOptions.projection = mapboxQuality ? 'globe' : 'mercator'
    // MapLibre 5's around-center mouse rotate ping-pongs near mid-screen (#1545)
    // — see MapViewGL. Keep the plain dx-based rotate everywhere.
    if (isMapLibre) mapOptions.aroundCenter = false

    const map = new gl.Map(mapOptions as any)
    mapRef.current = map
    marksFramedRef.current = false
    entryPointsRef.current = [...items.map(i => [i.lng, i.lat] as [number, number]), ...stableTrail.map(p => [p.lng, p.lat] as [number, number])]
    readerMovedRef.current = false
    map.on('movestart', (ev: { originalEvent?: unknown }) => {
      if (ev.originalEvent) readerMovedRef.current = true
    })
    shownRef.current = visibilityRef.current
    iconPlannedRef.current = plannedRef.current
    // A layer whose switch is off is added hidden, so switching it on later needs no rebuild.
    const layout = (kind: keyof JourneyMapLayerVisibility, base: Record<string, unknown>) =>
      visibilityRef.current[kind] ? base : { ...base, visibility: 'none' }

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
        try { map.setConfigProperty('basemap', 'language', basemapLanguage(mapLangRef.current)) } catch { /* style/SDK may not support it */ }
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
            layout: layout('entries', { 'line-cap': 'round', 'line-join': 'round' }),
          })
        }
      }

      // Tracks, one source for all of them, coloured per feature so a journey
      // with several routes keeps them apart. Casing underneath, same as the
      // planner map, so a track stays readable on satellite tiles. A trip's GPX
      // track is the plan and goes on a dashed layer, what was recorded on a solid
      // one (JRN-01): a dash pattern cannot follow a feature property.
      if (stableTracks.length > 0) {
        const featureCollection: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: stableTracks
            .filter(track => track.points.length > 1)
            .map(track => ({
              type: 'Feature' as const,
              properties: {
                color: track.color || TRACK_FALLBACK_COLOR,
                name: track.name,
                planned: isPlannedTrack(track),
              },
              geometry: { type: 'LineString' as const, coordinates: track.points.map(([lat, lng]) => [lng, lat]) },
            })),
        }
        if (featureCollection.features.length > 0) {
          if (map.getSource('journey-tracks')) {
            (map.getSource('journey-tracks') as mapboxgl.GeoJSONSource).setData(featureCollection)
          } else {
            map.addSource('journey-tracks', { type: 'geojson', data: featureCollection })
            // Casing apart for the plan and what was recorded, so each goes with its switch.
            map.addLayer({
              id: 'journey-tracks-casing',
              type: 'line',
              source: 'journey-tracks',
              filter: ['!=', ['get', 'planned'], true],
              paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.75 },
              layout: layout('recorded', { 'line-cap': 'round', 'line-join': 'round' }),
            })
            map.addLayer({
              id: 'journey-tracks-planned-casing',
              type: 'line',
              source: 'journey-tracks',
              filter: ['==', ['get', 'planned'], true],
              paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.75 },
              layout: layout('plan', { 'line-cap': 'round', 'line-join': 'round' }),
            })
            map.addLayer({
              id: 'journey-tracks-line',
              type: 'line',
              source: 'journey-tracks',
              filter: ['!=', ['get', 'planned'], true],
              paint: { 'line-color': ['get', 'color'], 'line-width': 3.5, 'line-opacity': 0.95 },
              layout: layout('recorded', { 'line-cap': 'round', 'line-join': 'round' }),
            })
            map.addLayer({
              id: 'journey-tracks-planned',
              type: 'line',
              source: 'journey-tracks',
              filter: ['==', ['get', 'planned'], true],
              paint: { 'line-color': ['get', 'color'], 'line-width': 3.5, 'line-opacity': 0.95, 'line-dasharray': [2.2, 2] },
              layout: layout('plan', { 'line-cap': 'butt', 'line-join': 'round' }),
            })
          }
        }
      }

      // markers
      items.forEach((item) => {
        const el = markerHtml(item.dayColor, item.dayLabel, false, plannedRef.current.has(item.id))
        // Above the photo thumbnails, which stay at auto: the itinerary is the point of the map (#2453).
        el.style.zIndex = '1'
        if (!visibilityRef.current.entries) el.style.display = 'none'
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
      const known = marksRef.current ?? []
      marksFramedRef.current = known.length > 0
      known.forEach(mark => bounds.extend([mark.lng, mark.lat]))
      if (hasPoints || known.length > 0) {
        try {
          map.fitBounds(bounds, fitOptions(paddingBottom, enableMapbox3d && fullScreen))
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
  }, [entries, stableTrail, stableTracks, glProvider, glStyle, mapboxToken, enableMapbox3d, mapboxQuality, fullScreen, paddingBottom])

  // Photo layer (#2453), the GL twin of the Leaflet one: its own effect so photos
  // arriving do not rebuild the map, redrawn on every move because the clustering
  // is done in screen space. Same dependencies as the build effect above, so it
  // attaches to the map that effect just made.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const clear = () => {
      photoMarkersRef.current.forEach(m => m.remove())
      photoMarkersRef.current = []
    }
    const draw = () => {
      clear()
      if (!photos?.length) return
      for (const cluster of clusterPhotos(photos, (lat, lng) => map.project([lng, lat]))) {
        const el = document.createElement('div')
        el.style.cssText = 'position:relative;width:48px;height:48px;cursor:pointer'
        el.innerHTML = photoMarkerHtml(cluster.members[0].thumbUrl, cluster.members.length)
        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          onPhotoClickRef.current?.(cluster.members.map(m => m.id))
        })
        photoMarkersRef.current.push(new gl.Marker({ element: el, anchor: 'center' }).setLngLat([cluster.lng, cluster.lat]).addTo(map))
      }
    }
    if (map.loaded()) draw()
    else map.once('load', draw)
    map.on('moveend', draw)
    return () => {
      map.off('moveend', draw)
      map.off('load', draw)
      clear()
    }
    // gl is the injected engine and does not change for the life of a map.
  }, [photos, gl, entries, stableTrail, stableTracks, glProvider, glStyle, mapboxToken, enableMapbox3d, mapboxQuality, fullScreen, paddingBottom])

  // A switch shows or hides its layers where they are (JRN-04): the GL layers by
  // their visibility, the entry pins by their element.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    for (const kind of Object.keys(LAYER_IDS) as (keyof JourneyMapLayerVisibility)[]) {
      if (shownRef.current[kind] === layerVisibility[kind]) continue
      for (const id of LAYER_IDS[kind]) {
        try { map.setLayoutProperty(id, 'visibility', layerVisibility[kind] ? 'visible' : 'none') } catch { /* not drawn on this map */ }
      }
      if (kind === 'entries') {
        markersRef.current.forEach(m => { m.getElement().style.display = layerVisibility.entries ? '' : 'none' })
      }
    }
    shownRef.current = layerVisibility
  }, [layerVisibility])

  // The plan's check on an entry pin follows the plan layer in place.
  useEffect(() => {
    const before = iconPlannedRef.current
    if (before === plannedEntryIds) return
    for (const item of itemsRef.current) {
      if (before.has(item.id) !== plannedEntryIds.has(item.id)) setMarkerStyle(item.id, highlightedRef.current === item.id)
    }
    iconPlannedRef.current = plannedEntryIds
  }, [plannedEntryIds, setMarkerStyle])

  // The plan's places and the stays (JRN-04), the GL twin of the Leaflet layer:
  // regrouped on every move, between the photos and the entry pins.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const clear = () => {
      markMarkersRef.current.forEach(m => m.remove())
      markMarkersRef.current = []
    }
    const draw = () => {
      clear()
      if (!marks?.length) return
      if (!marksFramedRef.current) {
        marksFramedRef.current = true
        if (!readerMovedRef.current) {
          try {
            map.fitBounds(markBounds(gl, marks, entryPointsRef.current), fitOptions(paddingBottom, enableMapbox3d && fullScreen))
          } catch { /* empty bounds */ }
        }
      }
      for (const hit of clusterPoints(marks, (lat, lng) => map.project([lng, lat]), MARK_CLUSTER_PX)) {
        const look = markHitSvg(hit.members)
        const el = document.createElement('div')
        el.style.cssText = `width:${look.width}px;height:${look.height}px;cursor:pointer`
        el.innerHTML = look.html
        el.addEventListener('click', (ev) => {
          ev.stopPropagation()
          onMarksPickRef.current?.(hit.members)
        })
        markMarkersRef.current.push(new gl.Marker({ element: el, anchor: look.anchor }).setLngLat([hit.lng, hit.lat]).addTo(map))
      }
    }
    if (map.loaded()) draw()
    else map.once('load', draw)
    map.on('moveend', draw)
    return () => {
      map.off('moveend', draw)
      map.off('load', draw)
      clear()
    }
    // gl is the injected engine and does not change for the life of a map.
  }, [marks, gl, entries, stableTrail, stableTracks, glProvider, glStyle, mapboxToken, enableMapbox3d, mapboxQuality, fullScreen, paddingBottom])

  // Switching the UI language has to repin the basemap labels without tearing
  // the map down. The load handler covers the initial run.
  useEffect(() => {
    const map = mapRef.current
    if (!map || isMapLibre || !isStandardFamily(glStyle)) return
    try { map.setConfigProperty('basemap', 'language', basemapLanguage(mapLang)) } catch { /* style/SDK may not support it */ }
  }, [mapLang, isMapLibre, glStyle])

  // external activeMarkerId → highlight + flyTo
  useEffect(() => {
    if (!activeMarkerId || !mapRef.current) return
    const t = setTimeout(() => {
      highlightMarker(activeMarkerId)
      const marker = markersRef.current.get(activeMarkerId)
      if (!marker || !mapRef.current) return
      try {
        mapRef.current.easeTo({
          center: marker.getLngLat(),
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
}

export default JourneyMapGL
