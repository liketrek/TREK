/**
 * To-do module e2e — exercises the migrated /api/trips/:tripId/todo endpoints
 * through the real JwtAuthGuard against a migrated temp SQLite db
 * (createSnapshotTestDb()). TodoService and the trip access check run their
 * real queries through the repositories; rows are seeded and read through the
 * factories in tests/helpers/factories. Only the permission check stays
 * mocked.
 */
import { db } from '../../src/db/database';
import { TodoCategoryAssignees } from '../../src/db/entities/TodoCategoryAssignees.entity';
import { TodoItems } from '../../src/db/entities/TodoItems.entity';
import { TripMembers } from '../../src/db/entities/TripMembers.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { TodoModule } from '../../src/nest/todo/todo.module';
import { countRows, deleteRows, findRow, findRows, insertRow } from '../helpers/factories/rows';
import { addTripMember, makeTrip } from '../helpers/factories/trips';
import { makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

let orm: TestOrm;

function insertItem(
  tripId: number,
  name: string,
  extra: Partial<{ sort_order: number; due_date: string }> = {},
): Promise<number> {
  return insertRow(orm, TodoItems, {
    trip: tripId,
    name,
    sort_order: extra.sort_order ?? 0,
    due_date: extra.due_date ?? null,
  });
}

describe('To-do e2e (real auth guard + real SQL over temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, TodoModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): the DTO-typed bodies
    // validate by metatype, exactly as they do under buildApp().
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    orm = await createTestOrm(db);
    // Usernames are unique on the migrated schema. User 2 carries 'e2e-user',
    // the name the category assignee case below reads back for it.
    await makeUser(orm, { id: 1, username: 'e2e-owner', email: 'e2e@example.test' });
    await makeUser(orm, { id: 2, username: 'e2e-user', email: 'stranger@example.test' });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await deleteRows(orm, TodoCategoryAssignees);
    await deleteRows(orm, TodoItems);
    await deleteRows(orm, TripMembers);
    await deleteRows(orm, Trips);
    tripId = (await makeTrip(orm, 1, { title: 'Trip' })).id;
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get(`/api/trips/${tripId}/todo`);
    expect(res.status).toBe(401);
  });

  it('200 list ordered by sort_order', async () => {
    await insertItem(tripId, 'Second', { sort_order: 1 });
    await insertItem(tripId, 'First', { sort_order: 0 });
    const res = await request(server).get(`/api/trips/${tripId}/todo`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.items.map((i: { name: string }) => i.name)).toEqual(['First', 'Second']);
  });

  it('404 when the trip is not accessible', async () => {
    const res = await request(server).get(`/api/trips/${tripId}/todo`).set('Cookie', sessionCookie(2));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('201 on create, inserting the row with the legacy defaults and incrementing sort_order', async () => {
    await insertItem(tripId, 'Existing', { sort_order: 4 });
    const res = await request(server)
      .post(`/api/trips/${tripId}/todo`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Book hotel' });
    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({ name: 'Book hotel', checked: 0, priority: 0, sort_order: 5 });
    expect((await findRow(orm, TodoItems, { id: res.body.item.id }))!.name).toBe('Book hotel');
  });

  it('400 from the Zod pipe on create without a name', async () => {
    const res = await request(server).post(`/api/trips/${tripId}/todo`).set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('name');
  });

  it('400 from the Zod pipe on reorder without orderedIds', async () => {
    const res = await request(server).put(`/api/trips/${tripId}/todo/reorder`).set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('orderedIds');
  });

  it('accepts the legacy numeric checked form through the pipe', async () => {
    const id = await insertItem(tripId, 'Toggle me');
    const res = await request(server)
      .put(`/api/trips/${tripId}/todo/${id}`)
      .set('Cookie', sessionCookie(1))
      .send({ checked: 1 });
    expect(res.status).toBe(200);
    expect(res.body.item.checked).toBe(1);
  });

  it('403 on create without permission, writing nothing', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server)
      .post(`/api/trips/${tripId}/todo`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'X' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
    expect(await countRows(orm, TodoItems)).toBe(0);
  });

  it('200 on update; a body key with null clears the field, omitted keys stay', async () => {
    const id = await insertItem(tripId, 'Task', { due_date: '2026-06-01' });
    const renamed = await request(server)
      .put(`/api/trips/${tripId}/todo/${id}`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Renamed' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.item).toMatchObject({ id, name: 'Renamed', due_date: '2026-06-01' });
    const cleared = await request(server)
      .put(`/api/trips/${tripId}/todo/${id}`)
      .set('Cookie', sessionCookie(1))
      .send({ due_date: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.item.due_date).toBeNull();
  });

  it('404 on update of a missing item', async () => {
    const res = await request(server)
      .put(`/api/trips/${tripId}/todo/9999`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Item not found' });
  });

  // Plan 4 Task 8b (U6) — :id is now parsed ONCE at the controller gate
  // (toRowId), so a non-numeric id 404s cleanly through that guard instead
  // of falling through to the repository and depending on SQLite's
  // column-affinity CAST to simply not match (the legacy outcome was also a
  // 404, same status — this pins the gate itself, not just the status).
  it('404 (not 500) on update with a non-numeric :id', async () => {
    const res = await request(server)
      .put(`/api/trips/${tripId}/todo/abc`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Item not found' });
  });

  it('404 (not 500) on delete with a non-numeric :id', async () => {
    const res = await request(server).delete(`/api/trips/${tripId}/todo/abc`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Item not found' });
  });

  it('200 on reorder, persisting the new sort_order', async () => {
    const a = await insertItem(tripId, 'A', { sort_order: 0 });
    const b = await insertItem(tripId, 'B', { sort_order: 1 });
    const res = await request(server)
      .put(`/api/trips/${tripId}/todo/reorder`)
      .set('Cookie', sessionCookie(1))
      .send({ orderedIds: [b, a] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    const rows = await findRows(orm, TodoItems, { trip: tripId }, { sort_order: 'asc' });
    expect(rows.map((r) => r.id)).toEqual([b, a]);
  });

  it('200 on delete, removing the row; 404 when already gone', async () => {
    const id = await insertItem(tripId, 'Gone');
    const ok = await request(server).delete(`/api/trips/${tripId}/todo/${id}`).set('Cookie', sessionCookie(1));
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ success: true });
    expect(await findRow(orm, TodoItems, { id })).toBeNull();
    const missing = await request(server).delete(`/api/trips/${tripId}/todo/${id}`).set('Cookie', sessionCookie(1));
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Item not found' });
  });

  it('category assignees round-trip: PUT replaces, GET groups by category', async () => {
    await addTripMember(orm, tripId, 2);
    const put = await request(server)
      .put(`/api/trips/${tripId}/todo/category-assignees/Booking`)
      .set('Cookie', sessionCookie(1))
      .send({ user_ids: [1, 2] });
    expect(put.status).toBe(200);
    expect(put.body.assignees).toHaveLength(2);
    const get = await request(server)
      .get(`/api/trips/${tripId}/todo/category-assignees`)
      .set('Cookie', sessionCookie(1));
    expect(get.status).toBe(200);
    expect(get.body.assignees.Booking).toHaveLength(2);
    const replaced = await request(server)
      .put(`/api/trips/${tripId}/todo/category-assignees/Booking`)
      .set('Cookie', sessionCookie(1))
      .send({ user_ids: [2] });
    expect(replaced.body.assignees).toEqual([{ user_id: 2, username: 'e2e-user', avatar: null }]);
  });
});
