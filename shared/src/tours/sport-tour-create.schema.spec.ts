import { paddleTourCreateRequestSchema, skiTourCreateRequestSchema } from './sport-tour-create.schema';

import { describe, expect, it } from 'vitest';

const POINTS = [
  { lat: 48.1, lng: 11.6, name: 'Put-in' },
  { lat: 48.15, lng: 11.62 },
];

describe('paddleTourCreateRequestSchema', () => {
  it('SPORT-CREATE-001: a paddle tour names its water; the boat, styles and speeds may be left out', () => {
    expect(
      paddleTourCreateRequestSchema.safeParse({ name: 'Isar', waypoints: POINTS, water_context: 'river' }).success,
    ).toBe(true);
    expect(paddleTourCreateRequestSchema.safeParse({ name: 'Isar', waypoints: POINTS }).success).toBe(false);
    expect(
      paddleTourCreateRequestSchema.safeParse({ name: 'Isar', waypoints: POINTS, water_context: 'sea' }).success,
    ).toBe(false);
    expect(
      paddleTourCreateRequestSchema.safeParse({ name: 'Isar', waypoints: [POINTS[0]], water_context: 'lake' }).success,
    ).toBe(false);
  });
});

describe('skiTourCreateRequestSchema', () => {
  it('SPORT-CREATE-002: a cross-country tour needs its technique, no other discipline takes one', () => {
    const base = { name: 'Loipe', waypoints: POINTS };
    expect(skiTourCreateRequestSchema.safeParse({ ...base, discipline: 'alpine' }).success).toBe(true);
    const missing = skiTourCreateRequestSchema.safeParse({ ...base, discipline: 'cross_country' });
    expect(missing.error?.issues[0]?.path).toEqual(['technique']);
    expect(
      skiTourCreateRequestSchema.safeParse({ ...base, discipline: 'cross_country', technique: 'skating' }).success,
    ).toBe(true);
    expect(skiTourCreateRequestSchema.safeParse({ ...base, discipline: 'alpine', technique: 'classic' }).success).toBe(
      false,
    );
  });
});
