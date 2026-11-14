import { useEffect, type RefObject } from 'react';

import { useSettingsStore } from '../../store/settingsStore';
import { basemapLanguage } from './glProviders';

/** The one call of a Mapbox map this needs; a MapLibre map never gets here. */
interface BasemapConfigurable {
  setConfigProperty: (importId: string, name: string, value: unknown) => unknown;
}

/** Sets one property of a Mapbox Standard basemap's config, where the style has it. */
export function setBasemapConfig(map: BasemapConfigurable, name: string, value: unknown): void {
  try {
    map.setConfigProperty('basemap', name, value);
  } catch {
    /* a style or SDK without this basemap config property */
  }
}

/**
 * The user's settings on a Mapbox Standard basemap's own config, set without rebuilding
 * the map: once it is ready, and again whenever a setting changes.
 *
 * The label language follows the UI language, so labels don't fall back to the browser
 * or OS locale and stack several scripts per place (#1299). The basemap's own points of
 * interest can be hidden (#1761): Standard labels shops, restaurants and sights of its
 * own, which look like the trip's places but cannot be picked and sit a little off the
 * same place added from the search. Classic Mapbox styles and MapLibre have no such
 * config and are left as they are (`standard` is false for them).
 */
export function useStandardBasemapConfig(
  mapRef: RefObject<BasemapConfigurable | null>,
  ready: boolean,
  standard: boolean
): void {
  const language = useSettingsStore((s) => s.settings.language);
  const hidePois = useSettingsStore((s) => s.settings.map_hide_basemap_pois === true);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !standard) return;
    setBasemapConfig(map, 'language', basemapLanguage(language));
  }, [mapRef, ready, standard, language]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !standard) return;
    setBasemapConfig(map, 'showPointOfInterestLabels', !hidePois);
  }, [mapRef, ready, standard, hidePois]);
}
