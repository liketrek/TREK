import { gpxActivityOf } from '../../../src/nest/tours/tour-gpx-export.helpers';

import { describe, expect, it } from 'vitest';

// TOUR-GPX-ACTIVITY-001 to TOUR-GPX-ACTIVITY-007

describe('gpxActivityOf (PR1-06A, BIK-01, RUN-01, SKI-02, HOR-01)', () => {
  it('TOUR-GPX-ACTIVITY-001: a bike tour names its profile, and the plainest riding without a known one', () => {
    expect(gpxActivityOf({ tour_type: 'bike', bike_profile: 'mtb' })).toBe('mountain_biking');
    expect(gpxActivityOf({ tour_type: 'bike', bike_profile: null })).toBe('cycling');
    expect(gpxActivityOf({ tour_type: 'bike', bike_profile: 'unicycle' })).toBe('cycling');
  });

  it('TOUR-GPX-ACTIVITY-002: a paddle tour names its boat, and paddling without a known one', () => {
    expect(gpxActivityOf({ tour_type: 'kayak', boat_type: 'canoe' })).toBe('canoeing');
    expect(gpxActivityOf({ tour_type: 'kayak', boat_type: null })).toBe('paddling');
    expect(gpxActivityOf({ tour_type: 'kayak', boat_type: 'raft' })).toBe('paddling');
  });

  it('TOUR-GPX-ACTIVITY-003: a hike is hiking, any other type its own key', () => {
    expect(gpxActivityOf({ tour_type: 'hike' })).toBe('hiking');
    expect(gpxActivityOf({ tour_type: 'walk' })).toBe('walk');
  });

  it('TOUR-GPX-ACTIVITY-004: snowshoes make a ski tour snowshoeing, a winter hike stays hiking, a hike is hiking (SKI-02)', () => {
    expect(gpxActivityOf({ tour_type: 'ski', ski_discipline: 'snowshoe' })).toBe('snowshoeing');
    expect(gpxActivityOf({ tour_type: 'ski', ski_discipline: 'winter_hike' })).toBe('hiking');
    expect(gpxActivityOf({ tour_type: 'hike', ski_discipline: null })).toBe('hiking');
    expect(gpxActivityOf({ tour_type: 'walk' })).toBe('walk');
  });

  it('TOUR-GPX-ACTIVITY-005: a run is running, and stays running without a profile this build knows (RUN-01)', () => {
    expect(gpxActivityOf({ tour_type: 'run', run_profile: 'running' })).toBe('running');
    expect(gpxActivityOf({ tour_type: 'run', run_profile: null })).toBe('running');
    expect(gpxActivityOf({ tour_type: 'run', run_profile: 'sprint' })).toBe('running');
    expect(gpxActivityOf({ tour_type: 'run', run_profile: 'trail' })).toBe('trail_running');
  });

  it('TOUR-GPX-ACTIVITY-006: a ski track names its discipline, and skiing without a known one (SKI-02)', () => {
    expect(gpxActivityOf({ tour_type: 'ski', ski_discipline: 'alpine' })).toBe('alpine_skiing');
    expect(gpxActivityOf({ tour_type: 'ski', ski_discipline: 'snowboard' })).toBe('snowboarding');
    expect(gpxActivityOf({ tour_type: 'ski', ski_discipline: 'cross_country' })).toBe('cross_country_skiing');
    expect(gpxActivityOf({ tour_type: 'ski', ski_discipline: 'touring' })).toBe('backcountry_skiing');
    expect(gpxActivityOf({ tour_type: 'ski', ski_discipline: null })).toBe('skiing');
    expect(gpxActivityOf({ tour_type: 'ski', ski_discipline: 'freeride' })).toBe('skiing');
  });

  it('TOUR-GPX-ACTIVITY-007: a horse tour is horseback riding (HOR-01)', () => {
    expect(gpxActivityOf({ tour_type: 'horse' })).toBe('horseback_riding');
  });
});
