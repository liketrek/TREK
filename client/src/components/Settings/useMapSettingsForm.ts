import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { Place } from '../../types';
import { normalizeStyleForProvider } from '../Map/glProviders';
import { useToast } from '../shared/Toast';
import { type MapProvider, normalizeProvider, previewPlace, slotStyle, styleForProvider } from './mapSettingsModel';

export interface MapSettingsFormOptions {
  /**
   * The phone shows the normalized style in the field as soon as save is pressed;
   * the desktop only once it is actually persisted.
   */
  mirrorStyleBeforeSave?: boolean;
}

/**
 * The user's map settings form behind both settings shells (the desktop tab and the
 * phone section render their own markup over this): the provider, the raster tiles
 * and CARTO key, the Mapbox token, the GL style and the 3D and quality toggles,
 * seeded from the settings store and saved back in one patch.
 */
export function useMapSettingsForm({ mirrorStyleBeforeSave = false }: MapSettingsFormOptions = {}) {
  const { settings, updateSettings } = useSettingsStore();
  const { t } = useTranslation();
  const toast = useToast();
  const initialProvider = normalizeProvider(settings.map_provider);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<MapProvider>(initialProvider);
  const [mapTileUrl, setMapTileUrl] = useState<string>(settings.map_tile_url || '');
  const managed = useAuthStore((s) => s.managed);
  const [mapboxToken, setMapboxToken] = useState<string>(settings.mapbox_access_token || '');
  const [cartoKey, setCartoKey] = useState<string>(settings.carto_api_key || '');
  const [mapboxStyle, setMapboxStyle] = useState<string>(
    styleForProvider(initialProvider, slotStyle(initialProvider, settings))
  );
  const [mapbox3d, setMapbox3d] = useState<boolean>(settings.mapbox_3d_enabled !== false);
  const [mapboxQuality, setMapboxQuality] = useState<boolean>(settings.mapbox_quality_mode === true);

  useEffect(() => {
    const nextProvider = normalizeProvider(settings.map_provider);
    setProvider(nextProvider);
    setMapTileUrl(settings.map_tile_url || '');
    setMapboxToken(settings.mapbox_access_token || '');
    setCartoKey(settings.carto_api_key || '');
    setMapboxStyle(styleForProvider(nextProvider, slotStyle(nextProvider, settings)));
    setMapbox3d(settings.mapbox_3d_enabled !== false);
    setMapboxQuality(settings.mapbox_quality_mode === true);
  }, [settings]);

  const previewPlaces = useMemo((): Place[] => [previewPlace()], []);

  const save = async (): Promise<void> => {
    setSaving(true);
    try {
      const glStyle = provider === 'leaflet' ? mapboxStyle : normalizeStyleForProvider(provider, mapboxStyle);
      if (mirrorStyleBeforeSave) setMapboxStyle(glStyle);
      // Save into the active provider's own slot so the other provider's style survives.
      const stylePatch = provider === 'maplibre-gl' ? { maplibre_style: glStyle } : { mapbox_style: glStyle };
      await updateSettings({
        map_provider: provider,
        map_tile_url: mapTileUrl,
        mapbox_access_token: mapboxToken,
        carto_api_key: cartoKey,
        ...stylePatch,
        mapbox_3d_enabled: mapbox3d,
        mapbox_quality_mode: mapboxQuality,
      });
      // Only mirror the normalized style into the form once it is actually persisted.
      if (!mirrorStyleBeforeSave) setMapboxStyle(glStyle);
      toast.success(t('settings.toast.mapSaved'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const changeProvider = (nextProvider: MapProvider) => {
    setProvider(nextProvider);
    if (nextProvider !== 'leaflet') setMapboxStyle(styleForProvider(nextProvider, mapboxStyle));
  };

  // Only CARTO burns a watermark into keyless tiles, so the nudge is scoped to its hosts.
  const cartoNeedsKey = mapTileUrl.includes('basemaps.cartocdn.com') && !cartoKey.trim();

  return {
    managed,
    saving,
    provider,
    changeProvider,
    mapTileUrl,
    setMapTileUrl,
    mapboxToken,
    setMapboxToken,
    cartoKey,
    setCartoKey,
    cartoNeedsKey,
    mapboxStyle,
    setMapboxStyle,
    mapbox3d,
    setMapbox3d,
    mapboxQuality,
    setMapboxQuality,
    previewPlaces,
    save,
  };
}
