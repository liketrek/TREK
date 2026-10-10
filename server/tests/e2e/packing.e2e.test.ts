/**
 * Packing module e2e — exercises the migrated /api/trips/:tripId/packing
 * endpoints through the real JwtAuthGuard against a migrated temp SQLite db.
 * PackingService runs its real SQL via DatabaseModule (the DATABASE_CONNECTION
 * factory picks up the mocked db singleton); trip access resolves through the
 * real repositories over the temp db. Only the permission check and
 * the notification sender stay mocked.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

import { PackingModule } from '../../src/nest/packing/packing.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { db } from '../../src/db/database';
import { dbNow } from '../../src/db/types/db-timestamp.type';
import { PackingBags } from '../../src/db/entities/PackingBags.entity';
import { PackingCategoryAssignees } from '../../src/db/entities/PackingCategoryAssignees.entity';
import { PackingItemContributors } from '../../src/db/entities/PackingItemContributors.entity';
import { PackingItems } from '../../src/db/entities/PackingItems.entity';
import { PackingTemplateCategories } from '../../src/db/entities/PackingTemplateCategories.entity';
import { PackingTemplateItems } from '../../src/db/entities/PackingTemplateItems.entity';
import { PackingTemplates } from '../../src/db/entities/PackingTemplates.entity';
import { TripMembers } from '../../src/db/entities/TripMembers.entity';
import { Trips } from '../../src/db/entities/Trips.entity';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { makeTrip } from '../helpers/factories/trips';
import { countRows, deleteRows, findRow, findRows, insertRow } from '../helpers/factories/rows';

let orm: TestOrm;

function insertItem(tripId: number, name: string, extra: Partial<{ sort_order: number; category: string; is_private: number; owner_id: number }> = {}): Promise<number> {
  return insertRow(orm, PackingItems, {
    trip: tripId, name, sort_order: extra.sort_order ?? 0, category: extra.category ?? null,
    is_private: extra.is_private ?? 0, owner: extra.owner_id ?? null, updated_at: dbNow(),
  });
}

/** A trip owned by user 1, the way every case starts. */
async function insertTrip(title: string): Promise<number> {
  return (await makeTrip(orm, 1, { title })).id;
}

describe('Packing e2e (real auth guard + real SQL over migrated temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let tripId: number;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), RealtimeModule, PackingModule] }).compile();
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
    // Pinned ids: sessionCookie(1), (2) and (3) sign for exactly these users.
    await makeUser(orm, { id: 1, email: 'e2e@example.test' });
    await makeUser(orm, { id: 2, email: 'stranger@example.test' });
    await makeAdmin(orm, { id: 3, email: 'admin@example.test' });
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await deleteRows(orm, PackingCategoryAssignees);
    await deleteRows(orm, PackingTemplateItems);
    await deleteRows(orm, PackingTemplateCategories);
    await deleteRows(orm, PackingTemplates);
    await deleteRows(orm, PackingItemContributors);
    // packing_item_recipients and packing_bag_members have no entity of their
    // own; both cascade on delete from their item and bag, so the two deletes
    // below clear them too (foreign keys are on in the snapshot database).
    await deleteRows(orm, PackingItems);
    await deleteRows(orm, PackingBags);
    await deleteRows(orm, TripMembers);
    await deleteRows(orm, Trips);
    tripId = await insertTrip('Trip');
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get(`/api/trips/${tripId}/packing`);
    expect(res.status).toBe(401);
  });

  it('200 list, hiding another member\'s private items from the viewer (#858)', async () => {
    await insertItem(tripId, 'Shared', { sort_order: 0 });
    await insertItem(tripId, 'Secret', { sort_order: 1, is_private: 1, owner_id: 2 });
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
    await insertItem(tripId, 'Existing', { sort_order: 4 });
    const res = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({ name: 'Socks' });
    expect(res.status).toBe(201);
    // 'Other' is the unified category default (shared with bulkImport/saveAsTemplate).
    expect(res.body.item).toMatchObject({ name: 'Socks', checked: 0, category: 'Other', quantity: 1, sort_order: 5, owner_id: 1 });
    expect((await findRow(orm, PackingItems, { id: res.body.item.id }))?.name).toBe('Socks');
  });

  it('201 on create persists weight_grams, bag_id and quantity (#2154)', async () => {
    const bag = await request(server).post(`/api/trips/${tripId}/packing/bags`).set('Cookie', sessionCookie(1)).send({ name: 'Carry-On' });
    const res = await request(server)
      .post(`/api/trips/${tripId}/packing`)
      .set('Cookie', sessionCookie(1))
      .send({ name: 'Tent', weight_grams: 250, bag_id: bag.body.bag.id, quantity: 3 });
    expect(res.status).toBe(201);
    expect(res.body.item).toMatchObject({ name: 'Tent', weight_grams: 250, bag_id: bag.body.bag.id, quantity: 3 });
    expect(await findRow(orm, PackingItems, { id: res.body.item.id }))
      .toMatchObject({ weight_grams: 250, bag_id: bag.body.bag.id, quantity: 3 });
  });

  it('400 "Bag not found" on create for a bag off the trip; camelCase keys still strip (#2154)', async () => {
    // A REAL bag on a different trip — existence alone must not be enough.
    const otherTripId = await insertTrip('Other');
    const foreignBag = await insertRow(orm, PackingBags, { trip: otherTripId, name: 'Foreign' });

    const cross = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({ name: 'Tent', bag_id: foreignBag });
    expect(cross.status).toBe(400);
    expect(cross.body).toEqual({ error: 'Bag not found' });
    const dead = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({ name: 'Tent', bag_id: 99999 });
    expect(dead.status).toBe(400);
    expect(dead.body).toEqual({ error: 'Bag not found' });
    expect(await countRows(orm, PackingItems, { trip: tripId })).toBe(0);

    // camelCase was never part of the contract: the keys strip as they always did.
    const camel = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({ name: 'Probe', weightGrams: 250, bagId: foreignBag });
    expect(camel.status).toBe(201);
    expect(camel.body.item).toMatchObject({ weight_grams: null, bag_id: null, quantity: 1 });
  });

  it('400 "Bag not found" on update for a bag off the trip, leaving the row alone (#2154)', async () => {
    const otherTripId = await insertTrip('Other');
    const foreignBag = await insertRow(orm, PackingBags, { trip: otherTripId, name: 'Foreign' });
    const id = await insertItem(tripId, 'Tent');
    const res = await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ bag_id: foreignBag });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Bag not found' });
    expect((await findRow(orm, PackingItems, { id: id }))?.bag_id).toBeNull();
  });

  it('403 on create without permission, writing nothing', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).post(`/api/trips/${tripId}/packing`).set('Cookie', sessionCookie(1)).send({ name: 'X' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
    expect(await countRows(orm, PackingItems)).toBe(0);
  });

  it('200 on update; bodyKeys gate the sentinel columns, omitted keys stay', async () => {
    const id = await insertItem(tripId, 'Tent', { category: 'Gear' });
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

  // Plan 4 Task 8b (U6) — :id is now parsed ONCE at the controller gate
  // (toRowId), so a non-numeric id 404s cleanly through that guard instead
  // of falling through to the repository and depending on SQLite's
  // column-affinity CAST to simply not match (the legacy outcome was also a
  // 404, same status — this pins the gate itself, not just the status).
  it('404 (not 500) on update with a non-numeric :id', async () => {
    const res = await request(server).put(`/api/trips/${tripId}/packing/abc`).set('Cookie', sessionCookie(1)).send({ name: 'X' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Item not found' });
  });

  it('409 with the server row when the x-base-updated-at token is stale (#1135)', async () => {
    const id = await insertItem(tripId, 'Original');
    const res = await request(server)
      .put(`/api/trips/${tripId}/packing/${id}`)
      .set('Cookie', sessionCookie(1))
      .set('x-base-updated-at', '1999-01-01 00:00:00')
      .send({ name: 'Mine' });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('conflict');
    expect(res.body.server.name).toBe('Original');
    // The row must NOT have been overwritten.
    expect((await findRow(orm, PackingItems, { id: id }))?.name).toBe('Original');
  });

  it('200 on delete, removing the row; 404 when already gone', async () => {
    const id = await insertItem(tripId, 'Gone');
    const ok = await request(server).delete(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1));
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ success: true });
    expect(await findRow(orm, PackingItems, { id })).toBeNull();
    const missing = await request(server).delete(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1));
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Item not found' });
  });

  // Plan 4 Task 8b (U6) — same single gate-level parse as update above.
  it('404 (not 500) on delete with a non-numeric :id', async () => {
    const res = await request(server).delete(`/api/trips/${tripId}/packing/abc`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Item not found' });
  });

  it('200 on reorder, persisting the new sort_order', async () => {
    const a = await insertItem(tripId, 'A', { sort_order: 0 });
    const b = await insertItem(tripId, 'B', { sort_order: 1 });
    const res = await request(server).put(`/api/trips/${tripId}/packing/reorder`).set('Cookie', sessionCookie(1)).send({ orderedIds: [b, a] });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    const rows = await findRows(orm, PackingItems, { trip: tripId }, { sort_order: 'asc' });
    expect(rows.map((r) => r.id)).toEqual([b, a]);
  });

  it('201 on import, skipping empty names and creating named bags', async () => {
    const res = await request(server)
      .post(`/api/trips/${tripId}/packing/import`)
      .set('Cookie', sessionCookie(1))
      .send({ items: [{ name: 'Shirt', bag: 'Carry-On' }, { name: '  ' }, { name: 'Pants', bag: 'Carry-On' }] });
    expect(res.status).toBe(201);
    expect(res.body.count).toBe(2);
    const bags = await findRows(orm, PackingBags, { trip: tripId });
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
    const id = await insertItem(tripId, 'Tent');
    const res = await request(server).put(`/api/trips/${tripId}/packing/${id}/sharing`).set('Cookie', sessionCookie(1)).send({ visibility: 'secret' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('visibility');
  });

  it('accepts the legacy numeric checked form through the pipe', async () => {
    const id = await insertItem(tripId, 'Toggle me');
    const res = await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ checked: 1 });
    expect(res.status).toBe(200);
    expect(res.body.item.checked).toBe(1);
  });

  it('counts packed pieces and ticks the item once the count is full (#2296)', async () => {
    const id = await insertItem(tripId, 'Shirts');
    await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ quantity: 3 });
    const partial = await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ packed_quantity: 2 });
    expect(partial.status).toBe(200);
    expect(partial.body.item).toMatchObject({ packed_quantity: 2, checked: 0 });
    const full = await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ packed_quantity: 3 });
    expect(full.body.item).toMatchObject({ packed_quantity: null, checked: 1 });
    const negative = await request(server).put(`/api/trips/${tripId}/packing/${id}`).set('Cookie', sessionCookie(1)).send({ packed_quantity: -1 });
    expect(negative.status).toBe(400);
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
    expect((await findRow(orm, PackingBags, { id: res.body.bag.id }))?.weight_limit_grams).toBe(8000);
  });

  it('bag members: sets roster members only, dropping off-trip user ids', async () => {
    await insertRow(orm, TripMembers, { trip: tripId, user: 2 });
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
    const templateId = await insertRow(orm, PackingTemplates, { name: 'Camping', createdByRef: 1 });
    const catId = await insertRow(orm, PackingTemplateCategories, { template: templateId, name: 'Gear', sort_order: 0 });
    await insertRow(orm, PackingTemplateItems, { category: catId, name: 'Tent', sort_order: 0 });

    const ok = await request(server).post(`/api/trips/${tripId}/packing/apply-template/${templateId}`).set('Cookie', sessionCookie(1)).send({});
    expect(ok.status).toBe(200); // @HttpCode(200) — the legacy POST returned 200
    expect(ok.body.count).toBe(1);
    expect(ok.body.items[0]).toMatchObject({ name: 'Tent', category: 'Gear' });

    const emptyId = await insertRow(orm, PackingTemplates, { name: 'Empty', createdByRef: 1 });
    const missing = await request(server).post(`/api/trips/${tripId}/packing/apply-template/${emptyId}`).set('Cookie', sessionCookie(1)).send({});
    expect(missing.status).toBe(404);
    expect(missing.body).toEqual({ error: 'Template not found or empty' });
  });

  it('save-as-template: 403 for non-admins, 201 for an admin with items', async () => {
    await insertRow(orm, TripMembers, { trip: tripId, user: 3 });
    await insertItem(tripId, 'Shirt', { category: 'Clothes' });

    const denied = await request(server).post(`/api/trips/${tripId}/packing/save-as-template`).set('Cookie', sessionCookie(1)).send({ name: 'Tpl' });
    expect(denied.status).toBe(403);
    expect(denied.body).toEqual({ error: 'Admin access required' });

    const saved = await request(server).post(`/api/trips/${tripId}/packing/save-as-template`).set('Cookie', sessionCookie(3)).send({ name: 'Tpl' });
    expect(saved.status).toBe(201);
    expect(saved.body.template).toMatchObject({ name: 'Tpl', categoryCount: 1, itemCount: 1 });
  });

  it('category assignees round-trip: PUT replaces, GET groups by category', async () => {
    await insertRow(orm, TripMembers, { trip: tripId, user: 2 });
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
