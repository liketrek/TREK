// FE-TOUR-LEG-VARIANTS-001 to FE-TOUR-LEG-VARIANTS-008: the model of the ways a hike's section
// can take, which section can be compared, and the figures of each way (RTE-02).
import { hikingTimeMinutes } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import type { ValhallaLeg } from '../../Map/valhallaRoute';
import {
  comparedLegOf,
  currentVariantOf,
  figuresOf,
  isComparableLeg,
  offeredVariants,
  variantDelta,
  withVariantHeights,
  type LegVariant,
} from './legVariants';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

const A: TourPlannerWaypoint = { id: 'a', lat: 47.0, lng: 11.0, role: 'start' };
const B: TourPlannerWaypoint = { id: 'b', lat: 47.0, lng: 11.02, role: 'via' };
const C: TourPlannerWaypoint = { id: 'c', lat: 47.01, lng: 11.02, role: 'end' };
const ROUTE: [number, number][] = [
  [47.0, 11.0],
  [47.001, 11.01],
  [47.0, 11.02],
  [47.005, 11.021],
  [47.01, 11.02],
];
const HEIGHTS: [number, number, number][] = ROUTE.map(([lat, lng], index) => [
  lat,
  lng,
  1000 + [0, 50, 20, 80, 60][index],
]);
const COSTING = { max_hiking_difficulty: 2 };

/** A way the router offered, with the figures it gave for it. */
const offer = (coordinates: [number, number][], distance = 1000): ValhallaLeg => ({
  coordinates,
  distance,
  duration: 900,
  hasToll: false,
  hasHighway: false,
  hasFerry: false,
});

describe('which section can be compared', () => {
  it('FE-TOUR-LEG-VARIANTS-001: a routed leg of a hike, never a fixed line, the last point, another type or a missing point', () => {
    const ferrata = {
      ...B,
      fixedLeg: { kind: 'ferrata', ref: 'way/1', geometry: [[47, 11.02]] },
    } as TourPlannerWaypoint;
    expect(isComparableLeg([A, B, C], 0, 'hike')).toBe(true);
    expect(isComparableLeg([A, B, C], 2, 'hike')).toBe(false);
    expect(isComparableLeg([A, B, C], -1, 'hike')).toBe(false);
    expect(isComparableLeg([A, B, C], 0, 'bike')).toBe(false);
    expect(isComparableLeg([A, B, C], 0, 'walk')).toBe(false);
    expect(isComparableLeg([A, ferrata, C], 1, 'hike')).toBe(false);
    const geometry = [
      [47, 11],
      [47, 11.02],
    ];
    const free = { ...A, fixedLeg: { kind: 'free', geometry } } as TourPlannerWaypoint;
    expect(isComparableLeg([free, B, C], 0, 'hike')).toBe(false);
  });

  it('FE-TOUR-LEG-VARIANTS-002: a section is named by both ends and the rules; any change makes it another section', () => {
    const leg = comparedLegOf([A, B, C], 'a', 'hike', COSTING);
    expect(leg).toMatchObject({ fromId: 'a', toId: 'b', from: { lat: 47, lng: 11 }, to: { lat: 47, lng: 11.02 } });
    expect(comparedLegOf([A, B, C], 'a', 'hike', COSTING)?.key).toBe(leg?.key);
    expect(comparedLegOf([A, { ...B, lat: 47.001 }, C], 'a', 'hike', COSTING)?.key).not.toBe(leg?.key);
    expect(comparedLegOf([A, { ...B, id: 'x' }, C], 'a', 'hike', COSTING)?.key).not.toBe(leg?.key);
    expect(comparedLegOf([A, B, C], 'a', 'hike', { max_hiking_difficulty: 3 })?.key).not.toBe(leg?.key);
    expect(comparedLegOf([A, B, C], 'gone', 'hike', COSTING)).toBeNull();
    expect(comparedLegOf([A, B, C], 'c', 'hike', COSTING)).toBeNull();
  });
});

describe('the figures of a way', () => {
  it('FE-TOUR-LEG-VARIANTS-003: length, climb, descent and the signposts’ time once every point has its height', () => {
    const figures = figuresOf(HEIGHTS);
    expect(figures.heights).toBe('known');
    expect(figures.gainM).toBe(110);
    expect(figures.lossM).toBe(50);
    expect(figures.distanceM).toBeGreaterThan(2000);
    expect(figures.minutes).toBe(hikingTimeMinutes(figures.distanceM / 1000, 110, 50));
  });

  it('FE-TOUR-LEG-VARIANTS-004: a line short of a single height keeps climb, descent and time unknown, never a guess', () => {
    const partly: ([number, number] | [number, number, number])[] = [
      ...HEIGHTS.slice(0, 2),
      ROUTE[2],
      ...HEIGHTS.slice(3),
    ];
    expect(figuresOf(partly)).toMatchObject({ gainM: null, lossM: null, minutes: null, heights: 'unknown' });
    expect(figuresOf(ROUTE).distanceM).toBe(figuresOf(partly).distanceM);
  });

  it('FE-TOUR-LEG-VARIANTS-005: the way taken now is cut from the drawn route between its two points, with its heights', () => {
    const current = currentVariantOf([A, B, C], 1, ROUTE, HEIGHTS);
    expect(current).toMatchObject({
      key: 'current',
      current: true,
      heights: 'known',
      gainM: 60,
      lossM: 20,
    });
    expect(current?.coordinates).toEqual(ROUTE.slice(2));
    // Heights that are not the route's own are no heights for it.
    expect(currentVariantOf([A, B, C], 0, ROUTE, HEIGHTS.slice(1))?.heights).toBe('unknown');
    expect(currentVariantOf([A, B, C], 0, null, null)).toBeNull();
    expect(currentVariantOf([A, B, C], 2, ROUTE, HEIGHTS)).toBeNull();
  });
});

describe('the ways offered', () => {
  const current = currentVariantOf([A, B, C], 0, ROUTE, HEIGHTS) as LegVariant;
  const north: [number, number][] = [
    [47.0, 11.0],
    [47.03, 11.01],
    [47.0, 11.02],
  ];
  const south: [number, number][] = [
    [47.0, 11.0],
    [46.97, 11.01],
    [47.0, 11.02],
  ];
  const east: [number, number][] = [
    [47.0, 11.0],
    [47.0, 11.05],
    [47.0, 11.02],
  ];
  const west: [number, number][] = [
    [47.0, 11.0],
    [47.02, 10.98],
    [47.0, 11.02],
  ];

  it('FE-TOUR-LEG-VARIANTS-006: the way taken now first, the same way never twice, at most three others lettered in order', () => {
    const variants = offeredVariants(current, [
      offer(current.coordinates),
      offer(north),
      offer(north),
      offer(south),
      offer(east),
      offer(west),
    ]);
    expect(variants.map((variant) => variant.key)).toEqual(['current', 'a', 'b', 'c']);
    expect(variants[1]).toMatchObject({ coordinates: north, current: false, heights: 'pending' });
    expect(variants.slice(1).every((variant) => variant.gainM === null && variant.minutes === null)).toBe(true);
  });

  it("FE-TOUR-LEG-VARIANTS-007: the router's own way is the one the tour routes already, so it is never offered", () => {
    // Drawn apart from the route, it is still no choice: taking it could not change the section.
    const variants = offeredVariants(current, [offer(north), offer(south)]);
    expect(variants.map((variant) => [variant.key, variant.coordinates])).toEqual([
      ['current', current.coordinates],
      ['a', south],
    ]);
    expect(offeredVariants(current, [offer(north)])).toEqual([current]);
    expect(offeredVariants(current, [])).toEqual([current]);
  });

  it('FE-TOUR-LEG-VARIANTS-008: heights fill a way in, and the difference to the way taken now is what is known of both', () => {
    const [, pending] = offeredVariants(current, [offer(current.coordinates), offer(north)]);
    const known = withVariantHeights(pending, [
      [47.0, 11.0, 1000],
      [47.03, 11.01, 1300],
      [47.0, 11.02, 1020],
    ]);
    expect(known).toMatchObject({ heights: 'known', gainM: 300, lossM: 280 });
    expect(withVariantHeights(pending, null)).toMatchObject({ heights: 'unknown', gainM: null, minutes: null });

    const delta = variantDelta(known, current);
    expect(delta.distanceM).toBe(known.distanceM - current.distanceM);
    expect(delta.gainM).toBe(300 - (current.gainM ?? 0));
    expect(delta.minutes).toBe((known.minutes ?? 0) - (current.minutes ?? 0));
    expect(variantDelta(pending, current)).toMatchObject({ minutes: null, gainM: null });
  });
});
