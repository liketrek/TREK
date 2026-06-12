/**
 * Settings integration tests — SET-001 through SET-008.
 * Covers GET /api/settings, PUT /api/settings, POST /api/settings/bulk.
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

describe('Settings', () => {
  it('SET-001: GET /api/settings returns empty object for new user', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .get('/api/settings')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.settings).toBeDefined();
    expect(typeof res.body.settings).toBe('object');
    // New user has no custom settings
    expect(Object.keys(res.body.settings)).toHaveLength(0);
  });

  it('SET-002: PUT /api/settings sets a key/value pair', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ key: 'theme', value: 'dark' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.key).toBe('theme');
    expect(res.body.value).toBe('dark');
  });

  it('SET-003: PUT /api/settings updates an existing key', async () => {
    const { user } = createUser(testDb);
    await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ key: 'theme', value: 'dark' });

    const res = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ key: 'theme', value: 'light' });

    expect(res.status).toBe(200);
    expect(res.body.value).toBe('light');

    // Verify the GET reflects the updated value
    const getRes = await request(app)
      .get('/api/settings')
      .set('Cookie', authCookie(user.id));
    expect(getRes.body.settings.theme).toBe('light');
  });

  it('SET-004: POST /api/settings/bulk upserts multiple settings', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/settings/bulk')
      .set('Cookie', authCookie(user.id))
      .send({ settings: { theme: 'dark', language: 'en', compact_mode: 'true' } });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updated).toBeGreaterThanOrEqual(3);
  });

  it('SET-005: GET /api/settings reflects previously upserted values', async () => {
    const { user } = createUser(testDb);
    await request(app)
      .post('/api/settings/bulk')
      .set('Cookie', authCookie(user.id))
      .send({ settings: { theme: 'dark', language: 'fr' } });

    const res = await request(app)
      .get('/api/settings')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.body.settings.theme).toBe('dark');
    expect(res.body.settings.language).toBe('fr');
  });

  it('SET-006: GET /api/settings without auth returns 401', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
  });

  it('SET-007: PUT /api/settings without key returns 400', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ value: 'dark' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('SET-008: PUT /api/settings with masked value is ignored (no-op)', async () => {
    const { user } = createUser(testDb);
    // First set a real value
    await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ key: 'webhook_url', value: 'https://example.com/hook' });

    // Then try to "save" the masked placeholder
    const res = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(user.id))
      .send({ key: 'webhook_url', value: '••••••••' });
    expect(res.status).toBe(200);
    expect(res.body.unchanged).toBe(true);
  });

  it('SET-009: POST /api/settings/bulk without settings object returns 400', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .post('/api/settings/bulk')
      .set('Cookie', authCookie(user.id))
      .send({ settings: null });
    expect(res.status).toBe(400);
  });

  it('SET-010: settings are user-scoped (user A cannot see user B settings)', async () => {
    const { user: userA } = createUser(testDb);
    const { user: userB } = createUser(testDb);

    await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie(userA.id))
      .send({ key: 'secret_setting', value: 'user_a_secret' });

    const res = await request(app)
      .get('/api/settings')
      .set('Cookie', authCookie(userB.id));
    expect(res.status).toBe(200);
    expect(res.body.settings.secret_setting).toBeUndefined();
  });
});
