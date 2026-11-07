import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type L from 'leaflet'
import type { RouteVia } from '../../types'
import { bindDayBoundaryDrag, type DayBoundaryControls } from './dayBoundaryDrag'
import { useLngFrame } from './lngFrameContext'
import { frameLng } from '../../utils/lngFrame'

export function NightPauseDrag({ marker, via, controls }: { marker: L.Marker | null; via: RouteVia; controls?: DayBoundaryControls }) {
  const map = useMap()
  // The route is drawn in the map's longitude frame (#2975), so its points are measured there too.
  const frame = useLngFrame()
  useEffect(() => {
    const el = marker?.getElement()
    if (!marker || !el || !controls) return
    return bindDayBoundaryDrag(el, via, controls, {
      project: (lat, lng) => {
        const point = map.latLngToContainerPoint([lat, frameLng(frame, lng)])
        const rect = map.getContainer().getBoundingClientRect()
        return { x: point.x + rect.left, y: point.y + rect.top }
      },
      setPosition: (lat, lng) => { marker.setLatLng([lat, frameLng(frame, lng)]) },
      lock: () => {
        const enabled = map.dragging.enabled()
        map.dragging.disable()
        return () => { if (enabled) map.dragging.enable() }
      },
    })
  }, [map, marker, via, controls, frame])
  return null
}
