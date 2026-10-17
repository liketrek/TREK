// FE-FERRATA-CROSS-001 to FE-FERRATA-CROSS-009: where a tour's line climbs a via ferrata, and the tiles along it.
import { describe, expect, it } from 'vitest';

import type { Ferrata } from '@trek/shared';

import { crossingLegs, ferrataEnds, ferrataTilesAlong, routeFerrataCrossings } from './ferrataCrossings';
import { groupFerratas } from './ferrataGroups';

/** About 11 m of latitude. */
const STEP = 0.0001;

function ferrata(id: number, from: [number, number], steps: number): Ferrata {
  return {
    id: `way/${id}`,
    name: 'Via Test',
    routeName: null,
    grade: { raw: '3', level: 3, plus: null },
    geometry: Array.from({ length: steps + 1 }, (_, i) => [from[0] + i * STEP, from[1]] as [number, number]),
    osmUrl: `https://www.openstreetmap.org/way/${id}`,
  };
}

/** A line north from a point, one point every STEP. */
function northFrom(from: [number, number], steps: number): [number, number][] {
  return Array.from({ length: steps + 1 }, (_, i) => [from[0] + i * STEP, from[1]]);
}

describe('routeFerrataCrossings', () => {
  const groups = groupFerratas([ferrata(1, [47.4, 11.0], 20)]);

  it('FE-FERRATA-CROSS-001: a route climbing along the ferrata gives one stretch, measured along the route', () => {
    const route = [...northFrom([47.399, 11.0], 9), ...northFrom([47.4, 11.0], 20)];
    const [stretch, ...rest] = routeFerrataCrossings(route, groups);
    expect(rest).toEqual([]);
    expect(stretch.group.id).toBe(groups[0].id);
    expect(stretch.fromM).toBeGreaterThan(95);
    expect(stretch.toM - stretch.fromM).toBeGreaterThan(200);
  });

  it('FE-FERRATA-CROSS-002: a trail that only crosses the ferrata is no stretch', () => {
    const across: [number, number][] = Array.from({ length: 21 }, (_, i) => [47.401, 10.999 + i * STEP]);
    expect(routeFerrataCrossings(across, groups)).toEqual([]);
  });

  it('FE-FERRATA-CROSS-003: a route nowhere near a ferrata, or no route, gives nothing', () => {
    expect(routeFerrataCrossings(northFrom([46.0, 10.0], 20), groups)).toEqual([]);
    expect(routeFerrataCrossings(null, groups)).toEqual([]);
    expect(routeFerrataCrossings(northFrom([47.4, 11.0], 20), [])).toEqual([]);
  });

  it('FE-FERRATA-CROSS-004: a short gap in the data does not split the stretch', () => {
    // Two pieces of one ferrata with 44 m missing between them: the route point
    // in the middle of the hole is out of reach, the ones beside it are not.
    const pieces = groupFerratas([ferrata(2, [47.4, 11.0], 10), ferrata(3, [47.4 + 14 * STEP, 11.0], 11)]);
    expect(pieces).toHaveLength(1);
    expect(routeFerrataCrossings(northFrom([47.4, 11.0], 25), pieces)).toHaveLength(1);
  });
});

describe('routeFerrataCrossings at the end of a ferrata', () => {
  it('FE-FERRATA-CROSS-007: a route that only runs beside the end of a long ferrata is no stretch', () => {
    const groups = groupFerratas([ferrata(1, [47.4, 11.0], 40)]);
    // Ten points (about 100 m) along the ferrata's top, then away.
    const route = [...northFrom([47.4033, 11.0], 9), ...northFrom([47.405, 11.0], 10)];
    expect(routeFerrataCrossings(route, groups)).toEqual([]);
  });
});

describe('routeFerrataCrossings beside a second ferrata', () => {
  it('FE-FERRATA-CROSS-008: where two ferratas run a few metres apart, the route belongs to the nearer one', () => {
    const near = ferrata(1, [47.4, 11.0], 30);
    // A second ferrata about 15 m to the east, along the same stretch.
    const beside = { ...ferrata(2, [47.4, 11.0002], 30), name: 'Via Beside' };
    const groups = groupFerratas([beside, near]);
    const [stretch, ...rest] = routeFerrataCrossings(northFrom([47.4, 11.0], 30), groups);
    expect(rest).toEqual([]);
    expect(stretch.group.name).toBe('Via Test');
  });
});

describe('crossingLegs', () => {
  it('FE-FERRATA-CROSS-009: places waypoints in order along a route that passes the same spot twice, and a stretch by its middle', () => {
    // Out 300 m north and back: the turn point is waypoint b, and a and c stand at the same spot.
    const samples = [0, 100, 200, 300, 400, 500, 600].map((distanceMeters, i) => ({
      distanceMeters,
      lat: 47.4 + (i <= 3 ? i : 6 - i) * 0.0009,
      lng: 11,
    }));
    const waypoints = [
      { id: 'a', lat: 47.4, lng: 11 },
      { id: 'b', lat: 47.4027, lng: 11 },
      { id: 'c', lat: 47.4, lng: 11 },
    ];
    expect(
      crossingLegs(waypoints, samples, [
        { fromM: 50, toM: 250 },
        { fromM: 280, toM: 520 },
      ])
    ).toEqual(['a', 'b']);
    expect(crossingLegs([], samples, [{ fromM: 50, toM: 80 }])).toEqual([null]);
  });
});

describe('ferrataTilesAlong', () => {
  it('FE-FERRATA-CROSS-005: names each grid tile the route passes once, and gives up past the cap', () => {
    const tiles = ferrataTilesAlong(northFrom([47.4, 11.0], 20));
    expect(tiles).toHaveLength(1);
    const long: [number, number][] = Array.from({ length: 400 }, (_, i) => [40 + i * 0.06, 11]);
    expect(ferrataTilesAlong(long)).toBeNull();
    expect(ferrataTilesAlong(null)).toEqual([]);
  });
});

describe('ferrataEnds', () => {
  it('FE-FERRATA-CROSS-006: the two ends farthest apart, across the segments of one ferrata', () => {
    const [group] = groupFerratas([ferrata(1, [47.4, 11.0], 5), ferrata(2, [47.4005, 11.0], 5)]);
    const ends = ferrataEnds(group);
    expect(ends).not.toBeNull();
    const lats = ends ? ends.map(([lat]) => lat).sort() : [];
    expect(lats[0]).toBeCloseTo(47.4, 6);
    expect(lats[1]).toBeCloseTo(47.401, 6);
  });
});
