import type mapboxgl from 'mapbox-gl';
import { describe, expect, it, vi } from 'vitest';
import type { Place } from '../../types';
import { addGpxTrackLayers, GPX_HIT_LAYER_ID, hasGpxTrackLayers, selectGpxTrack, setGpxTracks } from './gpxTrackLayers';

function fakeMap() {
  const layers = new Map<string, { filter?: unknown }>();
  const sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>();
  const map = {
    addSource: vi.fn((id: string) => sources.set(id, { setData: vi.fn() })),
    getSource: (id: string) => sources.get(id),
    addLayer: vi.fn((layer: { id: string; filter?: unknown }) => layers.set(layer.id, { filter: layer.filter })),
    getLayer: (id: string) => layers.get(id),
    setFilter: vi.fn((id: string, filter: unknown) => layers.set(id, { filter })),
  };
  return { map: map as unknown as mapboxgl.Map, layers, sources, raw: map };
}

describe('gpxTrackLayers (PR1-08)', () => {
  it('adds the rim, the line, the picked track and the hit line once, picking nothing yet', () => {
    const { map, layers } = fakeMap();
    expect(hasGpxTrackLayers(map)).toBe(false);
    addGpxTrackLayers(map);
    expect(hasGpxTrackLayers(map)).toBe(true);
    expect([...layers.keys()]).toEqual([
      'trip-gpx-casing',
      'trip-gpx-line',
      'trip-gpx-selected-casing',
      'trip-gpx-selected',
      GPX_HIT_LAYER_ID,
    ]);
    expect(layers.get('trip-gpx-selected')?.filter).toEqual(['==', ['get', 'place_id'], -1]);
  });

  it('puts only places with a drawable track into the source, with their colour and rim', () => {
    const { map, sources } = fakeMap();
    addGpxTrackLayers(map);
    const track = { id: 5, route_geometry: '[[47,11],[47.1,11.1]]', route_color: '#ff0000' } as Place;
    const plain = { id: 6, route_geometry: null } as Place;
    setGpxTracks(map, [track, plain]);
    const data = sources.get('trip-gpx')?.setData.mock.calls[0]?.[0];
    expect(data.features).toHaveLength(1);
    expect(data.features[0].properties).toEqual({ color: '#ff0000', cased: true, place_id: 5 });
    expect(data.features[0].geometry.coordinates).toEqual([
      [11, 47],
      [11.1, 47.1],
    ]);
  });

  it('points the picked layers at the selected place, and at none again when nothing is picked', () => {
    const { map, layers } = fakeMap();
    addGpxTrackLayers(map);
    selectGpxTrack(map, 5);
    expect(layers.get('trip-gpx-selected')?.filter).toEqual(['==', ['get', 'place_id'], 5]);
    expect(layers.get('trip-gpx-selected-casing')?.filter).toEqual(['==', ['get', 'place_id'], 5]);
    selectGpxTrack(map, null);
    expect(layers.get('trip-gpx-selected')?.filter).toEqual(['==', ['get', 'place_id'], -1]);
  });

  it('does nothing before the style has its layers', () => {
    const { map, raw } = fakeMap();
    selectGpxTrack(map, 5);
    setGpxTracks(map, []);
    expect(raw.setFilter).not.toHaveBeenCalled();
  });
});
