import { describe, expect, it, vi } from 'vitest';
import { hasNativeFeature } from './capabilities';
import { GL_MAPS_THROUGH_APP_SCHEMES } from './glSchemes';
import { installOfflineProtocol, offlineStyle } from './offlineTiles';
import { isNativeApp, isNativeIos } from './platform';
import { glTileStoreActive, mapboxTileCacheRequest, tileCacheActive } from './tileCache';

vi.mock('./platform', () => ({ isNativeIos: vi.fn(() => true), isNativeApp: vi.fn(() => true) }));
vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn(() => true) }));

describe('GL maps and the app schemes', () => {
  it('FE-NATIVE-GLSCHEME-001: in the iOS app the GL maps load straight from their servers, the raster store stays', () => {
    expect(vi.mocked(isNativeIos)()).toBe(true);
    expect(vi.mocked(isNativeApp)()).toBe(true);
    expect(vi.mocked(hasNativeFeature)('tileCache')).toBe(true);
    expect(GL_MAPS_THROUGH_APP_SCHEMES).toBe(false);

    const style = 'https://tiles.openfreemap.org/styles/positron';
    expect(offlineStyle(style)).toBe(style);
    const addProtocol = vi.fn();
    installOfflineProtocol({ addProtocol });
    expect(addProtocol).not.toHaveBeenCalled();

    const tile = 'https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/1/1/1.vector.pbf';
    expect(mapboxTileCacheRequest(tile, 'Tile')).toEqual({ url: tile });
    expect(glTileStoreActive()).toBe(false);
    expect(tileCacheActive()).toBe(true);
  });
});
