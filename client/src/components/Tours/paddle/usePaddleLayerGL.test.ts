/**
 * FE-PADDLE-GL-001 to FE-PADDLE-GL-017: the paddle objects on a MapLibre or
 * Mapbox GL map, and the hit test the map's own click handler asks first.
 *
 * Pinned: one source and seven layers bottom to top, the ones only in the area
 * from PADDLE_AREA_MIN_ZOOM on; each object as a line and a marker that say
 * how it stands to the route; a pick or new objects replace the source's data
 * in place, and a styledata never hands the same data over twice; a style
 * still loading, or one a basemap change rebuilt, takes the layers on its next
 * styledata; one map-level click picks the top hit's object; the pointer turns
 * into a hand over the layers a click can land on; the plain and the picked
 * look of every marker are drawn once, never after the layer went; without
 * objects the layers and the source go; a map without the methods is no hit.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import type { PaddleFeature, PaddleGeometry, PaddleObstacleKind, RelatedObstacle } from '@trek/shared';

import {
  PADDLE_AREA_MIN_ZOOM,
  paddleMapItems,
  paddleMarkerImageId,
  paddleMarkerSvg,
  type PaddleMapItem,
  type PaddleMapLayer,
} from './paddleMapLayer';
import type { PaddlePaint } from './paddlePaint';
import { isPaddleHit, usePaddleLayerGL, type PaddleGlMap } from './usePaddleLayerGL';

/** Test colours standing in for the theme tokens (styles/paddle.css), distinct so each can be told apart. */
const PAINT: PaddlePaint = {
  obstacle: '#334155',
  access: '#4338ca',
  landing: '#0f766e',
  portage: '#9a6233',
  disc: '#ffffff',
  shadow: 'rgba(15, 23, 42, 0.35)',
};

const SOURCE = 'trek-paddle';
const CASING = 'trek-paddle-casing';
const CASING_AREA = 'trek-paddle-casing-area';
const LINE = 'trek-paddle-line';
const LINE_NEAR = 'trek-paddle-line-near';
const LINE_AREA = 'trek-paddle-line-area';
const PINS = 'trek-paddle-pins';
const PINS_AREA = 'trek-paddle-pins-area';
/** Bottom to top, as the hook adds them. */
const LAYERS = [CASING_AREA, CASING, LINE_AREA, LINE, LINE_NEAR, PINS_AREA, PINS];
/** The layers a click can land on, the markers first. */
const HIT_LAYERS = [PINS, PINS_AREA, LINE, LINE_NEAR, LINE_AREA];

function feature(ref: string, kind: PaddleObstacleKind, geometry: PaddleGeometry): PaddleFeature {
  return { ref, kind, group_key: null, name: null, geometry, tags: {}, tag_hash: 'h', region_id: 'r1' };
}

const LOCK_LINE: [number, number][] = [
  [11.1, 48.1],
  [11.11, 48.11],
];
const WEIR_LINE: [number, number][] = [
  [11.2, 48.2],
  [11.21, 48.21],
  [11.22, 48.22],
];
const PORTAGE_LINE: [number, number][] = [
  [11.3, 48.3],
  [11.31, 48.31],
];
const LOCK = feature('way/1', 'lock', { type: 'LineString', coordinates: LOCK_LINE });
const WEIR = feature('way/2', 'weir', { type: 'LineString', coordinates: WEIR_LINE });
const PORTAGE = feature('way/3', 'portage', { type: 'LineString', coordinates: PORTAGE_LINE });
const PUT_IN = feature('node/4', 'put_in', { type: 'Point', coordinates: [11.4, 48.4] });
const SLIPWAY = feature('node/5', 'slipway', { type: 'Point', coordinates: [11.5, 48.5] });
const RELATED: RelatedObstacle[] = [
  { feature: LOCK, relation: 'on_route', distanceM: 0, alongM: 1200 },
  { feature: WEIR, relation: 'near', distanceM: 90, alongM: 3400 },
];
/** A lock on the route, a weir near it, three objects only in the area; the put-in and the slipway look alike. */
const ITEMS = paddleMapItems([LOCK, WEIR, PORTAGE, PUT_IN, SLIPWAY], RELATED, PAINT);

function itemOf(ref: string): PaddleMapItem {
  const item = ITEMS.find((entry) => entry.feature.ref === ref);
  if (!item) throw new Error(`no paddle item ${ref}`);
  return item;
}

function layerOf(items: PaddleMapItem[], selectedRef: string | null = null, onSelect = vi.fn()): PaddleMapLayer {
  return { items, selectedRef, selectedKey: null, onSelect };
}

const looksOf = (item: PaddleMapItem) => [paddleMarkerImageId(item, false), paddleMarkerImageId(item, true)];
const svgUrl = (item: PaddleMapItem, selected: boolean) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(paddleMarkerSvg(item, selected))}`;

const drawn: FakeImage[] = [];

/** jsdom never decodes an image, so these load when a test says so. */
class FakeImage {
  onload: (() => void) | null = null;
  src = '';
  readonly width: number;

  constructor(width: number) {
    this.width = width;
    drawn.push(this);
  }
}

const loadImages = () => drawn.forEach((image) => image.onload?.());

type Handler = (event?: unknown) => void;

interface Hit {
  properties: Record<string, unknown> | null;
}

interface LayerSpec {
  id: string;
  type: string;
  source: string;
  minzoom?: number;
  paint?: Record<string, unknown>;
}

interface FakeFeature {
  geometry: unknown;
  properties: Record<string, unknown> | null;
}

interface FakeData {
  features: FakeFeature[];
}

interface FakeSource {
  data: FakeData;
  setData: Mock<(next: FakeData) => void>;
}

function fakeGlMap() {
  const sources = new Map<string, FakeSource>();
  const layers = new Set<string>();
  const images = new Set<string>();
  const handlers = new Map<string, Set<Handler>>();
  const state = { loading: false, removed: false, hits: [] as Hit[] };
  const canvas = document.createElement('canvas');
  const keyOf = (type: string, layer: unknown) => (typeof layer === 'string' ? `${type}:${layer}` : type);
  const map = {
    getSource: vi.fn((id: string) => sources.get(id)),
    addSource: vi.fn((id: string, spec: { type: string; data: FakeData }) => {
      // Like a style still loading: the map takes no source yet.
      if (state.loading) throw new Error('Style is not done loading.');
      const source: FakeSource = {
        data: spec.data,
        setData: vi.fn((next: FakeData) => {
          source.data = next;
        }),
      };
      sources.set(id, source);
    }),
    removeSource: vi.fn((id: string) => {
      sources.delete(id);
    }),
    // Like MapLibre once its view went away: asking it for a layer throws.
    getLayer: vi.fn((id: string) => {
      if (state.removed) throw new TypeError('this.style is undefined');
      return layers.has(id) ? { id } : undefined;
    }),
    addLayer: vi.fn((spec: LayerSpec) => {
      layers.add(spec.id);
    }),
    removeLayer: vi.fn((id: string) => {
      layers.delete(id);
    }),
    hasImage: vi.fn((id: string) => images.has(id)),
    addImage: vi.fn((id: string) => {
      images.add(id);
    }),
    queryRenderedFeatures: vi.fn(() => state.hits),
    getCanvas: vi.fn(() => canvas),
    on: vi.fn((type: string, layerOrFn: unknown, fn?: Handler) => {
      const key = keyOf(type, layerOrFn);
      const set = handlers.get(key) ?? new Set<Handler>();
      set.add((fn ?? layerOrFn) as Handler);
      handlers.set(key, set);
    }),
    off: vi.fn((type: string, layerOrFn: unknown, fn?: Handler) => {
      handlers.get(keyOf(type, layerOrFn))?.delete((fn ?? layerOrFn) as Handler);
    }),
  };
  return {
    map: map as unknown as PaddleGlMap,
    spies: map,
    state,
    sources,
    layers,
    images,
    canvas,
    emit: (key: string, event?: unknown) => [...(handlers.get(key) ?? [])].forEach((fn) => fn(event)),
    listeners: () => [...handlers.values()].reduce((sum, set) => sum + set.size, 0),
    /** A basemap change: the rebuilt style has none of the paddle source, layers or images. */
    dropStyle: () => {
      sources.clear();
      layers.clear();
      images.clear();
    },
  };
}

type FakeGl = ReturnType<typeof fakeGlMap>;

const point = { x: 4, y: 4 };
const addedIds = (gl: FakeGl) => gl.spies.addLayer.mock.calls.map(([spec]) => spec.id);
const specOf = (gl: FakeGl, id: string) => gl.spies.addLayer.mock.calls.find(([spec]) => spec.id === id)?.[0];
const dataOf = (gl: FakeGl) => gl.sources.get(SOURCE)?.data.features ?? [];

function propsOf(gl: FakeGl, ref: string) {
  const features = dataOf(gl).filter((entry) => entry.properties?.ref === ref);
  return features.map((entry) => entry.properties);
}

function renderLayer(gl: FakeGl, layer: PaddleMapLayer | undefined) {
  return renderHook((props: { layer: PaddleMapLayer | undefined }) => usePaddleLayerGL(gl.map, props.layer), {
    initialProps: { layer },
  });
}

beforeEach(() => {
  drawn.length = 0;
  vi.stubGlobal('Image', FakeImage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('usePaddleLayerGL', () => {
  it('FE-PADDLE-GL-001: adds one source and seven layers bottom to top, the area ones from PADDLE_AREA_MIN_ZOOM on', () => {
    const gl = fakeGlMap();
    renderLayer(gl, layerOf(ITEMS));

    expect(gl.spies.addSource).toHaveBeenCalledTimes(1);
    expect(gl.spies.addSource).toHaveBeenCalledWith(SOURCE, expect.objectContaining({ type: 'geojson' }));
    expect(addedIds(gl)).toEqual(LAYERS);
    expect(gl.spies.addLayer.mock.calls.every(([spec]) => spec.source === SOURCE)).toBe(true);
    const zoomed = gl.spies.addLayer.mock.calls.filter(([spec]) => spec.minzoom === PADDLE_AREA_MIN_ZOOM);
    expect(zoomed.map(([spec]) => spec.id)).toEqual([CASING_AREA, LINE_AREA, PINS_AREA]);
    expect(specOf(gl, PINS)?.type).toBe('symbol');
    expect(specOf(gl, PINS_AREA)?.type).toBe('symbol');
    expect(specOf(gl, LINE_NEAR)?.paint?.['line-dasharray']).toEqual([2, 1.6]);
    expect(specOf(gl, LINE)?.paint?.['line-dasharray']).toBeUndefined();
  });

  it('FE-PADDLE-GL-002: draws each object as a line and a marker that say how it stands to the route', () => {
    const gl = fakeGlMap();
    renderLayer(gl, layerOf(ITEMS));
    const lock = itemOf('way/1');
    const weir = itemOf('way/2');
    const portage = itemOf('way/3');

    expect(dataOf(gl).map((entry) => entry.properties)).toEqual([
      { ref: 'way/1', color: lock.color, width: 4, opacity: 1, near: false, casing: PAINT.disc, area: false },
      { ref: 'way/1', icon: paddleMarkerImageId(lock, false), order: 2, area: false },
      { ref: 'way/2', color: weir.color, width: 3, opacity: 0.85, near: true, casing: PAINT.disc, area: false },
      { ref: 'way/2', icon: paddleMarkerImageId(weir, false), order: 1, area: false },
      { ref: 'way/3', color: portage.color, width: 2, opacity: 0.5, near: false, casing: PAINT.disc, area: true },
      { ref: 'way/3', icon: paddleMarkerImageId(portage, false), order: 0, area: true },
      { ref: 'node/4', icon: paddleMarkerImageId(itemOf('node/4'), false), order: 0, area: true },
      { ref: 'node/5', icon: paddleMarkerImageId(itemOf('node/5'), false), order: 0, area: true },
    ]);
    // GeoJSON order, [lng, lat], as the features came in; a line's marker sits in its middle.
    expect(dataOf(gl).map((entry) => entry.geometry)).toEqual([
      { type: 'LineString', coordinates: LOCK_LINE },
      { type: 'Point', coordinates: [11.11, 48.11] },
      { type: 'LineString', coordinates: WEIR_LINE },
      { type: 'Point', coordinates: [11.21, 48.21] },
      { type: 'LineString', coordinates: PORTAGE_LINE },
      { type: 'Point', coordinates: [11.31, 48.31] },
      { type: 'Point', coordinates: [11.4, 48.4] },
      { type: 'Point', coordinates: [11.5, 48.5] },
    ]);
  });

  it('FE-PADDLE-GL-003: a pick hands the source new data in place, the picked object solid, on top and out of the area', () => {
    const gl = fakeGlMap();
    const { rerender } = renderLayer(gl, layerOf(ITEMS));
    const weir = itemOf('way/2');

    rerender({ layer: layerOf(ITEMS, 'way/2') });
    expect(gl.sources.get(SOURCE)?.setData).toHaveBeenCalledTimes(1);
    expect(propsOf(gl, 'way/2')).toEqual([
      { ref: 'way/2', color: weir.color, width: 3, opacity: 0.85, near: false, casing: PAINT.disc, area: false },
      { ref: 'way/2', icon: paddleMarkerImageId(weir, true), order: 3, area: false },
    ]);

    rerender({ layer: layerOf(ITEMS, 'node/5') });
    expect(propsOf(gl, 'node/5')).toEqual([
      { ref: 'node/5', icon: paddleMarkerImageId(itemOf('node/5'), true), order: 3, area: false },
    ]);
    expect(gl.spies.addSource).toHaveBeenCalledTimes(1);
    expect(addedIds(gl)).toEqual(LAYERS);
  });

  it('FE-PADDLE-GL-004: new objects replace the source data without adding the layers again, sent once per change', () => {
    const gl = fakeGlMap();
    const { rerender } = renderLayer(gl, layerOf(ITEMS));
    // Every image the map takes fires styledata; the data it already has is not handed over again.
    gl.emit('styledata');
    expect(gl.sources.get(SOURCE)?.setData).not.toHaveBeenCalled();
    expect(drawn).toHaveLength(10);

    rerender({ layer: layerOf(ITEMS.slice(0, 1)) });
    const setData = gl.sources.get(SOURCE)?.setData;
    expect(setData).toHaveBeenCalledTimes(1);
    expect(dataOf(gl).map((entry) => entry.properties?.ref)).toEqual(['way/1', 'way/1']);

    gl.emit('styledata');
    gl.emit('styledata');
    expect(setData).toHaveBeenCalledTimes(1);
    expect(gl.spies.addSource).toHaveBeenCalledTimes(1);
    expect(addedIds(gl)).toEqual(LAYERS);
  });

  it('FE-PADDLE-GL-005: a basemap change that dropped the style brings the source, the layers and the images back', () => {
    const gl = fakeGlMap();
    const { rerender } = renderLayer(gl, layerOf(ITEMS));
    rerender({ layer: layerOf(ITEMS, 'way/2') });
    loadImages();
    const before = drawn.length;

    gl.dropStyle();
    gl.emit('styledata');

    expect(gl.spies.addSource).toHaveBeenCalledTimes(2);
    expect(addedIds(gl)).toEqual([...LAYERS, ...LAYERS]);
    expect(propsOf(gl, 'way/2')).toContainEqual(expect.objectContaining({ order: 3, area: false }));
    expect(drawn).toHaveLength(before + 10);
  });

  it('FE-PADDLE-GL-006: a style still loading takes the layers on its next styledata', () => {
    const gl = fakeGlMap();
    gl.state.loading = true;
    renderLayer(gl, layerOf(ITEMS));
    expect(gl.spies.addLayer).not.toHaveBeenCalled();

    gl.state.loading = false;
    gl.emit('styledata');
    expect(gl.spies.addSource).toHaveBeenCalledTimes(2);
    expect(addedIds(gl)).toEqual(LAYERS);
  });

  it('FE-PADDLE-GL-007: one click handler for the map picks the top hit, so a marker over a line opens only its object', () => {
    const gl = fakeGlMap();
    const onSelect = vi.fn();
    renderLayer(gl, layerOf(ITEMS, null, onSelect));
    expect(gl.spies.on.mock.calls.filter(([type]) => type === 'click')).toHaveLength(1);

    gl.state.hits = [{ properties: { ref: 'node/4' } }, { properties: { ref: 'way/3' } }];
    gl.emit('click', { point });

    expect(gl.spies.queryRenderedFeatures).toHaveBeenCalledWith(point, { layers: HIT_LAYERS });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('node/4');
  });

  it('FE-PADDLE-GL-008: a click on nothing, on a feature without a ref or before the layers exist picks nothing', () => {
    const gl = fakeGlMap();
    gl.state.loading = true;
    const onSelect = vi.fn();
    renderLayer(gl, layerOf(ITEMS, null, onSelect));

    gl.state.hits = [{ properties: { ref: 'node/4' } }];
    gl.emit('click', { point });
    expect(gl.spies.queryRenderedFeatures).not.toHaveBeenCalled();

    gl.state.loading = false;
    gl.emit('styledata');
    const misses: Hit[][] = [[], [{ properties: null }], [{ properties: { ref: 7 } }]];
    for (const hits of misses) {
      gl.state.hits = hits;
      gl.emit('click', { point });
    }
    expect(gl.spies.queryRenderedFeatures).toHaveBeenCalledTimes(misses.length);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('FE-PADDLE-GL-009: a new onSelect takes the next click without rebuilding the layers or their data', () => {
    const gl = fakeGlMap();
    const first = vi.fn();
    const next = vi.fn();
    const { rerender } = renderLayer(gl, layerOf(ITEMS, null, first));
    rerender({ layer: layerOf(ITEMS, null, next) });

    gl.state.hits = [{ properties: { ref: 'way/2' } }];
    gl.emit('click', { point });

    expect(next).toHaveBeenCalledWith('way/2');
    expect(first).not.toHaveBeenCalled();
    expect(gl.spies.addSource).toHaveBeenCalledTimes(1);
    expect(gl.sources.get(SOURCE)?.setData).not.toHaveBeenCalled();
  });

  it('FE-PADDLE-GL-010: the pointer turns into a hand over every layer a click can land on, and back on leave', () => {
    const gl = fakeGlMap();
    renderLayer(gl, layerOf(ITEMS));

    for (const id of HIT_LAYERS) {
      gl.emit(`mouseenter:${id}`);
      expect(gl.canvas.style.cursor).toBe('pointer');
      gl.emit(`mouseleave:${id}`);
      expect(gl.canvas.style.cursor).toBe('');
    }
    expect(gl.spies.on).not.toHaveBeenCalledWith('mouseenter', CASING, expect.any(Function));
    expect(gl.spies.on).not.toHaveBeenCalledWith('mouseenter', CASING_AREA, expect.any(Function));
  });

  it('FE-PADDLE-GL-011: unmounting removes every listener, and without a map nothing happens', () => {
    const gl = fakeGlMap();
    const { unmount } = renderLayer(gl, layerOf(ITEMS));
    // styledata, click, and mouseenter and mouseleave on each hit layer
    expect(gl.listeners()).toBe(2 + HIT_LAYERS.length * 2);
    unmount();
    expect(gl.listeners()).toBe(0);

    expect(() => renderHook(() => usePaddleLayerGL(null, layerOf(ITEMS)))).not.toThrow();
    expect(() => renderHook(() => usePaddleLayerGL(null, undefined))).not.toThrow();
  });

  it('FE-PADDLE-GL-012: draws the plain and the picked look of every marker once, at twice its size for sharp pixels', () => {
    const gl = fakeGlMap();
    const { rerender } = renderLayer(gl, layerOf(ITEMS));
    // Five objects with two looks each make ten images; the put-in and the slipway share theirs.
    expect(drawn).toHaveLength(10);
    loadImages();

    const looks = new Set(ITEMS.flatMap(looksOf));
    expect(looks.size).toBe(8);
    expect(gl.images).toEqual(looks);
    expect(gl.spies.addImage).toHaveBeenCalledTimes(8);
    const lock = itemOf('way/1');
    expect(gl.spies.addImage).toHaveBeenCalledWith(
      paddleMarkerImageId(lock, false),
      expect.objectContaining({ width: 60, src: svgUrl(lock, false) }),
      { pixelRatio: 2 }
    );
    expect(gl.spies.addImage).toHaveBeenCalledWith(
      paddleMarkerImageId(lock, true),
      expect.objectContaining({ width: 72, src: svgUrl(lock, true) }),
      { pixelRatio: 2 }
    );

    // Picking an object finds both looks on the map already.
    rerender({ layer: layerOf(ITEMS, 'way/1') });
    expect(drawn).toHaveLength(10);
  });

  it('FE-PADDLE-GL-013: an image that arrives after the layer went is not added', () => {
    const gl = fakeGlMap();
    const { unmount } = renderLayer(gl, layerOf(ITEMS));
    unmount();
    loadImages();
    expect(gl.spies.addImage).not.toHaveBeenCalled();
  });

  it('FE-PADDLE-GL-014: without objects the layers go top first, then the source, and the next objects bring them back', () => {
    const gl = fakeGlMap();
    const { rerender } = renderLayer(gl, layerOf(ITEMS));

    rerender({ layer: undefined });
    expect(gl.spies.removeLayer.mock.calls.map(([id]) => id)).toEqual([...LAYERS].reverse());
    expect(gl.spies.removeSource).toHaveBeenCalledWith(SOURCE);
    expect(gl.layers.size).toBe(0);
    expect(gl.sources.size).toBe(0);

    rerender({ layer: layerOf(ITEMS) });
    expect(gl.spies.addSource).toHaveBeenCalledTimes(2);
    expect(gl.layers.size).toBe(LAYERS.length);
  });

  it('FE-PADDLE-GL-015: an empty list adds and removes nothing, and a map torn down meanwhile is left alone', () => {
    const empty = fakeGlMap();
    renderLayer(empty, layerOf([]));
    expect(empty.spies.addSource).not.toHaveBeenCalled();
    expect(empty.spies.removeLayer).not.toHaveBeenCalled();
    expect(empty.spies.removeSource).not.toHaveBeenCalled();

    const torn = fakeGlMap();
    const { rerender } = renderLayer(torn, layerOf(ITEMS));
    torn.state.removed = true;
    expect(() => rerender({ layer: layerOf([]) })).not.toThrow();
    expect(torn.spies.removeLayer).not.toHaveBeenCalled();
  });
});

describe('isPaddleHit', () => {
  it('FE-PADDLE-GL-016: is a hit only when a paddle layer is on the map and has a feature under the point', () => {
    const gl = fakeGlMap();
    expect(isPaddleHit(gl.spies, point)).toBe(false);
    expect(gl.spies.queryRenderedFeatures).not.toHaveBeenCalled();

    renderLayer(gl, layerOf(ITEMS));
    expect(isPaddleHit(gl.spies, point)).toBe(false);
    expect(gl.spies.queryRenderedFeatures).toHaveBeenCalledWith(point, { layers: HIT_LAYERS });

    gl.state.hits = [{ properties: { ref: 'way/2' } }];
    expect(isPaddleHit(gl.spies, point)).toBe(true);
  });

  it('FE-PADDLE-GL-017: a map without getLayer or queryRenderedFeatures is never hit', () => {
    const query = vi.fn(() => [{}]);
    expect(isPaddleHit({}, point)).toBe(false);
    expect(isPaddleHit({ getLayer: () => ({}) }, point)).toBe(false);
    expect(isPaddleHit({ queryRenderedFeatures: query }, point)).toBe(false);
    expect(query).not.toHaveBeenCalled();
  });
});
