// FE-TOUR-LEG-VARIANT-PAINT-001 to FE-TOUR-LEG-VARIANT-PAINT-005: the ways of a compared section
// and the round hikes offered on the planner map, each in its colour, the one in focus on top
// (RTE-02, RTE-03).
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { drawOrder, useLegVariantLines, useVariantPaint, variantPaintCss } from './legVariantPaint';
import type { LegVariant } from './legVariants';

const variant = (key: LegVariant['key'], lat: number): LegVariant => ({
  key,
  current: key === 'current',
  coordinates: [
    [lat, 11],
    [lat, 11.02],
  ],
  distanceM: 1500,
  gainM: null,
  lossM: null,
  minutes: null,
  heights: 'pending',
});

const WAYS = [variant('current', 47), variant('a', 47.01), variant('b', 47.02)];
const ROUTE: [number, number][][] = [
  [
    [47, 10.9],
    [47, 11.1],
  ],
];
const PAINT = {
  '--hike-variant-current': '#0a84ff',
  '--hike-variant-a': '#f97316',
  '--hike-variant-b': '#d946ef',
  '--hike-variant-c': '#14b8a6',
  '--bike-highlight-casing': '#ffffff',
};

beforeEach(() => {
  for (const [token, value] of Object.entries(PAINT)) document.documentElement.style.setProperty(token, value);
});

afterEach(() => {
  for (const token of Object.keys(PAINT)) document.documentElement.style.removeProperty(token);
});

describe('legVariantPaint', () => {
  it('FE-TOUR-LEG-VARIANT-PAINT-001: the way in focus is drawn last, the others in their order', () => {
    expect(drawOrder(WAYS, 'a').map((way) => way.key)).toEqual(['current', 'b', 'a']);
    expect(drawOrder(WAYS, null).map((way) => way.key)).toEqual(['current', 'a', 'b']);
    expect(variantPaintCss('b')).toBe('var(--hike-variant-b)');
  });

  it('FE-TOUR-LEG-VARIANT-PAINT-002: lays the ways over the route in their colours, on the white rim, for 2D and 3D alike', () => {
    const { result } = renderHook(() => useLegVariantLines(ROUTE, [false], null, WAYS, 'current'));
    expect(result.current.route).toEqual([ROUTE[0], WAYS[1].coordinates, WAYS[2].coordinates, WAYS[0].coordinates]);
    expect(result.current.walking).toEqual([false, false, false, false]);
    expect(result.current.colors).toEqual([
      undefined,
      { line: '#f97316', casing: '#ffffff' },
      { line: '#d946ef', casing: '#ffffff' },
      { line: '#0a84ff', casing: '#ffffff' },
    ]);
    expect(result.current.overlays).toEqual([
      { coordinates: WAYS[1].coordinates, color: '#f97316' },
      { coordinates: WAYS[2].coordinates, color: '#d946ef' },
      { coordinates: WAYS[0].coordinates, color: '#0a84ff' },
    ]);
  });

  it('FE-TOUR-LEG-VARIANT-PAINT-003: with nothing compared the lines stay exactly as they came', () => {
    const { result } = renderHook(() => useLegVariantLines(ROUTE, [false], null, null, null));
    expect(result.current.route).toBe(ROUTE);
    expect(result.current.colors).toBeNull();
    expect(result.current.overlays).toEqual([]);
  });

  it('FE-TOUR-LEG-VARIANT-PAINT-004: rounds offered from a tour without a route yet are drawn on their own (RTE-03)', () => {
    const rounds = [WAYS[1], WAYS[2]];
    const { result } = renderHook(() => useLegVariantLines(null, null, null, rounds, 'a'));
    expect(result.current.route).toEqual([WAYS[2].coordinates, WAYS[1].coordinates]);
    expect(result.current.walking).toBeNull();
    expect(result.current.colors).toEqual([
      { line: '#d946ef', casing: '#ffffff' },
      { line: '#f97316', casing: '#ffffff' },
    ]);
    expect(result.current.overlays).toHaveLength(2);
    const empty = renderHook(() => useLegVariantLines([], null, null, rounds, null));
    expect(empty.result.current.route).toEqual([WAYS[1].coordinates, WAYS[2].coordinates]);
  });

  it('FE-TOUR-LEG-VARIANT-PAINT-005: hands the colours of the ways and their rim resolved, for a map outside the planner', () => {
    const { result } = renderHook(() => useVariantPaint());
    expect(result.current).toEqual({
      current: '#0a84ff',
      a: '#f97316',
      b: '#d946ef',
      c: '#14b8a6',
      casing: '#ffffff',
    });
  });
});
