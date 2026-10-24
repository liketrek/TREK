import type { TourTrailGrade } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import type { RouteWayEdge, RouteWays } from '../bike/routeWays';
import { facetClassifier, facetOverlay, facetPaint, facetRows, isUnknownClass, knownShareOf } from './hikeFacets';
import { SAC_FACET } from './sacGrades';
import { SURFACE_FACET } from './wayTagFacets';

// FE-HIKE-FACET-001 to FE-HIKE-FACET-008

const LINE: [number, number][] = Array.from({ length: 8 }, (_, index): [number, number] => [47 + index / 1000, 11]);

const edge = (from: number, wayId: number | null, lengthM = 100): RouteWayEdge => ({
  from,
  to: from + 1,
  lengthM,
  surface: 'paved',
  way: 'path',
  sac: 'none',
  wayId,
});

const grade = (id: number, values: Partial<TourTrailGrade>): TourTrailGrade => ({
  id,
  mtb_scale: null,
  mtb_scale_uphill: null,
  mtb_scale_imba: null,
  sac_scale: null,
  sac_scale_unclear: null,
  surface: null,
  highway: null,
  ...values,
});

// One stretch of each kind: T3 on gravel (twice as long), T1 on pebbles, unclear, untagged, unasked, no way,
// and a T6 way on rock that strays from the tour's own line.
const WAYS: RouteWays = {
  line: LINE,
  edges: [edge(0, 1, 200), edge(1, 2), edge(2, 3), edge(3, 4), edge(4, 5), edge(5, null), edge(6, 7)],
};
const GRADES = {
  byWay: new Map([
    [1, grade(1, { sac_scale: 'demanding_mountain_hiking', surface: 'gravel' })],
    [2, grade(2, { sac_scale: 'hiking', surface: 'pebblestone' })],
    [3, grade(3, { sac_scale_unclear: 'T3;T4', surface: 'gravel;ground' })],
    [7, grade(7, { sac_scale: 'difficult_alpine_hiking', surface: 'rock' })],
  ]),
  unasked: new Set([5]),
};
const STRAYS = new Set([WAYS.edges[6]]);

describe('hikeFacets (MAP-03, MAP-04)', () => {
  it('FE-HIKE-FACET-001: reads each stretch to its class, and every unknown to its own reason, in every facet', () => {
    expect(WAYS.edges.map(facetClassifier(SAC_FACET, GRADES, STRAYS))).toEqual([
      't3',
      't1',
      'unclear',
      'untagged',
      'unasked',
      'unmatched',
      'unmatched',
    ]);
    expect(WAYS.edges.map(facetClassifier(SURFACE_FACET, GRADES, STRAYS))).toEqual([
      'gravel',
      'gravel',
      'unclear',
      'untagged',
      'unasked',
      'unmatched',
      'unmatched',
    ]);
  });

  it('FE-HIKE-FACET-002: the rows come in the facet order, the known first, each with what OpenStreetMap wrote', () => {
    const rows = facetRows(SAC_FACET, WAYS, GRADES, facetClassifier(SAC_FACET, GRADES, STRAYS));
    expect(rows.map((row) => [row.key, row.tags])).toEqual([
      ['t1', ['hiking']],
      ['t3', ['demanding_mountain_hiking']],
      ['untagged', []],
      ['unclear', ['T3;T4']],
      ['unmatched', []],
      ['unasked', []],
    ]);
    expect(rows.find((row) => row.key === 't3')).toMatchObject({ lengthM: 200, share: 0.25 });
    // The stray T6 way is not the tour's: its grade is neither counted nor named.
    expect(rows.find((row) => row.key === 'unmatched')).toMatchObject({ lengthM: 200, tags: [] });
  });

  it('FE-HIKE-FACET-003: a group names every value it took, each once', () => {
    const rows = facetRows(SURFACE_FACET, WAYS, GRADES, facetClassifier(SURFACE_FACET, GRADES, STRAYS));
    expect(rows[0]).toMatchObject({ key: 'gravel', lengthM: 300, tags: ['gravel', 'pebblestone'] });
    expect(rows.find((row) => row.key === 'unclear')?.tags).toEqual(['gravel;ground']);
  });

  it('FE-HIKE-FACET-004: the known share counts the known classes only', () => {
    const rows = facetRows(SAC_FACET, WAYS, GRADES, facetClassifier(SAC_FACET, GRADES, STRAYS));
    expect(knownShareOf(rows)).toBeCloseTo(3 / 8);
    expect(knownShareOf([])).toBe(0);
  });

  it('FE-HIKE-FACET-005: tells the unknown classes from the known', () => {
    expect(['untagged', 'unclear', 'unmatched', 'unasked'].every(isUnknownClass)).toBe(true);
    expect(isUnknownClass('t1')).toBe(false);
    expect(isUnknownClass('gravel')).toBe(false);
  });

  it('FE-HIKE-FACET-006: paints a known class in its facet colour and every unknown in the grey of the unknown', () => {
    expect(facetPaint(SAC_FACET, 't2')).toBe('t2');
    expect(facetPaint(SURFACE_FACET, 'gravel')).toBe('surface:gravel');
    expect(facetPaint(SURFACE_FACET, 'unasked')).toBe('unknown');
    expect(facetPaint(SAC_FACET, 'untagged')).toBe('unknown');
  });

  it('FE-HIKE-FACET-007: draws every class along the line in its paint, neighbours of a class joined', () => {
    const classOf = facetClassifier(SAC_FACET, GRADES, STRAYS);
    const overlay = facetOverlay(SAC_FACET, WAYS, facetRows(SAC_FACET, WAYS, GRADES, classOf), classOf);
    expect(overlay.paints).toEqual(['t1', 't3', 'unknown', 'unknown', 'unknown', 'unknown']);
    expect(overlay.lines).toHaveLength(6);
    // The no-way stretch and the stray one sit side by side and are one stretch of their class.
    expect(overlay.lines[4]).toEqual(LINE.slice(5, 8));
    // On the surface facet the two gravel ways side by side are one stretch.
    const surfaceOf = facetClassifier(SURFACE_FACET, GRADES, STRAYS);
    const surfaces = facetOverlay(SURFACE_FACET, WAYS, facetRows(SURFACE_FACET, WAYS, GRADES, surfaceOf), surfaceOf);
    expect(surfaces.lines[0]).toEqual(LINE.slice(0, 3));
    expect(surfaces.paints[0]).toBe('surface:gravel');
  });

  it('FE-HIKE-FACET-008: draws one class alone when it is picked', () => {
    const classOf = facetClassifier(SAC_FACET, GRADES, STRAYS);
    const overlay = facetOverlay(SAC_FACET, WAYS, facetRows(SAC_FACET, WAYS, GRADES, classOf), classOf, 't3');
    expect(overlay).toEqual({ lines: [LINE.slice(0, 2)], paints: ['t3'] });
  });
});
