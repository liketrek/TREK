/**
 * Unit tests for PlacesService — the place SQL, the GPX/KML importers, the
 * Google-list importer, the Unsplash image search and the collaborative
 * ratings (PLACE-SVC-*, moved verbatim from tests/unit/services/placeService.test.ts
 * when the domain went DI-native) plus the automatic track colours the Nest
 * service already owned (PLACES-SVC-*, #776).
 *
 * Uses a real in-memory SQLite DB so the SQL is exercised faithfully; the
 * service is constructed directly, no Nest container needed. External fetches
 * are mocked where needed.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import type { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { UnsplashService } from '../../../src/nest/unsplash/unsplash.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { TRACK_COLORS, COORD_DEDUP_TOLERANCE } from '@trek/shared';
import { ADDRESS_BACKFILL_MAX_PLACES } from '../../../src/nest/places/places.helpers';

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
// Injected stub since the photo-cache fold (was a partial path mock).
// Only `removeIfUnreferenced` is stubbed: it is the single cache method anything
// in this file reaches. MapsService takes the same instance (as it does in
// production) but never gets far enough to call it, since every maps path here
// stops at the missing API key.
const removeIfUnreferencedSpy = vi.fn();
const photoCacheStub = { removeIfUnreferenced: removeIfUnreferencedSpy } as unknown as PlacePhotoCacheService;

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createPlace, createCategory, createTag, addTripMember } from '../../helpers/factories';
import path from 'path';
import fs from 'fs';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';
import { makeStorageFixture } from '../../helpers/storage-fixture';

const GPX_FIXTURE = path.join(__dirname, '../../fixtures/test.gpx');
const KML_FIXTURE = path.join(__dirname, '../../fixtures/test.kml');

const dbs = new DatabaseService(testDb);

/**
 * Same collaborator set the container hands PlacesService,
 * built once here so the two construction sites cannot drift apart again. The
 * journey domain is a real instance on the same in-memory DB rather than a stub:
 * its place hooks are fire-and-forget behind a catch, so a missing one would have
 * looked like a pass while silently swallowing a TypeError. No test in this file
 * creates a journey, so every hook returns on its first lookup.
 * `maps` is a parameter because the enrichment cases hand in their own provider.
 */
const placesStorageFx = makeStorageFixture('');

function makePlacesService(maps: MapsService = new MapsService(dbs, photoCacheStub)): PlacesService {
  return new PlacesService(
    dbs,
    new PermissionsService(dbs),
    new RealtimeService(),
    maps,
    new QueryHelpersService(dbs),
    new UnsplashService(dbs, new RuntimeEnvService(), placesStorageFx.storage),
    photoCacheStub,
    new JourneyDomainService(dbs, new RealtimeService(), new TrekPhotosRepository(dbs)),
    placesStorageFx.storage,
  );
}

const svc = makePlacesService();

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

// ── list ──────────────────────────────────────────────────────────────────────

describe('list', () => {
  it('PLACE-SVC-001 — returns empty array when trip has no places', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(svc.list(String(trip.id), {})).toEqual([]);
  });

  it('PLACE-SVC-002 — returns all places for a trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Alpha' });
    createPlace(testDb, trip.id, { name: 'Beta' });
    const places = svc.list(String(trip.id), {}) as any[];
    expect(places).toHaveLength(2);
  });

  it('PLACE-SVC-003 — does not return places from other trips', () => {
    const { user } = createUser(testDb);
    const t1 = createTrip(testDb, user.id);
    const t2 = createTrip(testDb, user.id);
    createPlace(testDb, t1.id, { name: 'T1 Place' });
    createPlace(testDb, t2.id, { name: 'T2 Place' });
    const places = svc.list(String(t1.id), {}) as any[];
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('T1 Place');
  });

  it('PLACE-SVC-004 — filters by search term (name)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    createPlace(testDb, trip.id, { name: 'Louvre Museum' });
    const places = svc.list(String(trip.id), { search: 'Eiffel' }) as any[];
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Eiffel Tower');
  });

  it('PLACE-SVC-005 — attaches tags array to each place (empty when none)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'No Tags' });
    const places = svc.list(String(trip.id), {}) as any[];
    expect(Array.isArray(places[0].tags)).toBe(true);
    expect(places[0].tags).toHaveLength(0);
  });

  it('PLACE-SVC-006 — attaches category object when place has a category', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cat = createCategory(testDb, { name: 'Museum', user_id: user.id }) as any;
    const place = createPlace(testDb, trip.id, { name: 'Art Museum' }) as any;
    testDb.prepare('UPDATE places SET category_id = ? WHERE id = ?').run(cat.id, place.id);

    const places = svc.list(String(trip.id), {}) as any[];
    expect(places[0].category).toBeDefined();
    expect(places[0].category!.name).toBe('Museum');
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('create', () => {
  it('PLACE-SVC-007 — creates a place and returns it with tags array', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = svc.create(String(trip.id), { name: 'New Place', lat: 48.8, lng: 2.3 }) as any;
    expect(place).toBeDefined();
    expect(place.name).toBe('New Place');
    expect(Array.isArray(place.tags)).toBe(true);
  });

  it('PLACE-SVC-008 — creates a place with tags', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tag = createTag(testDb, user.id, { name: 'Highlight' }) as any;
    const place = svc.create(String(trip.id), { name: 'Tagged Place', tags: [tag.id] }) as any;
    expect(place.tags).toHaveLength(1);
    expect(place.tags[0].id).toBe(tag.id);
  });

  // A tag belongs to a user, not a trip, and the place body is an open record, so
  // an id from someone outside the trip could be attached and then read straight
  // back — the tag projection carries the owner's user_id with it.
  it('PLACE-SVC-008a — drops a tag owned by someone outside the trip', () => {
    const { user } = createUser(testDb);
    const { user: outsider } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const mine = createTag(testDb, user.id, { name: 'Mine' }) as any;
    const theirs = createTag(testDb, outsider.id, { name: 'Theirs' }) as any;

    const place = svc.create(String(trip.id), { name: 'Tagged Place', tags: [mine.id, theirs.id] }) as any;

    expect(place.tags.map((t: any) => t.id)).toEqual([mine.id]);
  });

  it('PLACE-SVC-008b — keeps a co-traveller tag, so a shared place survives a foreign re-save', () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const theirTag = createTag(testDb, member.id, { name: 'Theirs' }) as any;

    const place = svc.create(String(trip.id), { name: 'Shared Place', tags: [theirTag.id] }) as any;

    expect(place.tags.map((t: any) => t.id)).toEqual([theirTag.id]);
  });

  it('PLACE-SVC-009 — place is associated with correct trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = svc.create(String(trip.id), { name: 'My Place' }) as any;
    const row = testDb.prepare('SELECT trip_id FROM places WHERE id = ?').get(place.id) as any;
    expect(row.trip_id).toBe(trip.id);
  });
});

// ── get ───────────────────────────────────────────────────────────────────────

describe('get', () => {
  it('PLACE-SVC-010 — returns the place when tripId and placeId match', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Find Me' }) as any;
    const found = svc.get(String(trip.id), String(place.id)) as any;
    expect(found).toBeDefined();
    expect(found.name).toBe('Find Me');
  });

  it('PLACE-SVC-011 — returns null when place belongs to different trip', () => {
    const { user } = createUser(testDb);
    const t1 = createTrip(testDb, user.id);
    const t2 = createTrip(testDb, user.id);
    const place = createPlace(testDb, t1.id, { name: 'T1 Place' }) as any;
    expect(svc.get(String(t2.id), String(place.id))).toBeNull();
  });

  it('PLACE-SVC-012 — returns null for non-existent placeId', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(svc.get(String(trip.id), '99999')).toBeNull();
  });
});

// ── update ────────────────────────────────────────────────────────────────────

describe('update', () => {
  it('PLACE-SVC-013 — updates place name and lat/lng', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Old', lat: 0, lng: 0 }) as any;
    const updated = await svc.update(String(trip.id), String(place.id), { name: 'New', lat: 48.8, lng: 2.3 }) as any;
    expect(updated.name).toBe('New');
    expect(updated.lat).toBe(48.8);
    expect(updated.lng).toBe(2.3);
  });

  it('PLACE-SVC-014 — returns null for non-existent place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.update(String(trip.id), '99999', { name: 'Ghost' })).toBeNull();
  });

  it('PLACE-SVC-015 — updates tags (replaces old set)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tag1 = createTag(testDb, user.id, { name: 'Old Tag' }) as any;
    const tag2 = createTag(testDb, user.id, { name: 'New Tag' }) as any;
    const place = svc.create(String(trip.id), { name: 'Taggable', tags: [tag1.id] }) as any;

    const updated = await svc.update(String(trip.id), String(place.id), { tags: [tag2.id] }) as any;
    expect(updated.tags).toHaveLength(1);
    expect(updated.tags[0].id).toBe(tag2.id);
  });

  it('PLACE-SVC-016 — clears tags when tags: [] is passed', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tag = createTag(testDb, user.id, { name: 'Temp' }) as any;
    const place = svc.create(String(trip.id), { name: 'Untaggable', tags: [tag.id] }) as any;

    const updated = await svc.update(String(trip.id), String(place.id), { tags: [] }) as any;
    expect(updated.tags).toHaveLength(0);
  });

  // ── Track colour (#776) ─────────────────────────────────────────────────────

  it('PLACE-SVC-052 — stores a picked route_color', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Walk' }) as any;
    const updated = await svc.update(String(trip.id), String(place.id), { route_color: '#e11d48' }) as any;
    expect(updated.route_color).toBe('#e11d48');
  });

  it('PLACE-SVC-053 — an explicit null clears it again (the reset to auto)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Walk' }) as any;
    await svc.update(String(trip.id), String(place.id), { route_color: '#e11d48' });
    // Guards the COALESCE trap: name/currency/transport_mode can never be
    // emptied, and route_color built that way would be a one-way door.
    const cleared = await svc.update(String(trip.id), String(place.id), { route_color: null }) as any;
    expect(cleared.route_color).toBeNull();
  });

  it('PLACE-SVC-054 — an unrelated update leaves the colour alone', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Walk' }) as any;
    await svc.update(String(trip.id), String(place.id), { route_color: '#059669' });
    const renamed = await svc.update(String(trip.id), String(place.id), { name: 'Hike' }) as any;
    expect(renamed.name).toBe('Hike');
    expect(renamed.route_color).toBe('#059669');
  });

  it('PLACE-SVC-055 — create carries geometry and colour instead of dropping them', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const created = svc.create(String(trip.id), {
      name: 'Restored track',
      route_geometry: '[[48.0,2.0],[49.0,3.0]]',
      route_color: '#7c3aed',
    }) as any;
    expect(created.route_geometry).toBe('[[48.0,2.0],[49.0,3.0]]');
    expect(created.route_color).toBe('#7c3aed');
  });
});

// ── updateMany ────────────────────────────────────────────────────────────────

describe('updateMany', () => {
  it('PLACE-SVC-039 — applies the same fields to many places, preserving the rest', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = createPlace(testDb, trip.id, { name: 'A' }) as any;
    const b = createPlace(testDb, trip.id, { name: 'B' }) as any;
    const c = createPlace(testDb, trip.id, { name: 'C' }) as any;

    const updated = await svc.updateMany(String(trip.id), [a.id, b.id, c.id], { notes: 'visited', transport_mode: 'walking' });

    expect(updated).toHaveLength(3);
    for (const p of updated) {
      expect((p as any).notes).toBe('visited');
      expect((p as any).transport_mode).toBe('walking');
    }
    // Only the provided fields change — names are untouched.
    expect(updated.map(p => (p as any).name).sort()).toEqual(['A', 'B', 'C']);
  });

  it('PLACE-SVC-040 — skips ids that are not in the trip and reports the rest', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const mine = createPlace(testDb, trip.id, { name: 'Mine' }) as any;
    const foreign = createPlace(testDb, other.id, { name: 'Foreign' }) as any;

    const updated = await svc.updateMany(String(trip.id), [mine.id, foreign.id, 99999], { notes: 'tagged' });

    expect(updated).toHaveLength(1);
    expect((updated[0] as any).id).toBe(mine.id);
    // The place from the other trip stays untouched.
    expect((svc.get(String(other.id), String(foreign.id)) as any).notes).toBeNull();
  });

  it('PLACE-SVC-041 — returns [] for an empty id list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.updateMany(String(trip.id), [], { notes: 'x' })).toEqual([]);
  });
});

// ── remove ────────────────────────────────────────────────────────────────────

describe('remove', () => {
  it('PLACE-SVC-017 — deletes a place and returns true', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'To Delete' }) as any;
    expect(await svc.remove(String(trip.id), String(place.id))).toBe(true);
    expect(svc.get(String(trip.id), String(place.id))).toBeNull();
  });

  it('PLACE-SVC-018 — returns false for non-existent place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.remove(String(trip.id), '99999')).toBe(false);
  });

  it('PLACE-SVC-019 — deleting one place does not remove others', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const p1 = createPlace(testDb, trip.id, { name: 'Keep' }) as any;
    const p2 = createPlace(testDb, trip.id, { name: 'Remove' }) as any;
    await svc.remove(String(trip.id), String(p2.id));
    const remaining = svc.list(String(trip.id), {}) as any[];
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(p1.id);
  });

  it('PLACE-SVC-019c — the linked expense goes with the place (#1298)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' }) as any;
    const other = createPlace(testDb, trip.id, { name: 'Orsay', lat: 48.86, lng: 2.3266 }) as any;
    const linked = Number(testDb.prepare("INSERT INTO budget_items (trip_id, name, total_price, place_id) VALUES (?, 'Tickets', 34, ?)").run(trip.id, place.id).lastInsertRowid);
    const untouched = Number(testDb.prepare("INSERT INTO budget_items (trip_id, name, total_price, place_id) VALUES (?, 'Other tickets', 12, ?)").run(trip.id, other.id).lastInsertRowid);
    const standalone = Number(testDb.prepare("INSERT INTO budget_items (trip_id, name, total_price) VALUES (?, 'Coffee', 3)").run(trip.id).lastInsertRowid);

    // Read the link before the delete — that is what the controller broadcasts.
    expect(svc.linkedExpenseIds(trip.id, [place.id])).toEqual([linked]);
    expect(await svc.remove(String(trip.id), String(place.id))).toBe(true);

    const rows = testDb.prepare('SELECT id FROM budget_items ORDER BY id').all() as { id: number }[];
    expect(rows.map(r => r.id)).toEqual([untouched, standalone]);
  });

  it('PLACE-SVC-019d — removeMany takes the expense of every deleted place with it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = createPlace(testDb, trip.id, { name: 'A' }) as any;
    const b = createPlace(testDb, trip.id, { name: 'B', lat: 48.86, lng: 2.3266 }) as any;
    const keep = createPlace(testDb, trip.id, { name: 'C', lat: 48.87, lng: 2.34 }) as any;
    for (const p of [a, b, keep]) {
      testDb.prepare("INSERT INTO budget_items (trip_id, name, total_price, place_id) VALUES (?, 'x', 1, ?)").run(trip.id, p.id);
    }

    expect(svc.linkedExpenseIds(trip.id, [a.id, b.id])).toHaveLength(2);
    await svc.removeMany(String(trip.id), [a.id, b.id]);

    const rows = testDb.prepare('SELECT place_id FROM budget_items').all() as { place_id: number }[];
    expect(rows.map(r => r.place_id)).toEqual([keep.id]);
  });

  it('PLACE-SVC-019e — linkedExpenseIds ignores places of another trip and an empty list', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const place = createPlace(testDb, other.id, { name: 'Elsewhere' }) as any;
    testDb.prepare("INSERT INTO budget_items (trip_id, name, total_price, place_id) VALUES (?, 'x', 1, ?)").run(other.id, place.id);

    expect(svc.linkedExpenseIds(trip.id, [place.id])).toEqual([]);
    expect(svc.linkedExpenseIds(trip.id, [])).toEqual([]);
  });

  it('PLACE-SVC-019b — reclaims the photo cache for the deleted place', async () => {
    removeIfUnreferencedSpy.mockClear();
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'With Photo' }) as any;
    testDb.prepare('UPDATE places SET google_place_id = ? WHERE id = ?').run('ChIJgid', place.id);

    await svc.remove(String(trip.id), String(place.id));

    expect(removeIfUnreferencedSpy).toHaveBeenCalledWith('ChIJgid');
  });
});

// ── removeMany ────────────────────────────────────────────────────────────────

describe('removeMany', () => {
  it('PLACE-SVC-056 — deletes the trip-scoped ids in one transaction and reports them', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const a = createPlace(testDb, trip.id, { name: 'A' }) as any;
    const b = createPlace(testDb, trip.id, { name: 'B' }) as any;
    const foreign = createPlace(testDb, other.id, { name: 'Foreign' }) as any;

    const deleted = await svc.removeMany(String(trip.id), [a.id, b.id, foreign.id, 99999]);

    expect(deleted.sort()).toEqual([a.id, b.id].sort());
    expect(svc.get(String(other.id), String(foreign.id))).not.toBeNull();
  });

  it('PLACE-SVC-057 — returns [] for an empty id list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.removeMany(String(trip.id), [])).toEqual([]);
  });
});

// ── importGpx ─────────────────────────────────────────────────────────────────

describe('importGpx', () => {
  it('PLACE-SVC-020 — returns null when buffer has no <gpx> root', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = svc.importGpx(String(trip.id), Buffer.from('<not-gpx/>'));
    expect(result).toBeNull();
  });

  it('PLACE-SVC-021 — imports <wpt> waypoints as places', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <wpt lat="48.8566" lon="2.3522"><name>Paris</name></wpt>
      <wpt lat="51.5074" lon="-0.1278"><name>London</name></wpt>
    </gpx>`);
    const result = svc.importGpx(String(trip.id), gpx) as any;
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
    const result = svc.importGpx(String(trip.id), gpx) as any;
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
    const result = svc.importGpx(String(trip.id), gpx) as any;
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
    const result = svc.importGpx(String(trip.id), gpx) as any;
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
    const result = svc.importGpx(String(trip.id), gpx);
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
    const result = svc.importGpx(String(trip.id), gpx) as any;
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
    const result = svc.importGpx(String(trip.id), gpx, { defaultName: 'morning-hike.gpx' }) as any;
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
    const result = await svc.importGoogleList(String(trip.id), 'https://example.com/no-id-here') as any;
    expect(result.error).toMatch(/Could not extract list ID/);
    expect(result.status).toBe(400);
  });

  it('PLACE-SVC-026b — a single-place link gives a guiding error instead of the generic one (#1304)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const url = 'https://www.google.com/maps/place/Eiffel+Tower/@48.8584,2.2945,17z/data=!3m1';
    const result = await svc.importGoogleList(String(trip.id), url) as any;
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/single place/i);
  });

  it('PLACE-SVC-027 — returns error when Google Maps API responds with non-ok status', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, text: async () => '', status: 502 }));
    const url = 'https://www.google.com/maps/placelists/list/ABC123DEF456';
    const result = await svc.importGoogleList(String(trip.id), url) as any;
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
    const result = await svc.importGoogleList(String(trip.id), url) as any;
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
    const result = await svc.importGoogleList(String(trip.id), url) as any;

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
    const result = await svc.importGoogleList(String(trip.id), url) as any;
    const row = testDb.prepare('SELECT google_place_id, google_ftid FROM places WHERE id = ?').get(existing.id) as any;

    expect(result.places).toHaveLength(0);
    expect(result.skipped).toBe(1);
    expect(row.google_place_id).toBeNull();
    expect(row.google_ftid).toBe('0x882bf179e806d471:0x8591dde29c821a93');
  });

  it('PLACE-SVC-028e — the backfill lands on the row the provider id names, not on a namesake', async () => {
    // The importer's parsed item spells the id `googleFtid`, the match rule reads
    // `google_ftid`, so the raw object used to reach findDuplicatePlace with no id
    // at all. The name then decided, and a second place sharing the name took the
    // ftid that belonged to the renamed one.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const renamed = createPlace(testDb, trip.id, {
      name: 'Saturday market run',
      lat: 43.5118527,
      lng: -80.5542617,
    }) as any;
    testDb.prepare('UPDATE places SET google_ftid = ? WHERE id = ?')
      .run('0x882bf179e806d471:0x8591dde29c821a93', renamed.id);
    const namesake = createPlace(testDb, trip.id, {
      name: "St. Jacobs Farmers' Market",
      lat: 40.0,
      lng: -80.0,
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

    const result = await svc.importGoogleList(String(trip.id), 'https://www.google.com/maps/placelists/list/ABC123DEF456') as any;
    const other = testDb.prepare('SELECT google_ftid FROM places WHERE id = ?').get(namesake.id) as any;

    expect(result.skipped).toBe(1);
    expect(other.google_ftid).toBeNull();
  });

  it('PLACE-SVC-028d — a renamed place is not re-imported as a twin (#1550)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    const listPayload = [
      [null, null, null, null, 'My Test List', null, null, null, [
        [null, [null, null, null, null, '878 Weber St N', [null, null, 43.5118527, -80.5542617], ['-8634542354666695567', '-8822026229683971437']], "St. Jacobs Farmers' Market"],
      ]],
    ];
    const respond = () => vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'prefix\n' + JSON.stringify(listPayload),
    }));
    const url = 'https://www.google.com/maps/placelists/list/ABC123DEF456';

    respond();
    const first = await svc.importGoogleList(String(trip.id), url) as any;
    expect(first.places).toHaveLength(1);

    // What the reporter does: rename it to something they can actually read, and
    // move it far enough that the coordinate fallback would not save us either.
    testDb.prepare('UPDATE places SET name = ?, lat = ?, lng = ? WHERE id = ?')
      .run('Saturday market', 43.6, -80.6, first.places[0].id);

    respond();
    const second = await svc.importGoogleList(String(trip.id), url) as any;
    expect(second.places).toHaveLength(0);
    expect(second.skipped).toBe(1);
    expect(testDb.prepare('SELECT COUNT(*) c FROM places WHERE trip_id = ?').get(trip.id)).toEqual({ c: 1 });
  });

  it('PLACE-SVC-028e — two places at the same coordinates still both import', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    // A bar and a diner in one building: same spot, different feature ids.
    const listPayload = [
      [null, null, null, null, 'One Building', null, null, null, [
        [null, [null, null, null, null, 'Same street 1', [null, null, 52.52, 13.405], ['1', '2']], 'Rooftop Bar'],
        [null, [null, null, null, null, 'Same street 1', [null, null, 52.52, 13.405], ['3', '4']], 'Ground Floor Diner'],
      ]],
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'prefix\n' + JSON.stringify(listPayload),
    }));

    const result = await svc.importGoogleList(String(trip.id), 'https://www.google.com/maps/placelists/list/ABC123DEF456') as any;
    expect(result.places).toHaveLength(2);
    expect(result.skipped).toBe(0);
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
    const result = await svc.importGoogleList(String(trip.id), url) as any;
    expect(result.error).toBeDefined();
    expect(result.status).toBe(400);
  });
});

// ── searchImage ───────────────────────────────────────────────────────────────

describe('searchImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PLACE-SVC-030 — returns 404 when place does not exist', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = await svc.searchImage(String(trip.id), '99999', user.id) as any;
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

    const result = await svc.searchImage(String(trip.id), String(place.id), user.id) as any;
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

    const result = await svc.searchImage(String(trip.id), String(place.id), user.id) as any;
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
    const first = svc.importGpx(String(trip.id), buf) as any;
    expect(first.count).toBeGreaterThan(0);

    // Second import — all names already present, nothing new created
    const second = svc.importGpx(String(trip.id), buf) as any;
    expect(second.count).toBe(0);
    expect(second.skipped).toBe(first.count);

    // Total places in DB should equal first import count
    const total = (svc.list(String(trip.id), {}) as any[]).length;
    expect(total).toBe(first.count);
  });

  it('PLACE-SVC-034 — imports new places while skipping existing ones', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const buf = fs.readFileSync(GPX_FIXTURE);

    const first = svc.importGpx(String(trip.id), buf) as any;
    // Manually add a brand-new place so total > first.count
    createPlace(testDb, trip.id, { name: 'Unique Extra Place', lat: 99, lng: 99 });

    // Re-import: the fixture places are skipped, the extra place remains untouched
    const second = svc.importGpx(String(trip.id), buf) as any;
    expect(second.count).toBe(0);

    const total = (svc.list(String(trip.id), {}) as any[]).length;
    expect(total).toBe(first.count + 1);
  });
});

describe('importKmlPlaces deduplication', () => {
  it('PLACE-SVC-035 — skips placemarks already in trip by name', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const buf = fs.readFileSync(KML_FIXTURE);

    const first = svc.importKmlPlaces(String(trip.id), buf);
    expect(first.count).toBeGreaterThan(0);

    const second = svc.importKmlPlaces(String(trip.id), buf);
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

    const result = svc.importKmlPlaces(String(trip.id), kml);
    expect(result.count).toBe(1);
    expect(result.summary.skippedCount).toBe(1);
  });
});

// ── Custom place image reclaim (#1136) ──────────────────────────────────────────

describe('custom place image reclaim', () => {
  function writePlaceImage(name: string): string {
    const filePath = path.join(placesStorageFx.root, name);
    fs.writeFileSync(filePath, 'jpeg-bytes');
    return filePath;
  }

  it('PLACE-SVC-046 — replacing image_url unlinks the previous upload once unreferenced', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Photo' }) as any;
    const fileA = writePlaceImage('svc-replace-a.jpg');
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?').run('/uploads/places/svc-replace-a.jpg', place.id);
    expect(fs.existsSync(fileA)).toBe(true);

    await svc.update(String(trip.id), String(place.id), { image_url: '/uploads/places/svc-replace-b.jpg' });
    expect(fs.existsSync(fileA)).toBe(false);
  });

  it('PLACE-SVC-047 — clearing image_url to null unlinks the previous upload', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Photo' }) as any;
    const fileA = writePlaceImage('svc-clear.jpg');
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?').run('/uploads/places/svc-clear.jpg', place.id);
    expect(fs.existsSync(fileA)).toBe(true);

    await svc.update(String(trip.id), String(place.id), { image_url: null } as any);
    expect(fs.existsSync(fileA)).toBe(false);
  });

  it('PLACE-SVC-048 — remove unlinks the uploaded image', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Photo' }) as any;
    const fileA = writePlaceImage('svc-delete.jpg');
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?').run('/uploads/places/svc-delete.jpg', place.id);
    expect(fs.existsSync(fileA)).toBe(true);

    await svc.remove(String(trip.id), String(place.id));
    expect(fs.existsSync(fileA)).toBe(false);
  });

  it('PLACE-SVC-049 — a collection_places reference keeps the file when the trip place is deleted', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Shared Photo' }) as any;
    const fileA = writePlaceImage('svc-shared.jpg');
    testDb.prepare('UPDATE places SET image_url = ? WHERE id = ?').run('/uploads/places/svc-shared.jpg', place.id);
    // A saved-place in a collection holds the same uploaded file — the ref-count guard must protect it.
    const col = testDb.prepare('INSERT INTO collections (owner_id, name) VALUES (?, ?)').run(user.id, 'Saved');
    testDb.prepare('INSERT INTO collection_places (collection_id, owner_id, name, image_url) VALUES (?, ?, ?, ?)')
      .run(col.lastInsertRowid, user.id, 'Shared Photo', '/uploads/places/svc-shared.jpg');
    expect(fs.existsSync(fileA)).toBe(true);

    await svc.remove(String(trip.id), String(place.id));
    expect(fs.existsSync(fileA)).toBe(true);

    // resetTestDb does not clear collections; drop what this test inserted and its file.
    testDb.exec('DELETE FROM collection_places; DELETE FROM collections;');
    fs.unlinkSync(fileA);
  });

  // ── Collaborative ratings (#1435) ──────────────────────────────────────────
  it('PLACE-SVC-050 — rate stores one vote per user, replaces on re-vote, clears with null', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Rated' }) as { id: number };

    svc.rate(String(trip.id), String(place.id), user.id, 5);
    let rows = testDb.prepare('SELECT rating FROM place_ratings WHERE place_id = ? AND user_id = ?').all(place.id, user.id) as { rating: number }[];
    expect(rows).toEqual([{ rating: 5 }]);

    svc.rate(String(trip.id), String(place.id), user.id, 2); // re-vote replaces via the UNIQUE upsert
    rows = testDb.prepare('SELECT rating FROM place_ratings WHERE place_id = ? AND user_id = ?').all(place.id, user.id) as { rating: number }[];
    expect(rows).toEqual([{ rating: 2 }]);

    svc.rate(String(trip.id), String(place.id), user.id, null); // clear
    const count = testDb.prepare('SELECT COUNT(*) AS n FROM place_ratings WHERE place_id = ?').get(place.id) as { n: number };
    expect(count.n).toBe(0);
  });

  it('PLACE-SVC-051 — rate returns null and writes nothing when the place is not in the trip', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const place = createPlace(testDb, otherTrip.id, { name: 'Elsewhere' }) as { id: number };

    expect(svc.rate(String(trip.id), String(place.id), user.id, 4)).toBeNull();
    const count = testDb.prepare('SELECT COUNT(*) AS n FROM place_ratings WHERE place_id = ?').get(place.id) as { n: number };
    expect(count.n).toBe(0);
  });
});

// ── Automatic track colours (#776) ────────────────────────────────────────────

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

function importFixture(tripId: number) {
  return svc.importGpx(String(tripId), Buffer.from(GPX_WITH_TRACKS), {
    importWaypoints: true, importRoutes: true, importTracks: true,
  });
}

function tracksOf(tripId: number) {
  return testDb.prepare('SELECT id, route_color FROM places WHERE trip_id = ? AND route_geometry IS NOT NULL ORDER BY id')
    .all(tripId) as { id: number; route_color: string | null }[];
}

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

  it('PLACES-SVC-005 — an import that yields nothing colours nothing', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    expect(() => (svc as any).colorizeImportedTracks(String(trip.id), null)).not.toThrow();
    expect(() => (svc as any).colorizeImportedTracks(String(trip.id), { places: [] })).not.toThrow();

    expect(tracksOf(trip.id)).toEqual([]);
  });
});

// ── Import enrichment (#886) ──────────────────────────────────────────────────

describe('enrichImportedPlaces', () => {
  // Deliberately partial: each case stubs only the provider calls its path reaches.
  function enrichSvc(maps: Partial<MapsService>) {
    return makePlacesService(maps as MapsService);
  }

  it('PLACE-SVC-058 — no-ops when no Google Maps key is configured', async () => {
    const searchPlaces = vi.fn();
    const svcNoKey = enrichSvc({ getMapsKey: vi.fn(() => null), searchPlaces });
    await svcNoKey.enrichImportedPlaces('1', 1, [{ id: 1, name: 'A', lat: 1, lng: 2 }]);
    expect(searchPlaces).not.toHaveBeenCalled();
  });

  it('PLACE-SVC-059 — no-ops for an empty batch without touching the provider', async () => {
    const getMapsKey = vi.fn(() => 'key');
    await enrichSvc({ getMapsKey }).enrichImportedPlaces('1', 1, []);
    expect(getMapsKey).not.toHaveBeenCalled();
  });

  it('PLACE-SVC-060 — fills only the empty columns and persists the resolved ids', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 }) as any;
    // An address the import already captured must survive the COALESCE.
    testDb.prepare('UPDATE places SET address = ? WHERE id = ?').run('Imported address', place.id);

    const svcWithMaps = enrichSvc({
      getMapsKey: vi.fn(() => 'key'),
      searchPlaces: vi.fn(async () => ({
        source: 'google',
        places: [{ google_place_id: 'ChIJ1', google_ftid: '0x1:0x2', address: 'Google address', website: 'https://x', phone: '+33', lat: 48.85, lng: 2.35 }],
      })),
      getPlacePhoto: vi.fn(async () => ({ photoUrl: '/api/maps/place-photo/ChIJ1/bytes', attribution: null })),
    } as never);

    await svcWithMaps.enrichImportedPlaces(String(trip.id), user.id, [{ id: place.id, name: 'Bar', lat: 48.85, lng: 2.35 }]);

    const row = testDb.prepare('SELECT google_place_id, google_ftid, address, website, phone, image_url FROM places WHERE id = ?').get(place.id) as any;
    expect(row.google_place_id).toBe('ChIJ1');
    expect(row.google_ftid).toBe('0x1:0x2');
    expect(row.address).toBe('Imported address'); // NOT clobbered
    expect(row.website).toBe('https://x');
    expect(row.phone).toBe('+33');
    expect(row.image_url).toBe('/api/maps/place-photo/ChIJ1/bytes');
  });

  it('PLACE-SVC-061 — leaves the place alone when no candidate is close enough', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 }) as any;

    const svcWithMaps = enrichSvc({
      getMapsKey: vi.fn(() => 'key'),
      // ~1.2 km away — beyond MATCH_RADIUS_METERS.
      searchPlaces: vi.fn(async () => ({ source: 'google', places: [{ google_place_id: 'ChIJfar', lat: 48.86, lng: 2.36 }] })),
    } as never);

    await svcWithMaps.enrichImportedPlaces(String(trip.id), user.id, [{ id: place.id, name: 'Bar', lat: 48.85, lng: 2.35 }]);

    const row = testDb.prepare('SELECT google_place_id FROM places WHERE id = ?').get(place.id) as any;
    expect(row.google_place_id).toBeNull();
  });

  it('PLACE-SVC-062 — a failed photo fetch never undoes the rest of the enrichment', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 }) as any;

    const svcWithMaps = enrichSvc({
      getMapsKey: vi.fn(() => 'key'),
      searchPlaces: vi.fn(async () => ({ source: 'google', places: [{ google_place_id: 'ChIJ1', lat: 48.85, lng: 2.35 }] })),
      getPlacePhoto: vi.fn(async () => { throw new Error('provider down'); }),
    } as never);

    await svcWithMaps.enrichImportedPlaces(String(trip.id), user.id, [{ id: place.id, name: 'Bar', lat: 48.85, lng: 2.35 }]);

    const row = testDb.prepare('SELECT google_place_id, image_url FROM places WHERE id = ?').get(place.id) as any;
    expect(row.google_place_id).toBe('ChIJ1');
    expect(row.image_url).toBeNull();
  });

  it('PLACE-SVC-063 — a per-place failure is swallowed so the batch never throws', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const svcWithMaps = enrichSvc({
      getMapsKey: vi.fn(() => 'key'),
      searchPlaces: vi.fn(async () => { throw new Error('lookup exploded'); }),
    } as never);

    await expect(
      svcWithMaps.enrichImportedPlaces(String(trip.id), user.id, [{ id: 1, name: 'A', lat: 1, lng: 2 }]),
    ).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it('PLACE-SVC-064 — skips a place that is already linked or has no coordinates', async () => {
    const searchPlaces = vi.fn();
    const svcWithMaps = enrichSvc({ getMapsKey: vi.fn(() => 'key'), searchPlaces } as never);
    await svcWithMaps.enrichImportedPlaces('1', 1, [
      { id: 1, name: 'Linked', lat: 1, lng: 2, google_place_id: 'ChIJalready' },
      { id: 2, name: 'Coordless', lat: null as never, lng: null as never },
    ]);
    expect(searchPlaces).not.toHaveBeenCalled();
  });
});

// ── Falsy-coercion fixes (#1745) ──────────────────────────────────────────────
//
// The legacy service ran every optional field through `x || fallback`, which
// cannot tell "absent" from a legitimate zero. Coordinates on the equator or
// the prime meridian were silently dropped and a zero duration/price was
// replaced by the default.

describe('zero-valued numeric fields', () => {
  it('PLACE-SVC-065 — create keeps lat/lng of exactly 0 instead of nulling them', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = svc.create(String(trip.id), { name: 'Null Island', lat: 0, lng: 0 }) as any;
    expect(place.lat).toBe(0);
    expect(place.lng).toBe(0);
    // A genuinely absent coordinate still lands as NULL.
    const noCoords = svc.create(String(trip.id), { name: 'Unlocated' }) as any;
    expect(noCoords.lat).toBeNull();
    expect(noCoords.lng).toBeNull();
  });

  it('PLACE-SVC-066 — create keeps duration_minutes and price of 0', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = svc.create(String(trip.id), { name: 'Drive-by', duration_minutes: 0, price: 0 }) as any;
    expect(place.duration_minutes).toBe(0);
    expect(place.price).toBe(0);
    // The 60-minute default still applies when the field is absent.
    expect((svc.create(String(trip.id), { name: 'Default' }) as any).duration_minutes).toBe(60);
  });

  it('PLACE-SVC-067 — update can set duration_minutes to 0', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Stop' }) as any;
    testDb.prepare('UPDATE places SET duration_minutes = 90 WHERE id = ?').run(place.id);

    const zeroed = await svc.update(String(trip.id), String(place.id), { duration_minutes: 0 }) as any;
    expect(zeroed.duration_minutes).toBe(0);

    // An omitted duration still leaves the stored value alone (COALESCE).
    const untouched = await svc.update(String(trip.id), String(place.id), { name: 'Stop 2' }) as any;
    expect(untouched.duration_minutes).toBe(0);
  });
});

// ── LIKE metacharacter escaping (#1745) ───────────────────────────────────────

describe('list search escaping', () => {
  it('PLACE-SVC-068 — a % or _ in the search term matches literally, not as a wildcard', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: '50% off shop' });
    createPlace(testDb, trip.id, { name: 'Bar' });
    createPlace(testDb, trip.id, { name: 'a_b cafe' });
    createPlace(testDb, trip.id, { name: 'axb cafe' });

    // '%' used to match every row.
    expect((svc.list(String(trip.id), { search: '%' }) as any[]).map(p => p.name)).toEqual(['50% off shop']);
    // '_' used to match any single character.
    expect((svc.list(String(trip.id), { search: 'a_b' }) as any[]).map(p => p.name)).toEqual(['a_b cafe']);
  });

  it('PLACE-SVC-069 — ordinary search terms are unaffected', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    createPlace(testDb, trip.id, { name: 'Louvre' });
    expect((svc.list(String(trip.id), { search: 'eiff' }) as any[]).map(p => p.name)).toEqual(['Eiffel Tower']);
  });
});

// ── Trip-scoped id filter for the journey delete hook (#1745) ─────────────────

describe('scopedIds', () => {
  it('PLACE-SVC-070 — returns only the ids that belong to the trip, preserving input order', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const a = createPlace(testDb, trip.id, { name: 'A' }) as any;
    const b = createPlace(testDb, trip.id, { name: 'B' }) as any;
    const foreign = createPlace(testDb, other.id, { name: 'Foreign' }) as any;

    expect(svc.scopedIds(String(trip.id), [b.id, foreign.id, a.id, 99999])).toEqual([b.id, a.id]);
    expect(svc.scopedIds(String(trip.id), [])).toEqual([]);
  });
});

// ── Provider-payload hardening for the Google list import (#1745) ─────────────

describe('importGoogleList provider payload', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PLACE-SVC-071 — a malformed provider body is the documented 400, not a thrown SyntaxError', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'prefix\nnot-json-at-all' }));
    const result = await svc.importGoogleList(String(trip.id), 'https://www.google.com/maps/placelists/list/ABC123DEF456') as any;
    expect(result).toEqual({ error: 'Invalid list data received from Google Maps', status: 400 });
  });

  it('PLACE-SVC-072 — a non-array provider payload is rejected the same way', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'prefix\n{"unexpected":true}' }));
    const result = await svc.importGoogleList(String(trip.id), 'https://www.google.com/maps/placelists/list/ABC123DEF456') as any;
    expect(result).toEqual({ error: 'Invalid list data received from Google Maps', status: 400 });
  });

  it('PLACE-SVC-073b — an over-large chunked response (no content-length) is refused after the read', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null }, // chunked: the declared check cannot help
      text: async () => 'x'.repeat(9 * 1024 * 1024),
    }));
    const result = await svc.importGoogleList(String(trip.id), 'https://www.google.com/maps/placelists/list/ABC123DEF456') as any;
    expect(result).toEqual({ error: 'Failed to fetch list from Google Maps', status: 502 });
  });

  it('PLACE-SVC-073 — an over-large declared response is refused before it is read', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const text = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (h: string) => (h.toLowerCase() === 'content-length' ? String(20 * 1024 * 1024) : null) },
      text,
    }));
    const result = await svc.importGoogleList(String(trip.id), 'https://www.google.com/maps/placelists/list/ABC123DEF456') as any;
    expect(result).toEqual({ error: 'Failed to fetch list from Google Maps', status: 502 });
    expect(text).not.toHaveBeenCalled();
  });
});

// ── Provider-payload hardening for the Naver list import (#1745) ──────────────

describe('importNaverList provider payload', () => {
  const FOLDER_URL = 'https://map.naver.com/v5/favorite/myPlace/folder/abc123';

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PLACE-SVC-074 — an over-large declared page is refused before it is read', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const text = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: (h: string) => (h.toLowerCase() === 'content-length' ? String(20 * 1024 * 1024) : null) },
      text,
    }));
    const result = await svc.importNaverList(String(trip.id), FOLDER_URL) as any;
    expect(result).toEqual({ error: 'Failed to fetch list from Naver Maps', status: 502 });
    expect(text).not.toHaveBeenCalled();
  });

  it('PLACE-SVC-075 — an over-large chunked page (no content-length) is refused after the read', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => null }, // chunked: the declared check cannot help
      text: async () => 'x'.repeat(9 * 1024 * 1024),
    }));
    const result = await svc.importNaverList(String(trip.id), FOLDER_URL) as any;
    expect(result).toEqual({ error: 'Failed to fetch list from Naver Maps', status: 502 });
  });

  it('PLACE-SVC-076 — a malformed page body is still the documented 400', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'not-json-at-all' }));
    const result = await svc.importNaverList(String(trip.id), FOLDER_URL) as any;
    expect(result).toEqual({ error: 'Invalid list data received from Naver Maps', status: 400 });
  });

  it('PLACE-SVC-077 — an ordinary page still imports', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        folder: { name: 'Seoul', bookmarkCount: 1 },
        bookmarkList: [{ name: 'Gyeongbokgung', px: 126.977, py: 37.5796, memo: null, address: 'Sejongno' }],
      }),
    }));
    const result = await svc.importNaverList(String(trip.id), FOLDER_URL) as any;
    expect(result.listName).toBe('Seoul');
    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe('Gyeongbokgung');
  });
});

// ── Free address backfill for list imports (#1954) ───────────────────────────
//
// A place pasted as a single Google Maps link has always been reverse geocoded;
// the same place arriving through a list import was not, so it stayed without an
// address forever. These cover the backfill that closes that gap.

describe('backfillMissingAddresses', () => {
  function backfillSvc(reverseGeocode: MapsService['reverseGeocode']) {
    return makePlacesService({ reverseGeocode } as unknown as MapsService);
  }

  it('PLACE-SVC-078 — fills the address of a place that has none', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 }) as any;

    const reverseGeocode = vi.fn(async () => ({ name: null, address: '1 Rue de Rivoli, Paris' }));
    await backfillSvc(reverseGeocode).backfillMissingAddresses(String(trip.id), [
      { id: place.id, name: 'Bar', lat: 48.85, lng: 2.35 },
    ]);

    expect(reverseGeocode).toHaveBeenCalledWith('48.85', '2.35', undefined, { lane: 'background', timeoutMs: 10000 });
    const row = testDb.prepare('SELECT address FROM places WHERE id = ?').get(place.id) as { address: string };
    expect(row.address).toBe('1 Rue de Rivoli, Paris');
  });

  it('PLACE-SVC-079 — never overwrites an address the import or the Google pass already wrote', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 }) as any;
    testDb.prepare('UPDATE places SET address = ? WHERE id = ?').run('Imported address', place.id);

    const reverseGeocode = vi.fn(async () => ({ name: null, address: 'Nominatim address' }));
    await backfillSvc(reverseGeocode).backfillMissingAddresses(String(trip.id), [
      { id: place.id, name: 'Bar', lat: 48.85, lng: 2.35, address: 'Imported address' },
    ]);

    expect(reverseGeocode).not.toHaveBeenCalled();
    const row = testDb.prepare('SELECT address FROM places WHERE id = ?').get(place.id) as { address: string };
    expect(row.address).toBe('Imported address');
  });

  it('PLACE-SVC-080 — a lookup that answers with nothing leaves the row untouched', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 }) as any;

    await backfillSvc(vi.fn(async () => ({ name: null, address: null }))).backfillMissingAddresses(String(trip.id), [
      { id: place.id, name: 'Bar', lat: 48.85, lng: 2.35 },
    ]);

    const row = testDb.prepare('SELECT address FROM places WHERE id = ?').get(place.id) as { address: string | null };
    expect(row.address).toBeNull();
  });

  it('PLACE-SVC-081 — one failing lookup does not take down the rest of the batch', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const first = createPlace(testDb, trip.id, { name: 'A', lat: 1, lng: 2 }) as any;
    const second = createPlace(testDb, trip.id, { name: 'B', lat: 3, lng: 4 }) as any;

    const reverseGeocode = vi.fn()
      .mockRejectedValueOnce(new Error('nominatim down'))
      .mockResolvedValueOnce({ name: null, address: 'Second address' });

    await expect(
      backfillSvc(reverseGeocode as unknown as MapsService['reverseGeocode']).backfillMissingAddresses(String(trip.id), [
        { id: first.id, name: 'A', lat: 1, lng: 2 },
        { id: second.id, name: 'B', lat: 3, lng: 4 },
      ]),
    ).resolves.toBeUndefined();

    const rows = testDb.prepare('SELECT id, address FROM places WHERE trip_id = ? ORDER BY id').all(trip.id) as {
      id: number; address: string | null;
    }[];
    expect(rows[0].address).toBeNull();
    expect(rows[1].address).toBe('Second address');
  });

  it('PLACE-SVC-082 — an oversized batch is refused rather than queued for an hour', async () => {
    const reverseGeocode = vi.fn();
    const batch = Array.from({ length: ADDRESS_BACKFILL_MAX_PLACES + 1 }, (_, i) => ({
      id: i + 1, name: `P${i}`, lat: 1, lng: 2,
    }));
    await backfillSvc(reverseGeocode as unknown as MapsService['reverseGeocode']).backfillMissingAddresses('1', batch);
    expect(reverseGeocode).not.toHaveBeenCalled();
  });

  it('PLACE-SVC-083 — a place without coordinates is skipped', async () => {
    const reverseGeocode = vi.fn();
    await backfillSvc(reverseGeocode as unknown as MapsService['reverseGeocode']).backfillMissingAddresses('1', [
      { id: 1, name: 'A', lat: null as unknown as number, lng: null as unknown as number },
    ]);
    expect(reverseGeocode).not.toHaveBeenCalled();
  });
});

// ── findMatchingPlaceId ───────────────────────────────────────────────────────

/**
 * The public door onto the place-matching rule, for importers that need the
 * matched row's id so they can link to it rather than merely knowing a duplicate
 * exists. The rule itself lives in @trek/shared (place-match.ts); these cases pin
 * that this service interprets it faithfully against real SQL.
 */
describe('findMatchingPlaceId', () => {
  it('PLACES-SVC-008 — matches an existing place by name, ignoring case and surrounding space', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Eiffel Tower' });

    expect(svc.findMatchingPlaceId(String(trip.id), { name: '  eiffel tower ' })).toBe(place.id);
  });

  it('PLACES-SVC-009 — matches on a provider id even after the place was renamed (#1550)', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Original Name' });
    testDb.prepare('UPDATE places SET google_place_id = ? WHERE id = ?').run('ChIJ_abc', place.id);

    expect(
      svc.findMatchingPlaceId(String(trip.id), { name: 'Renamed By User', google_place_id: 'ChIJ_abc' }),
    ).toBe(place.id);
  });

  it('PLACES-SVC-010 — does NOT match a NAMED candidate to a different place at the same coordinates', () => {
    // The restaurant and the bar in the same building are two places. This is the
    // rule isPlaceDuplicate has always applied; the SQL copy used to disagree.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Ground Floor Diner', lat: 52.52, lng: 13.405 });

    expect(
      svc.findMatchingPlaceId(String(trip.id), { name: 'Rooftop Bar', lat: 52.52, lng: 13.405 }),
    ).toBeNull();
  });

  it('PLACES-SVC-011 — matches an UNNAMED candidate by coordinates within tolerance', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Anything', lat: 48.85, lng: 2.35 });

    expect(
      svc.findMatchingPlaceId(String(trip.id), {
        name: null,
        lat: 48.85 + COORD_DEDUP_TOLERANCE / 2,
        lng: 2.35,
      }),
    ).toBe(place.id);
  });

  it('PLACES-SVC-012 — returns null when nothing recognises the candidate', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Somewhere Else' });

    expect(svc.findMatchingPlaceId(String(trip.id), { name: 'Unseen Place' })).toBeNull();
    expect(svc.findMatchingPlaceId(String(trip.id), { name: null, lat: null, lng: null })).toBeNull();
  });

  it('PLACES-SVC-013 — never matches a place belonging to another trip', () => {
    const { user } = createUser(testDb);
    const mine = createTrip(testDb, user.id);
    const theirs = createTrip(testDb, user.id);
    createPlace(testDb, theirs.id, { name: 'Shared Name' });

    expect(svc.findMatchingPlaceId(String(mine.id), { name: 'Shared Name' })).toBeNull();
  });

  it('PLACES-SVC-014 — a provider id still wins over a name that points elsewhere', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // The place the user renamed, carrying the id the importer knows it by.
    const renamed = createPlace(testDb, trip.id, { name: 'Dinner Tuesday', lat: 41.88, lng: 12.47 });
    testDb.prepare('UPDATE places SET google_ftid = ? WHERE id = ?').run('0x1:0x2', renamed.id);
    // A different place that happens to carry the name the list still uses.
    createPlace(testDb, trip.id, { name: 'Trattoria da Enzo', lat: 41.9, lng: 12.5 });

    expect(
      svc.findMatchingPlaceId(String(trip.id), { name: 'Trattoria da Enzo', google_ftid: '0x1:0x2' }),
    ).toBe(renamed.id);
  });

  it('PLACES-SVC-015 — the name comparison is ASCII-only, so an accented capital does not match', () => {
    // Not a wish, a boundary: `lower(trim(name))` is SQLite's ASCII lowercase,
    // while normalizePlaceName uses JavaScript's Unicode one. isPlaceDuplicate
    // does match this pair in memory. Before the shared strategies, the
    // coordinate fallback covered the gap for a named candidate — sometimes with
    // the wrong row. This pins where the two halves still answer differently.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'CAFÉ CENTRAL', lat: 48.85, lng: 2.35 });

    expect(svc.findMatchingPlaceId(String(trip.id), { name: 'Café Central', lat: 48.85, lng: 2.35 })).toBeNull();
    // The all-ASCII spelling of the same shape does match.
    createPlace(testDb, trip.id, { name: 'CAFE CENTRAL', lat: 48.86, lng: 2.36 });
    expect(svc.findMatchingPlaceId(String(trip.id), { name: 'Cafe Central' })).not.toBeNull();
  });

  it('PLACES-SVC-016 — an unnamed candidate can match a NAMED row on coordinates', () => {
    // The other place the two halves differ: buildDedupSet collects coordinates
    // only for unnamed rows, so isPlaceDuplicate would say no here. This is the
    // answer findMatchingPlaceId wants — a booking with no place name should
    // link to the hotel that has one — so it is pinned rather than removed.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel Lutetia', lat: 48.851, lng: 2.326 });

    expect(svc.findMatchingPlaceId(String(trip.id), { name: null, lat: 48.851, lng: 2.326 })).toBe(hotel.id);
  });

  it('PLACES-SVC-017 — the coordinate tolerance is a box roughly 11 m wide, and it closes', () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: null, lat: 48.85, lng: 2.35 });

    // Pinned as a number, not against the constant: every other reference is
    // relative to it, so widening it from 11 m to 111 m would keep them all green.
    expect(COORD_DEDUP_TOLERANCE).toBe(0.0001);

    const inside = { name: null, lat: 48.85 + COORD_DEDUP_TOLERANCE * 0.9, lng: 2.35 };
    const outside = { name: null, lat: 48.85 + COORD_DEDUP_TOLERANCE * 1.5, lng: 2.35 };
    expect(svc.findMatchingPlaceId(String(trip.id), inside)).toBe(place.id);
    expect(svc.findMatchingPlaceId(String(trip.id), outside)).toBeNull();
    // Exactly one tolerance away is NOT a match: 48.85 + 0.0001 lands on
    // 48.850100000000004 in binary floating point, a hair over the bound. The
    // edge is fuzzy by design of the arithmetic, so nothing should lean on it.
    const edge = { name: null, lat: 48.85 + COORD_DEDUP_TOLERANCE, lng: 2.35 };
    expect(svc.findMatchingPlaceId(String(trip.id), edge)).toBeNull();
  });
});
