/**
 * Public API v1 e2e — the real ApiTokenGuard and real SQL against a temp SQLite db.
 *
 * The unit tests pin the shaping; this one exists for the question a mock cannot
 * answer: does a token actually only reach its owner's trips? Two users, two trips,
 * and every path that could leak one into the other is exercised — the list, the
 * detail route, and a trip shared by membership (which must be visible, because
 * that is TREK's access model, not an exception to it).
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';
import { createHash } from 'crypto';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  tmp.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'user', password_version INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE mcp_tokens (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      name TEXT NOT NULL, token_hash TEXT NOT NULL, token_prefix TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_used_at DATETIME);
    CREATE TABLE trips (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL,
      title TEXT NOT NULL, description TEXT, start_date TEXT, end_date TEXT, currency TEXT,
      is_archived INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE trip_members (trip_id INTEGER NOT NULL, user_id INTEGER NOT NULL);
    CREATE TABLE days (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
      day_number INTEGER NOT NULL, date TEXT NOT NULL, notes TEXT, title TEXT);
    CREATE TABLE places (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
      name TEXT NOT NULL, address TEXT, lat REAL, lng REAL, category_id INTEGER,
      place_time TEXT, end_time TEXT, duration_minutes INTEGER, notes TEXT, transport_mode TEXT);
    CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
    CREATE TABLE day_assignments (id INTEGER PRIMARY KEY AUTOINCREMENT, day_id INTEGER NOT NULL,
      place_id INTEGER NOT NULL, order_index INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE day_notes (id INTEGER PRIMARY KEY AUTOINCREMENT, day_id INTEGER NOT NULL,
      trip_id INTEGER NOT NULL, text TEXT NOT NULL, time TEXT, icon TEXT, sort_order REAL DEFAULT 0);
    CREATE TABLE day_accommodations (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
      place_id INTEGER, start_day_id INTEGER, end_day_id INTEGER, check_in TEXT, check_in_end TEXT,
      check_out TEXT, confirmation TEXT, notes TEXT);
    CREATE TABLE reservations (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL,
      day_id INTEGER, end_day_id INTEGER, place_id INTEGER, assignment_id INTEGER, title TEXT,
      accommodation_id TEXT, reservation_time TEXT, reservation_end_time TEXT, location TEXT,
      confirmation_number TEXT, notes TEXT, status TEXT, type TEXT);
  `);
  return { db: tmp };
});

vi.mock('../../src/db/database', async (importActual) => {
  const actual = await importActual<typeof import('../../src/db/database')>();
  return {
    ...actual,
    db,
    closeDb: () => {},
    reinitialize: () => {},
    canAccessTrip: (tripId: number | string, userId: number) =>
      db
        .prepare(
          `SELECT t.id, t.user_id, t.currency FROM trips t
             LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ?
            WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`,
        )
        .get(userId, tripId, userId),
  };
});

import { DatabaseModule } from '../../src/nest/database/database.module';
import { RateLimitModule } from '../../src/nest/common/rate-limit.module';
import { PublicApiModule } from '../../src/nest/public-api/public-api.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

/** Mints a token the way TokenService does, so the guard's hash lookup is real. */
function seedToken(userId: number, raw: string): string {
  db.prepare('INSERT INTO mcp_tokens (user_id, name, token_hash, token_prefix) VALUES (?, ?, ?, ?)').run(
    userId,
    'test',
    createHash('sha256').update(raw).digest('hex'),
    raw.slice(0, 13),
  );
  return raw;
}

const ADA_TOKEN = 'trek_' + 'a'.repeat(48);
const BOB_TOKEN = 'trek_' + 'b'.repeat(48);

describe('Public API v1 e2e (real guard + real SQL)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, RateLimitModule, PublicApiModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    db.prepare("INSERT INTO users (id, username, email) VALUES (1, 'ada', 'ada@example.com')").run();
    db.prepare("INSERT INTO users (id, username, email) VALUES (2, 'bob', 'bob@example.com')").run();
    seedToken(1, ADA_TOKEN);
    seedToken(2, BOB_TOKEN);

    // Ada owns trip 1; Bob owns trip 2; trip 3 is Bob's but Ada is a member.
    db.prepare(
      "INSERT INTO trips (id, user_id, title, description, start_date, end_date, currency) VALUES (1, 1, 'Toskana', 'Wein', '2026-06-14', '2026-06-16', 'EUR')",
    ).run();
    db.prepare("INSERT INTO trips (id, user_id, title, start_date) VALUES (2, 2, 'Bobs Secret', '2026-07-01')").run();
    db.prepare("INSERT INTO trips (id, user_id, title, start_date) VALUES (3, 2, 'Shared', '2026-08-01')").run();
    db.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (3, 1)').run();

    db.prepare("INSERT INTO days (id, trip_id, day_number, date, title) VALUES (1, 1, 1, '2026-06-14', 'Ankunft')").run();
    db.prepare("INSERT INTO days (id, trip_id, day_number, date) VALUES (2, 1, 2, '2026-06-15')").run();
    db.prepare("INSERT INTO categories (id, name) VALUES (1, 'Museum')").run();
    db.prepare(
      "INSERT INTO places (id, trip_id, name, address, lat, lng, category_id, place_time, duration_minutes, transport_mode) VALUES (1, 1, 'Uffizien', 'Firenze', 43.76, 11.25, 1, '14:00', 180, 'walking')",
    ).run();
    db.prepare("INSERT INTO places (id, trip_id, name, lat, lng) VALUES (2, 1, 'Ponte Vecchio', 43.76, 11.24)").run();
    db.prepare("INSERT INTO places (id, trip_id, name) VALUES (3, 1, 'Hotel Alba')").run();
    // Deliberately inserted out of order to prove order_index decides the sequence.
    db.prepare('INSERT INTO day_assignments (day_id, place_id, order_index) VALUES (1, 2, 1)').run();
    db.prepare('INSERT INTO day_assignments (day_id, place_id, order_index) VALUES (1, 1, 0)').run();
    db.prepare("INSERT INTO day_notes (day_id, trip_id, text, time, sort_order) VALUES (1, 1, 'Tickets mitnehmen', '09:00', 0)").run();
    db.prepare(
      "INSERT INTO reservations (trip_id, day_id, type, title, location, reservation_time, status) VALUES (1, 1, 'flight', 'LH 1234', 'FRA', '2026-06-14T08:00', 'confirmed')",
    ).run();
    db.prepare(
      "INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id, check_in, check_out) VALUES (1, 3, 1, 2, '15:00', '11:00')",
    ).run();

    app = await build();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app?.close();
  });

  const get = (path: string, token?: string) => {
    const req = request(server).get(path);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  describe('authentication', () => {
    it('401s without a token', async () => {
      const res = await get('/api/v1/trips');
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'API token required', code: 'API_TOKEN_REQUIRED' });
    });

    it('401s on an unknown token', async () => {
      expect((await get('/api/v1/trips', 'trek_' + 'z'.repeat(48))).status).toBe(401);
    });

    it('accepts the token via X-API-Key too', async () => {
      const res = await request(server).get('/api/v1/trips').set('X-API-Key', ADA_TOKEN);
      expect(res.status).toBe(200);
    });

    it('records last_used_at so a stale token is visible in settings', async () => {
      await get('/api/v1/trips', ADA_TOKEN);
      const row = db.prepare('SELECT last_used_at FROM mcp_tokens WHERE user_id = 1').get() as {
        last_used_at: string | null;
      };
      expect(row.last_used_at).not.toBeNull();
    });
  });

  /** The isolation tests. Everything else is convenience; these are the point. */
  describe('access isolation', () => {
    it("lists only the caller's own and shared trips", async () => {
      const res = await get('/api/v1/trips', ADA_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body.trips.map((t: { id: number }) => t.id).sort()).toEqual([1, 3]);
    });

    it("does not leak another user's trip into the list", async () => {
      const res = await get('/api/v1/trips', BOB_TOKEN);
      expect(res.body.trips.map((t: { id: number }) => t.id).sort()).toEqual([2, 3]);
      expect(JSON.stringify(res.body)).not.toContain('Toskana');
    });

    it("404s on another user's trip, identically to one that does not exist", async () => {
      const foreign = await get('/api/v1/trips/2', ADA_TOKEN);
      const missing = await get('/api/v1/trips/424242', ADA_TOKEN);
      expect(foreign.status).toBe(404);
      expect(foreign.body).toEqual({ error: 'Trip not found' });
      expect(missing.status).toBe(foreign.status);
      expect(missing.body).toEqual(foreign.body);
    });

    it('serves a trip shared by membership, because that is the access model', async () => {
      const res = await get('/api/v1/trips/3', ADA_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Shared');
    });
  });

  describe('payload', () => {
    it('returns the whole itinerary by default, in planned order', async () => {
      const res = await get('/api/v1/trips/1', ADA_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: 1,
        title: 'Toskana',
        description: 'Wein',
        start_date: '2026-06-14',
        currency: 'EUR',
        archived: false,
      });
      expect(res.body.days).toHaveLength(2);

      const [first] = res.body.days;
      expect(first.date).toBe('2026-06-14');
      expect(first.title).toBe('Ankunft');
      expect(first.places.map((p: { name: string }) => p.name)).toEqual(['Uffizien', 'Ponte Vecchio']);
      expect(first.places[0]).toMatchObject({
        lat: 43.76,
        time: '14:00',
        duration_minutes: 180,
        category: 'Museum',
        transport_mode: 'walking',
      });
      expect(first.day_notes).toEqual([{ text: 'Tickets mitnehmen', time: '09:00' }]);
      expect(first.reservations[0]).toMatchObject({ type: 'flight', title: 'LH 1234', status: 'confirmed' });
    });

    it('resolves accommodation day ids into ISO dates', async () => {
      const res = await get('/api/v1/trips/1', ADA_TOKEN);
      expect(res.body.accommodations).toEqual([
        {
          name: 'Hotel Alba',
          address: null,
          lat: null,
          lng: null,
          start_date: '2026-06-14',
          end_date: '2026-06-15',
          check_in: '15:00',
          check_out: '11:00',
          notes: null,
        },
      ]);
    });

    it('never exposes internal ids or foreign keys', async () => {
      const res = await get('/api/v1/trips/1', ADA_TOKEN);
      const serialised = JSON.stringify(res.body);
      for (const leak of ['user_id', 'day_id', 'place_id', 'order_index', 'trip_id', 'assignment_id']) {
        expect(serialised).not.toContain(leak);
      }
    });

    it('omits sections the caller did not ask for, rather than sending them empty', async () => {
      const res = await get('/api/v1/trips/1?include=days,notes', ADA_TOKEN);
      expect(res.status).toBe(200);
      expect(res.body.accommodations).toBeUndefined();
      expect(res.body.days[0].day_notes).toHaveLength(1);
      expect(res.body.days[0].places).toEqual([]);
      expect(res.body.days[0].reservations).toEqual([]);
    });

    it('400s on an unknown include section', async () => {
      const res = await get('/api/v1/trips/1?include=days,nope', ADA_TOKEN);
      expect(res.status).toBe(400);
    });

    it('400s on a non-numeric trip id', async () => {
      expect((await get('/api/v1/trips/abc', ADA_TOKEN)).status).toBe(400);
    });
  });
});
