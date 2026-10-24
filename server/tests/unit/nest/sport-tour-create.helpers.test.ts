/**
 * The pure halves of a bike tour, a run, a paddle or ski tour saved from its
 * plan: the profile planned for, the time on the move, the proposal and the
 * writes, as the planner's save writes each type.
 */
import type { PlannedHike } from '../../../src/nest/tours/hike-routing.service';
import {
  legsOf,
  paddleCommandOf,
  paddleMarksOf,
  skiCommandOf,
  skiLineOf,
} from '../../../src/nest/tours/sport-tour-create.helpers';
import {
  movingMinutesOf,
  plannedActivityOf,
  refusesSave,
  tourCreateCommandOf,
  unplannedTourMessage,
} from '../../../src/nest/tours/tour-plan.helpers';
import type { GeometryPoint, PaddleRouteLeg, SkiRouteLeg } from '@trek/shared';

import { describe, expect, it } from 'vitest';

// SPORT-HELP-001 to SPORT-HELP-008

const routed = (distance: number, minutes: number): PlannedHike => ({
  plan: {
    kind: 'routed',
    max_hiking_difficulty: 2,
    hiking_preferences: null,
    distance_m: distance,
    ascent_m: 0,
    descent_m: 0,
    duration_minutes: minutes,
    duration_basis: 'router',
    has_heights: true,
    line: [
      [47, 11, 500],
      [47.01, 11, 500],
    ],
    profile: [],
    grades: null,
  },
  line: null,
  snapped: null,
  legs: null,
});

describe('tour-plan.helpers', () => {
  it("SPORT-HELP-001: a request plans for its profile, the planner's own where none is named", () => {
    expect(plannedActivityOf({ activity: 'bike' })).toEqual({ activity: 'bike', profile: 'touring' });
    expect(plannedActivityOf({ activity: 'bike', bike_profile: 'mtb' })).toEqual({ activity: 'bike', profile: 'mtb' });
    expect(plannedActivityOf({ activity: 'run' })).toEqual({ activity: 'run', profile: 'running' });
    expect(plannedActivityOf({ activity: 'run', run_profile: 'trail' })).toEqual({ activity: 'run', profile: 'trail' });
  });

  it("SPORT-HELP-002: a ride keeps the router's time, a run its distance at the pace, and none without one", () => {
    const plan = routed(10_000, 40);
    expect(movingMinutesOf({ activity: 'bike', profile: 'road' }, null, plan)).toBe(40);
    expect(movingMinutesOf({ activity: 'run', profile: 'running' }, 330, plan)).toBe(55);
    expect(movingMinutesOf({ activity: 'run', profile: 'running' }, null, plan)).toBeNull();
    const unrouted: PlannedHike = {
      plan: { kind: 'unrouted', max_hiking_difficulty: 2, why: 'no_way', position: null, snapped_m: null },
      line: null,
      snapped: null,
      legs: null,
    };
    expect(movingMinutesOf({ activity: 'bike', profile: 'road' }, null, unrouted)).toBeNull();
  });

  it('SPORT-HELP-003: the write names the type, its profile and pace, and nothing of a hike', () => {
    const line: GeometryPoint[] = [
      [47, 11, 500],
      [47.01, 11, 510],
    ];
    const points = [
      { lat: 47, lng: 11 },
      { lat: 47.01, lng: 11 },
    ];
    const request = { name: 'Isar', activity: 'run' as const, waypoints: points, run_pace_seconds_per_km: 330 };
    const command = tourCreateCommandOf(
      request,
      points,
      { line, seconds: 600, route: { planned: true } },
      { activity: 'run', profile: 'trail' },
      55,
    );
    expect(command).toMatchObject({
      tour_type: 'run',
      run_profile: 'trail',
      run_pace_seconds_per_km: 330,
      bike_profile: null,
      max_hiking_difficulty: null,
      duration_seconds: 3300,
    });
    // Without its line the tour waits for its way, and so does its time.
    const waiting = tourCreateCommandOf(
      request,
      points,
      { line: null, seconds: null, route: { planned: false, why: 'router_unavailable', position: null } },
      { activity: 'run', profile: 'trail' },
      55,
    );
    expect(waiting.duration_seconds).toBeNull();
  });

  it('SPORT-HELP-004: only a router that did not answer saves a tour without its way, in words of its type', () => {
    expect(refusesSave({ planned: true })).toBe(false);
    expect(refusesSave({ planned: false, why: 'router_unavailable', position: null })).toBe(false);
    expect(refusesSave({ planned: false, why: 'no_way', position: null })).toBe(true);
    expect(unplannedTourMessage({ why: 'too_long', position: null }, 'run')).toBe(
      'The way is too long to plan as a run: split it into shorter tours. Nothing was saved.',
    );
    expect(unplannedTourMessage({ why: 'point_off_the_way', position: 2 }, 'bike')).toContain('Point 2');
  });
});

describe('sport-tour-create.helpers', () => {
  const water = (from: number, to: number, kind: 'water' | 'portage' | 'lock') => ({
    kind,
    from,
    to,
    name: null,
    source: null,
    osm_ref: null,
    grade: null,
  });

  it('SPORT-HELP-005: the legs run from each point to the next', () => {
    const points = [
      { lat: 1, lng: 1 },
      { lat: 2, lng: 2 },
      { lat: 3, lng: 3 },
    ];
    expect(legsOf(points)).toEqual([
      { from: points[0], to: points[1] },
      { from: points[1], to: points[2] },
    ]);
  });

  it('SPORT-HELP-006: portages and locks lie along the whole line, after the legs before them', () => {
    const legs: Array<Extract<PaddleRouteLeg, { status: 'ok' }>> = [
      {
        status: 'ok',
        geometry: [
          [48, 11],
          [48.01, 11],
        ],
        segments: [water(0, 1, 'water')],
        distance_m: 1112,
        snapped_m: { from: 0, to: 0 },
      },
      {
        status: 'ok',
        geometry: [
          [48.01, 11],
          [48.02, 11],
          [48.03, 11],
        ],
        segments: [water(0, 1, 'portage'), water(1, 1, 'lock'), water(1, 2, 'water')],
        distance_m: 2224,
        snapped_m: { from: 0, to: 0 },
      },
    ];
    const marks = paddleMarksOf(legs);
    expect(marks.portages).toHaveLength(1);
    expect(Math.round(marks.portages[0]?.from_m ?? 0)).toBe(1112);
    expect(Math.round(marks.portages[0]?.to_m ?? 0)).toBe(2224);
    expect(Math.round(marks.locks[0]?.at_m ?? 0)).toBe(2224);
    expect(marks.locks[0]).toMatchObject({ wait_minutes: null, transit_minutes: null });

    const line: GeometryPoint[] = [
      [48, 11, 500],
      [48.01, 11, 500],
      [48.02, 11, 500],
      [48.03, 11, 500],
    ];
    const request = {
      name: 'Isar',
      waypoints: [
        { lat: 48, lng: 11 },
        { lat: 48.03, lng: 11 },
      ],
      water_context: 'river' as const,
    };
    const command = paddleCommandOf(request, [], { line, marks });
    // 2224 m on the water at a kayak's 4 km/h, 1112 m carried at 2 km/h and ten minutes to get out and in.
    expect(command).toMatchObject({
      tour_type: 'kayak',
      boat_type: 'kayak',
      paddle_speed_kmh: 4,
      duration_seconds: 4620,
    });
    expect(paddleCommandOf(request, [], { line: null, marks }).duration_seconds).toBeNull();
  });

  it('SPORT-HELP-007: a ski tour is one line with the piste heights and the router time, a missing height kept missing', () => {
    const leg = (geometry: Array<[number, number, number | null]>): Extract<SkiRouteLeg, { status: 'ok' }> => ({
      status: 'ok',
      geometry,
      segments: [],
      distance_m: 1000,
      climb_m: 0,
      descent_m: 100,
      seconds: { ski: 120, lift: 300, wait: 60, walk: 20 },
      snapped_m: { from: 0, to: 0 },
      area_ids: [],
      why: [],
      alternatives: [],
    });
    const { line, seconds } = skiLineOf([
      leg([
        [47, 11, 1800],
        [47.01, 11, 1700],
      ]),
      leg([
        [47.01, 11, 1700],
        [47.02, 11, null],
      ]),
    ]);
    expect(line).toEqual([
      [47, 11, 1800],
      [47.01, 11, 1700],
      [47.02, 11],
    ]);
    expect(seconds).toBe(1000);
  });

  it('SPORT-HELP-008: the ski write keeps the discipline, its options as the discipline reads them and every leg planned', () => {
    const request = {
      name: 'Loipe',
      waypoints: [
        { lat: 47, lng: 11 },
        { lat: 47.01, lng: 11 },
      ],
      discipline: 'cross_country' as const,
      technique: 'skating' as const,
    };
    const line: GeometryPoint[] = [
      [47, 11, 900],
      [47.01, 11, 910],
    ];
    const command = skiCommandOf(request, [], { line, marks: null }, { build: 'b1', seconds: 1799.6, legs: 3 });
    expect(command).toMatchObject({
      tour_type: 'ski',
      ski_discipline: 'cross_country',
      ski_technique: 'skating',
      ski_route_build: 'b1',
      ski_planned_legs: [0, 1, 2],
      duration_seconds: 1800,
    });
    expect(command.ski_options).toBeTruthy();
    const alpine = skiCommandOf(
      { ...request, discipline: 'alpine', technique: undefined },
      [],
      { line: null, marks: null },
      { build: null, seconds: 60, legs: 1 },
    );
    expect(alpine).toMatchObject({ ski_technique: null, duration_seconds: null });
  });
});
