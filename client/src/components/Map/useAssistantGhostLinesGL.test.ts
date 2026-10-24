/**
 * FE-MAP-ROUTE-GL-001 to FE-MAP-ROUTE-GL-005
 *
 * The chat's routes on the GL map, the twin of the Leaflet layer: one
 * GeoJSON source (lines with their rims and dashes, grades, ends, the lit
 * line's stops) added the first time there is a route and again after a
 * basemap rebuilds the style (never into a style still loading), and the
 * invisible line reporting the pointer, except where a place pin or a
 * cluster bubble over it takes the pointer.
 */
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { AssistantRouteLine } from '../../types/assistantMap';
import {
  type LineMap,
  ROUTE_LINE_LAYERS,
  routeLineFeatures,
  useAssistantGhostLinesGL,
} from './useAssistantGhostLinesGL';

const LINE: AssistantRouteLine = {
  id: 'c1:look:route',
  ref: 'c1',
  lines: [
    [
      [47.77, 12.59],
      [47.79, 12.62],
    ],
  ],
  color: '#0a84ff',
  casing: '#ffffff',
  ends: { start: [47.77, 12.59], end: [47.79, 12.62] },
  stops: [{ lat: 47.78, lng: 12.6, label: 'Strausshütte' }],
  tints: [
    {
      line: [
        [47.78, 12.6],
        [47.79, 12.62],
      ],
      color: '#7c3aed',
    },
  ],
};

type Listener = (event?: unknown) => void;

/** A stand-in GL map that keeps its sources, layers and listeners, and can rebuild its style. */
function fakeMap() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const sources = new Map<string, { data: unknown; setData: (data: unknown) => void }>();
  const layers: string[] = [];
  const listeners: { type: string; layer: string | null; fn: Listener }[] = [];
  const map = {
    getSource: vi.fn((id: string) => sources.get(id)),
    addSource: vi.fn((id: string, source: { data: unknown }) => {
      const entry = {
        data: source.data,
        setData: (data: unknown) => {
          entry.data = data;
        },
      };
      sources.set(id, entry);
    }),
    addLayer: vi.fn((layer: { id: string }) => layers.push(layer.id)),
    getLayer: vi.fn((): unknown => undefined),
    isStyleLoaded: vi.fn(() => true),
    queryRenderedFeatures: vi.fn((): unknown[] => []),
    getContainer: () => container,
    on: vi.fn((type: string, layerOrFn: string | Listener, fn?: Listener) => {
      if (typeof layerOrFn === 'function') listeners.push({ type, layer: null, fn: layerOrFn });
      else if (fn) listeners.push({ type, layer: layerOrFn, fn });
    }),
    off: vi.fn((type: string, layerOrFn: string | Listener, fn?: Listener) => {
      const target = typeof layerOrFn === 'function' ? layerOrFn : fn;
      const index = listeners.findIndex((l) => l.type === type && l.fn === target);
      if (index >= 0) listeners.splice(index, 1);
    }),
  };
  const fire = (type: string, layer: string | null, event?: unknown) =>
    listeners.filter((l) => l.type === type && l.layer === layer).forEach((l) => l.fn(event));
  const restyle = () => {
    sources.clear();
    layers.length = 0;
    fire('styledata', null);
  };
  const data = () => sources.get('assistant-route-lines')?.data as ReturnType<typeof routeLineFeatures> | undefined;
  return { map, container, layers, listeners, fire, restyle, data };
}

function mount(fake: ReturnType<typeof fakeMap>, lines: AssistantRouteLine[], handlers = {}) {
  const mapRef = { current: fake.map as unknown as LineMap };
  return renderHook(
    (props: { lines: AssistantRouteLine[] }) =>
      useAssistantGhostLinesGL({ mapRef, mapReady: true, lines: props.lines, ...handlers }),
    { initialProps: { lines } }
  );
}

describe('useAssistantGhostLinesGL', () => {
  it('FE-MAP-ROUTE-GL-001: a route is its line, its grade and its ends, in GeoJSON order; its stops only while lit', () => {
    const calm = routeLineFeatures([{ ...LINE, dim: true, dashed: true }]);
    expect(calm.features.map((f) => f.properties.kind)).toEqual(['line', 'tint', 'end', 'end']);
    expect(calm.features[0]?.properties).toMatchObject({ ref: 'c1', dashed: true, hot: false, opacity: 0.45 });
    expect(calm.features[0]?.geometry).toEqual({
      type: 'MultiLineString',
      coordinates: [
        [
          [12.59, 47.77],
          [12.62, 47.79],
        ],
      ],
    });
    expect(calm.features[3]?.properties).toMatchObject({ fill: '#ffffff', stroke: '#0a84ff', strokeWidth: 3 });

    const lit = routeLineFeatures([{ ...LINE, hot: true }]);
    expect(lit.features[lit.features.length - 1]).toMatchObject({
      properties: { kind: 'stop', label: 'Strausshütte' },
      geometry: { type: 'Point', coordinates: [12.6, 47.78] },
    });
  });

  it('FE-MAP-ROUTE-GL-002: nothing is added before a route; then one source and its layers, new data on change, back after a restyle', () => {
    const fake = fakeMap();
    const hook = mount(fake, []);
    expect(fake.map.addSource).not.toHaveBeenCalled();

    hook.rerender({ lines: [LINE] });
    expect(fake.map.addSource).toHaveBeenCalledTimes(1);
    expect(fake.layers).toEqual([
      ROUTE_LINE_LAYERS.casing,
      ROUTE_LINE_LAYERS.line,
      ROUTE_LINE_LAYERS.dashed,
      ROUTE_LINE_LAYERS.tint,
      ROUTE_LINE_LAYERS.ends,
      ROUTE_LINE_LAYERS.stops,
      ROUTE_LINE_LAYERS.hit,
    ]);
    expect(fake.data()?.features).toHaveLength(4);

    hook.rerender({ lines: [{ ...LINE, hot: true }] });
    expect(fake.map.addSource).toHaveBeenCalledTimes(1);
    expect(fake.data()?.features).toHaveLength(5);

    fake.restyle();
    expect(fake.map.addSource).toHaveBeenCalledTimes(2);
    expect(fake.data()?.features).toHaveLength(5);

    hook.rerender({ lines: [] });
    expect(fake.data()?.features).toHaveLength(0);
  });

  it("FE-MAP-ROUTE-GL-003: the pointer onto, along and off a route, a tap on it, and a stop's name; unmounting lets go", () => {
    const fake = fakeMap();
    const onHover = vi.fn();
    const onPoint = vi.fn();
    const hook = mount(fake, [LINE], { onHover, onPoint });
    const feature = { features: [{ properties: { ref: 'c1' } }] };
    fake.fire('mousemove', ROUTE_LINE_LAYERS.hit, { ...feature, lngLat: { lng: 12.6, lat: 47.78 } });
    fake.fire('click', ROUTE_LINE_LAYERS.hit, { ...feature, lngLat: { lng: 12.61, lat: 47.79 } });
    fake.fire('mouseleave', ROUTE_LINE_LAYERS.hit);
    expect(onHover.mock.calls).toEqual([['c1'], [null]]);
    expect(onPoint.mock.calls).toEqual([
      ['c1', 47.78, 12.6],
      ['c1', 47.79, 12.61],
    ]);

    const stop = { features: [{ properties: { label: 'Strausshütte' } }], lngLat: { lng: 12.6, lat: 47.78 } };
    fake.fire('mousemove', ROUTE_LINE_LAYERS.stops, { ...stop, point: { x: 40, y: 50 } });
    expect(fake.container.querySelector('[data-testid="assistant-route-label"]')).toHaveTextContent('Strausshütte');

    hook.unmount();
    expect(fake.listeners).toHaveLength(0);
  });

  it('FE-MAP-ROUTE-GL-004: a tap or a pointer on a place pin or a cluster bubble over a route is left to the pin', () => {
    const fake = fakeMap();
    const onHover = vi.fn();
    const onPoint = vi.fn();
    mount(fake, [LINE], { onHover, onPoint });
    const point = { x: 40, y: 50 };
    const at = { features: [{ properties: { ref: 'c1' } }], lngLat: { lng: 12.6, lat: 47.78 }, point };

    const marker = document.createElement('div');
    marker.className = 'maplibregl-marker';
    const photo = marker.appendChild(document.createElement('img'));
    fake.fire('click', ROUTE_LINE_LAYERS.hit, { ...at, originalEvent: { target: photo } });
    fake.fire('mousemove', ROUTE_LINE_LAYERS.hit, { ...at, originalEvent: { target: photo } });
    expect(onPoint).not.toHaveBeenCalled();
    expect(onHover.mock.calls).toEqual([[null]]);

    fake.map.getLayer.mockReturnValue({});
    fake.map.queryRenderedFeatures.mockReturnValue([{ id: 7 }]);
    fake.fire('click', ROUTE_LINE_LAYERS.hit, at);
    expect(onPoint).not.toHaveBeenCalled();
    expect(fake.map.queryRenderedFeatures).toHaveBeenCalledWith(at.point, {
      layers: ['trip-place-clusters-circle', 'trip-place-clusters-count'],
    });

    // Off the bubbles the line takes the tap again.
    fake.map.queryRenderedFeatures.mockReturnValue([]);
    fake.fire('click', ROUTE_LINE_LAYERS.hit, at);
    expect(onPoint).toHaveBeenCalledWith('c1', 47.78, 12.6);
  });

  it('FE-MAP-ROUTE-GL-005: a route that comes while a new basemap is loading is put on once the style is ready', () => {
    const fake = fakeMap();
    fake.map.isStyleLoaded.mockReturnValue(false);
    mount(fake, [LINE]);
    expect(fake.map.addSource).not.toHaveBeenCalled();

    fake.map.isStyleLoaded.mockReturnValue(true);
    fake.fire('styledata', null);
    expect(fake.map.addSource).toHaveBeenCalledTimes(1);
    expect(fake.data()?.features).toHaveLength(4);
  });
});
