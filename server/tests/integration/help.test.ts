/**
 * Help integration tests — /api/help served from the bundled `wiki/` directory.
 *
 * These run against the real repo wiki (no TREK_WIKI_DIR override) on purpose: the
 * point is to prove the shipped docs are reachable through the HTTP layer, which is
 * what a broken path or a wiki missing from the image would silently cost us.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  return { testDb: db, dbMock: { db, closeDb: () => {}, reinitialize: () => {} } };
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

let nestApp: INestApplication;
let app: Application;
const fetchSpy = vi.fn(async () => new Response('{}', { status: 200 }));

beforeAll(async () => {
  // Any outbound fetch here is a bug: help must be served from disk.
  vi.stubGlobal('fetch', fetchSpy);
  createTables(testDb);
  runMigrations(testDb);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await nestApp?.close();
});

describe('GET /api/help', () => {
  it('returns the sidebar without authentication', async () => {
    const res = await request(app).get('/api/help/index').expect(200);

    expect(res.body.sections.length).toBeGreaterThan(0);
    expect(res.body.sections[0].pages[0]).toEqual({ title: expect.any(String), slug: expect.any(String) });
  });

  it('renders a real wiki page', async () => {
    const res = await request(app).get('/api/help/page/Home').expect(200);

    expect(res.body.slug).toBe('Home');
    expect(res.body.title.length).toBeGreaterThan(0);
    expect(res.body.markdown.length).toBeGreaterThan(0);
  });

  it('404s an unknown page', async () => {
    await request(app).get('/api/help/page/DefinitelyNotAPage').expect(404);
  });

  it('serves a wiki image from disk', async () => {
    const res = await request(app).get('/api/help/asset/assets/TripPlanner.png').expect(200);

    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cache-control']).toContain('max-age=86400');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('refuses to serve files outside the wiki directory', async () => {
    // Percent-encoded, because Express normalises a literal `../` away before the
    // controller sees it — this is the form that actually reaches the guard, since
    // the handler decodes the path itself off req.originalUrl.
    await request(app).get('/api/help/asset/assets/%2e%2e%2f%2e%2e%2fpackage.json').expect(404);
    await request(app).get('/api/help/asset/%2e%2e%2fserver%2f.env').expect(404);
  });

  it('never calls out to GitHub', () => {
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
