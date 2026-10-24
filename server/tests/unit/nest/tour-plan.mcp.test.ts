/**
 * TourPlanMcp: every tour type besides a hike and a city walk planned and
 * saved over MCP. A bike tour or a run is proposed and created through the
 * hike's own plan and save (HikePlanService), a paddle or ski tour from its
 * plan through SportTourCreateService, all real here over a snapshot test
 * db. The way on land is planned by HikeRoutingService, the legs on the water
 * and on the piste data by PaddleRoutingService and SkiRoutingService, and the
 * heights by RoadtripRouterService: stubs in this suite. The places along the
 * way and the day's weather are stubs too. The suite takes its subject from
 * the container and seeds through the ORM factories.
 */
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { PaddleRoutingService } from '../../../src/nest/paddle-routing/paddle-routing.service';
import { RoadtripRouterService } from '../../../src/nest/roadtrip/roadtrip-router.service';
import { SkiRoutingService } from '../../../src/nest/ski-routing/ski-routing.service';
import { HikeRoutingService, type PlannedHike } from '../../../src/nest/tours/hike-routing.service';
import { TourPlanMcp } from '../../../src/nest/tours/tour-plan.mcp';
import { TourPoiSearchService } from '../../../src/nest/tours/tour-poi-search.service';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { WeatherService } from '../../../src/nest/weather/weather.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { countRows, findRow } from '../../helpers/factories/rows';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import {
  tourProposalSchema,
  type GeometryPoint,
  type PaddleRouteResponse,
  type SkiRouteResponse,
  type SkiRouteSegment,
} from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// TOUR-PLAN-MCP-001 to TOUR-PLAN-MCP-012

const db = createSnapshotTestDb();
const plan = vi.fn<HikeRoutingService['plan']>();
const search = vi.fn<TourPoiSearchService['search']>();
const getDetailed = vi.fn<WeatherService['getDetailed']>();
const paddleRoute = vi.fn<PaddleRoutingService['route']>();
const skiRoute = vi.fn<SkiRoutingService['route']>();
const heights = vi.fn<RoadtripRouterService['heights']>();
let t: TestModule;
let mcp: TourPlanMcp;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [
      { provide: HikeRoutingService, useValue: { plan } },
      { provide: TourPoiSearchService, useValue: { search } },
      { provide: WeatherService, useValue: { getDetailed } },
      { provide: PaddleRoutingService, useValue: { route: paddleRoute } },
      { provide: SkiRoutingService, useValue: { route: skiRoute } },
    ],
  });
  mcp = t.get(TourPlanMcp);
});
beforeEach(() => {
  resetTestDb(db);
  plan.mockReset().mockResolvedValue(routed());
  search.mockReset().mockResolvedValue({ pois: [], truncated: false, partial: false, capped: false, unavailable: [] });
  getDetailed.mockReset().mockRejectedValue(new Error('no weather in this suite'));
  paddleRoute.mockReset().mockResolvedValue(paddled());
  skiRoute.mockReset().mockResolvedValue(skied());
  heights
    .mockReset()
    .mockImplementation(async (_userId, line) => line.map(([lat, lng]): GeometryPoint => [lat, lng, 500]));
  vi.spyOn(t.get(RoadtripRouterService), 'heights').mockImplementation(heights);
  t.realtime.broadcastMock.mockReset();
});
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

const LINE: GeometryPoint[] = [
  [47.9, 11.1, 600],
  [47.905, 11.1, 610],
  [47.91, 11.1, 620],
];

/** The stub's plan: a way of 1112 m, 25 minutes by the router, every height read. */
function routed(): PlannedHike {
  return {
    plan: {
      kind: 'routed',
      max_hiking_difficulty: 2,
      hiking_preferences: null,
      distance_m: 1112,
      ascent_m: 20,
      descent_m: 0,
      duration_minutes: 25,
      duration_basis: 'router',
      has_heights: true,
      line: LINE,
      profile: [
        [0, 600],
        [1112, 620],
      ],
      grades: null,
    },
    line: LINE,
    snapped: [3, 4, 5],
    legs: [556, 556],
  };
}

const WAYPOINTS = [
  { lat: 47.9, lng: 11.1, name: 'Station' },
  { lat: 47.905, lng: 11.1 },
  { lat: 47.91, lng: 11.1, name: 'Lake' },
];

/** Two legs on the water, the second carried round a weir halfway. */
function paddled(): PaddleRouteResponse {
  const segment = (kind: 'water' | 'portage', from: number, to: number, name: string | null = 'Isar') => ({
    kind,
    from,
    to,
    name,
    source: kind === 'portage' ? ('tagged' as const) : null,
    osm_ref: null,
    grade: null,
  });
  return {
    legs: [
      {
        status: 'ok',
        geometry: [
          [48.1, 11.6],
          [48.11, 11.6],
        ],
        segments: [segment('water', 0, 1)],
        distance_m: 1112,
        snapped_m: { from: 2, to: 3 },
      },
      {
        status: 'ok',
        geometry: [
          [48.11, 11.6],
          [48.115, 11.6],
          [48.12, 11.6],
        ],
        segments: [segment('water', 0, 1), segment('portage', 1, 2, null)],
        distance_m: 1112,
        snapped_m: { from: 1, to: 2 },
      },
    ],
    graph_rev: 'r1',
  };
}

const PADDLE_POINTS = [
  { lat: 48.1, lng: 11.6, name: 'Put-in' },
  { lat: 48.11, lng: 11.6 },
  { lat: 48.12, lng: 11.6, name: 'Take-out' },
];

/** One run down, its heights from the piste data, four minutes skied and a minute at the lift. */
function skied(): SkiRouteResponse {
  const segment: SkiRouteSegment = {
    kind: 'run',
    from: 0,
    to: 1,
    name: 'Kandahar',
    ref: null,
    difficulty: 'intermediate',
    lift_type: null,
    grooming: [],
    seconds: 240,
    wait_seconds: 0,
    length_m: 1112,
    flags: [],
    osm_way: null,
  };
  return {
    legs: [
      {
        status: 'ok',
        geometry: [
          [47.4, 11.0, 1800],
          [47.41, 11.0, 1500],
        ],
        segments: [segment],
        distance_m: 1112,
        climb_m: 0,
        descent_m: 300,
        seconds: { ski: 240, lift: 0, wait: 60, walk: 0 },
        snapped_m: { from: 1, to: 1 },
        area_ids: ['a1'],
        why: [],
        alternatives: [],
      },
    ],
    build: 'b7',
    stale: false,
    area_names: ['Garmisch-Classic'],
    colour_scheme: 'europe',
    attribution: 'OpenStreetMap',
  };
}

async function fixture() {
  const { user } = await makeUser(orm());
  const { user: outsider } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  return { user, outsider, trip };
}

describe('TourPlanMcp: the tools and their gates', () => {
  it('TOUR-PLAN-MCP-001: the proposal reads only, the creates write, all on the Tours addon', async () => {
    const options = (method: string) => {
      const entry = getEntry(TourPlanMcp as unknown as ClassRef, method);
      if (!entry || entry.kind !== 'tool') throw new Error(`${method} is no MCP tool`);
      return entry.options;
    };
    const tools = ['proposeTour', 'createTour', 'createPaddleTour', 'createSkiTour'].map(options);
    expect(tools.map((tool) => [tool.name, tool.annotations?.readOnlyHint, tool.access])).toEqual([
      ['propose_tour', true, { group: 'trips', mode: 'read' }],
      ['create_tour', false, { group: 'trips', mode: 'write' }],
      ['create_paddle_tour', false, { group: 'trips', mode: 'write' }],
      ['create_ski_tour', false, { group: 'trips', mode: 'write' }],
    ]);
    // The model is told which tool plans which type, and which profile to pick.
    expect(tools[0].description).toContain('propose_hike');
    expect(tools[0].description).toContain('gravel');
    expect(tools[0].description).toContain('trail');
    expect(tools[1].description).toContain('run_pace_seconds_per_km');
    expect(tools[2].description).toContain('water_context');
    expect(tools[3].description).toContain('discipline');
    const isAddonEnabled = vi.fn(async (id: string) => id === 'tours');
    const gated = await Promise.all(tools.map((tool) => tool.when?.(ctx(1), { addons: { isAddonEnabled } })));
    expect(gated).toEqual([true, true, true, true]);
  });

  it('TOUR-PLAN-MCP-002: an outsider is refused every tool, the creates without place_edit or, on a day, day_edit', async () => {
    const f = await fixture();
    const outsider = ctx(f.outsider.id);
    const noAccess = { error: 'Trip not found or access denied.' };
    const bike = { tripId: f.trip.id, name: 'Lake', activity: 'bike' as const, waypoints: WAYPOINTS };
    const paddle = { tripId: f.trip.id, name: 'Isar', waypoints: PADDLE_POINTS, water_context: 'river' as const };
    const ski = { tripId: f.trip.id, name: 'Kandahar', waypoints: PADDLE_POINTS, discipline: 'alpine' as const };
    expect(read(await mcp.proposeTour(bike, outsider))).toEqual(noAccess);
    expect(read(await mcp.createTour(bike, outsider))).toEqual(noAccess);
    expect(read(await mcp.createPaddleTour(paddle, outsider))).toEqual(noAccess);
    expect(read(await mcp.createSkiTour(ski, outsider))).toEqual(noAccess);

    const own = ctx(f.user.id);
    const guards = t.get(McpToolGuardsService);
    const denied = vi.spyOn(guards, 'hasTripPermission').mockResolvedValue(false);
    try {
      for (const result of [
        await mcp.createTour(bike, own),
        await mcp.createPaddleTour(paddle, own),
        await mcp.createSkiTour(ski, own),
      ]) {
        expect(result.isError).toBe(true);
      }
      expect(denied).toHaveBeenCalledWith('place_edit', f.trip.id, f.user.id);
    } finally {
      denied.mockRestore();
    }
    const day = await makeDay(orm(), f.trip.id, { day_number: 1, date: '2027-06-01' });
    const noDayEdit = vi.spyOn(guards, 'hasTripPermission').mockImplementation(async (action) => action !== 'day_edit');
    try {
      expect((await mcp.createTour({ ...bike, day_id: day.id }, own)).isError).toBe(true);
      expect(noDayEdit).toHaveBeenCalledWith('day_edit', f.trip.id, f.user.id);
    } finally {
      noDayEdit.mockRestore();
    }
    expect(await countRows(orm(), Places, { trip: f.trip.id })).toBe(0);
  });
});

describe('TourPlanMcp: propose_tour', () => {
  it('TOUR-PLAN-MCP-003: a bike tour is planned for its profile and timed by the router, nothing of a hike in it', async () => {
    const f = await fixture();
    const proposal = read(
      await mcp.proposeTour(
        { tripId: f.trip.id, name: 'Lake', activity: 'bike', bike_profile: 'gravel', waypoints: WAYPOINTS },
        ctx(f.user.id),
      ),
    );
    expect(tourProposalSchema.parse(proposal)).toEqual(proposal);
    expect(proposal).toMatchObject({
      activity: 'bike',
      bike_profile: 'gravel',
      run_profile: null,
      duration_minutes: 25,
      duration_basis: 'router',
      max_hiking_difficulty: null,
      hiking_preferences: null,
      sac: null,
    });
    // Shared out over the legs by their length: halfway at the middle point.
    expect(proposal.waypoints.map((point: { minutes: number | null }) => point.minutes)).toEqual([0, 13, 25]);
    expect(plan.mock.calls[0][3]).toEqual({ grades: false, activity: { activity: 'bike', profile: 'gravel' } });
    // The places a ride stops for are looked for along it, a bike repair shop among them.
    expect(search).toHaveBeenCalledWith(expect.objectContaining({ tour_type: 'bike' }));
    expect(search.mock.calls[0][0].categories).toContain('bike_repair');
  });

  it("TOUR-PLAN-MCP-004: a run is timed at the runner's pace, and has no time without one", async () => {
    const f = await fixture();
    const base = { tripId: f.trip.id, name: 'Isar', activity: 'run' as const, waypoints: WAYPOINTS, along: false };
    const paced = read(await mcp.proposeTour({ ...base, run_pace_seconds_per_km: 360 }, ctx(f.user.id)));
    expect(paced).toMatchObject({
      run_profile: 'running',
      run_pace_seconds_per_km: 360,
      duration_minutes: 7,
      duration_basis: 'pace',
    });
    const unpaced = read(await mcp.proposeTour({ ...base, run_profile: 'trail' }, ctx(f.user.id)));
    expect(unpaced).toMatchObject({ run_profile: 'trail', duration_minutes: null, duration_basis: null });
    expect(unpaced.waypoints.every((point: { minutes: number | null }) => point.minutes === null)).toBe(true);
    expect(search).not.toHaveBeenCalled();
  });

  it('TOUR-PLAN-MCP-005: refuses a profile of the other kind, which the tool shape alone would let through', async () => {
    const f = await fixture();
    await expect(
      mcp.proposeTour(
        { tripId: f.trip.id, name: 'X', activity: 'bike', run_profile: 'trail', waypoints: WAYPOINTS },
        ctx(f.user.id),
      ),
    ).rejects.toThrow('run_profile belongs to a run');
    expect(plan).not.toHaveBeenCalled();
  });
});

describe('TourPlanMcp: create_tour', () => {
  it('TOUR-PLAN-MCP-006: a bike tour is saved as the planner saves one, its profile and riding time kept', async () => {
    const f = await fixture();
    const created = read(
      await mcp.createTour(
        { tripId: f.trip.id, name: 'Lake', activity: 'bike', bike_profile: 'road', waypoints: WAYPOINTS },
        ctx(f.user.id),
      ),
    );
    expect(created.route).toEqual({ planned: true });
    expect(created.tour).toMatchObject({
      tour_type: 'bike',
      bike_profile: 'road',
      max_hiking_difficulty: null,
      duration: 25,
      route_pending: false,
    });
    const place = await findRow(orm(), Places, { id: created.tour.place_id });
    expect(JSON.parse(String(place?.route_geometry))).toEqual(LINE);
    expect(created.assignment).toBeNull();
  });

  it('TOUR-PLAN-MCP-007: a run is saved with its pace and the time at that pace, put on its day with its start', async () => {
    const f = await fixture();
    const day = await makeDay(orm(), f.trip.id, { day_number: 1, date: '2027-06-01' });
    const created = read(
      await mcp.createTour(
        {
          tripId: f.trip.id,
          name: 'Isar',
          activity: 'run',
          run_profile: 'trail',
          run_pace_seconds_per_km: 360,
          waypoints: WAYPOINTS,
          day_id: day.id,
          start_time: '07:30',
        },
        ctx(f.user.id),
      ),
    );
    expect(created.tour).toMatchObject({
      tour_type: 'run',
      run_profile: 'trail',
      run_pace_seconds_per_km: 360,
      duration: 7,
    });
    expect(created.assignment).toEqual({ id: expect.any(Number), day_id: day.id });
    const visit = await findRow(orm(), DayAssignments, { id: created.assignment.id });
    expect(visit?.assignment_time).toBe('07:30');
  });

  it("TOUR-PLAN-MCP-008: refuses a run without the runner's pace and a way no profile joins; nothing is saved", async () => {
    const f = await fixture();
    await expect(
      mcp.createTour({ tripId: f.trip.id, name: 'Isar', activity: 'run', waypoints: WAYPOINTS }, ctx(f.user.id)),
    ).rejects.toThrow("a run is saved with the runner's pace");
    plan.mockResolvedValue({
      plan: { kind: 'unrouted', max_hiking_difficulty: 2, why: 'no_way', position: null, snapped_m: null },
      line: null,
      snapped: null,
      legs: null,
    });
    await expect(
      mcp.createTour({ tripId: f.trip.id, name: 'Lake', activity: 'bike', waypoints: WAYPOINTS }, ctx(f.user.id)),
    ).rejects.toThrow('No way for a bike tour of this profile joins these points');
    expect(await countRows(orm(), Places, { trip: f.trip.id })).toBe(0);
  });
});

describe('TourPlanMcp: create_paddle_tour', () => {
  it('TOUR-PLAN-MCP-009: saves the legs planned again on the water with their heights and the estimate with the portage', async () => {
    const f = await fixture();
    const created = read(
      await mcp.createPaddleTour(
        { tripId: f.trip.id, name: 'Isar', waypoints: PADDLE_POINTS, water_context: 'river', boat_type: 'canoe' },
        ctx(f.user.id),
      ),
    );
    expect(paddleRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        boat: 'canoe',
        // The router is asked with the bare coordinates: the names of the points stay with the tour.
        legs: [
          { from: { lat: 48.1, lng: 11.6 }, to: { lat: 48.11, lng: 11.6 } },
          { from: { lat: 48.11, lng: 11.6 }, to: { lat: 48.12, lng: 11.6 } },
        ],
        lake_style: 'direct',
        lock_policy: 'auto',
      }),
    );
    expect(created.route).toEqual({ planned: true });
    expect(created.tour).toMatchObject({ tour_type: 'kayak', boat_type: 'canoe', water_context: 'river' });
    // Water at the canoe's speed, the portage carried at 2 km/h with its ten minutes for getting out and in.
    expect(created.tour.duration).toBeGreaterThan(10);
    const place = await findRow(orm(), Places, { id: created.tour.place_id });
    const line = JSON.parse(String(place?.route_geometry)) as GeometryPoint[];
    // The legs joined into one line, the point they share once.
    expect(line).toHaveLength(4);
    expect(line.every((point) => point[2] === 500)).toBe(true);
  });

  it('TOUR-PLAN-MCP-010: refuses a leg the water router cannot plan, and waits for its way without heights', async () => {
    const f = await fixture();
    const request = { tripId: f.trip.id, name: 'Isar', waypoints: PADDLE_POINTS, water_context: 'lake' as const };
    paddleRoute.mockResolvedValueOnce({
      legs: [paddled().legs[0], { status: 'failed', code: 'not_on_water', at: null }],
      graph_rev: null,
    });
    await expect(mcp.createPaddleTour(request, ctx(f.user.id))).rejects.toThrow(
      'Leg 2 could not be planned on the water (not_on_water)',
    );
    expect(await countRows(orm(), Places, { trip: f.trip.id })).toBe(0);
    heights.mockRejectedValueOnce(new Error('height host down'));
    const waiting = read(await mcp.createPaddleTour(request, ctx(f.user.id)));
    expect(waiting.route).toEqual({ planned: false, why: 'router_unavailable', position: null });
    expect(waiting.tour.route_pending).toBe(true);
  });
});

describe('TourPlanMcp: create_ski_tour', () => {
  it('TOUR-PLAN-MCP-011: saves the legs planned again on the piste data with its heights, its time, build and options', async () => {
    const f = await fixture();
    const points = PADDLE_POINTS.slice(0, 2);
    const created = read(
      await mcp.createSkiTour(
        { tripId: f.trip.id, name: 'Kandahar', waypoints: points, discipline: 'alpine' },
        ctx(f.user.id),
      ),
    );
    expect(created.tour).toMatchObject({ tour_type: 'ski', ski_discipline: 'alpine', duration: 5 });
    // The piste data had a height for every point: Valhalla is not asked.
    expect(heights).not.toHaveBeenCalled();
    const place = await findRow(orm(), Places, { id: created.tour.place_id });
    expect(JSON.parse(String(place?.route_geometry))).toEqual([
      [47.4, 11.0, 1800],
      [47.41, 11.0, 1500],
    ]);
  });

  it('TOUR-PLAN-MCP-012: refuses a cross-country tour without its technique and a leg the piste router cannot plan', async () => {
    const f = await fixture();
    const base = { tripId: f.trip.id, name: 'Loipe', waypoints: PADDLE_POINTS.slice(0, 2) };
    await expect(mcp.createSkiTour({ ...base, discipline: 'cross_country' }, ctx(f.user.id))).rejects.toThrow(
      'a cross-country tour needs a technique',
    );
    skiRoute.mockResolvedValueOnce({
      ...skied(),
      legs: [{ status: 'failed', code: 'loading', at: null, hint: null, detail: null }],
    });
    await expect(mcp.createSkiTour({ ...base, discipline: 'alpine' }, ctx(f.user.id))).rejects.toThrow(
      'Leg 1 could not be planned on the piste data (loading)',
    );
    expect(await countRows(orm(), Places, { trip: f.trip.id })).toBe(0);
  });
});
