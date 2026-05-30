/**
 * Vacay module e2e — exercises the migrated /api/addons/vacay endpoints through
 * the real JwtAuthGuard against a temp SQLite db. vacayService is mocked; this
 * focuses on auth, status codes (POSTs stay 200) and a couple of validation/403
 * bodies.
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

const { svc } = vi.hoisted(() => ({
  svc: {
    getPlanData: vi.fn(), getActivePlanId: vi.fn(), getActivePlan: vi.fn(), updatePlan: vi.fn(),
    addHolidayCalendar: vi.fn(), updateHolidayCalendar: vi.fn(), deleteHolidayCalendar: vi.fn(),
    getPlanUsers: vi.fn(), setUserColor: vi.fn(), sendInvite: vi.fn(), acceptInvite: vi.fn(),
    declineInvite: vi.fn(), cancelInvite: vi.fn(), dissolvePlan: vi.fn(), getAvailableUsers: vi.fn(),
    listYears: vi.fn(), addYear: vi.fn(), deleteYear: vi.fn(), getEntries: vi.fn(),
    toggleEntry: vi.fn(), toggleCompanyHoliday: vi.fn(), getStats: vi.fn(), updateStats: vi.fn(),
    getCountries: vi.fn(), getHolidays: vi.fn(),
  },
}));
vi.mock('../../src/services/vacayService', () => svc);

import { VacayModule } from '../../src/nest/vacay/vacay.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Vacay e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [VacayModule] }).compile();
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
    svc.getActivePlanId.mockReturnValue(10);
    svc.getActivePlan.mockReturnValue({ id: 10 });
    svc.getPlanUsers.mockReturnValue([{ id: 1 }]);
    svc.getPlanData.mockReturnValue({ plan: { id: 10 } });
    svc.toggleEntry.mockReturnValue({ action: 'added' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/addons/vacay/plan');
    expect(res.status).toBe(401);
  });

  it('200 plan for an authenticated user', async () => {
    const res = await request(server).get('/api/addons/vacay/plan').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ plan: { id: 10 } });
  });

  it('200 (not 201) on POST entries/toggle, forwarding the socket id', async () => {
    const res = await request(server).post('/api/addons/vacay/entries/toggle')
      .set('Cookie', sessionCookie(1)).set('X-Socket-Id', 'sock-7').send({ date: '2026-07-01' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ action: 'added' });
    expect(svc.toggleEntry).toHaveBeenCalledWith(1, 10, '2026-07-01', 'sock-7');
  });

  it('400 on entries/toggle without a date', async () => {
    const res = await request(server).post('/api/addons/vacay/entries/toggle').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'date required' });
  });

  it('403 on color for a user not in the plan', async () => {
    const res = await request(server).put('/api/addons/vacay/color').set('Cookie', sessionCookie(1)).send({ color: '#fff', target_user_id: 99 });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'User not in plan' });
  });
});
