import {
  HIKE_MAX_LINE_POINTS,
  HIKE_PLAN_LINE_POINTS,
  HIKE_PLAN_MAX_WAYPOINTS,
  HIKE_PLAN_PROFILE_SAMPLES,
  hikeLinePointSchema,
  hikePlanRequestSchema,
  hikePlanSchema,
  hikeProfileSampleSchema,
} from './hike-plan.schema';

import { describe, expect, it } from 'vitest';

const point = (index: number) => ({ lat: 47.4 + index / 100, lng: 11.1 });

const routed = {
  kind: 'routed',
  max_hiking_difficulty: 3,
  hiking_preferences: null,
  distance_m: 8200,
  ascent_m: 640,
  descent_m: 640,
  duration_minutes: 200,
  duration_basis: 'din33466',
  has_heights: true,
  line: [
    [47.4, 11.1, 720],
    [47.41, 11.1, 1360],
  ],
  profile: [
    [0, 720],
    [8200, 1360],
  ],
  grades: { segments: [{ from_m: 0, to_m: 1200, sac: 2 }], highest: 2, unknown_share: 0.4 },
};

describe('a hike the server plans through its points', () => {
  it('HIKE-PLAN-SCHEMA-001: takes two points and nothing else, and the limit, the preferences and the names it can be given', () => {
    expect(hikePlanRequestSchema.safeParse({ waypoints: [point(0), point(1)] }).success).toBe(true);
    const full = {
      waypoints: [
        { ...point(0), name: 'Parking' },
        { ...point(1), poi_category: 'shelter' },
        { ...point(2), name: 'Summit', poi_category: 'peak' },
      ],
      max_hiking_difficulty: 4,
      hiking_preferences: { avoid_steps: true },
    };
    expect(hikePlanRequestSchema.parse(full)).toEqual(full);
    expect(hikePlanRequestSchema.safeParse({ ...full, hiking_preferences: null }).success).toBe(true);
  });

  it('HIKE-PLAN-SCHEMA-002: refuses a single point, too many, a limit off the scale, an unknown preference and an unknown key', () => {
    const two = [point(0), point(1)];
    expect(hikePlanRequestSchema.safeParse({ waypoints: [point(0)] }).success).toBe(false);
    const many = Array.from({ length: HIKE_PLAN_MAX_WAYPOINTS + 1 }, (_, index) => point(index));
    expect(hikePlanRequestSchema.safeParse({ waypoints: many }).success).toBe(false);
    expect(hikePlanRequestSchema.safeParse({ waypoints: two, max_hiking_difficulty: 7 }).success).toBe(false);
    expect(hikePlanRequestSchema.safeParse({ waypoints: two, max_hiking_difficulty: 0 }).success).toBe(false);
    expect(hikePlanRequestSchema.safeParse({ waypoints: two, hiking_preferences: { avoid_snow: true } }).success).toBe(
      false,
    );
    expect(hikePlanRequestSchema.safeParse({ waypoints: two, tripId: 1 }).success).toBe(false);
    expect(hikePlanRequestSchema.safeParse({ waypoints: [{ lat: 91, lng: 0 }, point(1)] }).success).toBe(false);
    expect(
      hikePlanRequestSchema.safeParse({ waypoints: [{ ...point(0), poi_category: 'volcano' }, point(1)] }).success,
    ).toBe(false);
  });

  it('HIKE-PLAN-SCHEMA-003: reads a routed plan with or without heights and grades', () => {
    expect(hikePlanSchema.parse(routed)).toEqual(routed);
    const flat = {
      ...routed,
      ascent_m: null,
      descent_m: null,
      duration_basis: 'router',
      has_heights: false,
      line: [
        [47.4, 11.1],
        [47.41, 11.1],
      ],
      profile: [],
      grades: null,
    };
    expect(hikePlanSchema.safeParse(flat).success).toBe(true);
  });

  it('HIKE-PLAN-SCHEMA-004: keeps a routed plan within what it shows: a line, a profile and grades within their bounds', () => {
    const long = Array.from({ length: HIKE_PLAN_LINE_POINTS + 1 }, () => [47.4, 11.1]);
    expect(hikePlanSchema.safeParse({ ...routed, line: long }).success).toBe(false);
    const samples = Array.from({ length: HIKE_PLAN_PROFILE_SAMPLES + 1 }, (_, index) => [index, 700]);
    expect(hikePlanSchema.safeParse({ ...routed, profile: samples }).success).toBe(false);
    const hard = { ...routed.grades, segments: [{ from_m: 0, to_m: 10, sac: 7 }] };
    expect(hikePlanSchema.safeParse({ ...routed, grades: hard }).success).toBe(false);
    expect(hikePlanSchema.safeParse({ ...routed, grades: { ...routed.grades, unknown_share: 1.2 } }).success).toBe(
      false,
    );
    expect(hikePlanSchema.safeParse({ ...routed, duration_basis: 'guess' }).success).toBe(false);
  });

  it('HIKE-PLAN-SCHEMA-005: says why no way was planned, with the point no way reaches where that is the reason', () => {
    const off = { kind: 'unrouted', max_hiking_difficulty: 2, why: 'point_off_the_way', position: 3, snapped_m: 520 };
    expect(hikePlanSchema.parse(off)).toEqual(off);
    const none = { kind: 'unrouted', max_hiking_difficulty: 2, why: 'no_valhalla', position: null, snapped_m: null };
    expect(hikePlanSchema.safeParse(none).success).toBe(true);
    expect(hikePlanSchema.safeParse({ ...none, why: 'tired' }).success).toBe(false);
    expect(hikePlanSchema.safeParse({ ...off, position: 0 }).success).toBe(false);
    expect(hikePlanSchema.safeParse({ ...none, why: 'too_long' }).success).toBe(true);
  });

  it('HIKE-PLAN-SCHEMA-006: reads a point of the line with or without its height, inside the globe only', () => {
    expect(hikeLinePointSchema.safeParse([47.4, 11.1]).success).toBe(true);
    expect(hikeLinePointSchema.safeParse([47.4, 11.1, 812.5]).success).toBe(true);
    expect(hikeLinePointSchema.safeParse([91, 11.1]).success).toBe(false);
    expect(hikeLinePointSchema.safeParse([47.4, 181, 800]).success).toBe(false);
    expect(hikeLinePointSchema.safeParse([47.4, 11.1, Number.NaN]).success).toBe(false);
    expect(hikeProfileSampleSchema.safeParse([-1, 800]).success).toBe(false);
    // A line that long takes some twenty height questions, and stays far below a tour write.
    expect(HIKE_MAX_LINE_POINTS).toBe(10_000);
  });
});
