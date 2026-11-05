import { describe, expect, it, vi } from 'vitest';

import {
  type ClusterMap,
  PLACE_CLUSTER_SOURCE_ID,
  addPlaceClusterLayers,
  clusterBubbleSize,
  createClusterBubble,
  drawClusterBubbles,
} from './placeClusterLayers';

function fakeMap(features: unknown[], expansionZoom: unknown = 11) {
  const source = { getClusterExpansionZoom: vi.fn(() => expansionZoom) };
  const map = {
    addSource: vi.fn(),
    addLayer: vi.fn(),
    getSource: vi.fn((id: string) => (id === PLACE_CLUSTER_SOURCE_ID ? source : undefined)),
    easeTo: vi.fn(),
    querySourceFeatures: vi.fn((_id: string, query: { filter: unknown[] }) =>
      query.filter[0] === 'has' ? features : []
    ),
  };
  return { map: map as unknown as ClusterMap & typeof map, source };
}

describe('cluster bubbles', () => {
  it('FE-COMP-PLACECLUSTER-001: a bubble grows in three steps with its count', () => {
    expect([1, 9, 10, 49, 50, 500].map(clusterBubbleSize)).toEqual([36, 36, 42, 42, 48, 48]);
  });

  it('FE-COMP-PLACECLUSTER-002: the GL bubble is the Leaflet markup inside a bare wrapper the pin can move', () => {
    const wrapper = createClusterBubble(38);
    expect(wrapper.className).toBe('');
    const bubble = wrapper.firstElementChild as HTMLElement;
    expect(bubble.className).toBe('marker-cluster-custom');
    expect(bubble.style.width).toBe('42px');
    expect(bubble.style.height).toBe('42px');
    expect(bubble.textContent).toBe('38');
  });

  it('FE-COMP-PLACECLUSTER-003: the canvas circle and count stay as an invisible hit area', () => {
    const { map } = fakeMap([]);
    addPlaceClusterLayers(map);
    expect(map.addSource).toHaveBeenCalledWith(PLACE_CLUSTER_SOURCE_ID, expect.objectContaining({ cluster: true }));
    const layers = map.addLayer.mock.calls.map(([layer]) => layer as { id: string; paint: Record<string, unknown> });
    expect(layers.find((l) => l.id === 'trip-place-clusters-circle')?.paint['circle-opacity']).toBe(0);
    expect(layers.find((l) => l.id === 'trip-place-clusters-count')?.paint['text-opacity']).toBe(0);
  });

  it('FE-COMP-PLACECLUSTER-004: one bubble per cluster, placed at its centre, that zooms in on a click', () => {
    const cluster = { properties: { cluster_id: 5, point_count: 12 }, geometry: { coordinates: [139.7, 35.6] } };
    const { map, source } = fakeMap([
      cluster,
      cluster, // the same cluster crossing a tile edge
      { properties: { cluster_id: 6 }, geometry: { coordinates: [1, 1] } }, // no count
      { properties: { cluster_id: 7, point_count: 3 } }, // no geometry
    ]);
    const placed: { el: HTMLElement; lng: number; lat: number }[] = [];
    const pins = drawClusterBubbles(map, (el, lng, lat) => {
      placed.push({ el, lng, lat });
      return lng;
    });

    expect(pins).toEqual([139.7]);
    expect(placed[0].el.textContent).toBe('12');
    expect(placed[0].lat).toBe(35.6);

    const onMapClick = vi.fn();
    document.body.appendChild(placed[0].el);
    document.body.addEventListener('click', onMapClick);
    placed[0].el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    document.body.removeEventListener('click', onMapClick);
    placed[0].el.remove();

    // The click is the bubble's: the map underneath never sees it.
    expect(onMapClick).not.toHaveBeenCalled();
    expect(source.getClusterExpansionZoom).toHaveBeenCalledWith(5, expect.any(Function));
    expect(map.easeTo).toHaveBeenCalledWith({ center: [139.7, 35.6], zoom: 11, duration: 350 });
  });

  it('FE-COMP-PLACECLUSTER-005: a source that reports nothing draws nothing', () => {
    const { map } = fakeMap([]);
    map.querySourceFeatures.mockReturnValue(null as never);
    expect(drawClusterBubbles(map, () => 1)).toEqual([]);
  });
});
