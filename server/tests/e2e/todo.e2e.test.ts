/**
 * To-do module e2e — exercises the migrated /api/trips/:tripId/todo endpoints
 * through the real JwtAuthGuard against a temp SQLite db. TodoService runs its
 * real SQL via DatabaseModule (the DATABASE_CONNECTION factory picks up the
 * mocked db singleton); trip access resolves through a real-SQL canAccessTrip
 * over the temp db. Only the permission check and the WebSocket broadcast stay
 * mocked.
 */
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { PermissionsService } from '../../src/nest/permissions/permissions.service';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { TodoModule } from '../../src/nest/todo/todo.module';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    avatar TEXT);`);
  tmp.exec('CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT);');
  tmp.exec('CREATE TABLE trip_members (trip_id INTEGER NOT NULL, user_id INTEGER NOT NULL);');
  tmp.exec(`CREATE TABLE todo_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    checked INTEGER NOT NULL DEFAULT 0,
    category TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    due_date TEXT,
    description TEXT,
    assigned_user_id INTEGER,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  tmp.exec(`CREATE TABLE todo_category_assignees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    category_name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    UNIQUE(trip_id, category_name, user_id)
  );`);
  // StorageRegistryService (behind StorageModule, now in this module chain) reads
  // this at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  // Real-SQL trip access over the temp db — TodoService.verifyTripAccess and
  // DatabaseModule both read the mocked singleton.
  canAccessTrip: (tripId: number | string, userId: number) =>
    db
      .prepare(
        `
      SELECT t.id, t.user_id FROM trips t
      LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
      WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
    `,
      )
      .get(userId, tripId, userId),
  isOwner: () => false,
  getPlaceWithTags: () => null,
  closeDb: () => {},
  reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

function insertItem(
  tripId: number,
  name: string,
  extra: Partial<{ sort_order: number; due_date: string }> = {},
): number {
  const res = db
    .prepare('INSERT INTO todo_items (trip_id, name, sort_order, due_date) VALUES (?, ?, ?, ?)')
    .run(tripId, name, extra.sort_order ?? 0, extra.due_date ?? null);
  return Number(res.lastInsertRowid);
}

describe('To-do e2e (real auth guard + real SQL over temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, RealtimeModule, TodoModule],
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
    seedUser(db as never, { id: 1 });
    seedUser(db as never, { id: 2, email: 'stranger@example.test' });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.exec('DELETE FROM todo_category_assignees');
    db.exec('DELETE FROM todo_items');
    db.exec('DELETE FROM trip_members');
    db.exec('DELETE FROM trips');
    tripId = Number(db.prepare('INSERT INTO trips (user_id, title) VALUES (1, ?)').run('Trip').lastInsertRowid);
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get(`/api/trips/${tripId}/todo`);
    expect(res.status).toBe(401);
  });

  it('200 list ordered by sort_order', async () => {
    insertItem(tripId, 'Second', { sort_order: 1 });
    insertItem(tripId, 'First', { sort_order: 0 });
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
    insertItem(tripId, 'Existing', { sort_order: 4 });
    const res = await request(server)
      .post(`/api/trips/${tripId}/todo`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Book hotel' });
    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({ name: 'Book hotel', checked: 0, priority: 0, sort_order: 5 });
    expect(db.prepare('SELECT name FROM todo_items WHERE id = ?').get(res.body.item.id)).toEqual({
      name: 'Book hotel',
    });
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
    const id = insertItem(tripId, 'Toggle me');
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
    expect((db.prepare('SELECT COUNT(*) AS n FROM todo_items').get() as { n: number }).n).toBe(0);
  });

  it('200 on update; a body key with null clears the field, omitted keys stay', async () => {
    const id = insertItem(tripId, 'Task', { due_date: '2026-06-01' });
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

  it('200 on reorder, persisting the new sort_order', async () => {
    const a = insertItem(tripId, 'A', { sort_order: 0 });
    const b = insertItem(tripId, 'B', { sort_order: 1 });
    const res = await request(server)
      .put(`/api/trips/${tripId}/todo/reorder`)
      .set('Cookie', sessionCookie(1))
      .send({ orderedIds: [b, a] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    const rows = db.prepare('SELECT id FROM todo_items WHERE trip_id = ? ORDER BY sort_order').all(tripId) as {
      id: number;
    }[];
    expect(rows.map((r) => r.id)).toEqual([b, a]);
  });

  it('200 on delete, removing the row; 404 when already gone', async () => {
    const id = insertItem(tripId, 'Gone');
    const ok = await request(server).delete(`/api/trips/${tripId}/todo/${id}`).set('Cookie', sessionCookie(1));
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ success: true });
    expect(db.prepare('SELECT id FROM todo_items WHERE id = ?').get(id)).toBeUndefined();
    const missing = await request(server).delete(`/api/trips/${tripId}/todo/${id}`).set('Cookie', sessionCookie(1));
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Item not found' });
  });

  it('category assignees round-trip: PUT replaces, GET groups by category', async () => {
    db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(tripId, 2);
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
