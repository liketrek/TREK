import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  useRasterOverlaysGL,
  useSourceTileHealthGL,
  type MapRasterOverlay,
  type RasterOverlayGlMap,
} from './mapRasterOverlay';

type Handler = (event: Record<string, unknown>) => void;

/** Enough of a GL map to watch what the overlay hook does with it. */
function fakeMap(styleLayers: Array<{ id: string }> = []) {
  const layers = new Map<string, { visibility: string }>();
  const sources = new Set<string>();
  const handlers = new Map<string, Set<Handler>>();
  const map = {
    getLayer: vi.fn((id: string) => layers.get(id)),
    getSource: vi.fn((id: string) => (sources.has(id) ? {} : undefined)),
    addSource: vi.fn((id: string) => sources.add(id)),
    addLayer: vi.fn((layer: { id: string }, _before?: string) => layers.set(layer.id, { visibility: 'visible' })),
    setLayoutProperty: vi.fn((id: string, _key: string, value: string) => layers.set(id, { visibility: value })),
    getStyle: vi.fn(() => ({ layers: styleLayers })),
    on: vi.fn((type: string, handler: Handler) => {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type)?.add(handler);
    }),
    off: vi.fn((type: string, handler: Handler) => handlers.get(type)?.delete(handler)),
  };
  const fire = (type: string, event: Record<string, unknown>) =>
    handlers.get(type)?.forEach((handler) => handler(event));
  return { map, layers, fire, gl: map as unknown as RasterOverlayGlMap };
}

function overlay(active: boolean): MapRasterOverlay {
  return {
    id: 'seamarks',
    url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
    attribution: 'OpenSeaMap',
    minZoom: 6,
    maxZoom: 18,
    active,
    onTileError: vi.fn(),
    onTileLoad: vi.fn(),
  };
}

describe('useRasterOverlaysGL', () => {
  it('adds a switched-on overlay under the first own layer, so the route stays on top', () => {
    const { map, gl } = fakeMap([{ id: 'background' }, { id: 'trek-route-line' }]);
    renderHook(() => useRasterOverlaysGL(gl, [overlay(true)]));
    expect(map.addSource).toHaveBeenCalledWith(
      'trek-overlay-seamarks',
      expect.objectContaining({ type: 'raster', minzoom: 6 })
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'trek-overlay-seamarks' }),
      'trek-route-line'
    );
  });

  it('adds nothing for an overlay that is off, and hides one already there when it is switched off', () => {
    const { map, gl, layers } = fakeMap();
    const { rerender } = renderHook(({ list }) => useRasterOverlaysGL(gl, list), {
      initialProps: { list: [overlay(false)] },
    });
    expect(map.addLayer).not.toHaveBeenCalled();
    rerender({ list: [overlay(true)] });
    expect(layers.get('trek-overlay-seamarks')?.visibility).toBe('visible');
    rerender({ list: [overlay(false)] });
    expect(layers.get('trek-overlay-seamarks')?.visibility).toBe('none');
  });

  it('puts the overlay back after a basemap change rebuilt the style', () => {
    const { map, gl, layers, fire } = fakeMap();
    renderHook(() => useRasterOverlaysGL(gl, [overlay(true)]));
    layers.clear();
    fire('styledata', {});
    expect(map.addLayer).toHaveBeenCalledTimes(2);
  });

  it("reports its own tiles' failures and arrivals, and leaves other sources' events alone", () => {
    const { gl, fire } = fakeMap();
    const seamarks = overlay(true);
    renderHook(() => useRasterOverlaysGL(gl, [seamarks]));
    fire('error', { sourceId: 'trek-overlay-seamarks', error: new Error('503') });
    fire('error', { sourceId: 'basemap', error: new Error('503') });
    fire('sourcedata', { sourceId: 'trek-overlay-seamarks', tile: {} });
    fire('sourcedata', { sourceId: 'trek-overlay-seamarks' });
    expect(seamarks.onTileError).toHaveBeenCalledTimes(1);
    expect(seamarks.onTileLoad).toHaveBeenCalledTimes(1);
  });

  it('keeps the plain map when the style refuses the layer, and lets go of its listeners on unmount', () => {
    const { map, gl } = fakeMap();
    map.addLayer.mockImplementation(() => {
      throw new Error('style not loaded');
    });
    const { unmount } = renderHook(() => useRasterOverlaysGL(gl, [overlay(true)]));
    unmount();
    expect(map.off).toHaveBeenCalledTimes(3);
  });

  it('does nothing without a map or without overlays', () => {
    const { map, gl } = fakeMap();
    renderHook(() => useRasterOverlaysGL(null, [overlay(true)]));
    renderHook(() => useRasterOverlaysGL(gl, []));
    expect(map.on).not.toHaveBeenCalled();
  });
});

describe('useSourceTileHealthGL (MAP-01)', () => {
  it("reports one source's failed and arrived tiles into its health, nothing else's", () => {
    const { gl, fire } = fakeMap();
    const health = { down: false, onTileError: vi.fn(), onTileLoad: vi.fn() };
    renderHook(() => useSourceTileHealthGL(gl, 'trip-hiking', health));
    fire('error', { sourceId: 'trip-hiking', error: new Error('503') });
    fire('error', { sourceId: 'trip-topo', error: new Error('503') });
    fire('sourcedata', { sourceId: 'trip-hiking', tile: {} });
    fire('sourcedata', { sourceId: 'trip-hiking' });
    expect(health.onTileError).toHaveBeenCalledTimes(1);
    expect(health.onTileLoad).toHaveBeenCalledTimes(1);
  });

  it('listens to nothing while the map is not shown, and lets go when it goes', () => {
    const { map, gl } = fakeMap();
    const health = { down: false, onTileError: vi.fn(), onTileLoad: vi.fn() };
    renderHook(() => useSourceTileHealthGL(gl, 'trip-hiking', undefined));
    expect(map.on).not.toHaveBeenCalled();
    const { unmount } = renderHook(() => useSourceTileHealthGL(gl, 'trip-hiking', health));
    unmount();
    expect(map.off).toHaveBeenCalledTimes(2);
  });
});
