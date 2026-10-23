/**
 * CityWalkMcp (CW-11): a city walk prepared from a traveller's briefing. The
 * proposal reads the trip's day and places, searches the places of the themes
 * through the map search and plans the way on foot with the road trip's
 * router, both stubs here, and writes nothing; the confirmed walk is created
 * through ToursService.createTour, the creation the planner's save uses, with
 * the way the router planned. The suite takes its subject from the container
 * over a snapshot test db and seeds through the ORM factories.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import { TourTypes } from '../../../src/db/entities/TourTypes.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { RoadtripRouterService } from '../../../src/nest/roadtrip/roadtrip-router.service';
import { CityWalkMcp } from '../../../src/nest/tours/city-walk.mcp';
import { ToursMcp } from '../../../src/nest/tours/tours.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow, findRows, updateRows } from '../../helpers/factories/rows';
import { makeTour } from '../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { MikroORM } from '@mikro-orm/core';
import {
  stationKeySchema,
  TOUR_DISPLAY_LINE_POINTS,
  type CityWalkBriefingRequest,
  type CityWalkStation,
} from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const poisAlong = vi.fn();
const route = vi.fn();
let t: TestModule;
let mcp: CityWalkMcp;
const orm = () => t.get(MikroORM);

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [ToursModule],
    overrides: [
      { provide: MapsService, useValue: { poisAlong } },
      { provide: RoadtripRouterService, useValue: { route } },
    ],
  });
  mcp = t.get(CityWalkMcp);
});
beforeEach(() => {
  resetTestDb(db);
  poisAlong.mockReset();
  // Unless a test says otherwise, the router gives no way and the estimates stand.
  route.mockReset().mockRejectedValue(new Error('Routing provider returned 503'));
  t.realtime.broadcastMock.mockReset();
});
afterAll(async () => {
  await t.close();
  db.close();
});

const ctx = (userId: number) => ({ userId }) as McpContext;

/** The JSON a tool answered, or the error text it refused with. */
function read(result: { content: Array<{ type: string; text: string }>; isError?: boolean }) {
  const text = result.content[0]?.text ?? '';
  return result.isError ? { error: text } : JSON.parse(text);
}

/** Six days from Monday a place's own hours, closed on Sunday, or open on Sunday morning only. */
const week = (sunday: { closed: boolean; open?: string; close?: string }) =>
  JSON.stringify([...Array.from({ length: 6 }, () => ({ closed: false, open: '09:00', close: '17:00' })), sunday]);

function mapsPoi(id: string, name: string, lat: number, category: string, opening_hours: string | null = null) {
  return {
    osm_id: id,
    name,
    lat,
    lng: 11.0004,
    category,
    poi_type: `tourism=${category}`,
    address: null,
    website: null,
    phone: null,
    opening_hours,
    cuisine: null,
    brand: null,
    brand_wikidata: null,
    charging: null,
    source: 'openstreetmap',
  };
}

/**
 * A trip with a Sunday and its places: a bakery open on Sunday morning, a
 * museum closed on Sundays, a café for lunch, a place without a position and a
 * tour; another trip with a day and a place of its own.
 */
async function fixture() {
  const { user } = await makeUser(orm());
  const { user: outsider } = await makeUser(orm());
  const trip = await makeTrip(orm(), user.id);
  const other = await makeTrip(orm(), user.id);
  const sunday = await makeDay(orm(), trip.id, { day_number: 1, date: '2026-07-12' });
  const otherDay = await makeDay(orm(), other.id, { day_number: 1, date: '2026-07-12' });
  const bakery = await makePlace(orm(), trip.id, {
    name: 'Bakery',
    lat: 48.003,
    lng: 11,
    opening_hours: week({ closed: false, open: '08:00', close: '12:00' }),
  });
  const museum = await makePlace(orm(), trip.id, {
    name: 'Museum',
    lat: 48.0135,
    lng: 11,
    opening_hours: week({ closed: true }),
  });
  const cafe = await makePlace(orm(), trip.id, { name: 'Cafe', lat: 48.018, lng: 11 });
  const nowhere = await makePlace(orm(), trip.id, { name: 'Somewhere', lat: null, lng: null });
  const ridge = await makePlace(orm(), trip.id, { name: 'Ridge' });
  await makeTour(orm(), ridge.id);
  const foreign = await makePlace(orm(), other.id, { name: 'Foreign' });
  return { user, outsider, trip, other, sunday, otherDay, bakery, museum, cafe, nowhere, ridge, foreign };
}

type Fixture = Awaited<ReturnType<typeof fixture>>;

/** Sunday from 10:00 to 13:00 from the hotel: the cathedral wished for, two places of the trip and lunch at 11:30. */
const briefingOf = (f: Fixture, over: Partial<CityWalkBriefingRequest> = {}): CityWalkBriefingRequest => ({
  start: { name: 'Hotel', lat: 48, lng: 11 },
  day_id: f.sunday.id,
  start_time: '10:00',
  end_time: '13:00',
  themes: ['culture'],
  wished: [{ name: 'Cathedral', lat: 48.009, lng: 11, stay_minutes: 30 }],
  trip_places: [{ place_id: f.bakery.id, stay_minutes: 10 }, { place_id: f.museum.id }],
  appointments: [{ name: 'Lunch', lat: 48.018, lng: 11, time: '11:30', stay_minutes: 60, place_id: f.cafe.id }],
  ...over,
});

/** The rows a proposal must leave alone. */
const written = async () => [
  await countRows(orm(), Places, {}),
  await countRows(orm(), Tours, {}),
  await countRows(orm(), TourWaypoints, {}),
];

describe('CityWalkMcp (CW-11)', () => {
  it('CWALK-MCP-001: propose_city_walk orders the stations with their sources, times and hours, and writes nothing', async () => {
    const f = await fixture();
    poisAlong.mockResolvedValue({
      pois: [
        mapsPoi('node:1', 'Old museum', 48.0045, 'museum_gallery', 'Mo-Su 09:00-18:00'),
        mapsPoi('node:2', '', 48.006, 'sights'),
        mapsPoi('node:3', 'Town gate', 48.0075, 'sights'),
      ],
      failed: [],
      partial: false,
      truncated: false,
      capped: false,
    });
    const before = await written();
    const proposal = read(await mcp.proposeCityWalk({ tripId: f.trip.id, ...briefingOf(f) }, ctx(f.user.id)));

    expect(proposal.date).toBe('2026-07-12');
    expect(proposal.stations.map((s: { name: string; source: string }) => [s.name, s.source])).toEqual([
      ['Hotel', 'start'],
      ['Bakery', 'trip_place'],
      ['Old museum', 'theme'],
      ['Town gate', 'theme'],
      ['Cathedral', 'wished'],
      ['Lunch', 'appointment'],
    ]);
    const [, bakery, oldMuseum, , cathedral, lunch] = proposal.stations;
    expect(bakery).toMatchObject({
      place_id: f.bakery.id,
      stay_minutes: 10,
      arrival_is_earliest: false,
      hours: { kind: 'open', source: 'place', window: { from: '08:00', to: '12:00' } },
    });
    expect(oldMuseum).toMatchObject({
      stay_minutes: null,
      leave: null,
      importance: 'optional',
      found: { theme: 'culture', category: 'museum', found_in: 'openstreetmap', poi_id: 'node:1' },
      hours: { kind: 'open', source: 'osm' },
    });
    expect(cathedral).toMatchObject({ arrival_is_earliest: true, importance: 'must', hours: { kind: 'unknown' } });
    expect(lunch).toMatchObject({
      appointment_time: '11:30',
      arrival: '11:30',
      protected: true,
      place_id: f.cafe.id,
      conflicts: [],
    });
    expect(proposal.left_out).toEqual([
      { name: 'Museum', source: 'trip_place', place_id: f.museum.id, poi_id: null, reason: 'closed_all_day' },
    ]);
    expect(proposal.totals).toMatchObject({ stays_unknown: 2, total_complete: false, ends_at: '12:30' });
    expect(proposal.searched).toEqual({
      categories: ['museum', 'sights'],
      categories_not_searched: [],
      corridor_m: 1000,
      found: 3,
      unavailable: [],
      partial: false,
      capped: false,
      truncated: false,
    });
    expect(proposal.estimate).toEqual({
      kind: 'straight_line',
      street_factor: 1.3,
      pace_kmh: 4.5,
      why: 'router_unavailable',
      position: null,
    });
    expect(JSON.stringify(proposal)).not.toContain('route_geometry');
    // Searched along the traveller's own points: the start, the wish, the trip places and the appointment.
    expect(poisAlong).toHaveBeenCalledWith(
      ['museum_gallery', 'sights'],
      [
        { lat: 48, lng: 11 },
        { lat: 48.009, lng: 11 },
        { lat: 48.003, lng: 11 },
        { lat: 48.0135, lng: 11 },
        { lat: 48.018, lng: 11 },
      ],
      1000,
      undefined,
      30,
    );
    expect(await written()).toEqual(before);
    expect(t.realtime.broadcastMock).not.toHaveBeenCalled();
  });

  it('CWALK-MCP-002: a proposal is refused to an outsider, for another trip’s day and for a frame that runs backwards; a place it cannot use is named', async () => {
    const f = await fixture();
    expect(read(await mcp.proposeCityWalk({ tripId: f.trip.id, ...briefingOf(f) }, ctx(f.outsider.id)))).toEqual({
      error: 'Trip not found or access denied.',
    });
    // The registry answers a DomainError with its text; called directly, the tool lets it through.
    await expect(
      mcp.proposeCityWalk({ tripId: f.trip.id, ...briefingOf(f, { day_id: f.otherDay.id }) }, ctx(f.user.id)),
    ).rejects.toThrow('Day not found');
    await expect(
      mcp.proposeCityWalk(
        { tripId: f.trip.id, ...briefingOf(f, { start_time: '14:00', end_time: '13:00' }) },
        ctx(f.user.id),
      ),
    ).rejects.toThrow('end_time must be after start_time, both HH:MM on one day');

    const briefing = briefingOf(f, {
      day_id: undefined,
      themes: undefined,
      theme_places_max: 0,
      wished: undefined,
      appointments: undefined,
      trip_places: [{ place_id: f.foreign.id }, { place_id: f.ridge.id }, { place_id: f.nowhere.id }],
      end: { lat: 48.001, lng: 11 },
    });
    const proposal = read(await mcp.proposeCityWalk({ tripId: f.trip.id, ...briefing }, ctx(f.user.id)));
    expect(poisAlong).not.toHaveBeenCalled();
    expect(proposal).toMatchObject({ date: null, searched: null, can_create: true });
    expect(proposal.left_out).toEqual([
      { name: null, source: 'trip_place', place_id: f.foreign.id, poi_id: null, reason: 'not_in_trip' },
      { name: 'Ridge', source: 'trip_place', place_id: f.ridge.id, poi_id: null, reason: 'is_tour' },
      { name: 'Somewhere', source: 'trip_place', place_id: f.nowhere.id, poi_id: null, reason: 'no_position' },
    ]);
    expect(proposal.stations.map((s: { source: string; hours: unknown }) => [s.source, s.hours])).toEqual([
      ['start', null],
      ['end', null],
    ]);
  });

  it('CWALK-MCP-006: a start and a frame alone search around the start for a bit of everything, and an appointment needs no place', async () => {
    const f = await fixture();
    poisAlong.mockResolvedValue({ pois: [], failed: ['market'], partial: true, truncated: false, capped: false });
    const bare = { start: { lat: 48, lng: 11 }, start_time: '10:00', end_time: '12:00' };
    const alone = read(await mcp.proposeCityWalk({ tripId: f.trip.id, ...bare }, ctx(f.user.id)));
    expect(poisAlong).toHaveBeenCalledWith(
      ['sights', 'museum_gallery', 'park', 'viewpoint', 'cafe', 'market'],
      [
        { lat: 48, lng: 11 },
        { lat: 48, lng: 11 },
      ],
      1000,
      undefined,
      30,
    );
    expect(alone).toMatchObject({
      can_create: false,
      left_out: [],
      searched: { categories_not_searched: [], unavailable: ['market'], partial: true },
      totals: { walk_minutes: 0, total_complete: true, ends_at: '10:00' },
    });

    const withTickets = read(
      await mcp.proposeCityWalk(
        { tripId: f.trip.id, ...bare, appointments: [{ name: 'Tickets', lat: 48.009, lng: 11, time: '11:00' }] },
        ctx(f.user.id),
      ),
    );
    expect(withTickets.stations[1]).toMatchObject({
      name: 'Tickets',
      place_id: null,
      stay_minutes: null,
      protected: true,
    });
    expect(withTickets.stations_for_create[1]).toMatchObject({ linked_place_id: null, importance: 'must' });
  });

  it('CWALK-MCP-003: create_city_walk saves the confirmed stations the way the planner saves one, without a line when the router gives none', async () => {
    const f = await fixture();
    poisAlong.mockResolvedValue({ pois: [], failed: [], partial: false, truncated: false, capped: false });
    const proposal = read(await mcp.proposeCityWalk({ tripId: f.trip.id, ...briefingOf(f) }, ctx(f.user.id)));
    const stations: CityWalkStation[] = proposal.stations_for_create;

    const created = read(
      await mcp.createCityWalk(
        { tripId: f.trip.id, name: 'Old town', description: 'Sunday walk', stations },
        ctx(f.user.id),
      ),
    );
    expect(created.tour).toMatchObject({
      name: 'Old town',
      description: 'Sunday walk',
      tour_type: 'walk',
      distance: null,
      elevation_gain: null,
      duration: null,
      station_count: 4,
      route_pending: true,
      has_waypoints: true,
    });
    expect(created.foot_way).toEqual({ planned: false, why: 'router_unavailable', position: null });
    expect(
      created.waypoints.map((p: { role: string; sequence: number; name: string }) => [p.role, p.sequence, p.name]),
    ).toEqual([
      ['start', 0, 'Hotel'],
      ['via', 1, 'Bakery'],
      ['via', 2, 'Cathedral'],
      ['end', 3, 'Lunch'],
    ]);
    expect(created.waypoints.every((p: { key: string }) => stationKeySchema.safeParse(p.key).success)).toBe(true);
    expect(created.waypoints[1]).toMatchObject({ stay_minutes: 10, linked_place_id: f.bakery.id });
    expect(created.waypoints[2]).toMatchObject({ stay_minutes: 30, importance: 'must' });
    expect(created.waypoints[3]).toMatchObject({ importance: 'must', protected: true, linked_place_id: f.cafe.id });

    const placeId = created.tour.place_id;
    const place = await findRow(orm(), Places, { id: placeId });
    expect([place?.route_geometry, place?.lat, place?.lng]).toEqual([null, 48, 11]);
    const tour = await findRow(orm(), Tours, { place: placeId });
    expect([tour?.distance, tour?.elevation_gain, tour?.elevation_loss, tour?.duration]).toEqual([
      null,
      null,
      null,
      null,
    ]);
    expect(await countRows(orm(), TourWaypoints, { place: placeId })).toBe(4);
    const events = t.realtime.broadcastMock.mock.calls.map(([tripId, event]) => [tripId, event]);
    expect(events).toEqual([
      [String(f.trip.id), 'tours:changed'],
      [String(f.trip.id), 'place:created'],
    ]);

    // The tours list says the walk waits for its way.
    const listed = read(await t.get(ToursMcp).listTours({ tripId: f.trip.id }, ctx(f.user.id))).tours;
    expect(listed.find((item: { place_id: number }) => item.place_id === placeId)).toMatchObject({
      route_pending: true,
      station_count: 4,
    });
  });

  it('CWALK-MCP-004: create_city_walk refuses without place_edit, a link to a tour and a switched-off walk; a link of another trip is dropped', async () => {
    const f = await fixture();
    const stations: CityWalkStation[] = [
      { lat: 48, lng: 11, name: 'Hotel' },
      { lat: 48.009, lng: 11, name: 'Cathedral', linked_place_id: f.foreign.id },
    ];
    const before = await written();
    expect(read(await mcp.createCityWalk({ tripId: f.trip.id, name: 'Walk', stations }, ctx(f.outsider.id)))).toEqual({
      error: 'Trip not found or access denied.',
    });
    const denied = vi.spyOn(t.get(McpToolGuardsService), 'hasTripPermission').mockResolvedValue(false);
    try {
      const refused = await mcp.createCityWalk({ tripId: f.trip.id, name: 'Walk', stations }, ctx(f.user.id));
      expect(refused.isError).toBe(true);
      expect(denied).toHaveBeenCalledWith('place_edit', f.trip.id, f.user.id);
    } finally {
      denied.mockRestore();
    }
    const toTour = [stations[0], { ...stations[1], linked_place_id: f.ridge.id }] as CityWalkStation[];
    await expect(
      mcp.createCityWalk({ tripId: f.trip.id, name: 'Walk', stations: toTour }, ctx(f.user.id)),
    ).rejects.toThrow('A waypoint cannot stand for a tour');
    await updateRows(orm(), TourTypes, { key: 'walk' }, { enabled: 0 });
    try {
      await expect(mcp.createCityWalk({ tripId: f.trip.id, name: 'Walk', stations }, ctx(f.user.id))).rejects.toThrow(
        'Tour type is not available',
      );
    } finally {
      await updateRows(orm(), TourTypes, { key: 'walk' }, { enabled: 1 });
    }
    expect(await written()).toEqual(before);

    const created = read(await mcp.createCityWalk({ tripId: f.trip.id, name: 'Walk', stations }, ctx(f.user.id)));
    const stored = await findRows(orm(), TourWaypoints, { place: created.tour.place_id }, { sequence: 'asc' });
    expect(stored.map((point) => point.linked_place_id ?? null)).toEqual([null, null]);
  });

  it('CWALK-MCP-007: the proposal and the creation take the way the router planned on foot; a station off every way leaves it unplanned', async () => {
    const f = await fixture();
    const legs = [
      { distance: 1120.4, duration: 840 },
      { distance: 1060.2, duration: 790 },
    ];
    /** The router's way through the points it is asked for, each moved onto a way by `moved` metres. */
    const answer =
      (moved: number[]) =>
      async (_userId: number, _tripId: number, _dayId: number, points: Array<{ lat: number; lng: number }>) => ({
        leg: { line: points.map((point): [number, number] => [point.lat, point.lng]) },
        parts: legs,
        snapped: moved.map((meters) => ({ meters })),
        avoidMissed: [],
      });
    route.mockImplementation(answer([3, 8, 5]));
    const briefing = briefingOf(f, {
      day_id: undefined,
      theme_places_max: 0,
      trip_places: undefined,
      appointments: undefined,
      end: { name: 'Station', lat: 48.018, lng: 11 },
    });
    const proposal = read(await mcp.proposeCityWalk({ tripId: f.trip.id, ...briefing }, ctx(f.user.id)));
    const points = [
      { lat: 48, lng: 11 },
      { lat: 48.009, lng: 11 },
      { lat: 48.018, lng: 11 },
    ];
    expect(route).toHaveBeenCalledWith(f.user.id, f.trip.id, 0, points, 'walking', [], { footOnly: true });
    expect(proposal.estimate).toEqual({ kind: 'routed', profile: 'walking' });
    expect(
      proposal.stations.map((s: { name: string; arrival: string; walk_from_previous: unknown }) => [
        s.name,
        s.arrival,
        s.walk_from_previous,
      ]),
    ).toEqual([
      ['Hotel', '10:00', null],
      ['Cathedral', '10:14', { metres: 1120, minutes: 14 }],
      ['Station', '10:58', { metres: 1060, minutes: 14 }],
    ]);
    expect(proposal.totals).toMatchObject({ walk_minutes: 28, walk_m: 2180, total_complete: true });

    const created = read(
      await mcp.createCityWalk(
        { tripId: f.trip.id, name: 'Cathedral walk', stations: proposal.stations_for_create },
        ctx(f.user.id),
      ),
    );
    expect(route).toHaveBeenLastCalledWith(f.user.id, f.trip.id, 0, points, 'walking', [], { footOnly: true });
    expect(created.foot_way).toEqual({ planned: true });
    expect(created.tour).toMatchObject({ route_pending: false, duration: 27, elevation_gain: null, station_count: 3 });
    expect(created.tour.distance).toBeCloseTo(2.0, 1);
    const place = await findRow(orm(), Places, { id: created.tour.place_id });
    expect(JSON.parse(place?.route_geometry ?? 'null')).toEqual(points.map((point) => [point.lat, point.lng]));

    // The router moved the cathedral 900 metres onto a way: no way on foot reaches it, and the walk waits for its way.
    route.mockImplementation(answer([3, 900, 5]));
    const offTheWay = read(
      await mcp.createCityWalk(
        { tripId: f.trip.id, name: 'Cathedral walk', stations: proposal.stations_for_create },
        ctx(f.user.id),
      ),
    );
    expect(offTheWay.foot_way).toEqual({ planned: false, why: 'station_off_the_way', position: 2 });
    expect(offTheWay.tour).toMatchObject({ route_pending: true, distance: null, duration: null });
  });

  it('CWALK-MCP-008: adds the way on foot for drawing only when asked, thinned to what a card draws, and none without a way', async () => {
    const f = await fixture();
    // A way of a thousand points from the hotel to the station.
    const line = Array.from({ length: 1000 }, (_, index): [number, number] => [48 + index * 0.000018, 11]);
    route.mockResolvedValue({
      leg: { line },
      parts: [
        { distance: 1000, duration: 750 },
        { distance: 1000, duration: 750 },
      ],
      snapped: [{ meters: 2 }, { meters: 2 }, { meters: 2 }],
      avoidMissed: [],
    });
    const briefing = briefingOf(f, {
      day_id: undefined,
      theme_places_max: 0,
      trip_places: undefined,
      appointments: undefined,
      end: { name: 'Station', lat: 48.018, lng: 11 },
    });
    const drawn = read(
      await mcp.proposeCityWalk({ tripId: f.trip.id, ...briefing, include_geometry: true }, ctx(f.user.id)),
    );
    expect(drawn.estimate).toEqual({ kind: 'routed', profile: 'walking' });
    expect(drawn.line_geometry).toHaveLength(TOUR_DISPLAY_LINE_POINTS);
    expect(drawn.line_geometry[0]).toEqual(line[0]);
    expect(drawn.line_geometry.at(-1)).toEqual(line.at(-1));

    const plain = read(await mcp.proposeCityWalk({ tripId: f.trip.id, ...briefing }, ctx(f.user.id)));
    expect(plain).not.toHaveProperty('line_geometry');
    expect(plain.stations).toEqual(drawn.stations);

    route.mockRejectedValue(new Error('Routing provider returned 503'));
    const unrouted = read(
      await mcp.proposeCityWalk({ tripId: f.trip.id, ...briefing, include_geometry: true }, ctx(f.user.id)),
    );
    expect(unrouted.estimate.kind).toBe('straight_line');
    expect(unrouted).not.toHaveProperty('line_geometry');
  });

  it('CWALK-MCP-005: the proposal reads only and the creation writes, both on the Tours addon', async () => {
    const options = (method: string) => {
      const entry = getEntry(CityWalkMcp as unknown as ClassRef, method);
      if (!entry || entry.kind !== 'tool') throw new Error(`${method} is no MCP tool`);
      return entry.options;
    };
    const propose = options('proposeCityWalk');
    const create = options('createCityWalk');
    expect([propose.name, propose.annotations?.readOnlyHint, propose.access]).toEqual([
      'propose_city_walk',
      true,
      { group: 'trips', mode: 'read' },
    ]);
    expect([create.name, create.annotations?.readOnlyHint, create.access]).toEqual([
      'create_city_walk',
      false,
      { group: 'trips', mode: 'write' },
    ]);
    expect(propose.description).toContain('stations_for_create');
    expect(create.description).toContain('route_pending');
    const isAddonEnabled = vi.fn(async (id: string) => id === 'tours');
    const gated = await Promise.all(
      [propose, create].map((tool) => tool.when?.(ctx(1), { addons: { isAddonEnabled } })),
    );
    expect(gated).toEqual([true, true]);
    expect(isAddonEnabled).toHaveBeenCalledWith('tours');
  });
});
