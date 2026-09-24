/**
 * Packing module e2e — exercises the migrated /api/trips/:tripId/packing
 * endpoints through the real JwtAuthGuard against a temp SQLite db.
 * PackingService runs its real SQL via DatabaseModule (the DATABASE_CONNECTION
 * factory picks up the mocked db singleton); trip access resolves through a
 * real-SQL canAccessTrip over the temp db. Only the permission check, the
 * WebSocket broadcast and the notification sender stay mocked.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    display_name TEXT, avatar TEXT);`);
  tmp.exec('CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT);');
  tmp.exec('CREATE TABLE trip_members (trip_id INTEGER NOT NULL, user_id INTEGER NOT NULL);');
  // The post-migration shape of the packing tables (schema.ts + migrations.ts).
  tmp.exec(`CREATE TABLE packing_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    checked INTEGER DEFAULT 0,
    category TEXT,
    sort_order INTEGER DEFAULT 0,
    weight_grams INTEGER,
    bag_id INTEGER,
    quantity INTEGER NOT NULL DEFAULT 1,
    is_private INTEGER NOT NULL DEFAULT 0,
    owner_id INTEGER,
    updated_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  tmp.exec(`CREATE TABLE packing_bags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    weight_limit_grams INTEGER,
    sort_order INTEGER DEFAULT 0,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  tmp.exec(`CREATE TABLE packing_bag_members (
    bag_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (bag_id, user_id)
  );`);
  tmp.exec(`CREATE TABLE packing_item_recipients (
    item_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    PRIMARY KEY (item_id, user_id)
  );`);
  tmp.exec(`CREATE TABLE packing_item_contributors (
    item_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'accepted',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (item_id, user_id)
  );`);
  tmp.exec(`CREATE TABLE packing_category_assignees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL,
    category_name TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    UNIQUE(trip_id, category_name, user_id)
  );`);
  tmp.exec(`CREATE TABLE packing_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );`);
  tmp.exec(`CREATE TABLE packing_template_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );`);
  tmp.exec(`CREATE TABLE packing_template_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
  );`);
  // StorageRegistryService (behind StorageModule, now in this module chain) reads
  // this at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  // Real-SQL trip access over the temp db — PackingService.verifyTripAccess and
  // DatabaseModule both read the mocked singleton.
  canAccessTrip: (tripId: number | string, userId: number) =>
    db.prepare(`
      SELECT t.id, t.user_id FROM trips t
      LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
      WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
    `).get(userId, tripId, userId),
  isOwner: () => false,
  getPlaceWithTags: () => null,
  closeDb: () => {},
  reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

import { PackingModule } from '../../src/nest/packing/packing.module';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

function insertItem(tripId: number, name: string, extra: Partial<{ sort_order: number; category: string; is_private: number; owner_id: number }> = {}): number {
  const res = db
    .prepare('INSERT INTO packing_items (trip_id, name, sort_order, category, is_private, owner_id, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)')
    .run(tripId, name, extra.sort_order ?? 0, extra.category ?? null, extra.is_private ?? 0, extra.owner_id ?? null);
  return Number(res.lastInsertRowid);
}

describe('Packing e2e (real auth guard + real SQL over temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, RealtimeModule, PackingModule] }).compile();
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
    seedUser(db as never, { id: 3, email: 'admin@example.test', role: 'admin' });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.exec('DELETE FROM packing_category_assignees');
    db.exec('DELETE FROM packing_template_items');
    db.exec('DELETE FROM packing_template_categories');
    db.exec('DELETE FROM packing_templates');
    db.exec('DELETE FROM packing_item_recipients');
    db.exec('DELETE FROM packing_item_contributors');
    db.exec('DELETE FROM packing_bag_members');
    db.exec('DELETE FROM packing_items');
    db.exec('DELETE FROM packing_bags');
    db.exec('DELETE FROM trip_members');
    db.exec('DELETE FROM trips');
    tripId = Number(db.prepare('INSERT INTO trips (user_id, title) VALUES (1, ?)').run('Trip').lastInsertRowid);
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get(`/api/trips/${tripId}/packing`);
    expect(res.status).toBe(401);
  });

  it('200 list, hiding another member\'s private items from the viewer (#858)', async () => {
    insertItem(tripId, 'Shared', { sort_order: 0 });
    insertItem(tripId, 'Secret', { sort_order: 1, is_private: 1, owner_id: 2 });
    const res = await request(server).get(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.items.map((i: { name: string }) => i.name)).toEqual(['Shared']);
  });

  it('404 when the trip is not accessible', async () => {
    const res = await request(server).get(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(2));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('201 on create, inserting the row with the legacy defaults', async () => {
    insertItem(tripId, 'Existing', { sort_order: 4 });
    const res = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({ name: 'Socks' });
    expect(res.status).toBe(201);
    // 'Other' is the unified category default (shared with bulkImport/saveAsTemplate).
    expect(res.body.item).toMatchObject({ name: 'Socks', checked: 0, category: 'Other', quantity: 1, sort_order: 5, owner_id: 1 });
    expect(db.prepare('SELECT name FROM packing_items WHERE id = ?').get(res.body.item.id)).toEqual({ name: 'Socks' });
  });

  it('201 on create persists weight_grams, bag_id and quantity (#2154)', async () => {
    const bag = await request(server).post(`/api/trips/${tripId}/packing/bags`).set('Cookie', sessionCookie(1)).send({ name: 'Carry-On' });
    const res = await request(server)
      .post(`/api/trips/${tripId}/packing`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Tent', weight_grams: 250, bag_id: bag.body.bag.id, quantity: 3 });
    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({ name: 'Tent', weight_grams: 250, bag_id: bag.body.bag.id, quantity: 3 });
    expect(db.prepare('SELECT weight_grams, bag_id, quantity FROM packing_items WHERE id = ?').get(res.body.item.id))
      .toEqual({ weight_grams: 250, bag_id: bag.body.bag.id, quantity: 3 });
  });

  it('400 "Bag not found" on create for a bag off the trip; camelCase keys still strip (#2154)', async () => {
    // A REAL bag on a different trip — existence alone must not be enough.
    const otherTripId = Number(db.prepare('INSERT INTO trips (user_id, title) VALUES (1, ?)').run('Other').lastInsertRowid);
    const foreignBag = Number(db.prepare('INSERT INTO packing_bags (trip_id, name) VALUES (?, ?)').run(otherTripId, 'Foreign').lastInsertRowid);

    const cross = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({ name: 'Tent', bag_id: foreignBag });
    expect(cross.status).toBe(400);
    expect(cross.body).toEqual({ error: 'Bag not found' });
    const dead = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({ name: 'Tent', bag_id: 99999 });
    expect(dead.status).toBe(400);
    expect(dead.body).toEqual({ error: 'Bag not found' });
    expect((db.prepare('SELECT COUNT(*) AS n FROM packing_items WHERE trip_id = ?').get(tripId) as { n: number }).n).toBe(0);

    // camelCase was never part of the contract: the keys strip as they always did.
    const camel = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({ name: 'Probe', weightGrams: 250, bagId: foreignBag });
    expect(camel.status).toBe(201);
    expect(camel.body.item).toMatchObject({ weight_grams: null, bag_id: null, quantity: 1 });
  });

  it('400 "Bag not found" on update for a bag off the trip, leaving the row alone (#2154)', async () => {
    const otherTripId = Number(db.prepare('INSERT INTO trips (user_id, title) VALUES (1, ?)').run('Other').lastInsertRowid);
    const foreignBag = Number(db.prepare('INSERT INTO packing_bags (trip_id, name) VALUES (?, ?)').run(otherTripId, 'Foreign').lastInsertRowid);
    const id = insertItem(tripId, 'Tent');
    const res = await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ bag_id: foreignBag });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Bag not found' });
    expect((db.prepare('SELECT bag_id FROM packing_items WHERE id = ?').get(id) as { bag_id: number | null }).bag_id).toBeNull();
  });

  it('403 on create without permission, writing nothing', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({ name: 'X' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
    expect((db.prepare('SELECT COUNT(*) AS n FROM packing_items').get() as { n: number }).n).toBe(0);
  });

  it('200 on update; bodyKeys gate the sentinel columns, omitted keys stay', async () => {
    const id = insertItem(tripId, 'Tent', { category: 'Gear' });
    const renamed = await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ name: 'Big tent' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.item).toMatchObject({ id, name: 'Big tent', category: 'Gear' });
    // weight_grams only writes when its key is present in the body.
    const weighted = await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ weight_grams: 1200 });
    expect(weighted.body.item.weight_grams).toBe(1200);
    const untouched = await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ name: 'Still big' });
    expect(untouched.body.item.weight_grams).toBe(1200);
  });

  it('404 on update of a missing item', async () => {
    const res = await request(server).put(`/api/trips/${tripId}/packing/9999`).set('Cookie', sessionCookie(1)).send({ name: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Item not found' });
  });

  it('409 with the server row when the x-base-updated-at token is stale (#1135)', async () => {
    const id = insertItem(tripId, 'Original');
    const res = await request(server)
      .put(`/api/trips/${tripId}/packing/${id}`)
      .set('Cookie', sessionCookie(1))
      .set('x-base-updated-at', '1999-01-01 00:00:00')
      .send({ name: 'Mine' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('conflict');
    expect(res.body.server.name).toBe('Original');
    // The row must NOT have been overwritten.
    expect((db.prepare('SELECT name FROM packing_items WHERE id = ?').get(id) as { name: string }).name).toBe('Original');
  });

  it('200 on delete, removing the row; 404 when already gone', async () => {
    const id = insertItem(tripId, 'Gone');
    const ok = await request(server).delete(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1));
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ success: true });
    expect(db.prepare('SELECT id FROM packing_items WHERE id = ?').get(id)).toBeUndefined();
    const missing = await request(server).delete(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1));
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Item not found' });
  });

  it('200 on reorder, persisting the new sort_order', async () => {
    const a = insertItem(tripId, 'A', { sort_order: 0 });
    const b = insertItem(tripId, 'B', { sort_order: 1 });
    const res = await request(server).put(`/api/trips/${tripId}/packing/reorder`).set('Cookie', sessionCookie(1)).send({ orderedIds: [b, a] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    const rows = db.prepare('SELECT id FROM packing_items WHERE trip_id = ? ORDER BY sort_order').all(tripId) as { id: number }[];
    expect(rows.map((r) => r.id)).toEqual([b, a]);
  });

  it('201 on import, skipping empty names and creating named bags', async () => {
    const res = await request(server)
      .post(`/api/trips/${tripId}/packing/import`)
      .set('Cookie', sessionCookie(1))
      .send({ items: [{ name: 'Shirt', bag: 'Carry-On' }, { name: '  ' }, { name: 'Pants', bag: 'Carry-On' }] });
    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);
    const bags = db.prepare('SELECT * FROM packing_bags WHERE trip_id = ?').all(tripId) as { name: string }[];
    expect(bags).toHaveLength(1);
    expect(bags[0].name).toBe('Carry-On');
  });

  it('400 on import with an empty array', async () => {
    const res = await request(server).post(`/api/trips/${tripId}/packing/import`).set('Cookie', sessionCookie(1)).send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'items must be a non-empty array' });
  });

  it('400 from the Zod pipe on create without a name', async () => {
    const res = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('name');
  });

  it('400 from the Zod pipe on reorder without orderedIds', async () => {
    const res = await request(server).put(`/api/trips/${tripId}/packing/reorder`).set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('orderedIds');
  });

  it('400 from the Zod pipe on sharing with an invalid visibility', async () => {
    const id = insertItem(tripId, 'Tent');
    const res = await request(server).put(`/api/trips/${tripId}/packing/${id}/sharing`).set('Cookie', sessionCookie(1)).send({ visibility: 'secret' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('visibility');
  });

  it('accepts the legacy numeric checked form through the pipe', async () => {
    const id = insertItem(tripId, 'Toggle me');
    const res = await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ checked: 1 });
    expect(res.status).toBe(200);
    expect(res.body.item.checked).toBe(1);
  });

  it('whitespace-only bag name still gets the bespoke 400', async () => {
    const res = await request(server).post(`/api/trips/${tripId}/packing/bags`).set('Cookie', sessionCookie(1)).send({ name: '   ' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Name is required' });
  });

  it('bags round-trip: 201 create (default color), 200 update (COALESCE), 200 delete, then 404', async () => {
    const created = await request(server).post(`/api/trips/${tripId}/packing/bags`).set('Cookie', sessionCookie(1)).send({ name: 'Duffel' });
    expect(created.status).toBe(201);
    expect(created.body.bag).toMatchObject({ name: 'Duffel', color: '#6366f1' });
    const bagId = created.body.bag.id;

    const updated = await request(server).put(`/api/trips/${tripId}/packing/bags/${bagId}`).set('Cookie', sessionCookie(1)).send({ color: '#ff0000' });
    expect(updated.status).toBe(200);
    expect(updated.body.bag).toMatchObject({ name: 'Duffel', color: '#ff0000' });

    // weight_limit_grams follows the bodyKeys protocol: set, keep when omitted, clear with null.
    const limited = await request(server).put(`/api/trips/${tripId}/packing/bags/${bagId}`).set('Cookie', sessionCookie(1)).send({ weight_limit_grams: 8000 });
    expect(limited.body.bag.weight_limit_grams).toBe(8000);
    const kept = await request(server).put(`/api/trips/${tripId}/packing/bags/${bagId}`).set('Cookie', sessionCookie(1)).send({ name: 'Duffel XL' });
    expect(kept.body.bag.weight_limit_grams).toBe(8000);
    const cleared = await request(server).put(`/api/trips/${tripId}/packing/bags/${bagId}`).set('Cookie', sessionCookie(1)).send({ weight_limit_grams: null });
    expect(cleared.body.bag.weight_limit_grams).toBeNull();

    const deleted = await request(server).delete(`/api/trips/${tripId}/packing/bags/${bagId}`).set('Cookie', sessionCookie(1));
    expect(deleted.status).toBe(200);
    expect(deleted.body).toEqual({ success: true });
    const missing = await request(server).delete(`/api/trips/${tripId}/packing/bags/${bagId}`).set('Cookie', sessionCookie(1));
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Bag not found' });
  });

  it('201 on bag create persists weight_limit_grams (#2154)', async () => {
    const res = await request(server).post(`/api/trips/${tripId}/packing/bags`).set('Cookie', sessionCookie(1)).send({ name: 'Backpack', weight_limit_grams: 8000 });
    expect(res.status).toBe(201);
    expect(res.body.bag).toMatchObject({ name: 'Backpack', weight_limit_grams: 8000 });
    expect((db.prepare('SELECT weight_limit_grams FROM packing_bags WHERE id = ?').get(res.body.bag.id) as { weight_limit_grams: number | null }).weight_limit_grams).toBe(8000);
  });

  it('bag members: sets roster members only, dropping off-trip user ids', async () => {
    db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(tripId, 2);
    const created = await request(server).post(`/api/trips/${tripId}/packing/bags`).set('Cookie', sessionCookie(1)).send({ name: 'Main' });
    const bagId = created.body.bag.id;
    const res = await request(server)
      .put(`/api/trips/${tripId}/packing/bags/${bagId}/members`)
      .set('Cookie', sessionCookie(1))
      .send({ user_ids: [1, 2, 999] });
    expect(res.status).toBe(200);
    expect(res.body.members.map((m: { user_id: number }) => m.user_id).sort()).toEqual([1, 2]);
  });

  it('apply-template: 200 with the added items; 404 for an empty template', async () => {
    const templateId = Number(db.prepare('INSERT INTO packing_templates (name, created_by) VALUES (?, 1)').run('Camping').lastInsertRowid);
    const catId = Number(db.prepare('INSERT INTO packing_template_categories (template_id, name, sort_order) VALUES (?, ?, 0)').run(templateId, 'Gear').lastInsertRowid);
    db.prepare('INSERT INTO packing_template_items (category_id, name, sort_order) VALUES (?, ?, 0)').run(catId, 'Tent');

    const ok = await request(server).post(`/api/trips/${tripId}/packing/apply-template/${templateId}`).set('Cookie', sessionCookie(1)).send({});
    expect(ok.status).toBe(200); // @HttpCode(200) — the legacy POST returned 200
    expect(ok.body.count).toBe(1);
    expect(ok.body.items[0]).toMatchObject({ name: 'Tent', category: 'Gear' });

    const emptyId = Number(db.prepare('INSERT INTO packing_templates (name, created_by) VALUES (?, 1)').run('Empty').lastInsertRowid);
    const missing = await request(server).post(`/api/trips/${tripId}/packing/apply-template/${emptyId}`).set('Cookie', sessionCookie(1)).send({});
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Template not found or empty' });
  });

  it('save-as-template: 403 for non-admins, 201 for an admin with items', async () => {
    db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(tripId, 3);
    insertItem(tripId, 'Shirt', { category: 'Clothes' });

    const denied = await request(server).post(`/api/trips/${tripId}/packing/save-as-template`).set('Cookie', sessionCookie(1)).send({ name: 'Tpl' });
    expect(denied.status).toBe(403);
    expect(denied.body).toEqual({ error: 'Admin access required' });

    const saved = await request(server).post(`/api/trips/${tripId}/packing/save-as-template`).set('Cookie', sessionCookie(3)).send({ name: 'Tpl' });
    expect(saved.status).toBe(201);
    expect(saved.body.template).toMatchObject({ name: 'Tpl', categoryCount: 1, itemCount: 1 });
  });

  it('category assignees round-trip: PUT replaces, GET groups by category', async () => {
    db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(tripId, 2);
    const put = await request(server)
      .put(`/api/trips/${tripId}/packing/category-assignees/Clothes`)
      .set('Cookie', sessionCookie(1))
      .send({ user_ids: [1, 2] });
    expect(put.status).toBe(200);
    expect(put.body.assignees).toHaveLength(2);
    const get = await request(server).get(`/api/trips/${tripId}/packing/category-assignees`).set('Cookie', sessionCookie(1));
    expect(get.status).toBe(200);
    expect(get.body.assignees.Clothes).toHaveLength(2);
    const replaced = await request(server)
      .put(`/api/trips/${tripId}/packing/category-assignees/Clothes`)
      .set('Cookie', sessionCookie(1))
      .send({ user_ids: [2] });
    expect(replaced.body.assignees.map((m: { user_id: number }) => m.user_id)).toEqual([2]);
  });
});
