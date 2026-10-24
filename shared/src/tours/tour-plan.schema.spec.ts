import { tourPlanCreateRequestSchema, tourProposalSchema, tourProposeRequestSchema } from './tour-plan.schema';

import { describe, expect, it } from 'vitest';

const POINTS = [
  { lat: 47.9, lng: 11.1 },
  { lat: 47.95, lng: 11.15, name: 'Herrsching' },
];

describe('tourProposeRequestSchema', () => {
  it('TOUR-PLAN-001: a bike tour and a run are proposed with their own profile, the profile optional', () => {
    expect(tourProposeRequestSchema.safeParse({ name: 'Lake', activity: 'bike', waypoints: POINTS }).success).toBe(
      true,
    );
    const run = { name: 'Isar', activity: 'run', run_profile: 'trail', waypoints: POINTS };
    expect(tourProposeRequestSchema.parse(run).run_profile).toBe('trail');
  });

  it('TOUR-PLAN-002: refuses a profile of the other kind, a pace on a bike tour, a hike and a stage at the start', () => {
    const bad = [
      { name: 'X', activity: 'bike', run_profile: 'trail', waypoints: POINTS },
      { name: 'X', activity: 'bike', run_pace_seconds_per_km: 360, waypoints: POINTS },
      { name: 'X', activity: 'run', bike_profile: 'road', waypoints: POINTS },
      { name: 'X', activity: 'hike', waypoints: POINTS },
      { name: 'X', activity: 'bike', waypoints: [{ ...POINTS[0], stage_end: true }, POINTS[1]] },
      { name: 'X', activity: 'bike', max_hiking_difficulty: 3, waypoints: POINTS },
    ];
    for (const request of bad) expect(tourProposeRequestSchema.safeParse(request).success).toBe(false);
  });
});

describe('tourPlanCreateRequestSchema', () => {
  it("TOUR-PLAN-003: a run is created only with the runner's pace, a bike tour without one", () => {
    const run = { name: 'Isar', activity: 'run', waypoints: POINTS };
    const refused = tourPlanCreateRequestSchema.safeParse(run);
    expect(refused.success).toBe(false);
    expect(refused.error?.issues[0]?.path).toEqual(['run_pace_seconds_per_km']);
    expect(tourPlanCreateRequestSchema.safeParse({ ...run, run_pace_seconds_per_km: 330 }).success).toBe(true);
    expect(tourPlanCreateRequestSchema.safeParse({ ...run, run_pace_seconds_per_km: 30 }).success).toBe(false);
    const bike = {
      name: 'Lake',
      activity: 'bike',
      bike_profile: 'road',
      waypoints: POINTS,
      day_id: 4,
      start_time: '09:00',
    };
    expect(tourPlanCreateRequestSchema.safeParse(bike).success).toBe(true);
  });
});

describe('tourProposalSchema', () => {
  it("TOUR-PLAN-004: holds a hike's limit, preferences and grades at null and knows a pace as a time's basis", () => {
    const shape = tourProposalSchema.shape;
    expect(shape.max_hiking_difficulty.safeParse(null).success).toBe(true);
    expect(shape.max_hiking_difficulty.safeParse(2).success).toBe(false);
    expect(shape.duration_basis.safeParse('pace').success).toBe(true);
    expect(shape.duration_basis.safeParse('din33466').success).toBe(false);
    expect(shape.activity.safeParse('run').success).toBe(true);
  });
});
