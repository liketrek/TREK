// FE-TOUR-ROUTE-STYLE-001 to FE-TOUR-ROUTE-STYLE-006: how the planner map draws the parts of a tour (PAD-03, PAD-11, SKI-02, CW-12).
import { describe, expect, it } from 'vitest';
import { tourRouteStyle } from './tourRouteStyle';
import type { TourRoutePart } from './tourRouting';

const PAINT = { portage: 'brown', rapids: 'amber', gap: 'red', casing: 'white' };
const line: [number, number][] = [
  [49, 12],
  [49.01, 12.01],
];
const part = (extra: Partial<TourRoutePart> = {}): TourRoutePart => ({ coordinates: line, free: false, ...extra });

describe('tourRouteStyle', () => {
  it('FE-TOUR-ROUTE-STYLE-001: a routed tour is one plain line, and no parts draw nothing', () => {
    expect(tourRouteStyle([part(), part()], true, PAINT)).toEqual({ walking: null, colors: null });
    expect(tourRouteStyle(null, true, PAINT)).toEqual({ walking: null, colors: null });
  });

  it('FE-TOUR-ROUTE-STYLE-002: a paddle tour dots and colours what no router planned and what the paddler should see', () => {
    const style = tourRouteStyle(
      [
        part(),
        part({ land: true }),
        part({ mark: 'rapids' }),
        part({ mark: 'gap' }),
        part({ mark: 'unrouted' }),
        part({ free: true }),
      ],
      true,
      PAINT
    );
    expect(style.walking).toEqual([false, true, false, true, true, true]);
    expect(style.colors).toEqual([
      undefined,
      { line: 'brown', casing: 'white' },
      { line: 'amber', casing: 'white' },
      { line: 'red', casing: 'white' },
      { line: 'red', casing: 'white' },
      undefined,
    ]);
  });

  it('FE-TOUR-ROUTE-STYLE-003: a hike dots its hand-drawn stretches and keeps its own colour', () => {
    const style = tourRouteStyle([part(), part({ free: true })], false, PAINT);
    expect(style).toEqual({ walking: [false, true], colors: null });
  });

  it('FE-TOUR-ROUTE-STYLE-004: a ski tour colours each stretch by its grade or kind, and dots the links between them', () => {
    const style = tourRouteStyle(
      [
        part({ ski: { kind: 'run', difficulty: 'intermediate', scheme: 'europe' } }),
        part({ mark: 'gap', ski: { kind: 'link', difficulty: null } }),
        part({ ski: { kind: 'lift', difficulty: null } }),
        part({ mark: 'unrouted' }),
      ],
      false,
      PAINT
    );
    expect(style.walking).toEqual([false, true, false, true]);
    expect(style.colors?.map((color) => color?.line)).toEqual(['#d51e1e', '#6b7280', '#1f2937', undefined]);
    expect(style.colors?.[0]?.casing).toBe('white');
  });

  it('FE-TOUR-ROUTE-STYLE-005: a city walk dots its crossing by boat in the water blue, and only that stretch', () => {
    const style = tourRouteStyle([part(), part({ mark: 'ferry' }), part()], false, {
      ...PAINT,
      ferry: 'blue',
      stale: 'grey',
    });
    expect(style.walking).toEqual([false, true, false]);
    expect(style.colors).toEqual([undefined, { line: 'blue', casing: 'white' }, undefined]);
  });

  it('FE-TOUR-ROUTE-STYLE-006: a route kept from before a failed plan is greyed whole, its dots kept', () => {
    const style = tourRouteStyle(
      [part(), part({ mark: 'ferry' })],
      false,
      { ...PAINT, ferry: 'blue', stale: 'grey' },
      true
    );
    expect(style.walking).toEqual([false, true]);
    expect(style.colors).toEqual([
      { line: 'grey', casing: 'white' },
      { line: 'grey', casing: 'white' },
    ]);
    // Without the grey resolved the route keeps its own colours rather than losing them.
    expect(tourRouteStyle([part()], false, PAINT, true).colors).toBeNull();
  });
});
