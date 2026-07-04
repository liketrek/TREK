import { Fragment, createElement, useEffect, useMemo, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { Plane, Train, Ship, Car, Bus, Sailboat, Bike, CarTaxiFront, Route, TramFront } from 'lucide-react'
import { escapeHtml } from '@trek/shared'
import { getTransitMapSegments, type TransitMapSegment } from './transitGeometry'
import { geodesicArcs } from './flightGeodesy'
import { useSettingsStore } from '../../store/settingsStore'
import type { Reservation, ReservationEndpoint } from '../../types'

const ENDPOINT_PANE = 'reservation-endpoints'
const AIRPORT_BADGE_HALF_PX = 16
const BADGE_GAP_PX = 5

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
  const svg = renderToStaticMarkup(createElement(IconCmp, { size: 13, color: 'white', strokeWidth: 2.5 }))
  const labelHtml = label ? `<span>${escapeHtml(label)}</span>` : ''
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
    "><span style="display:inline-flex;align-items:center;">${svg}</span>${labelHtml ? `<span style="display:inline-flex;align-items:center;line-height:1">${escapeHtml(label)}</span>` : ''}</div>`,
    iconSize: [estWidth, 22],
    iconAnchor: [estWidth / 2, 11],
    popupAnchor: [0, -11],
  })
}

function toRad(d: number) { return d * Math.PI / 180 }

function cleanName(name: string): string {
  return name.replace(/\s*\([^)]*\)/g, '').trim()
}

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
  primaryArc: [number, number][]
  fallback: [number, number]
  mainLabel: string | null
  subLabel: string | null
}

function buildStatsHtml(color: string, mainLabel: string | null, subLabel: string | null): { html: string; width: number; height: number } {
  const estWidth = Math.max(
    mainLabel ? mainLabel.length * 6.5 : 0,
    subLabel ? subLabel.length * 5.5 : 0,
  ) + 22
  const hasBoth = !!mainLabel && !!subLabel
  const height = hasBoth ? 36 : 22
  const main = mainLabel ? `<span style="font-size:12px;font-weight:700;line-height:1;display:block">${escapeHtml(mainLabel)}</span>` : ''
  const sub = subLabel ? `<span style="font-size:10px;font-weight:500;line-height:1;opacity:0.85;display:block${hasBoth ? ';margin-top:4px' : ''}">${escapeHtml(subLabel)}</span>` : ''
  const html = `<div class="trek-stats-inner" style="
    display:flex;flex-direction:column;align-items:center;justify-content:center;
    width:100%;height:100%;
    padding:0 11px;border-radius:999px;
    background:rgba(17,24,39,0.92);color:#fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.25);
    border:1px solid ${color}aa;
    font-family:var(--font-system);
    white-space:nowrap;box-sizing:border-box;
    transform-origin:center;
    will-change:transform;
  ">${main}${sub}</div>`
  return { html, width: estWidth, height }
}

function StatsLabel({ item }: { item: TransportItem }) {
  const map = useMap()
  const markerRef = useRef<L.Marker | null>(null)
  const innerRef = useRef<HTMLElement | null>(null)

  const arc = item.primaryArc
  const color = TYPE_META[item.type].color

  const { html, width, height } = useMemo(() => buildStatsHtml(color, item.mainLabel, item.subLabel), [color, item.mainLabel, item.subLabel])
  const buffer = AIRPORT_BADGE_HALF_PX + width / 2 + BADGE_GAP_PX

  const compute = () => {
    if (arc.length < 2) return null
    const size = map.getSize()
    const pts = arc.map(p => map.latLngToContainerPoint(p as L.LatLngTuple))
    const cum: number[] = [0]
    let total = 0
    for (let i = 1; i < pts.length; i++) {
      total += pts[i].distanceTo(pts[i - 1])
      cum.push(total)
    }
    if (total <= 0) return null

    const fromPx = map.latLngToContainerPoint([item.from.lat, item.from.lng])
    const toPx = map.latLngToContainerPoint([item.to.lat, item.to.lng])

    const isIn = (p: L.Point) => {
      if (p.x < -40 || p.x > size.x + 40 || p.y < -40 || p.y > size.y + 40) return false
      if (p.distanceTo(fromPx) < buffer) return false
      if (p.distanceTo(toPx) < buffer) return false
      return true
    }

    let firstIdx = -1
    let lastIdx = -1
    for (let i = 0; i < pts.length; i++) {
      if (isIn(pts[i])) {
        if (firstIdx < 0) firstIdx = i
        lastIdx = i
      }
    }
    if (firstIdx < 0) {
      const target = total / 2
      let sIdx = 0
      while (sIdx < cum.length - 2 && cum[sIdx + 1] < target) sIdx++
      const span = cum[sIdx + 1] - cum[sIdx]
      const tm = span > 0 ? (target - cum[sIdx]) / span : 0
      const pA = pts[sIdx]
      const pB = pts[sIdx + 1]
      const mx = pA.x + (pB.x - pA.x) * tm
      const my = pA.y + (pB.y - pA.y) * tm
      const latlng = map.containerPointToLatLng([mx, my])
      let angle = Math.atan2(pB.y - pA.y, pB.x - pA.x) * 180 / Math.PI
      if (angle > 90) angle -= 180
      if (angle < -90) angle += 180
      return { point: [latlng.lat, latlng.lng] as [number, number], angle }
    }

    const bisectFraction = (a: L.Point, b: L.Point) => {
      let lo = 0, hi = 1
      for (let k = 0; k < 10; k++) {
        const mid = (lo + hi) / 2
        const mp = L.point(a.x + (b.x - a.x) * mid, a.y + (b.y - a.y) * mid)
        if (isIn(mp)) hi = mid
        else lo = mid
      }
      return (lo + hi) / 2
    }

    let lowCum = cum[firstIdx]
    if (firstIdx > 0) {
      const t = bisectFraction(pts[firstIdx - 1], pts[firstIdx])
      lowCum = cum[firstIdx - 1] + (cum[firstIdx] - cum[firstIdx - 1]) * t
    }
    let highCum = cum[lastIdx]
    if (lastIdx < pts.length - 1) {
      const t = bisectFraction(pts[lastIdx + 1], pts[lastIdx])
      highCum = cum[lastIdx] + (cum[lastIdx + 1] - cum[lastIdx]) * (1 - t)
    }

    const targetLen = (lowCum + highCum) / 2

    let segIdx = 0
    while (segIdx < cum.length - 2 && cum[segIdx + 1] < targetLen) segIdx++
    const segSpan = cum[segIdx + 1] - cum[segIdx]
    const t = segSpan > 0 ? (targetLen - cum[segIdx]) / segSpan : 0
    const pA = pts[segIdx]
    const pB = pts[segIdx + 1]
    const px = pA.x + (pB.x - pA.x) * t
    const py = pA.y + (pB.y - pA.y) * t
    const latlng = map.containerPointToLatLng([px, py])

    let angle = Math.atan2(pB.y - pA.y, pB.x - pA.x) * 180 / Math.PI
    if (angle > 90) angle -= 180
    if (angle < -90) angle += 180

    return { point: [latlng.lat, latlng.lng] as [number, number], angle }
  }

  const apply = () => {
    const pose = compute()
    const marker = markerRef.current
    if (!marker) return
    const el = marker.getElement() as HTMLElement | null
    if (!pose) {
      if (el) el.style.display = 'none'
      return
    }
    if (el) el.style.display = ''
    marker.setLatLng(pose.point as L.LatLngTuple)
    if (!innerRef.current && el) innerRef.current = el.querySelector('.trek-stats-inner') as HTMLElement | null
    if (innerRef.current) innerRef.current.style.transform = `rotate(${pose.angle}deg)`
  }

  useEffect(() => {
    const icon = L.divIcon({
      className: 'trek-endpoint-stats',
      html,
      iconSize: [width, height],
      iconAnchor: [width / 2, height / 2],
    })
    const marker = L.marker([0, 0], { icon, pane: ENDPOINT_PANE, interactive: false, keyboard: false })
    marker.addTo(map)
    markerRef.current = marker
    innerRef.current = null
    apply()
    return () => {
      marker.remove()
      markerRef.current = null
      innerRef.current = null
    }
  }, [map, html, width, height])

  useMapEvents({
    move: apply,
    zoom: apply,
    viewreset: apply,
    resize: apply,
  })

  return null
}

interface Props {
  reservations: Reservation[]
  showConnections: boolean
  showStats: boolean
  onEndpointClick?: (reservationId: number) => void
  // Real road-network geometry for car/bus/taxi/bicycle bookings, keyed by
  // reservation id. When present it is drawn instead of the straight arc.
  roadRoutes?: Map<number, [number, number][]>
}

export default function ReservationOverlay({ reservations, showConnections, showStats, onEndpointClick, roadRoutes }: Props) {
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
      const primaryIdx = arcs.reduce((best, seg, idx, all) => seg.length > all[best].length ? idx : best, 0)
      const primaryArc = arcs[primaryIdx] ?? []
      const fallback: [number, number] = primaryArc.length > 0
        ? (primaryArc[Math.floor(primaryArc.length / 2)] ?? [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2])
        : [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2]

      const duration = computeDuration(from, to, r.reservation_time || null, r.reservation_end_time || null)
      const distance = `${Math.round(distanceKm)} km`
      // Show the full route (FRA → BER → HND) when every waypoint has a code.
      const mainLabel = waypoints.every(w => w.code)
        ? waypoints.map(w => w.code).join(' → ')
        : (from.code && to.code ? `${from.code} → ${to.code}` : null)
      const subParts = [duration, distance].filter(Boolean) as string[]
      const subLabel = subParts.length > 0 ? subParts.join(' · ') : null

      out.push({ res: r, from, to, waypoints, type, arcs, transitSegs: type === 'transit' ? getTransitMapSegments(r) : [], primaryArc, fallback, mainLabel, subLabel })
    }
    return out
  }, [reservations])

  const visibleItems = useMemo(() => {
    return items.filter(item => {
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
          icon={endpointIcon(item.type, showEndpointLabels && labelVisibleIds.has(item.res.id) ? (wp.code || cleanName(wp.name)) : null)}
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
