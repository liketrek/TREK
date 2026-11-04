import { GeoJSON } from 'react-leaflet'
import type { RoadtripHazard } from '@trek/shared'
import L from 'leaflet'
import { useTranslation } from '../../i18n/TranslationContext'

import { hazardPopup, hazardFeature } from './hazardPopup'
import { useLngFrame } from './lngFrameContext'
import { frameLng } from '../../utils/lngFrame'

export default function HazardLayers({ hazards }: { hazards: RoadtripHazard[] }) {
  const { t } = useTranslation()
  const frame = useLngFrame()
  return <>{hazards.map(hazard => <GeoJSON key={`${hazard.id}-${hazard.updatedAt}-${frame?.seam ?? ''}`} data={hazardFeature(hazard)}
    coordsToLatLng={coords => L.latLng(coords[1], frameLng(frame, coords[0]))}
    style={{ color: 'var(--warning)', weight: 2, fillOpacity: 0.16 }}
    pointToLayer={(_, point) => L.circleMarker(point, { radius: 7, color: 'var(--warning)', fillOpacity: 0.65 })}
    onEachFeature={(_, layer) => layer.bindPopup(hazardPopup(hazard, t('roadtrip.hazards.note'), t('roadtrip.hazards.point')), { className: 'map-tooltip trek-hazard-popup', maxWidth: 320 })}
  />)}</>
}
