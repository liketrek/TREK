/**
 * Tags integration tests — TAG-001 through TAG-010.
 * Covers GET/POST/PUT/DELETE /api/tags.
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
import { createUser } from '../helpers/factories';
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

describe('Tags', () => {
  it('TAG-001: GET /api/tags returns empty array for new user', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .get('/api/tags')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([]);
  });

  it('TAG-002: POST /api/tags creates a tag with default color', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Must See' });
    expect(res.status).toBe(201);
    expect(res.body.tag).toMatchObject({ name: 'Must See', user_id: user.id });
    expect(res.body.tag.id).toBeDefined();
    expect(res.body.tag.color).toBe('#10b981'); // default color
  });

  it('TAG-003: POST /api/tags creates a tag with a custom color', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Foodie', color: '#f59e0b' });
    expect(res.status).toBe(201);
    expect(res.body.tag.color).toBe('#f59e0b');
  });

  it('TAG-004: POST /api/tags without name returns 400', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(user.id))
      .send({ color: '#ff0000' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('TAG-005: PUT /api/tags/:id updates tag name and color', async () => {
    const { user } = createUser(testDb);
    const createRes = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'Old Name', color: '#aaaaaa' });
    const tagId = createRes.body.tag.id;

    const res = await request(app)
      .put(`/api/tags/${tagId}`)
      .set('Cookie', authCookie(user.id))
      .send({ name: 'New Name', color: '#bbbbbb' });
    expect(res.status).toBe(200);
    expect(res.body.tag.name).toBe('New Name');
    expect(res.body.tag.color).toBe('#bbbbbb');
  });

  it('TAG-006: PUT /api/tags/:id - tag belonging to another user returns 404', async () => {
    const { user: userA } = createUser(testDb);
    const { user: userB } = createUser(testDb);
    const createRes = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(userA.id))
      .send({ name: 'User A Tag' });
    const tagId = createRes.body.tag.id;

    // User B tries to update User A's tag
    const res = await request(app)
      .put(`/api/tags/${tagId}`)
      .set('Cookie', authCookie(userB.id))
      .send({ name: 'Hijacked' });
    expect(res.status).toBe(404);
  });

  it('TAG-007: DELETE /api/tags/:id removes the tag', async () => {
    const { user } = createUser(testDb);
    const createRes = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(user.id))
      .send({ name: 'To Delete' });
    const tagId = createRes.body.tag.id;

    const res = await request(app)
      .delete(`/api/tags/${tagId}`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify gone
    const listRes = await request(app)
      .get('/api/tags')
      .set('Cookie', authCookie(user.id));
    expect(listRes.body.tags).toHaveLength(0);
  });

  it('TAG-008: DELETE /api/tags/:id - tag belonging to another user returns 404', async () => {
    const { user: userA } = createUser(testDb);
    const { user: userB } = createUser(testDb);
    const createRes = await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(userA.id))
      .send({ name: 'User A Tag' });
    const tagId = createRes.body.tag.id;

    const res = await request(app)
      .delete(`/api/tags/${tagId}`)
      .set('Cookie', authCookie(userB.id));
    expect(res.status).toBe(404);
  });

  it('TAG-009: Tags are user-scoped — user A cannot see user B tags', async () => {
    const { user: userA } = createUser(testDb);
    const { user: userB } = createUser(testDb);
    await request(app)
      .post('/api/tags')
      .set('Cookie', authCookie(userA.id))
      .send({ name: 'User A Private Tag' });

    const res = await request(app)
      .get('/api/tags')
      .set('Cookie', authCookie(userB.id));
    expect(res.status).toBe(200);
    expect(res.body.tags).toHaveLength(0);
  });

  it('TAG-010: Unauthenticated request returns 401', async () => {
    const res = await request(app).get('/api/tags');
    expect(res.status).toBe(401);
  });
});
