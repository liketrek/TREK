/**
 * SPA fallback e2e (#2524). Boots a Nest app with the production static layer and
 * the two global filters wired the way AppModule and bootstrap wire them, then asks
 * over HTTP for a page, for a build file that exists, and for build files an
 * update removed.
 *
 * The last case is the bug: a tab or service worker still on the previous release
 * asks for its chunks, and those requests used to be answered with index.html and a
 * 200, which a precache then kept as the chunk. They must be a plain 404.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import type { Server } from 'http';
import { Module, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { SpaFallbackFilter } from '../../src/nest/platform/spa-fallback.filter';
import { applyPlatformStatic, PUBLIC_DIR } from '../../src/nest/platform/platform.routes';

@Module({})
class NoRoutesModule {}

const PRESENT_CHUNK = 'assets/e2e-2524-present-Q1w2E3r4.js';
const created: string[] = [];
const createdDirs: string[] = [];

/** Writes a file below the served public dir unless the build already put one there. */
function ensurePublicFile(rel: string, content: string): void {
  const file = path.join(PUBLIC_DIR, rel);
  if (fs.existsSync(file)) return;
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    createdDirs.push(dir);
  }
  fs.writeFileSync(file, content);
  created.push(file);
}

describe('SPA fallback e2e: pages get index.html, missing build files a 404 (#2524)', () => {
  const previousEnv = process.env.NODE_ENV;
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    ensurePublicFile('index.html', '<!DOCTYPE html><html><body><div id="root"></div></body></html>');
    ensurePublicFile(PRESENT_CHUNK, 'export default 1;\n');
    process.env.NODE_ENV = 'production';

    const moduleRef = await Test.createTestingModule({ imports: [NoRoutesModule] }).compile();
    app = moduleRef.createNestApplication();
    // Before init, like bootstrap.ts: a real file is answered ahead of Nest's router.
    applyPlatformStatic(app.getHttpAdapter().getInstance());
    // Same pair and order as the APP_FILTER providers in AppModule.
    app.useGlobalFilters(new TrekExceptionFilter(), new SpaFallbackFilter());
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
    for (const file of created) fs.rmSync(file, { force: true });
    for (const dir of createdDirs.reverse()) fs.rmSync(dir, { recursive: true, force: true });
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
  });

  it('answers a page of the app with index.html', async () => {
    const res = await request(server).get('/dashboard');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.headers['cache-control']).toBe('no-cache, no-store, must-revalidate');
    expect(res.text.toLowerCase()).toContain('<html');
  });

  it('serves a build file that exists', async () => {
    const res = await request(server).get(`/${PRESENT_CHUNK}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('javascript');
  });

  it('answers a chunk of the previous release with a 404, not index.html', async () => {
    const res = await request(server).get('/assets/DashboardPage-v4ODOTOr.js');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({ error: 'Cannot GET /assets/DashboardPage-v4ODOTOr.js' });
  });

  // The whole answer is asserted, not just the status: a checkout under a dot
  // directory (~/.local) made the old fallback fail with a 404 of its own, which
  // a status check alone would count as the fix.
  it.each([
    ['a cache-busted retry of that chunk', '/assets/DashboardPage-v4ODOTOr.js?t=1790358416100'],
    ['its stylesheet', '/assets/DashboardPage-v4ODOTOr.css'],
    ['a top-level build file', '/manifest-e2e-2524.webmanifest'],
  ])('does the same for %s', async (_case, url) => {
    const res = await request(server).get(url);
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body).toEqual({ error: `Cannot GET ${url}` });
  });

  it('keeps the JSON envelope for a non-GET miss', async () => {
    const res = await request(server).post('/dashboard').send({});
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Cannot POST /dashboard' });
  });
});
