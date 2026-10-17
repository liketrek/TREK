import type { PaddleFeature, PaddleGeometry } from './paddle-obstacles.schema';
import {
  distanceToRouteM,
  MAX_PASSAGES,
  measuredRouteLengthM,
  NEAR_M,
  ON_ROUTE_M,
  relateObstaclesToRoute,
  routePassages,
} from './paddle-route-relation';

import { describe, expect, it } from 'vitest';

/** Metres north and east of 49.1°N 12.1°E, near enough for these distances. */
const M_PER_DEG_LAT = 111_195;
const M_PER_DEG_LNG = 111_195 * Math.cos((49.1 * Math.PI) / 180);
const at = (north: number, east: number): [number, number] => [
  49.1 + north / M_PER_DEG_LAT,
  12.1 + east / M_PER_DEG_LNG,
];
const lngLat = (north: number, east: number): [number, number] => {
  const [lat, lng] = at(north, east);
  return [lng, lat];
};

function feature(ref: string, geometry: PaddleGeometry): PaddleFeature {
  return { ref, kind: 'weir', group_key: null, name: null, geometry, tags: {}, tag_hash: ref, region_id: 'oberpfalz' };
}

/** A route due east along the river, 2 km long. */
const route = [at(0, 0), at(0, 1000), at(0, 2000)];

describe('relateObstaclesToRoute', () => {
  it('relates nothing to a route of fewer than two points', () => {
    const weir = feature('node/1', { type: 'Point', coordinates: lngLat(0, 500) });
    expect(relateObstaclesToRoute([], [weir])).toEqual([]);
    expect(relateObstaclesToRoute([at(0, 0)], [weir])).toEqual([]);
  });

  it('puts a weir the route crosses on the route, where it crosses', () => {
    const weir = feature('way/29256405', {
      type: 'LineString',
      coordinates: [lngLat(-40, 1200), lngLat(40, 1200)],
    });
    expect(relateObstaclesToRoute(route, [weir])).toEqual([
      { feature: weir, relation: 'on_route', distanceM: 0, alongM: 1200 },
    ]);
  });

  it('a point within ON_ROUTE_M is on the route, within NEAR_M near, farther off not related', () => {
    const on = feature('node/1', { type: 'Point', coordinates: lngLat(ON_ROUTE_M - 5, 300) });
    const near = feature('node/2', { type: 'Point', coordinates: lngLat(100, 700) });
    const far = feature('node/3', { type: 'Point', coordinates: lngLat(NEAR_M + 30, 900) });
    const related = relateObstaclesToRoute(route, [near, far, on]);
    expect(related.map((entry) => [entry.feature.ref, entry.relation, entry.distanceM, entry.alongM])).toEqual([
      ['node/1', 'on_route', 20, 300],
      ['node/2', 'near', 100, 700],
    ]);
  });

  it('measures from the route to a long line too, so passing its middle counts', () => {
    // A dam 60 m north of the route, running 1 km parallel to it: its ends are far, its middle is not.
    const dam = feature('way/7', { type: 'LineString', coordinates: [lngLat(60, -2000), lngLat(60, 4000)] });
    const [related] = relateObstaclesToRoute(route, [dam]);
    expect(related).toMatchObject({ relation: 'near', distanceM: 60, alongM: 0 });
  });

  it('a route running inside an area meets it, even without crossing its outline', () => {
    const basin = feature('way/9', {
      type: 'Polygon',
      coordinates: [[lngLat(-500, -500), lngLat(-500, 2500), lngLat(500, 2500), lngLat(500, -500), lngLat(-500, -500)]],
    });
    expect(relateObstaclesToRoute(route, [basin])).toEqual([
      { feature: basin, relation: 'on_route', distanceM: 0, alongM: 0 },
    ]);
  });

  it('a route inside a hole of an area does not meet it there', () => {
    const ring = feature('way/10', {
      type: 'Polygon',
      coordinates: [
        [lngLat(-900, -900), lngLat(-900, 2900), lngLat(900, 2900), lngLat(900, -900), lngLat(-900, -900)],
        [lngLat(-600, -600), lngLat(-600, 2600), lngLat(600, 2600), lngLat(600, -600), lngLat(-600, -600)],
      ],
    });
    expect(relateObstaclesToRoute(route, [ring])).toEqual([]);
  });

  it('orders the related objects as the route reaches them', () => {
    const late = feature('node/late', { type: 'Point', coordinates: lngLat(0, 1800) });
    const early = feature('node/early', { type: 'Point', coordinates: lngLat(0, 200) });
    expect(relateObstaclesToRoute(route, [late, early]).map((entry) => entry.feature.ref)).toEqual([
      'node/early',
      'node/late',
    ]);
  });

  it('an object on the next arm of the river, 120 m off, stays near and so uncertain', () => {
    const otherArm = feature('way/11', { type: 'LineString', coordinates: [lngLat(100, 500), lngLat(160, 500)] });
    expect(relateObstaclesToRoute(route, [otherArm])[0]).toMatchObject({ relation: 'near', distanceM: 100 });
  });
});

describe('measuredRouteLengthM', () => {
  it('measures the route the way its relations do', () => {
    expect(measuredRouteLengthM(route)).toBeCloseTo(2000, 0);
    expect(measuredRouteLengthM([at(0, 0)])).toBe(0);
    expect(measuredRouteLengthM([])).toBe(0);
  });
});

describe('routePassages', () => {
  const weir: PaddleGeometry = { type: 'LineString', coordinates: [lngLat(-40, 1200), lngLat(40, 1200)] };

  it('finds the one place a route crosses an object, anchored where it crosses', () => {
    expect(routePassages(route, weir, ON_ROUTE_M)).toEqual([{ segment: 1, t: expect.closeTo(0.2, 6), distanceM: 0 }]);
    expect(routePassages([at(0, 0)], weir, ON_ROUTE_M)).toEqual([]);
  });

  it('an out-and-back tour passes twice, each passage on its own leg', () => {
    const outAndBack = [at(0, 0), at(0, 2000), at(10, 2000), at(10, 0)];
    const passages = routePassages(outAndBack, weir, ON_ROUTE_M);
    expect(passages.map((p) => p.segment)).toEqual([0, 2]);
    expect(passages.every((p) => p.distanceM === 0)).toBe(true);
  });

  it('two runs in reach closer than the gap along the route are one passage', () => {
    // A bend that steps out of reach for 30 m and comes back.
    const point: PaddleGeometry = { type: 'Point', coordinates: lngLat(0, 1000) };
    const wiggle = [at(0, 980), at(0, 1000), at(30, 1010), at(0, 1020), at(0, 1040)];
    expect(routePassages(wiggle, point, 20)).toHaveLength(1);
  });

  it('keeps the closest passages when the route passes more often than it keeps, in route order', () => {
    const point: PaddleGeometry = { type: 'Point', coordinates: lngLat(0, 0) };
    // Six passes at 10, 20, ... 60 m north, each 1 km apart along the route.
    const zigzag = Array.from({ length: 6 }, (_, i) => [
      at((i + 1) * 10, -100),
      at((i + 1) * 10, 100),
      at(500, 100),
      at(500, -100),
    ]).flat();
    const passages = routePassages(zigzag, point, NEAR_M);
    expect(passages).toHaveLength(MAX_PASSAGES);
    expect(passages.map((p) => Math.round(p.distanceM))).toEqual([10, 20, 30, 40]);
    expect([...passages].sort((x, y) => x.segment - y.segment)).toEqual(passages);
  });

  it('a route inside an area passes it at distance 0, and nothing out of reach counts', () => {
    const basin: PaddleGeometry = {
      type: 'Polygon',
      coordinates: [[lngLat(-500, -500), lngLat(-500, 2500), lngLat(500, 2500), lngLat(500, -500), lngLat(-500, -500)]],
    };
    expect(routePassages(route, basin, ON_ROUTE_M)).toEqual([{ segment: 0, t: 0, distanceM: 0 }]);
    const far: PaddleGeometry = { type: 'Point', coordinates: lngLat(400, 1000) };
    expect(routePassages(route, far, NEAR_M)).toEqual([]);
  });
});

describe('distanceToRouteM', () => {
  it('is the shortest distance from a point to the route, Infinity without a line', () => {
    expect(distanceToRouteM(route, at(100, 500))).toBeCloseTo(100, 0);
    expect(distanceToRouteM(route, at(0, 2300))).toBeCloseTo(300, 0);
    expect(distanceToRouteM([at(0, 0)], at(0, 10))).toBe(Number.POSITIVE_INFINITY);
  });
});
