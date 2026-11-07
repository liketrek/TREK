/**
 * Storage reclaim e2e: /api/admin/storage/reclaim on the whole app (buildApp
 * against the worker's snapshot test db), so the real JwtAuthGuard,
 * AdminGuard and ManagedGuard, the Zod pipe on both bodies and the response
 * contracts the handlers declare all stand in front of it. Every owner
 * domain registers its reference source here, so a pass looks at every
 * reclaimable category; the checks below run in the background and only
 * report. RCLE-001 to RCLE-008.
 */
import { buildApp } from '../../src/bootstrap';
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { StorageInstallService } from '../../src/nest/storage/storage-install.service';
import { StorageJobsService } from '../../src/nest/storage/storage-jobs.service';
import { STORAGE_RECLAIMABLE_CATEGORIES, storageOwnerMarkerKey } from '../../src/nest/storage/storage-reclaim.types';
import { StorageService } from '../../src/nest/storage/storage.service';
import { countRows, deleteRows, findRow } from '../helpers/factories/rows';
import { setAppSetting } from '../helpers/factories/settings';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';
import { STORAGE_RECLAIM_CATEGORIES, type StorageReclaimReport } from '@trek/shared';

import type { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

describe('Storage reclaim e2e (whole app: real auth + admin guard + managed guard)', () => {
  let orm: MikroORM;
  let app: INestApplication;
  let server: Server;
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    app = await buildApp();
    orm = app.get(MikroORM);
    server = app.getHttpServer();
    userCookie = sessionCookie((await makeUser(orm, { email: 'e2e-reclaim@example.test' })).user.id);
    adminCookie = sessionCookie((await makeAdmin(orm, { email: 'e2e-reclaim-admin@example.test' })).user.id);
  });

  beforeEach(async () => {
    await deleteRows(orm, AppSettings, { key: { $like: 'storage.reclaim%' } });
    await deleteRows(orm, AuditLog);
  });

  afterAll(async () => {
    // The uploads folder is the test run's shared one: take back the owner markers this app's checks wrote.
    const installId = app.get(StorageInstallService).installId();
    if (installId) {
      const storage = app.get(StorageService);
      await Promise.all(
        STORAGE_RECLAIMABLE_CATEGORIES.map((category) =>
          storage.delete(category, storageOwnerMarkerKey(installId)).catch(() => undefined),
        ),
      );
    }
    await app?.close();
  });

  /** The admin state's reclaim part once a check started by hand has finished. */
  async function settledState() {
    await app.get(StorageJobsService).exclusiveIdle();
    const res = await request(server).get('/api/admin/storage').set('Cookie', adminCookie);
    expect(res.status).toBe(200);
    return res.body.reclaim;
  }

  it('RCLE-001: 401 without a session on every route', async () => {
    expect((await request(server).put('/api/admin/storage/reclaim').send({ deleteEnabled: true })).status).toBe(401);
    expect((await request(server).post('/api/admin/storage/reclaim/run').send({})).status).toBe(401);
    expect((await request(server).post('/api/admin/storage/reclaim/confirm').send({ category: 'covers' })).status).toBe(
      401,
    );
  });

  it('RCLE-002: 403 for a non-admin, and nothing is stored', async () => {
    const res = await request(server)
      .put('/api/admin/storage/reclaim')
      .set('Cookie', userCookie)
      .send({ deleteEnabled: true });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Admin access required' });
    expect(await findRow(orm, AppSettings, { key: 'storage.reclaim_delete' })).toBeFalsy();
  });

  it('RCLE-003: PUT stores the switch for this install, answers the state, audits, and the admin state carries it', async () => {
    const res = await request(server)
      .put('/api/admin/storage/reclaim')
      .set('Cookie', adminCookie)
      .send({ deleteEnabled: true });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleteEnabled: true, running: false, lastRun: null, lastDeleteRun: null });
    expect(await countRows(orm, AuditLog, { action: 'admin.storage_reclaim_update' })).toBe(1);
    // Stored as the install id it was turned on for, so a database restored elsewhere reads as off. The id
    // comes from the data dir's file, and the database carries a copy it is reconciled with at boot.
    const installId = (await findRow(orm, AppSettings, { key: 'install_id' }))?.value;
    expect(installId).toMatch(/^[0-9a-f-]{36}$/);
    expect(installId).toBe(app.get(StorageInstallService).installId());
    expect((await findRow(orm, AppSettings, { key: 'storage.reclaim_delete' }))?.value).toBe(installId);
    expect((await settledState()).deleteEnabled).toBe(true);
    const off = await request(server)
      .put('/api/admin/storage/reclaim')
      .set('Cookie', adminCookie)
      .send({ deleteEnabled: false });
    expect(off.body.deleteEnabled).toBe(false);
  });

  it('RCLE-004: PUT and confirm refuse a body outside the contract', async () => {
    // One request after the other: a burst of parallel requests on one supertest server resets connections.
    const statusesOf = (method: 'put' | 'post', url: string, bodies: object[]) =>
      bodies.reduce<Promise<number[]>>(async (previous, body) => {
        const done = await previous;
        const res = await request(server)[method](url).set('Cookie', adminCookie).send(body);
        return [...done, res.status];
      }, Promise.resolve([]));
    expect(
      await statusesOf('put', '/api/admin/storage/reclaim', [
        {},
        { deleteEnabled: 'yes' },
        { deleteEnabled: true, extra: 1 },
      ]),
    ).toEqual([400, 400, 400]);
    expect(
      await statusesOf('post', '/api/admin/storage/reclaim/confirm', [
        {},
        { category: 'nowhere', unreferenced: 3 },
        { category: 'covers', count: 3 },
        { category: 'covers' },
        { category: 'covers', unreferenced: -1 },
      ]),
    ).toEqual([400, 400, 400, 400, 400]);
    expect(await countRows(orm, AuditLog)).toBe(0);
  });

  it('RCLE-005: POST run answers 202 at once, the check asks every source, deletes nothing and lands on the state', async () => {
    const res = await request(server).post('/api/admin/storage/reclaim/run').set('Cookie', adminCookie).send({});
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ started: true });
    const audit = await findRow(orm, AuditLog, { action: 'admin.storage_reclaim_run' });
    expect(JSON.parse(String(audit?.details))).toEqual({ mode: 'report' });
    const reclaim = await settledState();
    expect(reclaim.running).toBe(false);
    expect(reclaim.lastRun.mode).toBe('report');
    expect(reclaim.lastDeleteRun).toBeNull();
    for (const category of STORAGE_RECLAIMABLE_CATEGORIES) {
      expect(reclaim.lastRun.categories[category].skipped).not.toBe('sources_missing');
      expect(reclaim.lastRun.categories[category].deleted).toEqual({ objects: 0, bytes: 0 });
    }
    expect(reclaim.lastRun.categories.backups.skipped).toBe('not_reclaimed');
  });

  it('RCLE-006: 409 with a code while another storage job holds the slot, and while nothing waits for a confirmation', async () => {
    const jobs = app.get(StorageJobsService);
    expect(jobs.claimExclusive('a test job')).toBe(true);
    try {
      const res = await request(server).post('/api/admin/storage/reclaim/run').set('Cookie', adminCookie).send({});
      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        error: 'another storage job is running, one storage job at a time',
        code: 'reclaim_busy',
      });
      expect(await countRows(orm, AuditLog)).toBe(0);
    } finally {
      jobs.releaseExclusive('a test job');
    }
    const confirm = await request(server)
      .post('/api/admin/storage/reclaim/confirm')
      .set('Cookie', adminCookie)
      .send({ category: 'covers', unreferenced: 3 });
    expect(confirm.status).toBe(409);
    expect(confirm.body.code).toBe('reclaim_nothing_to_confirm');
  });

  it('RCLE-008: confirm takes the count shown, refuses a stale one with a code, and the prompt goes at once', async () => {
    const none = { objects: 0, bytes: 0 };
    const row = {
      objects: 0,
      unreferenced: none,
      eligible: none,
      deleted: none,
      confirmationRequired: false,
      skipped: null,
    };
    const report: StorageReclaimReport = {
      startedAt: Date.now(),
      finishedAt: Date.now(),
      mode: 'report',
      stopped: null,
      categories: {
        ...(Object.fromEntries(STORAGE_RECLAIM_CATEGORIES.map((c) => [c, row])) as StorageReclaimReport['categories']),
        covers: { ...row, objects: 1000, unreferenced: { objects: 300, bytes: 3000 }, confirmationRequired: true },
      },
    };
    await setAppSetting(orm, 'storage.reclaim_report', JSON.stringify(report));
    const confirm = (unreferenced: number) =>
      request(server)
        .post('/api/admin/storage/reclaim/confirm')
        .set('Cookie', adminCookie)
        .send({ category: 'covers', unreferenced });
    const stale = await confirm(5000);
    expect(stale.status).toBe(409);
    expect(stale.body.code).toBe('reclaim_confirm_stale');
    expect(await countRows(orm, AuditLog)).toBe(0);
    const ok = await confirm(300);
    expect(ok.status).toBe(200);
    expect(ok.body.lastRun.categories.covers.confirmationRequired).toBe(false);
    const audit = await findRow(orm, AuditLog, { action: 'admin.storage_reclaim_confirm' });
    expect(JSON.parse(String(audit?.details))).toEqual({ category: 'covers', unreferenced: 300 });
    expect((await settledState()).lastRun.categories.covers.confirmationRequired).toBe(false);
  });

  it('RCLE-007: managed mode refuses the surface with the standard body', async () => {
    process.env.TREK_MANAGED = 'true';
    try {
      const res = await request(server).post('/api/admin/storage/reclaim/run').set('Cookie', adminCookie).send({});
      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        error: 'This is configured by the operator of this instance.',
        code: 'MANAGED_FORBIDDEN',
      });
    } finally {
      delete process.env.TREK_MANAGED;
    }
  });
});
