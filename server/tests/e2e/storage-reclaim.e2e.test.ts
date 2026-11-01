/**
 * Storage reclaim e2e: /api/admin/storage/reclaim through the real
 * JwtAuthGuard + AdminGuard + ManagedGuard against a migrated temp SQLite, the
 * Zod pipe on both bodies and the response contracts the handlers declare.
 * This graph holds StorageModule alone, so no domain registers a reference
 * source: every reclaimable category reports `sources_missing` and a pass
 * cannot delete anything, which is the point of the ledger. RCLE-001 to RCLE-007.
 */
import { db } from '../../src/db/database';
import { AppSettings } from '../../src/db/entities/AppSettings.entity';
import { AuditLog } from '../../src/db/entities/AuditLog.entity';
import { ManagedGuard } from '../../src/nest/common/managed.guard';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { StorageJobsService } from '../../src/nest/storage/storage-jobs.service';
import { STORAGE_RECLAIMABLE_CATEGORIES } from '../../src/nest/storage/storage-reclaim.types';
import { StorageModule } from '../../src/nest/storage/storage.module';
import { countRows, deleteRows, findRow } from '../helpers/factories/rows';
import { makeAdmin, makeUser } from '../helpers/factories/users';
import { createTestMikroOrmModule, createTestOrm, type TestOrm } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { sessionCookie } from './harness';
import type { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});
vi.mock('../../src/nest/audit/audit-log.logger', () => ({
  LOG_LEVEL: 'error',
  logInfo: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
  logWarn: vi.fn(),
}));

describe('Storage reclaim e2e (real auth + admin guard + managed guard + migrated temp SQLite)', () => {
  let orm: TestOrm;
  let app: INestApplication;
  let server: Server;
  let adminCookie: string;
  let userCookie: string;

  beforeAll(async () => {
    orm = await createTestOrm(db);
    await makeUser(orm, { id: 1, email: 'e2e-reclaim@example.test' });
    await makeAdmin(orm, { id: 2, email: 'e2e-reclaim-admin@example.test' });
    userCookie = sessionCookie(1);
    adminCookie = sessionCookie(2);
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), StorageModule],
      providers: [{ provide: APP_GUARD, useClass: ManagedGuard }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ZodValidationPipe());
    app.useGlobalFilters(new TrekExceptionFilter());
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await deleteRows(orm, AppSettings, { key: { $like: 'storage.reclaim%' } });
    await deleteRows(orm, AuditLog);
  });

  afterAll(async () => {
    await app.close();
    await orm.close();
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
    for (const body of [{}, { deleteEnabled: 'yes' }, { deleteEnabled: true, extra: 1 }]) {
      const res = await request(server).put('/api/admin/storage/reclaim').set('Cookie', adminCookie).send(body);
      expect(res.status).toBe(400);
    }
    const run = await request(server)
      .post('/api/admin/storage/reclaim/run')
      .set('Cookie', adminCookie)
      .send({ reportOnly: 'no' });
    expect(run.status).toBe(400);
    expect(await countRows(orm, AuditLog)).toBe(0);
  });

  it('RCLE-005: a pass without registered sources skips every reclaimable category, persists and audits', async () => {
    const res = await request(server)
      .post('/api/admin/storage/reclaim/run')
      .set('Cookie', adminCookie)
      .send({ reportOnly: true });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('report');
    for (const category of STORAGE_RECLAIMABLE_CATEGORIES) {
      expect(res.body.categories[category].skipped).toBe('sources_missing');
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
