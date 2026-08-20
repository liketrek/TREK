/**
 * Migration test for incoming_leg_transport_mode on day_assignments, plus
 * read-path parity: the field must survive both the single-assignment
 * projection and the day-LIST projection.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import type { INestApplication } from '@nestjs/common';

const Database = require('better-sqlite3');

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';

let testDb: any;

beforeAll(() => {
  testDb = new Database(':memory:');
  testDb.exec('PRAGMA journal_mode = WAL');
  testDb.exec('PRAGMA foreign_keys = ON');
  createTables(testDb);
  runMigrations(testDb);
});

afterAll(() => {
  testDb.close();
});

describe('incoming_leg_transport_mode migration', () => {
  it('adds a nullable incoming_leg_transport_mode column to day_assignments', () => {
    const cols = testDb.prepare(`PRAGMA table_info(day_assignments)`).all() as { name: string }[];
    expect(cols.map(c => c.name)).toContain('incoming_leg_transport_mode');
  });

  // The case above starts from an empty database and runs every migration, so it
  // passes wherever a migration sits in the array.
  it('the trailing migration lands on a database that is one version behind', () => {
    // What actually has to hold: existing installs replay only the slots above
    // their schema_version, so a migration inserted mid-array is silently
    // skipped on every one of them. Undoing what the LAST migration did and
    // rewinding one version is the only way to prove it still runs.
    //
    // >>> Appending a migration? Re-point the "undo" below at whatever yours
    // >>> does. That is the whole maintenance cost of this guard. The current
    // >>> trailing slot clears the GB rows out of place_regions, because the
    // >>> atlas bundle now carries Great Britain at county/borough level and
    // >>> the cached GB-ENG rows would otherwise never be re-derived (#1974).
    const upgraded = new Database(':memory:');
    upgraded.exec('PRAGMA foreign_keys = ON');
    createTables(upgraded);
    runMigrations(upgraded);

    const { version } = upgraded.prepare('SELECT version FROM schema_version').get() as { version: number };

    // Put back exactly what that migration exists to remove: a stale cache row
    // pointing at the constituent-country polygon, plus one for another country
    // that must survive untouched.
    upgraded.exec(`
      INSERT INTO users (id, username, email, password_hash) VALUES (900, 'u', 'u@e.test', 'x');
      INSERT INTO trips (id, user_id, title) VALUES (900, 900, 'Trip');
      INSERT INTO places (id, trip_id, name) VALUES (9001, 900, 'Camden Market');
      INSERT INTO places (id, trip_id, name) VALUES (9002, 900, 'Sagrada Familia');
      INSERT INTO place_regions (place_id, country_code, region_code, region_name)
        VALUES (9001, 'GB', 'GB-ENG', 'England'), (9002, 'ES', 'ES-CT', 'Catalunya');
    `);

    upgraded.prepare('UPDATE schema_version SET version = ?').run(version - 1);

    runMigrations(upgraded);

    // The assertion that proves the trailing slot ran.
    expect(
      upgraded.prepare("SELECT place_id FROM place_regions WHERE country_code = 'GB'").get()
    ).toBeUndefined();
    // ...and that it kept to its own country.
    expect(
      upgraded.prepare("SELECT region_code FROM place_regions WHERE place_id = 9002").get()
    ).toEqual({ region_code: 'ES-CT' });
    expect(upgraded.prepare('SELECT version FROM schema_version').get()).toEqual({ version });
    upgraded.close();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Read-path parity (day-LIST endpoint) — mirrors the harness in
// tests/integration/assignments.test.ts verbatim.
// ─────────────────────────────────────────────────────────────────────────────

const { testDb2, dbMock } = vi.hoisted(() => {
  const Database2 = require('better-sqlite3');
  const db = new Database2(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: (placeId: number) => {
      const place: any = db.prepare(`SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?`).get(placeId);
      if (!place) return null;
      const tags = db.prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`).all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon } : null, tags };
    },
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb2: db, dbMock: mock };
});

vi.mock('../../src/db/database', () => dbMock);
vi.mock('../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
  SESSION_DURATION: '24h',
  SESSION_DURATION_MS: 86400000,
  SESSION_DURATION_SECONDS: 86400,
  DEFAULT_LANGUAGE: 'en',
}));
vi.mock('../../src/websocket', () => ({ broadcast: vi.fn(), broadcastToUser: vi.fn() }));

import { buildApp } from '../../src/bootstrap';
import { resetTestDb, resetRateLimits } from '../helpers/test-db';
import { createUser, createTrip, createDay, createPlace } from '../helpers/factories';
import { authCookie } from '../helpers/auth';

describe('incoming_leg_transport_mode read-path parity', () => {
  let nestApp: INestApplication;
  let app: Application;

  beforeAll(async () => {
    createTables(testDb2);
    runMigrations(testDb2);
    nestApp = await buildApp();
    app = nestApp.getHttpAdapter().getInstance();
  });

  beforeEach(() => {
    resetTestDb(testDb2);
    resetRateLimits(nestApp);
  });

  afterAll(async () => {
    await nestApp.close();
    testDb2.close();
  });

  it('round-trips incoming_leg_transport_mode through the day-LIST endpoint', async () => {
    const { user } = createUser(testDb2);
    const trip = createTrip(testDb2, user.id);
    const day = createDay(testDb2, trip.id, { date: '2025-06-01' });
    const place = createPlace(testDb2, trip.id, { name: 'Test Place' });

    const create = await request(app)
      .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
      .set('Cookie', authCookie(user.id))
      .send({ place_id: place.id });
    expect(create.status).toBe(201);
    const assignmentId = create.body.assignment.id;

    testDb2.prepare('UPDATE day_assignments SET incoming_leg_transport_mode = ? WHERE id = ?').run('transit', assignmentId);

    const res = await request(app)
      .get(`/api/trips/${trip.id}/days`)
      .set('Cookie', authCookie(user.id));
    expect(res.status).toBe(200);
    const foundDay = res.body.days.find((d: any) => d.id === day.id);
    const a = foundDay.assignments.find((x: any) => x.id === assignmentId);
    expect(a.incoming_leg_transport_mode).toBe('transit');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Write path — PUT .../transport gains `direction` (outgoing|incoming).
  // ───────────────────────────────────────────────────────────────────────────

  describe('PUT /assignments/:id/transport direction', () => {
    it('defaults to outgoing (back-compat)', async () => {
      const { user } = createUser(testDb2);
      const trip = createTrip(testDb2, user.id);
      const day = createDay(testDb2, trip.id, { date: '2025-06-01' });
      const place = createPlace(testDb2, trip.id, { name: 'Test Place' });

      const create = await request(app)
        .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
        .set('Cookie', authCookie(user.id))
        .send({ place_id: place.id });
      const assignmentId = create.body.assignment.id;

      const res = await request(app)
        .put(`/api/trips/${trip.id}/assignments/${assignmentId}/transport`)
        .set('Cookie', authCookie(user.id))
        .send({ transport_mode: 'cycling' });
      expect(res.status).toBe(200);

      const row = testDb2.prepare('SELECT leg_transport_mode, incoming_leg_transport_mode FROM day_assignments WHERE id = ?').get(assignmentId);
      expect(row.leg_transport_mode).toBe('cycling');
      expect(row.incoming_leg_transport_mode).toBeNull();
    });

    it("direction: 'incoming' writes the incoming column", async () => {
      const { user } = createUser(testDb2);
      const trip = createTrip(testDb2, user.id);
      const day = createDay(testDb2, trip.id, { date: '2025-06-01' });
      const place = createPlace(testDb2, trip.id, { name: 'Test Place' });

      const create = await request(app)
        .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
        .set('Cookie', authCookie(user.id))
        .send({ place_id: place.id });
      const assignmentId = create.body.assignment.id;

      const res = await request(app)
        .put(`/api/trips/${trip.id}/assignments/${assignmentId}/transport`)
        .set('Cookie', authCookie(user.id))
        .send({ transport_mode: 'transit', direction: 'incoming' });
      expect(res.status).toBe(200);

      const row = testDb2.prepare('SELECT incoming_leg_transport_mode FROM day_assignments WHERE id = ?').get(assignmentId);
      expect(row.incoming_leg_transport_mode).toBe('transit');
    });

    it('rejects an invalid direction with 400', async () => {
      const { user } = createUser(testDb2);
      const trip = createTrip(testDb2, user.id);
      const day = createDay(testDb2, trip.id, { date: '2025-06-01' });
      const place = createPlace(testDb2, trip.id, { name: 'Test Place' });

      const create = await request(app)
        .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
        .set('Cookie', authCookie(user.id))
        .send({ place_id: place.id });
      const assignmentId = create.body.assignment.id;

      const res = await request(app)
        .put(`/api/trips/${trip.id}/assignments/${assignmentId}/transport`)
        .set('Cookie', authCookie(user.id))
        .send({ transport_mode: 'walking', direction: 'sideways' });
      expect(res.status).toBe(400);
    });

    it('outgoing and incoming leg modes on one stop persist independently', async () => {
      const { user } = createUser(testDb2);
      const trip = createTrip(testDb2, user.id);
      const day = createDay(testDb2, trip.id, { date: '2025-06-01' });
      const place = createPlace(testDb2, trip.id, { name: 'Test Place' });

      const create = await request(app)
        .post(`/api/trips/${trip.id}/days/${day.id}/assignments`)
        .set('Cookie', authCookie(user.id))
        .send({ place_id: place.id });
      const assignmentId = create.body.assignment.id;

      await request(app)
        .put(`/api/trips/${trip.id}/assignments/${assignmentId}/transport`)
        .set('Cookie', authCookie(user.id))
        .send({ transport_mode: 'cycling' })
        .expect(200);

      await request(app)
        .put(`/api/trips/${trip.id}/assignments/${assignmentId}/transport`)
        .set('Cookie', authCookie(user.id))
        .send({ transport_mode: 'transit', direction: 'incoming' })
        .expect(200);

      const row = testDb2.prepare('SELECT leg_transport_mode, incoming_leg_transport_mode FROM day_assignments WHERE id = ?').get(assignmentId);
      expect(row.leg_transport_mode).toBe('cycling');
      expect(row.incoming_leg_transport_mode).toBe('transit');

      const res = await request(app)
        .get(`/api/trips/${trip.id}/days`)
        .set('Cookie', authCookie(user.id));
      expect(res.status).toBe(200);
      const foundDay = res.body.days.find((d: any) => d.id === day.id);
      const a = foundDay.assignments.find((x: any) => x.id === assignmentId);
      expect(a.leg_transport_mode).toBe('cycling');
      expect(a.incoming_leg_transport_mode).toBe('transit');
    });
  });
});
