import {
  MAX_TOUR_STAGES,
  maxTourMinutesFor,
  TOUR_DAY_MINUTES,
  tourStageCountOf,
  tourStageIssues,
  tourStageKeysOf,
  tourStageStopsOf,
} from './tour-stages';
import {
  MAX_PLANNED_TOUR_DURATION_MINUTES,
  plannedTimeLimitMessage,
  tourCreateRequestSchema,
  tourListItemSchema,
  tourWaypointSchema,
} from './tours.schema';

import { describe, expect, it } from 'vitest';

type Role = 'start' | 'via' | 'end';

/** What a test sets on a point beyond its place and role. */
interface PointExtra {
  stage_end?: boolean;
  shaping?: boolean;
  key?: string;
}

/** A straight run of points along a meridian, each a stop unless told otherwise. */
function points(count: number, extra: (index: number) => PointExtra = () => ({})) {
  return Array.from({ length: count }, (_, sequence) => ({
    lat: 47 + sequence * 0.01,
    lng: 11,
    role: (sequence === 0 ? 'start' : sequence === count - 1 ? 'end' : 'via') as Role,
    sequence,
    ...extra(sequence),
  }));
}

function request(waypoints: ReturnType<typeof points>, fields: Record<string, unknown> = {}) {
  return {
    name: 'Hut to hut',
    route_geometry: waypoints.map((point) => [point.lat, point.lng, 1000]),
    waypoints,
    ...fields,
  };
}

describe('MDT-01 tour stages', () => {
  it('MDT-SH-001: counts one stage for a day tour and one more for every stage end', () => {
    expect(tourStageCountOf([])).toBe(1);
    expect(tourStageCountOf(points(3))).toBe(1);
    expect(tourStageCountOf(points(5, (i) => (i === 1 || i === 3 ? { stage_end: true } : {})))).toBe(3);
    expect(tourStageCountOf([{ stage_end: false }])).toBe(1);
  });

  it('MDT-SH-002: plans a day a stage, and never less than one day', () => {
    expect(TOUR_DAY_MINUTES).toBe(MAX_PLANNED_TOUR_DURATION_MINUTES);
    expect(maxTourMinutesFor(1)).toBe(1440);
    expect(maxTourMinutesFor(3)).toBe(3 * 1440);
    expect(maxTourMinutesFor(0)).toBe(1440);
  });

  it('MDT-SH-003: takes a stage end at a stop between start and end only', () => {
    expect(tourStageIssues(points(4, (i) => (i === 1 ? { stage_end: true } : {})))).toEqual([]);
    expect(tourStageIssues(points(3, (i) => (i === 0 ? { stage_end: true } : {})))).toEqual([
      { path: ['waypoints', 0, 'stage_end'], message: 'a stage ends at a stop between start and end' },
    ]);
    expect(tourStageIssues(points(3, (i) => (i === 2 ? { stage_end: true } : {})))[0]?.path).toEqual([
      'waypoints',
      2,
      'stage_end',
    ]);
    expect(tourStageIssues(points(3, (i) => (i === 1 ? { stage_end: true, shaping: true } : {})))).toEqual([
      { path: ['waypoints', 1, 'stage_end'], message: 'a shaping point ends no stage' },
    ]);
  });

  it('MDT-SH-004: refuses a tour of more stages than the limit', () => {
    const many = points(MAX_TOUR_STAGES + 1, () => ({ stage_end: true })).map((point, index, all) =>
      index === 0 || index === all.length - 1 ? { ...point, stage_end: undefined } : point,
    );
    expect(tourStageCountOf(many)).toBe(MAX_TOUR_STAGES);
    expect(tourStageIssues(many)).toEqual([]);
    const tooMany = points(MAX_TOUR_STAGES + 2, (i) => (i > 0 ? { stage_end: true } : {})).map((point, index, all) =>
      index === all.length - 1 ? { ...point, stage_end: undefined } : point,
    );
    expect(tourStageIssues(tooMany)).toContainEqual({
      path: ['waypoints'],
      message: `a tour has at most ${MAX_TOUR_STAGES} stages`,
    });
  });

  it('MDT-SH-005: a waypoint carries its stage end, and one saved before reads as none', () => {
    expect(tourWaypointSchema.parse({ lat: 47, lng: 11, role: 'via', sequence: 1, stage_end: true })).toMatchObject({
      stage_end: true,
    });
    expect(tourWaypointSchema.parse({ lat: 47, lng: 11, role: 'via', sequence: 1 })).not.toHaveProperty('stage_end');
    expect(tourWaypointSchema.safeParse({ lat: 47, lng: 11, role: 'via', sequence: 1, stage_end: 'yes' }).success).toBe(
      false,
    );
  });

  it('MDT-SH-006: saves a multi-day tour of any one type, and refuses a stage end out of place', () => {
    const hutToHut = points(4, (i) => (i === 1 ? { stage_end: true } : {}));
    expect(tourCreateRequestSchema.safeParse(request(hutToHut)).success).toBe(true);
    const paddle = request(hutToHut, { tour_type: 'kayak', boat_type: 'canoe', water_context: 'river' });
    expect(tourCreateRequestSchema.safeParse(paddle).success).toBe(true);
    const atEnd = tourCreateRequestSchema.safeParse(request(points(3, (i) => (i === 2 ? { stage_end: true } : {}))));
    expect(atEnd.success).toBe(false);
    expect(atEnd.error?.issues.map((issue) => issue.path.join('.'))).toContain('waypoints.2.stage_end');
  });

  it('MDT-SH-007: holds a multi-day tour to a day a stage, a day tour to one day', () => {
    const twoDays = points(3, (i) => (i === 1 ? { stage_end: true } : {}));
    const long = { duration_seconds: 30 * 3600, break_additional_minutes: 60 };
    expect(tourCreateRequestSchema.safeParse(request(twoDays, long)).success).toBe(true);
    const tooLong = tourCreateRequestSchema.safeParse(request(twoDays, { ...long, duration_seconds: 48 * 3600 }));
    expect(tooLong.success).toBe(false);
    expect(tooLong.error?.issues[0]?.message).toBe(plannedTimeLimitMessage(2));
    const dayTour = tourCreateRequestSchema.safeParse(request(points(3), long));
    expect(dayTour.success).toBe(false);
    expect(dayTour.error?.issues[0]?.message).toBe(
      'walking time plus breaks must be 1440 minutes or less unless a total is overridden',
    );
    expect(plannedTimeLimitMessage(2)).toContain('2880 minutes or less, a day a stage');
  });

  it('MDT-SH-008: lists the stage count of a multi-day tour, and reads a list cached before it', () => {
    const item = {
      place_id: 1,
      tour_type: 'hike',
      distance: 12,
      elevation_gain: null,
      elevation_loss: null,
      duration: null,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 1,
      max_hiking_difficulty: 2,
      name: 'Hut to hut',
      planned: false,
      caution: false,
    };
    expect(tourListItemSchema.parse({ ...item, stage_count: 3 }).stage_count).toBe(3);
    expect(tourListItemSchema.parse({ ...item, stage_count: null }).stage_count).toBeNull();
    expect(tourListItemSchema.parse(item).stage_count).toBeUndefined();
    expect(tourListItemSchema.safeParse({ ...item, stage_count: 1 }).success).toBe(false);
  });

  it('MDT-SH-009: reads the stops between the stages, keyed, the start through the end', () => {
    const keyed = points(5, (i) => ({ key: `stop-${i}xx`, ...(i === 2 ? { stage_end: true } : {}) }));
    expect(tourStageStopsOf(keyed)).toEqual([
      { key: 'stop-0xx', lat: 47, lng: 11 },
      { key: 'stop-2xx', lat: 47.02, lng: 11 },
      { key: 'stop-4xx', lat: 47.04, lng: 11 },
    ]);
    // A stage is known by the stop it starts at: the end starts none.
    expect(tourStageKeysOf(keyed)).toEqual(['stop-0xx', 'stop-2xx']);
  });

  it('MDT-SH-010: has no stage stops for a day tour, a lone point or a stop no save has keyed', () => {
    expect(tourStageStopsOf(points(3, (i) => ({ key: `stop-${i}xx` })))).toEqual([]);
    expect(tourStageStopsOf([{ lat: 47, lng: 11, role: 'start', key: 'stop-0xx' }])).toEqual([]);
    const unkeyed = points(3, (i) => (i === 1 ? { stage_end: true, key: 'stop-1xx' } : {}));
    expect(tourStageStopsOf(unkeyed)).toEqual([]);
    expect(tourStageKeysOf(unkeyed)).toEqual([]);
  });

  it('MDT-SH-011: lists where the stages of a multi-day tour start and end, and reads a list cached before it', () => {
    const item = {
      place_id: 1,
      tour_type: 'hike',
      distance: 12,
      elevation_gain: null,
      elevation_loss: null,
      duration: null,
      difficulty: null,
      wanderer_ref: null,
      match_confidence: 1,
      max_hiking_difficulty: 2,
      name: 'Hut to hut',
      planned: false,
      caution: false,
    };
    const stops = [
      { key: 'stop-0xx', lat: 47, lng: 11 },
      { key: 'stop-1xx', lat: 47.1, lng: 11 },
      { key: 'stop-2xx', lat: 47.2, lng: 11 },
    ];
    expect(tourListItemSchema.parse({ ...item, stage_stops: stops }).stage_stops).toEqual(stops);
    expect(tourListItemSchema.parse({ ...item, stage_stops: null }).stage_stops).toBeNull();
    expect(tourListItemSchema.parse(item).stage_stops).toBeUndefined();
    expect(tourListItemSchema.safeParse({ ...item, stage_stops: [stops[0]] }).success).toBe(false);
    expect(tourListItemSchema.safeParse({ ...item, stage_stops: [{ ...stops[0], key: '' }, stops[1]] }).success).toBe(
      false,
    );
  });
});
