/**
 * journeyStats() — the SQL half of the journey figures (#1973).
 *
 * A real in-memory SQLite DB, because what is being tested here is the queries:
 * which rows become the route, how a place assigned to three days is counted
 * once, and which source wins when a journey has both entries and trip places.
 * The arithmetic those rows feed into has its own tests in journey-stats.test.ts.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  return {
    testDb: db,
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      getPlaceWithTags: () => null,
      canAccessTrip: () => null,
      isOwner: () => false,
    },
  };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcastToUser: vi.fn() }));

/*
 * The country lookup is stubbed rather than exercised. The real one loads and
 * indexes 4MB of gzipped admin-0 boundaries on first call — minutes of work
 * across a test suite, to verify a function that belongs to Atlas and has its
 * own tests. What matters here is *which coordinates get asked about* and that
 * the place_regions cache is preferred, both of which the stub shows.
 */
const countryCalls: [number, number][] = [];
vi.mock('../../../src/nest/atlas/atlas-geo', () => ({
  getCountryFromCoords: (lat: number, lng: number) => {
    countryCalls.push([lat, lng]);
    // Rough boxes, enough to tell two countries apart in a fixture.
    if (lat > 63 && lng < -13) return 'IS';
    if (lat > 47 && lat < 55 && lng > 5 && lng < 15) return 'DE';
    if (lat > 42 && lat < 51 && lng > -5 && lng < 8) return 'FR';
    return null;
  },
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import {
  createUser, createTrip, createJourney, createJourneyEntry, createPlace,
  createDay, createDayAssignment, linkTripToJourney,
} from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { db as dbConn } from '../../../src/db/database';

const dbs = new DatabaseService(dbConn);
const svc = new JourneyDomainService(dbs, new RealtimeService(), new TrekPhotosRepository(dbs));

/** The factory has no coordinate fields, and a route is made of coordinates. */
function placeEntry(
  journeyId: number,
  authorId: number,
  lat: number,
  lng: number,
  overrides: { title?: string; entry_date?: string } = {},
) {
  const entry = createJourneyEntry(testDb, journeyId, authorId, overrides);
  testDb
    .prepare('UPDATE journey_entries SET location_lat = ?, location_lng = ? WHERE id = ?')
    .run(lat, lng, entry.id);
  return entry;
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  countryCalls.length = 0;
});

afterAll(() => {
  testDb.close();
});

describe('journeyStats access', () => {
  it('is null for a journey the user cannot see', () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    expect(svc.journeyStats(journey.id, stranger.id)).toBeNull();
  });

  it('is null for a journey that does not exist', () => {
    const { user } = createUser(testDb);
    expect(svc.journeyStats(999_999, user.id)).toBeNull();
  });

  it('answers for the owner', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const stats = svc.journeyStats(journey.id, user.id);

    expect(stats).not.toBeNull();
    expect(stats!.journeyId).toBe(journey.id);
  });
});

describe('journeyStats route', () => {
  it('builds the route from the entries when they carry coordinates', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    placeEntry(journey.id, user.id, 64.14, -21.94, { title: 'Reykjavík', entry_date: '2026-06-02' });
    placeEntry(journey.id, user.id, 65.68, -18.12, { title: 'Akureyri', entry_date: '2026-06-06' });

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.points.map(p => p.label)).toEqual(['Reykjavík', 'Akureyri']);
    expect(stats.distance).toBeGreaterThan(240_000);
    expect(stats.days).toBe(5);
    expect(stats.steps).toBe(2);
  });

  it('orders the route by entry date, not by insertion', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    placeEntry(journey.id, user.id, 65.68, -18.12, { title: 'second', entry_date: '2026-06-06' });
    placeEntry(journey.id, user.id, 64.14, -21.94, { title: 'first', entry_date: '2026-06-02' });

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.points.map(p => p.label)).toEqual(['first', 'second']);
  });

  it('skips entries without coordinates but still counts them as steps', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    placeEntry(journey.id, user.id, 64.14, -21.94, { entry_date: '2026-06-02' });
    createJourneyEntry(testDb, journey.id, user.id, { title: 'no place', entry_date: '2026-06-03' });

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.points).toHaveLength(1);
    expect(stats.steps).toBe(2);
  });

  /*
   * The fallback that makes the feature work at all for the common case: a
   * journey built by adding trips, before anyone has written a word.
   */
  it('falls back to the trip places when no entry has coordinates', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);

    const day1 = createDay(testDb, trip.id, { date: '2026-06-02' });
    const day2 = createDay(testDb, trip.id, { date: '2026-06-04' });
    const a = createPlace(testDb, trip.id, { name: 'Hallgrímskirkja', lat: 64.14, lng: -21.93 });
    const b = createPlace(testDb, trip.id, { name: 'Goðafoss', lat: 65.68, lng: -17.55 });
    createDayAssignment(testDb, day2.id, b.id);
    createDayAssignment(testDb, day1.id, a.id);

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.points.map(p => p.label)).toEqual(['Hallgrímskirkja', 'Goðafoss']);
    expect(stats.days).toBe(3);
  });

  it('prefers the entries over the trip places rather than mixing them', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);
    createPlace(testDb, trip.id, { name: 'a place', lat: 48.85, lng: 2.35 });
    placeEntry(journey.id, user.id, 64.14, -21.94, { title: 'an entry', entry_date: '2026-06-02' });

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.points.map(p => p.label)).toEqual(['an entry']);
  });

  /*
   * A hotel across three nights is one place with three assignments. Left
   * un-aggregated the join would put it on the route three times and charge the
   * journey two extra legs of zero length — harmless — plus two extra stops in
   * the middle of the route, which is not.
   */
  it('visits a place assigned to several days only once', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);

    const hotel = createPlace(testDb, trip.id, { name: 'Hotel', lat: 64.14, lng: -21.94 });
    for (const date of ['2026-06-02', '2026-06-03', '2026-06-04']) {
      createDayAssignment(testDb, createDay(testDb, trip.id, { date }).id, hotel.id);
    }

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.points.filter(p => p.label === 'Hotel')).toHaveLength(1);
    expect(stats.places).toBe(1);
  });

  it('puts unscheduled places after the scheduled ones', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);

    const loose = createPlace(testDb, trip.id, { name: 'unscheduled', lat: 64.2, lng: -21.8 });
    const planned = createPlace(testDb, trip.id, { name: 'scheduled', lat: 64.14, lng: -21.94 });
    createDayAssignment(testDb, createDay(testDb, trip.id, { date: '2026-06-02' }).id, planned.id);
    expect(loose.id).toBeGreaterThan(0);

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.points.map(p => p.label)).toEqual(['scheduled', 'unscheduled']);
  });

  it('counts places across every trip on the journey', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const one = createTrip(testDb, user.id);
    const two = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, one.id);
    linkTripToJourney(testDb, journey.id, two.id);
    createPlace(testDb, one.id, { lat: 48.85, lng: 2.35 });
    createPlace(testDb, two.id, { lat: 52.52, lng: 13.4 });
    createPlace(testDb, two.id, { lat: 50.11, lng: 8.68 });

    expect(svc.journeyStats(journey.id, user.id)!.places).toBe(3);
  });
});

describe('journeyStats countries', () => {
  it('resolves each stop to a country and names it', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    placeEntry(journey.id, user.id, 64.14, -21.94, { entry_date: '2026-06-02' });
    placeEntry(journey.id, user.id, 52.52, 13.4, { entry_date: '2026-06-20' });

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.countries.map(c => c.code)).toEqual(['IS', 'DE']);
    expect(stats.countries[0].name).toBe('Iceland');
    expect(stats.countries[1].name).toBe('Germany');
  });

  /*
   * Atlas already resolved these and wrote them down. Reading its cache instead
   * of repeating a point-in-polygon test is the difference between a query and
   * a boundary index.
   */
  it('prefers the place_regions cache over recomputing a place country', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    linkTripToJourney(testDb, journey.id, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'somewhere', lat: 64.14, lng: -21.94 });
    testDb
      .prepare('INSERT INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)')
      .run(place.id, 'fr', 'FR-75', 'Paris');

    const stats = svc.journeyStats(journey.id, user.id)!;

    // The cached answer wins even though the coordinates say Iceland, and the
    // expensive lookup is never reached for that place.
    expect(stats.countries.map(c => c.code)).toEqual(['FR']);
    expect(countryCalls).toHaveLength(0);
  });

  it('leaves a stop with no country out of the list rather than inventing one', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    placeEntry(journey.id, user.id, -33.86, 151.2, { entry_date: '2026-06-02' });

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.countries).toEqual([]);
    expect(stats.points).toHaveLength(1);
    expect(stats.points[0].country).toBeNull();
  });
});

describe('journeyStats totals', () => {
  it('counts the gallery photographs', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const photo = testDb
      .prepare("INSERT INTO trek_photos (provider, file_path, owner_id) VALUES ('local', 'x.jpg', ?)")
      .run(user.id);
    testDb
      .prepare('INSERT INTO journey_photos (journey_id, photo_id, sort_order, created_at) VALUES (?, ?, 0, ?)')
      .run(journey.id, photo.lastInsertRowid, Date.now());

    expect(svc.journeyStats(journey.id, user.id)!.photos).toBe(1);
  });

  it('falls back to the trip dates when the entries carry none', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { start_date: '2026-06-01', end_date: '2026-06-10' });
    linkTripToJourney(testDb, journey.id, trip.id);
    createPlace(testDb, trip.id, { lat: 64.14, lng: -21.94 });

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.start).toBe('2026-06-01');
    expect(stats.end).toBe('2026-06-10');
    expect(stats.days).toBe(10);
  });

  it('is all zeroes for an empty journey rather than failing', () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const stats = svc.journeyStats(journey.id, user.id)!;

    expect(stats.distance).toBe(0);
    expect(stats.days).toBe(0);
    expect(stats.steps).toBe(0);
    expect(stats.photos).toBe(0);
    expect(stats.places).toBe(0);
    expect(stats.countries).toEqual([]);
    expect(stats.points).toEqual([]);
  });

  it('answers for a contributor, not only the owner', () => {
    const { user: owner } = createUser(testDb);
    const { user: helper } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    testDb
      .prepare('INSERT INTO journey_contributors (journey_id, user_id, role, added_at) VALUES (?, ?, ?, ?)')
      .run(journey.id, helper.id, 'editor', Date.now());

    expect(svc.journeyStats(journey.id, helper.id)).not.toBeNull();
  });
});
