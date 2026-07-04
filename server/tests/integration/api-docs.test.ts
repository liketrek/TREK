/**
 * API-DOCS (#1412) — the flag-gated Swagger surface: /api/docs (UI),
 * /api/docs-json (raw OpenAPI 3 spec incl. the Zod-derived request bodies),
 * off-by-default behaviour, and the CSP staying intact on the docs routes.
 * Boots the real buildApp() like bootstrap.test.ts.
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
    canAccessTrip: () => undefined,
    isOwner: () => false,
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
import { buildApp } from '../../src/bootstrap';
import { apiDocsEnabled } from '../../src/nest/common/api-docs.kill-switch';

describe('API-DOCS (#1412) — flag-gated OpenAPI surface', () => {
  let app: INestApplication;
  let instance: import('express').Application;
  let prevFlag: string | undefined;

  beforeAll(async () => {
    createTables(testDb);
    runMigrations(testDb);
    resetTestDb(testDb);
    prevFlag = process.env.TREK_API_DOCS_ENABLED;
    process.env.TREK_API_DOCS_ENABLED = 'true';
    app = await buildApp();
    instance = app.getHttpAdapter().getInstance();
  });

  afterAll(async () => {
    if (prevFlag === undefined) delete process.env.TREK_API_DOCS_ENABLED;
    else process.env.TREK_API_DOCS_ENABLED = prevFlag;
    await app.close();
    testDb.close();
  });

  it('DOCS-001 — the kill switch parses the env strictly', () => {
    const prev = process.env.TREK_API_DOCS_ENABLED;
    try {
      process.env.TREK_API_DOCS_ENABLED = 'true';
      expect(apiDocsEnabled()).toBe(true);
      process.env.TREK_API_DOCS_ENABLED = ' TRUE ';
      expect(apiDocsEnabled()).toBe(true);
      process.env.TREK_API_DOCS_ENABLED = 'false';
      expect(apiDocsEnabled()).toBe(false);
      process.env.TREK_API_DOCS_ENABLED = '1';
      expect(apiDocsEnabled()).toBe(false);
      delete process.env.TREK_API_DOCS_ENABLED;
      expect(apiDocsEnabled()).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.TREK_API_DOCS_ENABLED;
      else process.env.TREK_API_DOCS_ENABLED = prev;
    }
  });

  it('DOCS-002 — /api/docs serves the Swagger UI with the CSP intact', async () => {
    const res = await request(instance).get('/api/docs').redirects(1);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('DOCS-003 — /api/docs-json is a full OpenAPI 3 document over all controllers', async () => {
    const res = await request(instance).get('/api/docs-json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toMatch(/^3\./);
    // Reflection survived every controller: a few far-apart domains are present.
    expect(res.body.paths['/api/trips']).toBeDefined();
    expect(res.body.paths['/api/admin/addons/{id}']).toBeDefined();
    expect(res.body.components.securitySchemes.session).toBeDefined();
  });

  it('DOCS-004 — Zod request bodies are lifted into the spec (no double annotation)', async () => {
    const res = await request(instance).get('/api/docs-json');
    // collections create validates with collectionCreateRequestSchema via
    // ZodValidationPipe — the enricher must surface its object schema.
    const create = res.body.paths['/api/addons/collections']?.post;
    expect(create).toBeDefined();
    const schema = create.requestBody?.content?.['application/json']?.schema;
    expect(schema?.type).toBe('object');
    expect(schema?.properties?.name).toBeDefined();
  });

  it('DOCS-005 — without the flag the docs routes do not exist', async () => {
    const prev = process.env.TREK_API_DOCS_ENABLED;
    delete process.env.TREK_API_DOCS_ENABLED;
    let offApp: INestApplication | undefined;
    try {
      offApp = await buildApp();
      const off = offApp.getHttpAdapter().getInstance();
      expect((await request(off).get('/api/docs')).status).toBe(404);
      expect((await request(off).get('/api/docs-json')).status).toBe(404);
    } finally {
      if (offApp) await offApp.close();
      if (prev === undefined) delete process.env.TREK_API_DOCS_ENABLED;
      else process.env.TREK_API_DOCS_ENABLED = prev;
    }
  });
});
