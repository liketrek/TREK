/**
 * Packing List integration tests.
 * Covers PACK-001 to PACK-014.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db as testDb } from '../../src/db/database';
import { MikroORM } from '@mikro-orm/core';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import type { FactoryOrm } from '../helpers/factories/context';
import { createUser, createTrip, createPackingItem, addTripMember } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { findRows, insertRow } from '../helpers/factories/rows';
import { PackingItems } from '../../src/db/entities/PackingItems.entity';
import { PackingTemplates } from '../../src/db/entities/PackingTemplates.entity';
import { PackingTemplateCategories } from '../../src/db/entities/PackingTemplateCategories.entity';
import { PackingTemplateItems } from '../../src/db/entities/PackingTemplateItems.entity';

let nestApp: INestApplication;
let app: Application;
let orm: FactoryOrm;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// Create packing item
// ─────────────────────────────────────────────────────────────────────────────

describe('Create packing item', () => {
  it('PACK-001 — POST creates a packing item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Passport', category: 'Documents' });
    expect(res.status).toBe(201);
    expect(res.body.item.name).toBe('Passport');
    expect(res.body.item.category).toBe('Documents');
    expect(res.body.item.checked).toBe(0);
  });

  it('PACK-001 — POST without name returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing`)
      .set('Cookie', authCookie(user.id))
      .send({ category: 'Clothing' });
    expect(res.status).toBe(400);
  });

  it('PACK-014 — non-member cannot create packing item', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing`)
      .set('Cookie', authCookie(other.id))
      .send({ name: 'Sunscreen' });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// List packing items
// ─────────────────────────────────────────────────────────────────────────────

describe('List packing items', () => {
  it('PACK-002 — GET /api/trips/:tripId/packing returns all items', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPackingItem(testDb, trip.id, { name: 'Toothbrush', category: 'Toiletries' });
    createPackingItem(testDb, trip.id, { name: 'Shirt', category: 'Clothing' });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/packing`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
  });

  it('PACK-002 — member can list packing items', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    createPackingItem(testDb, trip.id, { name: 'Jacket' });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/packing`)
      .set('Cookie', authCookie(member.id));
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Private items (#858)
// ─────────────────────────────────────────────────────────────────────────────

describe('Private packing items (#858)', () => {
  it('PACK-PRIV-001 — a private item is hidden from other members but visible to its owner', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    // Owner creates one shared and one private item.
    await request(app).post(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(owner.id)).send({ name: 'Shared tent' });
    const priv = await request(app).post(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(owner.id)).send({ name: 'Surprise gift', is_private: true });
    expect(priv.body.item.is_private).toBe(1);
    expect(priv.body.item.owner_id).toBe(owner.id);

    const ownerView = await request(app).get(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(owner.id));
    const memberView = await request(app).get(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(member.id));

    expect(ownerView.body.items.map((i: any) => i.name).sort()).toEqual(['Shared tent', 'Surprise gift']);
    expect(memberView.body.items.map((i: any) => i.name)).toEqual(['Shared tent']);
  });

  it('PACK-PRIV-002 — toggling an item private hides it from other members', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);

    const created = await request(app).post(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(owner.id)).send({ name: 'Diary' });
    const id = created.body.item.id;

    await request(app).put(`/api/trips/${trip.id}/packing/${id}`).set('Cookie', authCookie(owner.id)).send({ is_private: true });

    const memberView = await request(app).get(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(member.id));
    expect(memberView.body.items).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Three-tier sharing (#858)
// ─────────────────────────────────────────────────────────────────────────────

describe('Three-tier packing sharing (#858)', () => {
  it('PACK-3T-001 — existing items stay Common (visible to all) — non-breaking', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    // A pre-existing row (default is_private=0) must remain visible to everyone.
    createPackingItem(testDb, trip.id, { name: 'Group tent' });

    const memberView = await request(app).get(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(member.id));
    expect(memberView.body.items.map((i: any) => i.name)).toContain('Group tent');
  });

  it('PACK-3T-002 — a Shared item reaches the recipient (with the bringer) but no one else', async () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, friend.id);
    addTripMember(testDb, trip.id, stranger.id);

    const created = await request(app).post(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(owner.id))
      .send({ name: 'Power bank', visibility: 'shared', recipient_ids: [friend.id] });
    expect(created.body.item.recipients.map((r: any) => r.user_id)).toEqual([friend.id]);
    expect(created.body.item.owner_username).toBeTruthy();

    const friendView = await request(app).get(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(friend.id));
    const strangerView = await request(app).get(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(stranger.id));
    expect(friendView.body.items.map((i: any) => i.name)).toContain('Power bank');
    expect(strangerView.body.items.map((i: any) => i.name)).not.toContain('Power bank');
  });

  it('PACK-3T-003 — clone copies a Common item onto the caller\'s personal list', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const created = await request(app).post(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(owner.id)).send({ name: 'Adapter', visibility: 'common' });

    const clone = await request(app).post(`/api/trips/${trip.id}/packing/${created.body.item.id}/clone`).set('Cookie', authCookie(member.id));
    expect(clone.status).toBe(201);
    expect(clone.body.item.is_private).toBe(1);
    expect(clone.body.item.owner_id).toBe(member.id);
    // The owner does not see the member's private clone.
    const ownerView = await request(app).get(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(owner.id));
    expect(ownerView.body.items.filter((i: any) => i.name === 'Adapter')).toHaveLength(1);
  });

  it('PACK-3T-004 — "I can bring that too" adds the caller as a contributor on a Common item', async () => {
    const { user: owner } = createUser(testDb);
    const { user: helper } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, helper.id);
    const created = await request(app).post(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(owner.id)).send({ name: 'Sunscreen', visibility: 'common' });

    const res = await request(app).post(`/api/trips/${trip.id}/packing/${created.body.item.id}/contributors`).set('Cookie', authCookie(helper.id));
    expect(res.status).toBe(201);
    expect(res.body.item.contributors.map((c: any) => c.user_id)).toContain(helper.id);
  });

  it('PACK-3T-005 — sharing can only be changed by the owner', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const created = await request(app).post(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(owner.id)).send({ name: 'Tent', visibility: 'personal' });

    // A member who cannot see the item at all gets 404, not 403: answering 403
    // would confirm that the id exists (GHSA-vh2h-288v-ggch).
    const hidden = await request(app).put(`/api/trips/${trip.id}/packing/${created.body.item.id}/sharing`).set('Cookie', authCookie(member.id)).send({ visibility: 'common' });
    expect(hidden.status).toBe(404);

    // An item the member CAN see but does not own still answers 403.
    const shared = await request(app).post(`/api/trips/${trip.id}/packing`).set('Cookie', authCookie(owner.id)).send({ name: 'Stove', visibility: 'common' });
    const denied = await request(app).put(`/api/trips/${trip.id}/packing/${shared.body.item.id}/sharing`).set('Cookie', authCookie(member.id)).send({ visibility: 'personal' });
    expect(denied.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Update packing item
// ─────────────────────────────────────────────────────────────────────────────

describe('Update packing item', () => {
  it('PACK-003 — PUT updates packing item (toggle checked)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id, { name: 'Camera' });

    const res = await request(app)
      .put(`/api/trips/${trip.id}/packing/${item.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ checked: true });
    expect(res.status).toBe(200);
    expect(res.body.item.checked).toBe(1);
  });

  it('PACK-003 — PUT returns 404 for non-existent item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/packing/99999`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Updated' });
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Delete packing item
// ─────────────────────────────────────────────────────────────────────────────

describe('Delete packing item', () => {
  it('PACK-004 — DELETE removes packing item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id, { name: 'Sunglasses' });

    const del = await request(app)
      .delete(`/api/trips/${trip.id}/packing/${item.id}`)
      .set('Cookie', authCookie(user.id));
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);

    const list = await request(app)
      .get(`/api/trips/${trip.id}/packing`)
      .set('Cookie', authCookie(user.id));
    expect(list.body.items).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bulk import
// ─────────────────────────────────────────────────────────────────────────────

describe('Bulk import packing items', () => {
  it('PACK-005 — POST /import creates multiple items at once', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing/import`)
      .set('Cookie', authCookie(user.id))
      .send({
        items: [
          { name: 'Toothbrush', category: 'Toiletries' },
          { name: 'Shampoo', category: 'Toiletries' },
          { name: 'Socks', category: 'Clothing' },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.items).toHaveLength(3);
    expect(res.body.count).toBe(3);
  });

  it('PACK-005 — POST /import with empty array returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing/import`)
      .set('Cookie', authCookie(user.id))
      .send({ items: [] });
    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Reorder
// ─────────────────────────────────────────────────────────────────────────────

describe('Reorder packing items', () => {
  it('PACK-006 — PUT /reorder reorders items', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const i1 = createPackingItem(testDb, trip.id, { name: 'Item A' });
    const i2 = createPackingItem(testDb, trip.id, { name: 'Item B' });

    const res = await request(app)
      .put(`/api/trips/${trip.id}/packing/reorder`)
      .set('Cookie', authCookie(user.id))
      .send({ orderedIds: [i2.id, i1.id] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const rows = await findRows(orm, PackingItems, { trip: trip.id }, { sort_order: 'asc' });
    expect(rows[0].id).toBe(i2.id);
    expect(rows[1].id).toBe(i1.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bags
// ─────────────────────────────────────────────────────────────────────────────

describe('Bags', () => {
  it('PACK-008 — POST /bags creates a bag', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing/bags`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Carry-on', color: '#3b82f6' });
    expect(res.status).toBe(201);
    expect(res.body.bag.name).toBe('Carry-on');
  });

  it('PACK-008 — POST /bags without name returns 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing/bags`)
      .set('Cookie', authCookie(user.id))
      .send({ color: '#ff0000' });
    expect(res.status).toBe(400);
  });

  it('PACK-011 — GET /bags returns bags list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Create a bag
    await request(app)
      .post(`/api/trips/${trip.id}/packing/bags`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Main Bag' });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/packing/bags`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.bags).toHaveLength(1);
  });

  it('PACK-009 — PUT /bags/:bagId updates bag', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/packing/bags`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Old Name' });
    const bagId = createRes.body.bag.id;

    const res = await request(app)
      .put(`/api/trips/${trip.id}/packing/bags/${bagId}`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.bag.name).toBe('New Name');
  });

  it('PACK-009b — H2 regression: PUT /bags/:bagId with an empty body no-ops (200, not 500)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/packing/bags`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Untouched Name', color: '#abcdef' });
    const bagId = createRes.body.bag.id;

    const res = await request(app)
      .put(`/api/trips/${trip.id}/packing/bags/${bagId}`)
      .set('Cookie', authCookie(user.id))
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.bag.name).toBe('Untouched Name');
    expect(res.body.bag.color).toBe('#abcdef');
  });

  it('PACK-009c — H2 regression: PUT /bags/:bagId with an empty name no-ops (200, not 500)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/packing/bags`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Untouched Name', color: '#abcdef' });
    const bagId = createRes.body.bag.id;

    const res = await request(app)
      .put(`/api/trips/${trip.id}/packing/bags/${bagId}`)
      .set('Cookie', authCookie(user.id))
      .send({ name: '' });
    expect(res.status).toBe(200);
    expect(res.body.bag.name).toBe('Untouched Name');
  });

  it('PACK-009d — H2 regression: PUT /bags/:bagId with an empty color no-ops (200, not 500)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/packing/bags`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Untouched Name', color: '#abcdef' });
    const bagId = createRes.body.bag.id;

    const res = await request(app)
      .put(`/api/trips/${trip.id}/packing/bags/${bagId}`)
      .set('Cookie', authCookie(user.id))
      .send({ color: '' });
    expect(res.status).toBe(200);
    expect(res.body.bag.color).toBe('#abcdef');
  });

  it('PACK-010 — DELETE /bags/:bagId removes bag', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const createRes = await request(app)
      .post(`/api/trips/${trip.id}/packing/bags`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Temp Bag' });
    const bagId = createRes.body.bag.id;

    const del = await request(app)
      .delete(`/api/trips/${trip.id}/packing/bags/${bagId}`)
      .set('Cookie', authCookie(user.id));
    expect(del.status).toBe(200);
    expect(del.body.success).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Category assignees
// ─────────────────────────────────────────────────────────────────────────────

describe('Category assignees', () => {
  it('PACK-012 — PUT /category-assignees/:category sets assignees', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, member.id);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/packing/category-assignees/Clothing`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id, member.id] });
    expect(res.status).toBe(200);
    expect(res.body.assignees).toBeDefined();
  });

  it('PACK-012b — H1 regression: a string trip id (the real REST shape) with a non-empty roster does not 500', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, member.id);

    // `trip.id` is a number in the fixture, but the route param — like every
    // real REST call — arrives as a string; `insertIgnore` used to hand that
    // raw string to `upsertMany`, which threw on the post-write re-match
    // (task-8-review.md H1) instead of the 200 base returned.
    const res = await request(app)
      .put(`/api/trips/${String(trip.id)}/packing/category-assignees/Clothing`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id, member.id] });
    expect(res.status).toBe(200);
    expect(res.body.assignees).toHaveLength(2);
  });

  it('PACK-013 — GET /category-assignees returns all category assignments', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Set an assignee first
    await request(app)
      .put(`/api/trips/${trip.id}/packing/category-assignees/Electronics`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id] });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/packing/category-assignees`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.assignees).toBeDefined();
  });
});

describe('Packing — apply-template, bag members, save-as-template', () => {
  it('PACK-015 — POST /apply-template/:templateId applies template items to trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const templateId = await insertRow(orm, PackingTemplates, { name: 'Beach', createdByRef: user.id });
    const categoryId = await insertRow(orm, PackingTemplateCategories, { template: templateId, name: 'Essentials', sort_order: 0 });
    await insertRow(orm, PackingTemplateItems, { category: categoryId, name: 'Sunscreen', sort_order: 0 });

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing/apply-template/${templateId}`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.count).toBeGreaterThan(0);
  });

  it('PACK-015b — POST /apply-template/:id for empty template returns 404', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // Template with no items
    const emptyTemplateId = await insertRow(orm, PackingTemplates, { name: 'Empty', createdByRef: user.id });

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing/apply-template/${emptyTemplateId}`)
      .set('Cookie', authCookie(user.id));

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('PACK-016 — PUT /bags/:bagId/members sets bag members', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, member.id);

    // Create a bag first
    const bagRes = await request(app)
      .post(`/api/trips/${trip.id}/packing/bags`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Carry-on' });
    expect(bagRes.status).toBe(201);
    const bagId = bagRes.body.bag.id;

    const res = await request(app)
      .put(`/api/trips/${trip.id}/packing/bags/${bagId}/members`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id, member.id] });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.members)).toBe(true);
    expect(res.body.members.length).toBe(2);
  });

  it('PACK-016b — PUT /bags/:bagId/members for non-existent bag returns 404', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .put(`/api/trips/${trip.id}/packing/bags/999999/members`)
      .set('Cookie', authCookie(user.id))
      .send({ user_ids: [user.id] });

    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });

  it('PACK-017 — POST /save-as-template saves packing list as a template (admin)', async () => {
    const { user } = createUser(testDb, { role: 'admin' });
    const trip = createTrip(testDb, user.id);

    // Add an item so the trip has something to save
    createPackingItem(testDb, trip.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing/save-as-template`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'My Summer Template' });

    expect(res.status).toBe(201);
    expect(res.body.template).toBeDefined();
    expect(res.body.template.name).toBe('My Summer Template');
  });

  it('PACK-017b — POST /save-as-template without name returns 400 (admin)', async () => {
    const { user } = createUser(testDb, { role: 'admin' });
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing/save-as-template`)
      .set('Cookie', authCookie(user.id))
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('PACK-017c — POST /save-as-template when trip has no items returns 400 (admin)', async () => {
    const { user } = createUser(testDb, { role: 'admin' });
    const trip = createTrip(testDb, user.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing/save-as-template`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Empty Trip Template' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('PACK-017d — POST /save-as-template is forbidden for non-admins (403)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPackingItem(testDb, trip.id);

    const res = await request(app)
      .post(`/api/trips/${trip.id}/packing/save-as-template`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'My Summer Template' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Admin access required');
  });

  it('PACK-017e — GET /packing/templates lists templates for a trip member', async () => {
    const { user: admin } = createUser(testDb, { role: 'admin' });
    const trip = createTrip(testDb, admin.id);
    createPackingItem(testDb, trip.id);
    await request(app)
      .post(`/api/trips/${trip.id}/packing/save-as-template`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Shared Template' });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/packing/templates`)
      .set('Cookie', authCookie(admin.id));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
    expect(res.body.templates.some((t: { name: string }) => t.name === 'Shared Template')).toBe(true);
    expect(res.body.templates[0]).toHaveProperty('item_count');
  });
});
