import { describe, expect, it } from 'vitest';
import { encodePolyline } from '../../../../tests/helpers/polyline';
import { bikePaintCss, surfacePaintKey, trailPaintKey } from './bikePaint';
import { withRouteHighlight } from './routeHighlight';
import {
  routeWaysFrom,
  sacClassOf,
  sharesBy,
  stretchesOf,
  trailClassOf,
  unpavedShareOf,
  wayIdsOf,
  type RouteWays,
} from './routeWays';

// FE-TOUR-WAYS-001 to FE-TOUR-WAYS-014

const LINE: [number, number][] = [
  [47.0, 11.0],
  [47.001, 11.0],
  [47.002, 11.0],
  [47.003, 11.0],
  [47.004, 11.0],
];

function answer(edges: Record<string, unknown>[], line = LINE) {
  return { shape: encodePolyline(line, 6), edges };
}

const edge = (from: number, to: number, extra: Record<string, unknown> = {}) => ({
  begin_shape_index: from,
  end_shape_index: to,
  length: 0.1,
  surface: 'paved_smooth',
  use: 'road',
  road_class: 'residential',
  way_id: 100 + from,
  ...extra,
});

describe('routeWaysFrom (BIK-01 to BIK-04)', () => {
  it('FE-TOUR-WAYS-001: reads each edge into its place on the line, its surface, its kind of way and its way', () => {
    const ways = routeWaysFrom(
      answer([
        edge(0, 1, { surface: 'paved', use: 'cycleway' }),
        edge(1, 2, { surface: 'gravel', use: 'track', length: 0.25 }),
        edge(2, 3, { surface: 'dirt', use: 'path' }),
        edge(3, 4, { surface: 'compacted', use: 'road', road_class: 'primary', cycle_lane: 'dedicated', way_id: 0 }),
      ])
    );
    expect(ways?.line).toHaveLength(5);
    expect(ways?.edges.map(({ surface, way, wayId, lengthM }) => [surface, way, wayId, lengthM])).toEqual([
      ['paved', 'cyclePath', 100, 100],
      ['gravel', 'track', 101, 250],
      ['ground', 'path', 102, 100],
      ['compacted', 'cycleLane', null, 100],
    ]);
  });

  it('FE-TOUR-WAYS-002: names quiet roads, roads, ferries and what it does not know', () => {
    const ways = routeWaysFrom(
      answer([
        edge(0, 1, { use: 'living_street' }),
        edge(1, 2, { use: 'road', road_class: 'secondary', surface: 'paved_rough' }),
        edge(2, 3, { use: 'ferry', surface: undefined }),
        edge(3, 4, { use: 'something_new', surface: 'wood' }),
      ])
    );
    expect(ways?.edges.map(({ way, surface }) => [way, surface])).toEqual([
      ['quiet', 'paved'],
      ['road', 'rough'],
      ['ferry', 'unknown'],
      ['other', 'unknown'],
    ]);
  });

  it('FE-TOUR-WAYS-011: reads the hiking grade of each edge, and no grade, a 0 or anything else as none (RUN-02)', () => {
    const ways = routeWaysFrom(
      answer([
        edge(0, 1, { use: 'path', sac_scale: 1 }),
        edge(1, 2, { use: 'path', sac_scale: 2 }),
        edge(2, 3, { use: 'road', sac_scale: 0 }),
        edge(3, 4, { use: 'road' }),
      ])
    );
    expect(ways?.edges.map((e) => e.sac)).toEqual(['t1', 't2', 'none', 'none']);
    expect([3, 4, 5, 6].map(sacClassOf)).toEqual(['t3', 't4', 't5', 't6']);
    for (const value of [7, -1, 2.5, '2', null]) expect(sacClassOf(value)).toBe('none');
  });

  it('FE-TOUR-WAYS-003: drops an edge without its place on the line, and is null for no answer of that kind', () => {
    const ways = routeWaysFrom(
      answer([edge(0, 1), { ...edge(1, 2), end_shape_index: 9 }, { ...edge(2, 1) }, { ...edge(2, 3), length: -1 }])
    );
    expect(ways?.edges).toHaveLength(1);
    expect(routeWaysFrom(null)).toBeNull();
    expect(routeWaysFrom({ shape: 1, edges: [] })).toBeNull();
    expect(routeWaysFrom(answer([]))).toBeNull();
    expect(routeWaysFrom(answer([edge(0, 0)], [[47, 11]]))).toBeNull();
  });
});

const WAYS: RouteWays = {
  line: LINE,
  edges: [
    { from: 0, to: 1, lengthM: 300, surface: 'paved', way: 'road', sac: 'none', wayId: 1 },
    { from: 1, to: 2, lengthM: 100, surface: 'gravel', way: 'track', sac: 'none', wayId: 2 },
    { from: 2, to: 3, lengthM: 100, surface: 'gravel', way: 'track', sac: 'none', wayId: 2 },
    { from: 3, to: 4, lengthM: 0, surface: 'ground', way: 'path', sac: 'none', wayId: null },
  ],
};

describe('what the line runs on (BIK-01 to BIK-05)', () => {
  it('FE-TOUR-WAYS-004: shares by class, the largest first, a class with no length left out', () => {
    expect(sharesBy(WAYS, (e) => e.surface)).toEqual([
      { key: 'paved', lengthM: 300, share: 0.6 },
      { key: 'gravel', lengthM: 200, share: 0.4 },
    ]);
    expect(sharesBy({ line: LINE, edges: [] }, (e) => e.surface)).toEqual([]);
  });

  it('FE-TOUR-WAYS-013: the share known to be unpaved, and none where nothing is', () => {
    expect(unpavedShareOf(WAYS)).toBe(0.4);
    // Paved all the way is a plain 0, not a missing figure; a line with no surface on record has none.
    expect(unpavedShareOf({ line: LINE, edges: [WAYS.edges[0]] })).toBe(0);
    expect(unpavedShareOf({ line: LINE, edges: [{ ...WAYS.edges[0], surface: 'unknown' }] })).toBeNull();
  });

  it('FE-TOUR-WAYS-005: the stretches of a class, neighbours joined into one line each', () => {
    expect(stretchesOf(WAYS, (e) => e.surface === 'gravel')).toEqual([LINE.slice(1, 4)]);
    expect(stretchesOf(WAYS, (e) => e.surface !== 'gravel')).toEqual([LINE.slice(0, 2), LINE.slice(3, 5)]);
    expect(stretchesOf(WAYS, () => false)).toEqual([]);
  });

  it('FE-TOUR-WAYS-006: the ways to grade, each once, in riding order, at most as many as asked', () => {
    expect(wayIdsOf(WAYS, 10)).toEqual([1, 2]);
    expect(wayIdsOf(WAYS, 1)).toEqual([1]);
  });

  it('FE-TOUR-WAYS-007: a trail grade by its step, S4 and up together, none where there is none', () => {
    expect(trailClassOf({ mtb_scale: '0' })).toBe('s0');
    expect(trailClassOf({ mtb_scale: '2+' })).toBe('s2');
    expect(trailClassOf({ mtb_scale: '5' })).toBe('s4');
    expect(trailClassOf({ mtb_scale: null })).toBe('none');
    expect(trailClassOf({ mtb_scale: 'x' })).toBe('none');
    expect(trailClassOf(undefined)).toBe('none');
  });
});

describe('the paints and the highlight (BIK-01 to BIK-05)', () => {
  it('FE-TOUR-WAYS-008: a class names its token; an ungraded way is grey', () => {
    expect(surfacePaintKey('gravel')).toBe('gravel');
    expect(trailPaintKey('s3')).toBe('s3');
    expect(trailPaintKey('none')).toBe('unknown');
    expect(trailPaintKey('unasked')).toBe('unknown');
    expect(bikePaintCss('s1')).toBe('var(--bike-trail-s1)');
  });

  const paint = { gravel: '#a0522d', way: '#111', casing: '#fff' } as Parameters<typeof withRouteHighlight>[4];

  it('FE-TOUR-WAYS-009: lays the highlighted stretches over the route in their paint, solid', () => {
    const route = [LINE.slice(0, 3), LINE.slice(2)];
    const drawn = withRouteHighlight(
      { id: 'surface:gravel', lines: [LINE.slice(1, 3)], paint: 'gravel' },
      route,
      [false, true],
      null,
      paint
    );
    expect(drawn.route).toEqual([...route, LINE.slice(1, 3)]);
    expect(drawn.walking).toEqual([false, true, false]);
    expect(drawn.colors).toEqual([undefined, undefined, { line: '#a0522d', casing: '#fff' }]);
    const way = withRouteHighlight({ id: 'way:track', lines: [LINE], paint: 'track' }, route, null, null, paint);
    expect(way.colors?.[2]).toEqual({ line: '#111', casing: '#fff' });
    expect(way.walking).toBeNull();
  });

  it('FE-TOUR-WAYS-010: without a highlight, or a route to lay it on, the lines stay as they came', () => {
    const route = [LINE];
    const colors = [{ line: '#00f', casing: '#fff' }];
    expect(withRouteHighlight(null, route, [false], colors, paint)).toEqual({ route, walking: [false], colors });
    expect(withRouteHighlight({ id: 'x', lines: [], paint: 'gravel' }, route, null, null, paint).route).toBe(route);
    expect(withRouteHighlight({ id: 'x', lines: [LINE], paint: 'gravel' }, null, null, null, paint).route).toBeNull();
  });

  it('FE-TOUR-WAYS-014: lines of different paints each take their own, an unknown key the accent (MAP-03)', () => {
    const drawn = withRouteHighlight(
      {
        id: 'sac',
        lines: [LINE.slice(0, 2), LINE.slice(1, 3), LINE.slice(2)],
        paint: 'gravel',
        paints: ['way', 'nope'],
      },
      [LINE],
      null,
      null,
      paint
    );
    expect(drawn.colors?.slice(1)).toEqual([
      { line: '#111', casing: '#fff' },
      { line: '#111', casing: '#fff' },
      { line: '#a0522d', casing: '#fff' },
    ]);
  });
});
