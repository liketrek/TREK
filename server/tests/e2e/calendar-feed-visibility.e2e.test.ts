/**
 * Calendar-feed visibility e2e — proves the staged-booking gate holds on the
 * one path that needs no session at all: the public /api/feed/trip/:token.ics.
 *
 * tests/e2e/feeds.e2e.test.ts cannot cover this. It mocks buildTripCalendar and
 * never creates a reservations table, so it owns the calendar parts and the SQL
 * filter is invisible to it. This file runs the REAL CalendarService against a
 * real migrated SQLite instead, and asserts on the bytes a calendar client
 * would receive.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import type { Server } from 'http';
import { Test } from '@nestjs/testing';

const { db } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require('better-sqlite3');
  const tmp = new Database(':memory:');
  tmp.exec('PRAGMA journal_mode = WAL');
  return { db: tmp };
});

vi.mock('../../src/db/database', () => ({
  db,
  canAccessTrip: (tripId: number | string, userId: number) =>
    db.prepare('SELECT id, user_id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  isOwner: () => true,
  getPlaceWithTags: () => null,
  closeDb: () => {},
  reinitialize: () => {},
}));

import { createTables } from '../../src/db/schema';
import { runMigrations } from '../../src/db/migrations';
import { DatabaseModule } from '../../src/nest/database/database.module';
import { FeedsModule } from '../../src/nest/feeds/feeds.module';
import { TrekExceptionFilter } from '../../src/nest/common/trek-exception.filter';

describe('Calendar feed visibility e2e (real CalendarService over temp SQLite)', () => {
  let server: Server;
  let app: Awaited<ReturnType<typeof build>>;
  let feedToken: string;

  async function build() {
    const moduleRef = await Test.createTestingModule({ imports: [DatabaseModule, FeedsModule] }).compile();
    const nest = moduleRef.createNestApplication();
    nest.useGlobalFilters(new TrekExceptionFilter());
    await nest.init();
    return nest;
  }

  beforeAll(async () => {
    createTables(db);
    runMigrations(db);
    db.prepare(
      "INSERT INTO users (id, username, email, password_hash, role) VALUES (1, 'e2e-user', 'e2e@example.test', 'x', 'user')",
    ).run();
    feedToken = 'feed-token-visibility';
    db.prepare(
      "INSERT INTO trips (id, user_id, title, start_date, end_date, feed_token) VALUES (1, 1, 'Kyoto', '2026-09-01', '2026-09-05', ?)",
    ).run(feedToken);
    db.prepare("INSERT INTO days (id, trip_id, day_number, date) VALUES (1, 1, 1, '2026-09-01')").run();
    db.prepare(`INSERT INTO reservations (trip_id, day_id, title, type, status, reservation_time, confirmation_number, ingest_state)
      VALUES (1, 1, 'Parked Flight', 'flight', 'confirmed', '2026-09-01T08:00', 'SECRET1', 'staged')`).run();
    db.prepare(`INSERT INTO reservations (trip_id, day_id, title, type, status, reservation_time, confirmation_number)
      VALUES (1, 1, 'Booked Flight', 'flight', 'confirmed', '2026-09-01T12:00', 'OPEN1')`).run();

    app = await build();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('the public feed serves the live booking and neither the staged one nor its confirmation number', async () => {
    const res = await request(server).get(`/api/feed/trip/${feedToken}.ics`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/calendar');
    expect(res.text).toContain('SUMMARY:Booked Flight');
    expect(res.text).not.toContain('Parked Flight');
    // The number rides in the DESCRIPTION, so search the whole document.
    expect(res.text).not.toContain('SECRET1');
    expect(res.text).toContain('OPEN1');
  });
});
