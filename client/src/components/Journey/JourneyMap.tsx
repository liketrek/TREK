import { useEffect, useRef, useImperativeHandle, useCallback, type CSSProperties, type Ref } from 'react'
import { clusterPhotos, photoMarkerHtml, type MapPhoto } from './journeyPhotoLayer'
import L from 'leaflet'
import { useSettingsStore } from '../../store/settingsStore'
import { useCartoApiKey } from '../../hooks/useTileUrl'
import { isGcj02Basemap, isVectorStyle, resolveTileUrl } from '../../utils/tileUrl'
import { OFM_DARK, OFM_POSITRON, attributionForTile } from '../../constants/mapDefaults'
import { attachVectorBasemap, detachBasemapLayer, restyleBasemap, type BasemapLayer } from '../Map/VectorBasemap'
import { crsForBasemap } from '../Map/gcj02Crs'
import { escapeHtml, type JourneyTrack } from '@trek/shared'
import { ensureJourneyPopupStyle, formatMarkerDate, journeyPopupHtml } from './journeyMapPopup'
import { PLANNED_BADGE_SVG, type JourneyMapMark } from './journeyMapMarks'
import { isPlannedTrack, type JourneyMapLayerVisibility } from './journeyMapLayers'
import { NOTHING_DRAWN, drawLeafletMarks, switchLeafletLayers, type DrawnLayers, type LeafletLayerKind } from './journeyLeafletLayers'

export interface MapMarkerItem {
  id: string
  lat: number
  lng: number
  label: string
  locationName: string
  mood?: string | null
  time: string
  dayColor: string
  dayLabel: number
  photoUrls: string[]
}


export interface JourneyMapHandle {
  highlightMarker: (id: string | null) => void
  focusMarker: (id: string) => void
  invalidateSize: () => void
}

export type { MapPhoto } from './journeyPhotoLayer'

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
  ref?: Ref<JourneyMapHandle>
  checkins: any[]
  entries: MapEntry[]
  /** Photos placed by their own capture coordinates, clustered by proximity. */
  photos?: MapPhoto[]
  onPhotoClick?: (photoIds: string[]) => void
  trail?: { lat: number; lng: number }[]
  /** Routed GPX geometries from the journey's trips (#1260). */
  tracks?: JourneyTrack[]
  height?: number
  dark?: boolean
  activeMarkerId?: string | null
  onMarkerClick?: (id: string, type?: string) => void
  fullScreen?: boolean
  /**
   * Leave the marker labels off.
   *
   * On the phone the map sits above a carousel whose active card already carries
   * the entry's name, and a tooltip on touch is a tap-to-open box rather than a
   * hover hint — so it says the same thing twice and covers the map to do it
   * (discussion #2299). On desktop the label is the only name a marker has, so
   * this stays off there.
   */
  hideMarkerTooltip?: boolean
  paddingBottom?: number
  /** CARTO key from the share payload: the public journey has no settings store to read. */
  cartoApiKey?: string
  /**
   * Which drawn layers the reader shows (JRN-04). A hidden one is taken off the
   * map and put back as it was, never rebuilt, so the view stays where it is.
   */
  layerVisibility?: JourneyMapLayerVisibility
  /** The plan's places and the stays of day reports, clustered where they meet. */
  marks?: JourneyMapMark[]
  onMarksPick?: (marks: JourneyMapMark[]) => void
  /** Entry pins whose place the plan had too, marked with a check. */
  plannedEntryIds?: ReadonlySet<string>
}

/** The map's own zoom buttons, frosted so they hold on any tile. */
const zoomButtonStyle = (dark?: boolean): CSSProperties => ({
  width: 32, height: 32, borderRadius: 8,
  background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.9)',
  backdropFilter: 'blur(8px)',
  border: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
  color: dark ? '#fff' : '#18181B',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', fontSize: 'calc(16px * var(--fs-scale-subtitle, 1))', fontWeight: 700, lineHeight: 1,
})

const EVERY_LAYER: JourneyMapLayerVisibility = { plan: true, recorded: true, entries: true }
const NO_PLANNED: ReadonlySet<string> = new Set()

function buildMarkerItems(entries: MapEntry[]): MapMarkerItem[] {
  const items: MapMarkerItem[] = []
  for (const e of entries) {
    if (e.lat && e.lng) {
      items.push({
        id: e.id,
        lat: e.lat,
        lng: e.lng,
        label: e.title || 'Entry',
        locationName: e.location_name || '',
        mood: e.mood,
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

const MARKER_W = 28
const MARKER_H = 36

function markerSvg(dayColor: string, dayLabel: number, highlighted: boolean, planned = false): string {
  const stroke = highlighted ? '#fff' : 'rgba(255,255,255,0.5)'
  const shadow = highlighted
    ? 'filter:drop-shadow(0 0 10px rgba(0,0,0,0.4)) drop-shadow(0 2px 6px rgba(0,0,0,0.4))'
    : 'filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25))'
  const label = String(dayLabel)
  const scale = highlighted ? 1.2 : 1

  return `<div style="transform:scale(${scale});transition:transform 0.2s ease;${shadow};transform-origin:bottom center">
    <svg width="${MARKER_W}" height="${MARKER_H}" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 34C14 34 26 22.36 26 13C26 6.37 20.63 1 14 1C7.37 1 2 6.37 2 13C2 22.36 14 34 14 34Z" fill="${dayColor}" stroke="${stroke}" stroke-width="1.5"/>
      <circle cx="14" cy="13" r="8" fill="${dayColor}"/>
      <text x="14" y="13" text-anchor="middle" dominant-baseline="central" fill="#fff" font-family="'Poppins',system-ui,sans-serif" font-size="11" font-weight="700">${label}</text>
      ${planned ? PLANNED_BADGE_SVG : ''}
    </svg>
  </div>`
}

function entryIcon(item: MapMarkerItem, highlighted: boolean, planned: boolean): L.DivIcon {
  return L.divIcon({
    className: '',
    iconSize: [MARKER_W, MARKER_H],
    iconAnchor: [MARKER_W / 2, MARKER_H],
    html: markerSvg(item.dayColor, item.dayLabel, highlighted, planned),
  })
}

function paintEntryMarker(
  marker: L.Marker | undefined, item: MapMarkerItem | undefined, highlighted: boolean, planned: ReadonlySet<string>,
): void {
  if (!marker || !item) return
  marker.setIcon(entryIcon(item, highlighted, planned.has(item.id)))
  marker.setZIndexOffset(highlighted ? 1000 : 0)
}

/**
 * Pan, don't zoom: the initial fitBounds decides how far out the reader starts,
 * and a focus keeps that (discussion #2299).
 *
 * Deferred until the map has its first view. That view is set on a rAF after
 * the build, and the active entry asks for its pan on a 50 ms timer, so a tab
 * in the background or a slow frame lets the pan come first. Leaflet does not
 * refuse a pan on a viewless map, it takes it as the first view, with the zoom
 * still undefined: the tile layer aborts its own add on that, the load event
 * stops halfway, and every marker queued behind it never makes it onto the map.
 * The next rebuild then tears down markers that were never added and dies in
 * Leaflet's icon removal, which took the whole journey page with it after each
 * save. whenReady runs the pan at once on a map with a view and otherwise right
 * after the fit lands.
 */
function panToMarker(map: L.Map, marker: L.Marker): void {
  map.whenReady(() => {
    map.panTo(marker.getLatLng(), { animate: true, duration: 0.5 })
  })
}

const EMPTY_TRAIL: { lat: number; lng: number }[] = []
const EMPTY_TRACKS: JourneyTrack[] = []
/** Fallback when a track carries no colour of its own, matching the planner's default. */
const TRACK_FALLBACK_COLOR = '#4f46e5'
/** The dash of a planned track; wide enough not to pass for the faint line between entries. */
const PLANNED_DASH = '8 7'

function markCoords(marks: JourneyMapMark[] | undefined): L.LatLngTuple[] {
  return (marks ?? []).map(mark => [mark.lat, mark.lng] as L.LatLngTuple)
}

function fitOptions(paddingBottom: number | undefined): L.FitBoundsOptions {
  return { paddingTopLeft: [50, 50], paddingBottomRight: [50, paddingBottom || 50], maxZoom: 16 }
}

function JourneyMap(
  { entries, photos, onPhotoClick, trail, tracks, height = 220, dark, activeMarkerId, onMarkerClick, fullScreen, paddingBottom, cartoApiKey, hideMarkerTooltip, layerVisibility = EVERY_LAYER, marks, onMarksPick, plannedEntryIds = NO_PLANNED, ref }: Props,
) {
  // Read through a ref: the flag is fixed per surface, and putting it in the
  // marker effect's deps would rebuild every marker for nothing.
  const hideMarkerTooltipRef = useRef(hideMarkerTooltip)
  hideMarkerTooltipRef.current = hideMarkerTooltip
  const stableTrail = trail || EMPTY_TRAIL
  const stableTracks = tracks || EMPTY_TRACKS
  const mapTileUrl = useSettingsStore(s => s.settings.map_tile_url)
  const storedCartoKey = useCartoApiKey()
  const cartoKey = cartoApiKey || storedCartoKey
  const tileUrl = resolveTileUrl(mapTileUrl, dark ? OFM_DARK : OFM_POSITRON, cartoKey)
  // Amap's tiles are GCJ-02 (see gcj02Crs.ts), the same shift the planner map
  // applies. Leaflet fixes a map's CRS at construction, so this one value is
  // allowed to rebuild the map where a template change only retiles it.
  const isGcjBasemap = !isVectorStyle(tileUrl) && isGcj02Basemap(tileUrl)
  // Read through a ref by the map effect, retiled in place by its own effect below:
  // the CARTO key reaches the store after the first render, and rebuilding the map
  // for that raced with the markers and layers already on it (#2097).
  const tileUrlRef = useRef(tileUrl)
  tileUrlRef.current = tileUrl
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  // GL layer or the raster stand-in a browser without WebGL gets instead (#2288).
  const glLayerRef = useRef<BasemapLayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const itemsRef = useRef<MapMarkerItem[]>([])
  const highlightedRef = useRef<string | null>(null)
  const onMarkerClickRef = useRef(onMarkerClick)
  onMarkerClickRef.current = onMarkerClick
  const photoLayerRef = useRef<L.LayerGroup | null>(null)
  const onPhotoClickRef = useRef(onPhotoClick)
  onPhotoClickRef.current = onPhotoClick
  const markLayerRef = useRef<L.LayerGroup | null>(null)
  const onMarksPickRef = useRef(onMarksPick)
  const marksRef = useRef(marks)
  // The plan and the stays load after the entries, so the first view is framed
  // again once they arrive, around both, unless the reader has moved it by then.
  const entryCoordsRef = useRef<L.LatLngTuple[]>([])
  const marksFramedRef = useRef(false)
  const readerMovedRef = useRef(false)
  // What each switchable layer drew, and which of them are on the map right now.
  const drawnRef = useRef<DrawnLayers>(NOTHING_DRAWN())
  const shownRef = useRef<JourneyMapLayerVisibility>(layerVisibility)
  const visibilityRef = useRef(layerVisibility)
  const plannedRef = useRef(plannedEntryIds)
  const iconPlannedRef = useRef<ReadonlySet<string>>(plannedEntryIds)
  // Before the map effects below, so a rebuild draws with what the reader shows now.
  useEffect(() => {
    onMarksPickRef.current = onMarksPick
    marksRef.current = marks
    visibilityRef.current = layerVisibility
    plannedRef.current = plannedEntryIds
  })

  const highlightMarker = useCallback((id: string | null) => {
    const prev = highlightedRef.current
    highlightedRef.current = id
    const paint = (target: string, highlighted: boolean) => paintEntryMarker(
      markersRef.current.get(target), itemsRef.current.find(i => i.id === target), highlighted, plannedRef.current,
    )
    if (prev && prev !== id) paint(prev, false)
    if (id) paint(id, true)
  }, [])

  /**
   * Bring an entry's marker under the reader without changing how far out they are.
   *
   * This fires on every step through the timeline, and it used to force zoom 12.
   * Reading a journey from a country view therefore yanked the map to street level
   * on the first scroll and kept it there: every marker filled the screen, and the
   * one thing a map is for — where is this, relative to everything else — was gone
   * (discussion #2299). Panning keeps the frame the reader chose; the initial
   * fitBounds is what decides how close the journey starts out.
   */
  const focusMarker = useCallback((id: string) => {
    highlightMarker(id)
    const marker = markersRef.current.get(id)
    if (marker && mapRef.current) panToMarker(mapRef.current, marker)
  }, [])

  const invalidateSize = useCallback(() => {
    try { mapRef.current?.invalidateSize() } catch { /* map not yet initialized */ }
  }, [])

  useImperativeHandle(ref, () => ({ highlightMarker, focusMarker, invalidateSize }), [])

  useEffect(() => {
    if (!containerRef.current) return

    markersRef.current.clear()

    const crs = crsForBasemap(isGcjBasemap)
    const map = L.map(containerRef.current, {
      ...(crs ? { crs } : {}),
      zoomControl: false,
      // Added below with `prefix: false` so it collapses to the credit alone; see
      // the GL twin for why it is not a strip of text across the bottom.
      attributionControl: false,
      scrollWheelZoom: fullScreen ? true : false,
      dragging: true,
      touchZoom: true,
    })
    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map)
    mapRef.current = map
    // The vector basemap loads async; a map torn down before it lands must not get
    // one. Per build, not a shared ref: the next build would reset a shared flag and
    // hand the old map, already removed, the layer it was still waiting for.
    let cancelled = false
    marksFramedRef.current = false
    readerMovedRef.current = false
    const readerMoved = () => { readerMovedRef.current = true }
    map.on('dragstart', readerMoved)
    containerRef.current.addEventListener('wheel', readerMoved, { passive: true })

    // The basemap is a vector style unless the user brought their own raster
    // template, so which layer draws it is decided per template rather than once.
    if (isVectorStyle(tileUrlRef.current)) {
      void attachVectorBasemap(map, tileUrlRef.current, glLayerRef, () => cancelled)
    } else {
      const tiles = L.tileLayer(tileUrlRef.current, {
        maxZoom: 18,
        attribution: attributionForTile(tileUrlRef.current),
        referrerPolicy: 'strict-origin-when-cross-origin',
        // Leaflet defaults updateWhenIdle:true on mobile (waits for pan to settle
        // before loading tiles). On the journey mobile combined view we flyTo
        // constantly when switching cards, so tiles lag visibly — force eager
        // updates and keep a larger ring of off-screen tiles ready.
        updateWhenIdle: false,
        keepBuffer: 4,
      } as any)
      tiles.addTo(map)
      tileLayerRef.current = tiles
    }

    const items = buildMarkerItems(entries)
    itemsRef.current = items

    // Each switchable layer is drawn whatever its switch says and only put on
    // the map while it is shown, so switching it later needs no rebuild.
    const drawn = NOTHING_DRAWN()
    drawnRef.current = drawn
    shownRef.current = visibilityRef.current
    iconPlannedRef.current = plannedRef.current
    const place = <T extends L.Layer>(kind: LeafletLayerKind, layer: T): T => {
      drawn[kind].push(layer)
      if (visibilityRef.current[kind]) layer.addTo(map)
      return layer
    }

    const allCoords: L.LatLngTuple[] = []
    /**
     * Track geometry is kept OUT of the fit set (#2194) and used only when there
     * is nothing else to frame.
     *
     * A journey's opening viewport should show the journey — its entries and the
     * trail between them. Letting a recorded GPX into the bounds meant one drive
     * across a country zoomed the map out until the entries were specks, which
     * is what the reporter's screenshot shows. JourneyMapGL already fits on
     * entries + trail alone, so for every journey that has entries the two
     * renderers now agree where they used to differ.
     *
     * They still differ for a journey with tracks and nothing else: this one
     * frames the tracks, JourneyMapGL falls back to the world view. Framing the
     * only thing on the map is the better of the two, and converging the GL side
     * is a change to a renderer this issue is not about.
     */
    const trackCoords: L.LatLngTuple[] = []

    if (stableTrail.length > 1) {
      const coords = stableTrail.map(p => [p.lat, p.lng] as L.LatLngTuple)
      place('recorded', L.polyline(coords, {
        color: '#6366f1', weight: 3, opacity: 0.4,
        dashArray: '6 4', lineCap: 'round',
      }))
      coords.forEach(c => allCoords.push(c))
    }

    // Tracks, in their own colour over a white casing that keeps them legible on
    // satellite tiles, same as the planner map. What was recorded (a day the journey
    // keeps, the live Dawarich trail) is drawn solid; a trip's GPX track is the plan
    // and drawn dashed, so the two never read as the same thing (JRN-01).
    for (const track of stableTracks) {
      if (track.points.length < 2) continue
      const coords = track.points.map(([lat, lng]) => [lat, lng] as L.LatLngTuple)
      const color = track.color || TRACK_FALLBACK_COLOR
      const planned = isPlannedTrack(track)
      const kind: LeafletLayerKind = planned ? 'plan' : 'recorded'
      place(kind, L.polyline(coords, { color: '#ffffff', weight: 6, opacity: 0.75, lineCap: 'round', lineJoin: 'round' }))
      const line = L.polyline(coords, {
        color, weight: 3.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round',
        ...(planned ? { dashArray: PLANNED_DASH } : {}),
      })
      // Same tooltip the markers on this map use, rather than Leaflet's default box:
      // it follows the appearance tokens, so it lands right in dark mode and with
      // transparency switched off. Escaped because a string handed to bindTooltip
      // becomes innerHTML, and a track name is a place name off a shared trip.
      if (track.name) line.bindTooltip(escapeHtml(track.name), { sticky: true, direction: 'top', className: 'map-tooltip' })
      place(kind, line)
      coords.forEach(c => trackCoords.push(c))
    }

    // route trail: dashed line connecting entries in time order, same as JourneyMapGL
    if (items.length > 1) {
      const routeCoords = items.map(i => [i.lat, i.lng] as L.LatLngTuple)
      place('entries', L.polyline(routeCoords, {
        color: dark ? '#71717A' : '#A1A1AA',
        weight: 1.5,
        opacity: 0.5,
        dashArray: '4 6',
        lineCap: 'round', lineJoin: 'round',
      }))
    }

    // place markers
    items.forEach((item, i) => {
      const pos: L.LatLngTuple = [item.lat, item.lng]
      allCoords.push(pos)

      const marker = place('entries', L.marker(pos, { icon: entryIcon(item, false, plannedRef.current.has(item.id)) }))
      // The same card the GL renderer shows, from the same builder: which map
      // engine a reader happens to have selected should not change what a marker
      // tells them (discussion #2299). The builder escapes everything that came
      // from a person, which matters most here — this map is what the public
      // journey page renders.
      if (!hideMarkerTooltipRef.current) {
        ensureJourneyPopupStyle()
        marker.bindTooltip(
          journeyPopupHtml({
            title: item.label || item.locationName || 'Entry',
            place: item.label ? item.locationName : '',
            date: formatMarkerDate(item.time),
            photoUrls: item.photoUrls,
          }),
          {
            direction: 'top',
            offset: [0, -MARKER_H],
            className: 'map-tooltip trek-journey-tooltip',
          },
        )
      }

      marker.on('click', () => {
        onMarkerClickRef.current?.(item.id)
      })

      markersRef.current.set(item.id, marker)
    })

    // fit bounds
    requestAnimationFrame(() => {
      if (!mapRef.current) return
      try {
        map.invalidateSize()
        // Tracks only get a say when the journey has nothing located of its own —
        // a world view would be worse than framing the one thing on the map.
        entryCoordsRef.current = allCoords
        const pointCoords = [...allCoords, ...markCoords(marksRef.current)]
        const fitCoords = pointCoords.length > 0 ? pointCoords : trackCoords
        marksFramedRef.current = (marksRef.current?.length ?? 0) > 0
        if (fitCoords.length > 0) map.fitBounds(L.latLngBounds(fitCoords), fitOptions(paddingBottom))
        else map.setView([30, 0], 2)
      } catch {}
    })

    setTimeout(() => {
      if (mapRef.current) map.invalidateSize()
    }, 200)

    const container = containerRef.current
    return () => {
      cancelled = true
      container.removeEventListener('wheel', readerMoved)
      map.remove()
      mapRef.current = null
      tileLayerRef.current = null
      detachBasemapLayer(glLayerRef.current)
      glLayerRef.current = null
      markersRef.current.clear()
      drawnRef.current = NOTHING_DRAWN()
    }
  }, [entries, stableTrail, stableTracks, dark, fullScreen, paddingBottom, isGcjBasemap])

  // A switch puts its layer back on the map or takes it off, exactly as drawn.
  useEffect(() => {
    shownRef.current = switchLeafletLayers(mapRef.current, drawnRef.current, shownRef.current, layerVisibility)
  }, [layerVisibility])

  // The plan's check on an entry pin follows the plan layer without redrawing the map.
  useEffect(() => {
    const before = iconPlannedRef.current
    if (before === plannedEntryIds) return
    for (const item of itemsRef.current) {
      if (before.has(item.id) === plannedEntryIds.has(item.id)) continue
      markersRef.current.get(item.id)?.setIcon(entryIcon(item, highlightedRef.current === item.id, plannedEntryIds.has(item.id)))
    }
    iconPlannedRef.current = plannedEntryIds
  }, [plannedEntryIds])

  // Retile in place rather than through the effect above, which would drop every
  // marker and track it just drew. A vector basemap restyles instead, which also
  // avoids spending a WebGL context on every theme toggle.
  useEffect(() => {
    if (isVectorStyle(tileUrl)) restyleBasemap(glLayerRef.current, tileUrl)
    else tileLayerRef.current?.setUrl(tileUrl)
  }, [tileUrl])

  // Photo layer (#1614). Its own effect on purpose: photos arriving must not tear
  // down and rebuild the map the way the entry effect does. Redrawn on zoom and
  // pan because the clustering is done in screen space.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const draw = () => {
      photoLayerRef.current?.remove()
      photoLayerRef.current = null
      if (!photos?.length) return

      // The initial view (setView/fitBounds) is set on a deferred rAF in the
      // map-build effect above, so this can run before the map has a center/zoom
      // — latLngToContainerPoint throws in that window. Skip; the moveend/zoomend
      // listener below redraws once the deferred view lands.
      try {
        map.getCenter()
      } catch {
        return
      }

      const group = L.layerGroup()
      for (const cluster of clusterPhotos(photos, (lat, lng) => map.latLngToContainerPoint([lat, lng]))) {
        const marker = L.marker([cluster.lat, cluster.lng], {
          icon: L.divIcon({
            className: '',
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            html: photoMarkerHtml(cluster.members[0].thumbUrl, cluster.members.length),
          }),
          // Below the entry pins: the itinerary is the point of the map, the photos
          // are context.
          zIndexOffset: -500,
        })
        marker.on('click', () => onPhotoClickRef.current?.(cluster.members.map(m => m.id)))
        group.addLayer(marker)
      }
      group.addTo(map)
      photoLayerRef.current = group
    }

    draw()
    map.on('zoomend', draw)
    map.on('moveend', draw)
    return () => {
      map.off('zoomend', draw)
      map.off('moveend', draw)
      photoLayerRef.current?.remove()
      photoLayerRef.current = null
    }
  }, [photos, entries, stableTrail, stableTracks, dark, fullScreen, paddingBottom])

  // The plan's places and the stays of day reports (JRN-04), in their own layer
  // like the photos: below the entry pins and above the thumbnails, regrouped
  // on every move because marks are only joined where they would overlap.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const draw = () => {
      markLayerRef.current?.remove()
      markLayerRef.current = drawLeafletMarks(map, marks, members => onMarksPickRef.current?.(members))
    }

    const coords = markCoords(marks)
    if (!marksFramedRef.current && coords.length > 0) {
      marksFramedRef.current = true
      if (!readerMovedRef.current) map.fitBounds(L.latLngBounds([...entryCoordsRef.current, ...coords]), fitOptions(paddingBottom))
    }

    draw()
    map.on('zoomend', draw)
    map.on('moveend', draw)
    return () => {
      map.off('zoomend', draw)
      map.off('moveend', draw)
      markLayerRef.current?.remove()
      markLayerRef.current = null
    }
  }, [marks, entries, stableTrail, stableTracks, dark, fullScreen, paddingBottom])

  // react to activeMarkerId prop changes — runs after map is built
  useEffect(() => {
    if (!activeMarkerId || !mapRef.current) return
    // small delay to ensure markers are rendered after map build
    const timer = setTimeout(() => {
      highlightMarker(activeMarkerId)
      const marker = markersRef.current.get(activeMarkerId)
      if (!marker || !mapRef.current) return
      panToMarker(mapRef.current, marker)
    }, 50)
    return () => clearTimeout(timer)
  }, [activeMarkerId])

  const zoom = (closer: boolean) => {
    readerMovedRef.current = true
    if (closer) mapRef.current?.zoomIn()
    else mapRef.current?.zoomOut()
  }

  return (
    <div style={{ position: 'relative', height: height === 9999 ? '100%' : height, width: '100%', borderRadius: 'inherit', overflow: 'hidden' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%' }}
      />
      <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 400, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button type="button" onClick={() => zoom(true)} style={zoomButtonStyle(dark)}>+</button>
        <button type="button" onClick={() => zoom(false)} style={zoomButtonStyle(dark)}>−</button>
      </div>
    </div>
  )
}

export default JourneyMap
