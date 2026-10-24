// FE-TOURS-FIXEDLEG-001 to -002: a fixed leg holds only while it joins its two waypoints.
import { describe, expect, it } from 'vitest';
import { densifyLine, keepJoinedFixedLegs, lineLengthM } from './tourFixedLegs';

const leg = {
  kind: 'ferrata' as const,
  ref: 'way/1',
  name: 'Via A',
  geometry: [
    [47.4, 11.0],
    [47.401, 11.0],
  ] as [number, number][],
};

describe('keepJoinedFixedLegs', () => {
  it('FE-TOURS-FIXEDLEG-001: keeps a leg that joins its waypoints and drops one that a move, a removal or a bad row broke', () => {
    const joined = [
      { lat: 47.4, lng: 11.0, fixedLeg: leg },
      { lat: 47.401, lng: 11.0 },
    ];
    expect(keepJoinedFixedLegs(joined)[0]?.fixedLeg).toBe(leg);

    const moved = [
      { lat: 47.4, lng: 11.0, fixedLeg: leg },
      { lat: 47.41, lng: 11.0 },
    ];
    expect(keepJoinedFixedLegs(moved)[0]).not.toHaveProperty('fixedLeg');

    const last = [{ lat: 47.401, lng: 11.0, fixedLeg: leg }];
    expect(keepJoinedFixedLegs(last)[0]).not.toHaveProperty('fixedLeg');

    const broken = [
      { lat: 47.4, lng: 11.0, fixedLeg: { ...leg, kind: 'boat' } as never },
      { lat: 47.401, lng: 11.0 },
    ];
    expect(keepJoinedFixedLegs(broken)[0]).not.toHaveProperty('fixedLeg');
  });

  it('FE-TOURS-FIXEDLEG-002: measures a line in metres', () => {
    expect(lineLengthM(leg.geometry)).toBeCloseTo(111.2, 0);
    expect(lineLengthM([])).toBe(0);
  });
});

describe('densifyLine', () => {
  it('puts a point every 25 m on a straight leg and keeps its ends and its length', () => {
    const line: [number, number][] = [
      [47, 11],
      [47.001, 11],
    ];
    const dense = densifyLine(line);
    expect(dense[0]).toEqual(line[0]);
    expect(dense[dense.length - 1]).toEqual(line[1]);
    // About 111 m: four stretches of under 28 m.
    expect(dense).toHaveLength(5);
    expect(Math.round(lineLengthM(dense))).toBe(Math.round(lineLengthM(line)));
  });

  it('leaves a leg shorter than one step as it was', () => {
    const line: [number, number][] = [
      [47, 11],
      [47.0001, 11],
    ];
    expect(densifyLine(line)).toEqual(line);
  });
});
