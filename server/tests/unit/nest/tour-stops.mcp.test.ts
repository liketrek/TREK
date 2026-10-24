/**
 * P6: TourStopsMcp over a snapshot test db: a found place taken into a saved
 * hike as a stop with insert_tour_stop and taken out again with
 * remove_tour_stop, through the write update_tour saves with. The hike is
 * created through create_hike; its way is planned by a stub of
 * HikeRoutingService, as in the hike suite. The gates are the tours': trip
 * access, then place_edit, on the Tours addon.
 */
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { HikePlanMcp } from '../../../src/nest/tours/hike-plan.mcp';
import { HikeRoutingService, type PlannedHike } from '../../../src/nest/tours/hike-routing.service';
import { TourPoiSearchService } from '../../../src/nest/tours/tour-poi-search.service';
import { TourStopsMcp } from '../../../src/nest/tours/tour-stops.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { WeatherService } from '../../../src/nest/weather/weather.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour } from '../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import type { GeometryPoint, HikePlanRequest } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// TOUR-STOPS-MCP-001 to TOUR-STOPS-MCP-007

const db = createSnapshotTestDb();
const plan = vi.fn<HikeRoutingService['plan']>();
let t: TestModule;
let stops: TourStopsMcp;
let hikes: HikePlanMcp;
const orm = () => t.get(MikroORM);

const LINE: GeometryPoint[] = [
  [47.5, 11.1, 800],
  [47.505, 11.1, 900],
  [47.51, 11.1, 1000],
];

/** The stub's plan: the way above under the limit asked for, whatever the points. */
function routed(request: HikePlanRequest): PlannedHike {
  return {
    plan: {
      kind: 'routed',
      max_hiking_difficulty: request.max_hiking_difficulty ?? 2,
      hiking_preferences: request.hiking_preferences ?? null,
      distance_m: 1112,
      ascent_m: 200,
      descent_m: 0,
      duration_minutes: 52,
      duration_basis: 'din33466',
      has_heights: true,
      line: LINE,
      profile: [
        [0, 800],
        [1112, 1000],
      ],
      grades: null,
    },
    line: LINE,
    snapped: request.waypoints.map(() => 5),
    legs: request.waypoints.slice(1).map(() => 300),
  };
}

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [
      { provide: HikeRoutingService, useValue: { plan } },
      { provide: TourPoiSearchService, useValue: { search: vi.fn() } },
      { provide: WeatherService, useValue: { getDetailed: vi.fn() } },
    ],
  });
  stops = t.get(TourStopsMcp);
  hikes = t.get(HikePlanMcp);
});
beforeEach(() => {
  resetTestDb(db);
  plan.mockReset().mockImplementation(async (_userId, _tripId, request) => routed(request));
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

const WAYPOINTS = [
  { lat: 47.5, lng: 11.1, name: 'Car park' },
  { lat: 47.505, lng: 11.1, name: 'Alm' },
  { lat: 47.51, lng: 11.1, name: 'Summit' },
];
const SPRING = { lat: 47.507, lng: 11.1, name: 'Spring', poi_category: 'drinking_water' as const };

async function fixture() {
  const { user } = await makeUser(orm());
  const { user: outsider } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const hike = read(
    await hikes.createHike({ tripId: trip.id, name: 'Herzogstand', waypoints: WAYPOINTS }, ctx(user.id)),
  );
  return { user, outsider, trip, placeId: hike.tour.place_id as number };
}

describe('TourStopsMcp', () => {
  it('TOUR-STOPS-MCP-001: both tools write on the Tours addon, in the trips group', async () => {
    const options = (method: string) => {
      const entry = getEntry(TourStopsMcp as unknown as ClassRef, method);
      if (!entry || entry.kind !== 'tool') throw new Error(`${method} is no MCP tool`);
      return entry.options;
    };
    const tools = ['insertTourStop', 'removeTourStop'].map(options);
    expect(tools.map((tool) => [tool.name, tool.annotations?.readOnlyHint, tool.access])).toEqual([
      ['insert_tour_stop', false, { group: 'trips', mode: 'write' }],
      ['remove_tour_stop', false, { group: 'trips', mode: 'write' }],
    ]);
    expect(tools[0].description).toContain('after_key');
    const isAddonEnabled = vi.fn(async (id: string) => id === 'tours');
    const gated = await Promise.all(tools.map((tool) => tool.when?.(ctx(1), { addons: { isAddonEnabled } })));
    expect(gated).toEqual([true, true]);
  });

  it('TOUR-STOPS-MCP-002: takes a place in after the last point before it, plans the hike anew and raises its revision', async () => {
    const f = await fixture();
    plan.mockClear();
    const answer = read(
      await stops.insertTourStop(
        { tripId: f.trip.id, placeId: f.placeId, expected_revision: 1, stop: SPRING },
        ctx(f.user.id),
      ),
    );
    expect(plan).toHaveBeenCalledTimes(1);
    expect(plan.mock.calls[0]?.[2].waypoints.map((point) => point.lat)).toEqual([47.5, 47.505, 47.507, 47.51]);
    expect(answer.tour).toMatchObject({ place_id: f.placeId, tour_type: 'hike', revision: 2 });
    expect(answer.stop).toMatchObject({ name: 'Spring', after_name: 'Alm' });
    expect(typeof answer.stop.key).toBe('string');
    expect(await countRows(orm(), TourWaypoints, { place: f.placeId })).toBe(4);
  });

  it('TOUR-STOPS-MCP-003: takes the stop out again by its key, back to the points it had', async () => {
    const f = await fixture();
    const own = ctx(f.user.id);
    const inserted = read(
      await stops.insertTourStop({ tripId: f.trip.id, placeId: f.placeId, expected_revision: 1, stop: SPRING }, own),
    );
    const removed = read(
      await stops.removeTourStop(
        { tripId: f.trip.id, placeId: f.placeId, expected_revision: 2, key: inserted.stop.key },
        own,
      ),
    );
    expect(removed.tour.revision).toBe(3);
    expect(removed.removed).toMatchObject({ key: inserted.stop.key, name: 'Spring', lat: 47.507 });
    expect(await countRows(orm(), TourWaypoints, { place: f.placeId })).toBe(3);
  });

  it('TOUR-STOPS-MCP-004: a stale revision is refused and the hike stays as it was', async () => {
    const f = await fixture();
    await expect(
      stops.insertTourStop(
        { tripId: f.trip.id, placeId: f.placeId, expected_revision: 4, stop: SPRING },
        ctx(f.user.id),
      ),
    ).rejects.toThrow('This tour was changed in the meantime');
    expect((await findRow(orm(), Tours, { place: f.placeId }))?.revision).toBe(1);
  });

  it('TOUR-STOPS-MCP-005: an outsider is refused, and a member without place_edit, as REST refuses them', async () => {
    const f = await fixture();
    const request = { tripId: f.trip.id, placeId: f.placeId, expected_revision: 1, stop: SPRING };
    expect(read(await stops.insertTourStop(request, ctx(f.outsider.id)))).toEqual({
      error: 'Trip not found or access denied.',
    });
    const denied = vi.spyOn(t.get(McpToolGuardsService), 'hasTripPermission').mockResolvedValue(false);
    expect((await stops.insertTourStop(request, ctx(f.user.id))).isError).toBe(true);
    const removal = { tripId: f.trip.id, placeId: f.placeId, expected_revision: 1, key: 'abcdef' };
    expect((await stops.removeTourStop(removal, ctx(f.user.id))).isError).toBe(true);
    expect(denied).toHaveBeenCalledWith('place_edit', f.trip.id, f.user.id);
    denied.mockRestore();
    expect(await countRows(orm(), TourWaypoints, { place: f.placeId })).toBe(3);
  });
});

describe('TourStopsMcp: the saved points a stop goes in among', () => {
  /** A hike as the planner saves one: its line through its points, each point keyed. */
  async function savedHike(tripId: number, points: Parameters<typeof addTourWaypoints>[2]): Promise<number> {
    const place = await makePlace(orm(), tripId, {
      name: 'Hut to hut',
      route_geometry: JSON.stringify(points.map(({ lat, lng }) => [lat, lng, 800])),
    });
    await makeTour(orm(), place.id, { max_hiking_difficulty: 2 });
    await addTourWaypoints(orm(), place.id, points);
    return place.id;
  }

  async function member() {
    const { user } = await makeUser(orm());
    return { own: ctx(user.id), trip: await makeTrip(orm(), user.id) };
  }

  it('TOUR-STOPS-MCP-006: a shaping point stays one when a stop goes in and when it is taken out again', async () => {
    const { own, trip } = await member();
    const placeId = await savedHike(trip.id, [
      { lat: 47.5, lng: 11.1, station_key: 'stop-start01', name: 'Car park' },
      { lat: 47.505, lng: 11.1, station_key: 'stop-shape01', shaping: 1 },
      { lat: 47.51, lng: 11.1, station_key: 'stop-summit1', name: 'Summit' },
    ]);
    const shaping = async () =>
      (await findRow(orm(), TourWaypoints, { place: placeId, station_key: 'stop-shape01' }))?.shaping;
    const inserted = read(
      await stops.insertTourStop({ tripId: trip.id, placeId, expected_revision: 1, stop: SPRING }, own),
    );
    expect(await countRows(orm(), TourWaypoints, { place: placeId })).toBe(4);
    expect(await shaping()).toBe(1);
    await stops.removeTourStop({ tripId: trip.id, placeId, expected_revision: 2, key: inserted.stop.key }, own);
    expect(await countRows(orm(), TourWaypoints, { place: placeId })).toBe(3);
    expect(await shaping()).toBe(1);
  });

  it('TOUR-STOPS-MCP-007: a stop just before the stop a stage starts at leaves that stage its key, its link and its day', async () => {
    const { own, trip } = await member();
    const hut = await makePlace(orm(), trip.id, { name: 'Herzogstandhaus', lat: 47.51, lng: 11.1 });
    const placeId = await savedHike(trip.id, [
      { lat: 47.5, lng: 11.1, station_key: 'stop-start01', name: 'Car park' },
      { lat: 47.51, lng: 11.1, station_key: 'stop-hut0001', name: 'Hut', stage_end: 1, linkedPlace: hut.id },
      { lat: 47.52, lng: 11.1, station_key: 'stop-end0001', name: 'Summit' },
    ]);
    const first = await makeDay(orm(), trip.id, { date: '2027-07-01' });
    const second = await makeDay(orm(), trip.id, { date: '2027-07-02' });
    await makeDayAssignment(orm(), first.id, placeId, { tour_stage_key: 'stop-start01' });
    await makeDayAssignment(orm(), second.id, placeId, { tour_stage_key: 'stop-hut0001' });

    // A spring about 14 m before the hut along the way: it goes in after the start.
    const spring = { lat: 47.50987, lng: 11.1, name: 'Spring', poi_category: 'drinking_water' as const };
    const answer = read(
      await stops.insertTourStop({ tripId: trip.id, placeId, expected_revision: 1, stop: spring }, own),
    );
    expect(answer.stop.after_key).toBe('stop-start01');
    expect(answer.stop.key).not.toBe('stop-hut0001');
    const { waypoints } = await t.get(ToursService).getTour(String(trip.id), String(placeId));
    expect(waypoints.map((point) => [point.name, point.key === 'stop-hut0001', point.linked_place_id ?? null])).toEqual(
      [
        ['Car park', false, null],
        ['Spring', false, null],
        ['Hut', true, hut.id],
        ['Summit', false, null],
      ],
    );
    expect(await countRows(orm(), DayAssignments, { place: placeId })).toBe(2);
  });
});
