import React, { useMemo } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from '../../i18n/TranslationContext'
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

/** Leaflet's half; the GL renderers draw their own in `RoadtripViaMarkersGL`. */
export default function RoadtripViaMarkers({
  viasByDay, onMoveVia, onRemoveVia,
}: RoadtripViaMarkersProps): React.ReactElement | null {
  const { t } = useTranslation()
  const vias = useMemo(() => Object.values(viasByDay).flat(), [viasByDay])
  if (!vias.length) return null

  return (
    <>
      {vias.map(via => (
        <Marker
          key={`via-${via.id}`}
          position={[via.lat, via.lng]}
          icon={VIA_ICON}
          draggable={!!onMoveVia}
          zIndexOffset={400}
          eventHandlers={{
            dragend: (e: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
              const at = e.target.getLatLng()
              onMoveVia?.(via.day_id, via.id, at.lat, at.lng)
            },
            // Right-click rather than a delete handle: a 12px dot has no room for one,
            // and the same gesture removes things elsewhere on the map.
            contextmenu: (e: { originalEvent: MouseEvent }) => {
              e.originalEvent.preventDefault()
              onRemoveVia?.(via.day_id, via.id)
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={1} className="map-tooltip">
            {t('roadtrip.via.hint')}
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}
