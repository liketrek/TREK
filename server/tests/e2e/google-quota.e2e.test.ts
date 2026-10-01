/**
 * /api/admin/google-quota e2e (#1582): the real JwtAuthGuard, AdminGuard and
 * Zod pipe against a temp SQLite db. Admin only, a validated body, and the
 * status reflecting what was stored.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  tmp.exec('CREATE TABLE google_api_usage (day TEXT PRIMARY KEY, calls INTEGER NOT NULL DEFAULT 0);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db, canAccessTrip: vi.fn(), isOwner: vi.fn(), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
}));

import { GoogleQuotaModule } from '../../src/nest/google-quota/google-quota.module';
import { AuditService } from '../../src/nest/audit/audit.service';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

const USER = 1;
const ADMIN = 2;

describe('/api/admin/google-quota e2e (real guards + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  const writeAudit = vi.fn();

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, GoogleQuotaModule],
      providers: [{ provide: APP_PIPE, useClass: ZodValidationPipe }],
    }).overrideProvider(AuditService).useValue({ writeAudit }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: USER });
    seedUser(db as never, { id: ADMIN, email: 'admin@example.com', role: 'admin' });
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
