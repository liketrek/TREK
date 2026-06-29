/**
 * Unit tests for placeService — PLACE-SVC-001 through PLACE-SVC-025.
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully.
 * External fetches are mocked where needed.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

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
    getPlaceWithTags: (placeId: any) => {
      const place: any = db.prepare(`
        SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?
      `).get(placeId);
      if (!place) return null;
      const tags = db.prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`).all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon } : null, tags };
    },
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

// Spy on the photo-cache reclaim hook so delete tests assert the wiring without
// touching disk. The removal logic itself is covered in placePhotoCache.test.ts.
const { removeIfUnreferencedSpy } = vi.hoisted(() => ({ removeIfUnreferencedSpy: vi.fn() }));
vi.mock('../../../src/services/placePhotoCache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/placePhotoCache')>()),
  removeIfUnreferenced: removeIfUnreferencedSpy,
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createPlace, createCategory, createTag } from '../../helpers/factories';
import path from 'path';
import fs from 'fs';
import { listPlaces, createPlace as svcCreatePlace, getPlace, updatePlace, updatePlacesMany, deletePlace, importGpx, importKmlPlaces, importGoogleList, searchPlaceImage } from '../../../src/services/placeService';

const GPX_FIXTURE = path.join(__dirname, '../../fixtures/test.gpx');
const KML_FIXTURE = path.join(__dirname, '../../fixtures/test.kml');

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

// ── listPlaces ────────────────────────────────────────────────────────────────

describe('listPlaces', () => {
  it('PLACE-SVC-001 — returns empty array when trip has no places', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(listPlaces(String(trip.id), {})).toEqual([]);
  });

  it('PLACE-SVC-002 — returns all places for a trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Alpha' });
    createPlace(testDb, trip.id, { name: 'Beta' });
    const places = listPlaces(String(trip.id), {}) as any[];
    expect(places).toHaveLength(2);
  });

  it('PLACE-SVC-003 — does not return places from other trips', () => {
    const { user } = createUser(testDb);
    const t1 = createTrip(testDb, user.id);
    const t2 = createTrip(testDb, user.id);
    createPlace(testDb, t1.id, { name: 'T1 Place' });
    createPlace(testDb, t2.id, { name: 'T2 Place' });
    const places = listPlaces(String(t1.id), {}) as any[];
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('T1 Place');
  });

  it('PLACE-SVC-004 — filters by search term (name)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    createPlace(testDb, trip.id, { name: 'Louvre Museum' });
    const places = listPlaces(String(trip.id), { search: 'Eiffel' }) as any[];
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Eiffel Tower');
  });

  it('PLACE-SVC-005 — attaches tags array to each place (empty when none)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'No Tags' });
    const places = listPlaces(String(trip.id), {}) as any[];
    expect(Array.isArray(places[0].tags)).toBe(true);
    expect(places[0].tags).toHaveLength(0);
  });

  it('PLACE-SVC-006 — attaches category object when place has a category', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cat = createCategory(testDb, { name: 'Museum', user_id: user.id }) as any;
    const place = createPlace(testDb, trip.id, { name: 'Art Museum' }) as any;
    testDb.prepare('UPDATE places SET category_id = ? WHERE id = ?').run(cat.id, place.id);

    const places = listPlaces(String(trip.id), {}) as any[];
    expect(places[0].category).toBeDefined();
    expect(places[0].category.name).toBe('Museum');
  });
});

// ── createPlace (via service) ─────────────────────────────────────────────────

describe('createPlace (service)', () => {
  it('PLACE-SVC-007 — creates a place and returns it with tags array', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = svcCreatePlace(String(trip.id), { name: 'New Place', lat: 48.8, lng: 2.3 }) as any;
    expect(place).toBeDefined();
    expect(place.name).toBe('New Place');
    expect(Array.isArray(place.tags)).toBe(true);
  });

  it('PLACE-SVC-008 — creates a place with tags', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tag = createTag(testDb, user.id, { name: 'Highlight' }) as any;
    const place = svcCreatePlace(String(trip.id), { name: 'Tagged Place', tags: [tag.id] }) as any;
    expect(place.tags).toHaveLength(1);
    expect(place.tags[0].id).toBe(tag.id);
  });

  it('PLACE-SVC-009 — place is associated with correct trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = svcCreatePlace(String(trip.id), { name: 'My Place' }) as any;
    const row = testDb.prepare('SELECT trip_id FROM places WHERE id = ?').get(place.id) as any;
    expect(row.trip_id).toBe(trip.id);
  });
});

// ── getPlace ──────────────────────────────────────────────────────────────────

describe('getPlace', () => {
  it('PLACE-SVC-010 — returns the place when tripId and placeId match', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Find Me' }) as any;
    const found = getPlace(String(trip.id), String(place.id)) as any;
    expect(found).toBeDefined();
    expect(found.name).toBe('Find Me');
  });

  it('PLACE-SVC-011 — returns null when place belongs to different trip', () => {
    const { user } = createUser(testDb);
    const t1 = createTrip(testDb, user.id);
    const t2 = createTrip(testDb, user.id);
    const place = createPlace(testDb, t1.id, { name: 'T1 Place' }) as any;
    expect(getPlace(String(t2.id), String(place.id))).toBeNull();
  });

  it('PLACE-SVC-012 — returns null for non-existent placeId', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(getPlace(String(trip.id), '99999')).toBeNull();
  });
});

// ── updatePlace ───────────────────────────────────────────────────────────────

describe('updatePlace', () => {
  it('PLACE-SVC-013 — updates place name and lat/lng', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Old', lat: 0, lng: 0 }) as any;
    const updated = updatePlace(String(trip.id), String(place.id), { name: 'New', lat: 48.8, lng: 2.3 }) as any;
    expect(updated.name).toBe('New');
    expect(updated.lat).toBe(48.8);
    expect(updated.lng).toBe(2.3);
  });

  it('PLACE-SVC-014 — returns null for non-existent place', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(updatePlace(String(trip.id), '99999', { name: 'Ghost' })).toBeNull();
  });

  it('PLACE-SVC-015 — updates tags (replaces old set)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tag1 = createTag(testDb, user.id, { name: 'Old Tag' }) as any;
    const tag2 = createTag(testDb, user.id, { name: 'New Tag' }) as any;
    const place = svcCreatePlace(String(trip.id), { name: 'Taggable', tags: [tag1.id] }) as any;

    const updated = updatePlace(String(trip.id), String(place.id), { tags: [tag2.id] }) as any;
    expect(updated.tags).toHaveLength(1);
    expect(updated.tags[0].id).toBe(tag2.id);
  });

  it('PLACE-SVC-016 — clears tags when tags: [] is passed', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tag = createTag(testDb, user.id, { name: 'Temp' }) as any;
    const place = svcCreatePlace(String(trip.id), { name: 'Untaggable', tags: [tag.id] }) as any;

    const updated = updatePlace(String(trip.id), String(place.id), { tags: [] }) as any;
    expect(updated.tags).toHaveLength(0);
  });
});

// ── updatePlacesMany ────────────────────────────────────────────────────────────

describe('updatePlacesMany', () => {
  it('PLACE-SVC-039 — applies the same fields to many places, preserving the rest', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = createPlace(testDb, trip.id, { name: 'A' }) as any;
    const b = createPlace(testDb, trip.id, { name: 'B' }) as any;
    const c = createPlace(testDb, trip.id, { name: 'C' }) as any;

    const updated = updatePlacesMany(String(trip.id), [a.id, b.id, c.id], { notes: 'visited', transport_mode: 'walking' });

    expect(updated).toHaveLength(3);
    for (const p of updated) {
      expect((p as any).notes).toBe('visited');
      expect((p as any).transport_mode).toBe('walking');
    }
    // Only the provided fields change — names are untouched.
    expect(updated.map(p => (p as any).name).sort()).toEqual(['A', 'B', 'C']);
  });

  it('PLACE-SVC-040 — skips ids that are not in the trip and reports the rest', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const mine = createPlace(testDb, trip.id, { name: 'Mine' }) as any;
    const foreign = createPlace(testDb, other.id, { name: 'Foreign' }) as any;

    const updated = updatePlacesMany(String(trip.id), [mine.id, foreign.id, 99999], { notes: 'tagged' });

    expect(updated).toHaveLength(1);
    expect((updated[0] as any).id).toBe(mine.id);
    // The place from the other trip stays untouched.
    expect((getPlace(String(other.id), String(foreign.id)) as any).notes).toBeNull();
  });

  it('PLACE-SVC-041 — returns [] for an empty id list', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(updatePlacesMany(String(trip.id), [], { notes: 'x' })).toEqual([]);
  });
});

// ── deletePlace ───────────────────────────────────────────────────────────────

describe('deletePlace', () => {
  it('PLACE-SVC-017 — deletes a place and returns true', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'To Delete' }) as any;
    expect(deletePlace(String(trip.id), String(place.id))).toBe(true);
    expect(getPlace(String(trip.id), String(place.id))).toBeNull();
  });

  it('PLACE-SVC-018 — returns false for non-existent place', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(deletePlace(String(trip.id), '99999')).toBe(false);
  });

  it('PLACE-SVC-019 — deleting one place does not remove others', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const p1 = createPlace(testDb, trip.id, { name: 'Keep' }) as any;
    const p2 = createPlace(testDb, trip.id, { name: 'Remove' }) as any;
    deletePlace(String(trip.id), String(p2.id));
    const remaining = listPlaces(String(trip.id), {}) as any[];
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(p1.id);
  });

  it('PLACE-SVC-019b — reclaims the photo cache for the deleted place', () => {
    removeIfUnreferencedSpy.mockClear();
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'With Photo' }) as any;
    testDb.prepare('UPDATE places SET google_place_id = ? WHERE id = ?').run('ChIJgid', place.id);

    deletePlace(String(trip.id), String(place.id));

    expect(removeIfUnreferencedSpy).toHaveBeenCalledWith('ChIJgid');
  });
});

// ── importGpx ─────────────────────────────────────────────────────────────────

describe('importGpx', () => {
  it('PLACE-SVC-020 — returns null when buffer has no <gpx> root', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = importGpx(String(trip.id), Buffer.from('<not-gpx/>'));
    expect(result).toBeNull();
  });

  it('PLACE-SVC-021 — imports <wpt> waypoints as places', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <wpt lat="48.8566" lon="2.3522"><name>Paris</name></wpt>
      <wpt lat="51.5074" lon="-0.1278"><name>London</name></wpt>
    </gpx>`);
    const result = importGpx(String(trip.id), gpx) as any;
    expect(result.places).toHaveLength(2);
    expect(result.places[0].name).toBe('Paris');
    expect(result.places[1].name).toBe('London');
  });

  it('PLACE-SVC-022 — imports <rte> as a single polyline-place with routeGeometry', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <rte>
        <name>My Route</name>
        <rtept lat="48.8566" lon="2.3522"><name>Start</name></rtept>
        <rtept lat="51.5074" lon="-0.1278"><name>End</name></rtept>
      </rte>
    </gpx>`);
    const result = importGpx(String(trip.id), gpx) as any;
    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe('My Route');
    expect(result.places[0].lat).toBe(48.8566);
    expect(result.places[0].lng).toBe(2.3522);
    expect(result.places[0].route_geometry).toBeTruthy();
    const coords = JSON.parse(result.places[0].route_geometry);
    expect(coords).toHaveLength(2);
  });

  it('PLACE-SVC-023 — imports <trk> track as a single place with routeGeometry', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <trk>
        <name>My Track</name>
        <trkseg>
          <trkpt lat="48.8566" lon="2.3522"><ele>100</ele></trkpt>
          <trkpt lat="48.8570" lon="2.3530"><ele>102</ele></trkpt>
        </trkseg>
      </trk>
    </gpx>`);
    const result = importGpx(String(trip.id), gpx) as any;
    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe('My Track');
    const geometry = JSON.parse(result.places[0].route_geometry);
    expect(Array.isArray(geometry)).toBe(true);
    expect(geometry).toHaveLength(2);
  });

  it('PLACE-SVC-024 — <wpt> and <trk> together: waypoints plus track appended', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <wpt lat="48.8566" lon="2.3522"><name>POI</name></wpt>
      <trk>
        <name>Track</name>
        <trkseg>
          <trkpt lat="48.8566" lon="2.3522"></trkpt>
          <trkpt lat="48.8570" lon="2.3530"></trkpt>
        </trkseg>
      </trk>
    </gpx>`);
    const result = importGpx(String(trip.id), gpx) as any;
    // 1 wpt + 1 trk
    expect(result.places).toHaveLength(2);
    const trackPlace = result.places.find((p: any) => p.name === 'Track') as any;
    expect(trackPlace).toBeDefined();
    const geometry = JSON.parse(trackPlace.route_geometry);
    expect(geometry).toHaveLength(2);
  });

  it('PLACE-SVC-025 — returns null when GPX has no usable elements', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1"></gpx>`);
    const result = importGpx(String(trip.id), gpx);
    expect(result).toBeNull();
  });

  it('PLACE-SVC-037 — multiple unnamed tracks in one file get distinct names instead of collapsing to one', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <trk><trkseg>
        <trkpt lat="48.8566" lon="2.3522"></trkpt>
        <trkpt lat="48.8570" lon="2.3530"></trkpt>
      </trkseg></trk>
      <trk><trkseg>
        <trkpt lat="40.0000" lon="-3.0000"></trkpt>
        <trkpt lat="40.1000" lon="-3.1000"></trkpt>
      </trkseg></trk>
    </gpx>`);
    const result = importGpx(String(trip.id), gpx) as any;
    expect(result.places).toHaveLength(2);
    const names = result.places.map((p: any) => p.name);
    expect(new Set(names).size).toBe(2);
  });

  it('PLACE-SVC-038 — unnamed tracks fall back to the source filename', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <trk><trkseg>
        <trkpt lat="48.8566" lon="2.3522"></trkpt>
        <trkpt lat="48.8570" lon="2.3530"></trkpt>
      </trkseg></trk>
    </gpx>`);
    const result = importGpx(String(trip.id), gpx, { defaultName: 'morning-hike.gpx' }) as any;
    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe('morning-hike');
  });
});

// ── importGoogleList ──────────────────────────────────────────────────────────

describe('importGoogleList', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PLACE-SVC-026 — returns error when list ID cannot be extracted from URL', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = await importGoogleList(String(trip.id), 'https://example.com/no-id-here') as any;
    expect(result.error).toMatch(/Could not extract list ID/);
    expect(result.status).toBe(400);
  });

  it('PLACE-SVC-026b — a single-place link gives a guiding error instead of the generic one (#1304)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const url = 'https://www.google.com/maps/place/Eiffel+Tower/@48.8584,2.2945,17z/data=!3m1';
    const result = await importGoogleList(String(trip.id), url) as any;
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/single place/i);
  });

  it('PLACE-SVC-027 — returns error when Google Maps API responds with non-ok status', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, text: async () => '', status: 502 }));
    const url = 'https://www.google.com/maps/placelists/list/ABC123DEF456';
    const result = await importGoogleList(String(trip.id), url) as any;
    expect(result.error).toMatch(/Failed to fetch list/);
    expect(result.status).toBe(502);
  });

  it('PLACE-SVC-028 — imports places from a valid Google Maps list response', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const listPayload = [
      [null, null, null, null, 'My Test List', null, null, null, [
        [null, [null, null, null, null, null, [null, null, 48.8566, 2.3522]], 'Paris', null],
        [null, [null, null, null, null, null, [null, null, 51.5074, -0.1278]], 'London', 'Great city'],
      ]],
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'prefix\n' + JSON.stringify(listPayload),
    }));

    const url = 'https://www.google.com/maps/placelists/list/ABC123DEF456';
    const result = await importGoogleList(String(trip.id), url) as any;
    expect(result.listName).toBe('My Test List');
    expect(result.places).toHaveLength(2);
    expect(result.places[0].name).toBe('Paris');
    expect(result.places[1].name).toBe('London');
  });

  it('PLACE-SVC-028b — stores a Google Maps ftid separately from google_place_id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const listPayload = [
      [null, null, null, null, 'My Test List', null, null, null, [
        [null, [null, null, null, null, '878 Weber St N', [null, null, 43.5118527, -80.5542617], ['-8634542354666695567', '-8822026229683971437']], "St. Jacobs Farmers' Market"],
      ]],
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'prefix\n' + JSON.stringify(listPayload),
    }));

    const url = 'https://www.google.com/maps/placelists/list/ABC123DEF456';
    const result = await importGoogleList(String(trip.id), url) as any;

    expect(result.places).toHaveLength(1);
    expect(result.places[0].google_place_id).toBeNull();
    expect(result.places[0].google_ftid).toBe('0x882bf179e806d471:0x8591dde29c821a93');
  });

  it('PLACE-SVC-028c — backfills google_ftid when re-import skips a duplicate', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const existing = createPlace(testDb, trip.id, {
      name: "St. Jacobs Farmers' Market",
      lat: 43.5118527,
      lng: -80.5542617,
    }) as any;

    const listPayload = [
      [null, null, null, null, 'My Test List', null, null, null, [
        [null, [null, null, null, null, '878 Weber St N', [null, null, 43.5118527, -80.5542617], ['-8634542354666695567', '-8822026229683971437']], "St. Jacobs Farmers' Market"],
      ]],
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'prefix\n' + JSON.stringify(listPayload),
    }));

    const url = 'https://www.google.com/maps/placelists/list/ABC123DEF456';
    const result = await importGoogleList(String(trip.id), url) as any;
    const row = testDb.prepare('SELECT google_place_id, google_ftid FROM places WHERE id = ?').get(existing.id) as any;

    expect(result.places).toHaveLength(0);
    expect(result.skipped).toBe(1);
    expect(row.google_place_id).toBeNull();
    expect(row.google_ftid).toBe('0x882bf179e806d471:0x8591dde29c821a93');
  });

  it('PLACE-SVC-029 — returns error when list items array is empty', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const listPayload = [[null, null, null, null, 'Empty List', null, null, null, []]];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'prefix\n' + JSON.stringify(listPayload),
    }));

    const url = 'https://www.google.com/maps/placelists/list/ABC123DEF456';
    const result = await importGoogleList(String(trip.id), url) as any;
    expect(result.error).toBeDefined();
    expect(result.status).toBe(400);
  });
});

// ── searchPlaceImage ──────────────────────────────────────────────────────────

describe('searchPlaceImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PLACE-SVC-030 — returns 404 when place does not exist', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = await searchPlaceImage(String(trip.id), '99999', user.id) as any;
    expect(result.error).toBeDefined();
    expect(result.status).toBe(404);
  });

  it('PLACE-SVC-031 — searches Unsplash without a stored API key', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Eiffel Tower' }) as any;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { id: 'photo1', urls: { regular: 'https://img.example.com/1', thumb: 'https://img.example.com/t1' }, description: 'Tower', user: { name: 'Photographer' }, links: { html: 'https://unsplash.com/1' } },
        ],
      }),
      status: 200,
    }));

    const result = await searchPlaceImage(String(trip.id), String(place.id), user.id) as any;
    expect(result.photos).toHaveLength(1);
    const [url] = (fetch as any).mock.calls[0];
    expect(url).toContain('https://unsplash.com/napi/search/photos?');
    expect(url).not.toContain('client_id=');
  });

  it('PLACE-SVC-032 — returns photos when Unsplash API responds successfully', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Eiffel Tower' }) as any;

    const mockPhotos = [
      { id: 'photo1', urls: { regular: 'https://img.example.com/1', thumb: 'https://img.example.com/t1' }, description: 'Tower', user: { name: 'Photographer' }, links: { html: 'https://unsplash.com/1' } },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ results: mockPhotos }),
      status: 200,
    }));

    const result = await searchPlaceImage(String(trip.id), String(place.id), user.id) as any;
    expect(result.photos).toHaveLength(1);
    expect(result.photos[0].id).toBe('photo1');
    expect(result.photos[0].url).toBe('https://img.example.com/1');
    expect(result.photos[0].photographer).toBe('Photographer');
  });
});

// ── Import deduplication ──────────────────────────────────────────────────────

describe('importGpx deduplication', () => {
  it('PLACE-SVC-033 — skips waypoints already in trip by name', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const buf = fs.readFileSync(GPX_FIXTURE);

    // First import
    const first = importGpx(String(trip.id), buf) as any;
    expect(first.count).toBeGreaterThan(0);

    // Second import — all names already present, nothing new created
    const second = importGpx(String(trip.id), buf) as any;
    expect(second.count).toBe(0);
    expect(second.skipped).toBe(first.count);

    // Total places in DB should equal first import count
    const total = (listPlaces(String(trip.id), {}) as any[]).length;
    expect(total).toBe(first.count);
  });

  it('PLACE-SVC-034 — imports new places while skipping existing ones', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const buf = fs.readFileSync(GPX_FIXTURE);

    const first = importGpx(String(trip.id), buf) as any;
    // Manually add a brand-new place so total > first.count
    createPlace(testDb, trip.id, { name: 'Unique Extra Place', lat: 99, lng: 99 });

    // Re-import: the fixture places are skipped, the extra place remains untouched
    const second = importGpx(String(trip.id), buf) as any;
    expect(second.count).toBe(0);

    const total = (listPlaces(String(trip.id), {}) as any[]).length;
    expect(total).toBe(first.count + 1);
  });
});

describe('importKmlPlaces deduplication', () => {
  it('PLACE-SVC-035 — skips placemarks already in trip by name', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const buf = fs.readFileSync(KML_FIXTURE);

    const first = importKmlPlaces(String(trip.id), buf);
    expect(first.count).toBeGreaterThan(0);

    const second = importKmlPlaces(String(trip.id), buf);
    expect(second.count).toBe(0);
    expect(second.summary.skippedCount).toBeGreaterThanOrEqual(first.count);
    expect(second.summary.warnings.some((w: string) => w.includes('skipped'))).toBe(true);
  });

  it('PLACE-SVC-036 — deduplicates within the same file (intra-batch)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Craft a KML with two placemarks sharing the same name
    const kml = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Placemark><name>Dupe Place</name><Point><coordinates>2.0,48.0,0</coordinates></Point></Placemark>
  <Placemark><name>Dupe Place</name><Point><coordinates>2.1,48.1,0</coordinates></Point></Placemark>
</Document></kml>`);

    const result = importKmlPlaces(String(trip.id), kml);
    expect(result.count).toBe(1);
    expect(result.summary.skippedCount).toBe(1);
  });
});
