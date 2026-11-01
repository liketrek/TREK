/**
 * Storage reclaim e2e: /api/admin/storage/reclaim on the whole app (buildApp
 * against the worker's snapshot test db), so the real JwtAuthGuard,
 * AdminGuard and ManagedGuard, the Zod pipe on both bodies and the response
 * contracts the handlers declare all stand in front of it. Every owner
 * domain registers its reference source here, so a pass looks at every
 * reclaimable category; the passes below only report. RCLE-001 to RCLE-007.
 */
import { buildApp } from '../../src/bootstrap';
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { StorageJobsService } from '../../src/nest/storage/storage-jobs.service';
import { STORAGE_RECLAIMABLE_CATEGORIES } from '../../src/nest/storage/storage-reclaim.types';
import { countRows, deleteRows, findRow } from '../helpers/factories/rows';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { sessionCookie } from './harness';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

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
    await app?.close();
  });

  it('RCLE-001: 401 without a session on both routes', async () => {
    expect((await request(server).put('/api/admin/storage/reclaim').send({ deleteEnabled: true })).status).toBe(401);
    expect((await request(server).post('/api/admin/storage/reclaim/run').send({})).status).toBe(401);
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

  it('RCLE-003: PUT stores the switch, answers the state, audits, and GET /api/admin/storage carries it', async () => {
    const res = await request(server)
      .put('/api/admin/storage/reclaim')
      .set('Cookie', adminCookie)
      .send({ deleteEnabled: true });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ deleteEnabled: true, lastRun: null });
    expect(await countRows(orm, AuditLog, { action: 'admin.storage_reclaim_update' })).toBe(1);
    const state = await request(server).get('/api/admin/storage').set('Cookie', adminCookie);
    expect(state.status).toBe(200);
    expect(state.body.reclaim).toEqual({ deleteEnabled: true, lastRun: null });
  });

  it('RCLE-004: PUT refuses a body outside the contract', async () => {
    const refused = await Promise.all(
      [{}, { deleteEnabled: 'yes' }, { deleteEnabled: true, extra: 1 }].map((body) =>
        request(server).put('/api/admin/storage/reclaim').set('Cookie', adminCookie).send(body),
      ),
    );
    expect(refused.map((res) => res.status)).toEqual([400, 400, 400]);
    const run = await request(server)
      .post('/api/admin/storage/reclaim/run')
      .set('Cookie', adminCookie)
      .send({ reportOnly: 'no' });
    expect(run.status).toBe(400);
    expect(await countRows(orm, AuditLog)).toBe(0);
  });

  it('RCLE-005: a report-only pass asks every registered source, deletes nothing, persists and audits', async () => {
    const res = await request(server)
      .post('/api/admin/storage/reclaim/run')
      .set('Cookie', adminCookie)
      .send({ reportOnly: true });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('report');
    for (const category of STORAGE_RECLAIMABLE_CATEGORIES) {
      expect(res.body.categories[category].skipped).not.toBe('sources_missing');
      expect(res.body.categories[category].deleted).toEqual({ objects: 0, bytes: 0 });
    }
    expect(res.body.categories.backups.skipped).toBe('not_reclaimed');
    const audit = await findRow(orm, AuditLog, { action: 'admin.storage_reclaim_run' });
    expect(JSON.parse(String(audit?.details))).toEqual({ mode: 'report', deleted: 0, bytes: 0 });
    const state = await request(server).get('/api/admin/storage').set('Cookie', adminCookie);
    expect(state.body.reclaim.lastRun).toEqual(res.body);
  });

  it('RCLE-006: 409 while another storage job holds the slot', async () => {
    const jobs = app.get(StorageJobsService);
    expect(jobs.claimExclusive('a test job')).toBe(true);
    try {
      const res = await request(server).post('/api/admin/storage/reclaim/run').set('Cookie', adminCookie).send({});
      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: 'another storage job is running, one storage job at a time' });
      expect(await countRows(orm, AuditLog)).toBe(0);
    } finally {
      jobs.releaseExclusive('a test job');
    }
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
