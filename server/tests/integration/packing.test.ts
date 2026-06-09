/**
 * Packing List integration tests.
 * Covers PACK-001 to PACK-014.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: (placeId: number) => {
      const place: any = db.prepare(`SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`).get(placeId);
      if (!place) return null;
      const tags = db.prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`).all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon } : null, tags };
    },
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { buildApp } from '../../src/bootstrap';
import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createTrip, createPackingItem, addTripMember } from '../helpers/factories';
import { authCookie } from '../helpers/auth';

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
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

    const rows = testDb
      .prepare('SELECT id, sort_order FROM packing_items WHERE trip_id = ? ORDER BY sort_order')
      .all(trip.id) as Array<{ id: number; sort_order: number }>;
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

    const tpl = testDb.prepare("INSERT INTO packing_templates (name, created_by) VALUES ('Beach', ?)").run(user.id);
    const cat = testDb.prepare("INSERT INTO packing_template_categories (template_id, name, sort_order) VALUES (?, 'Essentials', 0)").run(tpl.lastInsertRowid);
    testDb.prepare("INSERT INTO packing_template_items (category_id, name, sort_order) VALUES (?, 'Sunscreen', 0)").run(cat.lastInsertRowid);
    const templateId = tpl.lastInsertRowid;

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
    const tpl = testDb.prepare("INSERT INTO packing_templates (name, created_by) VALUES ('Empty', ?)").run(user.id);
    const emptyTemplateId = tpl.lastInsertRowid;

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
