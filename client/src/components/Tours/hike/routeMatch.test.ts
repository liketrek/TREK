import { describe, expect, it } from 'vitest';
import type { RouteWayEdge, RouteWays } from '../bike/routeWays';
import { MATCH_TOLERANCE_M, nearLine, straysFrom } from './routeMatch';

// FE-HIKE-MATCH-001 to FE-HIKE-MATCH-006

// At 47° N a ten-thousandth of a degree is about 11 m north to south and 7.6 m east to west.
const NORTH: [number, number][] = [
  [47.0, 11.0],
  [47.002, 11.0],
  [47.004, 11.0],
];

const edge = (from: number, to: number, wayId = 1): RouteWayEdge => ({
  from,
  to,
  lengthM: 100,
  surface: 'unknown',
  way: 'path',
  sac: 'none',
  wayId,
});

describe('nearLine (MAP-03)', () => {
  it('FE-HIKE-MATCH-001: a point on the line or within the tolerance is near, one further off is not', () => {
    const near = nearLine(NORTH, MATCH_TOLERANCE_M);
    expect(near([47.001, 11.0])).toBe(true);
    // About 15 m east of the line.
    expect(near([47.003, 11.0002])).toBe(true);
    // About 38 m east of it.
    expect(near([47.003, 11.0005])).toBe(false);
    // Past the northern end by about 33 m.
    expect(near([47.0043, 11.0])).toBe(false);
    expect(near([48, 12])).toBe(false);
  });

  it('FE-HIKE-MATCH-002: finds the middle of a long straight segment, drawn by hand between two clicks', () => {
    const near = nearLine(
      [
        [47.0, 11.0],
        [47.02, 11.0],
      ],
      MATCH_TOLERANCE_M
    );
    expect(near([47.01, 11.0001])).toBe(true);
    expect(near([47.01, 11.001])).toBe(false);
  });

  it('FE-HIKE-MATCH-003: a line of one point is near only around that point; no line is near nothing', () => {
    const one = nearLine([[47.0, 11.0]], MATCH_TOLERANCE_M);
    expect(one([47.0001, 11.0])).toBe(true);
    expect(one([47.001, 11.0])).toBe(false);
    expect(nearLine([], MATCH_TOLERANCE_M)([47.0, 11.0])).toBe(false);
  });
});

describe('straysFrom (MAP-03)', () => {
  it('FE-HIKE-MATCH-004: a matched line that keeps to the tour has no strays', () => {
    const ways: RouteWays = { line: NORTH, edges: [edge(0, 1), edge(1, 2, 2)] };
    expect(straysFrom(ways, NORTH).size).toBe(0);
  });

  it('FE-HIKE-MATCH-005: an edge on a neighbouring path strays, the ones on the line do not', () => {
    const line: [number, number][] = [...NORTH, [47.004, 11.001], [47.006, 11.001]];
    const ways: RouteWays = { line, edges: [edge(0, 2), edge(2, 4, 2)] };
    const strays = straysFrom(ways, NORTH);
    expect([...strays]).toEqual([ways.edges[1]]);
  });

  it('FE-HIKE-MATCH-006: an edge whose ends touch the line but whose middle cuts across a bend strays', () => {
    const bend: [number, number][] = [
      [47.0, 11.0],
      [47.002, 11.0],
      [47.002, 11.003],
    ];
    const ways: RouteWays = {
      line: [
        [47.0, 11.0],
        [47.002, 11.003],
      ],
      edges: [edge(0, 1)],
    };
    expect(straysFrom(ways, bend).size).toBe(1);
  });
});
