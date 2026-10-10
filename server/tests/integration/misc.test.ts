/**
 * Miscellaneous integration tests.
 * Covers MISC-001, 002, 004, 007, 008, 013, 015.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { authCookie } from '../helpers/auth';
import { createUser } from '../helpers/factories';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import type { INestApplication } from '@nestjs/common';

import type { Application } from 'express';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

let nestApp: INestApplication;
let app: Application;

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
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

    const res = await request(app).get('/api/addons').set('Cookie', authCookie(user.id));
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

    const res = await request(app).get('/api/health').set('X-Forwarded-Proto', 'http');
    expect(res.status).toBe(200);
  });
});

describe('Request body ceiling', () => {
  // The Express shell set '100kb' and stopped when the Nest instance took over
  // parsing, which left the limit implicit. This pins it, so it cannot drift
  // back to a framework default without somebody noticing.
  it('MISC-009 — a body over 100kb is refused with 413', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'a@b.c', password: 'x'.repeat(200 * 1024) });
    expect(res.status).toBe(413);
  });

  it('MISC-010 — a body under it still reaches the handler', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({ email: 'a@b.c', password: 'x'.repeat(1024) });
    expect(res.status).not.toBe(413);
  });

  // A list file may be a megabyte (#2198), and the three routes that carry one
  // whole are measured against that instead (#2301): the import into a new
  // list, the GPX reader, and the import into a list that already exists.
  // Only those three.
  it('MISC-011: a list file over 100kb reaches both imports and the GPX reader', async () => {
    for (const route of [
      '/api/addons/collections/import',
      '/api/addons/collections/gpx/read',
      '/api/addons/collections/7/import',
    ]) {
      const res = await request(app)
        .post(route)
        .set('Content-Type', 'application/json')
        .send({ gpx: 'x'.repeat(300 * 1024) });
      expect(res.status, route).not.toBe(413);
    }
  });

  it('MISC-012: a list file past twice the file limit is still refused, and no other route got the larger ceiling', async () => {
    const huge = await request(app)
      .post('/api/addons/collections/gpx/read')
      .set('Content-Type', 'application/json')
      .send({ gpx: 'x'.repeat(2 * 1024 * 1024 + 1) });
    expect(huge.status).toBe(413);

    const elsewhere = await request(app)
      .post('/api/addons/collections')
      .set('Content-Type', 'application/json')
      .send({ name: 'x'.repeat(200 * 1024) });
    expect(elsewhere.status).toBe(413);
  });
});
