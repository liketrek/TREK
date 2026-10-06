import type { RoadtripHazard } from '@trek/shared';
import L from 'leaflet';
import { GeoJSON } from 'react-leaflet';
import { useTranslation } from '../../i18n/TranslationContext';

import { hazardFeature, hazardPopup } from './hazardPopup';

export default function HazardLayers({ hazards }: { hazards: RoadtripHazard[] }) {
  const { t } = useTranslation();
  return (
    <>
      {hazards.map((hazard) => (
        <GeoJSON
          key={`${hazard.id}-${hazard.updatedAt}`}
          data={hazardFeature(hazard)}
          style={{ color: 'var(--warning)', weight: 2, fillOpacity: 0.16 }}
          pointToLayer={(_, point) => L.circleMarker(point, { radius: 7, color: 'var(--warning)', fillOpacity: 0.65 })}
          onEachFeature={(_, layer) =>
            layer.bindPopup(hazardPopup(hazard, t('roadtrip.hazards.note'), t('roadtrip.hazards.point')), {
              className: 'map-tooltip trek-hazard-popup',
              maxWidth: 320,
            })
          }
        />
      ))}
    </>
  );
}
