import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from '../../i18n/TranslationContext'
import { useStableVias } from './viaMarkerState'
import type { RoadtripVia } from '@trek/shared'

/**
 * The handles that shape a drive.
 *
 * A via is deliberately small and unnumbered: it is not a stop, and anything that looks
 * like one would read as a place on the itinerary. Dragging it redraws the route through
 * the new spot, which is the whole interaction — the same one a paper map gets when you
 * put a finger on the road you actually want to take.
 */
const VIA_ICON = L.divIcon({
  className: '',
  html: `<span style="
    display:block;width:12px;height:12px;border-radius:9999px;
    background:#0a84ff;border:2.5px solid #ffffff;
    box-shadow:0 1px 4px rgba(0,0,0,.45);cursor:grab;
  "></span>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

interface RoadtripViaMarkersProps {
  viasByDay: Record<number, RoadtripVia[]>
  onMoveVia?: (dayId: number, id: number, lat: number, lng: number) => void
  onRemoveVia?: (dayId: number, id: number) => void
}

/** Leaflet's half; the GL renderers draw their own inside `MapViewGL`. */
/** Below this the handles are not drawn. Shared with the GL renderer's own copy. */
const VIA_MIN_ZOOM = 9

export default function RoadtripViaMarkers({
  viasByDay, onMoveVia, onRemoveVia,
}: RoadtripViaMarkersProps): React.ReactElement | null {
  const { t } = useTranslation()
  const vias = useStableVias(viasByDay)
  // Read through a ref so the handlers below can stay the same objects across renders.
  // Both callbacks are rebuilt on every render of the planner, and react-leaflet compares
  // its props by identity: a fresh `eventHandlers` unbinds and rebinds every listener,
  // and a fresh `position` array calls `setLatLng` on every marker. Doing either while a
  // drag is in flight is how a freshly placed via lost its first drag.
  const handlersRef = useRef({ onMoveVia, onRemoveVia })
  handlersRef.current = { onMoveVia, onRemoveVia }
  const draggable = !!onMoveVia
  /**
   * Zoomed out, the handles go away.
   *
   * A via is a handle for a few hundred metres of road, and at a continental zoom a whole
   * day's worth collapses into a cluster of dots over one town — not something anybody can
   * aim at, and a drag there moves the route by kilometres per pixel. Below this the drive
   * is read, not shaped.
   */
  const map = useMap()
  const [zoomedIn, setZoomedIn] = useState(() => map.getZoom() >= VIA_MIN_ZOOM)
  useEffect(() => {
    const update = () => setZoomedIn(map.getZoom() >= VIA_MIN_ZOOM)
    update()
    map.on('zoomend', update)
    return () => { map.off('zoomend', update) }
  }, [map])

  const markers = useMemo(() => vias.map(via => ({
    via,
    position: [via.lat, via.lng] as [number, number],
    handlers: {
      dragend: (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
        const at = e.target.getLatLng()
        handlersRef.current.onMoveVia?.(via.day_id, via.id, at.lat, at.lng)
      },
      // Right-click rather than a delete handle: a 12px dot has no room for one,
      // and the same gesture removes things elsewhere on the map.
      contextmenu: (e: { originalEvent: MouseEvent }) => {
        e.originalEvent.preventDefault()
        handlersRef.current.onRemoveVia?.(via.day_id, via.id)
      },
    },
  })), [vias])

  if (!markers.length || !zoomedIn) return null

  return (
    <>
      {markers.map(({ via, position, handlers }) => (
        <Marker
          key={`via-${via.id}`}
          position={position}
          icon={VIA_ICON}
          draggable={draggable}
          zIndexOffset={400}
          eventHandlers={handlers}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={1} className="map-tooltip">
            {t('roadtrip.via.hint')}
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}
