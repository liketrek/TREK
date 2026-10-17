import {
  estimatePaddleTime,
  paddleLayoutOfPoints,
  paddleLayoutOfTrack,
  paddleMovingSeconds,
  paddleRolesOf,
  type PaddlePlanPoint,
} from './paddle-plan';
import { tourPaddlePlanRequestSchema, trackMarksSchema } from './paddle-plan.schema';
import { tourCreateRequestSchema } from './tours.schema';

import { describe, expect, it } from 'vitest';

/** A point `km` kilometres east of 53°N 13°E along the parallel, near enough for these sums. */
function east(km: number): { lat: number; lng: number } {
  return { lat: 53, lng: 13 + km / (111.19493 * Math.cos((53 * Math.PI) / 180)) };
}

function leg(
  kind: 'free' | 'portage',
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  extra?: number,
) {
  return {
    kind,
    geometry: [
      [from.lat, from.lng],
      [to.lat, to.lng],
    ] as [number, number][],
    ...(extra === undefined ? {} : { extra_minutes: extra }),
  };
}

describe('paddle plan (PAD-03, PAD-07)', () => {
  it('names put-in, take-out, re-entry and final take-out from the legs around each point', () => {
    const [a, b, c, d, e] = [east(0), east(1), east(1.2), east(1.4), east(3)];
    const points: PaddlePlanPoint[] = [
      { ...a, fixed_leg: leg('free', a, b) },
      { ...b, fixed_leg: leg('portage', b, c) },
      { ...c, fixed_leg: leg('portage', c, d) },
      { ...d, fixed_leg: leg('free', d, e) },
      { ...e },
    ];
    expect(paddleRolesOf(points)).toEqual(['put_in', 'take_out', null, 're_entry', 'final_take_out']);
  });

  it("reckons the card's example: 8 km water, a 0.4 km portage, a lock gone through and a break make 192 minutes", () => {
    const [a, b, c, d, e] = [east(0), east(4), east(4.4), east(6), east(8.4)];
    const points: PaddlePlanPoint[] = [
      { ...a, fixed_leg: leg('free', a, b) },
      { ...b, fixed_leg: leg('portage', b, c) },
      { ...c, fixed_leg: leg('free', c, d) },
      { ...d, fixed_leg: leg('free', d, e), lock: { wait_minutes: 20, transit_minutes: 10 } },
      { ...e },
    ];
    const estimate = estimatePaddleTime(paddleLayoutOfPoints(points), {
      paddleSpeedKmh: 4,
      portageSpeedKmh: null,
      breakMinutes: 20,
    });
    expect(estimate.waterM).toBeCloseTo(8000, -1);
    expect(estimate.landM).toBeCloseTo(400, -1);
    expect(estimate.waterMinutes).toBe(120);
    expect(estimate.carryMinutes).toBe(12);
    expect(estimate.portageExtraMinutes).toBe(10);
    expect(estimate.lockMinutes).toBe(30);
    expect(estimate.estimateMinutes).toBe(192);
    expect(estimate.complete).toBe(true);
    expect(paddleMovingSeconds(estimate)).toBe(172 * 60);
  });

  it('joins consecutive portage legs into one portage that keeps the time of its first leg', () => {
    const [a, b, c, d] = [east(0), east(1), east(1.2), east(2)];
    const layout = paddleLayoutOfPoints([
      { ...a, fixed_leg: leg('portage', a, b, 25) },
      { ...b, fixed_leg: leg('portage', b, c) },
      { ...c, fixed_leg: leg('free', c, d) },
      { ...d },
    ]);
    expect(layout.stretches.map((s) => [s.kind, s.extraMinutes, s.startIndex])).toEqual([
      ['portage', 25, 0],
      ['water', null, 2],
    ]);
  });

  it('counts a lock a portage carries round with the portage, and names a lock without times as missing', () => {
    const [a, b, c, d] = [east(0), east(2), east(2.3), east(4)];
    const estimate = estimatePaddleTime(
      paddleLayoutOfPoints([
        { ...a, fixed_leg: leg('free', a, b), lock: { wait_minutes: null, transit_minutes: 5 } },
        { ...b, fixed_leg: leg('portage', b, c), lock: { wait_minutes: 30, transit_minutes: 10 } },
        { ...c, fixed_leg: leg('free', c, d) },
        { ...d },
      ]),
      { paddleSpeedKmh: 4, portageSpeedKmh: 2, breakMinutes: null },
    );
    expect(estimate.locksCounted).toBe(1);
    expect(estimate.lockMinutes).toBe(5);
    expect(estimate.locksMissingTime).toBe(1);
    expect(estimate.complete).toBe(false);
  });

  it('leaves the water time unknown without a paddling speed, and the estimate incomplete', () => {
    const [a, b] = [east(0), east(2)];
    const estimate = estimatePaddleTime(paddleLayoutOfPoints([{ ...a, fixed_leg: leg('free', a, b) }, { ...b }]), {
      paddleSpeedKmh: null,
      portageSpeedKmh: null,
      breakMinutes: null,
    });
    expect(estimate.waterMinutes).toBeNull();
    expect(estimate.complete).toBe(false);
    expect(paddleMovingSeconds(estimate)).toBeNull();
  });

  it('reads a recorded track from its marks: water around each portage, a lock inside one bypassed', () => {
    const layout = paddleLayoutOfTrack(5000, {
      portages: [{ from_m: 1000, to_m: 1300, extra_minutes: null }],
      locks: [
        { at_m: 1200, wait_minutes: 10, transit_minutes: 10 },
        { at_m: 4000, wait_minutes: 15, transit_minutes: 5 },
      ],
    });
    expect(layout.stretches.map((s) => [s.kind, s.fromM, s.toM])).toEqual([
      ['water', 0, 1000],
      ['portage', 1000, 1300],
      ['water', 1300, 5000],
    ]);
    expect(layout.locks.map((lock) => lock.bypassed)).toEqual([true, false]);
    const estimate = estimatePaddleTime(layout, { paddleSpeedKmh: 4, portageSpeedKmh: null, breakMinutes: 0 });
    expect(estimate.lockMinutes).toBe(20);
    expect(estimate.portageCount).toBe(1);
  });

  it('refuses overlapping or reversed portages on a track', () => {
    expect(
      trackMarksSchema.safeParse({
        portages: [
          { from_m: 0, to_m: 500, extra_minutes: null },
          { from_m: 400, to_m: 900, extra_minutes: null },
        ],
        locks: [],
      }).success,
    ).toBe(false);
    expect(
      tourPaddlePlanRequestSchema.safeParse({
        paddle_speed_kmh: null,
        portage_speed_kmh: null,
        track_marks: { portages: [{ from_m: 600, to_m: 500, extra_minutes: null }], locks: [] },
      }).success,
    ).toBe(false);
  });

  it('keeps portages, locks and a carrying speed to paddle tours', () => {
    const route = [
      [53, 13, 0],
      [53, 13.01, 0],
    ] as [number, number, number][];
    const base = {
      name: 'Carry',
      route_geometry: route,
      waypoints: [
        {
          lat: 53,
          lng: 13,
          role: 'start',
          sequence: 0,
          fixed_leg: leg('portage', { lat: 53, lng: 13 }, { lat: 53, lng: 13.01 }),
        },
        { lat: 53, lng: 13.01, role: 'end', sequence: 1, lock: { wait_minutes: 5, transit_minutes: 5 } },
      ],
    };
    const hike = tourCreateRequestSchema.safeParse({ ...base, tour_type: 'hike', portage_speed_kmh: 2 });
    expect(hike.success).toBe(false);
    expect(hike.error?.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['portage_speed_kmh', 'waypoints.0.fixed_leg', 'waypoints.1.lock']),
    );
    const paddle = tourCreateRequestSchema.safeParse({
      ...base,
      tour_type: 'kayak',
      boat_type: 'canoe',
      water_context: 'river',
      portage_speed_kmh: 2.5,
    });
    expect(paddle.success).toBe(true);
  });
});

describe('a routed paddle tour (PAD-11, P2A-03)', () => {
  it('times each leg by the length the router found where it is known, straight where not', () => {
    const [a, b, c] = [east(0), east(2), east(4)];
    const straight = paddleLayoutOfPoints([a, b, c]);
    expect(straight.stretches[0]?.toM).toBeCloseTo(4000, -1);
    const routed = paddleLayoutOfPoints([a, b, c], [3500, null]);
    expect(routed.stretches[0]?.toM).toBeCloseTo(5500, -1);
  });

  it('keeps the lake style and shaping points to paddle tours and to plans', () => {
    const base = {
      name: 'Across the lake',
      route_geometry: [
        [53, 13, 0],
        [53, 13.01, 0],
      ] as [number, number, number][],
      waypoints: [
        { lat: 53, lng: 13, role: 'start', sequence: 0 },
        { lat: 53, lng: 13.005, role: 'via', sequence: 1, shaping: true },
        { lat: 53, lng: 13.01, role: 'end', sequence: 2 },
      ],
    };
    const hike = tourCreateRequestSchema.safeParse({ ...base, tour_type: 'hike', paddle_lake_style: 'shore' });
    expect(hike.success).toBe(false);
    expect(hike.error?.issues.map((issue) => issue.path.join('.'))).toContain('paddle_lake_style');
    const paddle = tourCreateRequestSchema.safeParse({
      ...base,
      tour_type: 'kayak',
      boat_type: 'kayak',
      water_context: 'lake',
      paddle_lake_style: 'shore',
    });
    expect(paddle.success).toBe(true);
    expect(tourCreateRequestSchema.safeParse({ ...base, tour_type: 'hike' }).success).toBe(true);
  });
});
