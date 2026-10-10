// FE-COMP-DEFAULTSETTINGS-001 onwards: the defaults for users behind both admin shells.
import { act, renderHook, waitFor } from '@testing-library/react';

import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { adminApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { MAPBOX_DEFAULT_STYLE, OPENFREEMAP_DEFAULT_STYLE } from '../Map/glProviders';
import { type Defaults, useDefaultUserSettings } from './useDefaultUserSettings';

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock('../shared/Toast', () => ({ useToast: () => toast }));
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

const errorMessage = vi.fn((err: unknown, fallback: string) =>
  err instanceof Error ? `msg:${err.message}` : fallback
);
const previewCreatedAt = vi.fn(() => 'stamp');

function stub(data: Defaults) {
  vi.spyOn(adminApi, 'getDefaultUserSettings').mockResolvedValue(data);
  return vi.spyOn(adminApi, 'updateDefaultUserSettings').mockImplementation(async (patch) => ({ ...data, ...patch }));
}

async function loaded() {
  const hook = renderHook(() => useDefaultUserSettings({ errorMessage, previewCreatedAt }));
  await waitFor(() => expect(hook.result.current.loaded).toBe(true));
  return hook;
}

beforeEach(() => {
  resetAllStores();
  seedStore(useAuthStore, { managed: true });
  toast.success.mockReset();
  toast.error.mockReset();
  errorMessage.mockClear();
  previewCreatedAt.mockClear();
});
afterEach(() => vi.restoreAllMocks());

describe('useDefaultUserSettings', () => {
  it('FE-COMP-DEFAULTSETTINGS-001: loads the defaults into the map fields', async () => {
    stub({
      map_provider: 'maplibre-gl',
      map_tile_url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      mapbox_access_token: 'pk',
      carto_api_key: 'ck',
      maplibre_style: '',
    });
    const { result } = await loaded();
    expect(result.current.mapTileUrl).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(result.current.mapboxToken).toBe('pk');
    expect(result.current.cartoKey).toBe('ck');
    expect(result.current.mapboxStyle).toBe(OPENFREEMAP_DEFAULT_STYLE);
    expect(result.current.mapProvider).toBe('maplibre-gl');
    expect(result.current.styleKey).toBe('maplibre_style');
    expect(result.current.glStylePresets.length).toBeGreaterThan(0);
    expect(result.current.managed).toBe(true);
    expect(result.current.isSet('map_provider')).toBe(true);
    expect(result.current.isSet('dark_mode')).toBe(false);
    expect(result.current.mapPreviewPlaces).toEqual([
      expect.objectContaining({ name: 'Preview center', created_at: 'stamp' }),
    ]);
    expect(previewCreatedAt).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-DEFAULTSETTINGS-002: leaflet loads the stored mapbox style as is, and a failed load still finishes', async () => {
    stub({ mapbox_style: 'mapbox://styles/me/x' });
    const first = await loaded();
    expect(first.result.current.mapboxStyle).toBe('mapbox://styles/me/x');
    expect(first.result.current.glStylePresets).toEqual([]);

    vi.spyOn(adminApi, 'getDefaultUserSettings').mockRejectedValue(new Error('x'));
    const second = await loaded();
    expect(second.result.current.defaults).toEqual({});
  });

  it('FE-COMP-DEFAULTSETTINGS-003: save stores what the server returns; a failure goes through the shell error text', async () => {
    const update = stub({});
    const { result } = await loaded();
    await act(() => result.current.save({ temperature_unit: 'celsius' }));
    expect(update).toHaveBeenCalledWith({ temperature_unit: 'celsius' });
    expect(result.current.defaults.temperature_unit).toBe('celsius');
    expect(toast.success).toHaveBeenCalledWith('admin.defaultSettings.saved');

    update.mockRejectedValueOnce(new Error('bad'));
    await act(() => result.current.save({ time_format: '12h' }));
    expect(errorMessage).toHaveBeenCalledWith(expect.any(Error), 'common.error');
    expect(toast.error).toHaveBeenCalledWith('msg:bad');
  });

  it('FE-COMP-DEFAULTSETTINGS-004: reset clears the matching local field and the style per provider', async () => {
    const update = stub({
      map_provider: 'mapbox-gl',
      mapbox_access_token: 'pk',
      carto_api_key: 'ck',
      map_tile_url: 'u',
    });
    update.mockImplementation(async () => ({ map_provider: 'mapbox-gl' }));
    const { result } = await loaded();
    act(() => result.current.setMapboxStyle('custom'));

    await act(() => result.current.reset('mapbox_access_token'));
    expect(update).toHaveBeenLastCalledWith({ mapbox_access_token: null });
    expect(result.current.mapboxToken).toBe('');
    await act(() => result.current.reset('carto_api_key'));
    expect(result.current.cartoKey).toBe('');
    await act(() => result.current.reset('map_tile_url'));
    expect(result.current.mapTileUrl).toBe('');
    await act(() => result.current.reset('mapbox_style'));
    expect(result.current.mapboxStyle).toBe(MAPBOX_DEFAULT_STYLE);
    expect(toast.success).toHaveBeenCalledWith('admin.defaultSettings.reset');

    update.mockRejectedValueOnce('x');
    await act(() => result.current.reset('dark_mode'));
    expect(toast.error).toHaveBeenCalledWith('common.error');
  });

  it('FE-COMP-DEFAULTSETTINGS-005: switching provider saves the new slot style, leaflet saves the provider alone', async () => {
    const update = stub({ map_provider: 'leaflet', maplibre_style: 'https://tiles.openfreemap.org/styles/bright' });
    const { result } = await loaded();

    act(() => result.current.saveMapProvider('maplibre-gl'));
    await waitFor(() => expect(result.current.mapProvider).toBe('maplibre-gl'));
    expect(update).toHaveBeenCalledWith({
      map_provider: 'maplibre-gl',
      maplibre_style: 'https://tiles.openfreemap.org/styles/bright',
    });
    expect(result.current.mapboxStyle).toBe('https://tiles.openfreemap.org/styles/bright');

    act(() => result.current.saveMapProvider('leaflet'));
    await waitFor(() => expect(update).toHaveBeenLastCalledWith({ map_provider: 'leaflet' }));
  });

  it('FE-COMP-DEFAULTSETTINGS-006: picks save at once, an empty pick does nothing, a typed style is normalized', async () => {
    const update = stub({ map_provider: 'maplibre-gl' });
    const { result } = await loaded();

    act(() => result.current.pickTilePreset(''));
    act(() => result.current.pickStylePreset(''));
    expect(update).not.toHaveBeenCalled();

    act(() => result.current.pickTilePreset('https://tile.openstreetmap.de/{z}/{x}/{y}.png'));
    expect(result.current.mapTileUrl).toBe('https://tile.openstreetmap.de/{z}/{x}/{y}.png');
    expect(update).toHaveBeenLastCalledWith({ map_tile_url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png' });

    act(() => result.current.pickStylePreset('https://tiles.openfreemap.org/styles/positron'));
    expect(update).toHaveBeenLastCalledWith({ maplibre_style: 'https://tiles.openfreemap.org/styles/positron' });

    act(() => result.current.setMapboxStyle('mapbox://styles/not-for-maplibre'));
    act(() => result.current.commitStyle());
    expect(result.current.mapboxStyle).toBe(OPENFREEMAP_DEFAULT_STYLE);
    expect(update).toHaveBeenLastCalledWith({ maplibre_style: OPENFREEMAP_DEFAULT_STYLE });
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(3));
  });
});
