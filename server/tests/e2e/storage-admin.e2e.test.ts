/**
 * Storage admin e2e — exercises the migrated /api/admin/storage surface
 * (StorageAdminController) through the real JwtAuthGuard + AdminGuard +
 * ManagedGuard against a temp SQLite db. DI-native: no service mock, so the
 * registry's real boot/seed/reload pipeline and StorageAdminService run for
 * real. Covers auth (401), the admin gate (403), managed-mode refusal (403,
 * the first e2e to assert it — ManagedGuard is otherwise only wired in
 * AppModule), the GET/PUT/test happy paths, the 400 envelope for both a
 * semantic registry refusal and a Zod pipe rejection, and secret masking/
 * encryption/redaction (including without an explicit ENCRYPTION_KEY).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'http';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { StorageModule } from '../../src/nest/storage/storage.module';
import { ManagedGuard } from '../../src/nest/common/managed.guard';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  // `users` carries the columns listUsers/createUser/updateUser select, plus the
  // is_guest flag the #1362 COALESCE guards read (admin.e2e.test.ts DDL).
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    password_hash TEXT, avatar TEXT, is_guest INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME);`);
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  // Slim audit_log mirror (no FKs), same shape as admin.e2e.test.ts.
  tmp.exec(`CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER, action TEXT NOT NULL, resource TEXT, details TEXT, ip TEXT);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));
// The audit domain is DI-native: writeAudit runs for real against the temp db's
// audit_log table; only the file logger is silenced.
vi.mock('../../src/nest/audit/audit-log.logger', () => ({ LOG_LEVEL: 'error', logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn(), logWarn: vi.fn() }));
// apiKeyCrypto imports ENCRYPTION_KEY from here for the cipher; the raw
// process.env var is managed separately in beforeAll/afterAll for the
// no-explicit-key case (STORE2E-007). JWT_SECRET must also be
// supplied — jwt-verify.ts (JwtAuthGuard) and the harness's signSession both
// import it from this same module, so mocking the module wholesale requires
// keeping both consistent.
vi.mock('../../src/config', () => ({ ENCRYPTION_KEY: 'e2e-storage-key', JWT_SECRET: 'e2e-storage-jwt-secret' }));

import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

describe('Storage admin e2e (real auth + admin guard + managed guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let adminCookie: string;
  let userCookie: string;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, StorageModule],
      providers: [{ provide: APP_GUARD, useClass: ManagedGuard }],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    process.env.ENCRYPTION_KEY = 'e2e-storage-key';
    seedUser(db as never, { id: 1 });
    seedUser(db as never, { id: 2, role: 'admin', email: 'e2e-storage-admin@example.test' });
    userCookie = sessionCookie(1);
    adminCookie = sessionCookie(2);
    app = await build();
    server = app.getHttpServer();
  });

  // Clears the persisted rows only — NOT the registry's in-memory last-good
  // snapshot (StorageRegistryService keeps state across requests within one
  // `app`, and this suite builds `app` once in beforeAll). A test added after
  // STORE2E-004 that expects to see fresh defaults must call GET (which
  // renders the registry's live snapshot) rather than assume the deleted rows
  // reset it — the registry only re-reads app_settings on `reload()`/init.
  beforeEach(() => {
    db.exec("DELETE FROM app_settings WHERE key LIKE 'storage.%'");
    db.exec('DELETE FROM audit_log');
  });

  afterAll(async () => {
    await app.close();
    delete process.env.ENCRYPTION_KEY;
  });

  it('STORE2E-001 401 without a session', async () => {
    expect((await request(server).get('/api/admin/storage')).status).toBe(401);
    // PUT stays behind the same guard chain — pins that the guards are declared
    // class-level (JwtAuthGuard + AdminGuard on the controller), not re-added
    // per handler where a future handler could forget them.
    expect((await request(server).put('/api/admin/storage').send({ backends: [], categories: {} })).status).toBe(401);
    expect(
      (await request(server).post('/api/admin/storage/test').send({ backend: { name: 'x', type: 'local', options: { root: '/tmp' } } })).status,
    ).toBe(401);
  });

  it('STORE2E-002 403 for a non-admin', async () => {
    const res = await request(server).get('/api/admin/storage').set('Cookie', userCookie);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
  });

  it('STORE2E-003 GET renders the effective defaults world', async () => {
    const res = await request(server).get('/api/admin/storage').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    const names = (res.body.backends as Array<{ name: string; source: string }>).map((b) => [b.name, b.source]);
    expect(names).toEqual(expect.arrayContaining([['uploads-local', 'built-in'], ['backups-local', 'built-in']]));
    expect(Object.keys(res.body.categories)).toHaveLength(8);
    expect(res.body.seedFilePresent).toBe(false);
    expect(res.body.health).toEqual({ replicaFailures: [] });
  });

  it('STORE2E-004 PUT persists, answers the fresh world, audits with redacted secrets', async () => {
    const nasRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-e2e-nas-'));
    const body = {
      backends: [
        { name: 'nas-backups', type: 'local', options: { root: nasRoot } },
        {
          name: 'off-box',
          type: 's3',
          options: { endpoint: 'http://127.0.0.1:9000', bucket: 'trek', accessKeyId: 'ak', secretAccessKey: 'sk-e2e' },
        },
      ],
      categories: { backups: 'nas-backups' },
      version: 0,
    };
    const res = await request(server).put('/api/admin/storage').set('Cookie', adminCookie).send(body);
    expect(res.status).toBe(200);
    const offBox = (res.body.backends as Array<{ name: string; source: string; options: Record<string, unknown> }>).find(
      (b) => b.name === 'off-box',
    )!;
    expect(offBox.source).toBe('settings');
    expect(offBox.options.secretAccessKey).toBe('••••••••'); // masked, never echoed
    expect(res.body.categories.backups).toEqual({ backend: 'nas-backups', source: 'settings' });

    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'storage.backends'").get() as { value: string };
    expect(row.value).toContain('enc:v1:');
    expect(row.value).not.toContain('sk-e2e');

    const audit = db.prepare("SELECT details FROM audit_log WHERE action = 'admin.storage_update'").get() as { details: string };
    expect(audit.details).toContain('***');
    expect(audit.details).not.toContain('sk-e2e');
  });

  it('STORE2E-005 PUT with a semantic violation → 400 with the registry message verbatim', async () => {
    const res = await request(server)
      .put('/api/admin/storage')
      .set('Cookie', adminCookie)
      .send({ backends: [], categories: { backups: 'nope' }, version: 0 });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "category 'backups' maps to unknown backend 'nope'" });
  });

  it('STORE2E-006 PUT with an unknown top-level key → 400 from the Zod pipe (reserved readOnly door)', async () => {
    const res = await request(server)
      .put('/api/admin/storage')
      .set('Cookie', adminCookie)
      .send({ backends: [], categories: {}, version: 0, readOnly: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('STORE2E-007 PUT with a plaintext secret and no explicit ENCRYPTION_KEY saves, encrypted at rest', async () => {
    delete process.env.ENCRYPTION_KEY;
    try {
      const res = await request(server)
        .put('/api/admin/storage')
        .set('Cookie', adminCookie)
        .send({
          backends: [
            {
              name: 'off-box',
              type: 's3',
              options: { endpoint: 'http://127.0.0.1:9000', bucket: 'trek', accessKeyId: 'ak', secretAccessKey: 'sk' },
            },
          ],
          categories: {},
          version: 0,
        });
      expect(res.status).toBe(200);
      // The secret never comes back and never persists in the clear.
      const offBox = (res.body.backends as Array<{ name: string; options: Record<string, string> }>).find(
        (b) => b.name === 'off-box',
      )!;
      expect(offBox.options.secretAccessKey).not.toBe('sk');
      const row = db.prepare("SELECT value FROM app_settings WHERE key = 'storage.backends'").get() as { value: string };
      expect(row.value).not.toContain('"sk"');
      expect(row.value).toContain('enc:v1:');
    } finally {
      process.env.ENCRYPTION_KEY = 'e2e-storage-key';
    }
  });

  it('STORE2E-008 managed mode refuses the whole surface with the standard body', async () => {
    process.env.TREK_MANAGED = 'true';
    try {
      const res = await request(server).get('/api/admin/storage').set('Cookie', adminCookie);
      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: 'This is configured by the operator of this instance.',
        code: 'MANAGED_FORBIDDEN',
      });
    } finally {
      delete process.env.TREK_MANAGED;
    }
  });

  it('STORE2E-009 POST /test probes a local candidate and answers 200 with per-target results', async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-e2e-probe-'));
    const res = await request(server)
      .post('/api/admin/storage/test')
      .set('Cookie', adminCookie)
      .send({ backend: { name: 'cand', type: 'local', options: { root } } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, targets: [{ name: 'cand', ok: true }] });
    const audit = db.prepare("SELECT details FROM audit_log WHERE action = 'admin.storage_test'").get() as { details: string };
    expect(JSON.parse(audit.details)).toMatchObject({ backend: 'cand', type: 'local', ok: true });
  });

  it('STORE2E-010 migration moves a category end to end', async () => {
    const destRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-e2e-migration-dest-'));
    const put = await request(server)
      .put('/api/admin/storage')
      .set('Cookie', adminCookie)
      .send({ backends: [{ name: 'dest', type: 'local', options: { root: destRoot } }], categories: {}, version: 0 });
    expect(put.status).toBe(200);

    // 'journey' is empty (no objects planted), so the migration is valid and instant.
    const start = await request(server)
      .post('/api/admin/storage/migrations')
      .set('Cookie', adminCookie)
      .send({ category: 'journey', to: 'dest' });
    expect(start.status).toBe(200);
    expect(start.body).toEqual({ started: true });

    let status: { status: string } | undefined;
    let stateBody: { categories: Record<string, { backend: string; source: string }> } | undefined;
    for (let i = 0; i < 50; i++) {
      const state = await request(server).get('/api/admin/storage').set('Cookie', adminCookie);
      stateBody = state.body as typeof stateBody;
      status = (state.body.migrations as Array<{ category: string; status: string }>).find(
        (m) => m.category === 'journey',
      );
      if (status && status.status !== 'running') break;
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(status).toMatchObject({ status: 'done' });
    expect(stateBody!.categories.journey).toEqual({ backend: 'dest', source: 'settings' });
    const audit = db.prepare("SELECT details FROM audit_log WHERE action = 'admin.storage_migration'").get() as { details: string };
    expect(JSON.parse(audit.details)).toEqual({ category: 'journey', to: 'dest' });
  });

  it('STORE2E-011 backfill guards: 401 anon, 404 non-mirror, 409 while running is covered by unit — here the 404', async () => {
    expect((await request(server).post('/api/admin/storage/backends/x/backfill')).status).toBe(401);
    const res = await request(server).post('/api/admin/storage/backends/uploads-local/backfill').set('Cookie', adminCookie);
    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not a mirror');
  });

  it('STORE2E-012 backfill happy path copies pre-existing objects and surfaces in state until done', async () => {
    // Route backups through a mirror with a local replica, then plant a
    // pre-mirror object directly on the primary.
    const nasRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-e2e-nas-'));
    // Override backups-local to a tmp root: WITHOUT this the built-in default
    // is the repo's real server/data/backups directory — never write there.
    const backupsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-e2e-backups-'));
    const put = await request(server)
      .put('/api/admin/storage')
      .set('Cookie', adminCookie)
      .send({
        backends: [
          { name: 'backups-local', type: 'local', options: { root: backupsRoot } },
          { name: 'nas', type: 'local', options: { root: nasRoot } },
          { name: 'm', type: 'mirror', options: { primary: 'backups-local', replicas: ['nas'] } },
        ],
        categories: { backups: 'm' },
        version: 0,
      });
    expect(put.status).toBe(200);
    fs.writeFileSync(path.join(backupsRoot, 'pre-mirror.zip'), 'oldbytes');

    const start = await request(server).post('/api/admin/storage/backends/m/backfill').set('Cookie', adminCookie);
    expect(start.status).toBe(200);
    expect(start.body).toEqual({ started: true });

    // Poll state until the job finishes (tiny local copy — a few ticks).
    let status: { status: string } | undefined;
    for (let i = 0; i < 50; i++) {
      const state = await request(server).get('/api/admin/storage').set('Cookie', adminCookie);
      status = (state.body.backfills as Array<{ backend: string; status: string }>).find((b) => b.backend === 'm');
      if (status && status.status !== 'running') break;
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(status).toMatchObject({ status: 'done' });
    expect(fs.existsSync(path.join(nasRoot, 'pre-mirror.zip'))).toBe(true);
    const audit = db.prepare("SELECT details FROM audit_log WHERE action = 'admin.storage_backfill'").get() as { details: string };
    expect(JSON.parse(audit.details)).toMatchObject({ backend: 'm' });
  });

  it('STORE2E-013 cancel 404s with no active run; stats refresh returns real numbers and audits', async () => {
    expect((await request(server).delete('/api/admin/storage/backends/m/backfill').set('Cookie', adminCookie)).status).toBe(404);
    const res = await request(server).post('/api/admin/storage/stats/refresh').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    expect(res.body.computedAt).toBeGreaterThan(0);
    expect(res.body.categories.backups.objects).toBeGreaterThanOrEqual(1); // pre-mirror.zip at least
    const audit = db.prepare("SELECT COUNT(*) AS n FROM audit_log WHERE action = 'admin.storage_stats_refresh'").get() as { n: number };
    expect(audit.n).toBe(1);
  });

  it('STORE2E-014 regression (audit #7): a migration flip while the admin form is open makes the stale save 409, and the flip survives', async () => {
    const destRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trek-e2e-migration-dest2-'));
    const put = await request(server)
      .put('/api/admin/storage')
      .set('Cookie', adminCookie)
      .send({ backends: [{ name: 'dest', type: 'local', options: { root: destRoot } }], categories: {}, version: 0 });
    expect(put.status).toBe(200);

    // The admin opens the form: their draft is built at THIS version, before
    // the migration below flips anything.
    const loaded = await request(server).get('/api/admin/storage').set('Cookie', adminCookie);
    const staleVersion = loaded.body.version as number;
    expect(staleVersion).toBe(1);
    expect(loaded.body.categories.journey).toEqual({ backend: 'uploads-local', source: 'default' });

    // Meanwhile: a category migration flips 'journey' to 'dest' (empty
    // category, so it completes instantly) — the same write path
    // StorageRegistryService.assignCategory uses, bumping the version.
    const start = await request(server)
      .post('/api/admin/storage/migrations')
      .set('Cookie', adminCookie)
      .send({ category: 'journey', to: 'dest' });
    expect(start.status).toBe(200);
    let status: { status: string } | undefined;
    for (let i = 0; i < 50; i++) {
      const state = await request(server).get('/api/admin/storage').set('Cookie', adminCookie);
      status = (state.body.migrations as Array<{ category: string; status: string }>).find(
        (m) => m.category === 'journey',
      );
      if (status && status.status !== 'running') break;
      await new Promise((r) => setTimeout(r, 100));
    }
    expect(status).toMatchObject({ status: 'done' });

    // The admin's still-open form — unaware of the flip, and carrying no
    // opinion of its own on 'journey' — submits its (now stale) save.
    const staleSave = await request(server)
      .put('/api/admin/storage')
      .set('Cookie', adminCookie)
      .send({
        backends: [{ name: 'dest', type: 'local', options: { root: destRoot } }],
        categories: {},
        version: staleVersion,
      });
    expect(staleSave.status).toBe(409);
    expect(staleSave.body.error).toContain('storage settings changed since this form was loaded');

    // The flip survives — the stale save never silently reverted 'journey'
    // back to its old default.
    const after = await request(server).get('/api/admin/storage').set('Cookie', adminCookie);
    expect(after.body.categories.journey).toEqual({ backend: 'dest', source: 'settings' });
    expect(after.body.version).toBeGreaterThan(staleVersion);
  });
});
