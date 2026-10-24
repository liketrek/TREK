import {
  HORSE_ACCESS_VALUES,
  HORSE_ROUTES_ATTRIBUTION,
  horseAccessTone,
  horseRoutesQuerySchema,
  horseRoutesResponseSchema,
  turnedSignposted,
} from './horse-route.schema';

import { describe, expect, it } from 'vitest';

const section = {
  number: 1,
  geometry: [
    [47.1, 11.2],
    [47.11, 11.21],
  ],
  length_m: 1350,
  access: [
    { value: 'designated', length_m: 900 },
    { value: 'unknown', length_m: 450 },
  ],
  signposted: null,
};
const route = {
  id: 'relation/42',
  name: 'Reitweg Isartal',
  ref: 'R1',
  osmUrl: 'https://www.openstreetmap.org/relation/42',
  continues: false,
  sections: [section],
};
const answer = { routes: [route], truncated: false, source: 'openstreetmap', attribution: HORSE_ROUTES_ATTRIBUTION };

describe('horse routes contract (HOR-01)', () => {
  it('HORSE-SCHEMA-001: reads a map view box as the via ferrata layer does', () => {
    expect(horseRoutesQuerySchema.parse({ bbox: '47.1,11.2,47.4,11.6' }).bbox).toEqual({
      south: 47.1,
      west: 11.2,
      north: 47.4,
      east: 11.6,
    });
    expect(horseRoutesQuerySchema.safeParse({ bbox: '46,11,47,11.4' }).success).toBe(false);
  });

  it('HORSE-SCHEMA-002: takes a route with its sections, their access and signposting', () => {
    expect(horseRoutesResponseSchema.parse(answer)).toEqual(answer);
    const oneWay = { ...section, signposted: 'with' };
    expect(horseRoutesResponseSchema.safeParse({ ...answer, routes: [{ ...route, sections: [oneWay] }] }).success).toBe(
      true,
    );
  });

  it('HORSE-SCHEMA-003: refuses a route of another element, without sections, or a section of one point', () => {
    const refused = [
      { ...route, id: 'way/42' },
      { ...route, sections: [] },
      { ...route, sections: [{ ...section, geometry: [[47.1, 11.2]] }] },
      { ...route, sections: [{ ...section, number: 0 }] },
      { ...route, sections: [{ ...section, access: [{ value: 'maybe', length_m: 1 }] }] },
      { ...route, sections: [{ ...section, signposted: 'forward' }] },
    ];
    for (const item of refused) {
      expect(horseRoutesResponseSchema.safeParse({ ...answer, routes: [item] }).success).toBe(false);
    }
  });

  it('HORSE-SCHEMA-004: sorts every horse=* value into one of four steps, the untagged as unknown', () => {
    expect(Object.fromEntries(HORSE_ACCESS_VALUES.map((value) => [value, horseAccessTone(value)]))).toEqual({
      designated: 'open',
      yes: 'open',
      permissive: 'open',
      destination: 'limited',
      discouraged: 'limited',
      other: 'limited',
      private: 'closed',
      no: 'closed',
      unknown: 'unknown',
    });
  });

  it('HORSE-SCHEMA-005: turns the signposted direction round, and leaves the unsaid unsaid', () => {
    expect(turnedSignposted('with')).toBe('against');
    expect(turnedSignposted('against')).toBe('with');
    expect(turnedSignposted(null)).toBeNull();
    expect(turnedSignposted(undefined)).toBeNull();
  });
});
