import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from '../../i18n/TranslationContext'
import type { Poi } from './poiCategories'
import { clusterPois, poiClusterMarkup, poiClusterList, POI_CLUSTER_DETAIL_ZOOM } from './poiClusters'

export default function ClusteredPois({ pois, enabled, onPoiClick, children }: {
  pois: Poi[]; enabled: boolean; onPoiClick?: (poi: Poi) => void; children: ReactNode[]
}) {
  const map = useMap()
  const { t } = useTranslation()
  const [zoom, setZoom] = useState(() => map.getZoom())
  const popup = useRef<L.Popup | null>(null)
  useEffect(() => () => { popup.current?.remove() }, [pois, enabled, zoom])
  useEffect(() => {
    const update = () => setZoom(map.getZoom())
    map.on('zoomend', update)
    return () => { map.off('zoomend', update) }
  }, [map])
  const groups = useMemo(() => enabled ? clusterPois(pois, poi => map.latLngToContainerPoint([poi.lat, poi.lng]), zoom) : [], [pois, enabled, map, zoom])
  const markers = new Map(pois.map((poi, index) => [poi.osm_id, children[index]]))
  if (!enabled) return <>{children}</>
  return <>{groups.map(group => {
    if (group.pois.length === 1) return markers.get(group.pois[0].osm_id)
    const label = t('roadtrip.poi.found', { count: group.pois.length })
    return <Marker key={`poi-cluster-${group.pois[0].osm_id}`} position={[group.lat, group.lng]} alt={label}
      icon={L.divIcon({ className: '', html: poiClusterMarkup(group.pois.length), iconSize: [38, 38], iconAnchor: [19, 19] })}
      zIndexOffset={600} eventHandlers={{ click: () => {
        if (map.getZoom() >= POI_CLUSTER_DETAIL_ZOOM) {
          popup.current?.remove()
          popup.current = L.popup({ className: 'map-tooltip', maxWidth: 300 }).setLatLng([group.lat, group.lng])
            .setContent(poiClusterList(group.pois, poi => { popup.current?.remove(); onPoiClick?.(poi) })).openOn(map)
        } else map.fitBounds(group.pois.map(poi => [poi.lat, poi.lng] as [number, number]), { padding: [70, 70], maxZoom: POI_CLUSTER_DETAIL_ZOOM })
      } }} />
  })}</>
}
