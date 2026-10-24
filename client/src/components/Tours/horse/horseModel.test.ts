import type { HorseRoute } from '@trek/shared';
import { describe, expect, it } from 'vitest';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import { accessText, accessToneOf } from './horseAccess';
import { holdsHorseSection, rideLegs, withoutHorseRoutes } from './horseLegs';
import { preferReversed, SECTION_JOINS_M, sectionGapM, sectionLeg, withSectionAppended } from './horseSection';

// FE-HORSE-MODEL-001 to FE-HORSE-MODEL-009

const route: HorseRoute = {
  id: 'relation/42',
  name: null,
  ref: 'R1',
  osmUrl: 'https://www.openstreetmap.org/relation/42',
  continues: true,
  sections: [
    {
      number: 1,
      geometry: [
        [48, 11],
        [48.005, 11],
        [48.01, 11],
      ],
      length_m: 1112,
      access: [
        { value: 'designated', length_m: 800 },
        { value: 'unknown', length_m: 312 },
      ],
      signposted: 'with',
    },
  ],
};
const section = route.sections[0];
const point = (id: string, lat: number, lng: number, extra: Partial<TourPlannerWaypoint> = {}) =>
  ({ id, lat, lng, role: 'via', ...extra }) as TourPlannerWaypoint;
const t = (key: string) => key.split('.').pop() ?? key;

describe('horse route sections on a ride (HOR-01)', () => {
  it('FE-HORSE-MODEL-001: a section as a leg keeps its line, its route and its access, and turns round whole', () => {
    expect(sectionLeg(route, section, false)).toEqual({
      kind: 'horse_route',
      ref: 'relation/42',
      name: 'R1',
      geometry: section.geometry,
      signposted: 'with',
      access: section.access,
    });
    const turned = sectionLeg({ ...route, name: 'Reitweg', ref: null }, section, true);
    expect(turned.name).toBe('Reitweg');
    expect(turned.geometry).toEqual([...section.geometry].reverse());
    expect(turned.signposted).toBe('against');
    expect(sectionLeg({ ...route, ref: null }, { ...section, signposted: null }, true)).toMatchObject({
      name: null,
      signposted: null,
    });
  });

  it('FE-HORSE-MODEL-002: measures the gap from the end of the ride, and has none on an empty ride', () => {
    const leg = sectionLeg(route, section, false);
    expect(sectionGapM([], leg)).toBeNull();
    expect(sectionGapM([point('a', 48, 11)], leg)).toBe(0);
    expect(sectionGapM([point('a', 47.99, 11)], leg)).toBeCloseTo(1112, -1);
  });

  it('FE-HORSE-MODEL-003: offers first the direction that goes on from the ride, else the signposted one', () => {
    expect(preferReversed([point('a', 48.011, 11)], section)).toBe(true);
    expect(preferReversed([point('a', 47.99, 11)], section)).toBe(false);
    expect(preferReversed([], section)).toBe(false);
    expect(preferReversed([], { ...section, signposted: 'against' })).toBe(true);
  });

  it('FE-HORSE-MODEL-004: a section starts an empty ride, goes on from its end, or starts a point of its own', () => {
    const leg = sectionLeg(route, section, false);
    let next = 0;
    const newId = () => `n${(next += 1)}`;
    expect(withSectionAppended([], leg, newId)).toEqual([
      { id: 'n2', lat: 48, lng: 11, role: 'via', fixedLeg: leg },
      { id: 'n1', lat: 48.01, lng: 11, role: 'end' },
    ]);
    const near = point('a', 48 + SECTION_JOINS_M / 200_000, 11);
    expect(withSectionAppended([near], leg, newId)).toEqual([
      { ...near, fixedLeg: leg },
      { id: 'n3', lat: 48.01, lng: 11, role: 'end' },
    ]);
    const far = point('b', 47.99, 11);
    expect(withSectionAppended([far], leg, newId).map((entry) => [entry.id, entry.fixedLeg?.kind ?? null])).toEqual([
      ['b', null],
      ['n5', 'horse_route'],
      ['n4', null],
    ]);
  });

  it('FE-HORSE-MODEL-005: every leg of a ride is a section or drawn by hand, the last point has none', () => {
    const ferrata = {
      kind: 'ferrata' as const,
      ref: 'way/1',
      name: null,
      geometry: [[48, 11] as [number, number], [48.01, 11] as [number, number]],
    };
    const leg = sectionLeg(route, section, false);
    const legs = rideLegs([
      point('a', 47.99, 11),
      point('b', 48, 11, { fixedLeg: leg }),
      point('c', 48.01, 11, { fixedLeg: ferrata }),
      point('d', 48.02, 11),
    ]);
    expect(legs.map((entry) => entry.fixedLeg?.kind ?? null)).toEqual(['free', 'horse_route', 'free', null]);
    expect(legs[0].fixedLeg?.geometry).toEqual([
      [47.99, 11],
      [48, 11],
    ]);
  });

  it('FE-HORSE-MODEL-006: any other type gives a section back to the router and keeps the rest', () => {
    const leg = sectionLeg(route, section, false);
    const drawn = { kind: 'free' as const, geometry: [[47.99, 11] as [number, number], [48, 11] as [number, number]] };
    const points = withoutHorseRoutes([
      point('a', 47.99, 11, { fixedLeg: drawn }),
      point('b', 48, 11, { fixedLeg: leg }),
    ]);
    expect(points.map((entry) => entry.fixedLeg?.kind ?? null)).toEqual(['free', null]);
    expect('fixedLeg' in points[1]).toBe(false);
  });

  it('FE-HORSE-MODEL-007: a point that starts or ends a section is held where the route has it', () => {
    const leg = sectionLeg(route, section, false);
    const points = [point('a', 48, 11, { fixedLeg: leg }), point('b', 48.01, 11), point('c', 48.02, 11)];
    expect(['a', 'b', 'c', 'gone'].map((id) => holdsHorseSection(points, id))).toEqual([true, true, false, false]);
  });

  it('FE-HORSE-MODEL-008: reads a line as its most restrictive tag, unknown before open, nothing as nothing', () => {
    expect(accessToneOf(undefined)).toBeNull();
    expect(accessToneOf([])).toBeNull();
    expect(accessToneOf([{ value: 'yes', length_m: 10 }])).toBe('open');
    expect(
      accessToneOf([
        { value: 'yes', length_m: 10 },
        { value: 'unknown', length_m: 1 },
      ])
    ).toBe('unknown');
    expect(
      accessToneOf([
        { value: 'unknown', length_m: 10 },
        { value: 'destination', length_m: 1 },
      ])
    ).toBe('limited');
    expect(
      accessToneOf([
        { value: 'designated', length_m: 10 },
        { value: 'private', length_m: 1 },
      ])
    ).toBe('closed');
  });

  it('FE-HORSE-MODEL-009: spells the tags out with the metres each covers', () => {
    expect(accessText(section.access, 'metric', t)).toBe('designated 800 m, unknown 312 m');
    expect(accessText(undefined, 'metric', t)).toBe('');
  });
});
