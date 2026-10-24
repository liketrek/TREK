/**
 * MAPS-ALONG-001..007: the geometry of a search along a line (PLN-02). Where
 * the index is asked (circles strung along the line), the stretches Overpass
 * is asked in and the query near one of them, all pure.
 */
import {
  OVERPASS_ALONG_QUERY_TIMEOUT_S,
  alongPlan,
  aroundPath,
  overpassAlongQuery,
  overpassStretches,
} from '../../../src/nest/maps/maps-along.helpers';
import { haversineKm, lineMetres, type LatLng } from '@trek/shared/roadtrip';

import { describe, expect, it } from 'vitest';

const ORIGIN = { lat: 47, lng: 11 };
const M_PER_DEG = 111_320;

/** A point `x` metres east and `y` metres north of the origin. */
function at(x: number, y: number): LatLng {
  return {
    lat: ORIGIN.lat + y / M_PER_DEG,
    lng: ORIGIN.lng + x / (M_PER_DEG * Math.cos((ORIGIN.lat * Math.PI) / 180)),
  };
}

const metres = (a: LatLng, b: LatLng) => haversineKm(a, b) * 1000;

describe('alongPlan', () => {
  it('MAPS-ALONG-001: a straight 3 km line at 500 m takes a circle every kilometre, each reaching its stretch', () => {
    const line = [at(0, 0), at(0, 3000)];
    const plan = alongPlan(line, 500);
    expect(plan.capped).toBe(false);
    expect(plan.covered).toBe(line);
    expect(plan.beads.map((bead) => Math.round(metres(line[0] as LatLng, bead)))).toEqual([
      0,
      1000,
      2000,
      Math.round(lineMetres(line)),
    ]);
    // Half a step along and a corridor across, whichever way the line turns.
    expect(plan.beads.every((bead) => bead.radiusM === 1000)).toBe(true);
  });

  it('MAPS-ALONG-002: on a zig-zag line every point within the corridor lies inside some circle', () => {
    // Eight legs of 700 m, turning a right angle at every corner, as a walk through a street grid does.
    const line = Array.from({ length: 9 }, (_, index) => at(index * 495, index % 2 === 0 ? 0 : 495));
    const corridor = 500;
    const plan = alongPlan(line, corridor);
    const outside: LatLng[] = [];
    for (let leg = 1; leg < line.length; leg++) {
      const a = line[leg - 1] as LatLng;
      const b = line[leg] as LatLng;
      const length = metres(a, b);
      // The leg's direction in metres, and the normal to it.
      const dx = ((b.lng - a.lng) * M_PER_DEG * Math.cos((ORIGIN.lat * Math.PI) / 180)) / length;
      const dy = ((b.lat - a.lat) * M_PER_DEG) / length;
      const ax = (a.lng - ORIGIN.lng) * M_PER_DEG * Math.cos((ORIGIN.lat * Math.PI) / 180);
      const ay = (a.lat - ORIGIN.lat) * M_PER_DEG;
      for (let along = 0; along <= length; along += 25) {
        for (const side of [-1, 1]) {
          const point = at(ax + dx * along - dy * corridor * side, ay + dy * along + dx * corridor * side);
          if (!plan.beads.some((bead) => metres(bead, point) <= bead.radiusM)) outside.push(point);
        }
      }
    }
    expect(outside).toEqual([]);
  });

  it('MAPS-ALONG-003: a 100 km line at 250 m takes 24 circles and says it covered only its start', () => {
    const line = [at(0, 0), at(0, 100_000)];
    const plan = alongPlan(line, 250);
    expect(plan.beads).toHaveLength(24);
    expect(Math.round(metres(plan.beads[0] as LatLng, plan.beads[1] as LatLng))).toBe(1500);
    expect(plan.capped).toBe(true);
    expect(lineMetres(plan.covered)).toBeCloseTo(34_500, -1);
  });

  it('MAPS-ALONG-004: two points 30 m apart take a circle at each end', () => {
    const plan = alongPlan([at(0, 0), at(30, 0)], 250);
    expect(plan.beads).toHaveLength(2);
    expect(plan.capped).toBe(false);
  });

  it('MAPS-ALONG-004b: a line with no points takes no circle', () => {
    expect(alongPlan([], 500).beads).toEqual([]);
  });
});

describe('aroundPath and overpassAlongQuery', () => {
  // A wiggly 20 km line of 2000 points, more than the query may carry.
  const wiggly = Array.from({ length: 2000 }, (_, index) => at(index * 10, Math.sin(index / 3) * 40));

  it('MAPS-ALONG-005: the line is simplified to at most 120 points, its reach widened by what that moved it', () => {
    const path = aroundPath(wiggly, 500);
    expect(path.points.length).toBeLessThanOrEqual(120);
    expect(path.radiusM).toBeGreaterThanOrEqual(550);
    for (const point of wiggly) {
      expect(point.lat).toBeGreaterThanOrEqual(path.bbox.south);
      expect(point.lat).toBeLessThanOrEqual(path.bbox.north);
      expect(point.lng).toBeGreaterThanOrEqual(path.bbox.west);
      expect(point.lng).toBeLessThanOrEqual(path.bbox.east);
    }
    // A short line keeps its points and only the corridor's tenth as slack.
    const short = aroundPath([at(0, 0), at(0, 1000)], 500);
    expect(short.points).toHaveLength(2);
    expect(short.radiusM).toBe(550);
    // The box reaches a radius past the line on every side.
    expect(short.bbox.south).toBeCloseTo(ORIGIN.lat - 550 / M_PER_DEG, 8);
  });

  it('MAPS-ALONG-006: one query asks the box for candidates and keeps those near the line', () => {
    const path = aroundPath([at(0, 0), at(0, 1000)], 500);
    const query = overpassAlongQuery(['tourism=viewpoint', 'amenity=drinking_water'], path, 60);
    // The deadline the client's own wait is derived from, so the two never drift apart.
    expect(OVERPASS_ALONG_QUERY_TIMEOUT_S).toBe(15);
    expect(query.startsWith(`[out:json][timeout:${OVERPASS_ALONG_QUERY_TIMEOUT_S}];`)).toBe(true);
    expect(query).toContain('nwr["tourism"="viewpoint"](');
    expect(query).toContain('nwr["amenity"="drinking_water"](');
    expect(query.match(/->\.cand;/g)).toHaveLength(1);
    expect(query.match(/around:/g)).toHaveLength(1);
    expect(query).toContain(`nwr.cand(around:550,47.00000,11.00000,${at(0, 1000).lat.toFixed(5)},11.00000);`);
    expect(query.endsWith('out center tags 85;')).toBe(true);
  });

  it('MAPS-ALONG-006b: a compound selector asks the box for places that carry every one of its tags (BIK-07)', () => {
    const path = aroundPath([at(0, 0), at(0, 1000)], 500);
    const query = overpassAlongQuery(['amenity=charging_station&bicycle=designated'], path, 30);
    expect(query).toContain('  nwr["amenity"="charging_station"]["bicycle"="designated"](');
    expect(query).not.toContain('nwr["amenity"="charging_station"](');
  });
});

describe('overpassStretches', () => {
  it('MAPS-ALONG-007: a line is cut into equal stretches of at most 50 km, the whole line up to 400 km', () => {
    const walk = [at(0, 0), at(0, 3000)];
    expect(overpassStretches(walk)).toEqual({ stretches: [walk], capped: false });

    // 120 km with a bend: three stretches of 40 km, each starting where the last one ended.
    const ride = [at(0, 0), at(0, 70_000), at(50_000, 70_000)];
    const cut = overpassStretches(ride);
    expect(cut.capped).toBe(false);
    expect(cut.stretches.map((stretch) => Math.round(lineMetres(stretch) / 1000))).toEqual([40, 40, 40]);
    expect(cut.stretches.map((stretch) => stretch[0])).toEqual([
      ride[0],
      cut.stretches[0]?.at(-1),
      cut.stretches[1]?.at(-1),
    ]);
    expect(cut.stretches[2]?.at(-1)).toBe(ride[2]);

    // 450 km takes nine stretches of 50 km; the first eight are asked and the answer says so.
    const long = [at(0, 0), at(0, 450_000)];
    const crossing = overpassStretches(long);
    expect(crossing.capped).toBe(true);
    expect(crossing.stretches).toHaveLength(8);
    expect(Math.round(lineMetres(crossing.stretches[0] ?? []) / 1000)).toBe(50);
    expect(metres(ORIGIN, crossing.stretches[7]?.at(-1) ?? ORIGIN)).toBeCloseTo((lineMetres(long) * 8) / 9, -1);
  });
});
