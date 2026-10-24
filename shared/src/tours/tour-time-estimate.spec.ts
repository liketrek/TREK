import {
  hikingTimeMinutes,
  tourTimeEstimate,
  tourTimeEstimateSchema,
  type TourTimeEstimateSource,
} from './tour-time-estimate';

import { describe, expect, it } from 'vitest';

// FE-TOURS-HIKINGTIME-001 to -003 moved here with the rule; TIME-01-001 on: the estimate of a tour without a planned time.
describe('hikingTimeMinutes (DIN 33466)', () => {
  it('FE-TOURS-HIKINGTIME-001: on the flat it is 4 km an hour', () => {
    expect(hikingTimeMinutes(8, 0, 0)).toBe(120);
  });

  it('FE-TOURS-HIKINGTIME-002: a short steep climb is ruled by the height, the distance counts by half', () => {
    // 2 km and 450 m up: 1.5 h for the height plus half of 0.5 h for the distance.
    expect(hikingTimeMinutes(2, 450, 0)).toBe(105);
  });

  it('FE-TOURS-HIKINGTIME-003: a long walk is ruled by the distance, the height counts by half', () => {
    // 12 km, 300 m up and 500 m down: 3 h for the distance plus half of 2 h for the height.
    expect(hikingTimeMinutes(12, 300, 500)).toBe(240);
  });
});

const imported = (over: Partial<TourTimeEstimateSource> = {}): TourTimeEstimateSource => ({
  tour_type: 'hike',
  distance: 12,
  elevation_gain: 300,
  elevation_loss: 500,
  duration: null,
  run_pace_seconds_per_km: null,
  ...over,
});

describe('tourTimeEstimate (TIME-01)', () => {
  it('TIME-01-001: an imported hike is estimated by the planner rule from its own climb and descent', () => {
    expect(tourTimeEstimate(imported())).toEqual({ minutes: 240, basis: 'din33466' });
  });

  it('TIME-01-002: a hike without heights is unknown, never timed as if it were flat', () => {
    expect(tourTimeEstimate(imported({ elevation_gain: null, elevation_loss: null }))).toEqual({
      minutes: null,
      basis: 'din33466',
    });
    expect(tourTimeEstimate(imported({ elevation_loss: null }))?.minutes).toBeNull();
  });

  it('TIME-01-003: a tour the planner timed keeps its own time and is not estimated', () => {
    expect(tourTimeEstimate(imported({ duration: 200 }))).toBeNull();
    expect(tourTimeEstimate(imported({ duration: 0 }))).toBeNull();
  });

  it('TIME-01-004: a run is estimated at the pace its runners entered, and without one not at all', () => {
    expect(tourTimeEstimate(imported({ tour_type: 'run', distance: 8, run_pace_seconds_per_km: 360 }))).toEqual({
      minutes: 48,
      basis: 'run_pace',
    });
    expect(tourTimeEstimate(imported({ tour_type: 'run', run_pace_seconds_per_km: null }))).toBeNull();
    expect(tourTimeEstimate(imported({ tour_type: 'run', run_pace_seconds_per_km: undefined }))).toBeNull();
  });

  it('TIME-01-005: types timed by a router, a speed of their own or nothing get no estimate', () => {
    for (const type of ['bike', 'walk', 'kayak', 'ski', 'horse', 'food']) {
      expect(tourTimeEstimate(imported({ tour_type: type, run_pace_seconds_per_km: 360 }))).toBeNull();
    }
  });

  it('TIME-01-006: without a distance there is nothing to estimate', () => {
    expect(tourTimeEstimate(imported({ distance: null }))).toBeNull();
  });

  it('TIME-01-007: the wire shape takes whole minutes or null and a known basis only', () => {
    expect(tourTimeEstimateSchema.safeParse({ minutes: 240, basis: 'din33466' }).success).toBe(true);
    expect(tourTimeEstimateSchema.safeParse({ minutes: null, basis: 'run_pace' }).success).toBe(true);
    expect(tourTimeEstimateSchema.safeParse({ minutes: 1.5, basis: 'din33466' }).success).toBe(false);
    expect(tourTimeEstimateSchema.safeParse({ minutes: 10, basis: 'router' }).success).toBe(false);
  });
});
