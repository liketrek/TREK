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

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    // Task 9 fix wave (item 10, A-L4c follow-up): the `getPlaceWithTags`/
    // `isOwner` fakes removed — both already went through the real ORM
    // (`entityManager().getRepository(Places/Trips)...`), never through this
    // mocked `db/database` module's exports, so these module-level fakes
    // were dead. Plan 4 Task 4: `DatabaseService` itself is gone now too —
    // `PlacesService`/`AccommodationsService` are fully repository-backed.
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
  };
    return mock;
});


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

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { accommodationsOver } from '../../helpers/accommodations-service';
import { createUser, createTrip, createPlace, createDay, createCategory, createTag, addTripMember } from '../../helpers/factories';
import path from 'path';
import fs from 'fs';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { noGoogleQuota } from '../../helpers/google-quota';
import { createTestUnitOfWork, createTestAppSettingsRepo, createTestUsersRepo, createTestTagsRepo, createTestPlaceRatingsRepo, createTestAssignmentParticipantsRepo, createTestPlacesRepo, createTestTripMembersRepo, createTestDayAssignmentsRepo, createTestCategoriesRepo, createTestTripsRepo, sharedTestOrm } from '../../helpers/test-uow';
import { createTestBudgetItemsRepo } from '../../helpers/files-repos';
import { createTestCollectionPlacesRepo } from '../../helpers/test-uow';
import {
  createTestJourneysRepo, createTestJourneyContributorsRepo, createTestJourneyTripsRepo, createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo, createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
import type { AppSettingsRepository } from '../../../src/db/repositories/AppSettings.repository';
import type { UsersRepository } from '../../../src/db/repositories/Users.repository';
import { isUpdateConflict, type UpdateConflict } from '../../../src/nest/common/conflictResult';

/**
 * Narrows `PlacesService.update`'s `PlaceWithTags | UpdateConflict | null`
 * union to the successful-write case, for tests that only ever exercise the
 * happy path and previously reached for `as any` to read a field off the
 * result (L4/L1 — no new `any`).
 */
function asUpdatedPlace(
  result: Awaited<ReturnType<PlacesService['update']>>,
): Exclude<Awaited<ReturnType<PlacesService['update']>>, null | UpdateConflict> {
  if (result === null || isUpdateConflict(result)) {
    throw new Error('expected a successful update, got null or a conflict');
  }
  return result;
}

// The default `maps` MapsService below never has its key-resolving methods
// exercised by this file's own cases (a real caller passes its own `maps`
// when it needs that) — these are stand-ins only so the constructor call
// typechecks and never throws if a future case does reach them.
const noAppSettings = { getValue: async () => null } as unknown as AppSettingsRepository;
const noUsers = { getApiKeyColumn: async () => null } as unknown as UsersRepository;

const GPX_FIXTURE = path.join(__dirname, '../../fixtures/test.gpx');
const KML_FIXTURE = path.join(__dirname, '../../fixtures/test.kml');

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

async function makePlacesService(
  maps: MapsService = new MapsService(photoCacheStub, noAppSettings, noUsers, {} as never, {} as never, noGoogleQuota),
): Promise<PlacesService> {
  return new PlacesService(
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    new RealtimeService(),
    maps,
    new QueryHelpersService(await createTestTagsRepo(testDb), await createTestPlaceRatingsRepo(testDb), await createTestAssignmentParticipantsRepo(testDb)),
    new UnsplashService(await createTestAppSettingsRepo(testDb), await createTestUsersRepo(testDb), new RuntimeEnvService(), placesStorageFx.storage),
    photoCacheStub,
    new JourneyDomainService(
      new RealtimeService(), new TrekPhotoRegistrationService((await sharedTestOrm(testDb)).repo(TrekPhotos), (await sharedTestOrm(testDb)).repo(TripPhotos), await createTestJourneyPhotosRepo(testDb)), await createTestUnitOfWork(testDb),
      await createTestJourneysRepo(testDb), await createTestJourneyContributorsRepo(testDb),
      await createTestJourneyTripsRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestTripsRepo(testDb),
      // Plan 3g Task 2 constructor-ripple: JourneyPhotosRepository/JourneyEntryPhotosRepository/PlacesRepository.
      await createTestJourneyPhotosRepo(testDb), await createTestJourneyEntryPhotosRepo(testDb), await createTestPlacesRepo(testDb),
    ),
    placesStorageFx.storage,
    await accommodationsOver(testDb), await createTestUnitOfWork(testDb),
    await createTestPlacesRepo(testDb),
    await createTestTagsRepo(testDb),
    await createTestPlaceRatingsRepo(testDb),
    await createTestTripMembersRepo(testDb),
    await createTestDayAssignmentsRepo(testDb),
    await createTestCategoriesRepo(testDb),
  await createTestTripsRepo(testDb),
  await createTestBudgetItemsRepo(testDb),
  await createTestCollectionPlacesRepo(testDb),
  );
}

let accommodations: Awaited<ReturnType<typeof accommodationsOver>>;
let svc: Awaited<ReturnType<typeof makePlacesService>>;
beforeAll(async () => {
  // Plan 4 Task 4: `DatabaseService` is gone — `PlacesService`/
  // `AccommodationsService` are fully repository-backed now, so the
  // `dbs.canAccessTrip`/`dbs.getPlaceWithTags` spies this block used to
  // route to a real `DatabaseService` are dead; removed with it.
  accommodations = await accommodationsOver(testDb);
  svc = await makePlacesService();
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// ── list ──────────────────────────────────────────────────────────────────────

describe('list', () => {
  it('PLACE-SVC-001 — returns empty array when trip has no places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.list(String(trip.id), {})).toEqual([]);
  });

  it('PLACE-SVC-002 — returns all places for a trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Alpha' });
    createPlace(testDb, trip.id, { name: 'Beta' });
    const places = (await svc.list(String(trip.id), {})) as any[];
    expect(places).toHaveLength(2);
  });

  it('PLACE-SVC-003 — does not return places from other trips', async () => {
    const { user } = createUser(testDb);
    const t1 = createTrip(testDb, user.id);
    const t2 = createTrip(testDb, user.id);
    createPlace(testDb, t1.id, { name: 'T1 Place' });
    createPlace(testDb, t2.id, { name: 'T2 Place' });
    const places = (await svc.list(String(t1.id), {})) as any[];
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('T1 Place');
  });

  it('PLACE-SVC-004 — filters by search term (name)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    createPlace(testDb, trip.id, { name: 'Louvre Museum' });
    const places = (await svc.list(String(trip.id), { search: 'Eiffel' })) as any[];
    expect(places).toHaveLength(1);
    expect(places[0].name).toBe('Eiffel Tower');
  });

  it('PLACE-SVC-005b — carries where each place lies: the cached region, else the bundled borders (#2537)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const berlin = createPlace(testDb, trip.id, { name: 'Brandenburger Tor', lat: 52.5163, lng: 13.3777 });
    const paris = createPlace(testDb, trip.id, { name: 'Louvre', lat: 48.8606, lng: 2.3376 });
    const nowhere = createPlace(testDb, trip.id, { name: 'Unplaced' });
    testDb.prepare('UPDATE places SET lat = NULL, lng = NULL, address = NULL WHERE id = ?').run(nowhere.id);
    testDb.prepare('INSERT INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)').run(berlin.id, 'DE', 'DE-BE', 'Berlin');
    const byId = new Map(((await svc.list(String(trip.id), {})) as any[]).map(p => [p.id, p]));
    expect(byId.get(berlin.id)).toMatchObject({ country_code: 'DE', region_name: 'Berlin' });
    expect(byId.get(paris.id)).toMatchObject({ country_code: 'FR', region_name: null });
    expect(byId.get(nowhere.id)!.country_code).toBeNull();
  });

  it('PLACE-SVC-005 — attaches tags array to each place (empty when none)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'No Tags' });
    const places = (await svc.list(String(trip.id), {})) as any[];
    expect(Array.isArray(places[0].tags)).toBe(true);
    expect(places[0].tags).toHaveLength(0);
  });

  it('PLACE-SVC-006 — attaches category object when place has a category', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const cat = createCategory(testDb, { name: 'Museum', user_id: user.id }) as any;
    const place = createPlace(testDb, trip.id, { name: 'Art Museum' }) as any;
    testDb.prepare('UPDATE places SET category_id = ? WHERE id = ?').run(cat.id, place.id);

    const places = (await svc.list(String(trip.id), {})) as any[];
    expect(places[0].category).toBeDefined();
    expect(places[0].category!.name).toBe('Museum');
  });
});

// ── create ────────────────────────────────────────────────────────────────────

describe('create', () => {
  it('PLACE-SVC-007 — creates a place and returns it with tags array', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = await svc.create(String(trip.id), { name: 'New Place', lat: 48.8, lng: 2.3 }) as any;
    expect(place).toBeDefined();
    expect(place.name).toBe('New Place');
    expect(Array.isArray(place.tags)).toBe(true);
  });

  it('PLACE-SVC-008 — creates a place with tags', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tag = createTag(testDb, user.id, { name: 'Highlight' }) as any;
    const place = await svc.create(String(trip.id), { name: 'Tagged Place', tags: [tag.id] }) as any;
    expect(place.tags).toHaveLength(1);
    expect(place.tags[0].id).toBe(tag.id);
  });

  // A tag belongs to a user, not a trip, and the place body is an open record, so
  // an id from someone outside the trip could be attached and then read straight
  // back — the tag projection carries the owner's user_id with it.
  it('PLACE-SVC-008a — drops a tag owned by someone outside the trip', async () => {
    const { user } = createUser(testDb);
    const { user: outsider } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const mine = createTag(testDb, user.id, { name: 'Mine' }) as any;
    const theirs = createTag(testDb, outsider.id, { name: 'Theirs' }) as any;

    const place = await svc.create(String(trip.id), { name: 'Tagged Place', tags: [mine.id, theirs.id] }) as any;

    expect(place.tags.map((t: any) => t.id)).toEqual([mine.id]);
  });

  it('PLACE-SVC-008b — keeps a co-traveller tag, so a shared place survives a foreign re-save', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const theirTag = createTag(testDb, member.id, { name: 'Theirs' }) as any;

    const place = await svc.create(String(trip.id), { name: 'Shared Place', tags: [theirTag.id] }) as any;

    expect(place.tags.map((t: any) => t.id)).toEqual([theirTag.id]);
  });

  it('PLACE-SVC-009 — place is associated with correct trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = await svc.create(String(trip.id), { name: 'My Place' }) as any;
    const row = testDb.prepare('SELECT trip_id FROM places WHERE id = ?').get(place.id) as any;
    expect(row.trip_id).toBe(trip.id);
  });
});

// ── get ───────────────────────────────────────────────────────────────────────

describe('get', () => {
  it('PLACE-SVC-010 — returns the place when tripId and placeId match', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Find Me' }) as any;
    const found = await svc.get(String(trip.id), String(place.id)) as any;
    expect(found).toBeDefined();
    expect(found.name).toBe('Find Me');
  });

  it('PLACE-SVC-011 — returns null when place belongs to different trip', async () => {
    const { user } = createUser(testDb);
    const t1 = createTrip(testDb, user.id);
    const t2 = createTrip(testDb, user.id);
    const place = createPlace(testDb, t1.id, { name: 'T1 Place' }) as any;
    expect(await svc.get(String(t2.id), String(place.id))).toBeNull();
  });

  it('PLACE-SVC-012 — returns null for non-existent placeId', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.get(String(trip.id), '99999')).toBeNull();
  });

  // Task 3 review H1's lesson, applied to every place-id gate this task
  // converts: a non-canonical id shape (`"<id> "`, `"<id>.0"`, `"+<id>"`)
  // must resolve to not-found HERE, in the gate — SQLite's own affinity
  // would otherwise match it, and this service's writes downstream convert
  // with `toRowId`, which rejects the same shapes.
  it('PLACE-SVC-012b (H1) — non-canonical id shapes ("<id> ", "<id>.0", "+<id>") also return null, not just non-numeric ids', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    expect(await svc.get(String(trip.id), `${place.id} `)).toBeNull();
    expect(await svc.get(String(trip.id), `${place.id}.0`)).toBeNull();
    expect(await svc.get(String(trip.id), `+${place.id}`)).toBeNull();
    // The canonical shape still finds it, proving the fix didn't just null everything.
    expect(await svc.get(String(trip.id), String(place.id))).not.toBeNull();
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

  it('PLACE-SVC-2472 — keeps an e-mail and hand-kept hours, trims the address, empty clears', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const week = '[{"closed":false,"open":"09:00","close":"17:00"},{"closed":false},{"closed":false},{"closed":false},{"closed":false},{"closed":true},{"closed":true}]';
    const place = await svc.create(String(trip.id), { name: 'Bakery', email: ' shop@example.com ', opening_hours: week }) as any;
    expect(place.email).toBe('shop@example.com');
    expect(place.opening_hours).toBe(week);

    const renamed = await svc.update(String(trip.id), String(place.id), { name: 'Baker' }) as any;
    expect(renamed.email).toBe('shop@example.com');
    expect(renamed.opening_hours).toBe(week);

    const cleared = await svc.update(String(trip.id), String(place.id), { email: '', opening_hours: '' }) as any;
    expect(cleared.email).toBeNull();
    expect(cleared.opening_hours).toBeNull();
  });

  it('PLACE-SVC-014 — returns null for non-existent place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await svc.update(String(trip.id), '99999', { name: 'Ghost' })).toBeNull();
  });

  it('PLACE-SVC-014b (H1) — a non-canonical id ("<id> ") is null, not a write: the row is left untouched', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Untouched' });
    const result = await svc.update(String(trip.id), `${place.id} `, { name: 'Clobbered' });
    expect(result).toBeNull();
    const row = testDb.prepare('SELECT name FROM places WHERE id = ?').get(place.id) as { name: string };
    expect(row.name).toBe('Untouched');
  });

  it('PLACE-SVC-015 — updates tags (replaces old set)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tag1 = createTag(testDb, user.id, { name: 'Old Tag' }) as any;
    const tag2 = createTag(testDb, user.id, { name: 'New Tag' }) as any;
    const place = await svc.create(String(trip.id), { name: 'Taggable', tags: [tag1.id] }) as any;

    const updated = await svc.update(String(trip.id), String(place.id), { tags: [tag2.id] }) as any;
    expect(updated.tags).toHaveLength(1);
    expect(updated.tags[0].id).toBe(tag2.id);
  });

  it('PLACE-SVC-016 — clears tags when tags: [] is passed', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const tag = createTag(testDb, user.id, { name: 'Temp' }) as any;
    const place = await svc.create(String(trip.id), { name: 'Untaggable', tags: [tag.id] }) as any;

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

  it('PLACE-SVC-055 — create carries geometry and colour instead of dropping them', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const created = await svc.create(String(trip.id), {
      name: 'Restored track',
      route_geometry: '[[48.0,2.0],[49.0,3.0]]',
      route_color: '#7c3aed',
    }) as any;
    expect(created.route_geometry).toBe('[[48.0,2.0],[49.0,3.0]]');
    expect(created.route_color).toBe('#7c3aed');
  });

  // ── PL11's three COALESCE columns (Task 4 review M2) ─────────────────────────
  //
  // `name`/`currency`/`transport_mode` bind `x || null` and fold with
  // `?? existingPlace.x` — a falsy input (undefined, null OR '') keeps the old
  // value, exactly like SQL's `COALESCE(?, col)` with a null bind. Only a
  // truthy string writes. This is the opposite polarity of route_color/
  // stop_type/fill_percent just above (an explicit null clears those). The
  // review's mutation table: M3 (`name: name ?? existing`, so `''` would
  // write instead of keeping) and M4/M4b (`transport_mode`/`currency` treated
  // as `!== undefined ? x : existing`, so `null` would clear instead of
  // keeping) all SURVIVED every test in this file before these three.

  it('PLACE-SVC-013c (PL11, M3) — an empty-string name keeps the old name, it does not clear it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Original' });
    const updated = asUpdatedPlace(await svc.update(String(trip.id), String(place.id), { name: '' }));
    expect(updated.name).toBe('Original');
  });

  it('PLACE-SVC-013d (PL11, M3) — an explicit null name keeps the old name', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Original' });
    const updated = asUpdatedPlace(await svc.update(String(trip.id), String(place.id), { name: null as unknown as string }));
    expect(updated.name).toBe('Original');
  });

  it('PLACE-SVC-013e (PL11) — a truthy name still overwrites (the COALESCE bind is not a one-way lock)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Original' });
    const updated = asUpdatedPlace(await svc.update(String(trip.id), String(place.id), { name: 'Renamed' }));
    expect(updated.name).toBe('Renamed');
  });

  it('PLACE-SVC-013f (PL11, M4b) — an explicit null currency keeps the old currency, it does not clear it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Priced' });
    await svc.update(String(trip.id), String(place.id), { currency: 'EUR' });
    const updated = asUpdatedPlace(await svc.update(String(trip.id), String(place.id), { currency: null }));
    expect(updated.currency).toBe('EUR');
  });

  it('PLACE-SVC-013g (PL11, M4b) — an empty-string currency keeps the old currency', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Priced' });
    await svc.update(String(trip.id), String(place.id), { currency: 'EUR' });
    const updated = asUpdatedPlace(await svc.update(String(trip.id), String(place.id), { currency: '' }));
    expect(updated.currency).toBe('EUR');
  });

  it('PLACE-SVC-013h (PL11) — a truthy currency still overwrites', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Priced' });
    await svc.update(String(trip.id), String(place.id), { currency: 'EUR' });
    const updated = asUpdatedPlace(await svc.update(String(trip.id), String(place.id), { currency: 'USD' }));
    expect(updated.currency).toBe('USD');
  });

  it('PLACE-SVC-013i (PL11, M4) — an explicit null transport_mode keeps the old mode, it does not clear it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Moving' });
    await svc.update(String(trip.id), String(place.id), { transport_mode: 'driving' });
    const updated = asUpdatedPlace(await svc.update(String(trip.id), String(place.id), { transport_mode: null }));
    expect(updated.transport_mode).toBe('driving');
  });

  it('PLACE-SVC-013j (PL11, M4) — an empty-string transport_mode keeps the old mode', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Moving' });
    await svc.update(String(trip.id), String(place.id), { transport_mode: 'driving' });
    const updated = asUpdatedPlace(await svc.update(String(trip.id), String(place.id), { transport_mode: '' }));
    expect(updated.transport_mode).toBe('driving');
  });

  it('PLACE-SVC-013k (PL11) — a truthy transport_mode still overwrites', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Moving' });
    await svc.update(String(trip.id), String(place.id), { transport_mode: 'driving' });
    const updated = asUpdatedPlace(await svc.update(String(trip.id), String(place.id), { transport_mode: 'cycling' }));
    expect(updated.transport_mode).toBe('cycling');
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
    expect((await svc.get(String(other.id), String(foreign.id)) as any).notes).toBeNull();
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
    expect((await svc.remove(String(trip.id), String(place.id))).deleted).toBe(true);
    expect(await svc.get(String(trip.id), String(place.id))).toBeNull();
  });

  it('PLACE-SVC-018 — returns false for non-existent place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect((await svc.remove(String(trip.id), '99999')).deleted).toBe(false);
  });

  it('PLACE-SVC-018b (H1) — a non-canonical id ("<id> ") is not deleted: deleted:false, row intact', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Survives' });
    const result = await svc.remove(String(trip.id), `${place.id} `);
    expect(result.deleted).toBe(false);
    expect(await svc.get(String(trip.id), String(place.id))).not.toBeNull();
  });

  it('PLACE-SVC-019 — deleting one place does not remove others', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const p1 = createPlace(testDb, trip.id, { name: 'Keep' }) as any;
    const p2 = createPlace(testDb, trip.id, { name: 'Remove' }) as any;
    await svc.remove(String(trip.id), String(p2.id));
    const remaining = (await svc.list(String(trip.id), {})) as any[];
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(p1.id);
  });

  it('PLACE-SVC-019d — the night booked at a place goes with the place', async () => {
    // Left behind, a stay keeps its place_id as NULL: still drawn in the day header,
    // still naming a hotel through its partner booking, and pointing nowhere. Its day
    // stop and that booking go too, which is the accommodations cascade doing its job
    // rather than a second copy of it here.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel Adlon' }) as any;
    const { accommodation } = (await accommodations.createAccommodation(trip.id, {
      place_id: place.id, start_day_id: day.id, end_day_id: day.id,
    })) as any;
    expect(testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(accommodation.id)).toBeTruthy();

    await svc.remove(String(trip.id), String(place.id));

    expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(accommodation.id)).toBeUndefined();
    expect(testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(accommodation.id)).toBeUndefined();
    expect(testDb.prepare('SELECT id FROM day_assignments WHERE day_id = ?').all(day.id)).toEqual([]);
  });

  it('PLACE-SVC-019e — a place with no booking is untouched by that', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel Adlon' }) as any;
    const museum = createPlace(testDb, trip.id, { name: 'Pergamon' }) as any;
    const { accommodation } = (await accommodations.createAccommodation(trip.id, {
      place_id: hotel.id, start_day_id: day.id, end_day_id: day.id,
    })) as any;

    await svc.remove(String(trip.id), String(museum.id));

    expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(accommodation.id)).toBeTruthy();
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
    expect(await svc.linkedExpenseIds(trip.id, [place.id])).toEqual([linked]);
    expect((await svc.remove(String(trip.id), String(place.id))).deleted).toBe(true);

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

    expect(await svc.linkedExpenseIds(trip.id, [a.id, b.id])).toHaveLength(2);
    await svc.removeMany(String(trip.id), [a.id, b.id]);

    const rows = testDb.prepare('SELECT place_id FROM budget_items').all() as { place_id: number }[];
    expect(rows.map(r => r.place_id)).toEqual([keep.id]);
  });

  it('PLACE-SVC-019e — linkedExpenseIds ignores places of another trip and an empty list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const place = createPlace(testDb, other.id, { name: 'Elsewhere' }) as any;
    testDb.prepare("INSERT INTO budget_items (trip_id, name, total_price, place_id) VALUES (?, 'x', 1, ?)").run(other.id, place.id);

    expect(await svc.linkedExpenseIds(trip.id, [place.id])).toEqual([]);
    expect(await svc.linkedExpenseIds(trip.id, [])).toEqual([]);
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

  it('PLACE-SVC-019c (R5, MikroORM 7.2.1 nested transactional on SQLite) — a stay\'s own transaction nests as a SAVEPOINT under this transaction: a later failure in the OUTER write rolls the already-released inner savepoint back too', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel Adlon' });
    const { accommodation } = (await accommodations.createAccommodation(trip.id, {
      place_id: hotel.id, start_day_id: day.id, end_day_id: day.id,
    })) as { accommodation: { id: number } };
    const reservation = testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(accommodation.id) as { id: number };

    // cancelStaysAt (PL16) calls AccommodationsService.deleteAccommodation
    // FIRST inside this transaction — its own `uow.transactional` call nests
    // as a SAVEPOINT (UnitOfWork's NESTED propagation) and releases
    // successfully, deleting the stay and its reservation. Only THEN does
    // the place row's own DELETE fail. If the nested call were an
    // independent, already-committed transaction instead of a true
    // savepoint, the stay and its reservation would stay deleted regardless
    // of what happens to the place afterward — they do not.
    testDb.exec("CREATE TRIGGER boom BEFORE DELETE ON places BEGIN SELECT RAISE(ABORT, 'boom'); END");
    try {
      await expect(svc.remove(String(trip.id), String(hotel.id))).rejects.toThrow();
      expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(accommodation.id)).toBeDefined();
      expect(testDb.prepare('SELECT id FROM reservations WHERE id = ?').get(reservation.id)).toBeDefined();
      expect(testDb.prepare('SELECT id FROM places WHERE id = ?').get(hotel.id)).toBeDefined();
    } finally {
      testDb.exec('DROP TRIGGER boom');
    }
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

    const { deleted } = await svc.removeMany(String(trip.id), [a.id, b.id, foreign.id, 99999]);

    expect(deleted.sort()).toEqual([a.id, b.id].sort());
    expect(await svc.get(String(other.id), String(foreign.id))).not.toBeNull();
  });

  it('PLACE-SVC-057b — a place delete reports the booking and expense its cancelled night took down', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id) as any;
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel Adlon' }) as any;
    // Booked through the accommodations domain, so it gets its partner hotel
    // reservation the way the booking form writes one.
    const { accommodation } = (await accommodations.createAccommodation(trip.id, {
      place_id: hotel.id, start_day_id: day.id, end_day_id: day.id,
    })) as { accommodation: { id: number } };
    const reservation = testDb.prepare('SELECT id FROM reservations WHERE accommodation_id = ?').get(accommodation.id) as { id: number };
    // An expense hung off the reservation rather than the place: linkedExpenseIds
    // selects on budget_items.place_id and never finds this one.
    const itemId = Number(testDb.prepare(
      "INSERT INTO budget_items (trip_id, name, total_price, reservation_id) VALUES (?, 'Hotel stay', 240, ?)"
    ).run(trip.id, reservation.id).lastInsertRowid);

    const { deleted, cancelled } = await svc.remove(String(trip.id), String(hotel.id));

    expect(deleted).toBe(true);
    expect(cancelled.reservationIds).toEqual([reservation.id]);
    expect(cancelled.budgetItemIds).toEqual([itemId]);
    expect(testDb.prepare('SELECT id FROM budget_items WHERE id = ?').get(itemId)).toBeUndefined();
  });

  it('PLACE-SVC-057 — returns [] for an empty id list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect((await svc.removeMany(String(trip.id), [])).deleted).toEqual([]);
  });
});

// ── importGpx ─────────────────────────────────────────────────────────────────

describe('importGpx', () => {
  it('PLACE-SVC-020 — returns null when buffer has no <gpx> root', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = await svc.importGpx(String(trip.id), Buffer.from('<not-gpx/>'));
    expect(result).toBeNull();
  });

  it('PLACE-SVC-021 — imports <wpt> waypoints as places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <wpt lat="48.8566" lon="2.3522"><name>Paris</name></wpt>
      <wpt lat="51.5074" lon="-0.1278"><name>London</name></wpt>
    </gpx>`);
    const result = await svc.importGpx(String(trip.id), gpx) as any;
    expect(result.places).toHaveLength(2);
    expect(result.places[0].name).toBe('Paris');
    expect(result.places[1].name).toBe('London');
  });

  // Task 5 review M2: the four importers' hand-written 25-field `insertPlace`
  // partials had no test at the service level — only repository-level tests
  // that already seed `duration_minutes: 60`/`transport_mode: 'walking'` in
  // their own fixture, so they test `insertPlace` in general, not what THIS
  // service actually passes it. Mutants that survived every suite until this
  // test: GPX `transport_mode → 'driving'`, `duration_minutes: 30`.
  it('PLACE-SVC-021b (M2) — the full stored row matches the legacy 7-column GPX shape, every other column null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <wpt lat="48.8566" lon="2.3522"><name>Paris</name></wpt>
    </gpx>`);
    const result = await svc.importGpx(String(trip.id), gpx) as { places: { id: number }[] };
    const row = testDb.prepare('SELECT * FROM places WHERE id = ?').get(result.places[0].id) as Record<string, unknown>;
    expect(row).toMatchObject({
      trip_id: trip.id, name: 'Paris', description: null, lat: 48.8566, lng: 2.3522,
      address: null, category_id: null, price: null, currency: null, place_time: null, end_time: null,
      duration_minutes: 60, notes: null, image_url: null, google_place_id: null, google_ftid: null,
      osm_id: null, amap_poi_id: null, website: null, phone: null, transport_mode: 'walking',
      route_geometry: null, route_color: null, stop_type: null, fill_percent: null,
    });
  });

  it('PLACE-SVC-021c (L2) — an import is atomic: a failure partway through the loop leaves nothing stored', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const placesRepo = await createTestPlacesRepo(testDb);
    const realInsertPlace = placesRepo.insertPlace.bind(placesRepo);
    let calls = 0;
    const insertSpy = vi.spyOn(placesRepo, 'insertPlace').mockImplementation(async (input) => {
      calls++;
      if (calls === 2) throw new Error('boom');
      return realInsertPlace(input);
    });
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <wpt lat="48.8566" lon="2.3522"><name>Paris</name></wpt>
      <wpt lat="51.5074" lon="-0.1278"><name>London</name></wpt>
    </gpx>`);
    await expect(svc.importGpx(String(trip.id), gpx)).rejects.toThrow('boom');
    const count = testDb.prepare('SELECT COUNT(*) AS n FROM places WHERE trip_id = ?').get(trip.id) as { n: number };
    expect(count.n).toBe(0);
    insertSpy.mockRestore();
  });

  it('PLACE-SVC-022 — imports <rte> as a single polyline-place with routeGeometry', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <rte>
        <name>My Route</name>
        <rtept lat="48.8566" lon="2.3522"><name>Start</name></rtept>
        <rtept lat="51.5074" lon="-0.1278"><name>End</name></rtept>
      </rte>
    </gpx>`);
    const result = await svc.importGpx(String(trip.id), gpx) as any;
    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe('My Route');
    expect(result.places[0].lat).toBe(48.8566);
    expect(result.places[0].lng).toBe(2.3522);
    expect(result.places[0].route_geometry).toBeTruthy();
    const coords = JSON.parse(result.places[0].route_geometry);
    expect(coords).toHaveLength(2);
  });

  it('PLACE-SVC-023 — imports <trk> track as a single place with routeGeometry', async () => {
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
    const result = await svc.importGpx(String(trip.id), gpx) as any;
    expect(result.places).toHaveLength(1);
    expect(result.places[0].name).toBe('My Track');
    const geometry = JSON.parse(result.places[0].route_geometry);
    expect(Array.isArray(geometry)).toBe(true);
    expect(geometry).toHaveLength(2);
  });

  it('PLACE-SVC-024 — <wpt> and <trk> together: waypoints plus track appended', async () => {
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
    const result = await svc.importGpx(String(trip.id), gpx) as any;
    // 1 wpt + 1 trk
    expect(result.places).toHaveLength(2);
    const trackPlace = result.places.find((p: any) => p.name === 'Track') as any;
    expect(trackPlace).toBeDefined();
    const geometry = JSON.parse(trackPlace.route_geometry);
    expect(geometry).toHaveLength(2);
  });

  it('PLACE-SVC-025 — returns null when GPX has no usable elements', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1"></gpx>`);
    const result = await svc.importGpx(String(trip.id), gpx);
    expect(result).toBeNull();
  });

  it('PLACE-SVC-037 — multiple unnamed tracks in one file get distinct names instead of collapsing to one', async () => {
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
    const result = await svc.importGpx(String(trip.id), gpx) as any;
    expect(result.places).toHaveLength(2);
    const names = result.places.map((p: any) => p.name);
    expect(new Set(names).size).toBe(2);
  });

  it('PLACE-SVC-038 — unnamed tracks fall back to the source filename', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const gpx = Buffer.from(`<?xml version="1.0"?><gpx version="1.1">
      <trk><trkseg>
        <trkpt lat="48.8566" lon="2.3522"></trkpt>
        <trkpt lat="48.8570" lon="2.3530"></trkpt>
      </trkseg></trk>
    </gpx>`);
    const result = await svc.importGpx(String(trip.id), gpx, { defaultName: 'morning-hike.gpx' }) as any;
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

  // Task 5 review M2/L2. Mutants that survived every suite until these
  // tests: Google `notes → null`, `duration_minutes: 30`, an insert loop
  // outside `uow.transactional`.
  it('PLACE-SVC-028f (M2) — the full stored row matches the legacy 7-column Google shape, notes included, every other column null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const listPayload = [
      [null, null, null, null, 'My Test List', null, null, null, [
        [null, [null, null, null, null, null, [null, null, 51.5074, -0.1278]], 'London', 'Great city'],
      ]],
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'prefix\n' + JSON.stringify(listPayload) }));
    const result = await svc.importGoogleList(String(trip.id), 'https://www.google.com/maps/placelists/list/ABC123DEF456') as { places: { id: number }[] };
    const row = testDb.prepare('SELECT * FROM places WHERE id = ?').get(result.places[0].id) as Record<string, unknown>;
    expect(row).toMatchObject({
      trip_id: trip.id, name: 'London', description: null, lat: 51.5074, lng: -0.1278,
      address: null, category_id: null, price: null, currency: null, place_time: null, end_time: null,
      duration_minutes: 60, notes: 'Great city', image_url: null, google_place_id: null,
      osm_id: null, amap_poi_id: null, website: null, phone: null, transport_mode: 'walking',
      route_geometry: null, route_color: null, stop_type: null, fill_percent: null,
    });
  });

  it('PLACE-SVC-028g (L2) — a failure partway through the Google-list loop leaves nothing stored', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const listPayload = [
      [null, null, null, null, 'My Test List', null, null, null, [
        [null, [null, null, null, null, null, [null, null, 48.8566, 2.3522]], 'Paris', null],
        [null, [null, null, null, null, null, [null, null, 51.5074, -0.1278]], 'London', 'Great city'],
      ]],
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, text: async () => 'prefix\n' + JSON.stringify(listPayload) }));
    const placesRepo = await createTestPlacesRepo(testDb);
    const realInsertPlace = placesRepo.insertPlace.bind(placesRepo);
    let calls = 0;
    const insertSpy = vi.spyOn(placesRepo, 'insertPlace').mockImplementation(async (input) => {
      calls++;
      if (calls === 2) throw new Error('boom');
      return realInsertPlace(input);
    });
    await expect(svc.importGoogleList(String(trip.id), 'https://www.google.com/maps/placelists/list/ABC123DEF456')).rejects.toThrow('boom');
    const count = testDb.prepare('SELECT COUNT(*) AS n FROM places WHERE trip_id = ?').get(trip.id) as { n: number };
    expect(count.n).toBe(0);
    insertSpy.mockRestore();
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

  it('PLACE-SVC-030b (H1) — a non-canonical id ("<id> ") also 404s', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const result: Awaited<ReturnType<PlacesService['searchImage']>> = await svc.searchImage(String(trip.id), `${place.id} `, user.id);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toBeDefined();
      expect(result.status).toBe(404);
    }
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
  it('PLACE-SVC-033 — skips waypoints already in trip by name', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const buf = fs.readFileSync(GPX_FIXTURE);

    // First import
    const first = await svc.importGpx(String(trip.id), buf) as any;
    expect(first.count).toBeGreaterThan(0);

    // Second import — all names already present, nothing new created
    const second = await svc.importGpx(String(trip.id), buf) as any;
    expect(second.count).toBe(0);
    expect(second.skipped).toBe(first.count);

    // Total places in DB should equal first import count
    const total = ((await svc.list(String(trip.id), {})) as any[]).length;
    expect(total).toBe(first.count);
  });

  it('PLACE-SVC-034 — imports new places while skipping existing ones', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const buf = fs.readFileSync(GPX_FIXTURE);

    const first = await svc.importGpx(String(trip.id), buf) as any;
    // Manually add a brand-new place so total > first.count
    createPlace(testDb, trip.id, { name: 'Unique Extra Place', lat: 99, lng: 99 });

    // Re-import: the fixture places are skipped, the extra place remains untouched
    const second = await svc.importGpx(String(trip.id), buf) as any;
    expect(second.count).toBe(0);

    const total = ((await svc.list(String(trip.id), {})) as any[]).length;
    expect(total).toBe(first.count + 1);
  });
});

describe('importKmlPlaces deduplication', () => {
  it('PLACE-SVC-035 — skips placemarks already in trip by name', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const buf = fs.readFileSync(KML_FIXTURE);

    const first = await svc.importKmlPlaces(String(trip.id), buf);
    expect(first.count).toBeGreaterThan(0);

    const second = await svc.importKmlPlaces(String(trip.id), buf);
    expect(second.count).toBe(0);
    expect(second.summary.skippedCount).toBeGreaterThanOrEqual(first.count);
    expect(second.summary.warnings.some((w: string) => w.includes('skipped'))).toBe(true);
  });

  it('PLACE-SVC-036 — deduplicates within the same file (intra-batch)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Craft a KML with two placemarks sharing the same name
    const kml = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Placemark><name>Dupe Place</name><Point><coordinates>2.0,48.0,0</coordinates></Point></Placemark>
  <Placemark><name>Dupe Place</name><Point><coordinates>2.1,48.1,0</coordinates></Point></Placemark>
</Document></kml>`);

    const result = await svc.importKmlPlaces(String(trip.id), kml);
    expect(result.count).toBe(1);
    expect(result.summary.skippedCount).toBe(1);
  });
});

// Task 5 review M2/L2 — the same full-stored-row/atomicity gap for KML.
// Mutants that survived every suite until these tests: KML `route_geometry
// → null`, `duration_minutes: 30`, the GPX loop's `uow.transactional`
// removal class repeated here for KML's own loop.
describe('importKmlPlaces — full stored row and atomicity (M2/L2)', () => {
  it('PLACE-SVC-036b (M2) — a LineString placemark stores route_geometry, duration_minutes: 60 and transport_mode: walking', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const kml = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Placemark><name>Ridge Path</name><LineString><coordinates>2.0,48.0,0 2.1,48.1,0</coordinates></LineString></Placemark>
</Document></kml>`);
    const result = await svc.importKmlPlaces(String(trip.id), kml);
    expect(result.count).toBe(1);
    const row = testDb.prepare('SELECT * FROM places WHERE trip_id = ? AND name = ?').get(trip.id, 'Ridge Path') as Record<string, unknown>;
    expect(row.route_geometry).toBeTruthy();
    expect(JSON.parse(row.route_geometry as string)).toHaveLength(2);
    expect(row.duration_minutes).toBe(60);
    expect(row.transport_mode).toBe('walking');
    expect(row.category_id).toBeNull();
  });

  it('PLACE-SVC-036c (L2) — a failure partway through the KML loop leaves nothing stored', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const placesRepo = await createTestPlacesRepo(testDb);
    const realInsertPlace = placesRepo.insertPlace.bind(placesRepo);
    let calls = 0;
    const insertSpy = vi.spyOn(placesRepo, 'insertPlace').mockImplementation(async (input) => {
      calls++;
      if (calls === 2) throw new Error('boom');
      return realInsertPlace(input);
    });
    const kml = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2"><Document>
  <Placemark><name>A</name><Point><coordinates>2.0,48.0,0</coordinates></Point></Placemark>
  <Placemark><name>B</name><Point><coordinates>2.1,48.1,0</coordinates></Point></Placemark>
</Document></kml>`);
    await expect(svc.importKmlPlaces(String(trip.id), kml)).rejects.toThrow('boom');
    const count = testDb.prepare('SELECT COUNT(*) AS n FROM places WHERE trip_id = ?').get(trip.id) as { n: number };
    expect(count.n).toBe(0);
    insertSpy.mockRestore();
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
  it('PLACE-SVC-050 — rate stores one vote per user, replaces on re-vote, clears with null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Rated' }) as { id: number };

    await svc.rate(String(trip.id), String(place.id), user.id, 5);
    let rows = testDb.prepare('SELECT rating FROM place_ratings WHERE place_id = ? AND user_id = ?').all(place.id, user.id) as { rating: number }[];
    expect(rows).toEqual([{ rating: 5 }]);

    await svc.rate(String(trip.id), String(place.id), user.id, 2); // re-vote replaces via the UNIQUE upsert
    rows = testDb.prepare('SELECT rating FROM place_ratings WHERE place_id = ? AND user_id = ?').all(place.id, user.id) as { rating: number }[];
    expect(rows).toEqual([{ rating: 2 }]);

    await svc.rate(String(trip.id), String(place.id), user.id, null); // clear
    const count = testDb.prepare('SELECT COUNT(*) AS n FROM place_ratings WHERE place_id = ?').get(place.id) as { n: number };
    expect(count.n).toBe(0);
  });

  it('PLACE-SVC-051 — rate returns null and writes nothing when the place is not in the trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const place = createPlace(testDb, otherTrip.id, { name: 'Elsewhere' }) as { id: number };

    expect(await svc.rate(String(trip.id), String(place.id), user.id, 4)).toBeNull();
    const count = testDb.prepare('SELECT COUNT(*) AS n FROM place_ratings WHERE place_id = ?').get(place.id) as { n: number };
    expect(count.n).toBe(0);
  });

  it('PLACE-SVC-051b (H1) — a non-canonical id ("<id> ") is null and writes nothing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id) as { id: number };
    expect(await svc.rate(String(trip.id), `${place.id} `, user.id, 4)).toBeNull();
    const count = testDb.prepare('SELECT COUNT(*) AS n FROM place_ratings WHERE place_id = ?').get(place.id) as { n: number };
    expect(count.n).toBe(0);
  });

  // PL51's ruling: an ON CONFLICT DO UPDATE limited to `rating` must never
  // touch `places.updated_at` — a vote must not 409 another member's
  // offline edit (#1435). Proven directly against the column, not just
  // against the response shape.
  it('PLACE-SVC-051c (PL51) — rating a place never bumps places.updated_at', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Silent Vote' }) as { id: number };
    // Task 4 review M2: a freshly-created row's `updated_at` can share the
    // same one-second `datetime('now')` bucket as a bump this test means to
    // catch, so `before === after` proved nothing either way (M1 — `upsertRating`
    // also bumping `places.updated_at` — survived this test as written). Seed a
    // visibly stale timestamp first so any bump is unmistakably a different value.
    testDb.prepare("UPDATE places SET updated_at = datetime('now', '-1 hour') WHERE id = ?").run(place.id);
    const before = (testDb.prepare('SELECT updated_at FROM places WHERE id = ?').get(place.id) as { updated_at: string | null }).updated_at;

    await svc.rate(String(trip.id), String(place.id), user.id, 5);
    // Re-vote (the ON CONFLICT DO UPDATE path) — the one statement in the
    // whole cluster that could plausibly touch `updated_at` via a careless
    // merge-field list.
    await svc.rate(String(trip.id), String(place.id), user.id, 2);
    const after = (testDb.prepare('SELECT updated_at FROM places WHERE id = ?').get(place.id) as { updated_at: string | null }).updated_at;
    expect(after).toBe(before);
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

async function importFixture(tripId: number) {
  return await svc.importGpx(String(tripId), Buffer.from(GPX_WITH_TRACKS), {
    importWaypoints: true, importRoutes: true, importTracks: true,
  });
}

function tracksOf(tripId: number) {
  return testDb.prepare('SELECT id, route_color FROM places WHERE trip_id = ? AND route_geometry IS NOT NULL ORDER BY id')
    .all(tripId) as { id: number; route_color: string | null }[];
}

describe('PlacesService — automatic track colours (#776)', () => {
  it('PLACES-SVC-001 — every imported track gets a colour from the shared palette', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await importFixture(trip.id);

    const tracks = tracksOf(trip.id);
    expect(tracks.length).toBeGreaterThan(0);
    for (const track of tracks) {
      expect(TRACK_COLORS).toContain(track.route_color);
    }
  });

  it('PLACES-SVC-002 — the returned places carry the colour, not just the DB rows', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const result = await importFixture(trip.id) as { places: any[] } | null;

    const returnedTracks = (result?.places ?? []).filter(p => p.route_geometry);
    expect(returnedTracks.length).toBeGreaterThan(0);
    for (const track of returnedTracks) {
      expect(TRACK_COLORS).toContain(track.route_color);
    }
  });

  it('PLACES-SVC-003 — plain waypoints keep no colour at all', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await importFixture(trip.id);

    const waypoints = testDb.prepare(
      'SELECT route_color FROM places WHERE trip_id = ? AND route_geometry IS NULL',
    ).all(trip.id) as { route_color: string | null }[];
    for (const wp of waypoints) {
      expect(wp.route_color).toBeNull();
    }
  });

  it('PLACES-SVC-004 — a second import continues the palette instead of repeating it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await importFixture(trip.id);
    const first = tracksOf(trip.id).map(t => t.route_color);

    // Same fixture again: dedup skips the identical rows, so seed a distinct
    // track directly and let the service colour the next import round.
    testDb.prepare(
      "INSERT INTO places (trip_id, name, lat, lng, route_geometry) VALUES (?, 'Second walk', 1, 1, '[[1,1],[2,2]]')",
    ).run(trip.id);
    const seeded = testDb.prepare('SELECT id FROM places WHERE name = ?').get('Second walk') as { id: number };
    await (svc as any).colorizeImportedTracks(String(trip.id), {
      places: [{ id: seeded.id, route_geometry: '[[1,1],[2,2]]', route_color: null }],
    });

    const seededColor = (testDb.prepare('SELECT route_color FROM places WHERE id = ?').get(seeded.id) as any).route_color;
    expect(TRACK_COLORS).toContain(seededColor);
    expect(first).not.toContain(seededColor);
  });

  it('PLACES-SVC-006 — a colour already in use by hand is not handed out again', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // Someone recoloured an existing track to the palette's second entry. A
    // plain row count would hand exactly that colour to the next import.
    testDb.prepare(
      "INSERT INTO places (trip_id, name, lat, lng, route_geometry, route_color) VALUES (?, 'Old walk', 1, 1, '[[1,1],[2,2]]', ?)",
    ).run(trip.id, TRACK_COLORS[1]);

    await importFixture(trip.id);

    const colors = tracksOf(trip.id).map(t => t.route_color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('PLACES-SVC-007 — gaps left by deleted tracks are reused, not skipped past', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await importFixture(trip.id);
    // Drop the first track; its colour becomes free again.
    const first = tracksOf(trip.id)[0];
    testDb.prepare('DELETE FROM places WHERE id = ?').run(first.id);

    const seeded = testDb.prepare(
      "INSERT INTO places (trip_id, name, lat, lng, route_geometry) VALUES (?, 'Later walk', 9, 9, '[[9,9],[8,8]]') RETURNING id",
    ).get(trip.id) as { id: number };
    await (svc as any).colorizeImportedTracks(String(trip.id), {
      places: [{ id: seeded.id, route_geometry: '[[9,9],[8,8]]', route_color: null }],
    });

    const colors = tracksOf(trip.id).map(t => t.route_color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('PLACES-SVC-005 — an import that yields nothing colours nothing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);

    await expect((svc as any).colorizeImportedTracks(String(trip.id), null)).resolves.toBeUndefined();
    await expect((svc as any).colorizeImportedTracks(String(trip.id), { places: [] })).resolves.toBeUndefined();

    expect(tracksOf(trip.id)).toEqual([]);
  });

  // Task 5 review M1: `PLACEREPO-039` proves the driver's single-connection
  // serialisation for `t.em.transactional`, not that `colorizeImportedTracks`
  // actually wraps its read+write in one transaction — removing
  // `this.uow.transactional` from the service survived every suite until
  // this test. Numbered 018 (not the review's suggested 008) to avoid
  // colliding with the pre-existing PLACES-SVC-008 in the
  // `findMatchingPlaceId` describe block below.
  it('PLACES-SVC-018 (M1) — two concurrent colourings of the same trip never share a colour', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const ids = [1, 2].map((n) => (testDb.prepare(
      "INSERT INTO places (trip_id, name, lat, lng, route_geometry) VALUES (?, ?, 1, 1, '[[1,1],[2,2]]') RETURNING id",
    ).get(trip.id, 'cc' + n) as { id: number }).id);
    await Promise.all(ids.map((id) => (svc as unknown as { colorizeImportedTracks: (tripId: string, result: { places: { id: number; route_geometry: string; route_color: string | null }[] }) => Promise<void> }).colorizeImportedTracks(String(trip.id), {
      places: [{ id, route_geometry: '[[1,1],[2,2]]', route_color: null }],
    })));
    expect(new Set(tracksOf(trip.id).map(t => t.route_color)).size).toBe(2);
  });

  // Task 5 review L1: the palette-wrap arm (`TRACK_COLORS[(i - free.length) %
  // len]`) had no test — a mutation collapsing every wrapped index to
  // `TRACK_COLORS[0]` survived every suite until this test.
  it('PLACES-SVC-019 (L1) — more tracks than free colours wrap from the palette start', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const places = Array.from({ length: TRACK_COLORS.length + 2 }, (_, i) => ({
      id: (testDb.prepare(
        "INSERT INTO places (trip_id, name, lat, lng, route_geometry) VALUES (?, ?, 1, 1, '[[1,1],[2,2]]') RETURNING id",
      ).get(trip.id, 'w' + i) as { id: number }).id,
      route_geometry: '[[1,1],[2,2]]',
      route_color: null as string | null,
    }));
    await (svc as unknown as { colorizeImportedTracks: (tripId: string, result: { places: typeof places }) => Promise<void> }).colorizeImportedTracks(String(trip.id), { places });
    const stored = tracksOf(trip.id).map(t => t.route_color);
    expect(stored).toEqual([...TRACK_COLORS, TRACK_COLORS[0], TRACK_COLORS[1]]);
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
    const svcNoKey = await enrichSvc({ getMapsKey: vi.fn(() => null), searchPlaces });
    await svcNoKey.enrichImportedPlaces('1', 1, [{ id: 1, name: 'A', lat: 1, lng: 2 }]);
    expect(searchPlaces).not.toHaveBeenCalled();
  });

  it('PLACE-SVC-058b — a file import enriches its points, never its paths (#2536)', async () => {
    const service = await enrichSvc({ getMapsKey: vi.fn(() => null) });
    const spy = vi.spyOn(service, 'enrichImportedPlaces').mockResolvedValue();
    service.enrichImportedFilePlaces('1', 1, [{ id: 1 }, { id: 2, route_geometry: '[[1,2],[3,4]]' }]);
    expect(spy).toHaveBeenCalledWith('1', 1, [{ id: 1 }]);
  });

  it('PLACE-SVC-059 — no-ops for an empty batch without touching the provider', async () => {
    const getMapsKey = vi.fn(() => Promise.resolve('key'));
    await (await enrichSvc({ getMapsKey })).enrichImportedPlaces('1', 1, []);
    expect(getMapsKey).not.toHaveBeenCalled();
  });

  it('PLACE-SVC-060 — fills only the empty columns and persists the resolved ids', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 }) as any;
    // An address the import already captured must survive the COALESCE.
    testDb.prepare('UPDATE places SET address = ? WHERE id = ?').run('Imported address', place.id);

    const svcWithMaps = await enrichSvc({
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

  it('PLACE-SVC-060b (PL45) — broadcasts place:updated with socketId: undefined, no exclusion (the importer\'s own client gets the late update)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 });
    const broadcastSpy = vi.spyOn(RealtimeService.prototype, 'broadcast');

    const svcWithMaps = await enrichSvc({
      getMapsKey: vi.fn(() => 'key'),
      searchPlaces: vi.fn(async () => ({ source: 'google', places: [{ google_place_id: 'ChIJ1', lat: 48.85, lng: 2.35 }] })),
      getPlacePhoto: vi.fn(async () => ({ photoUrl: null, attribution: null })),
    } as never);

    await svcWithMaps.enrichImportedPlaces(String(trip.id), user.id, [{ id: place.id, name: 'Bar', lat: 48.85, lng: 2.35 }]);

    expect(broadcastSpy).toHaveBeenCalledTimes(1);
    const [tripArg, event, payload, socketId] = broadcastSpy.mock.calls[0];
    expect(tripArg).toBe(String(trip.id));
    expect(event).toBe('place:updated');
    // Task 5 review L7: the payload carries the just-written value, not a
    // stale pre-enrichment snapshot (the qb read bypasses the identity map).
    expect((payload as { place: { id: number; google_place_id: string | null } }).place.id).toBe(place.id);
    expect((payload as { place: { google_place_id: string | null } }).place.google_place_id).toBe('ChIJ1');
    expect(socketId).toBeUndefined();
    broadcastSpy.mockRestore();
  });

  it('PLACE-SVC-061 — leaves the place alone when no candidate is close enough', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 }) as any;

    const svcWithMaps = await enrichSvc({
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

    const svcWithMaps = await enrichSvc({
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
    const svcWithMaps = await enrichSvc({
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
    const svcWithMaps = await enrichSvc({ getMapsKey: vi.fn(() => 'key'), searchPlaces } as never);
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
  it('PLACE-SVC-065 — create keeps lat/lng of exactly 0 instead of nulling them', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = await svc.create(String(trip.id), { name: 'Null Island', lat: 0, lng: 0 }) as any;
    expect(place.lat).toBe(0);
    expect(place.lng).toBe(0);
    // A genuinely absent coordinate still lands as NULL.
    const noCoords = await svc.create(String(trip.id), { name: 'Unlocated' }) as any;
    expect(noCoords.lat).toBeNull();
    expect(noCoords.lng).toBeNull();
  });

  it('PLACE-SVC-066 — create keeps duration_minutes and price of 0', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = await svc.create(String(trip.id), { name: 'Drive-by', duration_minutes: 0, price: 0 }) as any;
    expect(place.duration_minutes).toBe(0);
    expect(place.price).toBe(0);
    // The 60-minute default still applies when the field is absent.
    expect((await svc.create(String(trip.id), { name: 'Default' }) as any).duration_minutes).toBe(60);
  });

  it('PLACE-SVC-067 — update can set duration_minutes to 0', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Stop' }) as any;
    testDb.prepare('UPDATE places SET duration_minutes = 90 WHERE id = ?').run(place.id);

    const zeroed = await svc.update(String(trip.id), String(place.id), { duration_minutes: 0 }) as any;
    expect(zeroed.duration_minutes).toBe(0);

    // An omitted duration still leaves the stored value alone.
    const untouched = await svc.update(String(trip.id), String(place.id), { name: 'Stop 2' }) as any;
    expect(untouched.duration_minutes).toBe(0);
  });

  it('PLACE-SVC-067b — an explicit null clears the planned stay length', async () => {
    // What the write contract and the MCP tool both advertise. Behind COALESCE,
    // null and absent were the same thing, so the field promised a reset it never
    // performed and the day plan kept budgeting the old ninety minutes.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Stop' }) as any;
    testDb.prepare('UPDATE places SET duration_minutes = 90 WHERE id = ?').run(place.id);

    const cleared = await svc.update(String(trip.id), String(place.id), { duration_minutes: null }) as any;
    expect(cleared.duration_minutes).toBeNull();
  });
});

// ── LIKE metacharacter escaping (#1745) ───────────────────────────────────────

describe('setImageFromFile (#1242)', () => {
  const attach = (tripId: number, name: string, mime: string, size = 3) => {
    fs.writeFileSync(path.join(placesStorageFx.root, name), 'img');
    return Number(testDb.prepare('INSERT INTO trip_files (trip_id, filename, original_name, file_size, mime_type) VALUES (?, ?, ?, ?, ?)').run(tripId, name, name, size, mime).lastInsertRowid);
  };

  it('PLACE-SVC-IMGFILE-001 — copies an attached picture in as the place image', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const fileId = attach(trip.id, 'holiday.jpg', 'image/jpeg');
    const updated = await svc.setImageFromFile(String(trip.id), String(place.id), fileId) as any;
    expect(updated.image_url).toMatch(/^\/uploads\/places\/[0-9a-f-]+\.jpg$/);
    expect(fs.existsSync(path.join(placesStorageFx.root, path.basename(updated.image_url)))).toBe(true);
    // A copy: the attachment itself is still there.
    expect(fs.existsSync(path.join(placesStorageFx.root, 'holiday.jpg'))).toBe(true);
  });

  it('PLACE-SVC-IMGFILE-002 — refuses a file of another trip, a document and an oversized image', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    expect(await svc.setImageFromFile(String(trip.id), String(place.id), attach(other.id, 'x.jpg', 'image/jpeg'))).toBe('not_found');
    expect(await svc.setImageFromFile(String(trip.id), String(place.id), attach(trip.id, 'ticket.pdf', 'application/pdf'))).toBe('not_image');
    expect(await svc.setImageFromFile(String(trip.id), String(place.id), attach(trip.id, 'vector.svg', 'image/svg+xml'))).toBe('not_image');
    expect(await svc.setImageFromFile(String(trip.id), String(place.id), attach(trip.id, 'huge.jpg', 'image/jpeg', 50 * 1024 * 1024))).toBe('too_large');
  });
});

describe('list search escaping', () => {
  it('PLACE-SVC-068 — a % or _ in the search term matches literally, not as a wildcard', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: '50% off shop' });
    createPlace(testDb, trip.id, { name: 'Bar' });
    createPlace(testDb, trip.id, { name: 'a_b cafe' });
    createPlace(testDb, trip.id, { name: 'axb cafe' });

    // '%' used to match every row.
    expect(((await svc.list(String(trip.id), { search: '%' })) as any[]).map(p => p.name)).toEqual(['50% off shop']);
    // '_' used to match any single character.
    expect(((await svc.list(String(trip.id), { search: 'a_b' })) as any[]).map(p => p.name)).toEqual(['a_b cafe']);
  });

  it('PLACE-SVC-069 — ordinary search terms are unaffected', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    createPlace(testDb, trip.id, { name: 'Louvre' });
    expect(((await svc.list(String(trip.id), { search: 'eiff' })) as any[]).map(p => p.name)).toEqual(['Eiffel Tower']);
  });
});

// ── Trip-scoped id filter for the journey delete hook (#1745) ─────────────────

describe('scopedIds', () => {
  it('PLACE-SVC-070 — returns only the ids that belong to the trip, preserving input order', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const a = createPlace(testDb, trip.id, { name: 'A' }) as any;
    const b = createPlace(testDb, trip.id, { name: 'B' }) as any;
    const foreign = createPlace(testDb, other.id, { name: 'Foreign' }) as any;

    expect(await svc.scopedIds(String(trip.id), [b.id, foreign.id, a.id, 99999])).toEqual([b.id, a.id]);
    expect(await svc.scopedIds(String(trip.id), [])).toEqual([]);
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

  // Task 5 review M2/L2. Mutants that survived every suite until these
  // tests: `duration_minutes: 30` (all four importers), an insert loop
  // outside `uow.transactional`.
  it('PLACE-SVC-077b (M2) — the full stored row matches the legacy 7-column Naver shape, address+notes included, every other column null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        folder: { name: 'Seoul', bookmarkCount: 1 },
        bookmarkList: [{ name: 'Gyeongbokgung', px: 126.977, py: 37.5796, memo: 'A palace', address: 'Sejongno' }],
      }),
    }));
    const result = await svc.importNaverList(String(trip.id), FOLDER_URL) as { places: { id: number }[] };
    const row = testDb.prepare('SELECT * FROM places WHERE id = ?').get(result.places[0].id) as Record<string, unknown>;
    expect(row).toMatchObject({
      trip_id: trip.id, name: 'Gyeongbokgung', description: null, lat: 37.5796, lng: 126.977,
      address: 'Sejongno', category_id: null, price: null, currency: null, place_time: null, end_time: null,
      duration_minutes: 60, notes: 'A palace', image_url: null, google_place_id: null, google_ftid: null,
      osm_id: null, amap_poi_id: null, website: null, phone: null, transport_mode: 'walking',
      route_geometry: null, route_color: null, stop_type: null, fill_percent: null,
    });
  });

  it('PLACE-SVC-077c (L2) — a failure partway through the Naver-list loop leaves nothing stored', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({
        folder: { name: 'Seoul', bookmarkCount: 2 },
        bookmarkList: [
          { name: 'Gyeongbokgung', px: 126.977, py: 37.5796, memo: null, address: 'Sejongno' },
          { name: 'Namsan Tower', px: 126.988, py: 37.5512, memo: null, address: 'Yongsan' },
        ],
      }),
    }));
    const placesRepo = await createTestPlacesRepo(testDb);
    const realInsertPlace = placesRepo.insertPlace.bind(placesRepo);
    let calls = 0;
    const insertSpy = vi.spyOn(placesRepo, 'insertPlace').mockImplementation(async (input) => {
      calls++;
      if (calls === 2) throw new Error('boom');
      return realInsertPlace(input);
    });
    await expect(svc.importNaverList(String(trip.id), FOLDER_URL)).rejects.toThrow('boom');
    const count = testDb.prepare('SELECT COUNT(*) AS n FROM places WHERE trip_id = ?').get(trip.id) as { n: number };
    expect(count.n).toBe(0);
    insertSpy.mockRestore();
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
    await (await backfillSvc(reverseGeocode)).backfillMissingAddresses(String(trip.id), [
      { id: place.id, name: 'Bar', lat: 48.85, lng: 2.35 },
    ]);

    expect(reverseGeocode).toHaveBeenCalledWith('48.85', '2.35', undefined, { lane: 'background', timeoutMs: 10000 });
    const row = testDb.prepare('SELECT address FROM places WHERE id = ?').get(place.id) as { address: string };
    expect(row.address).toBe('1 Rue de Rivoli, Paris');
  });

  it('PLACE-SVC-078b (PL47) — broadcasts place:updated with socketId: undefined, no exclusion', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 });
    const broadcastSpy = vi.spyOn(RealtimeService.prototype, 'broadcast');

    const reverseGeocode = vi.fn(async () => ({ name: null, address: '1 Rue de Rivoli, Paris' }));
    await (await backfillSvc(reverseGeocode)).backfillMissingAddresses(String(trip.id), [
      { id: place.id, name: 'Bar', lat: 48.85, lng: 2.35 },
    ]);

    expect(broadcastSpy).toHaveBeenCalledTimes(1);
    const [tripArg, event, payload, socketId] = broadcastSpy.mock.calls[0];
    expect(tripArg).toBe(String(trip.id));
    expect(event).toBe('place:updated');
    // Task 5 review L7: the payload carries the just-filled address, not a
    // stale pre-backfill snapshot (the qb read bypasses the identity map).
    expect((payload as { place: { id: number; address: string | null } }).place.id).toBe(place.id);
    expect((payload as { place: { address: string | null } }).place.address).toBe('1 Rue de Rivoli, Paris');
    expect(socketId).toBeUndefined();
    broadcastSpy.mockRestore();
  });

  it('PLACE-SVC-079 — never overwrites an address the import or the Google pass already wrote', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Bar', lat: 48.85, lng: 2.35 }) as any;
    testDb.prepare('UPDATE places SET address = ? WHERE id = ?').run('Imported address', place.id);

    const reverseGeocode = vi.fn(async () => ({ name: null, address: 'Nominatim address' }));
    await (await backfillSvc(reverseGeocode)).backfillMissingAddresses(String(trip.id), [
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

    await (await backfillSvc(vi.fn(async () => ({ name: null, address: null })))).backfillMissingAddresses(String(trip.id), [
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
      (await backfillSvc(reverseGeocode as unknown as MapsService['reverseGeocode'])).backfillMissingAddresses(String(trip.id), [
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
    await (await backfillSvc(reverseGeocode as unknown as MapsService['reverseGeocode'])).backfillMissingAddresses('1', batch);
    expect(reverseGeocode).not.toHaveBeenCalled();
  });

  it('PLACE-SVC-083 — a place without coordinates is skipped', async () => {
    const reverseGeocode = vi.fn();
    await (await backfillSvc(reverseGeocode as unknown as MapsService['reverseGeocode'])).backfillMissingAddresses('1', [
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
  it('PLACES-SVC-008 — matches an existing place by name, ignoring case and surrounding space', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Eiffel Tower' });

    expect(await svc.findMatchingPlaceId(String(trip.id), { name: '  eiffel tower ' })).toBe(place.id);
  });

  it('PLACES-SVC-009 — matches on a provider id even after the place was renamed (#1550)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Original Name' });
    testDb.prepare('UPDATE places SET google_place_id = ? WHERE id = ?').run('ChIJ_abc', place.id);

    expect(
      await svc.findMatchingPlaceId(String(trip.id), { name: 'Renamed By User', google_place_id: 'ChIJ_abc' }),
    ).toBe(place.id);
  });

  it('PLACES-SVC-010 — does NOT match a NAMED candidate to a different place at the same coordinates', async () => {
    // The restaurant and the bar in the same building are two places. This is the
    // rule isPlaceDuplicate has always applied; the SQL copy used to disagree.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Ground Floor Diner', lat: 52.52, lng: 13.405 });

    expect(
      await svc.findMatchingPlaceId(String(trip.id), { name: 'Rooftop Bar', lat: 52.52, lng: 13.405 }),
    ).toBeNull();
  });

  it('PLACES-SVC-011 — matches an UNNAMED candidate by coordinates within tolerance', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Anything', lat: 48.85, lng: 2.35 });

    expect(
      await svc.findMatchingPlaceId(String(trip.id), {
        name: null,
        lat: 48.85 + COORD_DEDUP_TOLERANCE / 2,
        lng: 2.35,
      }),
    ).toBe(place.id);
  });

  it('PLACES-SVC-012 — returns null when nothing recognises the candidate', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'Somewhere Else' });

    expect(await svc.findMatchingPlaceId(String(trip.id), { name: 'Unseen Place' })).toBeNull();
    expect(await svc.findMatchingPlaceId(String(trip.id), { name: null, lat: null, lng: null })).toBeNull();
  });

  it('PLACES-SVC-013 — never matches a place belonging to another trip', async () => {
    const { user } = createUser(testDb);
    const mine = createTrip(testDb, user.id);
    const theirs = createTrip(testDb, user.id);
    createPlace(testDb, theirs.id, { name: 'Shared Name' });

    expect(await svc.findMatchingPlaceId(String(mine.id), { name: 'Shared Name' })).toBeNull();
  });

  it('PLACES-SVC-014 — a provider id still wins over a name that points elsewhere', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // The place the user renamed, carrying the id the importer knows it by.
    const renamed = createPlace(testDb, trip.id, { name: 'Dinner Tuesday', lat: 41.88, lng: 12.47 });
    testDb.prepare('UPDATE places SET google_ftid = ? WHERE id = ?').run('0x1:0x2', renamed.id);
    // A different place that happens to carry the name the list still uses.
    createPlace(testDb, trip.id, { name: 'Trattoria da Enzo', lat: 41.9, lng: 12.5 });

    expect(
      await svc.findMatchingPlaceId(String(trip.id), { name: 'Trattoria da Enzo', google_ftid: '0x1:0x2' }),
    ).toBe(renamed.id);
  });

  it('PLACES-SVC-015 — the name comparison is ASCII-only, so an accented capital does not match', async () => {
    // Not a wish, a boundary: `lower(trim(name))` is SQLite's ASCII lowercase,
    // while normalizePlaceName uses JavaScript's Unicode one. isPlaceDuplicate
    // does match this pair in memory. Before the shared strategies, the
    // coordinate fallback covered the gap for a named candidate — sometimes with
    // the wrong row. This pins where the two halves still answer differently.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPlace(testDb, trip.id, { name: 'CAFÉ CENTRAL', lat: 48.85, lng: 2.35 });

    expect(await svc.findMatchingPlaceId(String(trip.id), { name: 'Café Central', lat: 48.85, lng: 2.35 })).toBeNull();
    // The all-ASCII spelling of the same shape does match.
    createPlace(testDb, trip.id, { name: 'CAFE CENTRAL', lat: 48.86, lng: 2.36 });
    expect(await svc.findMatchingPlaceId(String(trip.id), { name: 'Cafe Central' })).not.toBeNull();
  });

  it('PLACES-SVC-016 — an unnamed candidate can match a NAMED row on coordinates', async () => {
    // The other place the two halves differ: buildDedupSet collects coordinates
    // only for unnamed rows, so isPlaceDuplicate would say no here. This is the
    // answer findMatchingPlaceId wants — a booking with no place name should
    // link to the hotel that has one — so it is pinned rather than removed.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel Lutetia', lat: 48.851, lng: 2.326 });

    expect(await svc.findMatchingPlaceId(String(trip.id), { name: null, lat: 48.851, lng: 2.326 })).toBe(hotel.id);
  });

  it('PLACES-SVC-017 — the coordinate tolerance is a box roughly 11 m wide, and it closes', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: null, lat: 48.85, lng: 2.35 });

    // Pinned as a number, not against the constant: every other reference is
    // relative to it, so widening it from 11 m to 111 m would keep them all green.
    expect(COORD_DEDUP_TOLERANCE).toBe(0.0001);

    const inside = { name: null, lat: 48.85 + COORD_DEDUP_TOLERANCE * 0.9, lng: 2.35 };
    const outside = { name: null, lat: 48.85 + COORD_DEDUP_TOLERANCE * 1.5, lng: 2.35 };
    expect(await svc.findMatchingPlaceId(String(trip.id), inside)).toBe(place.id);
    expect(await svc.findMatchingPlaceId(String(trip.id), outside)).toBeNull();
    // Exactly one tolerance away is NOT a match: 48.85 + 0.0001 lands on
    // 48.850100000000004 in binary floating point, a hair over the bound. The
    // edge is fuzzy by design of the arithmetic, so nothing should lean on it.
    const edge = { name: null, lat: 48.85 + COORD_DEDUP_TOLERANCE, lng: 2.35 };
    expect(await svc.findMatchingPlaceId(String(trip.id), edge)).toBeNull();
  });
});
