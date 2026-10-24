/**
 * Whole tours kept in a collection (LIB-03), through the real JwtAuthGuard,
 * AddonGuard and TripAccessGuard against a migrated and seeded temp SQLite db,
 * every answer checked against its response contract. The permission check is
 * a container spy and the broadcasts go to a FakeRealtimeService.
 *
 * Fixtures: user 1 owns trips 5 and 6 and the collection, user 2 is a member
 * of trip 5 whom the spy denies 'place_edit' and a viewer of the collection,
 * user 3 has no access to either.
 */
import { CollectionTours } from '../../src/db/entities/CollectionTours.entity';
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { TourWaypoints } from '../../src/db/entities/TourWaypoints.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { addCollectionMember, makeCollection } from '../helpers/factories/collections';
import { countRows, deleteRows, findRow, insertRows } from '../helpers/factories/rows';
import { setAddonEnabled } from '../helpers/factories/settings';
import { addTripMember } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

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
let collectionId: number;

const OWNER = 1;
const MEMBER = 2;
const OUTSIDER = 3;

const GEOMETRY = [
  [47, 11, 600],
  [47.01, 11.01, 700],
  [47.02, 11.02, 650],
];
const tourBody = (overrides: Record<string, unknown> = {}) => ({
  name: 'Ridge walk',
  route_geometry: GEOMETRY,
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.01, lng: 11.01, role: 'via', sequence: 1, name: 'Saddle' },
    { lat: 47.02, lng: 11.02, role: 'end', sequence: 2 },
  ],
  max_hiking_difficulty: 3,
  duration_seconds: 3600,
  ...overrides,
});

describe('Collection tours e2e (real guards + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        await TestUnitOfWorkModule.forRoot(db),
        await createTestMikroOrmModule(db),
        RealtimeModule,
        ToursModule,
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

  const as = (userId: number) => ({ Cookie: sessionCookie(userId) });

  const createTour = async (tripId = 5, body: Record<string, unknown> = tourBody()) => {
    const res = await request(server).post(`/api/trips/${tripId}/tours`).set(as(OWNER)).send(body);
    expect(res.status).toBe(201);
    return res.body.tour.place_id as number;
  };

  const keep = async (placeId: number, userId = OWNER, extra: Record<string, unknown> = {}) =>
    request(server)
      .post(`/api/addons/collections/${collectionId}/tours`)
      .set(as(userId))
      .send({ source_trip_id: 5, source_place_id: placeId, ...extra });

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned ids: the session cookies sign for exactly these users.
    await makeUser(orm, { id: 1, username: 'owner', email: 'owner@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, { id: 2, username: 'member', email: 'member@example.test', role: 'user', password_version: 0 });
    await makeUser(orm, {
      id: 3,
      username: 'outsider',
      email: 'outsider@example.test',
      role: 'user',
      password_version: 0,
    });
    await insertRows(orm, Trips, [
      { id: 5, user: 1, title: 'Alps' },
      { id: 6, user: 1, title: 'Other' },
    ]);
    await addTripMember(orm, 5, 2);
    const list = await makeCollection(orm, OWNER, { name: 'Hikes' });
    collectionId = list.id;
    await addCollectionMember(orm, collectionId, MEMBER, { role: 'viewer' });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    checkPermission.mockImplementation(
      async (action: string, _role: string, _owner: number, userId: number) =>
        !(action === 'place_edit' && userId === MEMBER),
    );
    await setAddonEnabled(orm, 'tours', true);
    await setAddonEnabled(orm, 'collections', true);
    realtime.broadcastMock.mockClear();
    realtime.broadcastToUserMock.mockClear();
    await deleteRows(orm, CollectionTours);
    await deleteRows(orm, DayAssignments);
    await deleteRows(orm, Places);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('keeps a tour, lists it for every member and shows what taking it over asks about', async () => {
    const source = await createTour();
    const kept = await keep(source, OWNER, { name: 'Ridge, kept' });
    expect(kept.status).toBe(201);
    expect(kept.body.tour).toMatchObject({
      name: 'Ridge, kept',
      tour_type: 'hike',
      has_line: true,
      waypoint_count: 3,
      source: { tripTitle: 'Alps', tourName: 'Ridge walk' },
      saved_by: 'owner',
    });
    expect(realtime.broadcastToUserMock).toHaveBeenCalledWith(
      MEMBER,
      { type: 'collections:updated', collectionId },
      undefined,
    );

    const listed = await request(server).get(`/api/addons/collections/${collectionId}/tours`).set(as(MEMBER));
    expect(listed.status).toBe(200);
    expect(listed.body.tours.map((tour: { id: number }) => tour.id)).toEqual([kept.body.tour.id]);

    const detail = await request(server)
      .get(`/api/addons/collections/${collectionId}/tours/${kept.body.tour.id}`)
      .set(as(MEMBER));
    expect(detail.status).toBe(200);
    expect(detail.body.line).toEqual(GEOMETRY.map(([lat, lng]) => [lat, lng]));
    expect(detail.body.points).toEqual([
      { role: 'start', name: null, shaping: false },
      { role: 'via', name: 'Saddle', shaping: false },
      { role: 'end', name: null, shaping: false },
    ]);
    // The member sees the trip they belong to, without the right to add a tour to it.
    expect(detail.body.trips).toEqual([{ id: 5, title: 'Alps', start_date: null, end_date: null, can_add: false }]);
  });

  it('takes a kept tour into a trip with its points, or with its line only, and changes neither source', async () => {
    const source = await createTour();
    const kept = (await keep(source)).body.tour as { id: number };
    // A later change to the source does not reach the kept tour.
    await request(server)
      .put(`/api/trips/5/tours/${source}`)
      .set(as(OWNER))
      .send(tourBody({ name: 'Changed later' }));
    // Making the source and changing it told trip 5; from here on only the trip it is taken into hears of it.
    realtime.broadcastMock.mockClear();

    const full = await request(server)
      .post('/api/trips/6/tours/from-collection')
      .set(as(OWNER))
      .send({ collection_id: collectionId, collection_tour_id: kept.id, include_waypoints: true });
    expect(full.status).toBe(201);
    expect(full.body.tour).toMatchObject({ name: 'Ridge walk', planned: false, revision: 1 });
    const roles = full.body.waypoints.map((point: { role: string; name?: string }) => [point.role, point.name ?? null]);
    expect(roles).toEqual([
      ['start', null],
      ['via', 'Saddle'],
      ['end', null],
    ]);
    expect(full.body.provenance.takenOverFrom).toEqual({ tripTitle: 'Alps', tourName: 'Ridge walk' });
    expect(realtime.broadcastMock.mock.calls.every(([tripId]) => String(tripId) === '6')).toBe(true);

    const bare = await request(server)
      .post('/api/trips/6/tours/from-collection')
      .set(as(OWNER))
      .send({ collection_id: collectionId, collection_tour_id: kept.id, include_waypoints: false, name: 'Bare' });
    expect(bare.status).toBe(201);
    expect(bare.body.tour).toMatchObject({ name: 'Bare', has_waypoints: false });
    expect(await countRows(orm, TourWaypoints, { place: bare.body.tour.place_id })).toBe(0);
    expect((await findRow(orm, Places, { id: bare.body.tour.place_id }))?.route_geometry).toBe(
      JSON.stringify(GEOMETRY),
    );
    expect(await countRows(orm, Places, { trip: 6 })).toBe(2);
    expect(await countRows(orm, DayAssignments)).toBe(0);
    expect(await countRows(orm, CollectionTours)).toBe(1);
    expect((await findRow(orm, Places, { id: source }))?.name).toBe('Changed later');
  });

  it('refuses a viewer keeping, a stranger reading, a trip without place_edit and an unsaid choice about the points', async () => {
    const source = await createTour();
    expect((await keep(source, MEMBER)).status).toBe(403);
    const kept = (await keep(source)).body.tour as { id: number };
    const stranger = await request(server).get(`/api/addons/collections/${collectionId}/tours`).set(as(OUTSIDER));
    expect(stranger.status).toBe(404);
    expect(stranger.body).toEqual({ error: 'Collection not found' });

    const body = { collection_id: collectionId, collection_tour_id: kept.id, include_waypoints: true };
    const takeOver = (tripId: number, userId: number) =>
      request(server).post(`/api/trips/${tripId}/tours/from-collection`).set(as(userId)).send(body);
    expect((await takeOver(5, MEMBER)).status).toBe(403);
    expect((await takeOver(6, OUTSIDER)).status).toBe(404);
    const unsaid = await request(server)
      .post('/api/trips/6/tours/from-collection')
      .set(as(OWNER))
      .send({ collection_id: collectionId, collection_tour_id: kept.id });
    expect(unsaid.status).toBe(400);
    const wrongList = await request(server)
      .post('/api/trips/6/tours/from-collection')
      .set(as(OWNER))
      .send({ ...body, collection_id: collectionId + 1000 });
    expect(wrongList.status).toBe(404);
    expect(await countRows(orm, Places, { trip: 6 })).toBe(0);
  });

  it('removes a kept tour for the owner only, and answers malformed ids, sessions and addons as the guards do', async () => {
    const source = await createTour();
    const kept = (await keep(source)).body.tour as { id: number };
    const path = `/api/addons/collections/${collectionId}/tours/${kept.id}`;
    expect((await request(server).delete(path).set(as(MEMBER))).status).toBe(403);
    const removed = await request(server).delete(path).set(as(OWNER));
    expect(removed.status).toBe(200);
    expect(removed.body).toEqual({ success: true });
    expect((await request(server).delete(path).set(as(OWNER))).status).toBe(404);
    expect((await request(server).get(`/api/addons/collections/abc/tours`).set(as(OWNER))).status).toBe(404);
    const malformed = await request(server).get(`/api/addons/collections/${collectionId}/tours/x`).set(as(OWNER));
    expect(malformed.status).toBe(404);
    expect((await request(server).get(`/api/addons/collections/${collectionId}/tours`)).status).toBe(401);
    await setAddonEnabled(orm, 'collections', false);
    const noCollections = await request(server).get(`/api/addons/collections/${collectionId}/tours`).set(as(OWNER));
    expect(noCollections.body).toEqual({ error: 'Collections addon is not enabled' });
    await setAddonEnabled(orm, 'tours', false);
    const noTours = await request(server).get(`/api/addons/collections/${collectionId}/tours`).set(as(OWNER));
    expect(noTours.status).toBe(404);
    expect(noTours.body).toEqual({ error: 'Tours addon is not enabled' });
  });
});
