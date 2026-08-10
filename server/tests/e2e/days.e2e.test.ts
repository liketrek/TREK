/**
 * Days + day-notes module e2e — exercises both migrated mounts through the real
 * JwtAuthGuard against a temp SQLite db. DaysService and DayNotesService run
 * their real SQL via DatabaseModule (the DATABASE_CONNECTION factory picks up
 * the mocked db singleton); trip access resolves through a real-SQL
 * canAccessTrip over the temp db. Only the permission check and the WebSocket
 * broadcast stay mocked.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, vi, type MockInstance } from 'vitest';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import type { Server } from 'http';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { RealtimeModule } from '../../src/nest/realtime/realtime.module';
import { Test } from '@nestjs/testing';
import { seedUser, sessionCookie } from './harness';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0,
    avatar TEXT);`);
  tmp.exec('CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, title TEXT, end_date TEXT);');
  tmp.exec('CREATE TABLE trip_members (trip_id INTEGER NOT NULL, user_id INTEGER NOT NULL);');
  // The tables DaysService really queries (real SQL, no service mock).
  tmp.exec(`CREATE TABLE days (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    day_number INTEGER, date TEXT, title TEXT, notes TEXT, default_transport_mode TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP, UNIQUE(trip_id, day_number));`);
  tmp.exec('CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, color TEXT, icon TEXT);');
  tmp.exec(`CREATE TABLE places (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, name TEXT,
    description TEXT, lat REAL, lng REAL, address TEXT, category_id INTEGER, price REAL, currency TEXT,
    place_time TEXT, end_time TEXT, duration_minutes INTEGER, notes TEXT, image_url TEXT, transport_mode TEXT,
    google_place_id TEXT, google_ftid TEXT, osm_id TEXT, website TEXT, phone TEXT);`);
  tmp.exec(`CREATE TABLE day_assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, day_id INTEGER NOT NULL,
    place_id INTEGER NOT NULL, order_index INTEGER DEFAULT 0, notes TEXT,
    assignment_time TEXT, assignment_end_time TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec('CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER, name TEXT, color TEXT);');
  tmp.exec('CREATE TABLE place_tags (place_id INTEGER NOT NULL, tag_id INTEGER NOT NULL);');
  tmp.exec(`CREATE TABLE assignment_participants (assignment_id INTEGER NOT NULL, user_id INTEGER NOT NULL,
    PRIMARY KEY (assignment_id, user_id));`);
  tmp.exec(`CREATE TABLE day_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, day_id INTEGER NOT NULL,
    trip_id INTEGER NOT NULL, text TEXT NOT NULL, time TEXT, icon TEXT DEFAULT '📝',
    sort_order REAL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  // Reorder/insert touch accommodations + reservation restamping.
  tmp.exec(`CREATE TABLE day_accommodations (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
    place_id INTEGER, start_day_id INTEGER, end_day_id INTEGER, check_in TEXT, check_in_end TEXT,
    check_out TEXT, confirmation TEXT, notes TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE reservations (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER, title TEXT,
    day_id INTEGER, end_day_id INTEGER, type TEXT, status TEXT DEFAULT 'pending', reservation_time TEXT,
    reservation_end_time TEXT, location TEXT, confirmation_number TEXT, notes TEXT, accommodation_id TEXT,
    metadata TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);`);
  tmp.exec(`CREATE TABLE reservation_endpoints (id INTEGER PRIMARY KEY AUTOINCREMENT, reservation_id INTEGER NOT NULL,
    local_date TEXT);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  // Real-SQL trip access over the temp db — DaysService.verifyTripAccess and
  // DatabaseModule both read the mocked singleton.
  canAccessTrip: (tripId: number | string, userId: number) =>
    db.prepare(`
      SELECT t.id, t.user_id FROM trips t
      LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
      WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)
    `).get(userId, tripId, userId),
  isOwner: () => false,
  getPlaceWithTags: () => null,
  closeDb: () => {},
  reinitialize: () => {},
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn() }));

import { PermissionsService } from '../../src/nest/permissions/permissions.service';

// Since the permissions DI migration, the check is a spy on the container's
// PermissionsService singleton (created in beforeAll, after build()).
let checkPermission: MockInstance;

import { DaysModule } from '../../src/nest/days/days.module';
// The note routes nest under the days prefix but live in their own domain now;
// this container has to assemble both or /days/:dayId/notes 404s here while
// working in production.
import { DayNotesModule } from '../../src/nest/day-notes/day-notes.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';
import { ZodValidationPipe } from '../../src/nest/common/zod-validation.pipe';

describe('Days + day-notes e2e (real auth guard + temp SQLite, real day SQL)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, RealtimeModule, DaysModule, DayNotesModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalPipes(new ZodValidationPipe());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    seedUser(db as never, { id: 1 });
    db.prepare('INSERT INTO trips (id, user_id, title) VALUES (5, 1, ?)').run('Trip');
    db.prepare('INSERT INTO days (id, trip_id, day_number) VALUES (3, 5, 1)').run();
    app = await build();
    checkPermission = vi.spyOn(app.get(PermissionsService), 'checkPermission');
    server = app.getHttpServer();
  });

  beforeEach(() => {
    db.prepare('DELETE FROM day_notes').run();
    checkPermission.mockReturnValue(true);
  });

  afterAll(async () => {
    await app.close();
  });

  it('401 without a cookie', async () => {
    expect((await request(server).get('/api/trips/5/days')).status).toBe(401);
  });

  it('200 list days (the { days } envelope, real rows with assignments + notes_items)', async () => {
    const res = await request(server).get('/api/trips/5/days').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body.days).toHaveLength(1);
    expect(res.body.days[0]).toMatchObject({ id: 3, trip_id: 5, day_number: 1, assignments: [], notes_items: [] });
  });

  it('201 create day (real insert, auto day_number), 404 trip when not accessible', async () => {
    const ok = await request(server).post('/api/trips/5/days').set('Cookie', sessionCookie(1)).send({ date: '2026-07-01' });
    expect(ok.status).toBe(201);
    expect(ok.body.day).toMatchObject({ trip_id: 5, day_number: 2, date: '2026-07-01', assignments: [] });
    const row = db.prepare('SELECT * FROM days WHERE id = ?').get(ok.body.day.id);
    expect(row).toMatchObject({ trip_id: 5, day_number: 2, date: '2026-07-01' });
    db.prepare('DELETE FROM days WHERE id = ?').run(ok.body.day.id);
    const miss = await request(server).get('/api/trips/77/days').set('Cookie', sessionCookie(1));
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Trip not found' });
  });

  it('200 update day notes/title, 404 Day not found, 403 without permission', async () => {
    const res = await request(server).put('/api/trips/5/days/3').set('Cookie', sessionCookie(1))
      .send({ notes: 'Walking day', title: 'Arrival' });
    expect(res.status).toBe(200);
    expect(res.body.day).toMatchObject({ id: 3, notes: 'Walking day', title: 'Arrival', assignments: [] });
    // The client updates title and notes in separate requests — an omitted
    // field must survive (post-port defect fix: the legacy update always wrote
    // both columns, so a title-only PUT wiped the notes).
    const titleOnly = await request(server).put('/api/trips/5/days/3').set('Cookie', sessionCookie(1))
      .send({ title: 'Renamed' });
    expect(titleOnly.status).toBe(200);
    expect(titleOnly.body.day).toMatchObject({ id: 3, notes: 'Walking day', title: 'Renamed' });
    const notesOnly = await request(server).put('/api/trips/5/days/3').set('Cookie', sessionCookie(1))
      .send({ notes: 'Museum day' });
    expect(notesOnly.status).toBe(200);
    expect(notesOnly.body.day).toMatchObject({ id: 3, notes: 'Museum day', title: 'Renamed' });
    const miss = await request(server).put('/api/trips/5/days/99').set('Cookie', sessionCookie(1)).send({ notes: 'x' });
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Day not found' });
    checkPermission.mockReturnValue(false);
    const forbidden = await request(server).put('/api/trips/5/days/3').set('Cookie', sessionCookie(1)).send({ notes: 'x' });
    expect(forbidden.status).toBe(403);
    expect(forbidden.body).toEqual({ error: 'No permission' });
  });

  it('200 transport setter changes only default_transport_mode', async () => {
    db.prepare('UPDATE days SET notes = ?, title = ? WHERE id = 3').run('Keep', 'Kept');
    const res = await request(server).put('/api/trips/5/days/3/transport').set('Cookie', sessionCookie(1))
      .send({ transport_mode: 'walk' });
    expect(res.status).toBe(200);
    expect(res.body.day).toMatchObject({ id: 3, default_transport_mode: 'walk', notes: 'Keep', title: 'Kept' });
  });

  it('200 reorder permutes day_number, 400 on a non-permutation', async () => {
    db.prepare('INSERT INTO trips (id, user_id, title) VALUES (6, 1, ?)').run('Reorder');
    const a = Number(db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (6, 1, ?)').run('2026-03-01').lastInsertRowid);
    const b = Number(db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (6, 2, ?)').run('2026-03-02').lastInsertRowid);
    const ok = await request(server).put('/api/trips/6/days/reorder').set('Cookie', sessionCookie(1))
      .send({ orderedIds: [b, a] });
    expect(ok.status).toBe(200);
    expect(ok.body).toEqual({ success: true });
    const after = db.prepare('SELECT id, date FROM days WHERE trip_id = 6 ORDER BY day_number').all() as { id: number; date: string }[];
    // Dates stay pinned to slots; the rows swapped positions.
    expect(after.map(d => d.id)).toEqual([b, a]);
    expect(after.map(d => d.date)).toEqual(['2026-03-01', '2026-03-02']);
    const bad = await request(server).put('/api/trips/6/days/reorder').set('Cookie', sessionCookie(1))
      .send({ orderedIds: [b] });
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ error: 'orderedIds must be a permutation of the trip day ids.' });
  });

  it('200 delete day removes the row', async () => {
    db.prepare('INSERT INTO trips (id, user_id, title) VALUES (7, 1, ?)').run('Delete');
    const id = Number(db.prepare('INSERT INTO days (trip_id, day_number) VALUES (7, 1)').run().lastInsertRowid);
    const res = await request(server).delete(`/api/trips/7/days/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(db.prepare('SELECT * FROM days WHERE id = ?').get(id)).toBeUndefined();
  });

  it('201 create note (real insert: trim, empty-string coercions), 400 on over-long text (before access)', async () => {
    const ok = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1))
      .send({ text: '  Lunch  ', time: '', icon: '', sort_order: 0 });
    expect(ok.status).toBe(201);
    expect(ok.body.note).toMatchObject({ day_id: 3, trip_id: 5, text: 'Lunch', time: null, icon: '📝', sort_order: 0 });
    const row = db.prepare('SELECT * FROM day_notes WHERE id = ?').get(ok.body.note.id);
    expect(row).toMatchObject({ text: 'Lunch', time: null, icon: '📝', sort_order: 0 });
    const long = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1)).send({ text: 'x'.repeat(501) });
    expect(long.status).toBe(400);
    expect(long.body.error).toContain('text');
  });

  it('201 create accepts null time/icon (moveDayNote re-sends the nullable entity fields)', async () => {
    const res = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1))
      .send({ text: 'Moved', time: null, icon: null, sort_order: 3 });
    expect(res.status).toBe(201);
    expect(res.body.note).toMatchObject({ text: 'Moved', time: null, icon: '📝', sort_order: 3 });
  });

  it('404 Day not found when the day is not on the trip', async () => {
    const res = await request(server).post('/api/trips/5/days/99/notes').set('Cookie', sessionCookie(1)).send({ text: 'Lunch' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Day not found' });
  });

  it('400 note without text', async () => {
    const res = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1)).send({ text: '  ' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Text required' });
  });

  it('200 update note merges omitted fields from the current row', async () => {
    const created = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1))
      .send({ text: 'Lunch', time: '12:00' });
    const id = created.body.note.id;
    const res = await request(server).put(`/api/trips/5/days/3/notes/${id}`).set('Cookie', sessionCookie(1))
      .send({ icon: '🍜' });
    expect(res.status).toBe(200);
    expect(res.body.note).toMatchObject({ id, text: 'Lunch', time: '12:00', icon: '🍜' });
    const miss = await request(server).put('/api/trips/5/days/3/notes/9999').set('Cookie', sessionCookie(1)).send({ text: 'x' });
    expect(miss.status).toBe(404);
    expect(miss.body).toEqual({ error: 'Note not found' });
  });

  it('200 delete note removes the row', async () => {
    const created = await request(server).post('/api/trips/5/days/3/notes').set('Cookie', sessionCookie(1)).send({ text: 'Lunch' });
    const id = created.body.note.id;
    const res = await request(server).delete(`/api/trips/5/days/3/notes/${id}`).set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    expect(db.prepare('SELECT * FROM day_notes WHERE id = ?').get(id)).toBeUndefined();
  });
});
