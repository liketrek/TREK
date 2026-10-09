// FE-COMP-MAPFORM-001 onwards: the map settings form behind both settings shells.
import { act, renderHook } from '@testing-library/react';

import { buildSettings } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { AMAP_ROAD, AMAP_SATELLITE } from '../../constants/mapDefaults';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { Settings } from '../../types';
import { MAPBOX_DEFAULT_STYLE, OPENFREEMAP_DEFAULT_STYLE } from '../Map/glProviders';
import { MAP_PRESETS, PREVIEW_CENTER, normalizeProvider, slotStyle, styleForProvider } from './mapSettingsModel';
import { useMapSettingsForm } from './useMapSettingsForm';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const updateSettings = vi.fn();

function seed(over: Partial<Settings> = {}) {
  seedStore(useSettingsStore, { settings: buildSettings({ map_tile_url: '', ...over }), updateSettings });
}

beforeEach(() => {
  resetAllStores();
  toast.success.mockReset();
  toast.error.mockReset();
  updateSettings.mockReset().mockResolvedValue(undefined);
  seedStore(useAuthStore, { managed: false });
});

describe('mapSettingsModel', () => {
  it('FE-COMP-MAPFORM-001: one preset list, the two Amap presets included, serves users and the admin defaults', () => {
    expect(MAP_PRESETS).toHaveLength(9);
    expect(MAP_PRESETS.map((p) => p.url)).toEqual(expect.arrayContaining([AMAP_ROAD, AMAP_SATELLITE]));
  });

  it('FE-COMP-MAPFORM-002: provider and style rules', () => {
    expect(normalizeProvider('mapbox-gl')).toBe('mapbox-gl');
    expect(normalizeProvider('maplibre-gl')).toBe('maplibre-gl');
    expect(normalizeProvider('bogus')).toBe('leaflet');
    expect(styleForProvider('leaflet', '')).toBe(MAPBOX_DEFAULT_STYLE);
    expect(styleForProvider('leaflet', 'x')).toBe('x');
    expect(styleForProvider('mapbox-gl', 'https://tiles.openfreemap.org/styles/bright')).toBe(MAPBOX_DEFAULT_STYLE);
    expect(styleForProvider('maplibre-gl', '')).toBe(OPENFREEMAP_DEFAULT_STYLE);
    expect(slotStyle('maplibre-gl', { mapbox_style: 'a', maplibre_style: 'b' })).toBe('b');
    expect(slotStyle('mapbox-gl', { mapbox_style: 'a', maplibre_style: 'b' })).toBe('a');
  });
});

describe('useMapSettingsForm', () => {
  it('FE-COMP-MAPFORM-003: seeds the form from the settings store and builds one preview place', () => {
    seed({ map_provider: 'maplibre-gl', maplibre_style: '', carto_api_key: 'ck', mapbox_quality_mode: true });
    const { result } = renderHook(() => useMapSettingsForm());
    expect(result.current.provider).toBe('maplibre-gl');
    expect(result.current.mapboxStyle).toBe(OPENFREEMAP_DEFAULT_STYLE);
    expect(result.current.cartoKey).toBe('ck');
    expect(result.current.mapboxQuality).toBe(true);
    expect(result.current.managed).toBe(false);
    expect(result.current.previewPlaces).toHaveLength(1);
    expect(result.current.previewPlaces[0]).toMatchObject({ lat: PREVIEW_CENTER[0], lng: PREVIEW_CENTER[1] });
  });

  it('FE-COMP-MAPFORM-004: switching to a GL provider moves the style into that provider, leaflet keeps it', () => {
    seed({ map_provider: 'mapbox-gl', mapbox_style: 'https://tiles.openfreemap.org/styles/bright' });
    const { result } = renderHook(() => useMapSettingsForm());
    expect(result.current.mapboxStyle).toBe(MAPBOX_DEFAULT_STYLE);
    act(() => result.current.changeProvider('maplibre-gl'));
    expect(result.current.mapboxStyle).toBe(OPENFREEMAP_DEFAULT_STYLE);
    act(() => result.current.changeProvider('leaflet'));
    expect(result.current.provider).toBe('leaflet');
    expect(result.current.mapboxStyle).toBe(OPENFREEMAP_DEFAULT_STYLE);
  });

  it('FE-COMP-MAPFORM-005: the CARTO nudge shows only for a CARTO template without a key', () => {
    seed();
    const { result } = renderHook(() => useMapSettingsForm());
    act(() => result.current.setMapTileUrl(MAP_PRESETS[4].url));
    expect(result.current.cartoNeedsKey).toBe(true);
    act(() => result.current.setCartoKey('  k '));
    expect(result.current.cartoNeedsKey).toBe(false);
  });

  it('FE-COMP-MAPFORM-006: save writes the active provider slot and toasts', async () => {
    seed({ map_provider: 'maplibre-gl' });
    const { result } = renderHook(() => useMapSettingsForm());
    act(() => result.current.setMapboxStyle('  '));
    await act(() => result.current.save());
    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({ map_provider: 'maplibre-gl', maplibre_style: OPENFREEMAP_DEFAULT_STYLE })
    );
    expect(updateSettings.mock.calls[0][0]).not.toHaveProperty('mapbox_style');
    expect(result.current.mapboxStyle).toBe(OPENFREEMAP_DEFAULT_STYLE);
    expect(toast.success).toHaveBeenCalledWith('settings.toast.mapSaved');
    expect(result.current.saving).toBe(false);
  });

  it('FE-COMP-MAPFORM-007: on a failed save the desktop keeps the typed style, the phone shows the normalized one', async () => {
    seed({ map_provider: 'mapbox-gl' });
    updateSettings.mockRejectedValue(new Error('nope'));

    const desktop = renderHook(() => useMapSettingsForm());
    act(() => desktop.result.current.setMapboxStyle(''));
    await act(() => desktop.result.current.save());
    expect(desktop.result.current.mapboxStyle).toBe('');
    expect(toast.error).toHaveBeenCalledWith('nope');

    const phone = renderHook(() => useMapSettingsForm({ mirrorStyleBeforeSave: true }));
    act(() => phone.result.current.setMapboxStyle(''));
    await act(() => phone.result.current.save());
    expect(phone.result.current.mapboxStyle).toBe(MAPBOX_DEFAULT_STYLE);
  });

  it('FE-COMP-MAPFORM-008: a non Error failure falls back to the generic message', async () => {
    seed();
    updateSettings.mockRejectedValue('x');
    const { result } = renderHook(() => useMapSettingsForm());
    await act(() => result.current.save());
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });
});
