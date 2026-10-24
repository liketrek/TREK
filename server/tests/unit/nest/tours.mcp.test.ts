/**
 * ToursMcp (P2D-MCP-01): the saved tours of a trip, read only, over the same
 * services the REST list, detail and city walk visits (CW-09) use. The suite
 * takes its subject from the container over a snapshot test db; the addon gate
 * of the tools is the registry's and is covered with the other addon-gated tools.
 */
import { Places } from '../../../src/db/entities/Places.entity';
import { TourStationVisits } from '../../../src/db/entities/TourStationVisits.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { Tours } from '../../../src/db/entities/Tours.entity';
import type { McpContext } from '../../../src/nest-mcp';
import { getEntry, type ClassRef } from '../../../src/nest-mcp/metadata';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { PlacesMcp } from '../../../src/nest/places/places.mcp';
import { TourLibraryMcp } from '../../../src/nest/tours/tour-library.mcp';
import { TOUR_PLAN_LINE_POINTS } from '../../../src/nest/tours/tour-plan-read';
import { TourVisitsService } from '../../../src/nest/tours/tour-visits.service';
import { ToursMcp } from '../../../src/nest/tours/tours.mcp';
import { ToursModule } from '../../../src/nest/tours/tours.module';
import { ToursService } from '../../../src/nest/tours/tours.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import {
  addTripMember,
  createDay,
  createDayAssignment,
  createPlace,
  createTrip,
  createUser,
} from '../../helpers/factories';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow, insertRows, updateRows } from '../../helpers/factories/rows';
import { addTourWaypoints, makeTour, markStationVisit } from '../../helpers/factories/tours';
import { oneByOne } from '../../helpers/one-by-one';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm } from '../../helpers/test-orm';
import { createTour } from '../../helpers/tours-repos';
import { DEFAULT_SKI_ROUTE_OPTIONS } from '@trek/shared';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let mcp: ToursMcp;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [ToursModule] });
  mcp = t.get(ToursMcp);
});
beforeEach(() => resetTestDb(db));
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

function fixture() {
  const { user } = createUser(db);
  const { user: outsider } = createUser(db);
  const { user: member } = createUser(db);
  const trip = createTrip(db, user.id);
  addTripMember(db, trip.id, member.id);
  const day1 = createDay(db, trip.id, { day_number: 1, date: '2026-07-10', title: 'Arrive' });
  const day2 = createDay(db, trip.id, { day_number: 2, date: '2026-07-11' });
  const ridge = createPlace(db, trip.id, { name: 'Ridge' });
  createTour(db, ridge.id, { distance: 8.2, max_hiking_difficulty: 3 });
  const gorge = createPlace(db, trip.id, { name: 'Gorge' });
  createTour(db, gorge.id);
  const cafe = createPlace(db, trip.id, { name: 'Cafe' });
  createDayAssignment(db, day2.id, ridge.id);
  createDayAssignment(db, day1.id, ridge.id);
  createDayAssignment(db, day1.id, cafe.id);
  return { user, outsider, member, trip, day1, day2, ridge, gorge };
}

describe('ToursMcp', () => {
  it('TOURS-MCP-001: list_tours lists the tours of the trip with their days in day order, no other place', async () => {
    const { user, trip, day1, day2, ridge, gorge } = fixture();
    const { tours } = read(await mcp.listTours({ tripId: trip.id }, ctx(user.id)));
    expect(tours.map((tour: { place_id: number }) => tour.place_id).sort()).toEqual([ridge.id, gorge.id].sort());
    const listedRidge = tours.find((tour: { place_id: number }) => tour.place_id === ridge.id);
    expect(listedRidge).toMatchObject({ name: 'Ridge', origin: expect.any(String), max_hiking_difficulty: 3 });
    expect(listedRidge.days).toEqual([
      { day_id: day1.id, day_number: 1, date: '2026-07-10', title: 'Arrive', tour_stage_key: null },
      { day_id: day2.id, day_number: 2, date: '2026-07-11', title: null, tour_stage_key: null },
    ]);
    expect(tours.find((tour: { place_id: number }) => tour.place_id === gorge.id).days).toEqual([]);
  });

  it('TOURS-MCP-002: get_tour_plan reads one tour with its control points, provenance and days, without the track', async () => {
    const { member, trip, ridge } = fixture();
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(member.id)));
    expect(plan.tour).toMatchObject({ place_id: ridge.id, name: 'Ridge' });
    expect(plan.tour.days).toHaveLength(2);
    expect(Array.isArray(plan.waypoints)).toBe(true);
    expect(plan.provenance).toMatchObject({ origin: expect.any(String), source: { kind: expect.any(String) } });
    expect(JSON.stringify(plan)).not.toContain('route_geometry');
  });

  it('TOURS-MCP-003: find_tours_for_day lists only the tours on that day', async () => {
    const { user, trip, day1, day2, ridge } = fixture();
    expect(
      read(await mcp.findToursForDay({ tripId: trip.id, dayId: day1.id }, ctx(user.id))).tours.map(
        (tour: { place_id: number }) => tour.place_id,
      ),
    ).toEqual([ridge.id]);
    expect(read(await mcp.findToursForDay({ tripId: trip.id, dayId: day2.id + 1000 }, ctx(user.id))).tours).toEqual([]);
  });

  it('TOURS-MCP-004: someone outside the trip learns nothing, and a place that is no tour is not found', async () => {
    const { user, outsider, trip, ridge } = fixture();
    for (const result of [
      await mcp.listTours({ tripId: trip.id }, ctx(outsider.id)),
      await mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(outsider.id)),
      await mcp.findToursForDay({ tripId: trip.id, dayId: 1 }, ctx(outsider.id)),
    ]) {
      expect(read(result)).toEqual({ error: 'Trip not found or access denied.' });
    }
    const cafe = createPlace(db, trip.id, { name: 'Plain' });
    expect(read(await mcp.getTourPlan({ tripId: trip.id, placeId: cafe.id }, ctx(user.id)))).toEqual({
      error: 'Tour not found.',
    });
  });

  it('TOURS-MCP-005: a failure other than a missing tour is not passed off as not found', async () => {
    const { user, trip, ridge } = fixture();
    const failure = new Error('database gone');
    const getTour = vi.spyOn(t.get(ToursService), 'getTour').mockRejectedValueOnce(failure);
    try {
      await expect(mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(user.id))).rejects.toBe(failure);
    } finally {
      getTour.mockRestore();
    }
  });

  it('TOURS-MCP-006: export_tour_gpx hands over the saved line as GPX, and only to someone who sees the trip', async () => {
    const { user, member, outsider, trip, ridge, gorge } = fixture();
    const orm = await createTestOrm(db);
    await updateRows(
      orm,
      Places,
      { id: ridge.id },
      {
        route_geometry: JSON.stringify([
          [47, 11, 600],
          [47.01, 11.01, 650],
        ]),
      },
    );
    await orm.close();
    const exported = read(await mcp.exportTourGpx({ tripId: trip.id, placeId: ridge.id }, ctx(member.id)));
    expect(exported.filename).toBe('Ridge.gpx');
    expect(exported.gpx).toContain('<type>hiking</type>');
    expect(exported.gpx.match(/<trkpt /g)).toHaveLength(2);
    // The registry answers a DomainError with its message; called directly, the tool lets it through.
    await expect(mcp.exportTourGpx({ tripId: trip.id, placeId: gorge.id }, ctx(user.id))).rejects.toThrow(
      'This tour has no route to export',
    );
    expect(read(await mcp.exportTourGpx({ tripId: trip.id, placeId: ridge.id }, ctx(outsider.id)))).toEqual({
      error: 'Trip not found or access denied.',
    });
    const cafe = createPlace(db, trip.id, { name: 'Plain' });
    expect(read(await mcp.exportTourGpx({ tripId: trip.id, placeId: cafe.id }, ctx(user.id)))).toEqual({
      error: 'Tour not found.',
    });
  });

  it('TOURS-MCP-007: get_tour_plan names the place a control point stands for (PR1-10)', async () => {
    const { user, trip, ridge } = fixture();
    const hut = createPlace(db, trip.id, { name: 'Hut' });
    const orm = await createTestOrm(db);
    await insertRows(orm, TourWaypoints, [
      { place: ridge.id, lat: 47, lng: 11, role: 'start', sequence: 0, linkedPlace: hut.id },
      { place: ridge.id, lat: 47.1, lng: 11.1, role: 'end', sequence: 1 },
    ]);
    await orm.close();
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(user.id)));
    expect(plan.waypoints[0]).toMatchObject({ linked_place_id: hut.id, linked_place_name: 'Hut' });
    expect(plan.waypoints[1].linked_place_name).toBeUndefined();
  });

  /** CW-09: a city walk on day 1 with three stops, the first visited and the second skipped that day. */
  async function walkFixture() {
    const base = fixture();
    const orm = await createTestOrm(db);
    const walk = await makePlace(orm, base.trip.id, { name: 'Old town' });
    await makeTour(orm, walk.id, { tourTypeRef: 'walk', duration: 80 });
    await addTourWaypoints(orm, walk.id, [
      { lat: 48.1, lng: 11.5, station_key: 'stop-cathedral', name: 'Cathedral', stay_minutes: 30 },
      { lat: 48.11, lng: 11.51, station_key: 'stop-market', stay_minutes: 20 },
      { lat: 48.12, lng: 11.52, station_key: 'stop-park', importance: 'must', opening_hours: 'Mo-Su 09:00-18:00' },
    ]);
    const onDay1 = await makeDayAssignment(orm, base.day1.id, walk.id);
    await markStationVisit(orm, onDay1.id, 'stop-cathedral', 'visited');
    await markStationVisit(orm, onDay1.id, 'stop-market', 'skipped');
    await orm.close();
    return { ...base, walk, onDay1 };
  }

  it('TOURS-MCP-008: get_city_walk_progress reads the stations of a walk with their status that day, and changes nothing', async () => {
    const { member, trip, day1, walk, onDay1 } = await walkFixture();
    const orm = await createTestOrm(db);
    const before = await countRows(orm, TourStationVisits, {});
    const progress = read(
      await mcp.getCityWalkProgress({ tripId: trip.id, placeId: walk.id, dayId: day1.id }, ctx(member.id)),
    );
    expect(progress).toMatchObject({ place_id: walk.id, day_id: day1.id, assignment_id: onDay1.id });
    expect(
      progress.stations.map((station: { name: string | null; status: string }) => [station.name, station.status]),
    ).toEqual([
      ['Cathedral', 'visited'],
      [null, 'skipped'],
      [null, 'planned'],
    ]);
    expect(progress.open).toEqual({ stations: 1, stay_minutes_known: 0, stays_unknown: 1 });
    expect(progress.walking_minutes).toBe(80);
    expect(await countRows(orm, TourStationVisits, {})).toBe(before);
    await orm.close();
  });

  it('TOURS-MCP-009: someone outside the trip learns nothing, and a day without the walk names no walk', async () => {
    const { user, outsider, trip, day1, day2, ridge, walk } = await walkFixture();
    expect(
      read(await mcp.getCityWalkProgress({ tripId: trip.id, placeId: walk.id, dayId: day1.id }, ctx(outsider.id))),
    ).toEqual({ error: 'Trip not found or access denied.' });
    const orm = await createTestOrm(db);
    const cafe = await makePlace(orm, trip.id, { name: 'Plain' });
    await makeDayAssignment(orm, day1.id, cafe.id);
    await orm.close();
    const notThere = [
      { placeId: walk.id, dayId: day2.id },
      { placeId: ridge.id, dayId: day1.id },
      { placeId: cafe.id, dayId: day1.id },
    ];
    const answers = await notThere.reduce<Promise<unknown[]>>(
      async (done, args) => [
        ...(await done),
        read(await mcp.getCityWalkProgress({ tripId: trip.id, ...args }, ctx(user.id))),
      ],
      Promise.resolve([]),
    );
    expect(answers).toEqual(notThere.map(() => ({ error: 'No city walk of this trip is on that day.' })));
  });

  it('TOURS-MCP-033: set_city_walk_visit checks a station off on its day, says what it was, and takes a mark back', async () => {
    const { member, trip, day1, walk, onDay1 } = await walkFixture();
    const at = { tripId: trip.id, placeId: walk.id, dayId: day1.id };
    const marked = read(
      await mcp.setCityWalkVisit({ ...at, stationKey: 'stop-park', status: 'visited' }, ctx(member.id)),
    );
    expect(marked).toMatchObject({
      station_key: 'stop-park',
      name: null,
      previous_status: 'planned',
      status: 'visited',
      walk: { assignment_id: onDay1.id },
    });
    expect(marked.walk.stations.map((station: { status: string }) => station.status)).toEqual([
      'visited',
      'skipped',
      'visited',
    ]);
    const back = read(
      await mcp.setCityWalkVisit({ ...at, stationKey: 'stop-market', status: 'planned' }, ctx(member.id)),
    );
    expect(back).toMatchObject({ name: null, previous_status: 'skipped', status: 'planned' });
    const orm = await createTestOrm(db);
    expect(await countRows(orm, TourStationVisits, { station_key: 'stop-market' })).toBe(0);
    await orm.close();
  });

  it('TOURS-MCP-034: set_city_walk_visit refuses an outsider, a member without day_edit, an unknown station and a day without the walk', async () => {
    const { user, outsider, trip, day1, day2, walk } = await walkFixture();
    const at = { tripId: trip.id, placeId: walk.id, dayId: day1.id, status: 'visited' as const };
    expect(read(await mcp.setCityWalkVisit({ ...at, stationKey: 'stop-park' }, ctx(outsider.id)))).toEqual({
      error: 'Trip not found or access denied.',
    });
    const guards = t.get(McpToolGuardsService);
    const denied = vi.spyOn(guards, 'hasTripPermission').mockResolvedValueOnce(false);
    try {
      expect(read(await mcp.setCityWalkVisit({ ...at, stationKey: 'stop-park' }, ctx(user.id)))).toEqual({
        error: 'You do not have permission to perform this action on this trip.',
      });
      expect(denied).toHaveBeenCalledWith('day_edit', trip.id, user.id);
    } finally {
      denied.mockRestore();
    }
    expect(read(await mcp.setCityWalkVisit({ ...at, stationKey: 'stop-nowhere' }, ctx(user.id))).error).toMatch(
      /no station with that key/,
    );
    expect(read(await mcp.setCityWalkVisit({ ...at, dayId: day2.id, stationKey: 'stop-park' }, ctx(user.id)))).toEqual({
      error: 'No city walk of this trip is on that day.',
    });
  });

  it('TOURS-MCP-010: a failure other than a missing walk is not passed off as no walk', async () => {
    const { user, trip, day1, walk } = await walkFixture();
    const failure = new Error('database gone');
    const progress = vi.spyOn(t.get(TourVisitsService), 'progress').mockRejectedValueOnce(failure);
    try {
      await expect(
        mcp.getCityWalkProgress({ tripId: trip.id, placeId: walk.id, dayId: day1.id }, ctx(user.id)),
      ).rejects.toBe(failure);
    } finally {
      progress.mockRestore();
    }
  });

  it("TOURS-MCP-011: get_tour_plan spells out every field of a city walk's stations, and leaves its other points and a hike as stored", async () => {
    const { user, trip, ridge } = fixture();
    const orm = await createTestOrm(db);
    const walk = await makePlace(orm, trip.id, { name: 'Loop' });
    await makeTour(orm, walk.id, { tourTypeRef: 'walk' });
    await addTourWaypoints(orm, walk.id, [
      {
        lat: 48.1,
        lng: 11.5,
        station_key: 'stop-gate',
        name: 'Gate',
        stay_minutes: 15,
        importance: 'optional',
        protected: 1,
        opening_hours: 'Mo-Su 08:00-20:00',
      },
      { lat: 48.105, lng: 11.505, station_key: 'shape-1', shaping: 1 },
      { lat: 48.11, lng: 11.51, station_key: 'stop-bare' },
      { lat: 48.1, lng: 11.5, station_key: 'stop-back' },
    ]);
    await addTourWaypoints(orm, ridge.id, [
      { lat: 47, lng: 11 },
      { lat: 47.1, lng: 11.1 },
    ]);
    await orm.close();

    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: walk.id }, ctx(user.id)));
    const fields = ['key', 'name', 'stay_minutes', 'importance', 'protected', 'opening_hours'] as const;
    const spelled = (point: Record<string, unknown>) => fields.map((field) => point[field]);
    expect(spelled(plan.waypoints[0])).toEqual(['stop-gate', 'Gate', 15, 'optional', true, 'Mo-Su 08:00-20:00']);
    expect(spelled(plan.waypoints[2])).toEqual(['stop-bare', null, null, null, false, null]);
    // A shaping point and the way back of a loop are no stations: as stored.
    expect('stay_minutes' in plan.waypoints[1] || 'protected' in plan.waypoints[1]).toBe(false);
    expect('stay_minutes' in plan.waypoints[3] || 'protected' in plan.waypoints[3]).toBe(false);
    const hike = read(await mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(user.id)));
    expect(hike.waypoints.some((point: object) => 'stay_minutes' in point || 'protected' in point)).toBe(false);
  });

  it("TOURS-MCP-012: list_tours counts a walk's stations and says while its way waits to be planned", async () => {
    const { user, trip, walk, gorge } = await walkFixture();
    const listed = async () => {
      const { tours } = read(await mcp.listTours({ tripId: trip.id }, ctx(user.id)));
      return new Map(tours.map((tour: { place_id: number }) => [tour.place_id, tour]));
    };
    expect((await listed()).get(walk.id)).toMatchObject({ station_count: 3, route_pending: true });
    // A tour without points has nothing to plan a way between.
    expect((await listed()).get(gorge.id)).toMatchObject({ station_count: null, route_pending: false });
    const orm = await createTestOrm(db);
    await updateRows(
      orm,
      Places,
      { id: walk.id },
      {
        route_geometry: JSON.stringify([
          [48.1, 11.5, 520],
          [48.12, 11.52, 530],
        ]),
      },
    );
    await orm.close();
    expect((await listed()).get(walk.id)).toMatchObject({ station_count: 3, route_pending: false });
  });

  it('TOURS-MCP-013: get_city_walk_progress names each station by its key and gives its opening hours', async () => {
    const { member, trip, day1, walk } = await walkFixture();
    const { stations } = read(
      await mcp.getCityWalkProgress({ tripId: trip.id, placeId: walk.id, dayId: day1.id }, ctx(member.id)),
    );
    expect(
      stations.map((station: { key: string; opening_hours: string | null }) => [station.key, station.opening_hours]),
    ).toEqual([
      ['stop-cathedral', null],
      ['stop-market', null],
      ['stop-park', 'Mo-Su 09:00-18:00'],
    ]);
  });

  it('TOURS-MCP-024: list_tours counts the stages of a multi-day tour and get_tour_plan marks where each ends (MDT-01)', async () => {
    const { user, trip, ridge, gorge } = fixture();
    const orm = await createTestOrm(db);
    await addTourWaypoints(orm, ridge.id, [
      { lat: 47, lng: 11 },
      { lat: 47.05, lng: 11.05, stage_end: 1 },
      { lat: 47.1, lng: 11.1, stage_end: 1 },
      { lat: 47.15, lng: 11.15 },
    ]);
    await orm.close();

    const { tours } = read(await mcp.listTours({ tripId: trip.id }, ctx(user.id)));
    const stages = new Map(
      tours.map((tour: { place_id: number; stage_count: number | null }) => [tour.place_id, tour.stage_count]),
    );
    expect(stages.get(ridge.id)).toBe(3);
    expect(stages.get(gorge.id)).toBeNull();
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(user.id)));
    expect(plan.waypoints.map((point: { stage_end?: boolean }) => point.stage_end === true)).toEqual([
      false,
      true,
      true,
      false,
    ]);
  });

  it('TOURS-MCP-025: list_tours names the stops between the stages and the stage each day holds (MDT-02)', async () => {
    const { user, trip, ridge, day1, day2 } = fixture();
    const orm = await createTestOrm(db);
    await addTourWaypoints(orm, ridge.id, [
      { lat: 47, lng: 11, station_key: 'stop-start' },
      { lat: 47.05, lng: 11.05, station_key: 'stop-hut', stage_end: 1 },
      { lat: 47.1, lng: 11.1, station_key: 'stop-end' },
    ]);
    await orm.close();
    const day3 = createDay(db, trip.id, { day_number: 3 });
    createDayAssignment(db, day3.id, ridge.id, { tour_stage_key: 'stop-hut' });

    const { tours } = read(await mcp.listTours({ tripId: trip.id }, ctx(user.id)));
    const listed = tours.find((tour: { place_id: number }) => tour.place_id === ridge.id);
    expect(listed.stage_stops.map((stop: { key: string }) => stop.key)).toEqual(['stop-start', 'stop-hut', 'stop-end']);
    expect(
      listed.days.map((day: { day_id: number; tour_stage_key: string | null }) => [day.day_id, day.tour_stage_key]),
    ).toEqual([
      [day1.id, null],
      [day2.id, null],
      [day3.id, 'stop-hut'],
    ]);
  });

  it('TOURS-MCP-014: the tools name the station fields, and the deletes ask before a walk takes its protected stations along', () => {
    const description = (ctor: unknown, method: string) => {
      const entry = getEntry(ctor as ClassRef, method);
      if (!entry || entry.kind !== 'tool') throw new Error(`${method} is no MCP tool`);
      return entry.options.description ?? '';
    };
    expect(description(ToursMcp, 'listTours')).toMatch(/station_count.*route_pending/);
    expect(description(ToursMcp, 'listTours')).toContain('stage_count');
    expect(description(ToursMcp, 'getTourPlan')).toContain('stage_end');
    const planFields = ['key', 'stay_minutes', 'importance', 'protected', 'opening_hours', 'visit_status', 'derived'];
    for (const field of planFields) {
      expect(description(ToursMcp, 'getTourPlan')).toContain(field);
    }
    expect(description(ToursMcp, 'getCityWalkProgress')).toMatch(/key .*opening hours/);
    expect(description(ToursMcp, 'searchTourPois')).toContain('route_pending');
    expect(description(ToursMcp, 'searchTourPois')).toMatch(/best known places.*highlight: true/);
    expect(description(ToursMcp, 'searchTourPois')).toContain('a ride, a bike tour');
    expect(description(ToursMcp, 'searchTourPois')).toContain('a ski and winter tour or a city walk');
    // BIK-07: e-bike charging only where OpenStreetMap tags it for bicycles, with what it states.
    expect(description(ToursMcp, 'searchTourPois')).toMatch(/ebike_charging.*bicycle=designated or yes/);
    expect(description(ToursMcp, 'searchTourPois')).toContain('charging: bicycle, sockets');
    expect(description(TourLibraryMcp, 'takeOverTour')).toContain('protection');
    for (const method of ['deletePlace', 'bulkDeletePlaces']) {
      expect(description(PlacesMcp, method)).toContain(
        'protected ones included: name those to the traveller and ask first',
      );
    }
  });

  /** MCP-T01: a hike at revision 4 over a saved line of 450 points, a routed leg, a via ferrata and a free leg. */
  async function legsFixture() {
    const base = fixture();
    const orm = await createTestOrm(db);
    const hike = await makePlace(orm, base.trip.id, { name: 'Crest' });
    await makeTour(orm, hike.id, { revision: 4, distance: 12.5 });
    const line = Array.from({ length: 450 }, (_, index) => [47 + index * 0.0001, 11, 900 + index]);
    await updateRows(orm, Places, { id: hike.id }, { route_geometry: JSON.stringify(line) });
    const ferrata = {
      kind: 'ferrata',
      ref: 'way/77',
      name: 'Iron path',
      geometry: [
        [47.01, 11],
        [47.02, 11],
      ],
    };
    const free = {
      kind: 'free',
      geometry: [
        [47.02, 11],
        [47.02, 11.01],
      ],
    };
    await addTourWaypoints(orm, hike.id, [
      { lat: 47, lng: 11, station_key: 'pt-start' },
      { lat: 47.01, lng: 11, station_key: 'pt-wall', fixed_leg: JSON.stringify(ferrata) },
      { lat: 47.02, lng: 11, station_key: 'pt-lake', fixed_leg: JSON.stringify(free) },
      { lat: 47.02, lng: 11.01, station_key: 'pt-end' },
    ]);
    await orm.close();
    return { ...base, hike };
  }

  it('TOURS-MCP-015: get_tour_plan answers each leg with how its line came to be, a fixed one with its own length', async () => {
    const { member, trip, hike } = await legsFixture();
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: hike.id }, ctx(member.id)));
    expect(plan.tour).toMatchObject({ place_id: hike.id, tour_type: 'hike', revision: 4, distance: 12.5 });
    expect(plan.waypoints.map((point: { key: string }) => point.key)).toEqual([
      'pt-start',
      'pt-wall',
      'pt-lake',
      'pt-end',
    ]);
    expect(plan.legs).toEqual([
      expect.objectContaining({ from_key: 'pt-start', to_key: 'pt-wall', kind: 'routed', name: null, length_km: null }),
      expect.objectContaining({ from_sequence: 1, to_sequence: 2, kind: 'ferrata', name: 'Iron path' }),
      expect.objectContaining({ from_key: 'pt-lake', to_key: 'pt-end', kind: 'free', name: null }),
    ]);
    expect(plan.legs[1].length_km).toBeCloseTo(1.11, 1);
    expect(plan.legs[2].length_km).toBeCloseTo(0.76, 1);
    // A hike carries no city walk fields at all.
    expect('run' in plan).toBe(false);
    expect(plan.waypoints.some((point: object) => 'visit_status' in point)).toBe(false);
  });

  it('TOURS-MCP-016: get_tour_plan gives the saved line in brief and names what it worked out, and reading moves no revision', async () => {
    const { user, trip, hike } = await legsFixture();
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: hike.id }, ctx(user.id)));
    expect(plan.line).toMatchObject({ point_count: 450, has_heights: true });
    expect(plan.line.preview).toHaveLength(TOUR_PLAN_LINE_POINTS);
    expect(plan.line.preview[0]).toEqual([47, 11, 900]);
    expect(plan.line.preview.at(-1)).toEqual([47 + 449 * 0.0001, 11, 1349]);
    expect(plan.derived).toEqual(expect.arrayContaining(['legs[].length_km', 'line.preview', 'tour.caution']));
    // Stored facts are never listed as worked out: the points are its own, the distance was saved.
    expect(plan.derived).not.toContain('waypoints');
    expect(plan.derived).not.toContain('tour.distance');
    expect(plan.derived.some((field: string) => field.startsWith('tour.station') || field === 'run.open')).toBe(false);
    const orm = await createTestOrm(db);
    expect((await findRow(orm, Tours, { place: hike.id }))?.revision).toBe(4);
    await orm.close();
  });

  it('TOURS-MCP-017: an import without control points answers the ends of its track as worked out and its leg as track, a tour without a line none', async () => {
    const { user, trip, ridge, gorge } = fixture();
    const orm = await createTestOrm(db);
    const track = [
      [47, 11],
      [47.005, 11.005],
      [47.01, 11.01],
    ];
    await updateRows(orm, Places, { id: ridge.id }, { route_geometry: JSON.stringify(track) });
    await orm.close();
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(user.id)));
    expect(plan.waypoints.map((point: { lat: number; key?: string }) => [point.lat, point.key])).toEqual([
      [47, undefined],
      [47.01, undefined],
    ]);
    expect(plan.legs).toEqual([
      { from_sequence: 0, to_sequence: 1, from_key: null, to_key: null, kind: 'track', name: null, length_km: null },
    ]);
    expect(plan.line).toEqual({ point_count: 3, has_heights: false, preview: track });
    expect(plan.derived).toContain('waypoints');
    const bare = read(await mcp.getTourPlan({ tripId: trip.id, placeId: gorge.id }, ctx(user.id)));
    expect(bare).toMatchObject({ waypoints: [], legs: [], line: null });
    expect(bare.derived).not.toContain('line.preview');
  });

  it('TOURS-MCP-018: a city walk read for one of its days carries the visits of that day, and of no other', async () => {
    const { member, trip, day1, day2, walk, onDay1 } = await walkFixture();
    const orm = await createTestOrm(db);
    await makeDayAssignment(orm, day2.id, walk.id);
    const before = await countRows(orm, TourStationVisits, {});
    const plan = async (dayId?: number) =>
      read(await mcp.getTourPlan({ tripId: trip.id, placeId: walk.id, dayId }, ctx(member.id)));
    const statuses = (answer: { waypoints: Array<{ key: string; visit_status: string | null }> }) =>
      answer.waypoints.map((point) => [point.key, point.visit_status]);

    const first = await plan(day1.id);
    expect(statuses(first)).toEqual([
      ['stop-cathedral', 'visited'],
      ['stop-market', 'skipped'],
      ['stop-park', 'planned'],
    ]);
    expect(first.run).toEqual({
      day_id: day1.id,
      assignment_id: onDay1.id,
      open: { stations: 1, stay_minutes_known: 0, stays_unknown: 1 },
    });
    expect(first.derived).toEqual(expect.arrayContaining(['tour.station_count', 'run.open']));
    // The same walk on another day keeps its own visits: none were made there.
    expect(statuses(await plan(day2.id)).map(([, status]) => status)).toEqual(['planned', 'planned', 'planned']);
    // Without a day no visit is told, rather than the visits of one day passed off as the walk's.
    const undated = await plan();
    expect(undated.run).toBeNull();
    expect(statuses(undated).map(([, status]) => status)).toEqual([null, null, null]);
    expect(undated.derived).not.toContain('run.open');
    expect(await countRows(orm, TourStationVisits, {})).toBe(before);
    await orm.close();
  });

  it('TOURS-MCP-019: a day is read for a city walk only, and only for a day it is on', async () => {
    const { user, trip, day1, day2, ridge, walk } = await walkFixture();
    expect(read(await mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id, dayId: day1.id }, ctx(user.id)))).toEqual({
      error: 'Only a city walk keeps visits for a day: read this tour without dayId.',
    });
    expect(read(await mcp.getTourPlan({ tripId: trip.id, placeId: walk.id, dayId: day2.id }, ctx(user.id)))).toEqual({
      error: 'This city walk is not on that day.',
    });
    const failure = new Error('database gone');
    const progress = vi.spyOn(t.get(TourVisitsService), 'progress').mockRejectedValueOnce(failure);
    try {
      await expect(mcp.getTourPlan({ tripId: trip.id, placeId: walk.id, dayId: day1.id }, ctx(user.id))).rejects.toBe(
        failure,
      );
    } finally {
      progress.mockRestore();
    }
  });

  it('TOURS-MCP-020: list_tours lists snowshoeing as a ski tour, and a hike with no winter label at all (SKI-02)', async () => {
    const { user, trip, ridge, gorge } = fixture();
    const orm = await createTestOrm(db);
    await updateRows(
      orm,
      Tours,
      { place: ridge.id },
      { tourTypeRef: 'ski', max_hiking_difficulty: null, ski_discipline: 'snowshoe' },
    );
    await orm.close();
    const { tours } = read(await mcp.listTours({ tripId: trip.id }, ctx(user.id)));
    const byId = new Map(tours.map((tour: { place_id: number }) => [tour.place_id, tour]));
    expect(byId.get(ridge.id)).toMatchObject({ tour_type: 'ski', ski_discipline: 'snowshoe', ski_technique: null });
    expect(byId.get(gorge.id)).toMatchObject({ tour_type: 'hike' });
    expect(byId.get(gorge.id)).not.toHaveProperty('winter_activity');
    const entry = getEntry(ToursMcp as unknown as ClassRef, 'listTours');
    const description = entry?.kind === 'tool' ? (entry.options.description ?? '') : '';
    expect(description).not.toContain('winter_activity');
    expect(description).toContain('a hike is summer only');
  });

  it('TOURS-MCP-021: list_tours names a run with its profile and pace, and says its time is a plan at that pace only (RUN-01)', async () => {
    const { user, trip, ridge, gorge } = fixture();
    const orm = await createTestOrm(db);
    await updateRows(
      orm,
      Tours,
      { place: ridge.id },
      { tourTypeRef: 'run', max_hiking_difficulty: null, run_profile: 'running', run_pace_seconds_per_km: 360 },
    );
    await orm.close();
    const { tours } = read(await mcp.listTours({ tripId: trip.id }, ctx(user.id)));
    const byId = new Map(tours.map((tour: { place_id: number }) => [tour.place_id, tour]));
    expect(byId.get(ridge.id)).toMatchObject({
      tour_type: 'run',
      run_profile: 'running',
      run_pace_seconds_per_km: 360,
    });
    expect(byId.get(gorge.id)).toMatchObject({ run_profile: null, run_pace_seconds_per_km: null });
    const entry = getEntry(ToursMcp as unknown as ClassRef, 'listTours');
    const description = entry?.kind === 'tool' ? (entry.options.description ?? '') : '';
    expect(description).toMatch(/run_profile: running/);
    expect(description).toContain('no climb, descent or difficulty is in it');
    expect(description).toContain('never a recorded time');
  });

  it('TOURS-MCP-022: list_tours names a trail run as such, and its profile as a routing preference only (RUN-02)', async () => {
    const { user, trip, ridge } = fixture();
    const orm = await createTestOrm(db);
    await updateRows(
      orm,
      Tours,
      { place: ridge.id },
      { tourTypeRef: 'run', max_hiking_difficulty: null, run_profile: 'trail', run_pace_seconds_per_km: 450 },
    );
    await orm.close();
    const { tours } = read(await mcp.listTours({ tripId: trip.id }, ctx(user.id)));
    const listed = tours.find((tour: { place_id: number }) => tour.place_id === ridge.id);
    expect(listed).toMatchObject({ tour_type: 'run', run_profile: 'trail', run_pace_seconds_per_km: 450 });
    const entry = getEntry(ToursMcp as unknown as ClassRef, 'listTours');
    const description = entry?.kind === 'tool' ? (entry.options.description ?? '') : '';
    expect(description).toContain('trail for forest tracks and natural paths up to mountain paths (T2)');
    expect(description).toContain('never a statement that a way can be run');
  });

  it('TOURS-MCP-023: list_tours names a ski tour with its discipline and technique, and says how its line came to be (SKI-02)', async () => {
    const { user, trip, ridge, gorge } = fixture();
    const orm = await createTestOrm(db);
    await updateRows(
      orm,
      Tours,
      { place: ridge.id },
      { tourTypeRef: 'ski', max_hiking_difficulty: null, ski_discipline: 'cross_country', ski_technique: 'skating' },
    );
    await orm.close();
    const { tours } = read(await mcp.listTours({ tripId: trip.id }, ctx(user.id)));
    const byId = new Map(tours.map((tour: { place_id: number }) => [tour.place_id, tour]));
    expect(byId.get(ridge.id)).toMatchObject({
      tour_type: 'ski',
      ski_discipline: 'cross_country',
      ski_technique: 'skating',
    });
    expect(byId.get(gorge.id)).toMatchObject({ ski_discipline: null, ski_technique: null });
    const entry = getEntry(ToursMcp as unknown as ClassRef, 'listTours');
    const description = entry?.kind === 'tool' ? (entry.options.description ?? '') : '';
    expect(description).toContain('ski_discipline: alpine, snowboard, cross_country, touring for ski touring');
    expect(description).toContain('snowshoe or winter_hike');
    expect(description).toContain('planned by the piste router along the runs, lifts and trails');
    expect(description).toContain('and drawn straight elsewhere');
    expect(description).toContain('an imported one is kept as recorded');
    expect(description).toContain("the router's estimate only when every leg was planned by it");
    expect(description).toContain('nothing in it says anything about snow, avalanches');
  });

  it('TOURS-MCP-024: get_tour_plan names every leg of a planned ski tour as drawn freely, with its straight length (SKI-02)', async () => {
    const { member, trip } = fixture();
    const orm = await createTestOrm(db);
    const ski = await makePlace(orm, trip.id, { name: 'Over the pass' });
    await makeTour(orm, ski.id, { tourTypeRef: 'ski', max_hiking_difficulty: null, ski_discipline: 'touring' });
    await addTourWaypoints(orm, ski.id, [
      { lat: 47, lng: 11, station_key: 'sk-start' },
      { lat: 47.01, lng: 11, station_key: 'sk-col' },
      { lat: 47.01, lng: 11.01, station_key: 'sk-end' },
    ]);
    await orm.close();
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: ski.id }, ctx(member.id)));
    expect(plan.tour).toMatchObject({ tour_type: 'ski', ski_discipline: 'touring' });
    expect(plan.legs).toEqual([
      expect.objectContaining({ from_key: 'sk-start', to_key: 'sk-col', kind: 'free', name: null }),
      expect.objectContaining({ from_key: 'sk-col', to_key: 'sk-end', kind: 'free', name: null }),
    ]);
    expect(plan.legs[0].length_km).toBeCloseTo(1.11, 1);
    expect(plan.legs[1].length_km).toBeCloseTo(0.76, 1);
  });

  it('TOURS-MCP-026: list_tours and get_tour_plan give an import its estimated time, named as worked out, and keep a planned time (TIME-01)', async () => {
    const { user, trip, ridge, gorge } = fixture();
    const orm = await createTestOrm(db);
    await updateRows(orm, Tours, { place: ridge.id }, { distance: 12, elevation_gain: 300, elevation_loss: 500 });
    await updateRows(orm, Tours, { place: gorge.id }, { distance: 6, duration: 95 });
    await orm.close();
    const { tours } = read(await mcp.listTours({ tripId: trip.id }, ctx(user.id)));
    const byId = new Map(tours.map((tour: { place_id: number }) => [tour.place_id, tour]));
    expect(byId.get(ridge.id)).toMatchObject({ duration: null, time_estimate: { minutes: 240, basis: 'din33466' } });
    expect(byId.get(gorge.id)).toMatchObject({ duration: 95, time_estimate: null });
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: ridge.id }, ctx(user.id)));
    expect(plan.tour.time_estimate).toEqual({ minutes: 240, basis: 'din33466' });
    expect(plan.derived).toContain('tour.time_estimate');
    const planned = read(await mcp.getTourPlan({ tripId: trip.id, placeId: gorge.id }, ctx(user.id)));
    expect(planned.derived).not.toContain('tour.time_estimate');
    const entry = getEntry(ToursMcp as unknown as ClassRef, 'listTours');
    const description = entry?.kind === 'tool' ? (entry.options.description ?? '') : '';
    expect(description).toContain('time_estimate');
    expect(description).toContain('never a recorded or planned time');
    const planEntry = getEntry(ToursMcp as unknown as ClassRef, 'getTourPlan');
    const planDescription = planEntry?.kind === 'tool' ? (planEntry.options.description ?? '') : '';
    expect(planDescription).toContain(
      'never present them as saved facts. tour.time_estimate is one of them where present',
    );
  });

  it('TOURS-MCP-027: a ski tour the piste router planned names its options and build, and its legs as routed', async () => {
    const { member, trip } = fixture();
    const orm = await createTestOrm(db);
    const ski = await makePlace(orm, trip.id, { name: 'Down to the valley' });
    const stored = {
      options: { ...DEFAULT_SKI_ROUTE_OPTIONS, max_difficulty: 'advanced' },
      build: '2026-11-02',
      planned_legs: [0],
    };
    await makeTour(orm, ski.id, {
      tourTypeRef: 'ski',
      max_hiking_difficulty: null,
      ski_discipline: 'alpine',
      ski_options: JSON.stringify(stored),
    });
    await addTourWaypoints(orm, ski.id, [
      { lat: 46, lng: 7, station_key: 'pk-top' },
      { lat: 46.01, lng: 7, station_key: 'pk-valley' },
    ]);
    await orm.close();
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: ski.id }, ctx(member.id)));
    expect(plan.tour).toMatchObject({
      ski_options: stored.options,
      ski_route_build: '2026-11-02',
      ski_planned_legs: [0],
    });
    expect(plan.legs).toEqual([expect.objectContaining({ from_key: 'pk-top', to_key: 'pk-valley', kind: 'routed' })]);
  });

  it('TOURS-MCP-027: a ski tour planned in part names only the legs the router planned as routed, the rest drawn straight', async () => {
    const { member, trip } = fixture();
    const orm = await createTestOrm(db);
    const partly = await makePlace(orm, trip.id, { name: 'Across the valley' });
    const options = DEFAULT_SKI_ROUTE_OPTIONS;
    await makeTour(orm, partly.id, {
      tourTypeRef: 'ski',
      max_hiking_difficulty: null,
      ski_discipline: 'alpine',
      ski_options: JSON.stringify({ options, build: '2026-11-02', planned_legs: [1] }),
    });
    await addTourWaypoints(orm, partly.id, [
      { lat: 46, lng: 7, station_key: 'pp-a' },
      { lat: 46.01, lng: 7, station_key: 'pp-b' },
      { lat: 46.02, lng: 7, station_key: 'pp-c' },
    ]);
    // Saved without naming its legs: planned throughout only with the router's time kept.
    const timed = await makePlace(orm, trip.id, { name: 'Timed' });
    await makeTour(orm, timed.id, {
      tourTypeRef: 'ski',
      max_hiking_difficulty: null,
      ski_discipline: 'alpine',
      duration: 25,
      ski_options: JSON.stringify({ options, build: '2026-11-02' }),
    });
    const untimed = await makePlace(orm, trip.id, { name: 'Untimed' });
    await makeTour(orm, untimed.id, {
      tourTypeRef: 'ski',
      max_hiking_difficulty: null,
      ski_discipline: 'alpine',
      ski_options: JSON.stringify({ options, build: '2026-11-02' }),
    });
    await oneByOne([timed, untimed], (place) =>
      addTourWaypoints(orm, place.id, [
        { lat: 46, lng: 7, station_key: `${place.id}-a` },
        { lat: 46.01, lng: 7, station_key: `${place.id}-b` },
      ]),
    );
    await orm.close();
    const plan = read(await mcp.getTourPlan({ tripId: trip.id, placeId: partly.id }, ctx(member.id)));
    expect(plan.legs.map((leg: { kind: string }) => leg.kind)).toEqual(['free', 'routed']);
    expect(plan.legs[0].length_km).toBeCloseTo(1.11, 1);
    expect(plan.legs[1].length_km).toBeNull();
    const kinds = async (placeId: number): Promise<string[]> => {
      const other = read(await mcp.getTourPlan({ tripId: trip.id, placeId }, ctx(member.id)));
      return other.legs.map((leg: { kind: string }) => leg.kind);
    };
    expect(await kinds(timed.id)).toEqual(['routed']);
    expect(await kinds(untimed.id)).toEqual(['free']);
    const listEntry = getEntry(ToursMcp as unknown as ClassRef, 'listTours');
    expect(listEntry?.kind === 'tool' ? listEntry.options.description : '').toContain(
      'ski_planned_legs: the legs it planned',
    );
    const planEntry = getEntry(ToursMcp as unknown as ClassRef, 'getTourPlan');
    expect(planEntry?.kind === 'tool' ? planEntry.options.description : '').toContain(
      'routed where the piste router planned it and free',
    );
  });

  /** CW-13: the walk of walkFixture with a saved line through its three stops, the market halfway along. */
  async function remainingFixture() {
    const base = await walkFixture();
    const orm = await createTestOrm(db);
    const line = [
      [48.1, 11.5],
      [48.11, 11.51],
      [48.12, 11.52],
    ];
    await updateRows(orm, Places, { id: base.walk.id }, { route_geometry: JSON.stringify(line) });
    await orm.close();
    const remaining = async (userId: number, dayId = base.day1.id) =>
      read(await mcp.getCityWalkRemainingTime({ tripId: base.trip.id, placeId: base.walk.id, dayId }, ctx(userId)));
    return { ...base, remaining };
  }

  it('TOURS-MCP-028: get_city_walk_remaining_time counts from the last visit, with walking time, stays and the whole walk apart', async () => {
    const { member, trip, day1, walk, onDay1, remaining } = await remainingFixture();
    const first = await remaining(member.id);
    expect(first).toMatchObject({
      place_id: walk.id,
      day_id: day1.id,
      assignment_id: onDay1.id,
      loop: false,
      live_position: false,
      finished: false,
      reference: { kind: 'last_visited', station: { position: 1, key: 'stop-cathedral', name: 'Cathedral' } },
    });
    // The market ahead was skipped, but the saved line still leads through it.
    expect(first.walking).toEqual({
      total_minutes: 80,
      remaining_minutes: 80,
      unknown_because: null,
      upper_bound: true,
      skipped_ahead: [{ position: 2, key: 'stop-market', name: null }],
      after_last_station_minutes: 0,
    });
    expect(first.stays).toEqual({
      remaining_known_minutes: 0,
      unknown: [{ position: 3, key: 'stop-park', name: null }],
      optional_known_minutes: 0,
    });
    expect(first.open_stations).toEqual([
      {
        position: 3,
        key: 'stop-park',
        name: null,
        importance: 'must',
        stay_minutes: null,
        walk_minutes_from_reference: 80,
      },
    ]);
    expect(first.derived).toEqual(
      expect.arrayContaining([
        'walking.remaining_minutes',
        'walking.upper_bound',
        'reference',
        'stays',
        'open_stations',
      ]),
    );
    expect(first.derived).not.toContain('walking.total_minutes');

    // Checked off since: read again, the stretch to the market is behind.
    await t.get(TourVisitsService).update(String(trip.id), onDay1.id, 'stop-market', { status: 'visited' });
    const again = await remaining(member.id);
    expect(again.reference).toEqual({
      kind: 'last_visited',
      station: { position: 2, key: 'stop-market', name: null },
    });
    expect(again.walking).toMatchObject({ remaining_minutes: 40, upper_bound: false, skipped_ahead: [] });
    expect(again.open_stations[0].walk_minutes_from_reference).toBe(40);
  });

  it("TOURS-MCP-029: the same walk on another day counts from its start, none of the first day's visits in it", async () => {
    const { member, day2, walk, remaining } = await remainingFixture();
    const orm = await createTestOrm(db);
    const onDay2 = await makeDayAssignment(orm, day2.id, walk.id);
    await orm.close();
    const result = await remaining(member.id, day2.id);
    expect(result).toMatchObject({ assignment_id: onDay2.id, reference: { kind: 'start' }, finished: false });
    expect(result.walking).toMatchObject({ remaining_minutes: 80, upper_bound: false });
    expect(result.open_stations.map((station: { key: string }) => station.key)).toEqual([
      'stop-cathedral',
      'stop-market',
      'stop-park',
    ]);
    expect(result.stays).toMatchObject({ remaining_known_minutes: 50 });
  });

  it('TOURS-MCP-033: a walk put on one day twice is read per run, an assignment of another walk or day refused', async () => {
    const { member, trip, day1, day2, walk, ridge, onDay1, remaining } = await remainingFixture();
    const orm = await createTestOrm(db);
    const again = await makeDayAssignment(orm, day1.id, walk.id);
    const onDay2 = await makeDayAssignment(orm, day2.id, walk.id);
    const ridgeOnDay1 = await makeDayAssignment(orm, day1.id, ridge.id);
    await orm.close();
    expect((await remaining(member.id)).assignment_id).toBe(onDay1.id);
    const run = (assignmentId: number) => ({ tripId: trip.id, placeId: walk.id, dayId: day1.id, assignmentId });
    const second = read(await mcp.getCityWalkRemainingTime(run(again.id), ctx(member.id)));
    expect(second).toMatchObject({ assignment_id: again.id, reference: { kind: 'start' } });
    const progress = read(await mcp.getCityWalkProgress(run(again.id), ctx(member.id)));
    expect(progress.assignment_id).toBe(again.id);
    expect(progress.stations.every((station: { status: string }) => station.status === 'planned')).toBe(true);
    const refused = await Promise.all(
      [onDay2.id, ridgeOnDay1.id].flatMap((other) => [
        mcp.getCityWalkRemainingTime(run(other), ctx(member.id)),
        mcp.getCityWalkProgress(run(other), ctx(member.id)),
      ]),
    );
    expect(refused.map(read)).toEqual(Array(4).fill({ error: 'No city walk of this trip is on that day.' }));
  });

  it('TOURS-MCP-030: without a line or with a station open before the last visit, the time stays unknown with its reason', async () => {
    const { user, trip, walk, onDay1, remaining } = await remainingFixture();
    const visits = t.get(TourVisitsService);
    await visits.update(String(trip.id), onDay1.id, 'stop-cathedral', { status: 'planned' });
    await visits.update(String(trip.id), onDay1.id, 'stop-market', { status: 'visited' });
    const unclear = await remaining(user.id);
    expect(unclear.reference).toEqual({
      kind: 'ambiguous',
      last_visited: { position: 2, key: 'stop-market', name: null },
      open_before: [{ position: 1, key: 'stop-cathedral', name: 'Cathedral' }],
    });
    expect(unclear.walking).toMatchObject({
      total_minutes: 80,
      remaining_minutes: null,
      unknown_because: 'progress_ambiguous',
    });

    const orm = await createTestOrm(db);
    await updateRows(orm, Places, { id: walk.id }, { route_geometry: null });
    await orm.close();
    await visits.update(String(trip.id), onDay1.id, 'stop-cathedral', { status: 'visited' });
    const pending = await remaining(user.id);
    expect(pending.walking).toMatchObject({
      total_minutes: 80,
      remaining_minutes: null,
      unknown_because: 'route_pending',
      after_last_station_minutes: null,
    });
    expect(pending.open_stations[0].walk_minutes_from_reference).toBeNull();
  });

  it('TOURS-MCP-031: reading changes nothing, tells an outsider nothing and names no walk for a day without it', async () => {
    const { user, outsider, trip, day2, walk, remaining } = await remainingFixture();
    const orm = await createTestOrm(db);
    const before = await countRows(orm, TourStationVisits, {});
    const revision = (await findRow(orm, Tours, { place: walk.id }))?.revision;
    await remaining(user.id);
    expect(await countRows(orm, TourStationVisits, {})).toBe(before);
    expect((await findRow(orm, Tours, { place: walk.id }))?.revision).toBe(revision);
    await orm.close();
    expect(await remaining(outsider.id)).toEqual({ error: 'Trip not found or access denied.' });
    expect(await remaining(user.id, day2.id)).toEqual({ error: 'No city walk of this trip is on that day.' });

    const failure = new Error('database gone');
    const spy = vi.spyOn(t.get(TourVisitsService), 'remaining').mockRejectedValueOnce(failure);
    try {
      await expect(
        mcp.getCityWalkRemainingTime({ tripId: trip.id, placeId: walk.id, dayId: day2.id }, ctx(user.id)),
      ).rejects.toBe(failure);
    } finally {
      spy.mockRestore();
    }
  });

  it('TOURS-MCP-032: the remaining time names its reference, its bounds and that no live position is known', () => {
    const entry = getEntry(ToursMcp as unknown as ClassRef, 'getCityWalkRemainingTime');
    const description = entry?.kind === 'tool' ? (entry.options.description ?? '') : '';
    for (const field of [
      'reference',
      'live_position',
      'upper_bound',
      'after_last_station_minutes',
      'unknown_because',
      'stays.unknown',
      'never by how many stations are open',
      'Reading changes nothing',
      'never present them as stored facts',
      'assignmentId',
    ]) {
      expect(description).toContain(field);
    }
    const progress = getEntry(ToursMcp as unknown as ClassRef, 'getCityWalkProgress');
    expect(progress?.kind === 'tool' ? progress.options.description : '').toContain('get_city_walk_remaining_time');
  });
});
