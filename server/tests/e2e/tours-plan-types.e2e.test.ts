/**
 * Tours e2e for every tour type besides a hike planned with an assistant over
 * MCP: a bike tour proposed and created, a run created at its pace, a paddle
 * tour and a ski tour saved from their plans, every tool called through a
 * real MCP session on the whole app (buildApp, the real registry with its
 * addon gates, scopes and error mapper, the real services and a migrated temp
 * SQLite). The way on land is planned by the road trip's router with its
 * paced queue; only the routing host behind safeFetchAdminConfigured is a
 * stub answering /route and /height as Valhalla does. The legs on the water
 * and on the piste data come from spies on the container's
 * PaddleRoutingService and SkiRoutingService, the places along the way from
 * one on TourPoiSearchService, so nothing leaves the process.
 */
import { buildApp } from '../../src/bootstrap';
import { Places } from '../../src/db/entities/Places.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { createLocalMcpServer, McpRegistryService } from '../../src/nest-mcp';
import { withRequestContext } from '../../src/nest/database/request-context';
import { PaddleRoutingService } from '../../src/nest/paddle-routing/paddle-routing.service';
import { SkiRoutingService } from '../../src/nest/ski-routing/ski-routing.service';
import { TourPoiSearchService } from '../../src/nest/tours/tour-poi-search.service';
import { safeFetchAdminConfigured } from '../../src/utils/ssrfGuard';
import { countRows, findRow } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { spyOnRealtime, type RealtimeSpies } from '../helpers/fake-realtime';
import { valhallaRoute } from '../helpers/valhalla';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';
import { BIKE_COSTING, tourProposalSchema } from '@trek/shared';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/utils/ssrfGuard')>()),
  safeFetchAdminConfigured: vi.fn(),
}));

let app: INestApplication;
let orm: MikroORM;
let broadcasts: RealtimeSpies;

/** A point `k` steps of 0.0005° north of 47.9° N on 11.1° E, about 56 m a step. */
const at = (k: number): [number, number] => [47.9 + k / 2000, 11.1];
const stepsOf = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => at(from + index));

const WAYPOINTS = [
  { lat: at(0)[0], lng: 11.1, name: 'Station' },
  { lat: at(20)[0], lng: 11.1, name: 'Lake' },
];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

/** The routing host: one leg of 1.1 km ridden in four minutes, the height of every point. */
function valhalla() {
  vi.mocked(safeFetchAdminConfigured).mockImplementation(async (url, init) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as { shape?: Array<{ lat: number; lon: number }> };
    if (url.endsWith('/route')) return json(valhallaRoute([{ line: stepsOf(0, 20), km: 1.112, seconds: 240 }]));
    if (url.endsWith('/height')) {
      return json({ range_height: (body.shape ?? []).map((point, index) => [index, 600 + index]) });
    }
    return json({}, 404);
  });
}

async function moveOn(done: () => boolean): Promise<void> {
  if (done()) return;
  await vi.advanceTimersByTimeAsync(100);
  await moveOn(done);
}

/** A call moved through to its end on the test's clock, which the router's pacing waits on. */
async function settled<T>(pending: Promise<T>): Promise<T> {
  let done = false;
  const outcome = pending.then(
    (value) => {
      done = true;
      return { value };
    },
    (error: unknown) => {
      done = true;
      return { error };
    },
  );
  await moveOn(() => done);
  const result = await outcome;
  if ('error' in result) throw result.error;
  return result.value;
}

/** One tool call as `userId` over an MCP session of its own, with every scope; the JSON it answered or its error. */
async function callTool(userId: number, name: string, args: Record<string, unknown>) {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  try {
    return await settled(callOnce(userId, name, args));
  } finally {
    vi.useRealTimers();
  }
}

async function callOnce(userId: number, name: string, args: Record<string, unknown>) {
  const server = createLocalMcpServer('TREK tour types e2e');
  const around = (_info: unknown, call: () => unknown): unknown => withRequestContext(orm, call);
  await withRequestContext(orm, () =>
    app
      .get(McpRegistryService)
      .attach(
        server,
        { userId, scopes: null, isStaticToken: false },
        { include: (kind, tool) => kind === 'tool' && tool === name, around },
      ),
  );
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'tour-types-e2e', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const result = await client.callTool({ name, arguments: args });
    const content = Array.isArray(result.content) ? (result.content as Array<{ text?: string }>) : [];
    const text = content[0]?.text ?? '';
    return result.isError === true ? { error: text } : JSON.parse(text);
  } finally {
    await client.close();
    await server.close();
  }
}

/** The events the trip was sent, emptied after each read. */
function sent(): string[] {
  const events = broadcasts.broadcast.mock.calls.map((call) => String(call[1]));
  broadcasts.broadcast.mockClear();
  return events;
}

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
  broadcasts = spyOnRealtime(app);
  await setAddonEnabled(orm, 'tours', true);
  vi.spyOn(app.get(TourPoiSearchService), 'search').mockResolvedValue({
    pois: [],
    truncated: false,
    partial: false,
    capped: false,
    unavailable: [],
  });
  vi.spyOn(app.get(PaddleRoutingService), 'route').mockResolvedValue({
    legs: [
      {
        status: 'ok',
        geometry: stepsOf(0, 20),
        segments: [{ kind: 'water', from: 0, to: 20, name: 'Isar', source: null, osm_ref: null, grade: null }],
        distance_m: 1112,
        snapped_m: { from: 1, to: 1 },
      },
    ],
    graph_rev: 'r1',
  });
  vi.spyOn(app.get(SkiRoutingService), 'route').mockResolvedValue({
    legs: [
      {
        status: 'ok',
        geometry: stepsOf(0, 20).map(([lat, lng], index): [number, number, number] => [lat, lng, 1800 - index * 10]),
        segments: [],
        distance_m: 1112,
        climb_m: 0,
        descent_m: 200,
        seconds: { ski: 300, lift: 0, wait: 0, walk: 0 },
        snapped_m: { from: 1, to: 1 },
        area_ids: ['a1'],
        why: [],
        alternatives: [],
      },
    ],
    build: 'b1',
    stale: false,
    area_names: ['Garmisch'],
    colour_scheme: 'europe',
    attribution: '',
  });
  valhalla();
}, 60_000);

afterAll(async () => {
  await app?.close();
});

describe('every tour type planned with an assistant over MCP', () => {
  it('a bike tour is proposed for its profile and created as the planner saves one, the trip told', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Lakes' });
    const proposal = await callTool(user.id, 'propose_tour', {
      tripId: trip.id,
      name: 'Lake ride',
      activity: 'bike',
      bike_profile: 'road',
      waypoints: WAYPOINTS,
    });
    expect(tourProposalSchema.parse(proposal)).toEqual(proposal);
    expect(proposal).toMatchObject({
      activity: 'bike',
      bike_profile: 'road',
      duration_minutes: 4,
      duration_basis: 'router',
    });
    const routeCall = vi.mocked(safeFetchAdminConfigured).mock.calls.find(([url]) => String(url).endsWith('/route'));
    expect(JSON.parse(String(routeCall?.[1]?.body))).toMatchObject({
      costing: 'bicycle',
      costing_options: { bicycle: BIKE_COSTING.road },
    });
    expect(await countRows(orm, Places, { trip: trip.id })).toBe(0);

    const created = await callTool(user.id, 'create_tour', {
      tripId: trip.id,
      name: 'Lake ride',
      activity: 'bike',
      bike_profile: 'road',
      waypoints: WAYPOINTS,
    });
    expect(created.route).toEqual({ planned: true });
    const tour = await findRow(orm, Tours, { place: created.tour.place_id });
    expect(tour).toMatchObject({ bike_profile: 'road', duration: 4 });
    expect(sent()).toEqual(['tours:changed', 'place:created']);
  });

  it("a run is created only with the runner's pace, and timed at it", async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Run' });
    const args = { tripId: trip.id, name: 'Isar run', activity: 'run', run_profile: 'trail', waypoints: WAYPOINTS };
    const refused = await callTool(user.id, 'create_tour', args);
    expect(refused.error).toContain("a run is saved with the runner's pace");
    const created = await callTool(user.id, 'create_tour', { ...args, run_pace_seconds_per_km: 360 });
    expect(created.tour).toMatchObject({ tour_type: 'run', run_profile: 'trail', duration: 7 });
  });

  it('a paddle tour and a ski tour are saved from their plans with their heights and times', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Water and snow' });
    const points = [
      { lat: at(0)[0], lng: 11.1 },
      { lat: at(20)[0], lng: 11.1 },
    ];
    const paddle = await callTool(user.id, 'create_paddle_tour', {
      tripId: trip.id,
      name: 'Isar',
      waypoints: points,
      water_context: 'river',
    });
    expect(paddle.tour).toMatchObject({ tour_type: 'kayak', boat_type: 'kayak', water_context: 'river' });
    // 1112 m at a kayak's 4 km/h.
    expect(paddle.tour.duration).toBe(17);
    const ski = await callTool(user.id, 'create_ski_tour', {
      tripId: trip.id,
      name: 'Garmisch',
      waypoints: points,
      discipline: 'alpine',
    });
    expect(ski.tour).toMatchObject({ tour_type: 'ski', ski_discipline: 'alpine', duration: 5 });
    const place = await findRow(orm, Places, { id: ski.tour.place_id });
    expect(JSON.parse(String(place?.route_geometry))[0]).toEqual([...at(0), 1800]);
    const refused = await callTool(user.id, 'create_paddle_tour', { tripId: trip.id, name: 'X', waypoints: points });
    expect(refused.error).toBeTruthy();
    expect(await countRows(orm, Places, { trip: trip.id })).toBe(2);
  });
});
