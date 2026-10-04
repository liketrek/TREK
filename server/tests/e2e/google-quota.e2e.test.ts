/**
 * /api/admin/google-quota e2e (#1582): the real JwtAuthGuard, AdminGuard and
 * Zod pipe against the migrated snapshot db. Admin only, a validated body, and the
 * status reflecting what was stored.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { sessionCookie } from './harness';

vi.mock('../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { db } from '../../src/db/database';
import { GoogleQuotaModule } from '../../src/nest/google-quota/google-quota.module';
import { AuditService } from '../../src/nest/audit/audit.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { createTestMikroOrmModule } from '../helpers/test-orm';

const USER = 1;
const ADMIN = 2;

describe('/api/admin/google-quota e2e (real guards + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  const writeAudit = vi.fn();

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), GoogleQuotaModule],
    }).overrideProvider(AuditService).useValue({ writeAudit }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): DTO-typed bodies validate by metatype.
    nest.useGlobalPipes(new ZodValidationPipe());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    // harness.ts's seedUser() omits password_hash, which the migrated schema
    // requires NOT NULL, so the two accounts are inserted here directly.
    const insertUser = db.prepare(
      'INSERT INTO users (id, username, email, password_hash, role, password_version) VALUES (?, ?, ?, ?, ?, 0)',
    );
    insertUser.run(USER, 'e2e-user', 'e2e@example.test', 'x', 'user');
    insertUser.run(ADMIN, 'e2e-admin', 'admin@example.com', 'x', 'admin');
    db.prepare("DELETE FROM app_settings WHERE key = 'google_daily_limit'").run();
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GQUOTA-E2E-001: 401 without a cookie and 403 for a non-admin', async () => {
    expect((await request(server).get('/api/admin/google-quota')).status).toBe(401);
    expect((await request(server).get('/api/admin/google-quota').set('Cookie', sessionCookie(USER))).status).toBe(403);
    expect((await request(server).put('/api/admin/google-quota').set('Cookie', sessionCookie(USER)).send({ daily_limit: 5 })).status).toBe(403);
  });

  it('GQUOTA-E2E-002: stores the ceiling, reports today, and audits the change', async () => {
    db.prepare("INSERT OR REPLACE INTO google_api_usage (day, calls) VALUES (date('now'), 7)").run();
    const put = await request(server).put('/api/admin/google-quota').set('Cookie', sessionCookie(ADMIN)).send({ daily_limit: 5 });
    expect(put.status).toBe(200);
    expect(put.body).toEqual({ daily_limit: 5, used_today: 7, exhausted: true });
    expect(writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'admin.google_daily_limit', details: { daily_limit: 5 } }));

    const get = await request(server).get('/api/admin/google-quota').set('Cookie', sessionCookie(ADMIN));
    expect(get.body).toEqual({ daily_limit: 5, used_today: 7, exhausted: true });

    const off = await request(server).put('/api/admin/google-quota').set('Cookie', sessionCookie(ADMIN)).send({ daily_limit: null });
    expect(off.body).toEqual({ daily_limit: null, used_today: 7, exhausted: false });
  });

  it('GQUOTA-E2E-003: 400 from the pipe for a body that is not a whole, non-negative number or null', async () => {
    for (const bad of [{ daily_limit: -1 }, { daily_limit: 1.5 }, { daily_limit: 'many' }, {}]) {
      const res = await request(server).put('/api/admin/google-quota').set('Cookie', sessionCookie(ADMIN)).send(bad);
      expect(res.status, JSON.stringify(bad)).toBe(400);
    }
  });
});
