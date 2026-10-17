// FE-TOUR-ROUTE-STYLE-001 to FE-TOUR-ROUTE-STYLE-003: how the planner map draws the parts of a tour (PAD-03, PAD-11).
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
});
