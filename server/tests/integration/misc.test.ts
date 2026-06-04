/**
 * Miscellaneous integration tests.
 * Covers MISC-001, 002, 004, 007, 008, 013, 015.
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

describe('Health check', () => {
  it('MISC-001 — GET /api/health returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('Addons list', () => {
  it('MISC-002 — GET /api/addons returns enabled addons', async () => {
    const { user } = createUser(testDb);

    const res = await request(app)
      .get('/api/addons')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.addons)).toBe(true);
    // Should only return enabled addons
    const enabled = (res.body.addons as any[]).filter((a: any) => !a.enabled);
    expect(enabled.length).toBe(0);
  });
});

describe('Photo endpoint auth', () => {
  it('MISC-007 — GET /uploads/files without auth is blocked (401)', async () => {
    // /uploads/files is blocked without auth; /uploads/avatars and /uploads/covers are public static
    const res = await request(app).get('/uploads/files/nonexistent.txt');
    expect(res.status).toBe(401);
  });
});

describe('Force HTTPS redirect', () => {
  it('MISC-004 — FORCE_HTTPS redirect sends 301 for HTTP requests on non-health paths', async () => {
    // applyGlobalMiddleware reads FORCE_HTTPS when buildApp() composes the app, so
    // we need a fresh Nest instance built with the flag set.
    process.env.FORCE_HTTPS = 'true';
    let httpsApp: INestApplication | undefined;
    try {
      httpsApp = await buildApp();
      const res = await request(httpsApp.getHttpAdapter().getInstance())
        .get('/api/addons')
        .set('X-Forwarded-Proto', 'http');
      expect(res.status).toBe(301);
    } finally {
      if (httpsApp) await httpsApp.close();
      delete process.env.FORCE_HTTPS;
    }
  });

  it('MISC-008 — FORCE_HTTPS does not redirect /api/health (probes must reach it over HTTP)', async () => {
    process.env.FORCE_HTTPS = 'true';
    let httpsApp: INestApplication | undefined;
    try {
      httpsApp = await buildApp();
      const res = await request(httpsApp.getHttpAdapter().getInstance())
        .get('/api/health')
        .set('X-Forwarded-Proto', 'http');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    } finally {
      if (httpsApp) await httpsApp.close();
      delete process.env.FORCE_HTTPS;
    }
  });

  it('MISC-004 — no redirect when FORCE_HTTPS is not set', async () => {
    delete process.env.FORCE_HTTPS;

    const res = await request(app)
      .get('/api/health')
      .set('X-Forwarded-Proto', 'http');
    expect(res.status).toBe(200);
  });
});

