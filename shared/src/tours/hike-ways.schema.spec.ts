// HIKE-WAYS-SCHEMA-001 to HIKE-WAYS-SCHEMA-004: what a round hike and the ways of a leg are asked with.
import { hikeLegCount, hikeLegWayRequestSchema, hikeRoundProposeRequestSchema } from './hike-ways.schema';

import { describe, expect, it } from 'vitest';

const A = { lat: 47.5, lng: 11.1, name: 'Car park' };
const B = { lat: 47.52, lng: 11.14 };
const C = { lat: 47.55, lng: 11.2, name: 'Hut' };

describe('hikeRoundProposeRequestSchema', () => {
  it('HIKE-WAYS-SCHEMA-001: a round is asked from one point for a length in range', () => {
    expect(hikeRoundProposeRequestSchema.parse({ name: 'Round', start: A, distance_km: 12 })).toMatchObject({
      distance_km: 12,
    });
    expect(hikeRoundProposeRequestSchema.safeParse({ name: 'Round', start: A, distance_km: 0.5 }).success).toBe(false);
    expect(hikeRoundProposeRequestSchema.safeParse({ name: 'Round', start: A, distance_km: 61 }).success).toBe(false);
    expect(
      hikeRoundProposeRequestSchema.safeParse({ name: 'Round', start: A, distance_km: 8, round: 'd' }).success,
    ).toBe(false);
    expect(hikeRoundProposeRequestSchema.safeParse({ name: 'Round', start: A, distance_km: 8, extra: 1 }).success).toBe(
      false,
    );
  });
});

describe('hikeLegWayRequestSchema', () => {
  it('HIKE-WAYS-SCHEMA-002: a hike has one leg fewer than points, a round trip one more for its way back', () => {
    expect(hikeLegCount(3, false)).toBe(2);
    expect(hikeLegCount(3, true)).toBe(3);
    expect(hikeLegCount(0, false)).toBe(0);
  });

  it('HIKE-WAYS-SCHEMA-003: only a leg the hike has can be asked for', () => {
    const base = { name: 'Hike', waypoints: [A, B, C] };
    expect(hikeLegWayRequestSchema.safeParse({ ...base, leg: 2, way: 'b' }).success).toBe(true);
    expect(hikeLegWayRequestSchema.safeParse({ ...base, leg: 3 }).success).toBe(false);
    expect(hikeLegWayRequestSchema.safeParse({ ...base, leg: 3, round_trip: true }).success).toBe(true);
    expect(hikeLegWayRequestSchema.safeParse({ ...base, leg: 0 }).success).toBe(false);
  });

  it('HIKE-WAYS-SCHEMA-004: the ends of stages hold as a hike’s do', () => {
    const staged = { name: 'Trek', waypoints: [{ ...A, stage_end: true }, B, C], leg: 1 };
    expect(hikeLegWayRequestSchema.safeParse(staged).success).toBe(false);
    const fine = { name: 'Trek', waypoints: [A, { ...B, stage_end: true }, C], leg: 1, tour_id: 4 };
    expect(hikeLegWayRequestSchema.safeParse(fine).success).toBe(true);
  });
});
