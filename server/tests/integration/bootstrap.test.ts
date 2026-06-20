/**
 * BOOTSTRAP / F6 — boots the unified production bootstrap (buildApp) and asserts
 * the whole shell is intact on the single NestJS instance now that Express is gone:
 * the global security pipeline (helmet/CSP), the /uploads platform routes, the
 * migrated /api domains (with the JWT guard), the /api/health + /api/addons
 * platform/inline endpoints, and (in production) HSTS. This is the test that proves
 * server/src/bootstrap.ts + index.ts serve everything correctly without the legacy app.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';

const { testDb, dbMock } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
      db
        .prepare(
          `SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`,
        )
        .get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) => !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
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

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { resetTestDb } from '../helpers/test-db';
import { createUser } from '../helpers/factories';
import { authCookie } from '../helpers/auth';
import { buildApp } from '../../src/bootstrap';

describe('BOOTSTRAP (F6) — unified NestJS app serves the whole surface', () => {
  let app: INestApplication;
  let instance: import('express').Application;

  beforeAll(async () => {
    createTables(testDb);
    runMigrations(testDb);
    resetTestDb(testDb);
    app = await buildApp();
    instance = app.getHttpAdapter().getInstance();
  });

  afterAll(async () => {
    await app.close();
    testDb.close();
  });

  it('BOOT-001 — GET /api/health returns 200 { status: ok } (platform transport on Nest)', async () => {
    const res = await request(instance).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.headers['cache-control']).toContain('no-store');
  });

  it('BOOT-002 — the global security pipeline (helmet) is applied', async () => {
    const res = await request(instance).get('/api/health');
    // helmet defaults — proof applyGlobalMiddleware ran on the Nest instance.
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('BOOT-003 — public /api/config is reachable without auth (migrated Nest domain)', async () => {
    const res = await request(instance).get('/api/config');
    expect(res.status).toBe(200);
  });

  it('BOOT-004 — a protected /api domain rejects an anonymous request (JWT guard wired)', async () => {
    const res = await request(instance).get('/api/trips');
    expect(res.status).toBe(401);
  });

  it('BOOT-005 — /uploads/files is blocked without auth (platform uploads on Nest)', async () => {
    const res = await request(instance).get('/uploads/files/anything.bin');
    expect(res.status).toBe(401);
  });

  it('BOOT-006 — GET /api/addons works end-to-end (guard → Nest AddonsController)', async () => {
    const anon = await request(instance).get('/api/addons');
    expect(anon.status).toBe(401);

    const { user } = createUser(testDb);
    const res = await request(instance).get('/api/addons').set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.addons)).toBe(true);
  });

  it('BOOT-007 — HSTS is advertised when NODE_ENV=production', async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    let prodApp: INestApplication | undefined;
    try {
      prodApp = await buildApp();
      const res = await request(prodApp.getHttpAdapter().getInstance()).get('/api/health');
      expect(res.headers['strict-transport-security']).toContain('max-age=');
    } finally {
      if (prodApp) await prodApp.close();
      if (prev === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = prev;
    }
  });

  it('BOOT-008 — large responses are gzip-compressed (Atlas country GeoJSON, #1254)', async () => {
    // The admin-0 country GeoJSON is multi-MB; without compression it stalls
    // behind reverse proxies / Cloudflare Tunnel. Proves applyGlobalMiddleware
    // gzips it on the wire.
    const { user } = createUser(testDb);
    const res = await request(instance)
      .get('/api/addons/atlas/countries/geo')
      .set('Accept-Encoding', 'gzip')
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    expect(res.headers['content-encoding']).toBe('gzip');
  });
});
