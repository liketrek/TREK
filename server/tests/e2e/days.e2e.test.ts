/**
 * Days + day-notes module e2e — exercises both migrated mounts through the real
 * JwtAuthGuard against a temp SQLite db. The day/day-note services, the
 * permission check, canAccessTrip and the WebSocket broadcast are mocked.
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

const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../src/db/database', () => ({
  db, canAccessTrip, isOwner: vi.fn(() => true), getPlaceWithTags: vi.fn(), closeDb: () => {}, reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn() }));
vi.mock('../../src/services/permissions', () => ({ checkPermission }));

const { day, note } = vi.hoisted(() => ({
  day: { listDays: vi.fn(), createDay: vi.fn(), getDay: vi.fn(), updateDay: vi.fn(), deleteDay: vi.fn() },
  note: {
    verifyTripAccess: vi.fn(), listNotes: vi.fn(), dayExists: vi.fn(), createNote: vi.fn(),
    getNote: vi.fn(), updateNote: vi.fn(), deleteNote: vi.fn(),
  },
}));
vi.mock('../../src/services/dayService', () => day);
vi.mock('../../src/services/dayNoteService', () => note);

import { DaysModule } from '../../src/nest/days/days.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Days + day-notes e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DaysModule] }).compile();
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
    day.listDays.mockReturnValue({ days: [{ id: 1 }] });
    day.createDay.mockReturnValue({ id: 9 });
    note.listNotes.mockReturnValue([{ id: 1 }]);
    note.dayExists.mockReturnValue(true);
    note.createNote.mockReturnValue({ id: 7 });
  });

  beforeEach(() => {
    canAccessTrip.mockReturnValue({ id: 5, user_id: 1 });
    note.verifyTripAccess.mockReturnValue({ id: 5, user_id: 1 });
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips/5/days')).status).toBe(401);
  });

  it('200 list days (the { days } envelope)', async () => {
    const res = await request(server).get('/api/trips/5/days').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ days: [{ id: 1 }] });
  });

  it('201 create day, 404 trip when not accessible', async () => {
    const ok = await request(server).post('/api/trips/5/days').set('Cookie', sessionCookie(1)).send({ date: '2026-07-01' });
    expect(ok.status).toBe(201);
    expect(ok.body).toEqual({ day: { id: 9 } });
    canAccessTrip.mockReturnValue(undefined);
    const miss = await request(server).get('/api/trips/5/days').set('Cookie', sessionCookie(1));
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Trip not found' });
  });

  it('201 create note, 400 on over-long text (before access)', async () => {
    const ok = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1)).send({ text: 'Lunch' });
    expect(ok.status).toBe(201);
    expect(ok.body).toEqual({ note: { id: 7 } });
    const long = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1)).send({ text: 'x'.repeat(501) });
    expect(long.status).toBe(400);
    expect(long.body).toEqual({ error: 'text must be 500 characters or less' });
  });

  it('400 note without text', async () => {
    const res = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1)).send({ text: '  ' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Text required' });
  });
});
