/**
 * Tours e2e for city walks (CW-01 to CW-03, CW-10, CW-11, CW-13): a walk saved and read
 * with its stations, one saved with its stations only waiting for its way, the
 * keys of its stations kept through an edit, and the stations checked off on
 * the days the walk is on, and what is left of it read over MCP, through the real
 * JwtAuthGuard, AddonGuard and TripAccessGuard against a migrated and seeded
 * temp SQLite db. The permission check is a container spy and the broadcast
 * goes to a FakeRealtimeService, as in tours.e2e.test.ts.
 *
 * Fixtures: user 1 owns trips 5 and 6, user 2 is a member of trip 5 whom the
 * permission spy denies 'place_edit' and 'day_edit', user 3 has no access to
 * either trip. Trip 5 has days 3 and 4, trip 6 has day 7.
 */
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Days } from '../../src/db/entities/Days.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { TourStationVisits } from '../../src/db/entities/TourStationVisits.entity';
import { Tours } from '../../src/db/entities/Tours.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { trekMcpAccessPolicy, trekMcpValidateAccess } from '../../src/mcp/nest-mcp-policy';
import { createTestRegistry, type McpContext } from '../../src/nest-mcp';
import { AssignmentsModule } from '../../src/nest/assignments/assignments.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { withRequestContext } from '../../src/nest/database/request-context';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursMcp } from '../../src/nest/tours/tours.mcp';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { makePlace } from '../helpers/factories/places';
import { countRows, deleteRows, insertRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTourWaypoints, makeTour } from '../helpers/factories/tours';
import { addTripMember } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import { Test } from '@nestjs/testing';
import { stationKeySchema } from '@trek/shared';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

const { journeyHooks } = vi.hoisted(() => ({
  journeyHooks: {
    reconcileTripSkeletons: vi.fn().mockResolvedValue(undefined),
    onPlaceCreated: vi.fn().mockResolvedValue(undefined),
    onPlaceUpdated: vi.fn().mockResolvedValue(undefined),
    onPlaceDeleted: vi.fn().mockResolvedValue(undefined),
  },
}));

const db = createSnapshotTestDb();
const realtime = new FakeRealtimeService();

let orm: TestOrm;
let checkPermission: MockInstance;

const OWNER = 1;
const VIEWER = 2;
const OUTSIDER = 3;

const GEOMETRY = [
  [48.1, 11.5, 520],
  [48.11, 11.51, 525],
  [48.12, 11.52, 530],
  [48.13, 11.53, 528],
];
/** Three stops and a shaping point: a must-see cathedral, a market passed through, a park of unknown stay. */
const STATIONS = [
  {
    lat: 48.1,
    lng: 11.5,
    role: 'start',
    sequence: 0,
    name: 'Cathedral',
    stay_minutes: 30,
    importance: 'must',
    protected: true,
    opening_hours: 'Mo-Su 09:00-18:00',
  },
  { lat: 48.105, lng: 11.505, role: 'via', sequence: 1, shaping: true },
  { lat: 48.11, lng: 11.51, role: 'via', sequence: 2, name: 'Market', stay_minutes: 0 },
  { lat: 48.13, lng: 11.53, role: 'end', sequence: 3, name: 'Park', importance: 'optional' },
];
type Point = Record<string, unknown>;
const walkBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'Old town',
  tour_type: 'walk',
  route_geometry: GEOMETRY,
  waypoints: STATIONS,
  duration_seconds: 3600,
  ...overrides,
});
/** The points as a route in this order: numbered from 0, the first the start and the last the end. */
const inOrder = (points: Point[]): Point[] =>
  points.map((point, sequence) => ({
    ...point,
    sequence,
    role: sequence === 0 ? 'start' : sequence === points.length - 1 ? 'end' : 'via',
  }));

describe('City walks e2e (real guards + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        ToursModule,
        AssignmentsModule,
      ],
    })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
      .overrideProvider(JourneyDomainService)
      .useValue(journeyHooks)
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned ids: the session cookies sign for exactly these users.
    await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 2, username: 'viewer', email: 'viewer@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, {
      id: 3,
      username: 'outsider',
      email: 'outsider@example.test',
      role: 'user',
      password_version: 0,
    });
    await insertRows(orm, Trips, [
      { id: 5, user: 1, title: 'City days' },
      { id: 6, user: 1, title: 'Other' },
    ]);
    await addTripMember(orm, 5, 2);
    await insertRows(orm, Days, [
      { id: 3, trip: 5, day_number: 1, date: '2026-07-10' },
      { id: 4, trip: 5, day_number: 2 },
      { id: 7, trip: 6, day_number: 1 },
    ]);
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    checkPermission.mockImplementation(
      (action: string, _role: string, _owner: number, userId: number) =>
        !((action === 'place_edit' || action === 'day_edit') && userId === VIEWER),
    );
    await setAddonEnabled(orm, 'tours', true);
    realtime.broadcastMock.mockClear();
    await deleteRows(orm, DayAssignments);
    await deleteRows(orm, Places);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  const cookie = (userId = OWNER) => sessionCookie(userId);

  const saveWalk = async (tripId = 5, body: Record<string, unknown> = walkBody()) => {
    const res = await request(server).post(`/api/trips/${tripId}/tours`).set('Cookie', cookie()).send(body);
    expect(res.status).toBe(201);
    return { placeId: res.body.tour.place_id as number, waypoints: res.body.waypoints as Point[] };
  };

  const assign = async (placeId: number, dayId = 3, tripId = 5) => {
    const res = await request(server)
      .post(`/api/trips/${tripId}/days/${dayId}/assignments`)
      .set('Cookie', cookie())
      .send({ place_id: placeId });
    expect(res.status).toBe(201);
    return res.body.assignment.id as number;
  };

  /** A walk of trip 5 on day 3, with the keys its stations were given, the shaping point's left out. */
  const walkOnDay3 = async () => {
    const { placeId, waypoints } = await saveWalk();
    const [cathedral, shaping, market, park] = waypoints.map((point) => String(point.key));
    return { placeId, waypoints, assignmentId: await assign(placeId), cathedral, shaping, market, park };
  };

  const mark = (assignmentId: number | string, key: string, body: unknown, userId = OWNER, tripId = 5) =>
    request(server)
      .put(`/api/trips/${tripId}/tour-visits/${assignmentId}/${key}`)
      .set('Cookie', cookie(userId))
      .set('X-Socket-Id', 'sock-1')
      .send(body as object);

  const visitsOf = async (tripId = 5, userId = OWNER) => {
    const res = await request(server).get(`/api/trips/${tripId}/tour-visits`).set('Cookie', cookie(userId));
    expect(res.status).toBe(200);
    return res.body.visits as Array<{ assignment_id: number; station_key: string; status: string }>;
  };

  describe('a walk saved with its stations only (CW-11)', () => {
    /** A walk an assistant created from confirmed stations: no line, no distance, no walking time. */
    const pendingWalk = async () => {
      const place = await makePlace(orm, 5, { name: 'Briefed walk', lat: 48.1, lng: 11.5, route_geometry: null });
      await makeTour(orm, place.id, { tourTypeRef: 'walk' });
      await addTourWaypoints(orm, place.id, [
        {
          lat: 48.1,
          lng: 11.5,
          station_key: 'stop-cathedral',
          name: 'Cathedral',
          stay_minutes: 30,
          importance: 'must',
          protected: 1,
        },
        { lat: 48.13, lng: 11.53, station_key: 'stop-park', name: 'Park' },
      ]);
      return place.id;
    };
    const listed = async (placeId: number) =>
      (await request(server).get('/api/trips/5/tours').set('Cookie', cookie(VIEWER))).body.tours.find(
        (tour: { place_id: number }) => tour.place_id === placeId,
      );

    it('the list and the detail say it waits for its way, until a save with a line plans it', async () => {
      const { placeId: planned } = await saveWalk();
      const placeId = await pendingWalk();
      expect(await listed(planned)).toMatchObject({ route_pending: false });
      expect(await listed(placeId)).toMatchObject({
        route_pending: true,
        distance: null,
        duration: null,
        station_count: 2,
      });
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', cookie(VIEWER));
      expect(detail.status).toBe(200);
      expect(detail.body.tour.route_pending).toBe(true);
      const [cathedral, park] = detail.body.waypoints as Point[];
      expect(cathedral).toMatchObject({ name: 'Cathedral', protected: true, stay_minutes: 30 });

      const saved = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', cookie())
        .send(walkBody({ waypoints: inOrder([cathedral, park]), expected_revision: 1 }));
      expect(saved.status).toBe(200);
      expect(saved.body.tour).toMatchObject({ route_pending: false, duration: 60 });
      expect(await listed(placeId)).toMatchObject({ route_pending: false });
    });

    it('is copied as it is, and a create over REST still needs its line', async () => {
      const placeId = await pendingWalk();
      const copy = await request(server)
        .post(`/api/trips/5/tours/${placeId}/copy`)
        .set('Cookie', cookie())
        .send({ name: 'Briefed walk again' });
      expect(copy.status).toBe(201);
      expect(copy.body.tour).toMatchObject({ name: 'Briefed walk again', route_pending: true, station_count: 2 });
      const { route_geometry: _line, ...withoutLine } = walkBody();
      const refused = await request(server).post('/api/trips/5/tours').set('Cookie', cookie()).send(withoutLine);
      expect(refused.status).toBe(400);
    });
  });

  describe('a walk and its stations (CW-01, CW-02, CW-10)', () => {
    it('saves a walk with a key on every point and its station fields, and lists how many stations it has', async () => {
      const { placeId, waypoints } = await saveWalk();
      for (const point of waypoints) expect(stationKeySchema.safeParse(point.key).success).toBe(true);
      expect(waypoints.map(({ key: _key, ...point }) => point)).toEqual(STATIONS);

      const list = await request(server).get('/api/trips/5/tours').set('Cookie', cookie(VIEWER));
      expect(list.status).toBe(200);
      expect(list.body.tours).toEqual([
        expect.objectContaining({
          place_id: placeId,
          tour_type: 'walk',
          station_count: 3,
          // CW-02: the cathedral's 30 min and the market passed through; the park's stay is not entered yet.
          station_stay_minutes: 30,
          station_stays_unknown: 1,
          max_hiking_difficulty: null,
        }),
      ]);
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', cookie(VIEWER));
      expect(detail.status).toBe(200);
      expect(detail.body.waypoints).toEqual(waypoints);
    });

    it("refuses a station's fields on a hike, and a hike's or a climber's on a walk", async () => {
      const ferrata = { kind: 'ferrata', ref: 'way/1', name: null, geometry: [GEOMETRY[0], GEOMETRY[2]] };
      const hike = (point: Point) =>
        walkBody({
          tour_type: 'hike',
          waypoints: inOrder([{ lat: 48.1, lng: 11.5 }, point]),
        });
      const bodies = [
        hike({ lat: 48.11, lng: 11.51, stay_minutes: 20 }),
        hike({ lat: 48.11, lng: 11.51, importance: 'must' }),
        hike({ lat: 48.11, lng: 11.51, protected: true }),
        walkBody({
          waypoints: inOrder([
            { lat: 48.1, lng: 11.5, fixed_leg: ferrata },
            { lat: 48.12, lng: 11.52 },
          ]),
        }),
        walkBody({ max_hiking_difficulty: 3 }),
        walkBody({ hiking_preferences: { avoid_ferries: true } }),
        walkBody({
          waypoints: inOrder([
            { lat: 48.1, lng: 11.5, key: 'a/b' },
            { lat: 48.12, lng: 11.52 },
          ]),
        }),
        walkBody({
          waypoints: inOrder([
            { lat: 48.1, lng: 11.5, stay_minutes: 1441 },
            { lat: 48.12, lng: 11.52 },
          ]),
        }),
      ];
      const statuses = await bodies.reduce<Promise<number[]>>(
        async (done, body) => [
          ...(await done),
          (await request(server).post('/api/trips/5/tours').set('Cookie', cookie()).send(body)).status,
        ],
        Promise.resolve([]),
      );
      expect(statuses).toEqual(bodies.map(() => 400));
      expect(await countRows(orm, Tours)).toBe(0);
    });

    it('keeps the keys sent back through an edit and gives a new point a key of its own', async () => {
      const { placeId, waypoints } = await saveWalk();
      const [cathedral, , market, park] = waypoints;
      const fountain = { lat: 48.12, lng: 11.52, name: 'Fountain' };
      const res = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', cookie())
        .send(walkBody({ waypoints: inOrder([park, fountain, market, cathedral]), expected_revision: 1 }));
      expect(res.status).toBe(200);
      const keys = (res.body.waypoints as Point[]).map((point) => point.key);
      expect([keys[0], keys[2], keys[3]]).toEqual([park.key, market.key, cathedral.key]);
      expect(waypoints.map((point) => point.key)).not.toContain(keys[1]);
      expect(stationKeySchema.safeParse(keys[1]).success).toBe(true);
      expect(res.body.tour).toMatchObject({ station_count: 4, revision: 2 });
    });
  });

  describe('a crossing by boat taken as a ferry leg (CW-12)', () => {
    const FERRY = {
      kind: 'ferry',
      geometry: [
        [48.11, 11.51],
        [48.12, 11.52],
        [48.13, 11.53],
      ],
      crossings: [[0, 1]],
      minutes: 7,
      walk_minutes: 3,
    };
    const across = (leg: Point, type = 'walk') =>
      walkBody({
        tour_type: type,
        waypoints: inOrder([
          { lat: 48.1, lng: 11.5 },
          { lat: 48.11, lng: 11.51, fixed_leg: leg },
          { lat: 48.13, lng: 11.53 },
        ]),
      });

    it('keeps the leg as it was taken, the boat apart from the walk, through a save and a read', async () => {
      const { placeId, waypoints } = await saveWalk(5, across(FERRY));
      expect(waypoints[1]?.fixed_leg).toEqual(FERRY);
      const detail = await request(server).get(`/api/trips/5/tours/${placeId}`).set('Cookie', cookie(VIEWER));
      expect(detail.body.waypoints[1].fixed_leg).toEqual(FERRY);
      expect(detail.body.tour.duration).toBe(60);
      // The boat is part of the day apart from the walking time, so a list can count it into the planned total.
      expect(detail.body.tour.walk_ferry_minutes).toBe(7);
    });

    it('refuses it on any other type, and a crossing that does not run forwards within its leg', async () => {
      const bodies = [
        across(FERRY, 'hike'),
        across({ ...FERRY, crossings: [[1, 0]] }),
        across({ ...FERRY, crossings: [[1, 3]] }),
        across({ ...FERRY, minutes: -1 }),
      ];
      const statuses = await bodies.reduce<Promise<number[]>>(
        async (done, body) => [
          ...(await done),
          (await request(server).post('/api/trips/5/tours').set('Cookie', cookie()).send(body)).status,
        ],
        Promise.resolve([]),
      );
      expect(statuses).toEqual([400, 400, 400, 400]);
      expect(await countRows(orm, Tours)).toBe(0);
    });
  });

  describe('stations checked off on a day (CW-03)', () => {
    it('marks a station visited, then skipped, then takes it back, telling the trip each time', async () => {
      const { assignmentId, cathedral } = await walkOnDay3();
      expect(await visitsOf()).toEqual([]);

      const visited = await mark(assignmentId, cathedral, { status: 'visited' });
      expect(visited.status).toBe(200);
      const expected = [{ assignment_id: assignmentId, station_key: cathedral, status: 'visited' }];
      expect(visited.body).toEqual({ visits: expected });
      expect(realtime.broadcastMock).toHaveBeenCalledWith(
        '5',
        'tours:visits',
        { assignmentId, visits: expected },
        'sock-1',
      );

      expect((await mark(assignmentId, cathedral, { status: 'skipped' })).status).toBe(200);
      expect(await visitsOf(5, VIEWER)).toEqual([
        { assignment_id: assignmentId, station_key: cathedral, status: 'skipped' },
      ]);

      const back = await mark(assignmentId, cathedral, { status: 'planned' });
      expect(back.status).toBe(200);
      expect(back.body).toEqual({ visits: [] });
      expect(await visitsOf()).toEqual([]);
    });

    it('keeps a visit to the day it was made on', async () => {
      const { placeId, assignmentId, cathedral, park } = await walkOnDay3();
      const onDay4 = await assign(placeId, 4);
      expect((await mark(assignmentId, cathedral, { status: 'visited' })).status).toBe(200);
      expect((await mark(onDay4, park, { status: 'skipped' })).status).toBe(200);
      expect(await visitsOf()).toEqual([
        { assignment_id: assignmentId, station_key: cathedral, status: 'visited' },
        { assignment_id: onDay4, station_key: park, status: 'skipped' },
      ]);
    });

    it('a copy of the walk starts with nothing checked off', async () => {
      const { placeId, assignmentId, cathedral, waypoints } = await walkOnDay3();
      expect((await mark(assignmentId, cathedral, { status: 'visited' })).status).toBe(200);
      const copy = await request(server)
        .post(`/api/trips/5/tours/${placeId}/copy`)
        .set('Cookie', cookie())
        .send({ name: 'Old town again' });
      expect(copy.status).toBe(201);
      expect((copy.body.waypoints as Point[]).map((point) => point.key)).toEqual(waypoints.map((point) => point.key));
      const copyOnDay4 = await assign(copy.body.tour.place_id as number, 4);
      expect((await visitsOf()).map((visit) => visit.assignment_id)).toEqual([assignmentId]);
      expect((await visitsOf()).map((visit) => visit.assignment_id)).not.toContain(copyOnDay4);
    });

    it('a station taken out of the walk takes its visits along, and a walk made a hike keeps none', async () => {
      const { placeId, waypoints, assignmentId, cathedral, market, park } = await walkOnDay3();
      const reduced = await [cathedral, market, park].reduce<Promise<number[]>>(
        async (done, key) => [...(await done), (await mark(assignmentId, key, { status: 'visited' })).status],
        Promise.resolve([]),
      );
      expect(reduced).toEqual([200, 200, 200]);

      const withoutMarket = inOrder([waypoints[0], waypoints[3]]);
      realtime.broadcastMock.mockClear();
      const edit = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', cookie())
        .set('X-Socket-Id', 'sock-1')
        .send(walkBody({ waypoints: withoutMarket, expected_revision: 1 }));
      expect(edit.status).toBe(200);
      const left = await visitsOf();
      expect(left.map((visit) => visit.station_key).sort()).toEqual([cathedral, park].sort());
      // The client that saved still holds the market's visit too, so its own socket hears of the change as well.
      expect(realtime.broadcastMock).toHaveBeenCalledWith(
        '5',
        'tours:visits',
        { assignmentId, visits: left },
        undefined,
      );

      const plain = withoutMarket.map(({ stay_minutes: _s, importance: _i, protected: _p, ...point }) => point);
      const hike = await request(server)
        .put(`/api/trips/5/tours/${placeId}`)
        .set('Cookie', cookie())
        .send(walkBody({ tour_type: 'hike', waypoints: plain, expected_revision: 2 }));
      expect(hike.status).toBe(200);
      expect(await visitsOf()).toEqual([]);
    });

    it('the visits go with the walk when it moves to another day, and go away with its removal from a day', async () => {
      const { assignmentId, cathedral } = await walkOnDay3();
      expect((await mark(assignmentId, cathedral, { status: 'visited' })).status).toBe(200);

      const move = await request(server)
        .put(`/api/trips/5/assignments/${assignmentId}/move`)
        .set('Cookie', cookie())
        .send({ new_day_id: 4, order_index: 0 });
      expect(move.status).toBe(200);
      expect(await visitsOf()).toEqual([{ assignment_id: assignmentId, station_key: cathedral, status: 'visited' }]);

      const removed = await request(server)
        .delete(`/api/trips/5/days/4/assignments/${assignmentId}`)
        .set('Cookie', cookie());
      expect(removed.status).toBe(200);
      expect(await visitsOf()).toEqual([]);
      expect(await countRows(orm, TourStationVisits)).toBe(0);
    });
  });

  describe('remaining time over MCP (CW-13)', () => {
    const remainingOf = (placeId: number, dayId: number) =>
      withRequestContext(app.get(MikroORM), async () => {
        const mcp = app.get(ToursMcp);
        const result = await mcp.getCityWalkRemainingTime({ tripId: 5, placeId, dayId }, {
          userId: VIEWER,
        } as McpContext);
        return JSON.parse(result.content[0]?.text ?? '{}');
      });

    it('is registered as a read of the trip', () => {
      expect(() =>
        createTestRegistry([app.get(ToursMcp)], {
          accessPolicy: trekMcpAccessPolicy,
          validateAccess: trekMcpValidateAccess,
        }),
      ).not.toThrow();
    });

    it('counts from the stations checked off over REST, and the same walk on another day from its start', async () => {
      const { placeId, assignmentId, cathedral, market } = await walkOnDay3();
      await assign(placeId, 4);
      expect((await mark(assignmentId, cathedral, { status: 'visited' })).status).toBe(200);
      expect((await remainingOf(placeId, 3)).walking).toMatchObject({ total_minutes: 60, remaining_minutes: 60 });

      expect((await mark(assignmentId, market, { status: 'visited' })).status).toBe(200);
      const day3 = await remainingOf(placeId, 3);
      expect(day3.reference).toMatchObject({ kind: 'last_visited', station: { key: market, name: 'Market' } });
      expect(day3.walking).toMatchObject({ remaining_minutes: 40, upper_bound: false });
      expect(day3.open_stations).toEqual([
        expect.objectContaining({ name: 'Park', importance: 'optional', walk_minutes_from_reference: 40 }),
      ]);
      expect(day3.stays).toMatchObject({
        remaining_known_minutes: 0,
        unknown: [expect.objectContaining({ name: 'Park' })],
      });

      const day4 = await remainingOf(placeId, 4);
      expect(day4.reference).toEqual({ kind: 'start' });
      expect(day4.walking.remaining_minutes).toBe(60);
      expect(await countRows(orm, TourStationVisits)).toBe(2);
    });
  });

  describe('refusals', () => {
    it('404 for an assignment of another trip, a walk that is none, and a station the walk does not have', async () => {
      const { placeId: hikeId } = await saveWalk(
        5,
        walkBody({
          name: 'Ridge',
          tour_type: 'hike',
          waypoints: inOrder([
            { lat: 48.1, lng: 11.5 },
            { lat: 48.12, lng: 11.52 },
          ]),
        }),
      );
      const hikeOnDay4 = await assign(hikeId, 4);
      const { assignmentId, shaping } = await walkOnDay3();
      const { placeId: elsewhere, waypoints } = await saveWalk(6);
      const foreign = await assign(elsewhere, 7, 6);
      const cases: Array<[number, string, string]> = [
        [foreign, String(waypoints[0].key), 'Assignment not found'],
        [999_999, 'stop-cathedral', 'Assignment not found'],
        [hikeOnDay4, 'stop-cathedral', 'City walk not found'],
        [assignmentId, 'stop-unknown', 'Station not found'],
        [assignmentId, shaping, 'Station not found'],
      ];
      const answers = await cases.reduce<Promise<Array<[number, unknown]>>>(async (done, [id, key]) => {
        const before = await done;
        const res = await mark(id, key, { status: 'visited' });
        return [...before, [res.status, res.body]];
      }, Promise.resolve([]));
      expect(answers).toEqual(cases.map(([, , error]) => [404, { error }]));
      expect(await countRows(orm, TourStationVisits)).toBe(0);
      expect(realtime.broadcastMock).not.toHaveBeenCalledWith('5', 'tours:visits', expect.anything(), 'sock-1');
    });

    it('404 for someone outside the trip and while the addon is off; 403 for a member who may not edit days', async () => {
      const { assignmentId, cathedral } = await walkOnDay3();
      const outsider = await mark(assignmentId, cathedral, { status: 'visited' }, OUTSIDER);
      expect([outsider.status, outsider.body]).toEqual([404, { error: 'Trip not found' }]);
      const outsiderRead = await request(server).get('/api/trips/5/tour-visits').set('Cookie', cookie(OUTSIDER));
      expect([outsiderRead.status, outsiderRead.body]).toEqual([404, { error: 'Trip not found' }]);

      const viewer = await mark(assignmentId, cathedral, { status: 'visited' }, VIEWER);
      expect([viewer.status, viewer.body]).toEqual([403, { error: 'No permission' }]);
      expect(await visitsOf(5, VIEWER)).toEqual([]);

      await setAddonEnabled(orm, 'tours', false);
      const off = await mark(assignmentId, cathedral, { status: 'visited' });
      expect([off.status, off.body]).toEqual([404, { error: 'Tours addon is not enabled' }]);
      const offRead = await request(server).get('/api/trips/5/tour-visits').set('Cookie', cookie());
      expect([offRead.status, offRead.body]).toEqual([404, { error: 'Tours addon is not enabled' }]);
      expect(await countRows(orm, TourStationVisits)).toBe(0);
    });

    it('400 for a key that is no station key, an assignment id that is no number and a body it does not know', async () => {
      const { assignmentId, cathedral } = await walkOnDay3();
      const badKey = await mark(assignmentId, 'ab', { status: 'visited' });
      expect([badKey.status, badKey.body]).toEqual([400, { error: 'Invalid station key' }]);
      const refused: Array<[number | string, unknown]> = [
        ['abc', { status: 'visited' }],
        [assignmentId, { status: 'done' }],
        [assignmentId, { status: 'visited', note: 'late' }],
        [assignmentId, {}],
      ];
      const statuses = await refused.reduce<Promise<number[]>>(
        async (done, [id, body]) => [...(await done), (await mark(id, cathedral, body)).status],
        Promise.resolve([]),
      );
      expect(statuses).toEqual([400, 400, 400, 400]);
      expect(await countRows(orm, TourStationVisits)).toBe(0);
    });

    it('401 without a session', async () => {
      expect((await request(server).get('/api/trips/5/tour-visits')).status).toBe(401);
      expect(
        (await request(server).put('/api/trips/5/tour-visits/1/stop-cathedral').send({ status: 'visited' })).status,
      ).toBe(401);
    });
  });
});
