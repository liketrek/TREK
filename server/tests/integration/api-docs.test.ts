/**
 * API-DOCS (#1412) — the flag-gated Swagger surface: /api/docs (UI),
 * /api/docs-json (raw OpenAPI 3 spec incl. the Zod-derived request bodies),
 * off-by-default behaviour, and the CSP staying intact on the docs routes.
 * Boots the real buildApp() like bootstrap.test.ts.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { apiDocsEnabled } from '../../src/nest/common/api-docs.kill-switch';
import { resetTestDb } from '../helpers/test-db';
import type { INestApplication } from '@nestjs/common';

import request from 'supertest';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

describe('API-DOCS (#1412) — flag-gated OpenAPI surface', () => {
  let app: INestApplication;
  let instance: import('express').Application;
  let prevFlag: string | undefined;

  beforeAll(async () => {
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

  it('DOCS-001 — the kill switch parses the boolean-like env family', () => {
    const prev = process.env.TREK_API_DOCS_ENABLED;
    try {
      process.env.TREK_API_DOCS_ENABLED = 'true';
      expect(apiDocsEnabled()).toBe(true);
      process.env.TREK_API_DOCS_ENABLED = ' TRUE ';
      expect(apiDocsEnabled()).toBe(true);
      process.env.TREK_API_DOCS_ENABLED = 'false';
      expect(apiDocsEnabled()).toBe(false);
      // '1' counts as truthy since the unified boolean coercion (app-config).
      process.env.TREK_API_DOCS_ENABLED = '1';
      expect(apiDocsEnabled()).toBe(true);
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
    // collections create validates with CollectionCreateDto (createZodDto over
    // collectionCreateRequestSchema) via the global ZodValidationPipe — the DTO
    // metatype must surface as a $ref to a component object schema.
    const create = res.body.paths['/api/addons/collections']?.post;
    expect(create).toBeDefined();
    const ref = create.requestBody?.content?.['application/json']?.schema?.$ref as string | undefined;
    expect(ref).toMatch(/^#\/components\/schemas\//);
    const schema = res.body.components.schemas[ref!.split('/').pop()!];
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
