/**
 * HikeRoutingService for a bike tour and a run: the way planned through the
 * same router a hike is, with the costing of the tour's profile from
 * `@trek/shared` (the one the planner in the browser sends), timed by the
 * router and without SAC grades. The router is the real one with its paced
 * queue; only the routing host behind safeFetchAdminConfigured is a stub,
 * answering /route and /height as Valhalla does.
 */
import { SettingsService } from '../../../src/nest/settings/settings.service';
import {
  HikeRoutingService,
  type PlannedActivity,
  type PlannedHike,
} from '../../../src/nest/tours/hike-routing.service';
import { TourTrailGradeService } from '../../../src/nest/tours/tour-trail-grade.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { safeFetchAdminConfigured } from '../../../src/utils/ssrfGuard';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { valhallaRoute } from '../../helpers/valhalla';
import { BIKE_COSTING, RUN_COSTING, type RoutedHikePlan } from '@trek/shared';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/utils/ssrfGuard', () => ({ safeFetchAdminConfigured: vi.fn() }));

// TOUR-ROUTE-001 to TOUR-ROUTE-004

const db = createSnapshotTestDb();
const grades = vi.fn<TourTrailGradeService['grades']>();
const getUserSettings = vi.fn<(userId: number) => Promise<Record<string, unknown>>>();
let t: TestModule;
let routing: HikeRoutingService;

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [
      { provide: TourTrailGradeService, useValue: { grades } },
      { provide: SettingsService, useValue: { getUserSettings } },
    ],
  });
  routing = t.get(HikeRoutingService);
});
afterAll(async () => {
  await t.close();
  db.close();
});

const at = (k: number): [number, number] => [47 + k / 1e4, 11];
const stepsOf = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => at(from + index));
const WAYPOINTS = [0, 10, 20].map((k) => ({ lat: at(k)[0], lng: 11 }));
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function valhalla() {
  vi.mocked(safeFetchAdminConfigured)
    .mockReset()
    .mockImplementation(async (url, init) => {
      const body = JSON.parse(String(init?.body ?? '{}')) as { shape?: Array<{ lat: number; lon: number }> };
      if (url.endsWith('/route')) {
        return json(
          valhallaRoute([
            { line: stepsOf(0, 10), km: 0.111, seconds: 150 },
            { line: stepsOf(10, 20), km: 0.111, seconds: 180 },
          ]),
        );
      }
      if (url.endsWith('/height')) {
        return json({ range_height: (body.shape ?? []).map((point, index) => [index, 600 + index]) });
      }
      return json({}, 404);
    });
}

const asked = (path: string) =>
  vi.mocked(safeFetchAdminConfigured).mock.calls.filter(([url]) => String(url).endsWith(path));
const bodyOf = (path: string, index = 0) =>
  JSON.parse(String(asked(path)[index]?.[1]?.body)) as Record<string, unknown>;

let trip = 0;
async function plan(activity?: PlannedActivity, sameTrip = false): Promise<PlannedHike> {
  if (!sameTrip) trip += 1;
  const pending = routing.plan(
    trip,
    trip,
    { waypoints: WAYPOINTS },
    activity ? { grades: false, activity } : undefined,
  );
  await vi.runAllTimersAsync();
  return pending;
}
function routed({ plan: planned }: PlannedHike): RoutedHikePlan {
  if (planned.kind !== 'routed') throw new Error(`expected a routed plan, got ${planned.why}`);
  return planned;
}

beforeEach(() => {
  vi.useFakeTimers();
  getUserSettings.mockReset().mockResolvedValue({});
  grades.mockReset();
  valhalla();
});
afterEach(() => vi.useRealTimers());

describe('HikeRoutingService: a bike tour and a run', () => {
  it("TOUR-ROUTE-001: a bike tour asks the bicycle costing of its profile and keeps the router's riding time", async () => {
    const planned = routed(await plan({ activity: 'bike', profile: 'gravel' }));
    expect(bodyOf('/route')).toMatchObject({
      costing: 'bicycle',
      costing_options: { bicycle: BIKE_COSTING.gravel },
    });
    // 330 s by the router for the profile, never the signposts' rule a walker is timed by.
    expect(planned).toMatchObject({ duration_minutes: 6, duration_basis: 'router', has_heights: true, grades: null });
    expect(asked('/trace_attributes')).toHaveLength(0);
    expect(grades).not.toHaveBeenCalled();
  });

  it('TOUR-ROUTE-002: a run asks the pedestrian costing of its profile, without a hiking limit of its own', async () => {
    routed(await plan({ activity: 'run', profile: 'trail' }));
    expect(bodyOf('/route')).toMatchObject({
      costing: 'pedestrian',
      costing_options: { pedestrian: RUN_COSTING.trail },
    });
    routed(await plan({ activity: 'run', profile: 'running' }));
    expect(bodyOf('/route', 1)).toMatchObject({ costing_options: { pedestrian: { use_tracks: 0, use_ferry: 0 } } });
  });

  it('TOUR-ROUTE-003: a ride, a run and a hike through the same points are each planned on their own', async () => {
    await plan();
    await plan({ activity: 'bike', profile: 'road' }, true);
    await plan({ activity: 'run', profile: 'running' }, true);
    await plan({ activity: 'bike', profile: 'road' }, true);
    // Three ways asked; the ride asked again comes from the memo.
    expect(asked('/route').map((call) => (JSON.parse(String(call[1]?.body)) as { costing: string }).costing)).toEqual([
      'pedestrian',
      'bicycle',
      'pedestrian',
    ]);
  });

  it('TOUR-ROUTE-004: where an own OSRM has no Valhalla a bike tour is refused as no_valhalla, never ridden by OSRM', async () => {
    getUserSettings.mockResolvedValue({ routing_base_url: 'http://osrm.internal' });
    const planned = await plan({ activity: 'bike', profile: 'touring' });
    expect(planned.plan.kind === 'unrouted' && planned.plan.why).toBe('no_valhalla');
    expect(asked('/route')).toHaveLength(0);
  });
});
