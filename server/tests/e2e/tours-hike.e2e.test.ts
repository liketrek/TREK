/**
 * Tours e2e for a hike planned with an assistant over MCP: proposed, created,
 * put on a day, pointed at the packing list, exported as GPX and changed,
 * every tool called through a real MCP session on the whole app (buildApp,
 * the real registry with its addon gates, scopes and error mapper, the real
 * services and a migrated temp SQLite). The way is planned by the road
 * trip's router with its paced queue; only the routing host behind
 * safeFetchAdminConfigured is a stub answering /route, /height and
 * /trace_attributes as Valhalla does, and the trail grades, the places along
 * the way and the day's weather are spies on the container's
 * TourTrailGradeService, TourPoiSearchService and WeatherService, so nothing
 * leaves the process. The
 * router's pacing runs on the test's clock during a call, moved on until the
 * call is done, so the suite does not wait it out. The broadcasts are spied
 * on the container's RealtimeService.
 */
import { buildApp } from '../../src/bootstrap';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { createLocalMcpServer, McpRegistryService } from '../../src/nest-mcp';
import { unchangedSinceApplied } from '../../src/nest/assistant/assistant-undo.helpers';
import { withRequestContext } from '../../src/nest/database/request-context';
import { TourPoiSearchService } from '../../src/nest/tours/tour-poi-search.service';
import { TourTrailGradeService } from '../../src/nest/tours/tour-trail-grade.service';
import { WeatherService } from '../../src/nest/weather/weather.service';
import { safeFetchAdminConfigured } from '../../src/utils/ssrfGuard';
import { countRows, findRow } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { makeDay, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { spyOnRealtime, type RealtimeSpies } from '../helpers/fake-realtime';
import { valhallaRoute } from '../helpers/valhalla';
import { MikroORM } from '@mikro-orm/core';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import type { INestApplication } from '@nestjs/common';
import { hikeProposalSchema, type TourTrailGrade } from '@trek/shared';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/utils/ssrfGuard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/utils/ssrfGuard')>()),
  safeFetchAdminConfigured: vi.fn(),
}));

let app: INestApplication;
let orm: MikroORM;
let broadcasts: RealtimeSpies;

/** A point `k` steps of 0.0005° north of 47.6° N on 11.3° E, about 56 m a step. */
const at = (k: number): [number, number] => [47.6 + k / 2000, 11.3];
const stepsOf = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => at(from + index));
/** The height under a point: 40 m a step up. */
const heightAt = (lat: number) => Math.round(800 + (lat - 47.6) * 80_000);

const WAYPOINTS = [
  { lat: at(0)[0], lng: 11.3, name: 'Car park' },
  { lat: at(10)[0], lng: 11.3, name: 'Hut' },
  { lat: at(20)[0], lng: 11.3, name: 'Summit' },
];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

/** The routing host: two legs up to the summit, the height of every point, two ways under the line. */
function valhalla() {
  vi.mocked(safeFetchAdminConfigured).mockImplementation(async (url, init) => {
    const body = JSON.parse(String(init?.body ?? '{}')) as { shape?: Array<{ lat: number; lon: number }> };
    if (url.endsWith('/route')) {
      return json(
        valhallaRoute([
          { line: stepsOf(0, 10), km: 0.556, seconds: 600 },
          { line: stepsOf(10, 20), km: 0.556, seconds: 720 },
        ]),
      );
    }
    if (url.endsWith('/height')) {
      return json({ range_height: (body.shape ?? []).map((point, index) => [index, heightAt(point.lat)]) });
    }
    if (url.endsWith('/trace_attributes')) {
      return json({
        edges: [
          { way_id: 501, length: 0.556 },
          { way_id: 502, length: 0.556 },
        ],
      });
    }
    return json({}, 404);
  });
}

const grade = (id: number, sac: TourTrailGrade['sac_scale']): TourTrailGrade => ({
  id,
  mtb_scale: null,
  mtb_scale_uphill: null,
  mtb_scale_imba: null,
  sac_scale: sac,
  sac_scale_unclear: null,
  surface: null,
  highway: 'path',
});

/** What the routing host was asked since the counts were last taken, by path. */
let askedBefore = 0;
function askedSince(): string[] {
  const calls = vi.mocked(safeFetchAdminConfigured).mock.calls.slice(askedBefore);
  askedBefore += calls.length;
  return calls.map(([url]) => new URL(String(url)).pathname);
}

/** The test's clock moved on a tenth of a second at a time, each with a turn of the real event loop, until `done`. */
async function moveOn(done: () => boolean): Promise<void> {
  if (done()) return;
  await vi.advanceTimersByTimeAsync(100);
  await moveOn(done);
}

/**
 * A call moved through to its end on the test's clock: the router waits about
 * a second between two questions to the host, here no time at all.
 */
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
  const server = createLocalMcpServer('TREK hike e2e');
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
  const client = new Client({ name: 'hike-e2e', version: '1.0.0' });
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

/** The trip sends as `[event, excluded socket]`, emptied after each read. */
function sent(): Array<[string, unknown]> {
  const calls = broadcasts.broadcast.mock.calls.map((call): [string, unknown] => [String(call[1]), call[3]]);
  broadcasts.broadcast.mockClear();
  return calls;
}

beforeAll(async () => {
  app = await buildApp();
  orm = app.get(MikroORM);
  broadcasts = spyOnRealtime(app);
  await setAddonEnabled(orm, 'tours', true);
  await setAddonEnabled(orm, 'packing', true);
  vi.spyOn(app.get(TourTrailGradeService), 'grades').mockResolvedValue({
    ways: [grade(501, 'hiking'), grade(502, 'mountain_hiking')],
    unanswered: [],
  });
  vi.spyOn(app.get(TourPoiSearchService), 'search').mockResolvedValue({
    pois: [
      {
        id: 'node:1',
        name: 'Hut',
        lat: at(10)[0],
        lng: 11.3001,
        category: 'shelter',
        kind: 'amenity=shelter',
        source: 'openstreetmap',
        address: null,
        website: null,
        phone: null,
        opening_hours: null,
        distance_m: 8,
        along_m: 556,
      },
    ],
    truncated: false,
    partial: false,
    capped: false,
    unavailable: [],
  });
  vi.spyOn(app.get(WeatherService), 'getDetailed').mockResolvedValue({
    type: 'forecast',
    temp: 14,
    main: 'Clear',
    description: '',
    sunrise: '05:30',
    sunset: '21:00',
    precipitation_probability_max: 70,
    hourly: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      temp: 12,
      precipitation: 0,
      precipitation_probability: hour === 9 ? 70 : 5,
      main: 'Clear',
      wind: 10,
      humidity: 50,
    })),
  });
  valhalla();
}, 60_000);

afterAll(async () => {
  await app?.close();
});

describe('a hike planned with an assistant over MCP', () => {
  it('is proposed, created, put on a day, packed for, exported and changed, the whole trip told of each write', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Alps' });
    const day = await makeDay(orm, trip.id, { day_number: 1, date: '2027-07-10' });

    // The proposal: the way, its heights and grades, and nothing written.
    const proposal = await callTool(user.id, 'propose_hike', {
      tripId: trip.id,
      name: 'Up to the summit',
      waypoints: WAYPOINTS,
      max_hiking_difficulty: 2,
      variant_label: 'by the hut',
      day_id: day.id,
      start_time: '08:30',
      include_geometry: true,
    });
    expect(hikeProposalSchema.parse(proposal)).toEqual(proposal);
    expect(proposal).toMatchObject({
      route: { planned: true },
      variant_label: 'by the hut',
      distance_m: 1112,
      ascent_m: 800,
      heights_known: true,
      min_ele_m: 800,
      max_ele_m: 1600,
      duration_basis: 'din33466',
      sac: { highest: 2, unknown_share: 0 },
      high_point: { lat: at(20)[0], lng: 11.3, ele_m: 1600, at_m: 1112 },
      day_id: day.id,
      date: '2027-07-10',
      start_time: '08:30',
      schedule: { date: '2027-07-10', day_id: day.id, start: '08:30', weather: 'forecast', sunset: '21:00' },
      warnings: [{ kind: 'rain', at: '09:00' }],
    });
    expect(proposal.waypoints.map((point: { at_m: number }) => point.at_m)).toEqual([0, 556, 1112]);
    expect(proposal.waypoints.map((point: { arrival: string }) => point.arrival)[0]).toBe('08:30');
    expect(proposal.along).toEqual([
      { name: 'Hut', category: 'shelter', lat: at(10)[0], lng: 11.3001, at_m: 556, off_m: 8 },
    ]);
    expect(proposal.line_geometry).toHaveLength(21);
    // The highest point, asked to about a kilometre.
    expect(app.get(WeatherService).getDetailed).toHaveBeenCalledWith('47.61', '11.3', '2027-07-10', 'en');
    expect(await countRows(orm, Tours, {})).toBe(0);
    expect(sent()).toEqual([]);
    expect(askedSince()).toEqual(['/route', '/height', '/trace_attributes']);

    // The hike the traveller said yes to, with its whole line and its heights.
    const created = await callTool(user.id, 'create_hike', {
      tripId: trip.id,
      name: 'Up to the summit',
      waypoints: WAYPOINTS,
      max_hiking_difficulty: 2,
    });
    expect(created.route).toEqual({ planned: true });
    expect(created.tour).toMatchObject({
      name: 'Up to the summit',
      tour_type: 'hike',
      max_hiking_difficulty: 2,
      elevation_gain: 800,
      duration: proposal.duration_minutes,
      revision: 1,
      route_pending: false,
    });
    const placeId: number = created.tour.place_id;
    const line = JSON.parse(String((await findRow(orm, Places, { id: placeId }))?.route_geometry)) as number[][];
    expect(line).toHaveLength(21);
    expect(line.every((point) => point.length === 3)).toBe(true);
    expect(sent()).toEqual([
      ['tours:changed', undefined],
      ['place:created', undefined],
    ]);
    // The way and its heights as the proposal had them, and no grades: the host is not asked. The hike memo
    // (fifteen minutes) and the router's own caches both answer here; HIKE-ROUTE-021 tells the memo apart.
    expect(askedSince()).toEqual([]);
    // Just made, the hike can be taken back: the trip as the undo reads it has it as it was created.
    const summary = await callTool(user.id, 'get_trip_summary', { tripId: trip.id });
    const places = await callTool(user.id, 'list_places', { tripId: trip.id });
    expect(unchangedSinceApplied('create_hike', created, { summary, places })).toBe(true);

    // On the day, pointed at the packing list, exported with its heights.
    const assigned = await callTool(user.id, 'assign_place_to_day', { tripId: trip.id, dayId: day.id, placeId });
    expect(assigned.assignment).toBeTruthy();
    expect(await countRows(orm, DayAssignments, { place: placeId })).toBe(1);
    sent();
    const packed = await callTool(user.id, 'link_tour_packing', { tripId: trip.id, placeId, category: null });
    expect(packed.packing_link).toMatchObject({ category: null });
    expect(sent().map(([event]) => event)).toEqual(['tours:changed']);
    const exported = await callTool(user.id, 'export_tour_gpx', { tripId: trip.id, placeId });
    expect(exported.gpx).toContain('Up to the summit');
    expect(exported.gpx).toContain('<ele>');

    // A harder limit plans the way anew; the hike stays on its day.
    const changed = await callTool(user.id, 'update_tour', {
      tripId: trip.id,
      placeId,
      expected_revision: 1,
      max_hiking_difficulty: 3,
      name: 'Summit by the ridge',
    });
    expect(changed).toMatchObject({ replanned: true, route: { planned: true } });
    expect(changed.tour).toMatchObject({ name: 'Summit by the ridge', max_hiking_difficulty: 3, revision: 2 });
    expect(sent()).toEqual([
      ['tours:changed', undefined],
      ['place:updated', undefined],
    ]);
    expect(await countRows(orm, DayAssignments, { place: placeId })).toBe(1);
    // The way under the new limit; its heights are the same line's, and a change reads no grades.
    expect(askedSince()).toEqual(['/route']);

    // A change based on the old revision is refused and writes nothing.
    const stale = await callTool(user.id, 'update_tour', {
      tripId: trip.id,
      placeId,
      expected_revision: 1,
      name: 'Stale',
    });
    expect(stale).toEqual({ error: 'This tour was changed in the meantime' });
    expect((await findRow(orm, Places, { id: placeId }))?.name).toBe('Summit by the ridge');
    expect(sent()).toEqual([]);
    expect(askedSince()).toEqual([]);
  });

  it('creates a hike straight onto a day in one write, its start kept, and tells the trip of the tour and the visit', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id, { title: 'Alps' });
    const day = await makeDay(orm, trip.id, { day_number: 1, date: '2027-07-10' });
    sent();
    const created = await callTool(user.id, 'create_hike', {
      tripId: trip.id,
      name: 'Up to the summit',
      waypoints: WAYPOINTS,
      day_id: day.id,
      start_time: '08:30',
    });
    expect(created.route).toEqual({ planned: true });
    expect(created.assignment).toEqual({ id: expect.any(Number), day_id: day.id });
    const visit = await findRow(orm, DayAssignments, { id: created.assignment.id });
    expect(visit).toMatchObject({ place_id: created.tour.place_id, assignment_time: '08:30' });
    expect(sent()).toEqual([
      ['tours:changed', undefined],
      ['place:created', undefined],
      ['assignment:created', undefined],
    ]);
    askedSince();
  });

  it('takes a GPX text in as a hike, and refuses the tools to someone outside the trip', async () => {
    const { user } = await makeUser(orm);
    const { user: outsider } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const gpx =
      '<gpx><trk><name>Ridge</name><trkseg><trkpt lat="47.6" lon="11.3"><ele>800</ele></trkpt>' +
      '<trkpt lat="47.61" lon="11.3"><ele>1000</ele></trkpt></trkseg></trk></gpx>';
    const imported = await callTool(user.id, 'import_tour_gpx', { tripId: trip.id, gpx, file_name: 'ridge.gpx' });
    expect(imported).toMatchObject({ caution: false, skipped: 0 });
    expect(imported.tours[0]).toMatchObject({ name: 'Ridge', tour_type: 'hike', elevation_gain: 200 });
    expect(sent()).toEqual([
      ['tours:changed', undefined],
      ['place:created', undefined],
    ]);

    const refused = { error: 'Trip not found or access denied.' };
    expect(
      await callTool(outsider.id, 'propose_hike', { tripId: trip.id, name: 'Ridge', waypoints: WAYPOINTS }),
    ).toEqual(refused);
    expect(await callTool(outsider.id, 'import_tour_gpx', { tripId: trip.id, gpx })).toEqual(refused);
    expect(await callTool(user.id, 'import_tour_gpx', { tripId: trip.id, gpx, tour_type: 'kayak' })).toMatchObject({
      error: expect.stringContaining('a paddle import needs boat_type'),
    });
  });
});
