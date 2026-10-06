/**
 * System-notices module e2e — exercises the migrated /api/system-notices
 * endpoints through the real JwtAuthGuard against a temp SQLite db. Focuses on
 * routing, auth, status codes and bodies, per its original scope.
 *
 * Plan 3f Task 6: `getActiveNoticesFor`/`dismissNotice` (formerly a separately
 * mockable plain module, `../../src/systemNotices/service.ts`) are now private
 * methods absorbed into `SystemNoticesService` itself, so there is no longer a
 * seam below the Nest provider to mock — `SystemNoticesService` is overridden
 * as a whole via Nest's `overrideProvider`, the same boundary
 * `system-notices.controller.test.ts` already mocks at. The release-layout
 * gating this test used to exercise through that lower seam (with a real
 * `SystemNoticesService` calling a mocked `getActiveNoticesFor`) is proven
 * directly against the real class in `system-notices.service.test.ts` instead,
 * now that the gating logic and the notice list it filters live in the one
 * class this file would otherwise have to fully re-implement to keep testing
 * through HTTP.
 */
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { SystemNoticesModule } from '../../src/nest/system-notices/system-notices.module';
import { SystemNoticesService } from '../../src/nest/system-notices/system-notices.service';
import { createTestMikroOrmModule } from '../helpers/test-orm';
import { TestUnitOfWorkModule } from '../helpers/test-uow';
import { seedUser, sessionCookie } from './harness';
import { Test } from '@nestjs/testing';

import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

const notice = {
  id: 'welcome',
  display: 'modal',
  severity: 'info',
  titleKey: 'notice.welcome.title',
  bodyKey: 'notice.welcome.body',
  dismissible: true,
};

describe('System-notices e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  const getActiveFor = vi.fn().mockResolvedValue([]);
  const dismiss = vi.fn().mockResolvedValue(true);

  async function build() {
    // DatabaseModule is @Global in the real app; a partial graph has to
    // provide it for SystemNoticesModule's AddonsModule import (the
    // addons.e2e precedent). createTestMikroOrmModule for the same import's
    // MikroOrmModule.forFeature (Plan 3a Task 4) and for SystemNoticesModule's
    // own MikroOrmModule.forFeature (Plan 3f Task 6) — no case here reaches a
    // real repository (SystemNoticesService is overridden below), so the
    // minimal `users`-only schema above is enough.
    const moduleRef = await Test.createTestingModule({
      imports: [await TestUnitOfWorkModule.forRoot(db), await createTestMikroOrmModule(db), SystemNoticesModule],
    })
      .overrideProvider(SystemNoticesService)
      .useValue({ getActiveFor, dismiss })
      .compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/system-notices/active');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Access token required', code: 'AUTH_REQUIRED' });
  });

  it('200 with the active notices for the user', async () => {
    getActiveFor.mockResolvedValueOnce([notice]);
    const res = await request(server).get('/api/system-notices/active').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([notice]);
    expect(getActiveFor).toHaveBeenCalledWith(1, new Set(), undefined);
  });

  it("passes ?supports=/?ui= through as the controller's own parsed arguments", async () => {
    getActiveFor.mockResolvedValueOnce([]);
    await request(server)
      .get('/api/system-notices/active')
      .query({ supports: 'release,banner', ui: '4.3.0' })
      .set('Cookie', sessionCookie(1));
    expect(getActiveFor).toHaveBeenLastCalledWith(1, new Set(['release', 'banner']), '4.3.0');
  });

  it('204 with no body on a successful dismiss', async () => {
    dismiss.mockResolvedValueOnce(true);
    const res = await request(server).post('/api/system-notices/welcome/dismiss').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(res.text).toBe('');
    expect(dismiss).toHaveBeenCalledWith(1, 'welcome');
  });

  it('404 { error: NOTICE_NOT_FOUND } when the id is unknown', async () => {
    dismiss.mockResolvedValueOnce(false);
    const res = await request(server).post('/api/system-notices/nope/dismiss').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'NOTICE_NOT_FOUND' });
  });
});
