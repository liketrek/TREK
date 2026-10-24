import { describe, expect, it } from 'vitest';
import { baseLayerFor, PISTE_OVERLAY, tourMapLayersFor } from './tourMapLayers';

describe('tourMapLayersFor (MAP-01)', () => {
  it('offers OpenHikingMap to a hike only while the admin allows it', () => {
    expect(tourMapLayersFor('hike').bases).not.toContain('hiking');
    expect(tourMapLayersFor('hike', { hikingMap: true }).bases).toEqual(['default', 'topo', 'hiking', 'satellite']);
    expect(tourMapLayersFor('hike', { hikingMap: true }).overlays).toEqual(['ferratas']);
    expect(tourMapLayersFor('kayak', { hikingMap: true }).bases).not.toContain('hiking');
    expect(tourMapLayersFor(null, { hikingMap: true }).bases).not.toContain('hiking');
  });

  it('falls back to the standard map once the admin withdrew it, keeping the choice for later', () => {
    expect(baseLayerFor(tourMapLayersFor('hike', { hikingMap: true }), 'hiking')).toBe('hiking');
    expect(baseLayerFor(tourMapLayersFor('hike'), 'hiking')).toBe('default');
  });

  it('SKI-02: a ski track gets the standard map, topo and satellite, the pistes and no via ferratas', () => {
    expect(tourMapLayersFor('ski')).toEqual({
      bases: ['default', 'topo', 'satellite'],
      defaultBase: 'default',
      overlays: ['pistes'],
    });
    expect(baseLayerFor(tourMapLayersFor('ski'), 'hiking')).toBe('default');
  });

  it('SKI-02: the pistes are offered to a ski track only, never to a hike, a bike tour, a run, a paddle tour or another type', () => {
    expect(tourMapLayersFor('ski').overlays).toContain('pistes');
    for (const type of ['hike', 'bike', 'run', 'kayak', 'walk', null] as const)
      expect(tourMapLayersFor(type).overlays).not.toContain('pistes');
  });

  it("SKI-01: the piste layer is OpenSnowMap's overlay alone, from zoom 9 to 18, credited to OpenSnowMap and OpenStreetMap", () => {
    expect(PISTE_OVERLAY.url).toBe('https://tiles.opensnowmap.org/pistes/{z}/{x}/{y}.png');
    expect([PISTE_OVERLAY.minZoom, PISTE_OVERLAY.maxZoom]).toEqual([9, 18]);
    expect(PISTE_OVERLAY.attribution).toContain('OpenSnowMap.org');
    expect(PISTE_OVERLAY.attribution).toContain('CC BY-SA');
    expect(PISTE_OVERLAY.attribution).toContain('OpenStreetMap');
  });
});
