import { useEffect, useState } from 'react';

import { adminApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import type { DistanceUnit, Place, WeekStart } from '../../types';
import { normalizeTileUrl } from '../../utils/tileUrl';
import {
  defaultStyleForProvider,
  getStylePresets,
  normalizeStyleForProvider,
  styleSettingKey,
} from '../Map/glProviders';
import { type MapProvider, normalizeProvider, styleForProvider } from '../Settings/mapSettingsModel';
import { useToast } from '../shared/Toast';
import type { RoutingDefaults } from './RoutingInstanceFields';

export type Defaults = RoutingDefaults & {
  temperature_unit?: string;
  distance_unit?: DistanceUnit;
  dark_mode?: string | boolean;
  time_format?: string;
  week_start?: WeekStart;
  default_currency?: string;
  blur_booking_codes?: boolean;
  map_tile_url?: string;
  carto_api_key?: string;
  map_provider?: string;
  mapbox_access_token?: string;
  mapbox_style?: string;
  maplibre_style?: string;
  mapbox_3d_enabled?: boolean;
  mapbox_quality_mode?: boolean;
};

export interface DefaultUserSettingsOptions {
  /** How a failed save or reset turns into the toast's text; each shell keeps its own. */
  errorMessage: (err: unknown, fallback: string) => string;
  /** The preview place's creation stamp; each shell keeps its own format. */
  previewCreatedAt: () => string;
}

/**
 * The admin's defaults for every user, behind both admin shells (the desktop tab and
 * the phone screen render their own markup over this): loading them, the per change
 * auto save, the reset to the built in value, and the map fields that are edited
 * locally and saved on blur or on a pick.
 */
export function useDefaultUserSettings({ errorMessage, previewCreatedAt }: DefaultUserSettingsOptions) {
  const { t } = useTranslation();
  const toast = useToast();
  const [defaults, setDefaults] = useState<Defaults>({});
  const [loaded, setLoaded] = useState(false);
  const [mapTileUrl, setMapTileUrl] = useState('');
  const managed = useAuthStore((s) => s.managed);
  const [mapboxToken, setMapboxToken] = useState('');
  const [cartoKey, setCartoKey] = useState('');
  const [mapboxStyle, setMapboxStyle] = useState('');

  useEffect(() => {
    adminApi
      .getDefaultUserSettings()
      .then((data: Defaults) => {
        const provider = normalizeProvider(data.map_provider);
        setDefaults(data);
        setMapTileUrl(normalizeTileUrl(data.map_tile_url || ''));
        setMapboxToken(data.mapbox_access_token || '');
        setCartoKey(data.carto_api_key || '');
        setMapboxStyle(
          provider === 'leaflet'
            ? data.mapbox_style || ''
            : styleForProvider(provider, provider === 'maplibre-gl' ? data.maplibre_style : data.mapbox_style)
        );
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const save = async (patch: Partial<Defaults>) => {
    try {
      const updated = await adminApi.updateDefaultUserSettings(patch as Record<string, unknown>);
      setDefaults(updated);
      toast.success(t('admin.defaultSettings.saved'));
    } catch (err: unknown) {
      toast.error(errorMessage(err, t('common.error')));
    }
  };

  const reset = async (key: keyof Defaults) => {
    try {
      const updated = await adminApi.updateDefaultUserSettings({ [key]: null });
      setDefaults(updated);
      if (key === 'map_tile_url') setMapTileUrl('');
      if (key === 'mapbox_access_token') setMapboxToken('');
      if (key === 'carto_api_key') setCartoKey('');
      if (key === 'mapbox_style' || key === 'maplibre_style') {
        const provider = normalizeProvider(defaults.map_provider);
        setMapboxStyle(provider === 'leaflet' ? '' : defaultStyleForProvider(provider));
      }
      toast.success(t('admin.defaultSettings.reset'));
    } catch (err: unknown) {
      toast.error(errorMessage(err, t('common.error')));
    }
  };

  const isSet = (key: keyof Defaults) => defaults[key] !== undefined;

  // Built once per mount, like the preview it feeds.
  const [mapPreviewPlaces] = useState((): Place[] => [adminPreviewPlace(previewCreatedAt())]);

  const mapProvider = normalizeProvider(defaults.map_provider);
  const glStylePresets = mapProvider === 'leaflet' ? [] : getStylePresets(mapProvider);
  const styleKey: keyof Defaults = mapProvider === 'maplibre-gl' ? 'maplibre_style' : 'mapbox_style';

  const saveMapProvider = (nextProvider: MapProvider) => {
    const patch: Partial<Defaults> = { map_provider: nextProvider };
    if (nextProvider !== 'leaflet') {
      // Load + save the new provider's own style slot so the other provider's style is kept.
      const slot = nextProvider === 'maplibre-gl' ? defaults.maplibre_style : defaults.mapbox_style;
      const nextStyle = styleForProvider(nextProvider, slot);
      setMapboxStyle(nextStyle);
      patch[styleSettingKey(nextProvider)] = nextStyle;
    }
    void save(patch);
  };

  /** A tile preset picked from the list: shown and saved at once. */
  const pickTilePreset = (value: string) => {
    if (value) {
      setMapTileUrl(value);
      void save({ map_tile_url: value });
    }
  };

  /** A style preset picked from the list: shown and saved at once. */
  const pickStylePreset = (value: string) => {
    if (value) {
      setMapboxStyle(value);
      void save({ [styleKey]: value });
    }
  };

  /** A typed style is normalized for the provider before it is saved. */
  const commitStyle = () => {
    // The style input never renders for leaflet; this only narrows the provider type.
    if (mapProvider === 'leaflet') return;
    const nextStyle = normalizeStyleForProvider(mapProvider, mapboxStyle);
    setMapboxStyle(nextStyle);
    void save({ [styleKey]: nextStyle });
  };

  return {
    defaults,
    loaded,
    managed,
    isSet,
    save,
    reset,
    mapTileUrl,
    setMapTileUrl,
    mapboxToken,
    setMapboxToken,
    cartoKey,
    setCartoKey,
    mapboxStyle,
    setMapboxStyle,
    mapPreviewPlaces,
    mapProvider,
    glStylePresets,
    styleKey,
    saveMapProvider,
    pickTilePreset,
    pickStylePreset,
    commitStyle,
  };
}

/** The one place the admin's tile preview shows. */
function adminPreviewPlace(createdAt: string): Place {
  return {
    id: 1,
    trip_id: 1,
    name: 'Preview center',
    description: null,
    notes: null,
    lat: 48.8566,
    lng: 2.3522,
    address: null,
    category_id: null,
    price: null,
    currency: null,
    image_url: null,
    google_place_id: null,
    osm_id: null,
    route_geometry: null,
    place_time: null,
    end_time: null,
    duration_minutes: null,
    transport_mode: null,
    website: null,
    phone: null,
    created_at: createdAt,
  };
}
