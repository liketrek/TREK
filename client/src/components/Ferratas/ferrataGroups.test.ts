// FE-FERRATA-GROUP-001 to FE-FERRATA-GROUP-009: OSM's short segments read back as the ferratas a climber means.
import { describe, expect, it } from 'vitest';

import type { Ferrata } from '@trek/shared';

import {
  FERRATA_NAME_REACH_M,
  ferrataBboxesMeet,
  ferrataGradeRange,
  ferrataGroupOf,
  ferrataGroupsInView,
  groupFerratas,
} from './ferrataGroups';

/** About 111 m of latitude. */
const STEP = 0.001;

function segment(
  id: number,
  from: [number, number],
  options: {
    name?: string | null;
    routeName?: string | null;
    level?: number | null;
    plus?: '+' | '-' | null;
    raw?: string;
  } = {}
): Ferrata {
  const level = options.level === undefined ? 3 : options.level;
  return {
    id: `way/${id}`,
    name: options.name === undefined ? 'Via X' : options.name,
    routeName: options.routeName ?? null,
    grade: { raw: options.raw ?? (level === null ? null : String(level)), level, plus: options.plus ?? null },
    geometry: [from, [from[0] + STEP, from[1]]],
    osmUrl: `https://www.openstreetmap.org/way/${id}`,
  };
}

describe('groupFerratas', () => {
  it('FE-FERRATA-GROUP-001: joins touching segments of one name into one ferrata, named after them', () => {
    const groups = groupFerratas([
      segment(2, [46.5, 11.7], { level: 4 }),
      segment(1, [46.5 + STEP, 11.7], { level: 2 }),
      segment(3, [46.5 + 2 * STEP, 11.7], { level: 3 }),
    ]);
    expect(groups).toHaveLength(1);
    const [group] = groups;
    expect(group?.id).toBe('group/way/1');
    expect(group?.name).toBe('Via X');
    expect(group?.segments.map((s) => s.id)).toEqual(['way/2', 'way/1', 'way/3']);
    expect(group?.lengthM).toBeGreaterThan(330);
    expect(group?.lengthM).toBeLessThan(340);
  });

  it('FE-FERRATA-GROUP-002: chains segments within the reach, and keeps a homonym far away apart', () => {
    const gap = (FERRATA_NAME_REACH_M - 50) / 111_195;
    const groups = groupFerratas([
      segment(1, [46.5, 11.7]),
      segment(2, [46.5 + STEP + gap, 11.7]),
      // The same name ten kilometres north is another ferrata.
      segment(3, [46.6, 11.7]),
    ]);
    expect(groups.map((g) => g.segments.map((s) => s.id))).toEqual([['way/1', 'way/2'], ['way/3']]);
  });

  it('FE-FERRATA-GROUP-003: reads names without case or outer spaces, and keeps every unnamed segment alone', () => {
    const groups = groupFerratas([
      segment(1, [46.5, 11.7], { name: 'Via X' }),
      segment(2, [46.5 + STEP, 11.7], { name: '  via x ' }),
      segment(3, [46.5, 11.71], { name: null }),
      segment(4, [46.5 + STEP, 11.71], { name: null }),
    ]);
    expect(groups.map((g) => g.segments.length)).toEqual([2, 1, 1]);
    expect(groups[1]?.name).toBeNull();
  });

  it('FE-FERRATA-GROUP-004: groups by the route relation first, over a wider reach and whatever the ways are named', () => {
    const groups = groupFerratas([
      segment(10, [46.5, 11.7], { routeName: 'Brigata Tridentina', name: 'Pitch 1' }),
      // 1.5 km on, the same route.
      segment(11, [46.5135, 11.7], { routeName: 'Brigata Tridentina', name: null }),
      // A way named like the route but outside the relation is its own ferrata.
      segment(12, [46.5 + STEP, 11.7], { name: 'Brigata Tridentina' }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.segments.map((s) => s.id)).toEqual(['way/10', 'way/11']);
    expect(groups[0]?.routeName).toBe('Brigata Tridentina');
    expect(groups[0]?.name).toBe('Pitch 1');
  });

  it('FE-FERRATA-GROUP-005: spans the grades from the easiest to the hardest segment, minus before plus', () => {
    const [group] = groupFerratas([
      segment(1, [46.5, 11.7], { level: 4, plus: '+' }),
      segment(2, [46.5 + STEP, 11.7], { level: 2, plus: '-' }),
      segment(3, [46.5 + 2 * STEP, 11.7], { level: 2 }),
      segment(4, [46.5 + 3 * STEP, 11.7], { level: null }),
    ]);
    expect(group && ferrataGradeRange(group)).toEqual({ from: 'K2-', to: 'K4+' });
    expect(group?.rawGrade).toBeNull();
  });

  it('FE-FERRATA-GROUP-006: without a numeric grade keeps the tag as written, and has no range', () => {
    const [group] = groupFerratas([segment(1, [46.5, 11.7], { level: null, raw: 'C/D' })]);
    expect(group && ferrataGradeRange(group)).toBeNull();
    expect(group?.rawGrade).toBe('C/D');
    const [single] = groupFerratas([segment(2, [46.5, 11.7], { level: 3 })]);
    expect(single && ferrataGradeRange(single)).toEqual({ from: 'K3', to: 'K3' });
  });

  it('FE-FERRATA-GROUP-007: puts the label halfway along the longest segment and spans every segment in its box', () => {
    const long: Ferrata = {
      ...segment(1, [46.5, 11.7]),
      geometry: [
        [46.5, 11.7],
        [46.5 + 4 * STEP, 11.7],
      ],
    };
    const [group] = groupFerratas([segment(2, [46.5 + 4 * STEP, 11.7]), long]);
    expect(group?.midpoint[0]).toBeCloseTo(46.502, 5);
    expect(group?.midpoint[1]).toBeCloseTo(11.7, 5);
    expect(group?.bbox.south).toBe(46.5);
    expect(group?.bbox.north).toBeCloseTo(46.505, 9);
    expect(group?.bbox.west).toBe(11.7);
    expect(group?.bbox.east).toBe(11.7);
  });

  it('FE-FERRATA-GROUP-008: finds the ferrata a way belongs to, and counts the ferratas reaching into a view', () => {
    const groups = groupFerratas([
      segment(1, [46.5, 11.7]),
      segment(2, [46.5 + STEP, 11.7]),
      segment(3, [46.6, 11.8], { name: 'Other' }),
    ]);
    expect(ferrataGroupOf(groups, 'way/2')?.id).toBe('group/way/1');
    expect(ferrataGroupOf(groups, 'way/99')).toBeNull();
    expect(ferrataGroupOf(groups, null)).toBeNull();
    expect(ferrataGroupsInView(groups, { south: 46.49, west: 11.69, north: 46.51, east: 11.71 })).toBe(1);
    expect(ferrataGroupsInView(groups, { south: 46.4, west: 11.6, north: 46.7, east: 11.9 })).toBe(2);
    expect(ferrataGroupsInView(groups, null)).toBe(0);
  });

  it('FE-FERRATA-GROUP-009: boxes meet on a shared edge, not across a gap; a line under two points is dropped', () => {
    const box = { south: 0, west: 0, north: 1, east: 1 };
    expect(ferrataBboxesMeet(box, { south: 1, west: 1, north: 2, east: 2 })).toBe(true);
    expect(ferrataBboxesMeet(box, { south: 1.1, west: 0, north: 2, east: 1 })).toBe(false);
    const point = { ...segment(1, [46.5, 11.7]), geometry: [[46.5, 11.7]] } as Ferrata;
    expect(groupFerratas([point])).toEqual([]);
  });
});
