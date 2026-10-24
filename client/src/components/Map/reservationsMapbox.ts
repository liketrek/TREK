// Mapbox GL counterpart to ReservationOverlay.tsx.
//
// react-leaflet is component-driven, mapbox-gl is imperative — so instead of
// a React component, this exports a small manager class the MapViewGL wires
// up next to its other sources/layers. The geometry logic (great-circle arcs,
// duration math) lives in transportHops, shared with the Leaflet overlay, so
// both renderers produce the same visual result on the globe or a flat projection.

import { createElement } from 'react'
import { renderIconMarkup } from '../../utils/iconMarkup'
import type mapboxgl from 'mapbox-gl'
import { getTransitMapSegments } from './transitGeometry'
import { cleanEndpointName } from './reservationName'
import { hopIsVisible, labelFloorPx } from '../../utils/reservationRoutes'
import { escapeHtml } from '@trek/shared'
import { TRANSPORT_COLOR, TRANSPORT_META, transportHop, type TransportHop, type TransportType } from './transportHops'
import type { Reservation } from '../../types'

export const RESERVATION_SOURCE_ID = 'trek-reservations'
export const RESERVATION_LINE_LAYER_ID = 'trek-reservations-lines'
/** Sits under the coloured transit lines; named here so teardown can find it. */
export const TRANSIT_CASING_LAYER_ID = `${RESERVATION_LINE_LAYER_ID}-transit-casing`

// What each booking draws comes from transportHops. GL maps repeat features
// across world copies themselves, so arcs are not wrapped at the antimeridian.
function buildItems(reservations: Reservation[]): TransportHop[] {
  const out: TransportHop[] = []
  for (const r of reservations) {
    const hop = transportHop(r, false)
    if (hop) out.push(hop)
  }
  return out
}

// ── DOM helpers for HTML markers ──────────────────────────────────────────
function endpointMarkerHtml(type: TransportType, label: string | null): string {
  const { icon: IconCmp } = TRANSPORT_META[type]
  const svg = renderIconMarkup(createElement(IconCmp, { size: 13, color: 'white', strokeWidth: 2.5 }))
  const labelHtml = label ? `<span style="display:inline-flex;align-items:center;line-height:1">${escapeHtml(label)}</span>` : ''
  return `<div style="
    display:inline-flex;align-items:center;justify-content:center;gap:4px;
    padding:0 8px;border-radius:999px;
    background:${TRANSPORT_COLOR};box-shadow:0 2px 6px rgba(0,0,0,0.25);
    border:1.5px solid #fff;color:#fff;
    font-family:var(--font-system);font-size:11px;font-weight:600;letter-spacing:0.3px;line-height:1;
    box-sizing:border-box;height:22px;white-space:nowrap;cursor:pointer;
  "><span style="display:inline-flex;align-items:center;">${svg}</span>${labelHtml}</div>`
}

// ── overlay manager ──────────────────────────────────────────────────────
export interface ReservationOverlayOptions {
  showConnections: boolean
  // Accepted for call-site compatibility only: the floating route/duration badge
  // on the arc is no longer drawn, so nothing is gated on this.
  showStats: boolean
  showEndpointLabels: boolean
  onEndpointClick?: (reservationId: number) => void
}

type GlMarker = {
  setLngLat: (lngLat: mapboxgl.LngLatLike) => GlMarker
  addTo: (map: mapboxgl.Map) => GlMarker
  remove: () => void
  getElement: () => HTMLElement
}

type MarkerConstructor = new (options?: { element?: HTMLElement; anchor?: string }) => GlMarker

export class ReservationMapboxOverlay {
  private map: mapboxgl.Map
  private items: TransportHop[] = []
  private roadRoutes: Map<number, [number, number][]> = new Map()
  private opts: ReservationOverlayOptions
  private MarkerCtor: MarkerConstructor
  private endpointMarkers: GlMarker[] = []
  private rerender: () => void
  private destroyed = false

  constructor(map: mapboxgl.Map, opts: ReservationOverlayOptions, MarkerCtor: MarkerConstructor) {
    this.map = map
    this.opts = opts
    this.MarkerCtor = MarkerCtor
    this.rerender = () => { if (!this.destroyed) this.render() }
    this.setupLayer()
    map.on('zoomend', this.rerender)
    map.on('moveend', this.rerender)
  }

  update(reservations: Reservation[], opts: ReservationOverlayOptions, roadRoutes?: Map<number, [number, number][]>) {
    this.opts = opts
    this.items = buildItems(reservations)
    this.roadRoutes = roadRoutes ?? new Map()
    this.render()
  }

  destroy() {
    this.destroyed = true
    this.map.off('zoomend', this.rerender)
    this.map.off('moveend', this.rerender)
    this.endpointMarkers.forEach(m => m.remove())
    this.endpointMarkers = []
    try {
      // Every layer before the source: the engine refuses to drop a source while
      // anything still references it, and it reports that by firing an error event
      // rather than throwing — so the catch below never saw it and the source was
      // left behind. The casing layer arrived with the transit paths and was missed
      // here, which is what made the console complain on every map teardown.
      for (const id of [TRANSIT_CASING_LAYER_ID, RESERVATION_LINE_LAYER_ID]) {
        if (this.map.getLayer(id)) this.map.removeLayer(id)
      }
      if (this.map.getSource(RESERVATION_SOURCE_ID)) this.map.removeSource(RESERVATION_SOURCE_ID)
    } catch { /* map already gone */ }
  }

  private setupLayer() {
    const map = this.map
    if (map.getSource(RESERVATION_SOURCE_ID)) return
    map.addSource(RESERVATION_SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    // White casing under real transit paths so the colored lines read cleanly.
    map.addLayer({
      id: TRANSIT_CASING_LAYER_ID,
      type: 'line',
      source: RESERVATION_SOURCE_ID,
      filter: ['all', ['==', ['get', 'transitPath'], true], ['!=', ['get', 'walk'], true]] as any,
      paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.85 },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    })
    map.addLayer({
      id: RESERVATION_LINE_LAYER_ID,
      type: 'line',
      source: RESERVATION_SOURCE_ID,
      paint: {
        'line-color': ['coalesce', ['get', 'color'], TRANSPORT_COLOR] as any,
        'line-width': ['case', ['==', ['get', 'transitPath'], true], ['case', ['==', ['get', 'walk'], true], 3, 3.5], 2.5] as any,
        // Confirmed = solid + 0.75; pending = dashed + 0.55; walks always dotted.
        'line-opacity': ['case', ['==', ['get', 'transitPath'], true], 0.95, ['case', ['==', ['get', 'status'], 'confirmed'], 0.75, 0.55]] as any,
        'line-dasharray': ['case', ['==', ['get', 'walk'], true], ['literal', [0.1, 2.5]], ['case', ['==', ['get', 'status'], 'confirmed'], ['literal', [1, 0]], ['literal', [3, 3]]]] as any,
      },
      layout: { 'line-cap': 'round', 'line-join': 'round' },
    })
  }

  /** What a hop will draw: the road it was routed along when there is one, else its arcs. */
  private linesFor(item: TransportHop): [number, number][][] {
    const road = this.roadRoutes.get(item.res.id)
    return road && road.length >= 2 ? [road] : item.arcs
  }

  private render() {
    const map = this.map
    if (!this.map.getSource(RESERVATION_SOURCE_ID)) return

    const show = this.opts.showConnections

    // Visible filter: a hop draws once what it will draw is long enough on
    // screen to be worth it, same as the Leaflet overlay, so tiny no-op
    // transport lines don't clutter the map. Measured along the drawn line,
    // not between the ends: a routed drive can cover half the screen while
    // its endpoints sit close together (#2275).
    const project = (p: readonly [number, number]) => map.project([p[1], p[0]])
    const visibleItems = show ? this.items.filter(item => {
      try {
        // A transit journey draws its real alignment, not a straight from->to line, so
        // don't let the endpoint-proximity declutter hide it when the map is zoomed out
        // (#1570). Mirrors the Leaflet overlay.
        if (item.type === 'transit' && getTransitMapSegments(item.res).length > 0) return true
        return hopIsVisible(item.type, this.linesFor(item), project)
      } catch { return true }
    }) : []

    // Label visibility threshold is higher than line visibility, to keep
    // endpoint text from overlapping on very short lines.
    const labelVisibleIds = new Set<number>()
    if (show) {
      for (const item of visibleItems) {
        try {
          const fromPx = map.project([item.from.lng, item.from.lat])
          const toPx = map.project([item.to.lng, item.to.lat])
          const dx = fromPx.x - toPx.x, dy = fromPx.y - toPx.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist >= labelFloorPx(item.type)) labelVisibleIds.add(item.res.id)
        } catch { /* ignore */ }
      }
    }

    // ── line features ───────────────────────────────────────────────
    const features = visibleItems.flatMap(item => {
      const transitSegs = item.type === 'transit' ? getTransitMapSegments(item.res) : []
      if (transitSegs.length > 0) {
        return transitSegs.map(seg => ({
          type: 'Feature' as const,
          properties: {
            resId: item.res.id,
            type: item.type,
            status: item.res.status ?? 'pending',
            transitPath: true,
            walk: seg.walk,
            color: seg.walk ? '#64748b' : (seg.color || '#7c3aed'),
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: seg.coords.map(([lat, lng]) => [lng, lat]),
          },
        }))
      }
      // Prefer the real road route (car/bus/taxi/bicycle) over the straight arc.
      return this.linesFor(item).map(seg => ({
        type: 'Feature' as const,
        properties: {
          resId: item.res.id,
          type: item.type,
          status: item.res.status ?? 'pending',
          transitPath: false,
          walk: false,
          color: null as string | null,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: seg.map(([lat, lng]) => [lng, lat]),
        },
      }))
    })
    const src = map.getSource(RESERVATION_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined
    src?.setData({ type: 'FeatureCollection', features })

    // ── endpoint markers ────────────────────────────────────────────
    this.endpointMarkers.forEach(m => m.remove())
    this.endpointMarkers = []
    if (show) {
      for (const item of visibleItems) {
        const showLabel = this.opts.showEndpointLabels && labelVisibleIds.has(item.res.id)
        for (const ep of item.waypoints) {
          const label = showLabel ? (ep.code || cleanEndpointName(ep.name)) : null
          const el = document.createElement('div')
          el.innerHTML = endpointMarkerHtml(item.type, label)
          const inner = el.firstElementChild as HTMLElement | null
          const node = inner ?? el
          node.title = ep.name || ''
          if (this.opts.onEndpointClick) {
            node.addEventListener('click', (ev) => {
              ev.stopPropagation()
              this.opts.onEndpointClick?.(item.res.id)
            })
          }
          const marker = new this.MarkerCtor({ element: node, anchor: 'center' })
            .setLngLat([ep.lng, ep.lat])
            .addTo(map)
          this.endpointMarkers.push(marker)
        }
      }
    }

    // No stats badge: the floating route/duration label on the arc was removed,
    // so a rendered overlay is the connection lines plus the airport markers.
  }
}
