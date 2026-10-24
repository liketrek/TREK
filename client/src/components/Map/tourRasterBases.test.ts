import { describe, expect, it, vi } from 'vitest';
import { isOnTermsBase, tileHealthHandlers, TOUR_RASTER_BASES, tourRasterBaseOf } from './tourRasterBases';

// FE-MAP-TOURBASES-001 to FE-MAP-TOURBASES-003

describe('tourRasterBases (MAP-01, BIK-06)', () => {
  it('FE-MAP-TOURBASES-001: knows topo, OpenHikingMap and CyclOSM, CyclOSM on its three shards', () => {
    expect(tourRasterBaseOf('topo')).toBe(TOUR_RASTER_BASES.topo);
    expect(tourRasterBaseOf('cycle')?.tiles).toEqual([
      'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      'https://b.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
      'https://c.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    ]);
    expect(tourRasterBaseOf('cycle')?.maxZoom).toBe(20);
    expect(tourRasterBaseOf('satellite')).toBeNull();
    // Inherited names are no base map.
    expect(tourRasterBaseOf('toString')).toBeNull();
  });

  it('FE-MAP-TOURBASES-002: the maps on terms carry their credit; topo is no map on terms', () => {
    expect(isOnTermsBase('hiking')).toBe(true);
    expect(isOnTermsBase('cycle')).toBe(true);
    expect(isOnTermsBase('topo')).toBe(false);
    expect(isOnTermsBase('default')).toBe(false);
    expect(TOUR_RASTER_BASES.cycle.onTerms?.credit.map((part) => part.href)).toEqual([
      'https://www.cyclosm.org',
      'https://www.openstreetmap.org/copyright',
    ]);
    expect(TOUR_RASTER_BASES.hiking.onTerms?.credit).toHaveLength(3);
  });

  it('FE-MAP-TOURBASES-003: a Leaflet layer reports into the health of the map watched, and only of that one', () => {
    const health = { base: 'cycle' as const, down: false, onTileError: vi.fn(), onTileLoad: vi.fn() };
    expect(tileHealthHandlers(health, 'cycle')).toEqual({ tileerror: health.onTileError, tileload: health.onTileLoad });
    expect(tileHealthHandlers(health, 'hiking')).toBeUndefined();
    expect(tileHealthHandlers(undefined, 'cycle')).toBeUndefined();
  });
});
