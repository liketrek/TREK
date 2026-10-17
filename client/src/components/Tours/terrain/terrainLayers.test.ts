import type { Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it, vi } from 'vitest';
import { OPENFREEMAP_DEFAULT_STYLE } from '../../Map/glProviders';
import {
  addTerrainLayers,
  corridorPoints,
  DEM_SOURCE,
  frameBounds,
  loadedTemplates,
  riderElement,
  sidePadding,
  styleFor,
  TRACK_SOURCE,
  trackData,
  waypointPinElement,
} from './terrainLayers';
import { GRADE_BANDS } from './tourTerrainModel';

const climb = Array.from({ length: 4 }, (_, i) => ({
  distanceMeters: i * 100,
  elevationMeters: i * 20,
  lat: 46 + i / 1000,
  lng: 7 + i / 1000,
}));

function fakeMap(sources: Record<string, unknown> = {}) {
  const added = new Map<string, unknown>(Object.entries(sources));
  const map = {
    getSource: vi.fn((id: string) => added.get(id)),
    addSource: vi.fn((id: string, source: unknown) => added.set(id, source)),
    addLayer: vi.fn(),
    setTerrain: vi.fn(),
    setSky: vi.fn(),
    getStyle: vi.fn(() => ({ sources: Object.fromEntries(added) })),
  };
  return { map, gl: map as unknown as MapLibreMap };
}

describe('styleFor', () => {
  it('drapes the planner base layers over the terrain', () => {
    expect(styleFor('default')).toBe(OPENFREEMAP_DEFAULT_STYLE);
    const topo = styleFor('topo');
    const satellite = styleFor('satellite');
    if (typeof topo === 'string' || typeof satellite === 'string') throw new Error('expected raster styles');
    expect(topo.sources.base).toMatchObject({ type: 'raster', maxzoom: 17 });
    expect(JSON.stringify(topo)).not.toContain('{s}');
    expect(satellite.sources.base).toMatchObject({ type: 'raster', maxzoom: 19 });
  });
});

describe('trackData', () => {
  it('paints each piece of the open tour in its grade band', () => {
    const data = trackData(climb, null, 'grade', '#0a84ff');
    expect(data.features).toHaveLength(3);
    expect(data.features[0].properties.color).toBe(GRADE_BANDS.find((band) => band.key === 'steep')?.paint);
    expect(data.features[0].geometry.coordinates).toEqual([
      [7, 46],
      [7.001, 46.001],
    ]);
  });

  it('paints the open tour in its own colour when asked', () => {
    const data = trackData(climb, null, 'tour', '#123456');
    expect(data.features.every((feature) => feature.properties.color === '#123456')).toBe(true);
  });

  it('draws the planner routes, as [lng, lat], while no tour is open', () => {
    const data = trackData(
      [],
      [
        [
          [46, 7],
          [46.1, 7.1],
        ],
        [[47, 8]],
      ],
      'grade',
      '#0a84ff'
    );
    expect(data.features).toHaveLength(1);
    expect(data.features[0].geometry.coordinates).toEqual([
      [7, 46],
      [7.1, 46.1],
    ]);
    expect(trackData([], null, 'grade', '#0a84ff').features).toEqual([]);
  });
});

describe('frameBounds', () => {
  const empty = trackData([], null, 'grade', '#0a84ff');

  it('frames the drawn route first', () => {
    expect(frameBounds(trackData(climb, null, 'grade', '#0a84ff'), [{ lat: 0, lng: 0 }], [])).toEqual([
      [7, 46],
      [7.003, 46.003],
    ]);
  });

  it('frames the control points while there is no route', () => {
    expect(
      frameBounds(
        empty,
        [
          { lat: 46, lng: 7 },
          { lat: 47, lng: 8 },
        ],
        [[1, 1]]
      )
    ).toEqual([
      [7, 46],
      [8, 47],
    ]);
  });

  it('frames what the flat map framed, with room around a lone point', () => {
    const bounds = frameBounds(empty, [], [[46, 7]]);
    expect(bounds?.[0][0]).toBeCloseTo(6.98);
    expect(bounds?.[0][1]).toBeCloseTo(45.98);
    expect(bounds?.[1][0]).toBeCloseTo(7.02);
    expect(bounds?.[1][1]).toBeCloseTo(46.02);
    expect(frameBounds(empty, [], [])).toBeNull();
  });
});

describe('camera and markers', () => {
  it('pads the camera by the panels on their own sides', () => {
    expect(sidePadding({ leftWidth: 300, rightWidth: 420 }, 40)).toEqual({ left: 340, right: 460 });
  });

  it('keeps one corridor point every 150 m that has a position', () => {
    const samples = [
      { distanceMeters: 0, elevationMeters: 0, lat: 46, lng: 7 },
      { distanceMeters: 100, elevationMeters: 0, lat: 46.001, lng: 7 },
      { distanceMeters: 160, elevationMeters: 0 },
      { distanceMeters: 200, elevationMeters: 0, lat: 46.002, lng: 7 },
      { distanceMeters: 400, elevationMeters: 0, lat: 46.004, lng: 7 },
    ];
    expect(corridorPoints(samples)).toEqual([
      { lat: 46, lng: 7 },
      { lat: 46.002, lng: 7 },
      { lat: 46.004, lng: 7 },
    ]);
  });

  it('draws the rider in the tour colour', () => {
    expect(riderElement('rgb(1, 2, 3)').style.background).toBe('rgb(1, 2, 3)');
  });

  it('numbers a control point and shows whether it can be dragged', () => {
    const pin = waypointPinElement(2, true, true);
    expect(pin.textContent).toBe('3');
    expect(pin.getAttribute('aria-label')).toBe('Waypoint 3');
    expect(pin.style.width).toBe('30px');
    expect(pin.style.cursor).toBe('grab');
    const fixed = waypointPinElement(0, false, false);
    expect(fixed.style.width).toBe('26px');
    expect(fixed.style.cursor).toBe('pointer');
  });
});

describe('map layers', () => {
  it('adds the elevation model, the hillshade and the track with its casing', () => {
    const { map, gl } = fakeMap();
    const data = trackData(climb, null, 'grade', '#0a84ff');
    addTerrainLayers(gl, data, 1.5);
    expect(map.setTerrain).toHaveBeenCalledWith({ source: DEM_SOURCE, exaggeration: 1.5 });
    expect(map.addSource).toHaveBeenCalledWith(TRACK_SOURCE, { type: 'geojson', data });
    expect(map.addLayer.mock.calls.map(([layer]) => (layer as { id: string }).id)).toEqual([
      'tour-terrain-hillshade',
      'tour-terrain-casing',
      'tour-terrain-line',
    ]);
    expect(map.setSky).toHaveBeenCalledTimes(1);
  });

  it('keeps the elevation sources across a style swap', () => {
    const { map, gl } = fakeMap({ [DEM_SOURCE]: {}, 'tour-terrain-hillshade-dem': {} });
    addTerrainLayers(gl, trackData([], null, 'grade', '#0a84ff'), 2);
    expect(map.addSource).toHaveBeenCalledTimes(1);
  });

  it('lists the tiled sources to preload, without the hillshade copy and the track', () => {
    const { gl } = fakeMap({
      base: { tiles: ['https://tiles/{z}/{x}/{y}.png'], maxzoom: 19 },
      [DEM_SOURCE]: { tiles: ['https://dem/{z}/{x}/{y}.png'], minzoom: 0, maxzoom: 15 },
      'tour-terrain-hillshade-dem': { tiles: ['https://dem/{z}/{x}/{y}.png'] },
      [TRACK_SOURCE]: { tiles: ['nope'] },
      vector: {},
    });
    expect(loadedTemplates(gl)).toEqual([
      { url: 'https://tiles/{z}/{x}/{y}.png', minzoom: 0, maxzoom: 19 },
      { url: 'https://dem/{z}/{x}/{y}.png', minzoom: 0, maxzoom: 15 },
    ]);
  });
});
