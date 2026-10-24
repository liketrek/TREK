/**
 * FE-FERRATA-GL-001 to FE-FERRATA-GL-013: the via ferrata layer on a
 * MapLibre or Mapbox GL map.
 *
 * Pinned: the layers go in once per map (and wait for `idle` when tiles are
 * still loading, the failure the hazard overlay had), the line is the dark
 * dashed via ferrata violet and never a grade colour, new data replaces the
 * sources' contents instead of rebuilding the layers, a click on the hit line
 * hands the ferrata and the way to `onSelect`, hover and selection highlight
 * the whole ferrata (solid, on a wider casing) and name it above the pointer,
 * the 3D terrain draws wider lines, the route icon joins once its image is drawn, a theme
 * change repaints the installed layers in place, and an unmount leaves nothing
 * behind.
 */
import { act, render, renderHook, waitFor } from '@testing-library/react';
import type { Map as MapboxMap, MapMouseEvent } from 'mapbox-gl';
import { describe, expect, it, vi } from 'vitest';

import type { Ferrata } from '@trek/shared';

import FerrataLayerGL from './FerrataLayerGL';
import { groupFerratas } from './ferrataGroups';
import { useFerrataLayerGL } from './useFerrataLayerGL';

vi.mock('./ferrataIcon', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./ferrataIcon')>()),
  loadFerrataIcon: vi.fn(() => Promise.resolve({ width: 44, height: 44 })),
}));

const SOURCE = 'trek-ferratas';
const LABEL_SOURCE = 'trek-ferratas-labels';
const CASING = 'trek-ferratas-casing';
const LINE = 'trek-ferratas-line';
const HIGHLIGHT_CASING = 'trek-ferratas-highlight-casing';
const HIGHLIGHT = 'trek-ferratas-highlight';
const HIT = 'trek-ferratas-hit';
const LABEL = 'trek-ferratas-label';
const LAYERS = [CASING, LINE, HIGHLIGHT_CASING, HIGHLIGHT, HIT];

const ferrata = (id: string, lat: number, name: string, lng = 11.7): Ferrata => ({
  id,
  name,
  grade: { raw: '2', level: 2, plus: null },
  routeName: null,
  geometry: [
    [lat, lng],
    [lat + 0.01, lng + 0.01],
  ],
  osmUrl: `https://www.openstreetmap.org/${id}`,
});

/** Two ferratas: way/1 and way/2 are one (same name, touching), way/3 another. */
const GROUPS = groupFerratas([
  ferrata('way/1', 46.5, 'Via A'),
  ferrata('way/2', 46.51, 'Via A', 11.71),
  ferrata('way/3', 47, 'Via B'),
]);

type Handler = (event?: unknown) => void;

function fakeGlMap(styleLoaded = true) {
  const sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>();
  const layers = new Set<string>();
  const images = new Set<string>();
  const handlers = new Map<string, Set<Handler>>();
  const once = new Map<string, Set<Handler>>();
  const state = { styleLoaded, removed: false, hit: null as null | { properties: { id: string; group: string } } };
  const canvas = document.createElement('canvas');
  const container = document.createElement('div');
  const keyOf = (type: string, layer?: unknown) => (typeof layer === 'string' ? `${type}:${layer}` : type);
  const map = {
    isStyleLoaded: vi.fn(() => state.styleLoaded),
    getSource: vi.fn((id: string) => sources.get(id)),
    addSource: vi.fn((id: string) => {
      sources.set(id, { setData: vi.fn() });
    }),
    removeSource: vi.fn((id: string) => {
      sources.delete(id);
    }),
    // Like MapLibre: a removed map has no style, and asking it for a layer throws.
    getStyle: vi.fn(() => (state.removed ? undefined : { version: 8 })),
    getLayer: vi.fn((id: string) => {
      if (state.removed) throw new TypeError('can\'t access property "getLayer", this.style is undefined');
      return layers.has(id) ? {} : undefined;
    }),
    addLayer: vi.fn((spec: { id: string }) => {
      layers.add(spec.id);
    }),
    removeLayer: vi.fn((id: string) => {
      layers.delete(id);
    }),
    setPaintProperty: vi.fn(),
    setFilter: vi.fn(),
    hasImage: vi.fn((id: string) => images.has(id)),
    addImage: vi.fn((id: string) => {
      images.add(id);
    }),
    removeImage: vi.fn((id: string) => {
      images.delete(id);
    }),
    queryRenderedFeatures: vi.fn(() => (state.hit ? [state.hit] : [])),
    getCanvas: vi.fn(() => canvas),
    getContainer: vi.fn(() => container),
    on: vi.fn((type: string, layerOrFn: unknown, fn?: Handler) => {
      const key = keyOf(type, layerOrFn);
      const set = handlers.get(key) ?? new Set<Handler>();
      set.add((fn ?? layerOrFn) as Handler);
      handlers.set(key, set);
    }),
    once: vi.fn((type: string, fn: Handler) => {
      const set = once.get(type) ?? new Set<Handler>();
      set.add(fn);
      once.set(type, set);
    }),
    off: vi.fn((type: string, layerOrFn: unknown, fn?: Handler) => {
      const target = (fn ?? layerOrFn) as Handler;
      handlers.get(keyOf(type, layerOrFn))?.delete(target);
      once.get(type)?.delete(target);
    }),
  };
  const emit = (key: string, event?: unknown) => [...(handlers.get(key) ?? [])].forEach((fn) => fn(event));
  return {
    map: map as unknown as MapboxMap,
    spies: map,
    state,
    sources,
    layers,
    images,
    canvas,
    container,
    emit,
    listeners: () => [...handlers.values()].reduce((sum, set) => sum + set.size, 0),
    emitIdle: () => {
      const pending = [...(once.get('idle') ?? [])];
      once.delete('idle');
      pending.forEach((fn) => fn());
    },
  };
}

const click = { point: { x: 4, y: 4 }, lngLat: { lng: 11.705, lat: 46.505 } } as unknown as MapMouseEvent;

const addedIds = (gl: ReturnType<typeof fakeGlMap>) => gl.spies.addLayer.mock.calls.map(([layer]) => layer.id);
const spec = (gl: ReturnType<typeof fakeGlMap>, id: string) =>
  gl.spies.addLayer.mock.calls.map(([layer]) => layer).find((layer) => layer.id === id) as unknown as {
    paint: Record<string, unknown>;
    filter?: unknown;
    minzoom?: number;
    layout?: Record<string, unknown>;
  };

const filterOf = (ids: string[]) => ['in', ['get', 'group'], ['literal', ids]];

describe('useFerrataLayerGL', () => {
  it('FE-FERRATA-GL-001: adds the line and label sources and the casing, line, highlight casing, highlight and hit layers, in that order', () => {
    const gl = fakeGlMap();
    renderHook(() => useFerrataLayerGL(gl.map, GROUPS, vi.fn()));

    expect(gl.spies.addSource).toHaveBeenCalledWith(SOURCE, expect.objectContaining({ type: 'geojson' }));
    expect(gl.spies.addSource).toHaveBeenCalledWith(LABEL_SOURCE, expect.objectContaining({ type: 'geojson' }));
    expect(addedIds(gl)).toEqual(LAYERS);
  });

  it('FE-FERRATA-GL-002: draws a dashed violet line on a white casing, never by grade', () => {
    const root = document.documentElement;
    root.style.setProperty('--map-ferrata', 'black');
    root.style.setProperty('--map-ferrata-casing', 'white');
    const gl = fakeGlMap();
    renderHook(() => useFerrataLayerGL(gl.map, GROUPS, vi.fn()));

    const line = spec(gl, LINE);
    expect(line.paint['line-color']).toBe('black');
    expect(line.paint['line-dasharray']).toEqual([2, 1.5]);
    expect(spec(gl, CASING).paint['line-color']).toBe('white');
    root.style.removeProperty('--map-ferrata');
    root.style.removeProperty('--map-ferrata-casing');
  });

  it('FE-FERRATA-GL-003: waits for idle when the style is still loading tiles', () => {
    const gl = fakeGlMap(false);
    renderHook(() => useFerrataLayerGL(gl.map, GROUPS, vi.fn()));
    expect(gl.spies.addSource).not.toHaveBeenCalled();

    gl.state.styleLoaded = true;
    gl.emitIdle();
    expect(addedIds(gl)).toEqual(LAYERS);
  });

  it('FE-FERRATA-GL-004: new ferratas replace the sources data without rebuilding the layers', () => {
    const gl = fakeGlMap();
    const { rerender } = renderHook(({ groups }) => useFerrataLayerGL(gl.map, groups, vi.fn()), {
      initialProps: { groups: GROUPS.slice(0, 1) },
    });
    rerender({ groups: GROUPS });

    expect(addedIds(gl)).toEqual(LAYERS);
    expect(gl.sources.get(SOURCE)?.setData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        features: [
          expect.objectContaining({ properties: { id: 'way/1', group: 'group/way/1' } }),
          expect.objectContaining({ properties: { id: 'way/2', group: 'group/way/1' } }),
          expect.objectContaining({ properties: { id: 'way/3', group: 'group/way/3' } }),
        ],
      })
    );
    expect(gl.sources.get(LABEL_SOURCE)?.setData).toHaveBeenLastCalledWith(
      expect.objectContaining({ features: [expect.anything(), expect.anything()] })
    );
  });

  it('FE-FERRATA-GL-005: a click on the hit line hands the ferrata, the way and the point to onSelect', () => {
    const gl = fakeGlMap();
    const onSelect = vi.fn();
    renderHook(() => useFerrataLayerGL(gl.map, GROUPS, onSelect));

    gl.state.hit = { properties: { id: 'way/2', group: 'group/way/1' } };
    gl.emit('click', click);
    expect(onSelect).toHaveBeenCalledWith(GROUPS[0], GROUPS[0]?.segments[1], { lng: 11.705, lat: 46.505 });

    onSelect.mockClear();
    gl.state.hit = null;
    gl.emit('click', click);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('FE-FERRATA-GL-006: the pointer turns into a hand over a line, and the whole ferrata under it lights up', () => {
    const gl = fakeGlMap();
    renderHook(() => useFerrataLayerGL(gl.map, GROUPS, vi.fn()));
    expect(spec(gl, HIGHLIGHT).filter).toEqual(filterOf([]));

    gl.emit(`mouseenter:${HIT}`);
    expect(gl.canvas.style.cursor).toBe('pointer');
    gl.state.hit = { properties: { id: 'way/2', group: 'group/way/1' } };
    act(() => gl.emit(`mousemove:${HIT}`, click));
    expect(gl.spies.setFilter).toHaveBeenLastCalledWith(HIGHLIGHT, filterOf(['group/way/1']));

    act(() => gl.emit(`mouseleave:${HIT}`));
    expect(gl.canvas.style.cursor).toBe('');
    expect(gl.spies.setFilter).toHaveBeenLastCalledWith(HIGHLIGHT, filterOf([]));
  });

  it('FE-FERRATA-GL-007: the ferrata open in the card stays highlighted', () => {
    const gl = fakeGlMap();
    const { rerender } = renderHook(({ selected }) => useFerrataLayerGL(gl.map, GROUPS, vi.fn(), selected), {
      initialProps: { selected: null as string | null },
    });
    rerender({ selected: 'group/way/3' });
    expect(gl.spies.setFilter).toHaveBeenLastCalledWith(HIGHLIGHT, filterOf(['group/way/3']));
  });

  it('FE-FERRATA-GL-008: adds the route icon layer from the zoom it shows at, once its image is drawn', async () => {
    const gl = fakeGlMap();
    renderHook(() => useFerrataLayerGL(gl.map, GROUPS, vi.fn()));

    await waitFor(() => expect(gl.layers.has(LABEL)).toBe(true));
    expect(gl.images.has('trek-ferrata-icon')).toBe(true);
    const label = spec(gl, LABEL);
    expect(label.minzoom).toBe(13);
    expect(label.layout?.['icon-image']).toBe('trek-ferrata-icon');
  });

  it('FE-FERRATA-GL-009: unmounting removes the layers, the sources, the icon and every listener; no map, no work', async () => {
    const gl = fakeGlMap();
    const { unmount } = render(<FerrataLayerGL map={gl.map} groups={GROUPS} onSelect={vi.fn()} />);
    await waitFor(() => expect(gl.layers.has(LABEL)).toBe(true));
    unmount();

    expect(gl.layers.size).toBe(0);
    expect(gl.sources.size).toBe(0);
    expect(gl.images.size).toBe(0);
    expect(gl.listeners()).toBe(0);
    expect(() => renderHook(() => useFerrataLayerGL(null, GROUPS, vi.fn()))).not.toThrow();
  });

  it('FE-FERRATA-GL-013: a map already removed with its view (leaving 3D) is left alone on unmount', async () => {
    const gl = fakeGlMap();
    const { unmount } = render(<FerrataLayerGL map={gl.map} groups={GROUPS} onSelect={vi.fn()} />);
    await waitFor(() => expect(gl.layers.has(LABEL)).toBe(true));
    gl.state.removed = true;
    expect(() => unmount()).not.toThrow();
    expect(gl.listeners()).toBe(0);
  });

  it('FE-FERRATA-GL-010: a theme change repaints the installed layers without rebuilding them', async () => {
    const root = document.documentElement;
    root.style.setProperty('--map-ferrata', 'black');
    const gl = fakeGlMap();
    renderHook(() => useFerrataLayerGL(gl.map, GROUPS, vi.fn()));
    expect(gl.spies.setPaintProperty).not.toHaveBeenCalled();

    await act(async () => {
      root.style.setProperty('--map-ferrata', 'ivory');
      await Promise.resolve();
    });

    await waitFor(() => expect(gl.spies.setPaintProperty).toHaveBeenCalledWith(LINE, 'line-color', 'ivory'));
    expect(addedIds(gl).filter((id) => LAYERS.includes(id))).toEqual(LAYERS);
    root.style.removeProperty('--map-ferrata');
  });
  it('FE-FERRATA-GL-011: names the ferrata under the pointer with its grade, above the pointer, and hides it on leave', () => {
    const gl = fakeGlMap();
    const { unmount } = renderHook(() => useFerrataLayerGL(gl.map, GROUPS, vi.fn()));
    gl.state.hit = { properties: { id: 'way/2', group: 'group/way/1' } };
    act(() => gl.emit(`mousemove:${HIT}`, click));

    const label = gl.container.querySelector<HTMLElement>('[data-testid="ferrata-hover-label"]');
    expect(label?.style.display).toBe('');
    expect(label?.textContent).toBe('Via AK2');
    expect(label?.querySelector('span')?.textContent).toBe('K2');
    expect(label?.style.transform).toContain('translate(4px, -8px)');
    expect(label).toHaveClass('bg-surface-card', 'text-content', 'border-edge-faint');

    act(() => gl.emit(`mouseleave:${HIT}`));
    expect(label?.style.display).toBe('none');
    unmount();
    expect(gl.container.querySelector('[data-testid="ferrata-hover-label"]')).toBeNull();
  });

  it('FE-FERRATA-GL-012: lights a ferrata solid on a wider casing, and draws wider lines on the 3D terrain', () => {
    const flat = fakeGlMap();
    renderHook(() => useFerrataLayerGL(flat.map, GROUPS, vi.fn()));
    expect(spec(flat, CASING).paint['line-width']).toBe(6);
    expect(spec(flat, LINE).paint['line-width']).toBe(2.5);
    expect(spec(flat, HIGHLIGHT_CASING).paint['line-width']).toBe(9);
    expect(spec(flat, HIGHLIGHT).paint['line-width']).toBe(4);
    expect(spec(flat, HIGHLIGHT).paint['line-dasharray']).toBeUndefined();

    const terrain = fakeGlMap();
    renderHook(() => useFerrataLayerGL(terrain.map, GROUPS, vi.fn(), null, 'terrain'));
    expect(spec(terrain, CASING).paint['line-width']).toBe(8);
    expect(spec(terrain, LINE).paint['line-width']).toBe(3.5);
  });
});
