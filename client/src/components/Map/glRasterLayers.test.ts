import { describe, expect, it, vi } from 'vitest';
import { applyBaseLayer, rasterTileZoom, tourRasterSourceId } from './glRasterLayers';

/** Enough of a GL map for the base layers: sources, layers with their visibility, and the style's order. */
function fakeMap(styleLayers: Array<{ id: string }> = [{ id: 'water' }, { id: 'trip-route' }]) {
  const sources = new Map<string, Record<string, unknown>>();
  const layers = new Map<string, string>();
  const map = {
    getSource: vi.fn((id: string) => sources.get(id)),
    addSource: vi.fn((id: string, source: Record<string, unknown>) => sources.set(id, source)),
    getLayer: vi.fn((id: string) => (layers.has(id) ? { id } : undefined)),
    addLayer: vi.fn((layer: { id: string }, _before?: string) => layers.set(layer.id, 'visible')),
    setLayoutProperty: vi.fn((id: string, _key: string, value: string) => layers.set(id, value)),
    getStyle: vi.fn(() => ({ layers: styleLayers })),
  };
  return { map, sources, layers };
}

describe('applyBaseLayer (MAP-01)', () => {
  it('lays OpenHikingMap with its credit under the first thing TREK draws', () => {
    const { map, sources } = fakeMap();
    applyBaseLayer(map, 'hiking');
    expect(tourRasterSourceId('hiking')).toBe('trip-hiking');
    expect(sources.get('trip-hiking')).toMatchObject({
      type: 'raster',
      tiles: ['https://tile.openmaps.fr/openhikingmap/{z}/{x}/{y}.png'],
      maxzoom: 18,
    });
    expect(String(sources.get('trip-hiking')?.attribution)).toContain('openmaps.fr/donate');
    expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'trip-hiking-raster' }), 'trip-route');
    // Nothing else is built while it is off.
    expect(sources.has('trip-topo')).toBe(false);
    expect(sources.has('trip-satellite')).toBe(false);
  });

  it('switching away hides it, and back shows the same layer again without a second source', () => {
    const { map, layers } = fakeMap();
    applyBaseLayer(map, 'hiking');
    applyBaseLayer(map, 'topo');
    expect(layers.get('trip-hiking-raster')).toBe('none');
    expect(layers.get('trip-topo-raster')).toBe('visible');
    applyBaseLayer(map, 'hiking');
    expect(layers.get('trip-hiking-raster')).toBe('visible');
    expect(layers.get('trip-topo-raster')).toBe('none');
    expect(map.addSource).toHaveBeenCalledTimes(2);
  });

  it("keeps the user's own map when the style refuses the layer", () => {
    const { map } = fakeMap();
    map.addLayer.mockImplementation(() => {
      throw new Error('style not loaded');
    });
    expect(() => applyBaseLayer(map, 'hiking')).not.toThrow();
  });
});

describe('rasterTileZoom', () => {
  it('puts a GL zoom on the 256 px tile scale one step further in, where a raster minimum is read', () => {
    expect(rasterTileZoom(8)).toBe(9);
    expect(rasterTileZoom(7.5)).toBe(8.5);
  });
});
