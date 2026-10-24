/**
 * HikeRoutingService: a hike planned on the server the way the tour planner
 * plans one in the browser. The router is the real one the road trip and the
 * city walks use, with its paced queue; only the routing host behind
 * safeFetchAdminConfigured is a stub, answering /route, /height and
 * /trace_attributes as Valhalla does, and the trail grades come from a stub
 * of TourTrailGradeService. The suite takes its subject from the container;
 * its last case creates a hike through the real HikePlanService.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import { DomainError } from '../../../src/nest/common/domain-error';
import { RoadtripRouterService } from '../../../src/nest/roadtrip/roadtrip-router.service';
import { SettingsService } from '../../../src/nest/settings/settings.service';
import { HikePlanService } from '../../../src/nest/tours/hike-plan.service';
import { HikeRoutingService, type PlannedHike } from '../../../src/nest/tours/hike-routing.service';
import { TourTrailGradeService } from '../../../src/nest/tours/tour-trail-grade.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { safeFetchAdminConfigured } from '../../../src/utils/ssrfGuard';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { findRow } from '../../helpers/factories/rows';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { valhallaRoute } from '../../helpers/valhalla';
import { MikroORM } from '@mikro-orm/core';
import {
  HIKE_MAX_LINE_POINTS,
  HIKE_PLAN_LINE_POINTS,
  HIKE_PLAN_MAX_WAYPOINTS,
  HIKE_PLAN_PROFILE_SAMPLES,
  hikePlanSchema,
  type HikePlanRequest,
  type RoutedHikePlan,
  type TourTrailGrade,
  type TourTrailGradeResponse,
  type UnroutedHikePlan,
} from '@trek/shared';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/utils/ssrfGuard', () => ({ safeFetchAdminConfigured: vi.fn() }));

// HIKE-ROUTE-001 to HIKE-ROUTE-021

const db = createSnapshotTestDb();
const grades = vi.fn<TourTrailGradeService['grades']>();
const getUserSettings = vi.fn<(userId: number) => Promise<Record<string, unknown>>>();
let t: TestModule;
let hikes: HikeRoutingService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [
      { provide: TourTrailGradeService, useValue: { grades } },
      { provide: SettingsService, useValue: { getUserSettings } },
    ],
  });
  hikes = t.get(HikeRoutingService);
});
afterAll(async () => {
  await t.close();
  db.close();
});

/** A point of the stub's world: `k` steps of a ten-thousandth of a degree north of 47° N on 11° E, about 11 m each. */
const at = (k: number, lng = 11): [number, number] => [47 + k / 1e4, lng];
const stepsOf = (from: number, to: number, lng = 11) =>
  Array.from({ length: to - from + 1 }, (_, index) => at(from + index, lng));
/** The height under a point: up 10 m a step to the top at step 10, then down 5 m a step. */
const heightAt = (lat: number) => {
  const k = Math.round((lat - 47) * 1e4);
  return k <= 10 ? 600 + 10 * k : 700 - 5 * (k - 10);
};

/** Two legs through three points, the second starting on the point the first ended at. */
const TWO_LEGS = valhallaRoute([
  { line: stepsOf(0, 10), km: 0.111, seconds: 150 },
  { line: stepsOf(10, 20), km: 0.111, seconds: 180 },
]);
const WAYPOINTS = [0, 10, 20].map((k) => ({ lat: at(k)[0], lng: 11 }));
/** The ways under the line, 220 m of them against the 222.4 m planned. */
const TRACE = {
  edges: [
    { way_id: 101, length: 0.1 },
    { way_id: 102, length: 0.05 },
    { length: 0.02 },
    { way_id: 103, length: 0.03 },
    { way_id: 104, length: 0.02 },
  ],
};
const grade = (id: number, sac: TourTrailGrade['sac_scale'], surface: string | null = null): TourTrailGrade => ({
  id,
  mtb_scale: null,
  mtb_scale_uphill: null,
  mtb_scale_imba: null,
  sac_scale: sac,
  sac_scale_unclear: null,
  surface,
  highway: 'path',
});
const GRADES: TourTrailGradeResponse = {
  ways: [
    grade(101, 'mountain_hiking'),
    grade(102, 'mountain_hiking'),
    grade(103, 'alpine_hiking'),
    grade(104, null, 'gravel'),
  ],
  unanswered: [],
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

interface Host {
  route?: () => Response;
  height?: (shape: Array<{ lat: number; lon: number }>) => Response;
  trace?: () => Response;
}

/** The routing host, answering each of its three questions as Valhalla does unless a case says otherwise. */
function valhalla(host: Host = {}) {
  vi.mocked(safeFetchAdminConfigured)
    .mockReset()
    .mockImplementation(async (url, init) => {
      const body = JSON.parse(String(init?.body ?? '{}')) as { shape?: Array<{ lat: number; lon: number }> };
      const shape = body.shape ?? [];
      if (url.endsWith('/route')) return host.route ? host.route() : json(TWO_LEGS);
      if (url.endsWith('/height'))
        return host.height
          ? host.height(shape)
          : json({ range_height: shape.map((point, index) => [index, heightAt(point.lat)]) });
      if (url.endsWith('/trace_attributes')) return host.trace ? host.trace() : json(TRACE);
      return json({}, 404);
    });
}

const asked = (path: string) =>
  vi.mocked(safeFetchAdminConfigured).mock.calls.filter(([url]) => String(url).endsWith(path));
const bodyOf = (path: string) => JSON.parse(String(asked(path)[0]?.[1]?.body)) as Record<string, unknown>;

let trip = 0;
/**
 * A plan for a user and a trip of their own, so the router's caches (routes
 * by trip, heights by user) never answer one case with another's.
 */
async function plan(request: Partial<HikePlanRequest> = {}, grades = true) {
  trip += 1;
  const pending = hikes.plan(trip, trip, { waypoints: WAYPOINTS, ...request }, { grades });
  await vi.runAllTimersAsync();
  return pending;
}
/** The plan of a way that was planned; a plan of the other kind fails the case. */
function routed({ plan: hike }: PlannedHike): RoutedHikePlan {
  if (hike.kind !== 'routed') throw new Error(`expected a routed plan, got ${hike.kind} (${hike.why})`);
  return hike;
}
/** The plan of a way that was not planned, with why; a routed plan fails the case. */
function unrouted({ plan: hike }: PlannedHike): UnroutedHikePlan {
  if (hike.kind !== 'unrouted') throw new Error('expected no way, got a routed plan');
  return hike;
}

beforeEach(() => {
  vi.useFakeTimers();
  getUserSettings.mockReset().mockResolvedValue({});
  grades.mockReset().mockResolvedValue(GRADES);
  valhalla();
});
afterEach(() => vi.useRealTimers());

describe('HikeRoutingService: the way, its heights and its grades', () => {
  it('HIKE-ROUTE-001: plans the way under the hike limit and preferences, with its heights, time and grades', async () => {
    const planned = await plan({
      max_hiking_difficulty: 4,
      hiking_preferences: { avoid_climbs: true, avoid_steps: false },
    });
    expect(bodyOf('/route')).toMatchObject({
      costing: 'pedestrian',
      costing_options: { pedestrian: { max_hiking_difficulty: 4, use_hills: 0.2 } },
    });
    const hike = routed(planned);
    expect(hikePlanSchema.parse(hike)).toEqual(hike);
    expect(hike).toMatchObject({
      kind: 'routed',
      max_hiking_difficulty: 4,
      hiking_preferences: { avoid_climbs: true },
      distance_m: 222,
      ascent_m: 100,
      descent_m: 50,
      // DIN 33466: 0.42 h for the height against 0.06 h for the distance, the smaller by half.
      duration_minutes: 28,
      duration_basis: 'din33466',
      has_heights: true,
    });
    // The legs meet on one point: the line has it once.
    expect(planned.line).toHaveLength(21);
    expect(planned.line?.[10]).toEqual([...at(10), 700]);
    expect(hike.line).toEqual(planned.line);
    expect(hike.profile[0]).toEqual([0, 600]);
    expect(hike.profile[10]).toEqual([111, 700]);
    expect(hike.profile.at(-1)).toEqual([222, 650]);
    expect(hike.grades).toEqual({
      segments: [
        { from_m: 0, to_m: 152, sac: 2 },
        { from_m: 172, to_m: 202, sac: 4 },
      ],
      highest: 4,
      unknown_share: 0.182,
    });
    expect(grades).toHaveBeenCalledWith({ way_ids: [101, 102, 103, 104] });
    expect(bodyOf('/trace_attributes').shape).toHaveLength(21);
  });

  it('HIKE-ROUTE-002: plans a hike given no limit at T2 and with no preferences', async () => {
    const hike = routed(await plan({ hiking_preferences: null }));
    expect(bodyOf('/route')).toMatchObject({ costing_options: { pedestrian: { max_hiking_difficulty: 2 } } });
    expect((bodyOf('/route').costing_options as { pedestrian: object }).pedestrian).toEqual({
      max_hiking_difficulty: 2,
    });
    expect(hike.max_hiking_difficulty).toBe(2);
    expect(hike.hiking_preferences).toBeNull();
  });

  it('HIKE-ROUTE-003: thins a long line and its profile for display while the tour keeps every point', async () => {
    valhalla({ route: () => json(valhallaRoute([{ line: stepsOf(0, 1199), km: 13.3, seconds: 10000 }])) });
    const planned = await plan({ waypoints: [WAYPOINTS[0], { lat: at(1199)[0], lng: 11 }] });
    const hike = routed(planned);
    expect(asked('/height')).toHaveLength(3);
    expect(planned.line).toHaveLength(1200);
    expect(planned.line?.every((point) => point.length === 3)).toBe(true);
    expect(hike.line).toHaveLength(HIKE_PLAN_LINE_POINTS);
    expect(hike.line[0]).toEqual(planned.line?.[0]);
    expect(hike.line.at(-1)).toEqual(planned.line?.at(-1));
    expect(hike.profile).toHaveLength(HIKE_PLAN_PROFILE_SAMPLES);
    expect(hikePlanSchema.safeParse(hike).success).toBe(true);
  });
});

describe('HikeRoutingService: no way planned', () => {
  it('HIKE-ROUTE-004: says the router did not answer where Valhalla is down, and asks nothing more', async () => {
    valhalla({ route: () => new Response('', { status: 503 }) });
    const planned = await plan({ max_hiking_difficulty: 3 });
    expect(planned).toEqual({
      plan: { kind: 'unrouted', max_hiking_difficulty: 3, why: 'router_unavailable', position: null, snapped_m: null },
      line: null,
      snapped: null,
      legs: null,
    });
    expect(asked('/height')).toHaveLength(0);
    expect(asked('/trace_attributes')).toHaveLength(0);
    expect(hikePlanSchema.safeParse(planned.plan).success).toBe(true);
  });

  it('HIKE-ROUTE-005: says there is no Valhalla where an own OSRM has none, and never routes the hike with OSRM', async () => {
    getUserSettings.mockResolvedValue({ routing_base_url: 'http://osrm.internal' });
    expect(unrouted(await plan()).why).toBe('no_valhalla');
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });

  it('HIKE-ROUTE-006: says no way within the limit joins the points where Valhalla finds none', async () => {
    valhalla({ route: () => json({ error_code: 442, error: 'No path could be found for input' }, 400) });
    expect(unrouted(await plan({ max_hiking_difficulty: 1 }))).toMatchObject({
      why: 'no_way',
      max_hiking_difficulty: 1,
    });
  });

  it('HIKE-ROUTE-007: names the point no way reaches and how far it was moved, and measures nothing', async () => {
    valhalla({
      route: () =>
        json(
          valhallaRoute([
            { line: stepsOf(0, 10), km: 0.111, seconds: 150 },
            { line: stepsOf(10, 20, 11.005), km: 0.111, seconds: 180 },
          ]),
        ),
    });
    const hike = unrouted(await plan());
    expect(hike).toMatchObject({ kind: 'unrouted', why: 'point_off_the_way', position: 2 });
    expect(hike.snapped_m).toBeGreaterThan(370);
    expect(hike.snapped_m).toBeLessThan(390);
    expect(asked('/height')).toHaveLength(0);
  });
});

describe('HikeRoutingService: heights and grades are best effort', () => {
  it('HIKE-ROUTE-008: keeps the line flat and times it by the router where the heights cannot be read', async () => {
    valhalla({ height: () => new Response('', { status: 502 }) });
    const planned = await plan();
    const hike = routed(planned);
    expect(hike).toMatchObject({
      ascent_m: null,
      descent_m: null,
      has_heights: false,
      duration_basis: 'router',
      // The router's 150 s and 180 s.
      duration_minutes: 6,
      profile: [],
    });
    expect(planned.line?.every((point) => point.length === 2)).toBe(true);
    expect(hike.grades?.highest).toBe(4);
    expect(hikePlanSchema.safeParse(hike).success).toBe(true);
  });

  it('HIKE-ROUTE-009: keeps the line flat where only part of it has heights', async () => {
    valhalla({
      route: () => json(valhallaRoute([{ line: stepsOf(0, 599), km: 6.7, seconds: 5000 }])),
      // The second piece of the line is answered for fewer points than it asked about.
      height: (shape) =>
        json({ range_height: shape.slice(0, shape.length > 200 ? undefined : 1).map((point, index) => [index, 600]) }),
    });
    const short = await plan({ waypoints: [WAYPOINTS[0], { lat: at(599)[0], lng: 11 }] });
    // The second piece is asked once more before the reading stops.
    expect(asked('/height')).toHaveLength(3);
    expect(routed(short).has_heights).toBe(false);
    expect(short.line?.every((point) => point.length === 2)).toBe(true);

    // One point the terrain data has no height for.
    valhalla({ height: (shape) => json({ range_height: shape.map((_, index) => [index, index === 3 ? null : 600]) }) });
    const gap = await plan();
    expect(routed(gap)).toMatchObject({ has_heights: false, ascent_m: null });
    expect(gap.line?.every((point) => point.length === 2)).toBe(true);
  });

  it('HIKE-ROUTE-010: plans the way without grades where the ways under it cannot be described', async () => {
    valhalla({ trace: () => new Response('', { status: 500 }) });
    const hike = routed(await plan());
    expect(hike.grades).toBeNull();
    expect(hike.has_heights).toBe(true);
    expect(grades).not.toHaveBeenCalled();

    valhalla({ trace: () => json({ edges: [] }) });
    expect(routed(await plan()).grades).toBeNull();
  });

  it('HIKE-ROUTE-011: says the grades could not be read where no source answered, and unknown where no way is graded', async () => {
    grades.mockResolvedValueOnce({ ways: [], unanswered: [101, 102, 103, 104] });
    expect(routed(await plan()).grades).toBeNull();

    grades.mockRejectedValueOnce(new Error('layer down'));
    expect(routed(await plan()).grades).toBeNull();

    // Ways the router names none of: nothing to ask, the whole line unknown.
    valhalla({ trace: () => json({ edges: [{ length: 0.1 }, { way_id: 0, length: 0.12 }] }) });
    grades.mockClear();
    expect(routed(await plan()).grades).toEqual({ segments: [], highest: null, unknown_share: 1 });
    expect(grades).not.toHaveBeenCalled();
  });

  it('HIKE-ROUTE-012: keeps the line flat where reading the heights throws, and takes a route without snapped points as it is', async () => {
    const router = t.get(RoadtripRouterService);
    const real = router.route.bind(router);
    const heights = vi.spyOn(router, 'heights').mockRejectedValueOnce('settings unreadable');
    const route = vi
      .spyOn(router, 'route')
      .mockImplementationOnce(async (...args) => ({ ...(await real(...args)), snapped: undefined }));
    const planned = await plan();
    const hike = routed(planned);
    expect(hike.has_heights).toBe(false);
    expect(hike.distance_m).toBe(222);
    expect(planned.snapped).toBeNull();
    expect(heights).toHaveBeenCalledTimes(1);
    route.mockRestore();
    heights.mockRestore();
  });

  it('HIKE-ROUTE-013: reads no grades where none are asked for, the way and its heights all the same', async () => {
    const hike = routed(await plan({}, false));
    expect(hike).toMatchObject({ has_heights: true, distance_m: 222, grades: null });
    expect(asked('/route')).toHaveLength(1);
    expect(asked('/height')).toHaveLength(1);
    expect(asked('/trace_attributes')).toHaveLength(0);
    expect(grades).not.toHaveBeenCalled();
  });
});

describe('HikeRoutingService: what it plans at all', () => {
  it('HIKE-ROUTE-014: plans no way longer than a hike is planned for, measuring nothing of it', async () => {
    const far = { lat: at(HIKE_MAX_LINE_POINTS)[0], lng: 11 };
    valhalla({
      route: () => json(valhallaRoute([{ line: stepsOf(0, HIKE_MAX_LINE_POINTS), km: 111.2, seconds: 90_000 }])),
    });
    expect(unrouted(await plan({ waypoints: [WAYPOINTS[0], far] }))).toMatchObject({
      why: 'too_long',
      position: null,
      snapped_m: null,
    });
    expect(asked('/height')).toHaveLength(0);
    expect(asked('/trace_attributes')).toHaveLength(0);

    // A line of exactly that many points is still planned.
    valhalla({
      route: () => json(valhallaRoute([{ line: stepsOf(1, HIKE_MAX_LINE_POINTS), km: 111.2, seconds: 90_000 }])),
    });
    expect(routed(await plan({ waypoints: [{ lat: at(1)[0], lng: 11 }, far] }, false)).has_heights).toBe(true);

    // Valhalla's own word that the way is longer than it plans.
    valhalla({ route: () => json({ error_code: 154, error: 'Path distance exceeds the max distance limit' }, 400) });
    expect(unrouted(await plan()).why).toBe('too_long');
  });

  it('HIKE-ROUTE-015: refuses points the plan does not take, before asking the router anything', async () => {
    const many = Array.from({ length: HIKE_PLAN_MAX_WAYPOINTS + 1 }, (_, k) => ({ lat: at(k)[0], lng: 11 }));
    const requests: HikePlanRequest[] = [
      { waypoints: many },
      { waypoints: WAYPOINTS.slice(0, 1) },
      { waypoints: WAYPOINTS, max_hiking_difficulty: 9 },
    ];
    const refusals = await Promise.all(
      requests.map((request) => hikes.plan(1, 1, request).catch((err: unknown) => err)),
    );
    expect(refusals.map((err) => err instanceof DomainError && err.getStatus())).toEqual([400, 400, 400]);
    expect(safeFetchAdminConfigured).not.toHaveBeenCalled();
  });
});

describe('HikeRoutingService: a planned hike kept for a while', () => {
  /** A plan for one user and trip of its own (or the trip given), the same pair each time it is asked. */
  function planner(id: number, tripId = id) {
    return async (request: Partial<HikePlanRequest> = {}, withGrades = true) => {
      const pending = hikes.plan(id, tripId, { waypoints: WAYPOINTS, ...request }, { grades: withGrades });
      await vi.runAllTimersAsync();
      return pending;
    };
  }
  const requests = () => vi.mocked(safeFetchAdminConfigured).mock.calls.length;
  /** How many hikes the memo holds right now, stale ones included. */
  const keptCount = () => (Reflect.get(hikes, 'memo') as Map<string, unknown>).size;

  it('HIKE-ROUTE-016: answers the same request again with the very way, asking the router nothing, for a save too', async () => {
    trip += 1;
    const ask = planner(trip);
    const first = await ask();
    expect(first.snapped).toEqual([0, 0, 0]);
    expect(first.legs).toEqual([111, 111]);
    const before = requests();
    // Points a millionth of a degree apart and named otherwise are the same points; a save reads no grades.
    const nudged = WAYPOINTS.map((point) => ({ ...point, lat: point.lat + 0.000001, name: 'Elsewhere' }));
    expect(await ask({ waypoints: nudged }, false)).toBe(first);
    expect(await ask({ max_hiking_difficulty: 2, hiking_preferences: null })).toBe(first);
    expect(requests()).toBe(before);

    // Another limit, other preferences, another user or trip plan anew.
    expect(await ask({ max_hiking_difficulty: 3 })).not.toBe(first);
    expect(await ask({ hiking_preferences: { avoid_steps: true } })).not.toBe(first);
    const other = planner(trip + 50_000);
    expect(await other()).not.toBe(first);
  });

  it('HIKE-ROUTE-017: asks again after fifteen minutes, for grades a save did not read, and for a way without heights', async () => {
    trip += 1;
    const ask = planner(trip);
    const saved = await ask({}, false);
    expect(asked('/trace_attributes')).toHaveLength(0);
    const shown = await ask({}, true);
    expect(shown).not.toBe(saved);
    expect(routed(shown).grades).not.toBeNull();
    expect(asked('/trace_attributes')).toHaveLength(1);
    expect(await ask({}, false)).toBe(shown);

    vi.advanceTimersByTime(15 * 60_000);
    expect(await ask({}, true)).not.toBe(shown);

    trip += 1;
    const level = planner(trip);
    valhalla({ height: () => new Response('', { status: 502 }) });
    const flatHike = await level();
    expect(routed(flatHike).has_heights).toBe(false);
    const heights = asked('/height').length;
    expect(await level()).not.toBe(flatHike);
    expect(asked('/height').length).toBeGreaterThan(heights);

    // A way not planned is not kept either: the router is asked again.
    trip += 1;
    const down = planner(trip);
    valhalla({ route: () => new Response('', { status: 503 }) });
    await down();
    await down();
    expect(asked('/route')).toHaveLength(2);
  });

  it('HIKE-ROUTE-018: keeps at most 64 ways, the one used longest ago going first', async () => {
    const base = 100_000;
    const asks = Array.from({ length: 65 }, (_, index) => planner(base + index));
    // Asked one after the other, so the first is the one used longest ago.
    const kept = await asks
      .slice(0, 64)
      .reduce<Promise<PlannedHike[]>>(
        async (before, ask) => [...(await before), await ask({}, false)],
        Promise.resolve([]),
      );
    // The first is used again, so the second is now the one used longest ago.
    expect(await asks[0]({}, false)).toBe(kept[0]);
    await asks[64]({}, false);
    expect(await asks[0]({}, false)).toBe(kept[0]);
    expect(await asks[2]({}, false)).toBe(kept[2]);
    expect(await asks[1]({}, false)).not.toBe(kept[1]);
  });

  it('HIKE-ROUTE-019: keeps one user apart from another in the same trip, and one trip apart from another of the same user', async () => {
    trip += 1;
    const first = await planner(trip)({}, false);
    expect(await planner(trip)({}, false)).toBe(first);
    expect(await planner(trip + 60_000, trip)({}, false)).not.toBe(first);
    expect(await planner(trip, trip + 60_000)({}, false)).not.toBe(first);
    expect(await planner(trip)({}, false)).toBe(first);
  });

  it('HIKE-ROUTE-020: drops stale hikes when it keeps a new one, and keeps no more than 200000 line points together', async () => {
    const before = keptCount();
    await planner(200_000)({}, false);
    expect(keptCount()).toBe(Math.min(before + 1, 64));
    // Well past fifteen minutes, also for a hike an earlier case kept on its own advanced clock.
    vi.advanceTimersByTime(30 * 60_000);
    await planner(200_001)({}, false);
    // Every hike planned before is stale now, and goes as soon as another is kept.
    expect(keptCount()).toBe(1);

    // Lines of 10000 points: the twentieth pushes the small hike out, the twenty first the oldest long one.
    const long = { waypoints: [WAYPOINTS[0], { lat: at(HIKE_MAX_LINE_POINTS - 1)[0], lng: 11 }] };
    const line = stepsOf(0, HIKE_MAX_LINE_POINTS - 1);
    valhalla({ route: () => json(valhallaRoute([{ line, km: 111.1, seconds: 90_000 }])) });
    const asks = Array.from({ length: 21 }, (_, index) => planner(300_000 + index));
    const kept = await asks
      .slice(0, 20)
      .reduce<Promise<PlannedHike[]>>(
        async (earlier, ask) => [...(await earlier), await ask(long, false)],
        Promise.resolve([]),
      );
    expect(kept[0].line).toHaveLength(HIKE_MAX_LINE_POINTS);
    expect(keptCount()).toBe(20);
    await asks[20](long, false);
    expect(keptCount()).toBe(20);
    expect(await asks[1](long, false)).toBe(kept[1]);
    expect(await asks[0](long, false)).not.toBe(kept[0]);
  });
});

describe('HikeRoutingService: the hike created from a proposal', () => {
  it('HIKE-ROUTE-021: saves the very line the proposal showed while the router would now answer another, and the new one once the memo let it go', async () => {
    const orm = t.get(MikroORM);
    const { user } = await makeUser(orm);
    const tripRow = await makeTrip(orm, user.id);
    const hiking = t.get(HikePlanService);
    const settled = async <T>(pending: Promise<T>): Promise<T> => {
      await vi.runAllTimersAsync();
      return await pending;
    };
    // Points two metres off the other cases' points, so neither the memo nor the router's caches hold them yet.
    const request = {
      name: 'Herzogstand',
      waypoints: WAYPOINTS.map((point) => ({ ...point, lat: point.lat + 0.00002 })),
    };
    const proposal = await settled(hiking.propose(user.id, tripRow.id, { ...request, along: false }));
    expect(proposal.route).toEqual({ planned: true });
    const savedLine = async (placeId: number) =>
      JSON.parse(String((await findRow(orm, Places, { id: placeId }))?.route_geometry)) as number[][];

    // The router would now plan another way, about 76 m east (within the snap limit, one leg per pair of points as
    // Valhalla answers), and its own caches (five minutes) have let the first go.
    const otherWay = valhallaRoute([
      { line: stepsOf(0, 10, 11.001), km: 0.111, seconds: 150 },
      { line: stepsOf(10, 20, 11.001), km: 0.111, seconds: 180 },
    ]);
    valhalla({ route: () => json(otherWay) });
    vi.advanceTimersByTime(6 * 60_000);
    const created = await settled(hiking.create(user.id, tripRow.id, request));
    expect(asked('/route')).toHaveLength(0);
    const shown = await savedLine(created.tour.place_id);
    expect(shown).toHaveLength(21);
    expect(shown.every(([, lng]) => lng === 11)).toBe(true);
    expect(shown.map(([lat, , ele]) => ele - heightAt(lat))).toEqual(Array.from({ length: 21 }, () => 0));

    // Past fifteen minutes the memo is gone, and the hike created is the way the router plans now.
    vi.advanceTimersByTime(10 * 60_000);
    const later = await settled(hiking.create(user.id, tripRow.id, { ...request, name: 'Later' }));
    expect(asked('/route')).toHaveLength(1);
    expect((await savedLine(later.tour.place_id)).every(([, lng]) => lng === 11.001)).toBe(true);
  });
});
