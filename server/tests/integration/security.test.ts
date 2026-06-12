/**
 * Security integration tests.
 * Covers SEC-001 to SEC-015.
 *
 * Notes:
 * - SSRF tests (SEC-001 to SEC-004) are unit-level tests on ssrfGuard — see tests/unit/utils/ssrfGuard.test.ts
 * - SEC-015 (MFA backup codes) is covered in auth.test.ts
 * - These tests focus on HTTP-level security: headers, auth, injection protection, etc.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';
import path from 'path';
import fs from 'fs';

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
import { createUser, createTrip } from '../helpers/factories';
import { authCookie, authHeader, generateToken } from '../helpers/auth';

let nestApp: INestApplication;
let app: Application;
const FIXTURE_IMG = path.join(__dirname, '../fixtures/small-image.jpg');
const uploadsDir = path.join(__dirname, '../../uploads/files');

beforeAll(async () => {
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allowed_file_types', '*')").run();
});

beforeEach(() => {
  resetTestDb(testDb);
  resetRateLimits(nestApp);
  testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allowed_file_types', '*')").run();
});

afterAll(async () => {
  await nestApp.close();
  fs.rmSync(uploadsDir, { recursive: true, force: true });
  testDb.close();
});

describe('Authentication security', () => {
  it('SEC-007 — invalid JWT in Authorization Bearer header is rejected', async () => {
    const { user } = createUser(testDb);
    const token = generateToken(user.id);

    // The file download endpoint accepts bearer auth
    // Other endpoints use cookie auth — but /api/auth/me works with cookie auth
    // Test that a forged/invalid JWT is rejected
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    // Should return 401 (auth fails)
    expect(res.status).toBe(401);
  });

  it('unauthenticated request to protected endpoint returns 401', async () => {
    const res = await request(app).get('/api/trips');
    expect(res.status).toBe(401);
  });

  it('expired/invalid JWT cookie returns 401', async () => {
    const res = await request(app)
      .get('/api/trips')
      .set('Cookie', 'trek_session=invalid.jwt.token');
    expect(res.status).toBe(401);
  });
});

describe('Security headers', () => {
  it('SEC-011 — Helmet sets X-Content-Type-Options header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('SEC-011 — Helmet sets X-Frame-Options header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });
});

describe('API key encryption', () => {
  it('SEC-008 — encrypted API keys are stored with enc:v1: prefix', async () => {
    const { user } = createUser(testDb);

    await request(app)
      .put('/api/auth/me/api-keys')
      .set('Cookie', authCookie(user.id))
      .send({ openweather_api_key: 'test-api-key-12345' });

    const row = testDb.prepare('SELECT openweather_api_key FROM users WHERE id = ?').get(user.id) as any;
    expect(row.openweather_api_key).toMatch(/^enc:v1:/);
  });

  it('SEC-008 — GET /api/auth/me does not return plaintext API key', async () => {
    const { user } = createUser(testDb);
    await request(app)
      .put('/api/auth/me/api-keys')
      .set('Cookie', authCookie(user.id))
      .send({ openweather_api_key: 'secret-key' });

    const me = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie(user.id));
    expect(me.body.user.openweather_api_key).not.toBe('secret-key');
  });
});

describe('MFA secret protection', () => {
  it('SEC-009 — GET /api/auth/me does not expose mfa_secret', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', authCookie(user.id));
    expect(res.body.user.mfa_secret).toBeUndefined();
    expect(res.body.user.password_hash).toBeUndefined();
  });
});

describe('Request body size limit', () => {
  it('SEC-013 — oversized JSON body is rejected', async () => {
    // Send a large body (2MB+) to exceed the default limit
    const bigData = { data: 'x'.repeat(2 * 1024 * 1024) };

    const res = await request(app)
      .post('/api/auth/login')
      .send(bigData);
    // body-parser rejects oversized payloads with 413
    expect(res.status).toBe(413);
  });
});

describe('File download path traversal', () => {
  it('SEC-005 — path traversal in file download is blocked', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const upload = await request(app)
      .post(`/api/trips/${trip.id}/files`)
      .set('Cookie', authCookie(user.id))
      .attach('file', FIXTURE_IMG);
    expect(upload.status).toBe(201);
    const fileId = upload.body.file.id;

    testDb.prepare('UPDATE trip_files SET filename = ? WHERE id = ?').run('../../etc/passwd', fileId);

    const res = await request(app)
      .get(`/api/trips/${trip.id}/files/${fileId}/download`)
      .set(authHeader(user.id));
    // resolveFilePath strips traversal via path.basename; normalized file does not exist in uploads
    expect(res.status).not.toBe(200);
  });
});
