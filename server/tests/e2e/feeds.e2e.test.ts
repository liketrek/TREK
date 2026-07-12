/**
 * Calendar-feed e2e — exercises the subscribable ICS feeds end-to-end against a
 * temp in-memory SQLite db through the REAL JwtAuthGuard:
 *   - JWT-guarded token endpoints (/api/trips/:id/feed/token, /api/feed/user/token):
 *     lazy generate, idempotency, rotate-invalidates-old, disable-clears-token,
 *     host fallback when APP_URL is unset, 404 on no access, 401 no cookie
 *   - public unguarded feeds (/api/feed/trip/:token.ics, /api/feed/user/:token.ics):
 *     valid token → 200 text/calendar with the injected REFRESH-INTERVAL / X-PUBLISHED-TTL
 *     hints, unknown token → 404, all-trips feed excludes archived + >90-day-old trips
 *
 * exportICS is mocked so the test owns the ICS payload and can assert which trips
 * the all-trips feed pulled in without seeding the full trip/day/reservation schema.
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
    email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user',
    password_version INTEGER NOT NULL DEFAULT 0, feed_token TEXT);`);
  tmp.exec(`CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
    title TEXT, is_archived INTEGER NOT NULL DEFAULT 0, start_date TEXT, end_date TEXT, feed_token TEXT);`);
  tmp.exec(`CREATE TABLE trip_members (trip_id INTEGER NOT NULL, user_id INTEGER NOT NULL);`);
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({ db, closeDb: () => {}, reinitialize: () => {} }));

// Own the ICS payload so we control the events and can assert which trips were pulled.
const SAMPLE_ICS =
  'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TREK//Travel Planner//EN\r\nCALSCALE:GREGORIAN\r\n' +
  'METHOD:PUBLISH\r\nX-WR-CALNAME:Sample\r\n' +
  'BEGIN:VEVENT\r\nUID:trek-trip-x@trek\r\nDTSTAMP:20260101T000000Z\r\n' +
  'DTSTART;VALUE=DATE:20260101\r\nDTEND;VALUE=DATE:20260102\r\nSUMMARY:Sample\r\nEND:VEVENT\r\n' +
  'END:VCALENDAR\r\n';
const { exportICS } = vi.hoisted(() => ({ exportICS: vi.fn() }));
vi.mock('../../src/services/tripService', () => ({ exportICS }));

import { FeedsModule } from '../../src/nest/feeds/feeds.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

const BASE = 'https://trek.example.test';

describe('Calendar-feed e2e (real auth guard + temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let prevAppUrl: string | undefined;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [FeedsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.use(cookieParser());
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    prevAppUrl = process.env.APP_URL;
    process.env.APP_URL = BASE;
    seedUser(db as never, { id: 1, username: 'e2e-user' });
    seedUser(db as never, { id: 2, username: 'other-user', email: 'other@example.test' });
    app = await build();
    server = app.getHttpServer();
  });

  beforeEach(() => {
    exportICS.mockReset();
    exportICS.mockReturnValue({ ics: SAMPLE_ICS, filename: 'sample.ics' });
    // Reset feed tokens + trips between tests for isolation.
    db.exec('DELETE FROM trips; DELETE FROM trip_members; UPDATE users SET feed_token = NULL;');
    db.prepare("INSERT INTO trips (id, user_id, title, is_archived, start_date, end_date) VALUES (5, 1, 'Owned', 0, '2026-01-01', '2099-01-01')").run();
  });

  afterAll(async () => {
    if (prevAppUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = prevAppUrl;
    await app.close();
  });

  // ── Trip token endpoints ───────────────────────────────────────────────────

  it('401 without a session cookie', async () => {
    expect((await request(server).get('/api/trips/5/feed/token')).status).toBe(401);
  });

  it('GET token returns {feed_url:null} before one is generated', async () => {
    const res = await request(server).get('/api/trips/5/feed/token').set('Cookie', sessionCookie(1));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ feed_url: null });
  });

  it('POST generates a token lazily and is idempotent', async () => {
    const first = await request(server).post('/api/trips/5/feed/token').set('Cookie', sessionCookie(1));
    expect(first.status).toBe(201);
    expect(first.body.feed_url).toMatch(new RegExp(`^${BASE}/api/feed/trip/[0-9a-f-]+\\.ics$`));

    const second = await request(server).post('/api/trips/5/feed/token').set('Cookie', sessionCookie(1));
    expect(second.body.feed_url).toBe(first.body.feed_url); // same token, not a new one
  });

  it('PUT rotates: a new token works and the old one 404s', async () => {
    const gen = await request(server).post('/api/trips/5/feed/token').set('Cookie', sessionCookie(1));
    const oldToken = gen.body.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    const rot = await request(server).put('/api/trips/5/feed/token').set('Cookie', sessionCookie(1));
    const newToken = rot.body.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];
    expect(newToken).not.toBe(oldToken);

    expect((await request(server).get(`/api/feed/trip/${oldToken}.ics`)).status).toBe(404);
    expect((await request(server).get(`/api/feed/trip/${newToken}.ics`)).status).toBe(200);
  });

  it('DELETE disables: the token is cleared, the URL 404s, and GET reports null', async () => {
    const gen = await request(server).post('/api/trips/5/feed/token').set('Cookie', sessionCookie(1));
    const token = gen.body.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];
    expect((await request(server).get(`/api/feed/trip/${token}.ics`)).status).toBe(200);

    const del = await request(server).delete('/api/trips/5/feed/token').set('Cookie', sessionCookie(1));
    expect(del.status).toBe(200);
    expect(del.body).toEqual({ feed_url: null });

    expect((await request(server).get(`/api/feed/trip/${token}.ics`)).status).toBe(404);
    const after = await request(server).get('/api/trips/5/feed/token').set('Cookie', sessionCookie(1));
    expect(after.body).toEqual({ feed_url: null });
  });

  it('feed URL falls back to the request host when APP_URL is unset', async () => {
    delete process.env.APP_URL;
    try {
      const gen = await request(server).post('/api/trips/5/feed/token').set('Cookie', sessionCookie(1));
      expect(gen.body.feed_url).toMatch(/^https?:\/\/[^/]+\/api\/feed\/trip\/[0-9a-f-]+\.ics$/);
    } finally {
      process.env.APP_URL = BASE;
    }
  });

  it('404 when generating for a trip the user cannot access', async () => {
    const res = await request(server).post('/api/trips/5/feed/token').set('Cookie', sessionCookie(2));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Trip not found' });
  });

  // ── Public trip feed ───────────────────────────────────────────────────────

  it('public trip feed: 200 text/calendar with injected refresh hints', async () => {
    const gen = await request(server).post('/api/trips/5/feed/token').set('Cookie', sessionCookie(1));
    const token = gen.body.feed_url.match(/trip\/([0-9a-f-]+)\.ics$/)![1];

    const res = await request(server).get(`/api/feed/trip/${token}.ics`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.text).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT1H');
    expect(res.text).toContain('X-PUBLISHED-TTL:PT1H');
    expect(res.text).toContain('BEGIN:VEVENT');
    expect(exportICS).toHaveBeenCalledWith(5);
  });

  it('public trip feed: 404 for an unknown token', async () => {
    const res = await request(server).get('/api/feed/trip/00000000-0000-0000-0000-000000000000.ics');
    expect(res.status).toBe(404);
  });

  // ── User (all-trips) feed ──────────────────────────────────────────────────

  it('user feed token: 401 without a cookie, generates with one', async () => {
    expect((await request(server).get('/api/feed/user/token')).status).toBe(401);
    const gen = await request(server).post('/api/feed/user/token').set('Cookie', sessionCookie(1));
    expect(gen.status).toBe(201);
    expect(gen.body.feed_url).toMatch(new RegExp(`^${BASE}/api/feed/user/[0-9a-f-]+\\.ics$`));
  });

  it('all-trips feed excludes archived and >90-day-old trips', async () => {
    // user 1 already owns active trip 5 (end 2099). Add an archived + a long-finished one.
    db.prepare("INSERT INTO trips (id, user_id, title, is_archived, start_date, end_date) VALUES (6, 1, 'Archived', 1, '2026-01-01', '2099-01-01')").run();
    db.prepare("INSERT INTO trips (id, user_id, title, is_archived, start_date, end_date) VALUES (7, 1, 'Old', 0, '2000-01-01', '2000-01-10')").run();

    const gen = await request(server).post('/api/feed/user/token').set('Cookie', sessionCookie(1));
    const token = gen.body.feed_url.match(/user\/([0-9a-f-]+)\.ics$/)![1];

    const res = await request(server).get(`/api/feed/user/${token}.ics`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.text).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT1H');
    expect(res.text).toContain('X-WR-CALNAME:e2e-user');

    const calledIds = exportICS.mock.calls.map((c) => c[0]).sort();
    expect(calledIds).toEqual([5]); // only the active, recent trip — not 6 (archived) or 7 (old)
  });

  it('all-trips feed includes trips shared with the user as a member, not just owned trips', async () => {
    // user 1 owns active trip 5. Trip 8 is owned by user 2 but shared with user 1 as a
    // member — "All Trips" must include it, mirroring the single-trip feed's member access.
    db.prepare("INSERT INTO trips (id, user_id, title, is_archived, start_date, end_date) VALUES (8, 2, 'Shared', 0, '2026-01-01', '2099-01-01')").run();
    db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (8, 1)').run();

    const gen = await request(server).post('/api/feed/user/token').set('Cookie', sessionCookie(1));
    const token = gen.body.feed_url.match(/user\/([0-9a-f-]+)\.ics$/)![1];

    const res = await request(server).get(`/api/feed/user/${token}.ics`);
    expect(res.status).toBe(200);

    const calledIds = exportICS.mock.calls.map((c) => c[0]).sort();
    expect(calledIds).toEqual([5, 8]); // owned trip 5 AND member trip 8
  });

  it('public user feed: 404 for an unknown token', async () => {
    const res = await request(server).get('/api/feed/user/00000000-0000-0000-0000-000000000000.ics');
    expect(res.status).toBe(404);
  });

  it('all-trips feed carries VTIMEZONE blocks so TZID references resolve (#1453)', async () => {
    // A per-trip calendar whose event references a zone via TZID and defines it.
    const ZONED_ICS =
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//TREK//Travel Planner//EN\r\nCALSCALE:GREGORIAN\r\n' +
      'METHOD:PUBLISH\r\nX-WR-CALNAME:Zoned\r\n' +
      'BEGIN:VTIMEZONE\r\nTZID:Europe/Paris\r\nBEGIN:STANDARD\r\nDTSTART:19700101T000000\r\n' +
      'TZOFFSETFROM:+0100\r\nTZOFFSETTO:+0100\r\nTZNAME:Europe/Paris\r\nEND:STANDARD\r\nEND:VTIMEZONE\r\n' +
      'BEGIN:VEVENT\r\nUID:trek-res-1@trek\r\nDTSTAMP:20260101T000000Z\r\n' +
      'DTSTART;TZID=Europe/Paris:20260602T090000\r\nSUMMARY:Flight\r\nEND:VEVENT\r\n' +
      'END:VCALENDAR\r\n';
    exportICS.mockReturnValue({ ics: ZONED_ICS, filename: 'zoned.ics' });

    const gen = await request(server).post('/api/feed/user/token').set('Cookie', sessionCookie(1));
    const token = gen.body.feed_url.match(/user\/([0-9a-f-]+)\.ics$/)![1];

    const res = await request(server).get(`/api/feed/user/${token}.ics`);
    expect(res.status).toBe(200);
    expect(res.text).toContain('BEGIN:VTIMEZONE\r\nTZID:Europe/Paris');
    expect(res.text).toContain('DTSTART;TZID=Europe/Paris:20260602T090000');
    // VTIMEZONE must precede the VEVENT that references it.
    expect(res.text.indexOf('BEGIN:VTIMEZONE')).toBeLessThan(res.text.indexOf('BEGIN:VEVENT'));
  });
});
