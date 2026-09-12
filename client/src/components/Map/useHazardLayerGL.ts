import { useEffect } from 'react'
import type { Map, Popup, MapMouseEvent } from 'mapbox-gl'
import type { RoadtripHazard } from '@trek/shared'
import { hazardPopup, hazardFeature } from './hazardPopup'
import { useTranslation } from '../../i18n/TranslationContext'

export function useHazardLayerGL(map: Map | null, ready: boolean, hazards: RoadtripHazard[] | undefined, popup: () => Popup) {
  const { t } = useTranslation()
  useEffect(() => {
    if (!map || !ready || !hazards?.length) return
    const source = 'roadtrip-hazards'
    const layers = [`${source}-fill`, `${source}-line`, `${source}-point`]
    let detail: Popup | undefined
    const draw = () => {
      if (!map.isStyleLoaded() || map.getSource(source)) return
      const color = getComputedStyle(document.documentElement).getPropertyValue('--warning').trim()
      map.addSource(source, { type: 'geojson', data: { type: 'FeatureCollection', features: hazards.map(hazardFeature) } })
      map.addLayer({ id: layers[0], type: 'fill', source, filter: ['!=', ['geometry-type'], 'Point'], paint: { 'fill-color': color, 'fill-opacity': 0.16 } })
      map.addLayer({ id: layers[1], type: 'line', source, filter: ['!=', ['geometry-type'], 'Point'], paint: { 'line-color': color, 'line-width': 2 } })
      map.addLayer({ id: layers[2], type: 'circle', source, filter: ['==', ['geometry-type'], 'Point'], paint: { 'circle-color': color, 'circle-radius': 7 } })
    }
    const click = (event: MapMouseEvent) => {
      if (!map.getLayer(layers[0])) return
      const hit = map.queryRenderedFeatures(event.point, { layers })[0]
      const hazard = hazards.find(item => item.id === hit?.properties?.id)
      if (!hazard) return
      detail?.remove()
      detail = popup().setLngLat(event.lngLat).setDOMContent(hazardPopup(hazard, t('roadtrip.hazards.note'), t('roadtrip.hazards.point'))).addTo(map)
    }
    draw()
    map.on('style.load', draw)
    map.on('click', click)
    return () => {
      detail?.remove()
      map.off('style.load', draw)
      map.off('click', click)
      for (const layer of layers) if (map.getLayer(layer)) map.removeLayer(layer)
      if (map.getSource(source)) map.removeSource(source)
    }
  }, [map, ready, hazards, popup, t])
}
