import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hasNativeFeature } from './capabilities';
import { isNativeIos } from './platform';
import { mapboxTileCacheRequest, nativeRasterTemplate, tileCacheActive, toTileCacheUrl } from './tileCache';

vi.mock('./platform', () => ({ isNativeIos: vi.fn() }));
vi.mock('./capabilities', () => ({ hasNativeFeature: vi.fn() }));

beforeEach(() => {
  vi.mocked(isNativeIos).mockReturnValue(true);
  vi.mocked(hasNativeFeature).mockReturnValue(true);
});

describe('tileCache', () => {
  it('is on only in an iOS binary that has the store', () => {
    expect(tileCacheActive()).toBe(true);
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    expect(tileCacheActive()).toBe(false);
    vi.mocked(hasNativeFeature).mockReturnValue(true);
    vi.mocked(isNativeIos).mockReturnValue(false);
    expect(tileCacheActive()).toBe(false);
  });

  it('swaps only the scheme, so the store knows where the tile lives', () => {
    expect(toTileCacheUrl('https://a.tile.example.com/1/2/3.png?k=v')).toBe(
      'trek-tile://a.tile.example.com/1/2/3.png?k=v'
    );
    expect(toTileCacheUrl('http://insecure.example.com/x')).toBe('http://insecure.example.com/x');
  });

  it('routes Leaflet raster templates through the store only where there is one', () => {
    expect(nativeRasterTemplate('https://{s}.tiles.example.com/{z}/{x}/{y}.png')).toBe(
      'trek-tile://{s}.tiles.example.com/{z}/{x}/{y}.png'
    );
    vi.mocked(hasNativeFeature).mockReturnValue(false);
    expect(nativeRasterTemplate('https://{s}.tiles.example.com/{z}/{x}/{y}.png')).toBe(
      'https://{s}.tiles.example.com/{z}/{x}/{y}.png'
    );
  });

  it('sends what a Mapbox map draws through the store, never its telemetry', () => {
    expect(
      mapboxTileCacheRequest('https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=pk', 'Style').url
    ).toBe('trek-tile://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=pk');
    expect(mapboxTileCacheRequest('https://a.tiles.mapbox.com/v4/x/1/2/3.vector.pbf', 'Tile').url).toMatch(
      /^trek-tile:/
    );
    expect(mapboxTileCacheRequest('https://events.mapbox.com/events/v2', 'Unknown').url).toBe(
      'https://events.mapbox.com/events/v2'
    );
    expect(mapboxTileCacheRequest('https://api.mapbox.com/map-sessions/v1', 'Unknown').url).toBe(
      'https://api.mapbox.com/map-sessions/v1'
    );
    expect(mapboxTileCacheRequest('https://tiles.openfreemap.org/planet/1/2/3.pbf', 'Tile').url).toBe(
      'https://tiles.openfreemap.org/planet/1/2/3.pbf'
    );
  });
});
