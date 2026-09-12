import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import type L from 'leaflet'
import type { RouteVia } from '../../types'
import { bindDayBoundaryDrag, type DayBoundaryControls } from './dayBoundaryDrag'

export function NightPauseDrag({ marker, via, controls }: { marker: L.Marker | null; via: RouteVia; controls?: DayBoundaryControls }) {
  const map = useMap()
  useEffect(() => {
    const el = marker?.getElement()
    if (!marker || !el || !controls) return
    return bindDayBoundaryDrag(el, via, controls, {
      project: (lat, lng) => {
        const point = map.latLngToContainerPoint([lat, lng])
        const rect = map.getContainer().getBoundingClientRect()
        return { x: point.x + rect.left, y: point.y + rect.top }
      },
      setPosition: (lat, lng) => { marker.setLatLng([lat, lng]) },
      lock: () => {
        const enabled = map.dragging.enabled()
        map.dragging.disable()
        return () => { if (enabled) map.dragging.enable() }
      },
    })
  }, [map, marker, via, controls])
  return null
}
