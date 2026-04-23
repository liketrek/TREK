/**
 * Integration tests for Home Assistant Ingress compatibility.
 *
 * Covers:
 *  - CSP frame-ancestors is driven by the CSP_FRAME_ANCESTORS env var.
 *  - SPA index.html <base href> is rewritten when X-Ingress-Path is set.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import fs from 'node:fs';
import path from 'node:path';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    canAccessTrip: () => null,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

// A minimal index.html with the <base> placeholder mirrors what Vite ships.
const PUBLIC_DIR = path.join(__dirname, '../../public');
const INDEX_PATH = path.join(PUBLIC_DIR, 'index.html');
const INDEX_PRE_EXISTED = fs.existsSync(INDEX_PATH);
const INDEX_ORIGINAL = INDEX_PRE_EXISTED ? fs.readFileSync(INDEX_PATH, 'utf8') : null;
const TEST_HTML = `<!DOCTYPE html><html><head><base href="/" data-trek-base /><title>T</title></head><body><div id="root"></div></body></html>`;

let app: Application;

beforeAll(async () => {
  const { createTables } = await import('../../src/db/schema');
  const { runMigrations } = await import('../../src/db/migrations');
  createTables(testDb);
  runMigrations(testDb);

  // Ensure SPA catch-all is reachable.
  process.env.NODE_ENV = 'production';
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(INDEX_PATH, TEST_HTML);

  const { createApp } = await import('../../src/app');
  app = createApp();
});

afterAll(() => {
  // Restore pre-existing index.html if any (e.g. if the repo is already built).
  if (INDEX_PRE_EXISTED && INDEX_ORIGINAL !== null) {
    fs.writeFileSync(INDEX_PATH, INDEX_ORIGINAL);
  } else if (fs.existsSync(INDEX_PATH)) {
    fs.unlinkSync(INDEX_PATH);
  }
  process.env.NODE_ENV = 'test';
});

describe('SPA base-href rewrite', () => {
  it('serves the unchanged <base href="/"> for standalone requests', async () => {
    const res = await request(app).get('/').expect(200);
    expect(res.text).toContain('<base href="/" data-trek-base />');
  });

  it('rewrites <base> when X-Ingress-Path is present', async () => {
    const res = await request(app)
      .get('/')
      .set('X-Ingress-Path', '/api/hassio_ingress/abc123/')
      .expect(200);
    expect(res.text).toContain('<base href="/api/hassio_ingress/abc123/" data-trek-base />');
    expect(res.text).not.toContain('<base href="/" data-trek-base />');
  });

  it('rewrites <base> for SPA deep-link navigations (catch-all handles them)', async () => {
    const res = await request(app)
      .get('/dashboard')
      .set('X-Ingress-Path', '/api/hassio_ingress/abc123')
      .expect(200);
    expect(res.text).toContain('<base href="/api/hassio_ingress/abc123/" data-trek-base />');
  });

  it('ignores X-Ingress-Path values that do not match the hassio_ingress prefix', async () => {
    const res = await request(app)
      .get('/')
      .set('X-Ingress-Path', '/some/other/path')
      .expect(200);
    expect(res.text).toContain('<base href="/" data-trek-base />');
  });
});

describe('CSP frame-ancestors is env-driven', () => {
  it('advertises the default self policy when CSP_FRAME_ANCESTORS is unset', async () => {
    delete process.env.CSP_FRAME_ANCESTORS;
    const { createApp } = await import('../../src/app');
    const freshApp = createApp();
    const res = await request(freshApp).get('/api/health').expect(200);
    const csp = res.headers['content-security-policy'] as string | undefined;
    expect(csp).toBeDefined();
    expect(csp).toMatch(/frame-ancestors 'self'/);
  });

  it('honours CSP_FRAME_ANCESTORS when the addon sets it to "*"', async () => {
    process.env.CSP_FRAME_ANCESTORS = '*';
    try {
      const { createApp } = await import('../../src/app');
      const freshApp = createApp();
      const res = await request(freshApp).get('/api/health').expect(200);
      const csp = res.headers['content-security-policy'] as string | undefined;
      expect(csp).toBeDefined();
      expect(csp).toMatch(/frame-ancestors \*/);
    } finally {
      delete process.env.CSP_FRAME_ANCESTORS;
    }
  });
});
