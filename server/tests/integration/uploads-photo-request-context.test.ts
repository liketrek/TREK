/**
 * Plan 3b Task 0 (D6): `servePhoto` — the pre-init `/uploads/photos/:filename`
 * Express route mounted by `applyPlatformUploads` (`bootstrap.ts`, BEFORE
 * `app.init()`) — now runs inside `withRequestContext(orm, …)`.
 *
 * Per the inventory (§5/§6): `applyPlatformUploads` is mounted permanently on
 * the raw Express instance, not just during a boot window, so every request
 * to `/uploads/photos/*` forever ran outside Nest's per-request EntityManager
 * fork. Converting `jwt-verify.ts`'s read off the raw `db` proxy (Task 1)
 * without this wrapper first would break every authenticated photo request
 * the moment it landed.
 *
 * Three proofs, mirroring Plan 3a's WSAD-040/041 shape:
 *  - PHOTOCTX-001: parity — an authenticated request still 200s exactly as
 *    before the wrap.
 *  - PHOTOCTX-002: load-bearing (positive) — a repository read forced inside
 *    the handler (as Task 1's `jwt-verify.ts` conversion will add one)
 *    succeeds, because `withRequestContext` genuinely covers the whole async
 *    chain of `servePhoto`, not just its synchronous prologue.
 *  - PHOTOCTX-003: load-bearing (negative) — the SAME real, exported
 *    `applyPlatformUploads`, called with no ORM, answers 500 through
 *    Express's error path BEFORE `servePhoto` ever runs (fail-closed, per
 *    the Plan 3b Rulings) — proving the wrapper is what makes PHOTOCTX-002
 *    succeed, not an accident of the test setup.
 */
import { buildApp } from '../../src/bootstrap';
import { db as testDb } from '../../src/db/database';
import { Users } from '../../src/db/entities/Users.entity';
import { applyPlatformUploads } from '../../src/nest/platform/platform.routes';
import { StorageService } from '../../src/nest/storage/storage.service';
import { generateToken } from '../helpers/auth';
import { createUser, createTrip } from '../helpers/factories';
import { resetTestDb } from '../helpers/test-db';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import express from 'express';
import type { Application } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
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

let nestApp: INestApplication;
let app: Application;

// A real file under the local driver's actual 'photos' root (DEFAULT_UPLOADS_ROOT,
// server/uploads — same fixture pattern as tests/e2e/share.e2e.test.ts's
// photos-google fixture, one category over).
const photoName = 'trek-context-photo.integration.jpg';
const photoFile = path.join(__dirname, '../../uploads/photos', photoName);
const photoBytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]); // JPEG-ish header

beforeAll(async () => {
  fs.mkdirSync(path.dirname(photoFile), { recursive: true });
  fs.writeFileSync(photoFile, photoBytes);
  nestApp = await buildApp();
  app = nestApp.getHttpAdapter().getInstance();
});

afterAll(async () => {
  await nestApp.close();
  try {
    fs.unlinkSync(photoFile);
  } catch {
    /* ignore */
  }
});

beforeEach(() => {
  resetTestDb(testDb);
});

describe('GET /uploads/photos/:filename — request context (Plan 3b Task 0, D6)', () => {
  it('PHOTOCTX-001: a valid JWT session still serves the photo — the wrap changes nothing observable', async () => {
    const { user } = createUser(testDb);
    const res = await request(app)
      .get(`/uploads/photos/${photoName}`)
      .set('Authorization', `Bearer ${generateToken(user.id)}`);
    expect(res.status).toBe(200);
    expect(Buffer.from(res.body as Buffer)).toEqual(photoBytes);
  });

  it('PHOTOCTX-002: a repository read forced inside the handler succeeds under the wrap (load-bearing positive proof)', async () => {
    const { user } = createUser(testDb);
    const storage = nestApp.get(StorageService);
    const orm = nestApp.get(MikroORM);
    let caught: unknown;
    let found: unknown;
    // storage.exists is the very first thing servePhoto calls — forcing a
    // genuine repository read here, as if a converted jwt-verify.ts (Task 1)
    // already read `users` through UsersRepository, proves withRequestContext
    // covers the wrapped call's entire async chain, not just its synchronous
    // prologue (RequestContext.create is AsyncLocalStorage.run; see
    // trek-ws.adapter.ts's docstring for the same property on the WS side).
    const spy = vi.spyOn(storage, 'exists').mockImplementation(async () => {
      try {
        found = await orm.em.getRepository(Users).findOne({ id: user.id });
      } catch (e) {
        caught = e;
      }
      return true;
    });
    try {
      const res = await request(app)
        .get(`/uploads/photos/${photoName}`)
        .set('Authorization', `Bearer ${generateToken(user.id)}`);
      expect(caught).toBeUndefined();
      expect(found).toBeTruthy();
      expect(res.status).toBe(200);
    } finally {
      spy.mockRestore();
    }
  });

  // R1 (Plan 3h Task 6): the anonymous share-token FALLBACK branch of the
  // SAME pre-init handler — the one PHOTOCTX-001/002 above never exercised
  // (they only drove the JWT half) — now reads `share_tokens` through
  // `ShareTokensRepository.findTripIdByToken` inside the SAME `withRequestContext`
  // wrap, the plan's single highest-severity finding (an unconverted `db`
  // proxy read had run outside Nest's per-request EntityManager fork,
  // permanently, since Plan 3b's own D6 wrap covered only the JWT branch).
  // These two cases drive the REAL pre-init route, anonymously, through the
  // real compiled `buildApp()` boot above — not a wrapper mock.
  it('PHOTOCTX-004 (R1): a valid share token serves the SAME photo bytes as the JWT path, byte-identical', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb
      .prepare('INSERT INTO photos (trip_id, filename, original_name) VALUES (?, ?, ?)')
      .run(trip.id, photoName, photoName);
    testDb
      .prepare('INSERT INTO share_tokens (trip_id, token, created_by) VALUES (?, ?, ?)')
      .run(trip.id, 'ratchet-valid-token', user.id);

    const res = await request(app).get(`/uploads/photos/${photoName}?token=ratchet-valid-token`);

    expect(res.status).toBe(200);
    expect(Buffer.from(res.body as Buffer)).toEqual(photoBytes);
  });

  it('PHOTOCTX-005 (R1): an invalid/unknown share token answers the legacy 401 — never `cannotUseGlobalContext`', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb
      .prepare('INSERT INTO photos (trip_id, filename, original_name) VALUES (?, ?, ?)')
      .run(trip.id, photoName, photoName);
    // No matching share_tokens row for this token at all.

    const res = await request(app).get(`/uploads/photos/${photoName}?token=ratchet-unknown-token`);

    expect(res.status).toBe(401);
    expect(res.status).not.toBe(500);
    // The explicit R1 assertion (rule 13(b)'s shape): the pre-init handler
    // never throws `cannotUseGlobalContext` for this branch — the wrap
    // covers the ShareTokensRepository read exactly as it covers the
    // already-converted Users read.
    expect(JSON.stringify(res.body ?? res.text ?? '')).not.toContain('cannotUseGlobalContext');
  });
});

describe('applyPlatformUploads without an ORM — fail-closed (Plan 3b Task 0, D6; mutation proof for PHOTOCTX-001/002)', () => {
  it('PHOTOCTX-003: the SAME real registration, called with no ORM, answers 500 BEFORE servePhoto ever runs', async () => {
    const bare = express();
    const storage = nestApp.get(StorageService);
    const existsSpy = vi.spyOn(storage, 'exists');
    // The real, exported applyPlatformUploads — no test double, no hand-call
    // of a private wrapper — with its optional `orm` param simply omitted,
    // the same shape TrekWsAdapter's WSAD-040 uses to prove its own D6 wrap.
    applyPlatformUploads(bare, storage);
    try {
      const res = await request(bare).get(`/uploads/photos/${photoName}`);
      expect(res.status).toBe(500);
      // The fail-closed branch throws BEFORE servePhoto calls storage.exists —
      // the handler never even started, exactly like WSAD-040's handlerRan check.
      expect(existsSpy).not.toHaveBeenCalled();
    } finally {
      existsSpy.mockRestore();
    }
  });
});
