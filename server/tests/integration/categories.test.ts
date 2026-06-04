/**
 * Categories integration tests — CAT-001 through CAT-009.
 * Covers GET/POST/PUT/DELETE /api/categories.
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
    getPlaceWithTags: () => null,
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
import { createUser, createAdmin } from '../helpers/factories';
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

describe('Categories', () => {
  it('CAT-001: GET /api/categories returns seeded default categories', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .get('/api/categories')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.categories)).toBe(true);
    // 10 default categories are seeded on reset
    expect(res.body.categories.length).toBeGreaterThanOrEqual(10);
    expect(res.body.categories[0]).toMatchObject({ name: expect.any(String), color: expect.any(String), icon: expect.any(String) });
  });

  it('CAT-002: POST /api/categories - admin creates a new category', async () => {
    const { user: admin } = createAdmin(testDb);
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Museum', color: '#7c3aed', icon: '🏛️' });
    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({ name: 'Museum', color: '#7c3aed', icon: '🏛️' });
    expect(res.body.category.id).toBeDefined();
  });

  it('CAT-003: POST /api/categories - non-admin returns 403', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Museum' });
    expect(res.status).toBe(403);
  });

  it('CAT-004: POST /api/categories - missing name returns 400', async () => {
    const { user: admin } = createAdmin(testDb);
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(admin.id))
      .send({ color: '#7c3aed' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('CAT-005: PUT /api/categories/:id - admin updates a category', async () => {
    const { user: admin } = createAdmin(testDb);
    // First create one
    const createRes = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Old Name', color: '#aaaaaa', icon: '📌' });
    const catId = createRes.body.category.id;

    const res = await request(app)
      .put(`/api/categories/${catId}`)
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'New Name', color: '#bbbbbb' });
    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe('New Name');
    expect(res.body.category.color).toBe('#bbbbbb');
    // Icon unchanged
    expect(res.body.category.icon).toBe('📌');
  });

  it('CAT-006: PUT /api/categories/:id - non-admin returns 403', async () => {
    const { user } = createUser(testDb);
    // Get a seeded category id
    const cat = testDb.prepare('SELECT id FROM categories LIMIT 1').get() as { id: number };
    const res = await request(app)
      .put(`/api/categories/${cat.id}`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('CAT-007: PUT /api/categories/:id - non-existent category returns 404', async () => {
    const { user: admin } = createAdmin(testDb);
    const res = await request(app)
      .put('/api/categories/99999')
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('CAT-008: DELETE /api/categories/:id - admin deletes a category', async () => {
    const { user: admin } = createAdmin(testDb);
    const createRes = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'To Delete' });
    const catId = createRes.body.category.id;

    const res = await request(app)
      .delete(`/api/categories/${catId}`)
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it's gone
    const gone = testDb.prepare('SELECT id FROM categories WHERE id = ?').get(catId);
    expect(gone).toBeUndefined();
  });

  it('CAT-009: DELETE /api/categories/:id - non-admin returns 403', async () => {
    const { user } = createUser(testDb);
    const cat = testDb.prepare('SELECT id FROM categories LIMIT 1').get() as { id: number };
    const res = await request(app)
      .delete(`/api/categories/${cat.id}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(403);
  });

  it('CAT-010: GET /api/categories - unauthenticated returns 401', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });
});
