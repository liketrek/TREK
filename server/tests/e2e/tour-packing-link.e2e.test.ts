/**
 * A tour's packing link (P2D-XD-01), through the real JwtAuthGuard, AddonGuard
 * and TripAccessGuard against a migrated and seeded temp SQLite db, every
 * answer checked against its response contract. The permission check is a
 * container spy and the broadcasts go to a FakeRealtimeService.
 *
 * Fixtures: user 1 owns trip 5 and its packing list, user 2 is a member of
 * trip 5 whom the spy denies 'place_edit' and who keeps one item to
 * themselves, user 3 has no access to the trip.
 */
import { DayAssignments } from '../../src/db/entities/DayAssignments.entity';
import { PackingItems } from '../../src/db/entities/PackingItems.entity';
import { Places } from '../../src/db/entities/Places.entity';
import { TourPackingLinks } from '../../src/db/entities/TourPackingLinks.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { makePackingItem } from '../helpers/factories/packing';
import { makePlace } from '../helpers/factories/places';
import { countRows, deleteRows, findRows, insertRows } from '../helpers/factories/rows';
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

const OWNER = 1;
const MEMBER = 2;
const OUTSIDER = 3;

const tourBody = {
  name: 'Ridge walk',
  route_geometry: [
    [47, 11, 600],
    [47.01, 11.01, 700],
  ],
  waypoints: [
    { lat: 47, lng: 11, role: 'start', sequence: 0 },
    { lat: 47.01, lng: 11.01, role: 'end', sequence: 1 },
  ],
  max_hiking_difficulty: 3,
  duration_seconds: 3600,
};

describe('Tour packing link e2e (real guards + temp SQLite)', () => {
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
  const path = (placeId: number) => `/api/trips/5/tours/${placeId}/packing-link`;

  const createTour = async () => {
    const res = await request(server).post('/api/trips/5/tours').set(as(OWNER)).send(tourBody);
    expect(res.status).toBe(201);
    return res.body.tour.place_id as number;
  };

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
    await insertRows(orm, Trips, [{ id: 5, user: 1, title: 'Alps' }]);
    await addTripMember(orm, 5, 2);
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
    await setAddonEnabled(orm, 'packing', true);
    realtime.broadcastMock.mockClear();
    await deleteRows(orm, TourPackingLinks);
    await deleteRows(orm, PackingItems);
    await deleteRows(orm, DayAssignments);
    await deleteRows(orm, Places);
    await makePackingItem(orm, 5, { name: 'Boots', category: 'Hiking gear', sort_order: 1 });
    await makePackingItem(orm, 5, { name: 'Diary', category: 'Secret', is_private: 1, owner: MEMBER, sort_order: 2 });
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('links a category, reads it back, moves it to the whole list and lets go, leaving every item as it was', async () => {
    const tour = await createTour();
    const before = await findRows(orm, PackingItems, {}, { id: 'asc' });
    const empty = await request(server).get(path(tour)).set(as(MEMBER));
    expect(empty.status).toBe(200);
    expect(empty.body).toEqual({ packing_link: null });

    const linked = await request(server)
      .put(path(tour))
      .set(as(OWNER))
      .set('X-Socket-Id', 'sock-1')
      .send({ category: 'Hiking gear' });
    expect(linked.status).toBe(200);
    expect(linked.body.tour).toMatchObject({ place_id: tour, name: 'Ridge walk' });
    expect(linked.body.packing_link).toEqual({ category: 'Hiking gear', linked_at: expect.any(String) });
    expect(realtime.broadcastMock).toHaveBeenCalledWith('5', 'tours:changed', { placeIds: [tour] }, 'sock-1');
    expect((await request(server).get(path(tour)).set(as(MEMBER))).body).toEqual({
      packing_link: linked.body.packing_link,
    });

    const whole = await request(server).put(path(tour)).set(as(OWNER)).send({ category: null });
    expect(whole.status).toBe(200);
    expect(whole.body.packing_link.category).toBeNull();
    expect(await countRows(orm, TourPackingLinks)).toBe(1);

    const removed = await request(server).delete(path(tour)).set(as(OWNER));
    expect(removed.status).toBe(200);
    expect(removed.body.packing_link).toBeNull();
    expect(await countRows(orm, TourPackingLinks)).toBe(0);
    expect(await findRows(orm, PackingItems, {}, { id: 'asc' })).toEqual(before);
  });

  it('refuses a member without place_edit, a stranger, a body it cannot read and a category the user cannot see', async () => {
    const tour = await createTour();
    expect((await request(server).put(path(tour)).set(as(MEMBER)).send({ category: null })).status).toBe(403);
    expect((await request(server).delete(path(tour)).set(as(MEMBER))).status).toBe(403);
    expect((await request(server).get(path(tour)).set(as(OUTSIDER))).status).toBe(404);
    expect((await request(server).put(path(tour)).set(as(OUTSIDER)).send({ category: null })).status).toBe(404);
    expect((await request(server).put(path(tour)).set(as(OWNER)).send({})).status).toBe(400);
    expect((await request(server).put(path(tour)).set(as(OWNER)).send({ category: '' })).status).toBe(400);

    // The member's private item is not the owner's to point at.
    const hidden = await request(server).put(path(tour)).set(as(OWNER)).send({ category: 'Secret' });
    expect(hidden.status).toBe(400);
    expect(hidden.body).toEqual({ error: 'Packing category not found' });
    const unknown = await request(server).put(path(tour)).set(as(OWNER)).send({ category: 'Climbing' });
    expect(unknown.status).toBe(400);
    expect(await countRows(orm, TourPackingLinks)).toBe(0);
  });

  it('answers a place that is no tour, a malformed id and switched-off addons as not found', async () => {
    const tour = await createTour();
    const cafe = await makePlace(orm, 5, { name: 'Cafe' });
    const notTour = await request(server).get(path(cafe.id)).set(as(OWNER));
    expect(notTour.status).toBe(404);
    expect(notTour.body).toEqual({ error: 'Tour not found' });
    expect((await request(server).get('/api/trips/5/tours/x/packing-link').set(as(OWNER))).status).toBe(404);
    expect((await request(server).get(path(tour))).status).toBe(401);

    await request(server).put(path(tour)).set(as(OWNER)).send({ category: null });
    await setAddonEnabled(orm, 'packing', false);
    const noPacking = await request(server).put(path(tour)).set(as(OWNER)).send({ category: 'Hiking gear' });
    expect(noPacking.status).toBe(404);
    expect(noPacking.body).toEqual({ error: 'Packing addon is not enabled' });
    // The link stays readable and can be let go while Packing is off.
    expect((await request(server).get(path(tour)).set(as(OWNER))).body.packing_link.category).toBeNull();
    expect((await request(server).delete(path(tour)).set(as(OWNER))).status).toBe(200);

    await setAddonEnabled(orm, 'tours', false);
    const noTours = await request(server).get(path(tour)).set(as(OWNER));
    expect(noTours.status).toBe(404);
    expect(noTours.body).toEqual({ error: 'Tours addon is not enabled' });
  });
});
