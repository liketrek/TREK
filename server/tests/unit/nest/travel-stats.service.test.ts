/**
 * travel-stats.service.test.ts
 *
 * getTravelStats lives on AtlasService, but its cases get their own file rather
 * than joining atlas.service.test.ts. That file carries the admin1 GeoJSON
 * bundle warm-up in beforeAll (issue #48) and its ATLAS-UNIT-021..024 cases sit
 * close to the 15s limit under a fully parallel run; adding eighteen more cases
 * to the same file pushed them over. Same DB-per-file pattern, no shared state.
 *
 * The cases moved from auth.service.test.ts with the method; AUTH-DB-* case IDs
 * are preserved so the history stays greppable.
 */

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = { db, closeDb: () => {}, reinitialize: () => {}, canAccessTrip: () => undefined, isOwner: () => false };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);

import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from 'vitest';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createPlace, createReservation } from '../../helpers/factories';
import { AtlasService } from '../../../src/nest/atlas/atlas.service';
import { DatabaseService } from '../../../src/nest/database/database.service';

const atlas = new AtlasService(new DatabaseService(testDb));

beforeAll(() => { createTables(testDb); runMigrations(testDb); });
beforeEach(() => { resetTestDb(testDb); vi.clearAllMocks(); });
afterAll(() => { testDb.close(); });

// ---------------------------------------------------------------------------
// getTravelStats — moved here from auth.service.test.ts together with the
// method itself. Case IDs preserved so the history stays greppable.
// ---------------------------------------------------------------------------
// ── getTravelStats — dashboard passport card ────────────────────────────────

describe('getTravelStats', () => {
  function endpoint(
    reservationId: number,
    role: 'from' | 'to' | 'stop',
    sequence: number,
    lat: number,
    lng: number,
    code: string | null = null,
    localDate: string | null = null,
    localTime: string | null = null
  ) {
    testDb.prepare(
      'INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, lat, lng, code, local_date, local_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(reservationId, role, sequence, `Endpoint ${sequence}`, lat, lng, code, localDate, localTime);
  }

  // Every trip below is dated in the past: since #1048 the passport card only counts
  // countries from trips that have already started, so a dateless fixture would make
  // these role-filter/tombstone assertions vacuous.
  const PAST_START = '2023-05-01';
  const PAST_END = '2023-05-10';

  it('AUTH-DB-047: #1486 counts the from/to countries of a flight', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Tokyo Trip', start_date: PAST_START, end_date: PAST_END });
    const res = createReservation(testDb, trip.id, { type: 'flight' });
    endpoint(res.id, 'from', 0, 50.9014, 4.4844);   // Brussels
    endpoint(res.id, 'to', 1, 35.6762, 139.6503);   // Tokyo

    const stats = atlas.getTravelStats(user.id);
    expect(stats.countries).toContain('BE');
    expect(stats.countries).toContain('JP');
  });

  it('AUTH-DB-048: #1486 a connecting-flight layover does NOT count as visited', () => {
    // The Atlas query grew a role filter for #1486 but this copy of it did not, so the
    // dashboard passport card still counted a plane change as a visited country.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Connection Trip', start_date: PAST_START, end_date: PAST_END });
    const res = createReservation(testDb, trip.id, { type: 'flight' });
    endpoint(res.id, 'from', 0, 50.9014, 4.4844);     // Brussels
    endpoint(res.id, 'stop', 1, 35.6762, 139.6503);   // Tokyo — never leaves the airport
    endpoint(res.id, 'to', 2, -33.8688, 151.2093);    // Sydney

    const stats = atlas.getTravelStats(user.id);
    expect(stats.countries).toContain('BE');
    expect(stats.countries).toContain('AU');
    expect(stats.countries).not.toContain('JP');
  });

  it('AUTH-DB-049: #1490 a country removed in Atlas is not counted on the dashboard either', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Tokyo Trip', start_date: PAST_START, end_date: PAST_END });
    const res = createReservation(testDb, trip.id, { type: 'flight' });
    endpoint(res.id, 'from', 0, 50.9014, 4.4844);
    endpoint(res.id, 'to', 1, 35.6762, 139.6503);

    expect(atlas.getTravelStats(user.id).countries).toContain('JP');

    atlas.unmarkCountry(user.id, 'JP');

    const after = atlas.getTravelStats(user.id);
    expect(after.countries).not.toContain('JP');
    expect(after.countries).toContain('BE');
  });

  // ── #1048: the passport card only stamps trips that have happened ──────────
  // Relative offsets, not literal dates — a hardcoded "future" date expires.
  const iso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

  function placeInRegion(tripId: number, countryCode: string, regionCode: string) {
    const place = createPlace(testDb, tripId, { name: `Place in ${countryCode}` });
    testDb
      .prepare('INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)')
      .run(place.id, countryCode, regionCode, regionCode);
  }

  it('AUTH-DB-094: #1048 a place in a future trip does not stamp its country; a past trip does', () => {
    const { user } = createUser(testDb);
    const past = createTrip(testDb, user.id, { title: 'Paris, last month', start_date: iso(-40), end_date: iso(-30) });
    const future = createTrip(testDb, user.id, { title: 'Tokyo, next month', start_date: iso(30), end_date: iso(40) });
    placeInRegion(past.id, 'FR', 'FR-75');
    placeInRegion(future.id, 'JP', 'JP-13');

    const stats = atlas.getTravelStats(user.id);

    expect(stats.countries).toContain('FR');
    expect(stats.countries).not.toContain('JP');
  });

  it('AUTH-DB-095: #1048 a trip with no dates at all stamps nothing', () => {
    const { user } = createUser(testDb);
    const dateless = createTrip(testDb, user.id, { title: 'Someday: Japan' });
    placeInRegion(dateless.id, 'JP', 'JP-13');
    const res = createReservation(testDb, dateless.id, { type: 'flight' });
    endpoint(res.id, 'from', 0, 50.9014, 4.4844); // Brussels

    const stats = atlas.getTravelStats(user.id);

    expect(stats.countries).toEqual([]);
  });

  it('AUTH-DB-096: #1048 a flight booked for a future trip does not stamp its endpoints', () => {
    const { user } = createUser(testDb);
    const future = createTrip(testDb, user.id, { title: 'Tokyo, next month', start_date: iso(30), end_date: iso(40) });
    const res = createReservation(testDb, future.id, { type: 'flight' });
    endpoint(res.id, 'from', 0, 50.9014, 4.4844);   // Brussels
    endpoint(res.id, 'to', 1, 35.6762, 139.6503);   // Tokyo

    const stats = atlas.getTravelStats(user.id);

    expect(stats.countries).not.toContain('BE');
    expect(stats.countries).not.toContain('JP');
  });

  // ── #1535: the layover split over two bookings ─────────────────────────────
  // The passport card derives its countries from the same endpoints, so it needs the
  // same pairing: a hub stored as the 'to' of one booking and the 'from' of the next
  // slips past the #1486 role filter. Brussels → Helsinki → New York.

  function splitChainThroughHelsinki(tripId: number, onwardDate: string, onwardTime: string) {
    const inbound = createReservation(testDb, tripId, { type: 'flight', title: 'BRU-HEL' });
    endpoint(inbound.id, 'from', 0, 50.9014, 4.4844, 'BRU', '2023-05-01', '07:00');
    endpoint(inbound.id, 'to', 1, 60.3172, 24.9633, 'HEL', '2023-05-01', '09:30');
    const onward = createReservation(testDb, tripId, { type: 'flight', title: 'HEL-JFK' });
    endpoint(onward.id, 'from', 0, 60.3172, 24.9633, 'HEL', onwardDate, onwardTime);
    endpoint(onward.id, 'to', 1, 40.6413, -73.7781, 'JFK', onwardDate, '15:00');
  }

  it('AUTH-DB-099: #1535 a plane change booked as two flights does not stamp the hub country', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'New York via Helsinki', start_date: PAST_START, end_date: PAST_END });
    splitChainThroughHelsinki(trip.id, '2023-05-01', '11:00');

    const stats = atlas.getTravelStats(user.id);
    expect(stats.countries).toContain('BE');
    expect(stats.countries).toContain('US');
    expect(stats.countries).not.toContain('FI');
  });

  it('AUTH-DB-100: #1535 a stopover of two days still stamps the hub country', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Helsinki stopover', start_date: PAST_START, end_date: PAST_END });
    splitChainThroughHelsinki(trip.id, '2023-05-03', '11:00');

    expect(atlas.getTravelStats(user.id).countries).toContain('FI');
  });

  it('AUTH-DB-101: #1490 removing a country still subtracts it around the layover pairing', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'New York via Helsinki', start_date: PAST_START, end_date: PAST_END });
    splitChainThroughHelsinki(trip.id, '2023-05-01', '11:00');

    atlas.unmarkCountry(user.id, 'BE');

    const stats = atlas.getTravelStats(user.id);
    expect(stats.countries).not.toContain('BE');
    expect(stats.countries).toContain('US');
  });

  it('AUTH-DB-097: #1048 a manually marked country stays stamped regardless of trip dates', () => {
    // The manual list is the user's own word, not derived from a trip — the date
    // filter must not reach it.
    const { user } = createUser(testDb);
    const future = createTrip(testDb, user.id, { title: 'Tokyo, next month', start_date: iso(30), end_date: iso(40) });
    placeInRegion(future.id, 'JP', 'JP-13');
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'JP');

    const stats = atlas.getTravelStats(user.id);

    expect(stats.countries).toContain('JP');
  });
});

describe('travel-stats quirk fixes', () => {
  it('AUTH-DB-089: getTravelStats keeps a place at lat 0 / lng 0 (equator, prime meridian)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Null Island' });
    testDb.prepare('INSERT INTO places (trip_id, name, lat, lng) VALUES (?, ?, ?, ?)').run(trip.id, 'Null Island', 0, 0);
    const stats = atlas.getTravelStats(user.id);
    expect(stats.coords).toContainEqual({ lat: 0, lng: 0 });
  });
});
