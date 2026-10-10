import { Fragment, createElement, useMemo, useState } from 'react'
import { renderIconMarkup } from '../../utils/iconMarkup'
import { Marker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import { escapeHtml } from '@trek/shared'
import { getTransitMapSegments, type TransitMapSegment } from './transitGeometry'
import { cleanEndpointName } from './reservationName'
import { useSettingsStore } from '../../store/settingsStore'
import { hopIsVisible, labelFloorPx } from '../../utils/reservationRoutes'
import { TRANSPORT_COLOR, TRANSPORT_META, transportHop, type TransportHop, type TransportType } from './transportHops'
import type { Reservation } from '../../types'

const ENDPOINT_PANE = 'reservation-endpoints'

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
  const { icon: IconCmp } = TRANSPORT_META[type]
  const svg = renderIconMarkup(createElement(IconCmp, { size: 13, color: 'white', strokeWidth: 2.5 }))
  const labelHtml = label ? `<span style="display:inline-flex;align-items:center;line-height:1">${escapeHtml(label)}</span>` : ''
  const estWidth = label ? Math.max(40, label.length * 6 + 28) : 26
  return L.divIcon({
    className: 'trek-endpoint-marker',
    html: `<div style="
      display:inline-flex;align-items:center;justify-content:center;gap:4px;
      padding:0 8px;border-radius:999px;
      background:${TRANSPORT_COLOR};box-shadow:0 2px 6px rgba(0,0,0,0.25);
      border:1.5px solid #fff;color:#fff;
      font-family:var(--font-system);font-size:11px;font-weight:600;letter-spacing:0.3px;line-height:1;
      box-sizing:border-box;height:22px;white-space:nowrap;
    "><span style="display:inline-flex;align-items:center;">${svg}</span>${labelHtml}</div>`,
    iconSize: [estWidth, 22],
    iconAnchor: [estWidth / 2, 11],
    popupAnchor: [0, -11],
  })
}

/** What a hop will draw: the road it was routed along when there is one, else its arcs. */
function linesFor(item: TransportItem, roadRoutes: Map<number, [number, number][]> | undefined): [number, number][][] {
  const road = roadRoutes?.get(item.res.id)
  return road && road.length >= 2 ? [road] : item.arcs
}

interface TransportItem extends TransportHop {
  transitSegs: TransitMapSegment[]
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
      const hop = transportHop(r, true)
      if (!hop) continue
      out.push({ ...hop, transitSegs: hop.type === 'transit' ? getTransitMapSegments(r) : [] })
    }
    return out
  }, [reservations])

  const visibleItems = useMemo(() => {
    const project = (p: readonly [number, number]) => map.latLngToContainerPoint([p[0], p[1]])
    return items.filter(item => {
      // A transit journey draws its real rail/bus alignment, not a straight from->to
      // line, so the endpoint-proximity declutter (which exists to hide tiny no-op
      // straight connectors) must not suppress it. Otherwise a zoomed-out day — e.g. one
      // with no other places to tighten the map onto — hides the whole route (#1570).
      if (item.transitSegs.length > 0) return true
      // Measured along what is drawn, not between the ends: a routed drive can
      // cover half the screen while its endpoints sit close together (#2275).
      return hopIsVisible(item.type, linesFor(item, roadRoutes), project)
    })
  }, [items, zoom, map, roadRoutes])

  const labelVisibleIds = useMemo(() => {
    const set = new Set<number>()
    for (const item of visibleItems) {
      const fromPx = map.latLngToContainerPoint([item.from.lat, item.from.lng])
      const toPx = map.latLngToContainerPoint([item.to.lat, item.to.lng])
      if (fromPx.distanceTo(toPx) >= labelFloorPx(item.type)) set.add(item.res.id)
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
                  : { color: seg.color || TRANSPORT_COLOR, weight: 3.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
              />
            </Fragment>
          ))
        }
        // Prefer the real road route (car/bus/taxi/bicycle) over the straight arc.
        return linesFor(item, roadRoutes).map((seg, segIdx) => (
          <Polyline
            key={`line-${item.res.id}-${segIdx}`}
            positions={seg}
            pathOptions={{
              color: TRANSPORT_COLOR,
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
