/**
 * Trip tags e2e: the /api/trips/:tripId/tags routes through the real
 * JwtAuthGuard and TripAccessGuard against a migrated temp SQLite db
 * (createSnapshotTestDb()). TripTagsService and the trip access check run
 * their real queries; rows are seeded and read through the factories in
 * tests/helpers/factories. The permission check is a spy, so a case can take
 * the `place_edit` right away, and the broadcasts go to a FakeRealtimeService.
 */
import { Tags } from '../../src/db/entities/Tags.entity';
import { TripMembers } from '../../src/db/entities/TripMembers.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { RealtimeService } from '../../src/nest/realtime/realtime.service';
import { TagsModule } from '../../src/nest/tags/tags.module';
import { createSnapshotTestDb } from '../helpers/db-mock';
import { makeTag } from '../helpers/factories/places';
import { countRows, deleteRows, findRow } from '../helpers/factories/rows';
import { addTripMember, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { FakeRealtimeService } from '../helpers/fake-realtime';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

const db = createSnapshotTestDb();
const realtime = new FakeRealtimeService();
const broadcast = realtime.broadcastMock;

// A spy on the container's PermissionsService, created in beforeAll once the app is built.
let checkPermission: MockInstance;

let orm: TestOrm;

const OWNER = 1;
const MEMBER = 2;
const STRANGER = 3;

describe('Trip tags e2e (real auth and trip guards + real SQL over temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;
  let otherTripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, TagsModule],
    })
      .overrideProvider(RealtimeService)
      .useValue(realtime)
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): the DTO-typed bodies
    // validate by metatype, exactly as they do under buildApp().
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  const tagsPath = (trip = tripId) => `/api/trips/${trip}/tags`;

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Pinned ids: sessionCookie(n) signs for exactly these users.
    await makeUser(orm, { id: OWNER, username: 'e2e-owner', email: 'owner@example.test' });
    await makeUser(orm, { id: MEMBER, username: 'e2e-member', email: 'member@example.test' });
    await makeUser(orm, { id: STRANGER, username: 'e2e-stranger', email: 'stranger@example.test' });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await deleteRows(orm, Tags);
    await deleteRows(orm, TripMembers);
    await deleteRows(orm, Trips);
    tripId = (await makeTrip(orm, OWNER, { title: 'Lisbon' })).id;
    await addTripMember(orm, tripId, MEMBER, OWNER);
    otherTripId = (await makeTrip(orm, STRANGER, { title: 'Porto' })).id;
    checkPermission.mockResolvedValue(true);
    broadcast.mockClear();
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get(tagsPath());
    expect(res.status).toBe(401);
  });

  it('200 list: the same tags for every member, by name, without personal ones', async () => {
    await makeTag(orm, OWNER, { trip: tripId, name: 'Zone' });
    await makeTag(orm, MEMBER, { trip: tripId, name: 'Activity' });
    await makeTag(orm, OWNER, { name: 'personal' });
    await makeTag(orm, STRANGER, { trip: otherTripId, name: 'Elsewhere' });

    const asOwner = await request(server).get(tagsPath()).set('Cookie', sessionCookie(OWNER));
    const asMember = await request(server).get(tagsPath()).set('Cookie', sessionCookie(MEMBER));

    expect(asOwner.status).toBe(200);
    expect(asOwner.body.tags.map((tag: { name: string }) => tag.name)).toEqual(['Activity', 'Zone']);
    expect(asMember.body).toEqual(asOwner.body);
  });

  it('404 on every route for a trip the user is not on', async () => {
    const tag = await makeTag(orm, OWNER, { trip: tripId, name: 'Zone' });
    const cookie = sessionCookie(STRANGER);

    const list = await request(server).get(tagsPath()).set('Cookie', cookie);
    const create = await request(server).post(tagsPath()).set('Cookie', cookie).send({ name: 'Mine' });
    const update = await request(server).put(`${tagsPath()}/${tag.id}`).set('Cookie', cookie).send({ name: 'Mine' });
    const remove = await request(server).delete(`${tagsPath()}/${tag.id}`).set('Cookie', cookie);

    for (const res of [list, create, update, remove]) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Trip not found' });
    }
    expect(await findRow(orm, Tags, { id: tag.id })).toMatchObject({ name: 'Zone' });
  });

  it('201 on create by a member: the tag is the trip’s, with the default colour, and the trip is told', async () => {
    const res = await request(server)
      .post(tagsPath())
      .set('Cookie', sessionCookie(MEMBER))
      .set('X-Socket-Id', 'sock-9')
      .send({ name: '  Monument ' });

    expect(res.status).toBe(201);
    expect(res.body.tag).toMatchObject({ name: 'Monument', color: '#10b981', trip_id: tripId, user_id: MEMBER });
    expect(await findRow(orm, Tags, { id: res.body.tag.id })).toMatchObject({ name: 'Monument', trip_id: tripId });
    expect(broadcast.mock.calls).toEqual([[String(tripId), 'tripTags:changed', {}, 'sock-9']]);
  });

  it('201 on create with a name the trip has: answers that tag and makes no second one', async () => {
    const existing = await makeTag(orm, OWNER, { trip: tripId, name: 'Monument', color: '#ff0000' });

    const res = await request(server)
      .post(tagsPath())
      .set('Cookie', sessionCookie(MEMBER))
      .send({ name: 'MONUMENT', color: '#00ff00' });

    expect(res.status).toBe(201);
    expect(res.body.tag).toMatchObject({ id: existing.id, name: 'Monument', color: '#ff0000' });
    expect(await countRows(orm, Tags, { trip: tripId })).toBe(1);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('400 from the Zod pipe on create without a name, and with a colour that is not hex', async () => {
    const cookie = sessionCookie(OWNER);
    const unnamed = await request(server).post(tagsPath()).set('Cookie', cookie).send({ name: '   ' });
    const coloured = await request(server).post(tagsPath()).set('Cookie', cookie).send({ name: 'Zone', color: 'red' });

    expect(unnamed.status).toBe(400);
    expect(unnamed.body.error).toContain('name');
    expect(coloured.status).toBe(400);
    expect(coloured.body.error).toContain('color');
    expect(await countRows(orm, Tags, { trip: tripId })).toBe(0);
  });

  it('403 on every write without the right to edit the trip’s places; reading stays open', async () => {
    const tag = await makeTag(orm, OWNER, { trip: tripId, name: 'Zone' });
    checkPermission.mockResolvedValue(false);
    const cookie = sessionCookie(MEMBER);

    const create = await request(server).post(tagsPath()).set('Cookie', cookie).send({ name: 'Mine' });
    const update = await request(server).put(`${tagsPath()}/${tag.id}`).set('Cookie', cookie).send({ name: 'Mine' });
    const remove = await request(server).delete(`${tagsPath()}/${tag.id}`).set('Cookie', cookie);
    const list = await request(server).get(tagsPath()).set('Cookie', cookie);

    for (const res of [create, update, remove]) {
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'No permission' });
    }
    expect(list.status).toBe(200);
    expect(list.body.tags.map((row: { name: string }) => row.name)).toEqual(['Zone']);
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('200 on update: a member renames and recolours a tag the owner created', async () => {
    const tag = await makeTag(orm, OWNER, { trip: tripId, name: 'Monument', color: '#ff0000' });

    const res = await request(server)
      .put(`${tagsPath()}/${tag.id}`)
      .set('Cookie', sessionCookie(MEMBER))
      .send({ name: 'Landmark', color: '#0ea5e9' });

    expect(res.status).toBe(200);
    expect(res.body.tag).toMatchObject({ id: tag.id, name: 'Landmark', color: '#0ea5e9', user_id: OWNER });
    expect(broadcast.mock.calls).toEqual([[String(tripId), 'tripTags:changed', {}, undefined]]);
  });

  it('409 on update onto the name of another tag of the trip', async () => {
    const tag = await makeTag(orm, OWNER, { trip: tripId, name: 'Monument' });
    await makeTag(orm, OWNER, { trip: tripId, name: 'Zone' });

    const res = await request(server)
      .put(`${tagsPath()}/${tag.id}`)
      .set('Cookie', sessionCookie(OWNER))
      .send({ name: 'zone' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'A tag with this name already exists' });
    expect(await findRow(orm, Tags, { id: tag.id })).toMatchObject({ name: 'Monument' });
  });

  it('404 on update and delete of a personal tag and of another trip’s tag', async () => {
    const personal = await makeTag(orm, OWNER, { name: 'personal' });
    const foreign = await makeTag(orm, STRANGER, { trip: otherTripId, name: 'Elsewhere' });
    const cookie = sessionCookie(OWNER);

    const renamePersonal = await request(server)
      .put(`${tagsPath()}/${personal.id}`)
      .set('Cookie', cookie)
      .send({ name: 'Mine' });
    const deletePersonal = await request(server).delete(`${tagsPath()}/${personal.id}`).set('Cookie', cookie);
    const renameForeign = await request(server)
      .put(`${tagsPath()}/${foreign.id}`)
      .set('Cookie', cookie)
      .send({ name: 'Mine' });
    const deleteForeign = await request(server).delete(`${tagsPath()}/${foreign.id}`).set('Cookie', cookie);

    for (const res of [renamePersonal, deletePersonal, renameForeign, deleteForeign]) {
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Tag not found' });
    }
    expect(await countRows(orm, Tags, {})).toBe(2);
  });

  it('200 on delete: the row goes and the trip is told', async () => {
    const tag = await makeTag(orm, OWNER, { trip: tripId, name: 'Monument' });

    const res = await request(server)
      .delete(`${tagsPath()}/${tag.id}`)
      .set('Cookie', sessionCookie(MEMBER))
      .set('X-Socket-Id', 'sock-9');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(await findRow(orm, Tags, { id: tag.id })).toBeNull();
    expect(broadcast.mock.calls).toEqual([[String(tripId), 'tripTags:changed', {}, 'sock-9']]);
  });

  it('a tag of a trip stays off its creator’s personal /api/tags, which cannot change it either', async () => {
    const tag = await makeTag(orm, OWNER, { trip: tripId, name: 'Monument' });
    const cookie = sessionCookie(OWNER);

    const list = await request(server).get('/api/tags').set('Cookie', cookie);
    const update = await request(server).put(`/api/tags/${tag.id}`).set('Cookie', cookie).send({ name: 'Mine' });
    const remove = await request(server).delete(`/api/tags/${tag.id}`).set('Cookie', cookie);

    expect(list.body).toEqual({ tags: [] });
    expect(update.status).toBe(404);
    expect(remove.status).toBe(404);
    expect(await findRow(orm, Tags, { id: tag.id })).toMatchObject({ name: 'Monument' });
  });
});
