/**
 * The Tours planner's unsaved draft on the account, through the real
 * JwtAuthGuard, AddonGuard and TripAccessGuard against a migrated and seeded
 * temp SQLite db, every answer checked against its response contract. The
 * permission check is a container spy.
 *
 * Fixtures: user 1 owns trip 5, user 2 is a member of trip 5 whom the spy
 * denies 'place_edit', user 3 has no access to the trip.
 */
import { TourDrafts } from '../../src/db/entities/TourDrafts.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { JourneyDomainService } from '../../src/nest/journey/journey-domain.service';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { ToursModule } from '../../src/nest/tours/tours.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { countRows, deleteRows, insertRows } from '../helpers/factories/rows';
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
const PATH = '/api/trips/5/tour-draft';

const draftOf = (name: string) => JSON.stringify({ version: 11, name, waypoints: [{ id: 'a', lat: 47, lng: 11 }] });

describe('Tour drafts e2e (real guards + temp SQLite)', () => {
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
    realtime.broadcastMock.mockClear();
    await deleteRows(orm, TourDrafts);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('keeps a draft, reads it back, replaces it with the latest write and forgets it', async () => {
    const empty = await request(server).get(PATH).set(as(OWNER));
    expect(empty.status).toBe(200);
    expect(empty.body).toEqual({ draft: null });

    const kept = await request(server)
      .put(PATH)
      .set(as(OWNER))
      .send({ payload: draftOf('Ridge') });
    expect(kept.status).toBe(200);
    expect(kept.body).toEqual({ draft: { payload: draftOf('Ridge'), updated_at: expect.any(String) } });
    expect((await request(server).get(PATH).set(as(OWNER))).body).toEqual(kept.body);

    const replaced = await request(server)
      .put(PATH)
      .set(as(OWNER))
      .send({ payload: draftOf('Ridge, longer') });
    expect(replaced.status).toBe(200);
    expect((await request(server).get(PATH).set(as(OWNER))).body.draft.payload).toBe(draftOf('Ridge, longer'));
    expect(await countRows(orm, TourDrafts)).toBe(1);
    expect(realtime.broadcastMock).not.toHaveBeenCalled();

    const forgotten = await request(server).delete(PATH).set(as(OWNER));
    expect(forgotten.status).toBe(200);
    expect(forgotten.body).toEqual({ success: true });
    expect((await request(server).get(PATH).set(as(OWNER))).body).toEqual({ draft: null });
    // A draft already gone is no error: a replayed discard lands the same way.
    expect((await request(server).delete(PATH).set(as(OWNER))).status).toBe(200);
  });

  it('keeps every traveller to their own draft', async () => {
    await request(server)
      .put(PATH)
      .set(as(OWNER))
      .send({ payload: draftOf('Owner') });
    const member = await request(server).get(PATH).set(as(MEMBER));
    expect(member.status).toBe(200);
    expect(member.body).toEqual({ draft: null });
    expect((await request(server).delete(PATH).set(as(MEMBER))).status).toBe(200);
    expect((await request(server).get(PATH).set(as(OWNER))).body.draft.payload).toBe(draftOf('Owner'));
  });

  it('refuses a member without place_edit, a stranger, no session and a body that is no draft', async () => {
    expect(
      (
        await request(server)
          .put(PATH)
          .set(as(MEMBER))
          .send({ payload: draftOf('No') })
      ).status,
    ).toBe(403);
    expect((await request(server).get(PATH).set(as(OUTSIDER))).status).toBe(404);
    expect(
      (
        await request(server)
          .put(PATH)
          .set(as(OUTSIDER))
          .send({ payload: draftOf('No') })
      ).status,
    ).toBe(404);
    expect((await request(server).delete(PATH).set(as(OUTSIDER))).status).toBe(404);
    expect((await request(server).get(PATH)).status).toBe(401);
    // One request after the other: several at once against the one test server reset each other's connection.
    const badPayloads = [undefined, '', '[1]', '"text"', '{broken', { version: 11 }];
    const refused = await badPayloads.reduce<Promise<{ payload: string; status: number }[]>>(
      async (earlier, payload) => {
        const done = await earlier;
        const res = await request(server).put(PATH).set(as(OWNER)).send({ payload });
        return [...done, { payload: JSON.stringify(payload), status: res.status }];
      },
      Promise.resolve([]),
    );
    expect(refused).toEqual(badPayloads.map((payload) => ({ payload: JSON.stringify(payload), status: 400 })));
    expect(await countRows(orm, TourDrafts)).toBe(0);
  });

  it('answers as not found while the Tours addon is off', async () => {
    await setAddonEnabled(orm, 'tours', false);
    const off = await request(server).get(PATH).set(as(OWNER));
    expect(off.status).toBe(404);
    expect(off.body).toEqual({ error: 'Tours addon is not enabled' });
  });
});
