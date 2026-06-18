/**
 * Budget module e2e — exercises the migrated /api/trips/:tripId/budget endpoints
 * through the real JwtAuthGuard against a temp SQLite db. budgetService, the
 * permission check and the WebSocket broadcast are mocked.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { svc } = vi.hoisted(() => ({
  svc: {
    verifyTripAccess: vi.fn(), listBudgetItems: vi.fn(), createBudgetItem: vi.fn(), updateBudgetItem: vi.fn(),
    deleteBudgetItem: vi.fn(), updateMembers: vi.fn(), toggleMemberPaid: vi.fn(), getPerPersonSummary: vi.fn(),
    calculateSettlement: vi.fn(), reorderBudgetItems: vi.fn(), reorderBudgetCategories: vi.fn(),
    setItemPayers: vi.fn(), listSettlements: vi.fn(), createSettlement: vi.fn(), updateSettlement: vi.fn(), deleteSettlement: vi.fn(),
  },
}));
vi.mock('../../src/services/budgetService', () => svc);

import { BudgetModule } from '../../src/nest/budget/budget.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Budget e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [BudgetModule] }).compile();
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
    svc.listBudgetItems.mockReturnValue([{ id: 1, name: 'Hotel' }]);
    svc.createBudgetItem.mockReturnValue({ id: 9, name: 'Hotel' });
  });

  beforeEach(() => {
    svc.verifyTripAccess.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a session cookie', async () => {
    const res = await request(server).get('/api/trips/5/budget');
    expect(res.status).toBe(401);
  });

  it('200 list for an accessible trip', async () => {
    const res = await request(server).get('/api/trips/5/budget').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [{ id: 1, name: 'Hotel' }] });
  });

  it('404 when the trip is not accessible', async () => {
    svc.verifyTripAccess.mockReturnValue(undefined);
    const res = await request(server).get('/api/trips/5/budget').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  it('201 on create with permission', async () => {
    const res = await request(server).post('/api/trips/5/budget').set('Cookie', sessionCookie(1)).send({ name: 'Hotel' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ item: { id: 9, name: 'Hotel' } });
  });

  it('403 on create without permission', async () => {
    checkPermission.mockReturnValue(false);
    const res = await request(server).post('/api/trips/5/budget').set('Cookie', sessionCookie(1)).send({ name: 'Hotel' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'No permission' });
  });

  it('400 on member update with a non-array user_ids', async () => {
    const res = await request(server).put('/api/trips/5/budget/9/members').set('Cookie', sessionCookie(1)).send({ user_ids: 'no' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'user_ids must be an array' });
  });

  it('200 on settlement update with permission', async () => {
    svc.updateSettlement.mockReturnValue({ id: 7, from_user_id: 2, to_user_id: 1, amount: 15 });
    const res = await request(server).put('/api/trips/5/budget/settlements/7').set('Cookie', sessionCookie(1)).send({ from_user_id: 2, to_user_id: 1, amount: 15 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ settlement: { id: 7, from_user_id: 2, to_user_id: 1, amount: 15 } });
  });

  it('404 on settlement update when it does not exist', async () => {
    svc.updateSettlement.mockReturnValue(null);
    const res = await request(server).put('/api/trips/5/budget/settlements/7').set('Cookie', sessionCookie(1)).send({ from_user_id: 2, to_user_id: 1, amount: 15 });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Settlement not found' });
  });
});
