/**
 * Categories integration tests — CAT-001 through CAT-009.
 * Covers GET/POST/PUT/DELETE /api/categories.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { MikroORM } from '@mikro-orm/core';
import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { Categories } from '../../src/db/entities/Categories.entity';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { makeUser, makeAdmin } from '../helpers/factories/users';
import { findRow } from '../helpers/factories/rows';
import type { FactoryOrm } from '../helpers/factories/context';
import { authCookie } from '../helpers/auth';

let nestApp: INestApplication;
let app: Application;
// The app's own ORM: the factories seed and read through it, never through raw SQL.
let orm: FactoryOrm;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  orm = nestApp.get(MikroORM);
});

/** A seeded default category, for the cases that only need some existing id. */
async function someCategoryId(): Promise<number> {
  const cat = await findRow(orm, Categories, {});
  if (!cat) throw new Error('the reset should have seeded the default categories');
  return cat.id;
}

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
});

afterAll(async () => {
  await nestApp.close();
  testDb.close();
});

describe('Categories', () => {
  it('CAT-001: GET /api/categories returns seeded default categories', async () => {
    const { user } = await makeUser(orm);
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
    const { user: admin } = await makeAdmin(orm);
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Museum', color: '#7c3aed', icon: '🏛️' });
    expect(res.status).toBe(201);
    expect(res.body.category).toMatchObject({ name: 'Museum', color: '#7c3aed', icon: '🏛️' });
    expect(res.body.category.id).toBeDefined();
  });

  it('CAT-003: POST /api/categories - non-admin returns 403', async () => {
    const { user } = await makeUser(orm);
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Museum' });
    expect(res.status).toBe(403);
  });

  it('CAT-004: POST /api/categories - missing name returns 400', async () => {
    const { user: admin } = await makeAdmin(orm);
    const res = await request(app)
      .post('/api/categories')
      .set('Cookie', authCookie(admin.id))
      .send({ color: '#7c3aed' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('CAT-005: PUT /api/categories/:id - admin updates a category', async () => {
    const { user: admin } = await makeAdmin(orm);
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
    const { user } = await makeUser(orm);
    const catId = await someCategoryId();
    const res = await request(app)
      .put(`/api/categories/${catId}`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('CAT-007: PUT /api/categories/:id - non-existent category returns 404', async () => {
    const { user: admin } = await makeAdmin(orm);
    const res = await request(app)
      .put('/api/categories/99999')
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
  });

  it('CAT-008: DELETE /api/categories/:id - admin deletes a category', async () => {
    const { user: admin } = await makeAdmin(orm);
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
    expect(await findRow(orm, Categories, { id: catId })).toBeNull();
  });

  it('CAT-009: DELETE /api/categories/:id - non-admin returns 403', async () => {
    const { user } = await makeUser(orm);
    const catId = await someCategoryId();
    const res = await request(app)
      .delete(`/api/categories/${catId}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(403);
  });

  it('CAT-010: GET /api/categories - unauthenticated returns 401', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(401);
  });

  it('CAT-011: PUT /api/categories/abc - non-numeric id returns the legacy 404, not a 500 (Plan 3b Task 2 fix round, item 1b)', async () => {
    const { user: admin } = await makeAdmin(orm);
    const res = await request(app)
      .put('/api/categories/abc')
      .set('Cookie', authCookie(admin.id))
      .send({ name: 'Ghost' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Category not found' });
  });

  it('CAT-012: DELETE /api/categories/abc - non-numeric id returns the legacy 404, not a 500 (Plan 3b Task 2 fix round, item 1b)', async () => {
    const { user: admin } = await makeAdmin(orm);
    const res = await request(app)
      .delete('/api/categories/abc')
      .set('Cookie', authCookie(admin.id));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Category not found' });
  });
});
