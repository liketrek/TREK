import { describe, expect, it, vi } from 'vitest';
import { reportGlViewport } from './glViewport';

/** A GL map showing the given box at the given zoom, or no box yet. */
function fakeMap(zoom: number, box: { south: number; west: number; north: number; east: number } | null) {
  const bounds = box && {
    getSouth: () => box.south,
    getWest: () => box.west,
    getNorth: () => box.north,
    getEast: () => box.east,
  };
  return { getBounds: () => bounds, getZoom: () => zoom };
}

describe('reportGlViewport', () => {
  it('reports the visible box with the zoom on the raster tile scale', () => {
    const report = vi.fn();
    reportGlViewport(fakeMap(10, { south: 47, west: 11, north: 48, east: 12 }), report);
    // The GL engine counts on 512 px tiles; a raster tile's zoom is one step further in.
    expect(report).toHaveBeenCalledWith({ south: 47, west: 11, north: 48, east: 12 }, 11);
  });

  it('says nothing while the map has no bounds yet', () => {
    const report = vi.fn();
    reportGlViewport(fakeMap(10, null), report);
    expect(report).not.toHaveBeenCalled();
  });

  it('asks nothing of the map when no one listens', () => {
    const map = fakeMap(10, { south: 47, west: 11, north: 48, east: 12 });
    const getZoom = vi.spyOn(map, 'getZoom');
    reportGlViewport(map, undefined);
    expect(getZoom).not.toHaveBeenCalled();
  });
});
