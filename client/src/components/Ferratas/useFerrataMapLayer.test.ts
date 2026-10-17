/**
 * FE-FERRATA-MAPLAYER-001 to FE-FERRATA-MAPLAYER-008: the via ferrata layer as
 * one map surface holds it: off by default, the area the map reports, the
 * trip's area to prefetch, the ferratas grouped from OSM's segments with their
 * count in view, and the card a click opens.
 *
 * useTripFerratas is mocked: what it asks the server is its own suite's
 * subject. This one checks what the layer hands it (the view, whether it is on
 * at all, the trip's area) and what it hands the map back.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Ferrata, FerrataBbox } from '@trek/shared';

import { ferrataAreaOf, useFerrataMapLayer } from './useFerrataMapLayer';
import { useTripFerratas } from './useTripFerratas';

vi.mock('./useTripFerratas', () => ({ useTripFerratas: vi.fn() }));

const BOX: FerrataBbox = { south: 46.5, west: 11.7, north: 46.6, east: 11.9 };
const OTHER: FerrataBbox = { south: 47.4, west: 11.6, north: 47.5, east: 11.8 };

const segment = (id: number, lat: number): Ferrata => ({
  id: `way/${id}`,
  name: 'Via delle Trincee',
  grade: { raw: String(id), level: id, plus: null },
  routeName: null,
  geometry: [
    [lat, 11.8],
    [lat + 0.001, 11.8],
  ],
  osmUrl: `https://www.openstreetmap.org/way/${id}`,
});
// Two touching segments of one ferrata.
const LOWER = segment(2, 46.52);
const UPPER = segment(4, 46.521);

const lastCall = () => vi.mocked(useTripFerratas).mock.lastCall;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useTripFerratas).mockReturnValue({ ferratas: [LOWER, UPPER], status: 'ready', truncated: false });
});

describe('useFerrataMapLayer', () => {
  it('FE-FERRATA-MAPLAYER-001: starts off, so nothing is asked for', () => {
    const { result } = renderHook(() => useFerrataMapLayer(7));
    expect(result.current.layer.active).toBe(false);
    expect(result.current.layer.count).toBe(0);
    expect(result.current.selected).toBeNull();
    expect(lastCall()).toEqual([7, null, false, null, []]);
  });

  it('FE-FERRATA-MAPLAYER-002: an area reported while off is remembered without a re-render, and used once it is on', () => {
    const { result } = renderHook(() => useFerrataMapLayer(7));
    const renders = vi.mocked(useTripFerratas).mock.calls.length;

    act(() => result.current.onViewportChange(BOX));
    expect(vi.mocked(useTripFerratas).mock.calls.length).toBe(renders);

    act(() => result.current.layer.onToggle());
    expect(result.current.layer.active).toBe(true);
    expect(lastCall()?.slice(0, 3)).toEqual([7, BOX, true]);
  });

  it('FE-FERRATA-MAPLAYER-003: while on, every new area reaches the request', () => {
    const { result } = renderHook(() => useFerrataMapLayer(7));
    act(() => result.current.layer.onToggle());
    act(() => result.current.onViewportChange(OTHER));
    expect(lastCall()?.slice(0, 3)).toEqual([7, OTHER, true]);
  });

  it("FE-FERRATA-MAPLAYER-004: hands the trip's area around its lines to the loader", () => {
    const lines = [
      [[46.5, 11.7]],
      [
        [46.7, 11.6],
        [46.6, 11.9],
      ],
    ] as Array<Array<[number, number]>>;
    renderHook(() => useFerrataMapLayer(7, lines));
    expect(lastCall()?.[3]).toEqual({ south: 46.5, west: 11.6, north: 46.7, east: 11.9 });
    expect(ferrataAreaOf([])).toBeNull();
    expect(ferrataAreaOf([[[Number.NaN, 1]]])).toBeNull();
  });

  it('FE-FERRATA-MAPLAYER-005: groups the segments into one ferrata and counts the ferratas in view', () => {
    const { result } = renderHook(() => useFerrataMapLayer(7));
    act(() => result.current.onViewportChange(BOX));
    act(() => result.current.layer.onToggle());
    expect(result.current.layer.groups).toHaveLength(1);
    expect(result.current.layer.groups[0]?.segments).toEqual([LOWER, UPPER]);
    expect(result.current.layer.count).toBe(1);

    act(() => result.current.onViewportChange(OTHER));
    expect(result.current.layer.count).toBe(0);
    // Out of view, still drawn.
    expect(result.current.layer.groups).toHaveLength(1);
  });

  it('FE-FERRATA-MAPLAYER-006: a click opens the whole ferrata in the card, highlighted, and close shuts it', () => {
    const { result } = renderHook(() => useFerrataMapLayer(7));
    act(() => result.current.layer.onToggle());
    const group = result.current.layer.groups[0];
    if (!group) throw new Error('no group');

    act(() => result.current.layer.onSelect(group, UPPER, { lat: 46.521, lng: 11.8 }));
    expect(result.current.selected?.group.id).toBe(group.id);
    expect(result.current.selected?.segment).toBe(UPPER);
    expect(result.current.layer.selectedId).toBe(group.id);

    act(() => result.current.close());
    expect(result.current.selected).toBeNull();
    expect(result.current.layer.selectedId).toBeNull();
  });

  it('FE-FERRATA-MAPLAYER-007: the card follows its ferrata when more of its segments load', () => {
    const { result, rerender } = renderHook(() => useFerrataMapLayer(7));
    act(() => result.current.layer.onToggle());
    const group = result.current.layer.groups[0];
    if (!group) throw new Error('no group');
    act(() => result.current.layer.onSelect(group, UPPER, { lat: 46.521, lng: 11.8 }));

    // A lower way loads and joins the ferrata; its id is now the group's.
    const lowest = segment(1, 46.519);
    vi.mocked(useTripFerratas).mockReturnValue({ ferratas: [LOWER, UPPER, lowest], status: 'ready', truncated: false });
    rerender();
    expect(result.current.selected?.group.segments).toHaveLength(3);
    expect(result.current.selected?.segment).toBe(UPPER);
    expect(result.current.layer.selectedId).toBe('group/way/1');
  });

  it('FE-FERRATA-MAPLAYER-008: switching the layer off closes the card and stops asking', () => {
    const { result } = renderHook(() => useFerrataMapLayer(7));
    act(() => result.current.layer.onToggle());
    const group = result.current.layer.groups[0];
    if (!group) throw new Error('no group');
    act(() => result.current.layer.onSelect(group, LOWER, { lat: 46.52, lng: 11.8 }));

    act(() => result.current.layer.onToggle());
    expect(result.current.layer.active).toBe(false);
    expect(result.current.selected).toBeNull();
    expect(lastCall()?.[2]).toBe(false);

    // On again, the card stays closed until the next click.
    act(() => result.current.layer.onToggle());
    expect(result.current.selected).toBeNull();
  });
});
