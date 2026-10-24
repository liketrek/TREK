import type { SkiRouteLeg, SkiRouteSegment } from '@trek/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { skiRouteRepo, type SkiLegAnswer, type SkiPlanAnswer } from '../../../repo/skiRouteRepo';
import { legSeconds, routeSkiTour, skiLegs, skiRouteKey } from './skiRouting';
import { lineLengthM } from './tourFixedLegs';
import { routeWalkingTour } from './tourRouting';

vi.mock('./tourRouting', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./tourRouting')>()),
  routeWalkingTour: vi.fn(),
}));

// FE-TOUR-SKI-ROUTE-001 to FE-TOUR-SKI-ROUTE-010

const start = { lat: 47, lng: 11 };
const col = { lat: 47.01, lng: 11 };
const hut = { lat: 47.01, lng: 11.01 };
const alpine = { discipline: 'alpine' as const, technique: null };
const snowshoe = { discipline: 'snowshoe' as const, technique: null };

function segment(kind: SkiRouteSegment['kind'], from: number, to: number, extra: Partial<SkiRouteSegment> = {}) {
  return {
    kind,
    from,
    to,
    name: null,
    ref: null,
    difficulty: null,
    lift_type: null,
    grooming: [],
    seconds: 60,
    wait_seconds: 0,
    length_m: 100,
    flags: [],
    osm_way: null,
    ...extra,
  } satisfies SkiRouteSegment;
}

/** A planned leg from one point to the next: a lift up, then a red run down. */
function okLeg(from: { lat: number; lng: number }, to: { lat: number; lng: number }): SkiRouteLeg {
  return {
    status: 'ok',
    geometry: [
      [from.lat, from.lng, 1500],
      [(from.lat + to.lat) / 2, (from.lng + to.lng) / 2, 2000],
      [to.lat, to.lng, 1600],
    ],
    segments: [
      segment('lift', 0, 1, { name: 'Gipfelbahn' }),
      segment('run', 1, 2, { name: 'Talabfahrt', difficulty: 'intermediate' }),
    ],
    distance_m: 1800,
    climb_m: 500,
    descent_m: 400,
    seconds: { ski: 300, lift: 420, wait: 60, walk: 20 },
    snapped_m: { from: 0, to: 0 },
    area_ids: ['w:1'],
    why: [],
    alternatives: [],
  };
}

function failed(code: Extract<SkiLegAnswer, { status: 'failed' }>['code']): SkiLegAnswer {
  const hint = { raise_difficulty: 'advanced' as const };
  return { status: 'failed', code, at: null, hint, detail: { name: 'Schwarze' } } as SkiLegAnswer;
}

const answer = (legs: SkiLegAnswer[], extra: Partial<SkiPlanAnswer> = {}): SkiPlanAnswer => ({
  legs,
  build: '2026-11-02',
  stale: false,
  areaNames: ['Gletscherwelt'],
  colourScheme: 'europe',
  attribution: '© OpenStreetMap contributors. Terrain: Mapzen Terrarium',
  ...extra,
});

const planSpy = () => vi.spyOn(skiRouteRepo, 'plan');
let plan: ReturnType<typeof planSpy>;

beforeEach(() => {
  plan = planSpy();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('skiRouting (SKI-02)', () => {
  it('FE-TOUR-SKI-ROUTE-001: lays a straight free leg between every two points, and keeps a leg the traveller drew', () => {
    const drawn = {
      kind: 'free' as const,
      geometry: [
        [47.01, 11],
        [47.02, 11.005],
        [47.01, 11.01],
      ] as [number, number][],
    };
    expect(skiLegs([start, { ...col, fixedLeg: drawn }, hut])).toEqual([
      {
        kind: 'free',
        geometry: [
          [47, 11],
          [47.01, 11],
        ],
      },
      drawn,
    ]);
    expect(skiLegs([start])).toEqual([]);
  });

  it('FE-TOUR-SKI-ROUTE-002: before a discipline is chosen every leg is drawn straight, nothing asked and no time', async () => {
    const route = await routeSkiTour([start, col, hut], { discipline: null, technique: null }, 7);
    expect(plan).not.toHaveBeenCalled();
    expect(route?.durationSeconds).toBeNull();
    expect(route?.parts.every((part) => part.free)).toBe(true);
    expect(route?.legs).toEqual([null, null]);
    expect(route).toMatchObject({ plannedLegs: [], saved: false, attribution: null });
    // Every 25 m a point, so the heights follow the ground between the two ends of each leg.
    expect(route?.coordinates.length ?? 0).toBeGreaterThan(40);
    const straight = lineLengthM([
      [47, 11],
      [47.01, 11],
      [47.01, 11.01],
    ]);
    expect(route?.distanceMeters ?? 0).toBeCloseTo(straight, 0);
  });

  it('FE-TOUR-SKI-ROUTE-003: fewer than two points, or a request called off, draw nothing', async () => {
    expect(await routeSkiTour([start], alpine, 7)).toBeNull();
    const controller = new AbortController();
    controller.abort();
    plan.mockResolvedValue(answer([okLeg(start, col)]));
    expect(await routeSkiTour([start, col], alpine, 7, controller.signal)).toBeNull();
  });

  it('FE-TOUR-SKI-ROUTE-004: the discipline, a cross-country technique and the options plan the legs; nothing before', () => {
    expect(skiRouteKey({ discipline: null, technique: null })).toBe('');
    const keys = [
      skiRouteKey(alpine),
      skiRouteKey({ ...alpine, options: { pace: 'sporty' } }),
      skiRouteKey({ discipline: 'cross_country', technique: 'skating' }),
      skiRouteKey({ discipline: 'cross_country', technique: 'classic' }),
    ];
    expect(new Set(keys).size).toBe(4);
    // A technique left over from cross-country plans an alpine tour the same way.
    expect(skiRouteKey({ discipline: 'alpine', technique: 'classic' })).toBe(skiRouteKey(alpine));
  });

  it('FE-TOUR-SKI-ROUTE-005: planned legs follow the router, styled by kind and grade, with its time and heights', async () => {
    plan.mockResolvedValue(answer([okLeg(start, col), okLeg(col, hut)]));
    const route = await routeSkiTour([start, col, hut], { ...alpine, options: { pace: 'relaxed' } }, 7);
    expect(plan).toHaveBeenCalledWith(
      7,
      [
        { from: start, to: col },
        { from: col, to: hut },
      ],
      { discipline: 'alpine', technique: null, options: { pace: 'relaxed' } },
      undefined
    );
    expect(route?.durationSeconds).toBe(2 * 800);
    expect(route?.distanceMeters).toBe(3600);
    expect(route?.problems).toEqual([]);
    expect(route?.parts.map((part) => part.ski?.kind)).toEqual(['lift', 'run', 'lift', 'run']);
    expect(route?.parts[1]?.ski).toEqual({ kind: 'run', difficulty: 'intermediate', scheme: 'europe' });
    expect(route?.elevations).toHaveLength(5);
    expect(route?.elevations?.[0]).toEqual([47, 11, 1500]);
    expect(route?.build).toBe('2026-11-02');
    expect(route?.areaNames).toEqual(['Gletscherwelt']);
    expect(route).toMatchObject({ plannedLegs: [0, 1], saved: false });
    expect(route?.attribution).toBe('© OpenStreetMap contributors. Terrain: Mapzen Terrarium');
  });

  it('FE-TOUR-SKI-ROUTE-006: a leg it cannot plan stays straight and unrouted, with its reason, hint and name', async () => {
    plan.mockResolvedValue(answer([okLeg(start, col), failed('blocked_by_difficulty')]));
    const route = await routeSkiTour([start, col, hut], alpine, 7);
    expect(route?.durationSeconds).toBeNull();
    expect(route?.elevations).toBeNull();
    expect(route?.plannedLegs).toEqual([0]);
    expect(route?.problems).toEqual([
      {
        index: 1,
        code: 'blocked_by_difficulty',
        hint: { raise_difficulty: 'advanced' },
        name: 'Schwarze',
        summer: false,
      },
    ]);
    const last = route?.parts[route.parts.length - 1];
    expect(last?.mark).toBe('unrouted');
    expect(last?.coordinates).toEqual([
      [47.01, 11],
      [47.01, 11.01],
    ]);
  });

  it('FE-TOUR-SKI-ROUTE-007: a snowshoer off the piste data takes summer paths, said so', async () => {
    plan.mockResolvedValue(answer([failed('not_on_piste')]));
    const summer = vi.mocked(routeWalkingTour).mockResolvedValueOnce({
      coordinates: [
        [47, 11],
        [47.005, 11.001],
        [47.01, 11],
      ],
      parts: [],
      distanceMeters: 1200,
      durationSeconds: 900,
    });
    const route = await routeSkiTour([start, col], snowshoe, 7);
    expect(summer).toHaveBeenCalled();
    expect(route?.problems[0]).toMatchObject({ code: 'not_on_piste', summer: true });
    expect(route?.parts[0]).toMatchObject({ mark: 'gap', ski: { kind: 'summer' } });
    expect(route?.durationSeconds).toBeNull();
  });

  it('FE-TOUR-SKI-ROUTE-008: an area still downloading is asked again until it is in', async () => {
    vi.useFakeTimers();
    plan.mockResolvedValueOnce(answer([failed('loading')])).mockResolvedValueOnce(answer([okLeg(start, col)]));
    const pending = routeSkiTour([start, col], alpine, 7);
    await vi.advanceTimersByTimeAsync(2_000);
    const route = await pending;
    expect(plan).toHaveBeenCalledTimes(2);
    expect(route?.problems).toEqual([]);
  });

  it('FE-TOUR-SKI-ROUTE-009: a request that fails outright leaves every asked leg unrouted, a drawn one kept', async () => {
    plan.mockRejectedValue(new Error('502'));
    const drawn = {
      kind: 'free' as const,
      geometry: [
        [47.01, 11],
        [47.01, 11.01],
      ] as [number, number][],
    };
    const route = await routeSkiTour([start, { ...col, fixedLeg: drawn }, hut], alpine, 7);
    expect(plan).toHaveBeenCalledWith(7, [{ from: start, to: col }], expect.anything(), undefined);
    expect(route?.problems).toEqual([
      { index: 0, code: 'places_unavailable', hint: { free_draw: true }, name: null, summer: false },
    ]);
    expect(route?.parts.some((part) => part.free)).toBe(true);
    // The drawn leg is no leg the router planned, and nothing was answered to credit.
    expect(route).toMatchObject({ plannedLegs: [], attribution: null });
  });

  it('FE-TOUR-SKI-ROUTE-010: a leg takes its time on the move and waiting together', () => {
    const leg = okLeg(start, col);
    if (leg.status !== 'ok') throw new Error('planned leg expected');
    expect(legSeconds(leg)).toBe(800);
  });
});
