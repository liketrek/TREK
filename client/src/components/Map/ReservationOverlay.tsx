import { Fragment, createElement, useMemo, useState } from 'react'
import { renderIconMarkup } from '../../utils/iconMarkup'
import { Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Plane, Train, Ship, Car, Bus, Sailboat, Bike, CarTaxiFront, Route, TramFront } from 'lucide-react'
import { escapeHtml } from '@trek/shared'
import { getTransitMapSegments, type TransitMapSegment } from './transitGeometry'
import { geodesicArcs } from './flightGeodesy'
import { cleanEndpointName } from './reservationName'
import { useSettingsStore } from '../../store/settingsStore'
import type { Reservation, ReservationEndpoint } from '../../types'

const ENDPOINT_PANE = 'reservation-endpoints'

type TransportType = 'flight' | 'train' | 'cruise' | 'car' | 'bus' | 'taxi' | 'bicycle' | 'ferry' | 'transit' | 'transport_other'
const TRANSPORT_TYPES: TransportType[] = ['flight', 'train', 'cruise', 'car', 'bus', 'taxi', 'bicycle', 'ferry', 'transit', 'transport_other']

const TRANSPORT_COLOR = '#3b82f6'

const TYPE_META: Record<TransportType, { color: string; icon: typeof Plane; geodesic: boolean }> = {
  flight: { color: TRANSPORT_COLOR, icon: Plane, geodesic: true },
  train: { color: TRANSPORT_COLOR, icon: Train, geodesic: false },
  cruise: { color: TRANSPORT_COLOR, icon: Ship, geodesic: true },
  car: { color: TRANSPORT_COLOR, icon: Car, geodesic: false },
  bus: { color: TRANSPORT_COLOR, icon: Bus, geodesic: false },
  taxi: { color: TRANSPORT_COLOR, icon: CarTaxiFront, geodesic: false },
  bicycle: { color: TRANSPORT_COLOR, icon: Bike, geodesic: false },
  ferry: { color: TRANSPORT_COLOR, icon: Sailboat, geodesic: true },
  transit: { color: TRANSPORT_COLOR, icon: TramFront, geodesic: false },
  transport_other: { color: TRANSPORT_COLOR, icon: Route, geodesic: false },
}

function useEndpointPane() {
  const map = useMap()
  useMemo(() => {
    if (typeof map?.getPane !== 'function' || typeof map?.createPane !== 'function') return
    if (!map.getPane(ENDPOINT_PANE)) {
      const pane = map.createPane(ENDPOINT_PANE)
      pane.style.zIndex = '650'
      pane.style.pointerEvents = 'auto'
    }
  }, [map])
}

function endpointIcon(type: TransportType, label: string | null): L.DivIcon {
  const { icon: IconCmp, color } = TYPE_META[type]
  const svg = renderIconMarkup(createElement(IconCmp, { size: 13, color: 'white', strokeWidth: 2.5 }))
  const labelHtml = label ? `<span style="display:inline-flex;align-items:center;line-height:1">${escapeHtml(label)}</span>` : ''
  const estWidth = label ? Math.max(40, label.length * 6 + 28) : 26
  return L.divIcon({
    className: 'trek-endpoint-marker',
    html: `<div style="
      display:inline-flex;align-items:center;justify-content:center;gap:4px;
      padding:0 8px;border-radius:999px;
      background:${color};box-shadow:0 2px 6px rgba(0,0,0,0.25);
      border:1.5px solid #fff;color:#fff;
      font-family:var(--font-system);font-size:11px;font-weight:600;letter-spacing:0.3px;line-height:1;
      box-sizing:border-box;height:22px;white-space:nowrap;
    "><span style="display:inline-flex;align-items:center;">${svg}</span>${labelHtml}</div>`,
    iconSize: [estWidth, 22],
    iconAnchor: [estWidth / 2, 11],
    popupAnchor: [0, -11],
  })
}

function toRad(d: number) { return d * Math.PI / 180 }

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

function parseInTz(isoLocal: string, tz: string): number {
  const [datePart, timePart] = isoLocal.split('T')
  const [y, mo, d] = datePart.split('-').map(Number)
  const [h, mi] = (timePart || '00:00').split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  // A malformed date/time (e.g. an imported booking whose time is missing its
  // minutes) makes Date.UTC NaN; bail before formatToParts, which throws on a
  // non-finite date and would blank the whole trip. computeDuration's finiteness
  // check then drops the duration cleanly.
  if (!Number.isFinite(guess)) return Number.NaN
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = Object.fromEntries(fmt.formatToParts(new Date(guess)).filter(p => p.type !== 'literal').map(p => [p.type, p.value]))
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour) % 24, Number(parts.minute), Number(parts.second))
  return guess - (asUtc - guess)
}

function computeDuration(from: ReservationEndpoint, to: ReservationEndpoint, fallbackStart: string | null, fallbackEnd: string | null): string | null {
  let start = from.local_date && from.local_time ? `${from.local_date}T${from.local_time}` : fallbackStart
  let end = to.local_date && to.local_time ? `${to.local_date}T${to.local_time}` : fallbackEnd
  if (!start || !end) return null

  if (!start.includes('T') && end.includes('T')) start = `${end.split('T')[0]}T${start}`
  if (!end.includes('T') && start.includes('T')) end = `${start.split('T')[0]}T${end}`
  if (!start.includes('T') || !end.includes('T')) return null

  const fromTz = from.timezone || to.timezone
  const toTz = to.timezone || fromTz

  let startMs: number, endMs: number
  if (fromTz && toTz) {
    startMs = parseInTz(start, fromTz)
    endMs = parseInTz(end, toTz)
  } else {
    startMs = new Date(start).getTime()
    endMs = new Date(end).getTime()
  }
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null
  if (endMs <= startMs) endMs += 24 * 60 * 60000
  const minutes = Math.round((endMs - startMs) / 60000)
  if (minutes <= 0 || minutes > 48 * 60) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

interface TransportItem {
  res: Reservation
  from: ReservationEndpoint
  to: ReservationEndpoint
  waypoints: ReservationEndpoint[]
  type: TransportType
  arcs: [number, number][][]
  transitSegs: TransitMapSegment[]
  // Route ("VIE → LHR") and duration/distance line. Computed on every update but
  // not drawn since the stats badge was dropped; computeDuration still guards the
  // non-finite date that used to blank the trip (#1620).
  mainLabel: string | null
  subLabel: string | null
}

interface Props {
  reservations: Reservation[]
  showConnections: boolean
  // Accepted for call-site compatibility only: the floating route/duration badge
  // on the arc is no longer drawn, so nothing is gated on this.
  showStats: boolean
  onEndpointClick?: (reservationId: number) => void
  // Real road-network geometry for car/bus/taxi/bicycle bookings, keyed by
  // reservation id. When present it is drawn instead of the straight arc.
  roadRoutes?: Map<number, [number, number][]>
}

export default function ReservationOverlay({ reservations, showConnections, onEndpointClick, roadRoutes }: Props) {
  useEndpointPane()
  const map = useMap()
  const [zoom, setZoom] = useState(() => map.getZoom())
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  })
  const showEndpointLabels = useSettingsStore(s => s.settings.map_booking_labels) === true

  const items = useMemo<TransportItem[]>(() => {
    const out: TransportItem[] = []
    for (const r of reservations) {
      if (!TRANSPORT_TYPES.includes(r.type as TransportType)) continue
      // Ordered waypoints (from · stops · to). A single-leg booking has exactly two,
      // so the arc + markers below are byte-identical to before for it.
      const waypoints = (r.endpoints || [])
        .filter(e => e.role === 'from' || e.role === 'to' || e.role === 'stop')
        .slice()
        .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      if (waypoints.length < 2) continue
      const from = waypoints[0]
      const to = waypoints[waypoints.length - 1]
      const type = r.type as TransportType
      const isGeo = TYPE_META[type].geodesic
      // One arc per leg (between consecutive waypoints), concatenated.
      const arcs: [number, number][][] = []
      let distanceKm = 0
      for (let i = 0; i < waypoints.length - 1; i++) {
        const a = waypoints[i]
        const b = waypoints[i + 1]
        const segArcs = isGeo
          ? geodesicArcs([a.lat, a.lng], [b.lat, b.lng], true)
          : [[[a.lat, a.lng], [b.lat, b.lng]] as [number, number][]]
        arcs.push(...segArcs)
        distanceKm += haversineKm([a.lat, a.lng], [b.lat, b.lng])
      }
      const duration = computeDuration(from, to, r.reservation_time || null, r.reservation_end_time || null)
      const distance = `${Math.round(distanceKm)} km`
      // Show the full route (FRA → BER → HND) when every waypoint has a code.
      const mainLabel = waypoints.every(w => w.code)
        ? waypoints.map(w => w.code).join(' → ')
        : (from.code && to.code ? `${from.code} → ${to.code}` : null)
      const subParts = [duration, distance].filter(Boolean) as string[]
      const subLabel = subParts.length > 0 ? subParts.join(' · ') : null

      out.push({ res: r, from, to, waypoints, type, arcs, transitSegs: type === 'transit' ? getTransitMapSegments(r) : [], mainLabel, subLabel })
    }
    return out
  }, [reservations])

  const visibleItems = useMemo(() => {
    return items.filter(item => {
      // A transit journey draws its real rail/bus alignment, not a straight from->to
      // line, so the endpoint-proximity declutter (which exists to hide tiny no-op
      // straight connectors) must not suppress it. Otherwise a zoomed-out day — e.g. one
      // with no other places to tighten the map onto — hides the whole route (#1570).
      if (item.transitSegs.length > 0) return true
      const fromPx = map.latLngToContainerPoint([item.from.lat, item.from.lng])
      const toPx = map.latLngToContainerPoint([item.to.lat, item.to.lng])
      const minPx = item.type === 'flight' ? 50 : item.type === 'cruise' ? 150 : item.type === 'car' ? 80 : 200
      return fromPx.distanceTo(toPx) >= minPx
    })
  }, [items, zoom, map])

  const labelVisibleIds = useMemo(() => {
    const set = new Set<number>()
    for (const item of visibleItems) {
      const fromPx = map.latLngToContainerPoint([item.from.lat, item.from.lng])
      const toPx = map.latLngToContainerPoint([item.to.lat, item.to.lng])
      const minPx = item.type === 'flight' ? 50 : item.type === 'cruise' ? 300 : item.type === 'car' ? 150 : item.type === 'transit' ? 900 : 400
      if (fromPx.distanceTo(toPx) >= minPx) set.add(item.res.id)
    }
    return set
  }, [visibleItems, zoom, map])

  if (!showConnections) return null

  return (
    <>
      {visibleItems.map(item => {
        if (item.transitSegs.length > 0) {
          return item.transitSegs.map((seg, segIdx) => (
            <Fragment key={`transit-${item.res.id}-${segIdx}`}>
              {!seg.walk && (
                <Polyline
                  positions={seg.coords}
                  pathOptions={{ color: '#ffffff', weight: 6, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }}
                />
              )}
              <Polyline
                positions={seg.coords}
                pathOptions={seg.walk
                  ? { color: '#64748b', weight: 3, opacity: 0.8, dashArray: '1, 7', lineCap: 'round' }
                  : { color: seg.color || TYPE_META.transit.color, weight: 3.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
              />
            </Fragment>
          ))
        }
        // Prefer the real road route (car/bus/taxi/bicycle) over the straight arc.
        const road = roadRoutes?.get(item.res.id)
        const lines = road && road.length >= 2 ? [road] : item.arcs
        return lines.map((seg, segIdx) => (
          <Polyline
            key={`line-${item.res.id}-${segIdx}`}
            positions={seg}
            pathOptions={{
              color: TYPE_META[item.type].color,
              weight: 2.5,
              opacity: item.res.status === 'confirmed' ? 0.75 : 0.55,
              dashArray: item.res.status === 'confirmed' ? undefined : '6, 6',
            }}
          />
        ))
      })}

      {visibleItems.flatMap(item => item.waypoints.map((wp, wi) => (
        <Marker
          key={`wp-${item.res.id}-${wi}`}
          position={[wp.lat, wp.lng]}
          icon={endpointIcon(item.type, showEndpointLabels && labelVisibleIds.has(item.res.id) ? (wp.code || cleanEndpointName(wp.name)) : null)}
          pane={ENDPOINT_PANE}
          zIndexOffset={1000}
          eventHandlers={{ click: () => onEndpointClick?.(item.res.id) }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={1} className="map-tooltip">
            <div style={{ fontWeight: 600, fontSize: 12 }}>{wp.name}</div>
            {item.res.title && <div className="text-content-muted" style={{ fontSize: 11 }}>{item.res.title}</div>}
          </Tooltip>
        </Marker>
      )))}
    </>
  )
}
