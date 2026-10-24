// FE-TOUR-TERRAIN-FERRATAS-001 to FE-TOUR-TERRAIN-FERRATAS-002
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useTerrainFerratas } from './useTerrainFerratas';
import type { TerrainGl } from './useTerrainMap';

vi.mock('../../Ferratas/useFerrataLayerGL', () => ({ useFerrataMapLayerGL: vi.fn() }));

/** Enough of a MapLibre map for the viewport: its bounds, its zoom, and the events it is told about. */
function fakeGl(loaded: boolean) {
  const handlers = new Map<string, () => void>();
  const map = {
    getBounds: () => ({ getSouth: () => 46, getWest: () => 7, getNorth: () => 47, getEast: () => 8 }),
    getZoom: vi.fn(() => 8),
    loaded: () => loaded,
    on: vi.fn((event: string, handler: () => void) => handlers.set(event, handler)),
    off: vi.fn((event: string) => handlers.delete(event)),
  };
  return { gl: { map } as unknown as TerrainGl, handlers, map };
}

describe('useTerrainFerratas', () => {
  it('FE-TOUR-TERRAIN-FERRATAS-001: reports the visible area at once on a loaded map, with the zoom on the raster tile scale, and after every move', () => {
    const { gl, handlers, map } = fakeGl(true);
    const onViewportChange = vi.fn();
    renderHook(() => useTerrainFerratas(gl, undefined, onViewportChange));
    expect(onViewportChange).toHaveBeenCalledWith({ south: 46, west: 7, north: 47, east: 8 }, 9);
    map.getZoom.mockReturnValue(10);
    handlers.get('moveend')?.();
    expect(onViewportChange).toHaveBeenLastCalledWith({ south: 46, west: 7, north: 47, east: 8 }, 11);
  });

  it('FE-TOUR-TERRAIN-FERRATAS-002: waits for a map still loading, and lets go of its events when done', () => {
    const { gl, handlers } = fakeGl(false);
    const onViewportChange = vi.fn();
    const { unmount } = renderHook(() => useTerrainFerratas(gl, undefined, onViewportChange));
    expect(onViewportChange).not.toHaveBeenCalled();
    handlers.get('load')?.();
    expect(onViewportChange).toHaveBeenCalledTimes(1);
    unmount();
    expect(handlers.size).toBe(0);
  });
});
