import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isEffectivelyOffline } from '../sync/networkMode';
import { GL_MAPS_THROUGH_APP_SCHEMES } from './glSchemes';
import { installOfflineProtocol, offlineStyle } from './offlineTiles';
import { glTileStoreActive, mapboxTileCacheRequest, tileCacheActive } from './tileCache';

vi.mock('./platform', () => ({ isNativeIos: vi.fn(() => true), isNativeApp: vi.fn(() => true) }));
vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn(() => true) }));
vi.mock('../sync/networkMode', () => ({ isEffectivelyOffline: vi.fn(() => false) }));

const STYLE = 'https://tiles.openfreemap.org/styles/positron';

beforeEach(() => {
  vi.stubGlobal('caches', { open: vi.fn() });
  vi.mocked(isEffectivelyOffline).mockReturnValue(false);
});

describe('GL maps and the app schemes', () => {
  it('FE-NATIVE-GLSCHEME-001: online in the iOS app the GL maps load straight from their servers, the raster store stays', () => {
    expect(GL_MAPS_THROUGH_APP_SCHEMES).toBe(false);
    expect(offlineStyle(STYLE)).toBe(STYLE);
    const tile = 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/1/1/1.vector.pbf';
    expect(mapboxTileCacheRequest(tile, 'Tile')).toEqual({ url: tile });
    expect(glTileStoreActive()).toBe(false);
    expect(tileCacheActive()).toBe(true);
  });

  it('FE-NATIVE-GLSCHEME-002: offline, or set to be, the MapLibre basemap reads the stored copy through the protocol', () => {
    const addProtocol = vi.fn();
    installOfflineProtocol({ addProtocol });
    expect(addProtocol).toHaveBeenCalledWith('trek-offline', expect.any(Function));

    vi.mocked(isEffectivelyOffline).mockReturnValue(true);
    expect(offlineStyle(STYLE)).toBe('trek-offline://tiles.openfreemap.org/styles/positron');
    // Mapbox never goes through the store: offline it gives way to the stored MapLibre basemap.
    expect(glTileStoreActive()).toBe(false);
  });
});
