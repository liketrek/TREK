/**
 * System-notices module e2e — exercises the migrated /api/system-notices
 * endpoints through the real JwtAuthGuard against a temp SQLite db. The notices
 * service is mocked so the test doesn't depend on the static registry or the
 * dismissal tables; it focuses on routing, auth, status codes and bodies.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

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

const { mockGetActive, mockDismiss } = vi.hoisted(() => ({ mockGetActive: vi.fn(), mockDismiss: vi.fn() }));
vi.mock('../../src/systemNotices/service', () => ({
  getActiveNoticesFor: mockGetActive,
  dismissNotice: mockDismiss,
}));

import { SystemNoticesModule } from '../../src/nest/system-notices/system-notices.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

const notice = {
  id: 'welcome', display: 'modal', severity: 'info',
  titleKey: 'notice.welcome.title', bodyKey: 'notice.welcome.body', dismissible: true,
};

describe('System-notices e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [SystemNoticesModule] }).compile();
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
    mockGetActive.mockReturnValue([notice]);
    const res = await request(server).get('/api/system-notices/active').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual([notice]);
    expect(mockGetActive).toHaveBeenCalledWith(1);
  });

  it('204 with no body on a successful dismiss', async () => {
    mockDismiss.mockReturnValue(true);
    const res = await request(server).post('/api/system-notices/welcome/dismiss').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
    expect(res.text).toBe('');
    expect(mockDismiss).toHaveBeenCalledWith(1, 'welcome');
  });

  it('404 { error: NOTICE_NOT_FOUND } when the id is unknown', async () => {
    mockDismiss.mockReturnValue(false);
    const res = await request(server).post('/api/system-notices/nope/dismiss').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'NOTICE_NOT_FOUND' });
  });
});
