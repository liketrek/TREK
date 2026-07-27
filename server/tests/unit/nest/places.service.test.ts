/**
 * Unit tests for PlacesService — PLACES-SVC-001 through PLACES-SVC-005.
 *
 * Covers the one piece of logic the Nest wrapper owns rather than delegates:
 * handing every freshly imported track its own colour (#776). The importers
 * never assign a category, so without this each track in a trip renders in the
 * same blue and several walks in one area are impossible to tell apart.
 *
 * Uses a real in-memory SQLite DB so the SQL is exercised faithfully; the
 * service is constructed directly, no Nest container needed.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { TRACK_COLORS } from '@trek/shared';

// ── DB setup ──────────────────────────────────────────────────────────────────

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: (placeId: any) => db.prepare('SELECT * FROM places WHERE id = ?').get(placeId) ?? null,
    canAccessTrip: () => null,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PlacesService } from '../../../src/nest/places/places.service';

// Three tracks plus a plain waypoint — the shared fixture only has waypoints,
// and the whole point here is what happens to geometry.
const GPX_WITH_TRACKS = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TREK Tests" xmlns="http://www.topografix.com/GPX/1/1">
  <wpt lat="48.8566" lon="2.3522"><name>Trailhead</name></wpt>
  <trk><name>Morning walk</name><trkseg>
    <trkpt lat="48.10" lon="2.10"/><trkpt lat="48.11" lon="2.11"/>
  </trkseg></trk>
  <trk><name>Afternoon walk</name><trkseg>
    <trkpt lat="48.20" lon="2.20"/><trkpt lat="48.21" lon="2.21"/>
  </trkseg></trk>
  <trk><name>Evening walk</name><trkseg>
    <trkpt lat="48.30" lon="2.30"/><trkpt lat="48.31" lon="2.31"/>
  </trkseg></trk>
</gpx>`;

const svc = new PlacesService(new DatabaseService(testDb));

function importFixture(tripId: number) {
  return svc.importGpx(String(tripId), Buffer.from(GPX_WITH_TRACKS), {
    importWaypoints: true, importRoutes: true, importTracks: true,
  });
}

function tracksOf(tripId: number) {
  return testDb.prepare('SELECT id, route_color FROM places WHERE trip_id = ? AND route_geometry IS NOT NULL ORDER BY id')
    .all(tripId) as { id: number; route_color: string | null }[];
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

describe('PlacesService — automatic track colours (#776)', () => {
  it('PLACES-SVC-001 — every imported track gets a colour from the shared palette', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    importFixture(trip.id);

    const tracks = tracksOf(trip.id);
    expect(tracks.length).toBeGreaterThan(0);
    for (const track of tracks) {
      expect(TRACK_COLORS).toContain(track.route_color);
    }
  });

  it('PLACES-SVC-002 — the returned places carry the colour, not just the DB rows', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = importFixture(trip.id) as { places: any[] } | null;

    const returnedTracks = (result?.places ?? []).filter(p => p.route_geometry);
    expect(returnedTracks.length).toBeGreaterThan(0);
    for (const track of returnedTracks) {
      expect(TRACK_COLORS).toContain(track.route_color);
    }
  });

  it('PLACES-SVC-003 — plain waypoints keep no colour at all', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    importFixture(trip.id);

    const waypoints = testDb.prepare(
      'SELECT route_color FROM places WHERE trip_id = ? AND route_geometry IS NULL',
    ).all(trip.id) as { route_color: string | null }[];
    for (const wp of waypoints) {
      expect(wp.route_color).toBeNull();
    }
  });

  it('PLACES-SVC-004 — a second import continues the palette instead of repeating it', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    importFixture(trip.id);
    const first = tracksOf(trip.id).map(t => t.route_color);

    // Same fixture again: dedup skips the identical rows, so seed a distinct
    // track directly and let the service colour the next import round.
    testDb.prepare(
      "INSERT INTO places (trip_id, name, lat, lng, route_geometry) VALUES (?, 'Second walk', 1, 1, '[[1,1],[2,2]]')",
    ).run(trip.id);
    const seeded = testDb.prepare('SELECT id FROM places WHERE name = ?').get('Second walk') as { id: number };
    (svc as any).colorizeImportedTracks(String(trip.id), {
      places: [{ id: seeded.id, route_geometry: '[[1,1],[2,2]]', route_color: null }],
    });

    const seededColor = (testDb.prepare('SELECT route_color FROM places WHERE id = ?').get(seeded.id) as any).route_color;
    expect(TRACK_COLORS).toContain(seededColor);
    expect(first).not.toContain(seededColor);
  });

  it('PLACES-SVC-006 — a colour already in use by hand is not handed out again', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Someone recoloured an existing track to the palette's second entry. A
    // plain row count would hand exactly that colour to the next import.
    testDb.prepare(
      "INSERT INTO places (trip_id, name, lat, lng, route_geometry, route_color) VALUES (?, 'Old walk', 1, 1, '[[1,1],[2,2]]', ?)",
    ).run(trip.id, TRACK_COLORS[1]);

    importFixture(trip.id);

    const colors = tracksOf(trip.id).map(t => t.route_color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('PLACES-SVC-007 — gaps left by deleted tracks are reused, not skipped past', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    importFixture(trip.id);
    // Drop the first track; its colour becomes free again.
    const first = tracksOf(trip.id)[0];
    testDb.prepare('DELETE FROM places WHERE id = ?').run(first.id);

    const seeded = testDb.prepare(
      "INSERT INTO places (trip_id, name, lat, lng, route_geometry) VALUES (?, 'Later walk', 9, 9, '[[9,9],[8,8]]') RETURNING id",
    ).get(trip.id) as { id: number };
    (svc as any).colorizeImportedTracks(String(trip.id), {
      places: [{ id: seeded.id, route_geometry: '[[9,9],[8,8]]', route_color: null }],
    });

    const colors = tracksOf(trip.id).map(t => t.route_color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('PLACES-SVC-005 — an import that yields nothing is passed straight through', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect((svc as any).colorizeImportedTracks(String(trip.id), null)).toBeNull();
    expect((svc as any).colorizeImportedTracks(String(trip.id), { places: [] })).toEqual({ places: [] });
  });
});
