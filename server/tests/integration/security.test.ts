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
import { MikroORM } from '@mikro-orm/core';
import path from 'path';
import fs from 'fs';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db as testDb } from '../../src/db/database';
import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createTrip } from '../helpers/factories';
import { authCookie, authHeader, generateToken } from '../helpers/auth';
import { findRows, updateRows } from '../helpers/factories/rows';
import { readUser } from '../helpers/factories/users';
import { setAppSetting } from '../helpers/factories/settings';
import type { FactoryOrm } from '../helpers/factories/context';
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { TripFiles } from '../../src/db/entities/TripFiles.entity';

let nestApp: INestApplication;
let app: Application;
/** The app's own ORM, which the factories seed and read through. */
const orm = (): FactoryOrm => nestApp.get(MikroORM);
const FIXTURE_IMG = path.join(__dirname, '../fixtures/small-image.jpg');
const uploadsDir = path.join(__dirname, '../../uploads/files');

beforeAll(async () => {
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  await setAppSetting(orm(), 'allowed_file_types', '*');
});

beforeEach(async () => {
  resetTestDb(testDb);
  await resetRateLimits(nestApp);
  await setAppSetting(orm(), 'allowed_file_types', '*');
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

    const row = await readUser(orm(), user.id);
    expect(row.openweather_api_key).toMatch(/^enc:v1:/);
  });

  it('SEC-008 — saving keys audits the names and never the values (#1939)', async () => {
    const { user } = createUser(testDb);

    const save = () =>
      request(app)
        .put('/api/auth/me/api-keys')
        .set('Cookie', authCookie(user.id))
        .send({ openweather_api_key: 'test-api-key-12345' });

    const first = await save();
    expect(first.status).toBe(200);
    // changedKeys is internal: the client body is what it always was.
    expect(first.body).not.toHaveProperty('changedKeys');

    const rows = () => findRows(orm(), AuditLog, { action: 'settings.api_keys_update' });
    expect(await rows()).toHaveLength(1);
    expect((await rows())[0].details).toContain('openweather_api_key');
    expect((await rows())[0].details).not.toContain('test-api-key-12345');

    // The same value again writes no second row. This is the real test of the
    // cleartext comparison: encryption uses a random IV, so the stored blob
    // differs on every save even when the key does not.
    await save();
    expect(await rows()).toHaveLength(1);
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

    await updateRows(orm(), TripFiles, { id: fileId }, { filename: '../../etc/passwd' });

    const res = await request(app)
      .get(`/api/trips/${trip.id}/files/${fileId}/download`)
      .set(authHeader(user.id));
    // path.basename() strips traversal in the download controller; the normalized
    // name does not exist in uploads, so the answer is the same 404 a missing file
    // gets. Pinned exactly: a 500 from a thrown guard would also be "not 200".
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'File not found' });
  });
});
