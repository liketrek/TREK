/**
 * Vacay module e2e — exercises the migrated /api/addons/vacay endpoints through
 * the real JwtAuthGuard against a temp SQLite db. DI-native: VacayService runs
 * its real SQL over the temp db (no legacy service mock); only the websocket
 * and notification side channels stay mocked. Focuses on auth, status codes
 * (POSTs stay 200), the Zod-pipe 400 envelope and a 403 body.
 */
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { VacayModule } from '../../src/nest/vacay/vacay.module';
import { broadcastToUser } from '../../src/websocket';
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
  // The vacay tables VacayService's real SQL touches (trimmed from src/db/schema.ts,
  // with the fraction/kind columns the migrations add to vacay_entries).
  tmp.exec(`CREATE TABLE vacay_plans (id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    block_weekends INTEGER DEFAULT 1, holidays_enabled INTEGER DEFAULT 0, holidays_region TEXT DEFAULT '',
    school_holidays_enabled INTEGER DEFAULT 0, company_holidays_enabled INTEGER DEFAULT 1,
    carry_over_enabled INTEGER DEFAULT 1, weekend_days TEXT, week_start INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(owner_id));`);
  tmp.exec(`CREATE TABLE vacay_plan_members (id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(plan_id, user_id));`);
  tmp.exec(`CREATE TABLE vacay_user_colors (id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
    color TEXT DEFAULT '#6366f1', UNIQUE(user_id, plan_id));`);
  tmp.exec(`CREATE TABLE vacay_years (id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
    year INTEGER NOT NULL, UNIQUE(plan_id, year));`);
  tmp.exec(`CREATE TABLE vacay_user_years (id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
    year INTEGER NOT NULL, vacation_days INTEGER DEFAULT 30, carried_over INTEGER DEFAULT 0,
    UNIQUE(user_id, plan_id, year));`);
  tmp.exec(`CREATE TABLE vacay_entries (id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date TEXT NOT NULL, note TEXT DEFAULT '',
    fraction REAL NOT NULL DEFAULT 1, kind TEXT NOT NULL DEFAULT 'vacation',
    UNIQUE(user_id, plan_id, date));`);
  tmp.exec(`CREATE TABLE vacay_company_holidays (id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
    date TEXT NOT NULL, note TEXT DEFAULT '', UNIQUE(plan_id, date));`);
  tmp.exec(`CREATE TABLE vacay_holiday_calendars (id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL REFERENCES vacay_plans(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'public_holiday', region TEXT NOT NULL, label TEXT,
    color TEXT NOT NULL DEFAULT '#fecaca', sort_order INTEGER NOT NULL DEFAULT 0);`);
  tmp.exec(`CREATE TABLE vacay_shares (id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hidden INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(owner_id, user_id));`);
  tmp.exec(`CREATE TABLE vacay_user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    year_type TEXT NOT NULL DEFAULT 'calendar', year_start_month INTEGER NOT NULL DEFAULT 1,
    year_start_day INTEGER NOT NULL DEFAULT 1, hire_date TEXT);`);
  // StorageRegistryService (behind StorageModule, now in this module chain) reads
  // this at onModuleInit.
  tmp.exec('CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));
vi.mock('../../src/websocket', () => ({ broadcastToUser: vi.fn() }));

describe('Vacay e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule, RealtimeModule, VacayModule],
    }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    // Mirror the production APP_PIPE (app.module.ts): DTO-typed bodies validate
    // by metatype, exactly as they do under buildApp().
    nest.useGlobalPipes(new ZodValidationPipe());
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
    const res = await request(server).get('/api/addons/vacay/plan');
    expect(res.status).toBe(401);
  });

  it('200 plan for an authenticated user (lazily creates the plan)', async () => {
    const res = await request(server).get('/api/addons/vacay/plan').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.plan.owner_id).toBe(1);
    expect(res.body.isOwner).toBe(true);
    expect(db.prepare('SELECT id FROM vacay_plans WHERE owner_id = 1').get()).toBeDefined();
  });

  it('200 (not 201) on POST entries/toggle, forwarding the socket id', async () => {
    const res = await request(server)
      .post('/api/addons/vacay/entries/toggle')
      .set('Cookie', sessionCookie(1))
      .set('X-Socket-Id', 'sock-7')
      .send({ date: '2026-07-01' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ action: 'added', fraction: 1, kind: 'vacation' });
    expect(db.prepare("SELECT id FROM vacay_entries WHERE user_id = 1 AND date = '2026-07-01'").get()).toBeDefined();
    expect(vi.mocked(broadcastToUser)).toHaveBeenCalledWith(1, { type: 'vacay:update' }, 'sock-7');
  });

  it('400 from the Zod pipe on entries/toggle without a date', async () => {
    const res = await request(server).post('/api/addons/vacay/entries/toggle').set('Cookie', sessionCookie(1)).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('date');
  });

  it('403 on color for a user not in the plan', async () => {
    const res = await request(server)
      .put('/api/addons/vacay/color')
      .set('Cookie', sessionCookie(1))
      .send({ color: '#fff', target_user_id: 99 });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'User not in plan' });
  });
});
