import { useMemo } from 'react';
import { useTranslation } from '../../../i18n';
import { useTourPoiStore } from '../../../store/tourPoiStore';
import { TOUR_POI_LOOKS, type Poi } from '../../Map/poiCategories';

/**
 * PLN-02: the places found along the tour as the planner map draws POIs, each
 * in its category's look, and a click on one that picks it in the card. An
 * unnamed place (a tap, a bench) is named by its kind, as the list names it.
 */
export function useTourPoiMarkers(): { pois: Poi[]; onPoiClick: (poi: Poi) => void } {
  const { t } = useTranslation();
  const found = useTourPoiStore((state) => state.pois);
  const select = useTourPoiStore((state) => state.select);
  const pois = useMemo(
    () =>
      found.map((poi): Poi => ({
        osm_id: poi.id,
        name: poi.name || t(TOUR_POI_LOOKS[poi.category].labelKey),
        lat: poi.lat,
        lng: poi.lng,
        category: poi.category,
        poi_type: poi.kind,
        address: poi.address,
        website: poi.website,
        phone: poi.phone,
        opening_hours: poi.opening_hours,
        cuisine: null,
        source: poi.source,
      })),
    [found, t]
  );
  return { pois, onPoiClick: (poi: Poi) => select(poi.osm_id) };
}
