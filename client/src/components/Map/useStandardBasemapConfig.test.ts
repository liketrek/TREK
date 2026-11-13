import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { buildSettings } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { useSettingsStore } from '../../store/settingsStore';
import type { Settings } from '../../types';
import { setBasemapConfig, useStandardBasemapConfig } from './useStandardBasemapConfig';

const map = { setConfigProperty: vi.fn() };
const mapRef = { current: map };

function settle(patch: Partial<Settings>) {
  act(() => {
    useSettingsStore.setState({ settings: { ...useSettingsStore.getState().settings, ...patch } });
  });
}

beforeEach(() => {
  resetAllStores();
  map.setConfigProperty.mockReset();
  seedStore(useSettingsStore, { settings: buildSettings({ language: 'de' }) });
});

describe('useStandardBasemapConfig', () => {
  it('FE-MAP-BASEMAPCFG-001: a ready Standard map gets the label language and keeps its points of interest', () => {
    renderHook(() => useStandardBasemapConfig(mapRef, true, true));

    expect(map.setConfigProperty).toHaveBeenCalledWith('basemap', 'language', 'de');
    expect(map.setConfigProperty).toHaveBeenCalledWith('basemap', 'showPointOfInterestLabels', true);
  });

  it('FE-MAP-BASEMAPCFG-002: the setting hides the points of interest and shows them again, without a rebuild (#1761)', () => {
    renderHook(() => useStandardBasemapConfig(mapRef, true, true));
    map.setConfigProperty.mockClear();

    settle({ map_hide_basemap_pois: true });
    expect(map.setConfigProperty).toHaveBeenCalledWith('basemap', 'showPointOfInterestLabels', false);
    // The language is left alone by a change that is not about it.
    expect(map.setConfigProperty).not.toHaveBeenCalledWith('basemap', 'language', expect.anything());

    settle({ map_hide_basemap_pois: false });
    expect(map.setConfigProperty).toHaveBeenLastCalledWith('basemap', 'showPointOfInterestLabels', true);
  });

  it('FE-MAP-BASEMAPCFG-003: nothing is set before the map is ready or on a style without that config', () => {
    const { rerender } = renderHook(({ ready, standard }) => useStandardBasemapConfig(mapRef, ready, standard), {
      initialProps: { ready: false, standard: true },
    });
    rerender({ ready: true, standard: false });
    expect(map.setConfigProperty).not.toHaveBeenCalled();
  });

  it('FE-MAP-BASEMAPCFG-004: a style or SDK that refuses the property is passed over', () => {
    map.setConfigProperty.mockImplementation(() => {
      throw new Error('unknown config');
    });
    expect(() => setBasemapConfig(map, 'showPointOfInterestLabels', false)).not.toThrow();
  });
});
