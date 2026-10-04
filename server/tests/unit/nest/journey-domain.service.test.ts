/**
 * Unit tests for JourneyDomainService (JOURNEY-SVC-001 through JOURNEY-SVC-038).
 * Uses a real in-memory SQLite DB so SQL logic is exercised faithfully.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

// -- DB setup -----------------------------------------------------------------

vi.mock('../../../src/db/database', async () => {

  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  // Plan 3g Task 1 (Part A, R9): `getPlaceWithTags`/`canAccessTrip`/`isOwner`
  // dropped from this mock — none of the three are exports of
  // `src/db/database.ts` any more (it exports only `db`/`closeDb`/
  // `reinitialize`/`getRawConnection`/`registerReinitializeHook`/
  // `runDemoSeed`; the three methods this mock used to shadow moved to real
  // `DatabaseService` class methods, delegating to real repositories, long
  // before this task). They were dead weight even before AP1 converted —
  // nothing in this file ever read them off the mocked module. AP1's own
  // guard now goes through a REAL `TripsRepository.findAccessible` below
  // (`createTestTripsRepo`), not a hand-written closure.
  const mock = { db, closeDb: () => {}, reinitialize: () => {} };
    return mock;
});


vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/websocket', () => ({ broadcastToUser: vi.fn() }));

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import {
  createUser,
  createTrip,
  createJourney,
  createJourneyEntry,
  addJourneyContributor,
  createPlace,
  createDay,
  createDayAssignment,
  addTripPhoto,
} from '../../helpers/factories';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { db as dbConn } from '../../../src/db/database';
import { createTestUnitOfWork, sharedTestOrm, createTestTripsRepo, createTestPlacesRepo } from '../../helpers/test-uow';
import {
  createTestJourneysRepo, createTestJourneyContributorsRepo, createTestJourneyTripsRepo, createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo, createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
// M5d (task-5-review.md) — full-key parity tests for Task 2's read models,
// ported from the reviewer's probe (scratchpad r3g/probe/zz-r3g-parity-probe.test.ts).
import { todayUtc } from '@trek/shared';
import { GALLERY_CHRONOLOGICAL_ORDER } from '../../../src/nest/journey/journey-gallery-order';

let svc: JourneyDomainService;
// Plan 3g Task 1's own additions (below, "repositories (R9's parity + mutation
// proofs)" describe block) reach the repositories directly — held here so
// that block doesn't need its own second construction.
let journeysRepoDirect: Awaited<ReturnType<typeof createTestJourneysRepo>>;
let contributorsRepoDirect: Awaited<ReturnType<typeof createTestJourneyContributorsRepo>>;
let journeyTripsRepoDirect: Awaited<ReturnType<typeof createTestJourneyTripsRepo>>;
let entriesRepoDirect: Awaited<ReturnType<typeof createTestJourneyEntriesRepo>>;
let tripsRepoDirect: Awaited<ReturnType<typeof createTestTripsRepo>>;
// Plan 3g Task 2's own additions — the two repositories Task 1 left as
// empty stubs, plus `PlacesRepository` (JG44's `findRaw`), held here for
// the same reason as the five above.
let photosRepoDirect: Awaited<ReturnType<typeof createTestJourneyPhotosRepo>>;
let entryPhotosRepoDirect: Awaited<ReturnType<typeof createTestJourneyEntryPhotosRepo>>;
let placesRepoDirect: Awaited<ReturnType<typeof createTestPlacesRepo>>;

// Plan 3g Task 1 (Part A, R9's construction/wrapping pattern): the SAME
// direct-construction shape every converted service in this program uses for
// its own hand-built unit test (`atlas.service.test.ts`/`vacay.service.test.ts`
// precedent) — real repositories resolved off `sharedTestOrm(testDb)`
// (`allowGlobalContext: true` by default, `test-orm.ts`'s own docstring), no
// `withRequestContext` wrapper needed or added. `db` (the raw `DatabaseService`)
// stays a constructor param and is still exercised directly: Part B's methods
// (journey stats, entries CRUD, the photos surface, contributors CRUD,
// suggestions — Task 2's own, unconverted by this task) still issue raw
// `this.db.prepare(...)` calls the ~40 `describe` blocks below covering them
// exercise unchanged. Every test in this file calls `svc.<method>()` directly
// with no wrapper — this single `beforeAll` construction is the whole of
// R9's "fix the constructor call for the entire file in one pass" edit; nothing
// below this block changes.
beforeAll(async () => {
  const t = await sharedTestOrm(testDb);
  journeysRepoDirect = await createTestJourneysRepo(testDb);
  contributorsRepoDirect = await createTestJourneyContributorsRepo(testDb);
  journeyTripsRepoDirect = await createTestJourneyTripsRepo(testDb);
  entriesRepoDirect = await createTestJourneyEntriesRepo(testDb);
  tripsRepoDirect = await createTestTripsRepo(testDb);
  photosRepoDirect = await createTestJourneyPhotosRepo(testDb);
  entryPhotosRepoDirect = await createTestJourneyEntryPhotosRepo(testDb);
  placesRepoDirect = await createTestPlacesRepo(testDb);
  svc = new JourneyDomainService(
    new RealtimeService(), new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), photosRepoDirect), await createTestUnitOfWork(testDb),
    journeysRepoDirect, contributorsRepoDirect, journeyTripsRepoDirect, entriesRepoDirect, tripsRepoDirect,
    // Plan 3g Task 2's own append to this SAME construction call — the two
    // repositories this task builds, plus `PlacesRepository` (JG44) — per
    // R9, Task 2 only appends to what Task 1's construction already
    // established, never re-touches the wrapping mechanism itself.
    photosRepoDirect, entryPhotosRepoDirect, placesRepoDirect,
  );
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

// -- Access control -----------------------------------------------------------

describe('canAccessJourney', () => {
  it('JOURNEY-SVC-001: returns journey for owner', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'My Journey' });

    const result = await svc.canAccessJourney(journey.id, user.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(journey.id);
    expect(result!.title).toBe('My Journey');
  });

  it('JOURNEY-SVC-002: returns journey for contributor', async () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, contrib.id, 'editor');

    const result = await svc.canAccessJourney(journey.id, contrib.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(journey.id);
  });

  it('JOURNEY-SVC-003: returns null for stranger', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const result = await svc.canAccessJourney(journey.id, stranger.id);

    expect(result).toBeNull();
  });
});

describe('isOwner', () => {
  it('JOURNEY-SVC-004: returns true for owner', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    expect(await svc.isOwner(journey.id, user.id)).toBe(true);
  });

  it('JOURNEY-SVC-005: returns false for contributor', async () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, contrib.id, 'editor');

    expect(await svc.isOwner(journey.id, contrib.id)).toBe(false);
  });

  it('JOURNEY-SVC-006: returns false for stranger', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    expect(await svc.isOwner(journey.id, stranger.id)).toBe(false);
  });
});

describe('canEdit', () => {
  it('JOURNEY-SVC-007: owner can edit', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    expect(await svc.canEdit(journey.id, user.id)).toBe(true);
  });

  it('JOURNEY-SVC-008: editor contributor can edit', async () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    expect(await svc.canEdit(journey.id, editor.id)).toBe(true);
  });

  it('JOURNEY-SVC-009: viewer contributor cannot edit', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');

    expect(await svc.canEdit(journey.id, viewer.id)).toBe(false);
  });

  it('JOURNEY-SVC-010: stranger cannot edit', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    expect(await svc.canEdit(journey.id, stranger.id)).toBe(false);
  });
});

// -- Journey CRUD -------------------------------------------------------------

describe('listJourneys', () => {
  it('JOURNEY-SVC-011: returns owned journeys with counts', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Road Trip' });
    createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01', location_name: 'Paris' });
    createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-02', location_name: 'Lyon' });

    const result = await svc.listJourneys(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Road Trip');
    expect(result[0].entry_count).toBe(2);
    expect(result[0].place_count).toBe(2);
  });

  it('JOURNEY-SVC-012: includes journeys where user is contributor', async () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id, { title: 'Shared Trip' });
    addJourneyContributor(testDb, journey.id, contrib.id, 'editor');

    const result = await svc.listJourneys(contrib.id);

    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Shared Trip');
  });

  it('JOURNEY-SVC-013: does not include other users journeys', async () => {
    const { user: owner } = createUser(testDb);
    const { user: other } = createUser(testDb);
    createJourney(testDb, owner.id, { title: 'Private' });

    const result = await svc.listJourneys(other.id);

    expect(result).toHaveLength(0);
  });

  it('JOURNEY-SVC-013b: returns trip_date_min/max aggregated from linked trips', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Multi Trip' });
    const trip1 = createTrip(testDb, user.id, { title: 'Trip A', start_date: '2025-06-01', end_date: '2025-06-10' });
    const trip2 = createTrip(testDb, user.id, { title: 'Trip B', start_date: '2026-03-15', end_date: '2026-03-20' });
    await svc.addTripToJourney(journey.id, trip1.id, user.id);
    await svc.addTripToJourney(journey.id, trip2.id, user.id);

    const result = await svc.listJourneys(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].trip_date_min).toBe('2025-06-01');
    expect(result[0].trip_date_max).toBe('2026-03-20');
  });
});

describe('createJourney (service)', () => {
  it('JOURNEY-SVC-014: creates journey with contributor record', async () => {
    const { user } = createUser(testDb);

    const journey = await svc.createJourney(user.id, { title: 'New Journey', subtitle: 'Subtitle' });

    expect(journey.title).toBe('New Journey');
    expect(journey.subtitle).toBe('Subtitle');
    expect(journey.user_id).toBe(user.id);
    expect(journey.status).toBe('active');

    // owner should be added as contributor
    const contrib = testDb.prepare(
      'SELECT * FROM journey_contributors WHERE journey_id = ? AND user_id = ?'
    ).get(journey.id, user.id) as { role: string } | undefined;
    expect(contrib).toBeDefined();
    expect(contrib!.role).toBe('owner');
  });

  it('JOURNEY-SVC-015: links trips when trip_ids provided', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris 2026' });

    const journey = await svc.createJourney(user.id, { title: 'Euro Trip', trip_ids: [trip.id] });

    const link = testDb.prepare(
      'SELECT * FROM journey_trips WHERE journey_id = ? AND trip_id = ?'
    ).get(journey.id, trip.id);
    expect(link).toBeDefined();
  });
});

describe('getJourneyFull', () => {
  it('JOURNEY-SVC-016: returns full journey with entries, trips, contributors', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Full Journey' });
    createJourneyEntry(testDb, journey.id, user.id, {
      title: 'Day 1',
      entry_date: '2026-03-01',
      story: 'Arrived!',
    });

    const result = await svc.getJourneyFull(journey.id, user.id);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Full Journey');
    expect(result!.entries).toHaveLength(1);
    expect(result!.entries[0].title).toBe('Day 1');
    expect(result!.contributors).toHaveLength(1);
    expect(result!.stats.entries).toBe(1);
  });

  it('JOURNEY-SVC-017: returns null for unauthorized user', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const result = await svc.getJourneyFull(journey.id, stranger.id);

    expect(result).toBeNull();
  });
});

describe('placeEntriesFromPhotos (#1003)', () => {
  /** A geotagged (or not) photo on an entry, wired the way the upload wires it. */
  function photoOnEntry(journeyId: number, entryId: number, ownerId: number, coords: [number, number] | null, sort = 0) {
    const tp = testDb.prepare("INSERT INTO trek_photos (provider, owner_id, file_path, lat, lng) VALUES ('local', ?, 'journey/x.jpg', ?, ?)")
      .run(ownerId, coords?.[0] ?? null, coords?.[1] ?? null).lastInsertRowid as number;
    const gp = testDb.prepare('INSERT INTO journey_photos (journey_id, photo_id, shared, sort_order, created_at) VALUES (?, ?, 1, 0, ?)')
      .run(journeyId, tp, Date.now()).lastInsertRowid as number;
    testDb.prepare('INSERT INTO journey_entry_photos (entry_id, journey_photo_id, sort_order, created_at) VALUES (?, ?, ?, ?)').run(entryId, gp, sort, Date.now());
    return tp;
  }

  it('JOURNEY-SVC-1003-1: with the setting on, a placeless entry takes the position of its first geotagged photo, once', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    testDb.prepare('UPDATE journeys SET photo_location = 1 WHERE id = ?').run(journey.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    const blank = photoOnEntry(journey.id, entry.id, user.id, null, 0);
    const first = photoOnEntry(journey.id, entry.id, user.id, [48.137, 11.575], 1);
    const second = photoOnEntry(journey.id, entry.id, user.id, [40.4, -3.7], 2);

    expect(await svc.placeEntriesFromPhotos([blank, first, second])).toEqual([{ entryId: entry.id, journeyId: journey.id, lat: 48.137, lng: 11.575 }]);
    const row = testDb.prepare('SELECT location_lat, location_lng, country_code FROM journey_entries WHERE id = ?').get(entry.id) as any;
    expect(row).toMatchObject({ location_lat: 48.137, location_lng: 11.575 });

    // Placed now: a later photo does not move it, and a name only lands while there is none.
    expect(await svc.placeEntriesFromPhotos([second])).toEqual([]);
    await svc.nameEntryLocation(entry.id, 'Marienplatz');
    await svc.nameEntryLocation(entry.id, 'Somewhere else');
    expect((testDb.prepare('SELECT location_name FROM journey_entries WHERE id = ?').get(entry.id) as any).location_name).toBe('Marienplatz');
  });

  it('JOURNEY-SVC-1003-2: off by default, and it leaves entries with a place alone', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    const photo = photoOnEntry(journey.id, entry.id, user.id, [1, 2]);
    expect(await svc.placeEntriesFromPhotos([photo])).toEqual([]);

    testDb.prepare('UPDATE journeys SET photo_location = 1 WHERE id = ?').run(journey.id);
    testDb.prepare('UPDATE journey_entries SET location_lat = 5, location_lng = 6 WHERE id = ?').run(entry.id);
    expect(await svc.placeEntriesFromPhotos([photo])).toEqual([]);
    expect(await svc.placeEntriesFromPhotos([])).toEqual([]);
  });

  it('JOURNEY-SVC-1003-3: the owner turns it on through updateJourney', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    expect(((await svc.updateJourney(journey.id, user.id, { photo_location: true })) as any).photo_location).toBe(1);
  });
});

describe('updateJourney', () => {
  it('JOURNEY-SVC-018: owner can update title and subtitle', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Old Title' });

    const updated = await svc.updateJourney(journey.id, user.id, { title: 'New Title', subtitle: 'New Sub' });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('New Title');
    expect(updated!.subtitle).toBe('New Sub');
  });

  it('JOURNEY-SVC-019: editor contributor cannot update journey settings (#732)', async () => {
    // Post-#732: journey-level settings (title/cover/status) are owner-only.
    // Editors keep access to entries and photos, but not the journey shell.
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const journey = createJourney(testDb, owner.id, { title: 'Original' });
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    const updated = await svc.updateJourney(journey.id, editor.id, { title: 'Edited' });

    expect(updated).toBeNull();
  });

  it('JOURNEY-SVC-020: viewer cannot update', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');

    const result = await svc.updateJourney(journey.id, viewer.id, { title: 'Hacked' });

    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-021: returns journey unchanged when no valid fields provided', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Same' });

    const result = await svc.updateJourney(journey.id, user.id, {});

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Same');
  });

  it('JOURNEY-SVC-762: the owner sets the shown state by hand, null hands it back, anything else is ignored', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    expect((await svc.updateJourney(journey.id, user.id, { status_override: 'live' }))!.status_override).toBe('live');
    expect((await svc.updateJourney(journey.id, user.id, { status_override: 'upcoming' }))!.status_override).toBe('live');
    expect((await svc.updateJourney(journey.id, user.id, { status_override: null }))!.status_override).toBeNull();
  });

  it('JOURNEY-SVC-021b: accepts archived status', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'To Archive' });

    const result = await svc.updateJourney(journey.id, user.id, { status: 'archived' });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('archived');
  });

  it('JOURNEY-SVC-021c: ignores invalid status value', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Stay Active' });

    const result = await svc.updateJourney(journey.id, user.id, { status: 'bogus' });

    expect(result).not.toBeNull();
    expect(result!.status).toBe('active');
  });

  it('JOURNEY-SVC-021d: trip GPX tracks are off until the owner switches them on (#2194)', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Norway' });

    // #1260 drew the linked trips' tracks unconditionally; they are opt-in now.
    expect((await svc.updateJourney(journey.id, user.id, {}))!.show_trip_tracks).toBe(0);

    // A JS boolean has to survive the trip into an INTEGER column —
    // better-sqlite3 refuses to bind one, so this would throw uncoerced.
    expect((await svc.updateJourney(journey.id, user.id, { show_trip_tracks: true }))!.show_trip_tracks).toBe(1);
    expect((await svc.updateJourney(journey.id, user.id, { show_trip_tracks: false }))!.show_trip_tracks).toBe(0);
  });

  it('JOURNEY-SVC-021e: an editor cannot switch the trip tracks on (#2194)', async () => {
    const { user } = createUser(testDb);
    const { user: editor } = createUser(testDb, { username: 'tracks-editor' });
    const journey = createJourney(testDb, user.id, { title: 'Norway' });
    testDb.prepare("INSERT INTO journey_contributors (journey_id, user_id, role, added_at) VALUES (?, ?, 'editor', 0)")
      .run(journey.id, editor.id);

    // Journey-level settings stay owner-only, same as title and status.
    expect(await svc.updateJourney(journey.id, editor.id, { show_trip_tracks: true })).toBeNull();
  });
});

describe('deleteJourney', () => {
  it('JOURNEY-SVC-022: owner can delete', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const result = await svc.deleteJourney(journey.id, user.id);

    expect(result).toBe(true);
    const row = testDb.prepare('SELECT * FROM journeys WHERE id = ?').get(journey.id);
    expect(row).toBeUndefined();
  });

  it('JOURNEY-SVC-023: non-owner cannot delete', async () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    const result = await svc.deleteJourney(journey.id, editor.id);

    expect(result).toBe(false);
    const row = testDb.prepare('SELECT * FROM journeys WHERE id = ?').get(journey.id);
    expect(row).toBeDefined();
  });
});

// -- Trip management ----------------------------------------------------------

describe('addTripToJourney / removeTripFromJourney', () => {
  it('JOURNEY-SVC-024: links a trip to a journey', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { title: 'Linked Trip' });

    const result = await svc.addTripToJourney(journey.id, trip.id, user.id);

    expect(result).toBe(true);
    const link = testDb.prepare(
      'SELECT * FROM journey_trips WHERE journey_id = ? AND trip_id = ?'
    ).get(journey.id, trip.id);
    expect(link).toBeDefined();
  });

  it('JOURNEY-SVC-024b: refuses to link a trip the caller cannot access (IDOR guard)', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    // A trip owned by someone else, that `user` is not a member of.
    const foreignTrip = createTrip(testDb, stranger.id, { title: "Stranger's Trip" });

    const result = await svc.addTripToJourney(journey.id, foreignTrip.id, user.id);

    expect(result).toBe(false);
    const link = testDb.prepare(
      'SELECT * FROM journey_trips WHERE journey_id = ? AND trip_id = ?'
    ).get(journey.id, foreignTrip.id);
    expect(link).toBeUndefined();
  });

  it('JOURNEY-SVC-025: syncs places as skeleton entries when linking a trip', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Trip with Places',
      start_date: '2026-03-01',
      end_date: '2026-03-03',
    });
    const place = createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    const day025 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number };
    createDayAssignment(testDb, day025.id, place.id);

    await svc.addTripToJourney(journey.id, trip.id, user.id);

    const skeletons = testDb.prepare(
      "SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND type = 'skeleton'"
    ).all(journey.id, place.id);
    expect(skeletons.length).toBe(1);
  });

  it('JOURNEY-SVC-026: owner can remove a trip from journey', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { title: 'Remove Me' });
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    const result = await svc.removeTripFromJourney(journey.id, trip.id, user.id);

    expect(result).toBe(true);
    const link = testDb.prepare(
      'SELECT * FROM journey_trips WHERE journey_id = ? AND trip_id = ?'
    ).get(journey.id, trip.id);
    expect(link).toBeUndefined();
  });

  it('JOURNEY-SVC-027: non-owner cannot remove a trip', async () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    const trip = createTrip(testDb, owner.id, { title: 'Stay Linked' });
    await svc.addTripToJourney(journey.id, trip.id, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    const result = await svc.removeTripFromJourney(journey.id, trip.id, editor.id);

    expect(result).toBe(false);
  });
});

// -- Entries ------------------------------------------------------------------

describe('listEntries', () => {
  it('JOURNEY-SVC-028: returns entries with photos for authorized user', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      title: 'Morning Walk',
      entry_date: '2026-03-01',
    });

    const result = await svc.listEntries(journey.id, user.id);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result![0].title).toBe('Morning Walk');
    expect(result![0].photos).toEqual([]);
  });

  it('JOURNEY-SVC-029: returns null for unauthorized user', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const result = await svc.listEntries(journey.id, stranger.id);

    expect(result).toBeNull();
  });

  /*
   * The stop switch reads back as a boolean on every path (discussion #2064).
   * The column holds 0 or 1; a client handed the integer on one read and the
   * boolean on another could compare against neither.
   */
  it('answers stats_excluded as a boolean, on the list and on the full journey alike', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const off = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01', stats_excluded: 1 });
    const on = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-02' });

    const listed = (await svc.listEntries(journey.id, user.id))!;
    expect(listed.find(e => e.id === off.id)!.stats_excluded).toBe(true);
    expect(listed.find(e => e.id === on.id)!.stats_excluded).toBe(false);

    const full = (await svc.getJourneyFull(journey.id, user.id))!;
    expect(full.entries.map(e => e.stats_excluded)).toEqual([true, false]);
  });
});

describe('createEntry', () => {
  it('JOURNEY-SVC-030: creates entry for editor', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const entry = await svc.createEntry(journey.id, user.id, {
      title: 'Beach Day',
      entry_date: '2026-03-10',
      story: 'Beautiful sunset',
      mood: 'happy',
      weather: 'sunny',
      tags: ['beach', 'sunset'],
    });

    expect(entry).not.toBeNull();
    expect(entry!.title).toBe('Beach Day');
    expect(entry!.story).toBe('Beautiful sunset');
    expect(entry!.mood).toBe('happy');
    expect(entry!.type).toBe('entry');
    expect(entry!.author_id).toBe(user.id);
  });

  it('JOURNEY-SVC-031: viewer cannot create entry', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');

    const entry = await svc.createEntry(journey.id, viewer.id, {
      title: 'Should Fail',
      entry_date: '2026-03-10',
    });

    expect(entry).toBeNull();
  });
});

describe('updateEntry', () => {
  it('JOURNEY-SVC-032: updates entry fields', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      title: 'Old',
      entry_date: '2026-03-01',
    });

    const updated = await svc.updateEntry(entry.id, user.id, { title: 'Updated', mood: 'excited' });

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated');
    expect(updated!.mood).toBe('excited');
  });

  it('JOURNEY-SVC-033: promotes skeleton to entry when story is added', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      type: 'skeleton',
      title: 'Placeholder',
      entry_date: '2026-03-01',
    });

    const updated = await svc.updateEntry(entry.id, user.id, { story: 'Now I have a story!' });

    expect(updated).not.toBeNull();
    expect(updated!.type).toBe('entry');
    expect(updated!.story).toBe('Now I have a story!');
  });

  /*
   * The JSON columns come back decoded, on every path (#2085 follow-up).
   *
   * `tags` and `pros_cons` are JSON in TEXT columns. The read paths decoded
   * them and create/update did not, so an edit answered with `tags` as a
   * string, the client spread it into an entry it had typed as `string[]`, and
   * the journey page threw `tags.map is not a function`.
   */
  it('answers with tags decoded, not as the JSON string the column holds', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = await svc.createEntry(journey.id, user.id, {
      title: 'Beach Day', entry_date: '2026-03-10', tags: ['beach', 'sunset'],
    });

    expect(entry!.tags).toEqual(['beach', 'sunset']);

    const updated = await svc.updateEntry(entry!.id, user.id, { title: 'Renamed' });
    expect(updated!.tags).toEqual(['beach', 'sunset']);
  });

  it('decodes an emptied tag list rather than answering the string "[]"', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    // The update path writes JSON.stringify([]) with no length check, so this
    // is the ordinary way an entry ends up with a non-null tags column.
    const updated = await svc.updateEntry(entry.id, user.id, { tags: [] });
    expect(updated!.tags).toEqual([]);
  });

  it('decodes pros_cons the same way, on create and on update', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const prosCons = { pros: ['warm'], cons: ['crowded'] };
    const entry = await svc.createEntry(journey.id, user.id, {
      title: 'Verdict', entry_date: '2026-03-10', pros_cons: prosCons,
    });

    expect(entry!.pros_cons).toEqual(prosCons);
    expect((await svc.updateEntry(entry!.id, user.id, { title: 'Renamed' }))!.pros_cons).toEqual(prosCons);
  });

  // L3 (task-5-review.md, user decision: KEEP HEAD's behaviour, deliberate
  // deviation FOR THE USER) — base stored the raw non-array `tags`/non-object
  // `pros_cons` value as-is and then 500ed on every later read that tried to
  // JSON.parse it, leaving the entry permanently unreadable; base also 500s
  // outright on a `false` bind. HEAD writes SQL NULL instead and answers 200,
  // which is the narrowing that fixes that legacy defect. Pinned here so a
  // future change to this branch is a deliberate decision, not an accident.
  it('L3: a non-array tags / non-object pros_cons patch writes NULL and returns 200, rather than the raw value HEAD used to store (a legacy defect, not reproduced)', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const updated = await svc.updateEntry(entry.id, user.id, {
      tags: 'not-an-array' as unknown as string[],
      pros_cons: false as unknown as { pros: string[]; cons: string[] },
    });

    expect(updated).not.toBeNull();
    expect(updated!.tags).toEqual([]);
    expect(updated!.pros_cons).toBeNull();

    const row = testDb.prepare('SELECT tags, pros_cons FROM journey_entries WHERE id = ?').get(entry.id) as { tags: string | null; pros_cons: string | null };
    expect(row.tags).toBeNull();
    expect(row.pros_cons).toBeNull();

    // And the entry stays readable afterwards — no 500 on the next read,
    // which is exactly the defect this deviation fixes.
    expect(await svc.listEntries(journey.id, user.id)).not.toBeNull();
  });

  /* An update that changes nothing takes its own early return out of the method. */
  it('decodes on the no-op update too', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = await svc.createEntry(journey.id, user.id, {
      title: 'Beach Day', entry_date: '2026-03-10', tags: ['beach'],
    });

    expect((await svc.updateEntry(entry!.id, user.id, {}))!.tags).toEqual(['beach']);
  });

  /*
   * The broadcast carries the same shape as the answer. Nothing reads it today
   * — the journey page reloads on any event — so this is about not leaving a
   * payload that contradicts every read path for a listener to trust later.
   */
  it('broadcasts the decoded entry, not the row', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = await svc.createEntry(journey.id, user.id, {
      title: 'Beach Day', entry_date: '2026-03-10', tags: ['beach', 'sunset'],
    });

    const spy = vi.spyOn(RealtimeService.prototype, 'broadcastToUser').mockImplementation(() => {});
    try {
      await svc.updateEntry(entry!.id, user.id, { title: 'Renamed' });
      const payload = spy.mock.calls.at(-1)?.[1] as { type: string; entry: { tags: unknown } };
      expect(payload.type).toBe('journey:entry:updated');
      expect(payload.entry.tags).toEqual(['beach', 'sunset']);
    } finally {
      spy.mockRestore();
    }
  });

  /*
   * The stop switch (discussion #2064). The column is an INTEGER, the wire is
   * a boolean and the client compares with `=== true`, so the answer has to
   * be the boolean on the way out as well as the integer on the way in, and
   * the broadcast has to say the same thing the answer does.
   */
  it('creates and toggles a draft, answering the flag as a boolean (#696)', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const created = await svc.createEntry(journey.id, user.id, { entry_date: '2026-03-01', title: 'Rough', is_draft: true });
    expect(created!.is_draft).toBe(true);
    const published = await svc.updateEntry(created!.id, user.id, { is_draft: false });
    expect(published!.is_draft).toBe(false);
    expect((testDb.prepare('SELECT is_draft FROM journey_entries WHERE id = ?').get(created!.id) as { is_draft: number }).is_draft).toBe(0);
  });

  it('switches a stop off and back on, and answers with the flag as a boolean', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const flagOf = (id: number) =>
      (testDb.prepare('SELECT stats_excluded FROM journey_entries WHERE id = ?').get(id) as { stats_excluded: number }).stats_excluded;

    const spy = vi.spyOn(RealtimeService.prototype, 'broadcastToUser').mockImplementation(() => {});
    try {
      const off = await svc.updateEntry(entry.id, user.id, { stats_excluded: true });
      expect(off!.stats_excluded).toBe(true);
      expect(flagOf(entry.id)).toBe(1);
      const payload = spy.mock.calls.at(-1)?.[1] as { type: string; entry: { stats_excluded: unknown } };
      expect(payload.entry.stats_excluded).toBe(true);

      const on = await svc.updateEntry(entry.id, user.id, { stats_excluded: false });
      expect(on!.stats_excluded).toBe(false);
      expect(flagOf(entry.id)).toBe(0);
    } finally {
      spy.mockRestore();
    }
  });

  it('a viewer cannot switch a stop off', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');
    const entry = createJourneyEntry(testDb, journey.id, owner.id, { entry_date: '2026-03-01' });

    expect(await svc.updateEntry(entry.id, viewer.id, { stats_excluded: true })).toBeNull();
    expect((await svc.listEntries(journey.id, owner.id))![0].stats_excluded).toBe(false);
  });

  it('JOURNEY-SVC-034: returns null for non-existent entry', async () => {
    const { user } = createUser(testDb);

    const result = await svc.updateEntry(99999, user.id, { title: 'No Such Entry' });

    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-034b: ignores injection column keys and mass-assignment attempts', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, {
      title: 'Safe',
      story: 'original',
      entry_date: '2026-03-01',
    });

    // The keys come straight from the request body. A crafted key was previously
    // interpolated as a raw SQL column name (`${key} = ?`), enabling subquery
    // injection (full DB read) and mass-assignment of protected columns.
    const malicious: Record<string, unknown> = {
      title: 'Updated',
      [`story = (SELECT password_hash FROM users WHERE id = ${user.id}), updated_at`]: 'x',
      author_id: 999999,
    };

    const updated = await svc.updateEntry(entry.id, user.id, malicious as Parameters<typeof svc.updateEntry>[2]);

    expect(updated).not.toBeNull();
    expect(updated!.title).toBe('Updated'); // legit field still applied
    expect(updated!.story).toBe('original'); // injection key dropped — no hash leaked into story
    expect(updated!.author_id).toBe(user.id); // mass-assignment blocked
  });

  // M3 (task-5-review.md) — a patch carrying ONLY non-allow-listed keys (no
  // legit field at all, unlike JOURNEY-SVC-034b above which always mixes in
  // a real `title`) used to be treated as "something was provided" because
  // the old no-op check read `Object.values(data).some(v => v !== undefined)`
  // off the RAW request body, not off the allow-listed `patch` presenceSet
  // actually builds. Base: no write, no `updated_at` bump on either row, no
  // broadcast. HEAD (before this fix): stamped both `updated_at`s and
  // broadcast anyway.
  it('JOURNEY-SVC-M3-01: a patch with only non-allow-listed keys is a no-op — no write, no updated_at bump, no broadcast', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { title: 'Original', entry_date: '2026-03-01' });

    const updateFieldsSpy = vi.spyOn(entriesRepoDirect, 'updateFields');
    const journeyUpdateSpy = vi.spyOn(journeysRepoDirect, 'updateFields');
    const broadcastSpy = vi.spyOn(RealtimeService.prototype, 'broadcastToUser').mockImplementation(() => {});
    try {
      const updated = await svc.updateEntry(entry.id, user.id, { foo: 1 } as unknown as Parameters<typeof svc.updateEntry>[2]);

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe('Original');
      expect(updateFieldsSpy).not.toHaveBeenCalled();
      expect(journeyUpdateSpy).not.toHaveBeenCalled();
      expect(broadcastSpy).not.toHaveBeenCalled();
    } finally {
      updateFieldsSpy.mockRestore();
      journeyUpdateSpy.mockRestore();
      broadcastSpy.mockRestore();
    }
  });
});

describe('deleteEntry', () => {
  it('JOURNEY-SVC-035: deletes entry for editor', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const result = await svc.deleteEntry(entry.id, user.id);

    expect(result).toBe(true);
    const row = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entry.id);
    expect(row).toBeUndefined();
  });

  it('JOURNEY-SVC-036: returns false for non-existent entry', async () => {
    const { user } = createUser(testDb);

    expect(await svc.deleteEntry(99999, user.id)).toBe(false);
  });

  it('JOURNEY-SVC-037: viewer cannot delete entry', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');
    const entry = createJourneyEntry(testDb, journey.id, owner.id, { entry_date: '2026-03-01' });

    expect(await svc.deleteEntry(entry.id, viewer.id)).toBe(false);
  });

  it('JOURNEY-SVC-037b: deleting a filled skeleton reverts it back to skeleton', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Tokyo Tower' });

    // Create a filled entry that originated from a trip skeleton
    const now = Date.now();
    testDb.prepare(`
      INSERT INTO journey_entries (journey_id, source_trip_id, source_place_id, author_id, type, title, story, mood, entry_date, location_name, visibility, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'entry', 'Tokyo Tower', 'Amazing view!', 'amazing', '2026-03-01', 'Tokyo', 'private', 0, ?, ?)
    `).run(journey.id, trip.id, place.id, user.id, now, now);
    const entry = testDb.prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?').get(journey.id, place.id) as any;

    const result = await svc.deleteEntry(entry.id, user.id);
    expect(result).toBe(true);

    // Entry should still exist but reverted to skeleton
    const reverted = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entry.id) as any;
    expect(reverted).toBeDefined();
    expect(reverted.type).toBe('skeleton');
    expect(reverted.story).toBeNull();
    expect(reverted.mood).toBeNull();
    expect(reverted.source_trip_id).toBe(trip.id);
    expect(reverted.source_place_id).toBe(place.id);
    expect(reverted.title).toBe('Tokyo Tower');
  });

  it('JOURNEY-SVC-037c: deleting an independent entry permanently removes it', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01', story: 'Manual entry' });

    const result = await svc.deleteEntry(entry.id, user.id);
    expect(result).toBe(true);

    const row = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(entry.id);
    expect(row).toBeUndefined();
  });
});

// -- Photos -------------------------------------------------------------------

describe('addPhoto / addProviderPhoto / deletePhoto', () => {
  it('JOURNEY-SVC-038: addPhoto creates a local photo on an entry', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const photo = await svc.addPhoto(entry.id, user.id, '/uploads/photo.jpg', '/uploads/thumb.jpg', 'Sunset');

    expect(photo).not.toBeNull();
    expect(photo!.file_path).toBe('/uploads/photo.jpg');
    expect(photo!.thumbnail_path).toBe('/uploads/thumb.jpg');
    expect(photo!.caption).toBe('Sunset');
    expect(photo!.provider).toBe('local');
  });

  it('JOURNEY-SVC-039: addPhoto returns null for non-existent entry', async () => {
    const { user } = createUser(testDb);

    const result = await svc.addPhoto(99999, user.id, '/uploads/photo.jpg');

    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-040: addProviderPhoto creates a provider-backed photo', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const photo = await svc.addProviderPhoto(entry.id, user.id, 'immich', 'asset-123', 'My caption');

    expect(photo).not.toBeNull();
    expect(photo!.provider).toBe('immich');
    expect(photo!.asset_id).toBe('asset-123');
    expect(photo!.caption).toBe('My caption');
  });

  it('JOURNEY-SVC-041: addProviderPhoto skips duplicate asset', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    await svc.addProviderPhoto(entry.id, user.id, 'immich', 'dup-asset');
    const duplicate = await svc.addProviderPhoto(entry.id, user.id, 'immich', 'dup-asset');

    expect(duplicate).toBeNull();
  });

  it('JOURNEY-SVC-042: deletePhoto removes photo and returns it', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = await svc.addPhoto(entry.id, user.id, '/uploads/delete-me.jpg');

    const deleted = await svc.deletePhoto(photo!.id, user.id);

    expect(deleted).not.toBeNull();
    expect(deleted!.id).toBe(photo!.id);
    const row = testDb.prepare('SELECT * FROM journey_photos WHERE id = ?').get(photo!.id);
    expect(row).toBeUndefined();
  });

  it('JOURNEY-SVC-043: deletePhoto returns null for non-existent photo', async () => {
    const { user } = createUser(testDb);

    expect(await svc.deletePhoto(99999, user.id)).toBeNull();
  });

  it('JOURNEY-SVC-044: viewer cannot add photo', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');
    const entry = createJourneyEntry(testDb, journey.id, owner.id, { entry_date: '2026-03-01' });

    const result = await svc.addPhoto(entry.id, viewer.id, '/uploads/no.jpg');

    expect(result).toBeNull();
  });
});

// -- Contributors -------------------------------------------------------------

describe('addContributor / updateContributorRole / removeContributor', () => {
  it('JOURNEY-SVC-045: owner can add contributor', async () => {
    const { user: owner } = createUser(testDb);
    const { user: newContrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const result = await svc.addContributor(journey.id, owner.id, newContrib.id, 'editor');

    expect(result).toBe(true);
    const row = testDb.prepare(
      'SELECT * FROM journey_contributors WHERE journey_id = ? AND user_id = ?'
    ).get(journey.id, newContrib.id) as { role: string } | undefined;
    expect(row).toBeDefined();
    expect(row!.role).toBe('editor');
  });

  it('JOURNEY-SVC-046: non-owner cannot add contributor', async () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const { user: newUser } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    const result = await svc.addContributor(journey.id, editor.id, newUser.id, 'viewer');

    expect(result).toBe(false);
  });

  it('JOURNEY-SVC-047: owner cannot add themselves as contributor', async () => {
    const { user: owner } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const result = await svc.addContributor(journey.id, owner.id, owner.id, 'editor');

    expect(result).toBe(false);
  });

  it('JOURNEY-SVC-048: owner can update contributor role', async () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, contrib.id, 'viewer');

    const result = await svc.updateContributorRole(journey.id, owner.id, contrib.id, 'editor');

    expect(result).toBe(true);
    const row = testDb.prepare(
      'SELECT role FROM journey_contributors WHERE journey_id = ? AND user_id = ?'
    ).get(journey.id, contrib.id) as { role: string };
    expect(row.role).toBe('editor');
  });

  it('JOURNEY-SVC-049: non-owner cannot update contributor role', async () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const { user: target } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');
    addJourneyContributor(testDb, journey.id, target.id, 'viewer');

    const result = await svc.updateContributorRole(journey.id, editor.id, target.id, 'editor');

    expect(result).toBe(false);
  });

  // JG118 (task-5-review.md, user decision: pin, do NOT fix) — a PRE-EXISTING
  // hole preserved on purpose (also present at legacy base): nothing here or
  // in SQL stops the owner from writing `role = 'owner'` through this path —
  // only the TypeScript parameter type discourages it, and that boundary is
  // bypassable from a raw HTTP/MCP body. The hardening line (refuse unless
  // `role === 'editor' || role === 'viewer'`) goes in the report FOR THE
  // USER; this test pins today's behaviour so a future fix is a deliberate
  // change, not a silent one.
  it('JOURNEY-SVC-JG118-PIN: updateContributorRole still accepts role "owner" through the typed path (pre-existing, not fixed by this wave)', async () => {
    const { user: owner } = createUser(testDb);
    const { user: target } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, target.id, 'editor');

    const result = await svc.updateContributorRole(journey.id, owner.id, target.id, 'owner' as unknown as 'editor' | 'viewer');

    expect(result).toBe(true);
    const row = testDb.prepare('SELECT role FROM journey_contributors WHERE journey_id = ? AND user_id = ?').get(journey.id, target.id) as { role: string };
    expect(row.role).toBe('owner');
  });

  it('JOURNEY-SVC-050: owner can remove contributor', async () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, contrib.id, 'editor');

    const result = await svc.removeContributor(journey.id, owner.id, contrib.id);

    expect(result).toBe(true);
    const row = testDb.prepare(
      'SELECT * FROM journey_contributors WHERE journey_id = ? AND user_id = ?'
    ).get(journey.id, contrib.id);
    expect(row).toBeUndefined();
  });

  it('JOURNEY-SVC-051: removeContributor does not remove owner contributor record', async () => {
    const { user: owner } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    // attempting to remove the owner's own contributor record should not work
    // (the SQL filters role != 'owner')
    await svc.removeContributor(journey.id, owner.id, owner.id);

    const row = testDb.prepare(
      'SELECT * FROM journey_contributors WHERE journey_id = ? AND user_id = ?'
    ).get(journey.id, owner.id);
    expect(row).toBeDefined();
  });
});

// M5c (task-5-review.md) — R3's reset-column trap on `journey_contributors`'s
// composite PK: the legacy `INSERT OR REPLACE` deletes and re-inserts on a
// conflict, so `hide_skeletons` (not in the column list `upsertContributor`
// writes on purpose) resets to its table default (0) — verified live by W2's
// probe, but until now pinned only as report text (the ledger's "upsert SQL
// pinned = the reference" claim did not hold). Mutation M10 (drop the
// explicit `hide_skeletons: 0`) stayed green with no test to catch it.
describe('R3 composite-PK writes — reset-on-conflict behaviour and rendered SQL (M5c)', () => {
  it('JOURNEY-SVC-M5C-01: re-adding a contributor (upsertContributor merge branch) resets hide_skeletons to 0', async () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    await svc.addContributor(journey.id, owner.id, contrib.id, 'editor');
    await svc.updateJourneyPreferences(journey.id, contrib.id, { hide_skeletons: true });
    expect(
      (testDb.prepare('SELECT hide_skeletons FROM journey_contributors WHERE journey_id = ? AND user_id = ?').get(journey.id, contrib.id) as { hide_skeletons: number }).hide_skeletons,
    ).toBe(1);

    // Re-add (same target, a possibly different role) — the ON CONFLICT
    // merge branch of upsertContributor, exercised through the real service.
    await svc.addContributor(journey.id, owner.id, contrib.id, 'viewer');

    const row = testDb
      .prepare('SELECT role, hide_skeletons FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journey.id, contrib.id) as { role: string; hide_skeletons: number };
    expect(row.role).toBe('viewer');
    expect(row.hide_skeletons).toBe(0);
  });

  it('JOURNEY-SVC-M5C-02: upsertContributor (merge-shaped) renders an ON CONFLICT over the (journey_id, user_id) composite PK', async () => {
    const { user: owner } = createUser(testDb);
    const { user: contrib } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const connection = contributorsRepoDirect.getEntityManager().getConnection();
    const spy = vi.spyOn(connection, 'execute');
    try {
      await contributorsRepoDirect.upsertContributor(journey.id, contrib.id, 'editor', Date.now());
      const insertSql = spy.mock.calls.map(([sql]) => sql).find((sql): sql is string => typeof sql === 'string' && /insert into/i.test(sql));
      expect(insertSql).toBeDefined();
      expect(insertSql).toMatch(/on conflict \(`journey_id`, ?`user_id`\)/i);
      expect(insertSql).toMatch(/do update set/i);
    } finally {
      spy.mockRestore();
    }
  });

  it('JOURNEY-SVC-M5C-03: JourneyTripsRepository.insertIgnore (ignore-shaped) renders an ON CONFLICT ... DO NOTHING over (journey_id, trip_id)', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);

    const connection = journeyTripsRepoDirect.getEntityManager().getConnection();
    const spy = vi.spyOn(connection, 'execute');
    try {
      await journeyTripsRepoDirect.insertIgnore(journey.id, trip.id, Date.now());
      const insertSql = spy.mock.calls.map(([sql]) => sql).find((sql): sql is string => typeof sql === 'string' && /insert into/i.test(sql));
      expect(insertSql).toBeDefined();
      expect(insertSql).toMatch(/on conflict \(`journey_id`, ?`trip_id`\)/i);
      expect(insertSql).toMatch(/do nothing/i);
    } finally {
      spy.mockRestore();
    }
  });

  it('JOURNEY-SVC-M5C-04: JourneyEntryPhotosRepository.insertIgnore (ignore-shaped) renders an ON CONFLICT ... DO NOTHING over (entry_id, journey_photo_id)', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);
    const trekResult = testDb
      .prepare('INSERT INTO trek_photos (provider, file_path, owner_id, created_at) VALUES (?, ?, ?, ?)')
      .run('local', '/photos/m5c.jpg', user.id, Date.now());
    const trekId = trekResult.lastInsertRowid as number;
    const jpResult = testDb
      .prepare('INSERT INTO journey_photos (journey_id, photo_id, sort_order, created_at) VALUES (?, ?, ?, ?)')
      .run(journey.id, trekId, 0, Date.now());
    const journeyPhotoId = jpResult.lastInsertRowid as number;

    const connection = entryPhotosRepoDirect.getEntityManager().getConnection();
    const spy = vi.spyOn(connection, 'execute');
    try {
      await entryPhotosRepoDirect.insertIgnore(entry.id, journeyPhotoId, 0, Date.now());
      const insertSql = spy.mock.calls.map(([sql]) => sql).find((sql): sql is string => typeof sql === 'string' && /insert into/i.test(sql));
      expect(insertSql).toBeDefined();
      expect(insertSql).toMatch(/on conflict \(`entry_id`, ?`journey_photo_id`\)/i);
      expect(insertSql).toMatch(/do nothing/i);
    } finally {
      spy.mockRestore();
    }
  });
});

// M4 (task-5-review.md) — `JourneysRepository.listRecipientUserIds`'s
// `if (ownerId !== undefined) ids.add(ownerId)` null arm had no test where
// `findOwnerId` actually returns undefined (a missing journey), so the
// branch went uncovered.
describe('JourneysRepository.listRecipientUserIds — missing journey (M4)', () => {
  it('returns an empty array for a journey id that does not exist (findOwnerId undefined arm)', async () => {
    expect(await journeysRepoDirect.listRecipientUserIds(999_999)).toEqual([]);
  });
});

// -- Suggestions --------------------------------------------------------------

describe('getSuggestions', () => {
  it('JOURNEY-SVC-052: returns recently ended trips not yet in a journey', async () => {
    const { user } = createUser(testDb);
    // Trip that ended 5 days ago (within 30-day window)
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    createTrip(testDb, user.id, {
      title: 'Recent Trip',
      start_date: tenDaysAgo,
      end_date: fiveDaysAgo,
    });

    const suggestions = await svc.getSuggestions(user.id);

    expect(suggestions.length).toBe(1);
    expect((suggestions[0] as any).title).toBe('Recent Trip');
  });

  it('JOURNEY-SVC-053: excludes trips already linked to a journey', async () => {
    const { user } = createUser(testDb);
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const trip = createTrip(testDb, user.id, {
      title: 'Already Linked',
      start_date: tenDaysAgo,
      end_date: fiveDaysAgo,
    });
    const journey = createJourney(testDb, user.id);
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    const suggestions = await svc.getSuggestions(user.id);

    expect(suggestions.length).toBe(0);
  });

  it('JOURNEY-SVC-054: excludes trips ending in the future', async () => {
    const { user } = createUser(testDb);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    createTrip(testDb, user.id, {
      title: 'Future Trip',
      start_date: '2026-04-01',
      end_date: tomorrow,
    });

    const suggestions = await svc.getSuggestions(user.id);

    expect(suggestions.length).toBe(0);
  });
});

// -- syncTripPlaces ------------------------------------------------------------

describe('syncTripPlaces', () => {
  it('JOURNEY-SVC-055: creates skeleton entries for each trip place', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Sync Trip',
      start_date: '2026-05-01',
      end_date: '2026-05-03',
    });
    const place1 = createPlace(testDb, trip.id, { name: 'Eiffel Tower' });
    const place2 = createPlace(testDb, trip.id, { name: 'Louvre' });
    const days055 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 2').all(trip.id) as { id: number }[];
    createDayAssignment(testDb, days055[0].id, place1.id);
    createDayAssignment(testDb, days055[1].id, place2.id);

    await svc.syncTripPlaces(journey.id, trip.id, user.id);

    const skeletons = testDb.prepare(
      "SELECT * FROM journey_entries WHERE journey_id = ? AND type = 'skeleton'"
    ).all(journey.id) as any[];
    expect(skeletons.length).toBe(2);
    const names = skeletons.map((s: any) => s.title).sort();
    expect(names).toEqual(['Eiffel Tower', 'Louvre']);
  });

  it('JOURNEY-SVC-056: skips places that already have skeleton entries', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Idempotent Trip',
      start_date: '2026-05-01',
      end_date: '2026-05-02',
    });
    const place056 = createPlace(testDb, trip.id, { name: 'Notre Dame' });
    const day056 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number };
    createDayAssignment(testDb, day056.id, place056.id);

    await svc.syncTripPlaces(journey.id, trip.id, user.id);
    await svc.syncTripPlaces(journey.id, trip.id, user.id); // second call

    const skeletons = testDb.prepare(
      "SELECT * FROM journey_entries WHERE journey_id = ? AND type = 'skeleton'"
    ).all(journey.id);
    expect(skeletons.length).toBe(1);
  });

  it('JOURNEY-SVC-057: uses day date for skeleton entry_date when available', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    // Trip with dates auto-creates days; grab an existing day to assign the place
    const trip = createTrip(testDb, user.id, {
      title: 'Dated Trip',
      start_date: '2026-06-10',
      end_date: '2026-06-12',
    });
    const day = testDb.prepare(
      "SELECT * FROM days WHERE trip_id = ? AND date = '2026-06-11'"
    ).get(trip.id) as { id: number };
    const place = createPlace(testDb, trip.id, { name: 'Colosseum' });
    createDayAssignment(testDb, day.id, place.id);

    await svc.syncTripPlaces(journey.id, trip.id, user.id);

    const skeleton = testDb.prepare(
      "SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?"
    ).get(journey.id, place.id) as any;
    expect(skeleton).toBeDefined();
    expect(skeleton.entry_date).toBe('2026-06-11');
  });
});

// -- onPlaceCreated / onPlaceUpdated / onPlaceDeleted -------------------------

describe('onPlaceCreated', () => {
  it('JOURNEY-SVC-058: creates skeleton entry in linked journeys', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Webhook Trip',
      start_date: '2026-07-01',
      end_date: '2026-07-03',
    });
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    // Create a new place after trip is linked
    const place = createPlace(testDb, trip.id, { name: 'Sagrada Familia' });
    const day058 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number };
    createDayAssignment(testDb, day058.id, place.id);
    await svc.onPlaceCreated(trip.id, place.id);

    const skeleton = testDb.prepare(
      "SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND type = 'skeleton'"
    ).get(journey.id, place.id);
    expect(skeleton).toBeDefined();
  });

  it('JOURNEY-SVC-059: does nothing if trip is not linked to any journey', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Unlinked Trip' });
    const place = createPlace(testDb, trip.id, { name: 'Remote Place' });

    await svc.onPlaceCreated(trip.id, place.id);

    const entries = testDb.prepare(
      "SELECT * FROM journey_entries WHERE source_place_id = ?"
    ).all(place.id);
    expect(entries.length).toBe(0);
  });

  it('JOURNEY-SVC-060: does not duplicate if skeleton already exists', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Dup Trip',
      start_date: '2026-07-01',
      end_date: '2026-07-02',
    });
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    const place = createPlace(testDb, trip.id, { name: 'Arc de Triomphe' });
    const day060 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number };
    createDayAssignment(testDb, day060.id, place.id);
    await svc.onPlaceCreated(trip.id, place.id);
    await svc.onPlaceCreated(trip.id, place.id); // second call

    const entries = testDb.prepare(
      "SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?"
    ).all(journey.id, place.id);
    expect(entries.length).toBe(1);
  });
});

describe('onPlaceUpdated', () => {
  it('JOURNEY-SVC-061: updates skeleton entry fields when place changes', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Update Place Trip',
      start_date: '2026-08-01',
      end_date: '2026-08-03',
    });
    const place = createPlace(testDb, trip.id, { name: 'Old Name' });
    const day061 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number };
    createDayAssignment(testDb, day061.id, place.id);
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    // Update the place name directly in DB
    testDb.prepare('UPDATE places SET name = ?, address = ? WHERE id = ?').run('New Name', 'New Address', place.id);
    await svc.onPlaceUpdated(place.id);

    const entry = testDb.prepare(
      "SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND type = 'skeleton'"
    ).get(journey.id, place.id) as any;
    expect(entry).toBeDefined();
    expect(entry.title).toBe('New Name');
    expect(entry.location_name).toBe('New Address');
  });

  it('JOURNEY-SVC-062: only updates location on filled entries, not title', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Filled Entry Trip',
      start_date: '2026-08-01',
      end_date: '2026-08-02',
    });
    const place = createPlace(testDb, trip.id, { name: 'Original Place' });
    const day062 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number };
    createDayAssignment(testDb, day062.id, place.id);
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    // Promote the skeleton to a full entry
    const skeleton = testDb.prepare(
      "SELECT id FROM journey_entries WHERE journey_id = ? AND source_place_id = ?"
    ).get(journey.id, place.id) as { id: number };
    await svc.updateEntry(skeleton.id, user.id, { story: 'My story', title: 'Custom Title' });

    // Now update the place
    testDb.prepare('UPDATE places SET name = ?, address = ? WHERE id = ?').run('Changed Place', 'Changed Addr', place.id);
    await svc.onPlaceUpdated(place.id);

    const entry = testDb.prepare(
      "SELECT * FROM journey_entries WHERE id = ?"
    ).get(skeleton.id) as any;
    expect(entry.title).toBe('Custom Title'); // title unchanged
    expect(entry.location_name).toBe('Changed Addr'); // location updated
  });

  it('JOURNEY-SVC-063: does nothing if place has no linked entries', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Orphan Trip' });
    const place = createPlace(testDb, trip.id, { name: 'Orphan Place' });

    // Should not throw
    await svc.onPlaceUpdated(place.id);

    const entries = testDb.prepare(
      "SELECT * FROM journey_entries WHERE source_place_id = ?"
    ).all(place.id);
    expect(entries.length).toBe(0);
  });
});

describe('onPlaceDeleted', () => {
  it('JOURNEY-SVC-064: deletes empty skeleton entries', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Delete Place Trip',
      start_date: '2026-09-01',
      end_date: '2026-09-02',
    });
    const place = createPlace(testDb, trip.id, { name: 'To Be Deleted' });
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    await svc.onPlaceDeleted(place.id);

    const entry = testDb.prepare(
      "SELECT * FROM journey_entries WHERE source_place_id = ?"
    ).get(place.id);
    expect(entry).toBeUndefined();
  });

  it('JOURNEY-SVC-065: detaches filled entries and adds note instead of deleting', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Detach Trip',
      start_date: '2026-09-01',
      end_date: '2026-09-02',
    });
    const place = createPlace(testDb, trip.id, { name: 'Detach Place' });
    const day065 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number };
    createDayAssignment(testDb, day065.id, place.id);
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    // Promote the skeleton to a filled entry
    const skeleton = testDb.prepare(
      "SELECT id FROM journey_entries WHERE journey_id = ? AND source_place_id = ?"
    ).get(journey.id, place.id) as { id: number };
    await svc.updateEntry(skeleton.id, user.id, { story: 'I really enjoyed this place' });

    await svc.onPlaceDeleted(place.id);

    const entry = testDb.prepare(
      "SELECT * FROM journey_entries WHERE id = ?"
    ).get(skeleton.id) as any;
    expect(entry).toBeDefined();
    expect(entry.source_place_id).toBeNull();
    expect(entry.source_trip_id).toBeNull();
    expect(entry.story).toContain('original trip place was removed');
  });

  it('JOURNEY-SVC-066: does nothing for unlinked places', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Unlinked' });
    const place = createPlace(testDb, trip.id, { name: 'Nowhere' });

    await expect(svc.onPlaceDeleted(place.id)).resolves.toBeUndefined();

    const orphaned = testDb.prepare(
      "SELECT COUNT(*) AS n FROM journey_entries WHERE source_place_id = ?"
    ).get(place.id) as { n: number };
    expect(orphaned.n).toBe(0);
  });
});

// -- linkPhotoToEntry ----------------------------------------------------------

describe('linkPhotoToEntry', () => {
  it('JOURNEY-SVC-067: moves photo from one entry to another', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry1 = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const entry2 = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-02' });

    const photo = await svc.addPhoto(entry1.id, user.id, '/uploads/link-test.jpg');
    expect(photo).not.toBeNull();

    const result = await svc.linkPhotoToEntry(entry2.id, photo!.id, user.id);
    expect(result).not.toBeNull();
    expect(result!.entry_id).toBe(entry2.id);
  });

  it('JOURNEY-SVC-068: returns same photo if already on target entry', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = await svc.addPhoto(entry.id, user.id, '/uploads/same-entry.jpg');

    const result = await svc.linkPhotoToEntry(entry.id, photo!.id, user.id);
    expect(result).not.toBeNull();
    expect(result!.id).toBe(photo!.id);
    expect(result!.entry_id).toBe(entry.id);
  });

  it('JOURNEY-SVC-069: returns null for non-existent entry', async () => {
    const { user } = createUser(testDb);

    const result = await svc.linkPhotoToEntry(99999, 1, user.id);
    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-070: returns null for non-existent photo', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const result = await svc.linkPhotoToEntry(entry.id, 99999, user.id);
    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-071: viewer cannot link photo', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');
    const entry = createJourneyEntry(testDb, journey.id, owner.id, { entry_date: '2026-03-01' });
    const photo = await svc.addPhoto(entry.id, owner.id, '/uploads/owner-photo.jpg');

    const result = await svc.linkPhotoToEntry(entry.id, photo!.id, viewer.id);
    expect(result).toBeNull();
  });
});

// -- setPhotoProvider ----------------------------------------------------------

describe('setPhotoProvider', () => {
  it('JOURNEY-SVC-072: sets provider info on an existing photo', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = await svc.addPhoto(entry.id, user.id, '/uploads/provider-test.jpg');

    await svc.setPhotoProvider(photo!.id, 'immich', 'immich-asset-789', user.id);

    const updated = testDb.prepare(`
      SELECT jp.*, tkp.provider, tkp.asset_id, tkp.owner_id
      FROM journey_photos jp JOIN trek_photos tkp ON tkp.id = jp.photo_id
      WHERE jp.id = ?
    `).get(photo!.id) as any;
    expect(updated.provider).toBe('immich');
    expect(updated.asset_id).toBe('immich-asset-789');
    expect(updated.owner_id).toBe(user.id);
  });
});

// -- updatePhoto ---------------------------------------------------------------

describe('updatePhoto', () => {
  it('JOURNEY-SVC-073: updates caption on photo', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = await svc.addPhoto(entry.id, user.id, '/uploads/caption-test.jpg', undefined, 'Old caption');

    const result = await svc.updatePhoto(photo!.id, user.id, { caption: 'New caption' });

    expect(result).not.toBeNull();
    expect(result!.caption).toBe('New caption');
  });

  it('JOURNEY-SVC-074: updates sort_order on photo', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = await svc.addPhoto(entry.id, user.id, '/uploads/sort-test.jpg');

    const result = await svc.updatePhoto(photo!.id, user.id, { sort_order: 10 });

    expect(result).not.toBeNull();
    expect(result!.sort_order).toBe(10);
  });

  it('JOURNEY-SVC-075: returns null for non-existent photo', async () => {
    const { user } = createUser(testDb);

    const result = await svc.updatePhoto(99999, user.id, { caption: 'Nope' });
    expect(result).toBeNull();
  });

  it('JOURNEY-SVC-076: returns photo unchanged when no fields provided', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = await svc.addPhoto(entry.id, user.id, '/uploads/noop-test.jpg', undefined, 'Stay');

    const result = await svc.updatePhoto(photo!.id, user.id, {});

    expect(result).not.toBeNull();
    expect(result!.caption).toBe('Stay');
  });

  it('JOURNEY-SVC-077: viewer cannot update photo', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');
    const entry = createJourneyEntry(testDb, journey.id, owner.id, { entry_date: '2026-03-01' });
    const photo = await svc.addPhoto(entry.id, owner.id, '/uploads/viewer-update.jpg');

    const result = await svc.updatePhoto(photo!.id, viewer.id, { caption: 'Hacked' });
    expect(result).toBeNull();
  });
});

// -- listUserTrips -------------------------------------------------------------

describe('listUserTrips', () => {
  it('JOURNEY-SVC-078: returns all user trips', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Trip A', start_date: '2026-01-01', end_date: '2026-01-03' });
    createTrip(testDb, user.id, { title: 'Trip B', start_date: '2026-02-01', end_date: '2026-02-03' });

    const trips = await svc.listUserTrips(user.id);

    expect(trips.length).toBe(2);
    // ordered by start_date DESC
    expect((trips[0] as any).title).toBe('Trip B');
    expect((trips[1] as any).title).toBe('Trip A');
  });

  it('JOURNEY-SVC-079: returns empty for user with no trips', async () => {
    const { user } = createUser(testDb);

    const trips = await svc.listUserTrips(user.id);

    expect(trips.length).toBe(0);
  });

  it('JOURNEY-SVC-080: does not return other users trips', async () => {
    const { user: user1 } = createUser(testDb);
    const { user: user2 } = createUser(testDb);
    createTrip(testDb, user1.id, { title: 'User1 Trip' });

    const trips = await svc.listUserTrips(user2.id);

    expect(trips.length).toBe(0);
  });
});

// -- Edge cases ----------------------------------------------------------------

describe('Edge cases', () => {
  it('JOURNEY-SVC-081: deleteEntry deletes photos along with the entry', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });
    const photo = await svc.addPhoto(entry.id, user.id, '/uploads/gallery-move.jpg');

    const result = await svc.deleteEntry(entry.id, user.id);
    expect(result).toBe(true);

    // Junction row must be gone (ON DELETE CASCADE from journey_entries).
    // Gallery row (journey_photos) is preserved — photo may belong to other entries.
    const junctionRow = testDb.prepare('SELECT * FROM journey_entry_photos WHERE entry_id = ?').get(entry.id) as any;
    expect(junctionRow).toBeUndefined();
  });

  it('JOURNEY-SVC-082: updateJourney can set cover_gradient', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const result = await svc.updateJourney(journey.id, user.id, { cover_gradient: 'linear-gradient(to right, #ff0000, #0000ff)' });

    expect(result).not.toBeNull();
    expect((result as any).cover_gradient).toBe('linear-gradient(to right, #ff0000, #0000ff)');
  });

  it('JOURNEY-SVC-083: updateJourney ignores unknown fields', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Original' });

    const result = await svc.updateJourney(journey.id, user.id, { bogus: 'field' } as any);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Original');
  });

  it('JOURNEY-SVC-084: createEntry stores tags and pros_cons as JSON', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const entry = await svc.createEntry(journey.id, user.id, {
      entry_date: '2026-03-10',
      tags: ['food', 'culture'],
      pros_cons: { pros: ['Great view'], cons: ['Expensive'] },
    });

    expect(entry).not.toBeNull();
    // Read raw from DB
    const raw = testDb.prepare('SELECT tags, pros_cons FROM journey_entries WHERE id = ?').get(entry!.id) as any;
    expect(JSON.parse(raw.tags)).toEqual(['food', 'culture']);
    expect(JSON.parse(raw.pros_cons)).toEqual({ pros: ['Great view'], cons: ['Expensive'] });
  });

  it('JOURNEY-SVC-085: updateEntry handles tags and pros_cons update', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-01' });

    const result = await svc.updateEntry(entry.id, user.id, {
      tags: ['beach', 'adventure'],
      pros_cons: { pros: ['Fun'], cons: [] },
    });

    expect(result).not.toBeNull();
    const raw = testDb.prepare('SELECT tags, pros_cons FROM journey_entries WHERE id = ?').get(entry.id) as any;
    expect(JSON.parse(raw.tags)).toEqual(['beach', 'adventure']);
    expect(JSON.parse(raw.pros_cons)).toEqual({ pros: ['Fun'], cons: [] });
  });

  // #1614 — photos live in journeys now. Linking a trip used to copy its
  // trip_photos into the gallery; that surface lost its UI in 3.1.0, nothing
  // writes to it on a newer install, and the copy was how a photo one member had
  // chosen not to share could reach a journey at all.
  it('JOURNEY-SVC-086: addTripToJourney no longer pulls trip photos into the gallery', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Photo Trip',
      start_date: '2026-04-01',
      end_date: '2026-04-03',
    });
    addTripPhoto(testDb, trip.id, user.id, 'immich-photo-1', 'immich', { shared: true });

    expect(await svc.addTripToJourney(journey.id, trip.id, user.id)).toBe(true);

    const photos = testDb.prepare('SELECT 1 FROM journey_photos WHERE journey_id = ?').all(journey.id);
    expect(photos).toHaveLength(0);
  });

  it('JOURNEY-SVC-087: removeTripFromJourney detaches filled entries, deletes skeletons', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Mixed Trip',
      start_date: '2026-04-01',
      end_date: '2026-04-03',
    });
    const place1 = createPlace(testDb, trip.id, { name: 'Skeleton Place' });
    const place2 = createPlace(testDb, trip.id, { name: 'Filled Place' });
    const days087 = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 2').all(trip.id) as { id: number }[];
    createDayAssignment(testDb, days087[0].id, place1.id);
    createDayAssignment(testDb, days087[1].id, place2.id);
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    // Promote one skeleton to a filled entry
    const filled = testDb.prepare(
      "SELECT id FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND type = 'skeleton'"
    ).get(journey.id, place2.id) as { id: number };
    await svc.updateEntry(filled.id, user.id, { story: 'Now filled!' });

    await svc.removeTripFromJourney(journey.id, trip.id, user.id);

    // skeleton for place1 should be deleted
    const skeletonRow = testDb.prepare(
      "SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?"
    ).get(journey.id, place1.id);
    expect(skeletonRow).toBeUndefined();

    // filled entry for place2 should be detached but still present
    const filledRow = testDb.prepare(
      "SELECT * FROM journey_entries WHERE id = ?"
    ).get(filled.id) as any;
    expect(filledRow).toBeDefined();
    expect(filledRow.source_trip_id).toBeNull();
    expect(filledRow.source_place_id).toBeNull();
  });
});

// -- Passphrase on addProviderPhoto -------------------------------------------

describe('addProviderPhoto — passphrase', () => {
  it('JOURNEY-SVC-088: addProviderPhoto with passphrase stores encrypted value on trek_photos', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-03-15' });

    const photo = await svc.addProviderPhoto(entry.id, user.id, 'synologyphotos', 'pp-asset-1', undefined, 'secret-pp');

    expect(photo).not.toBeNull();

    const row = testDb.prepare('SELECT passphrase FROM trek_photos WHERE provider = ? AND asset_id = ? AND owner_id = ?')
      .get('synologyphotos', 'pp-asset-1', user.id) as { passphrase: string | null } | undefined;
    expect(row?.passphrase).not.toBeNull();
    expect(typeof row?.passphrase).toBe('string');
    // stored value must be encrypted (not plaintext)
    expect(row?.passphrase).not.toBe('secret-pp');
  });
});

// -- reorderEntries (#846) ----------------------------------------------------

function insertEntry(journeyId: number, authorId: number, opts: { entry_date: string; entry_time?: string | null; sort_order?: number }): { id: number } {
  const now = Date.now();
  const res = testDb.prepare(`
    INSERT INTO journey_entries (journey_id, author_id, type, entry_date, entry_time, sort_order, visibility, created_at, updated_at)
    VALUES (?, ?, 'entry', ?, ?, ?, 'private', ?, ?)
  `).run(journeyId, authorId, opts.entry_date, opts.entry_time ?? null, opts.sort_order ?? 0, now, now);
  return { id: Number(res.lastInsertRowid) };
}

describe('reorderEntryPhotos (#824)', () => {
  function photoOn(journeyId: number, entryIds: number[], order = 0): number {
    const trek = testDb.prepare("INSERT INTO trek_photos (provider, file_path, created_at) VALUES ('local', '/p.jpg', ?)").run(Date.now()).lastInsertRowid;
    const gp = Number(testDb.prepare('INSERT INTO journey_photos (journey_id, photo_id, sort_order, created_at) VALUES (?, ?, 0, ?)').run(journeyId, trek, Date.now()).lastInsertRowid);
    for (const entryId of entryIds) testDb.prepare('INSERT INTO journey_entry_photos (entry_id, journey_photo_id, sort_order, created_at) VALUES (?, ?, ?, ?)').run(entryId, gp, order, Date.now());
    return gp;
  }
  const orderOf = (entryId: number) =>
    (testDb.prepare('SELECT journey_photo_id FROM journey_entry_photos WHERE entry_id = ? ORDER BY sort_order').all(entryId) as { journey_photo_id: number }[]).map(r => r.journey_photo_id);

  it('JOURNEY-SVC-089b: orders the photos of one entry and leaves the same photo elsewhere alone', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const a = insertEntry(journey.id, user.id, { entry_date: '2026-08-01' });
    const b = insertEntry(journey.id, user.id, { entry_date: '2026-08-02' });
    const p1 = photoOn(journey.id, [a.id, b.id], 0);
    const p2 = photoOn(journey.id, [a.id], 1);
    const p3 = photoOn(journey.id, [a.id], 2);
    expect(await svc.reorderEntryPhotos(a.id, user.id, [p3, p1, p2])).toBe(true);
    expect(orderOf(a.id)).toEqual([p3, p1, p2]);
    expect(testDb.prepare('SELECT sort_order FROM journey_entry_photos WHERE entry_id = ? AND journey_photo_id = ?').get(b.id, p1)).toEqual({ sort_order: 0 });
  });

  it('JOURNEY-SVC-089c: refuses a list that is not exactly the photos of the entry, and a stranger', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const a = insertEntry(journey.id, user.id, { entry_date: '2026-08-01' });
    const p1 = photoOn(journey.id, [a.id]);
    const p2 = photoOn(journey.id, [a.id]);
    const other = photoOn(journey.id, []);
    expect(await svc.reorderEntryPhotos(a.id, user.id, [p1])).toBe(false);
    expect(await svc.reorderEntryPhotos(a.id, user.id, [p1, other])).toBe(false);
    expect(await svc.reorderEntryPhotos(a.id, user.id, [p1, p1])).toBe(false);
    expect(await svc.reorderEntryPhotos(a.id, stranger.id, [p2, p1])).toBe(false);
    expect(await svc.reorderEntryPhotos(999999, user.id, [p2, p1])).toBe(false);
  });
});

describe('reorderEntries', () => {
  it('JOURNEY-SVC-089: reorder persists and listEntries returns requested order regardless of entry_time', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const e1 = insertEntry(journey.id, user.id, { entry_date: '2026-08-01', entry_time: '09:00', sort_order: 0 });
    const e2 = insertEntry(journey.id, user.id, { entry_date: '2026-08-01', entry_time: '14:00', sort_order: 1 });

    const ok = await svc.reorderEntries(journey.id, user.id, [e2.id, e1.id]);
    expect(ok).toBe(true);

    const entries = (await svc.listEntries(journey.id, user.id))!;
    const dayEntries = entries.filter(e => e.entry_date === '2026-08-01');
    expect(dayEntries.map(e => e.id)).toEqual([e2.id, e1.id]);
  });

  it('JOURNEY-SVC-090: reorderEntries rejects ids from another journey', async () => {
    const { user } = createUser(testDb);
    const j1 = createJourney(testDb, user.id);
    const j2 = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, j2.id, user.id, { entry_date: '2026-08-02' });

    const ok = await svc.reorderEntries(j1.id, user.id, [entry.id]);
    expect(ok).toBe(false);
  });

  it('JOURNEY-SVC-091: reorderEntries does not affect entries on other days', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const day1a = insertEntry(journey.id, user.id, { entry_date: '2026-08-01', sort_order: 0 });
    const day1b = insertEntry(journey.id, user.id, { entry_date: '2026-08-01', sort_order: 1 });
    const day2 = insertEntry(journey.id, user.id, { entry_date: '2026-08-02', sort_order: 0 });

    await svc.reorderEntries(journey.id, user.id, [day1b.id, day1a.id]);

    const entries = (await svc.listEntries(journey.id, user.id))!;
    const day2Entry = entries.find(e => e.id === day2.id)!;
    expect(day2Entry.sort_order).toBe(0);
  });
});

describe('syncTripPlaces sort_order', () => {
  it('JOURNEY-SVC-092: assigns unique sequential sort_order per date for same-day places', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Order Trip',
      start_date: '2026-09-01',
      end_date: '2026-09-02',
    });
    const day = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number };
    const p1 = createPlace(testDb, trip.id, { name: 'Place A' });
    const p2 = createPlace(testDb, trip.id, { name: 'Place B' });
    const p3 = createPlace(testDb, trip.id, { name: 'Place C' });
    createDayAssignment(testDb, day.id, p1.id);
    createDayAssignment(testDb, day.id, p2.id);
    createDayAssignment(testDb, day.id, p3.id);

    await svc.syncTripPlaces(journey.id, trip.id, user.id);

    const rows = testDb.prepare(
      'SELECT sort_order FROM journey_entries WHERE journey_id = ? ORDER BY sort_order ASC'
    ).all(journey.id) as { sort_order: number }[];
    const orders = rows.map(r => r.sort_order);
    expect(new Set(orders).size).toBe(orders.length);
    expect(orders).toEqual([0, 1, 2]);
  });
});

describe('onPlaceCreated sort_order', () => {
  it('JOURNEY-SVC-093: assigns MAX+1 sort_order when entries already exist on the target date', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Append Trip',
      start_date: '2026-10-01',
      end_date: '2026-10-02',
    });
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    const day = testDb.prepare('SELECT id, date FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number; date: string };
    insertEntry(journey.id, user.id, { entry_date: day.date, sort_order: 5 });

    const place = createPlace(testDb, trip.id, { name: 'Late Addition' });
    createDayAssignment(testDb, day.id, place.id);
    await svc.onPlaceCreated(trip.id, place.id);

    const newEntry = testDb.prepare(
      'SELECT sort_order FROM journey_entries WHERE journey_id = ? AND source_place_id = ?'
    ).get(journey.id, place.id) as { sort_order: number } | undefined;
    expect(newEntry).toBeDefined();
    expect(newEntry!.sort_order).toBe(6);
  });
});

// -- reconcileTripSkeletons ---------------------------------------------------

describe('reconcileTripSkeletons', () => {
  /** Link a fresh journey to a trip and return both. */
  async function linkedJourneyTrip() {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Reconcile Trip',
      start_date: '2026-05-01',
      end_date: '2026-05-03',
    });
    await svc.addTripToJourney(journey.id, trip.id, user.id);
    return { user, journey, trip };
  }

  function daysOf(tripId: number) {
    return testDb.prepare('SELECT id, date FROM days WHERE trip_id = ? ORDER BY date ASC').all(tripId) as {
      id: number;
      date: string;
    }[];
  }

  function skeletonFor(journeyId: number, placeId: number) {
    return testDb
      .prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?')
      .get(journeyId, placeId) as any;
  }

  it('JOURNEY-SVC-094: adds a skeleton for a newly assigned place', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'New Museum' });
    createDayAssignment(testDb, days[0].id, place.id);

    await svc.reconcileTripSkeletons(trip.id);

    const skeleton = skeletonFor(journey.id, place.id);
    expect(skeleton).toBeDefined();
    expect(skeleton.type).toBe('skeleton');
    expect(skeleton.title).toBe('New Museum');
    expect(skeleton.entry_date).toBe(days[0].date);
  });

  it('JOURNEY-SVC-095: removes a pure skeleton when its place is unassigned', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'To Remove' });
    const assignment = createDayAssignment(testDb, days[0].id, place.id);
    await svc.reconcileTripSkeletons(trip.id);
    expect(skeletonFor(journey.id, place.id)).toBeDefined();

    testDb.prepare('DELETE FROM day_assignments WHERE id = ?').run(assignment.id);
    await svc.reconcileTripSkeletons(trip.id);

    expect(skeletonFor(journey.id, place.id)).toBeUndefined();
  });

  it('JOURNEY-SVC-096: preserves a filled entry on unassign (detaches + notes it)', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Filled Place' });
    const assignment = createDayAssignment(testDb, days[0].id, place.id);
    await svc.reconcileTripSkeletons(trip.id);
    const skeleton = skeletonFor(journey.id, place.id);
    // Promote to a filled entry with content.
    testDb
      .prepare("UPDATE journey_entries SET type = 'entry', story = 'A wonderful visit' WHERE id = ?")
      .run(skeleton.id);

    testDb.prepare('DELETE FROM day_assignments WHERE id = ?').run(assignment.id);
    await svc.reconcileTripSkeletons(trip.id);

    const kept = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(skeleton.id) as any;
    expect(kept).toBeDefined();
    expect(kept.type).toBe('entry');
    expect(kept.source_place_id).toBeNull();
    expect(kept.source_trip_id).toBeNull();
    expect(kept.story).toContain('A wonderful visit');
    expect(kept.story).toContain('was removed from the trip plan');
  });

  it('JOURNEY-SVC-097: refreshes skeleton entry_date when a place is moved to another day', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Moving Place' });
    const assignment = createDayAssignment(testDb, days[0].id, place.id);
    await svc.reconcileTripSkeletons(trip.id);
    expect(skeletonFor(journey.id, place.id).entry_date).toBe(days[0].date);

    testDb.prepare('UPDATE day_assignments SET day_id = ? WHERE id = ?').run(days[1].id, assignment.id);
    await svc.reconcileTripSkeletons(trip.id);

    expect(skeletonFor(journey.id, place.id).entry_date).toBe(days[1].date);
  });

  it('JOURNEY-SVC-098: is idempotent — a second call makes no changes', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Stable Place' });
    createDayAssignment(testDb, days[0].id, place.id);
    await svc.reconcileTripSkeletons(trip.id);

    const before = testDb
      .prepare('SELECT id, updated_at FROM journey_entries WHERE journey_id = ? ORDER BY id')
      .all(journey.id) as { id: number; updated_at: number }[];
    await svc.reconcileTripSkeletons(trip.id);
    const after = testDb
      .prepare('SELECT id, updated_at FROM journey_entries WHERE journey_id = ? ORDER BY id')
      .all(journey.id) as { id: number; updated_at: number }[];

    expect(after).toEqual(before);
  });

  it('JOURNEY-SVC-099: no-ops when the trip is linked to no journey', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Unlinked', start_date: '2026-05-01', end_date: '2026-05-02' });
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Orphan' });
    createDayAssignment(testDb, days[0].id, place.id);

    await expect(svc.reconcileTripSkeletons(trip.id)).resolves.toBeUndefined();
    const anyEntry = testDb.prepare('SELECT COUNT(*) AS n FROM journey_entries').get() as { n: number };
    expect(anyEntry.n).toBe(0);
  });

  // -- M2 (task-5-review.md) — the sync engine's existence-check-then-insert
  // used to be two separate awaits, so two concurrent callers could both see
  // "not there yet" and both insert a skeleton for the same (place,
  // assignment). Races two REAL `await Promise.all([...])` callers through
  // the actual service on the shared connection, then asserts the base's
  // outcome: exactly one skeleton per (place, assignment), never two.
  describe('concurrency (M2) — exactly one skeleton per (place, assignment) under a race', () => {
    it('two concurrent reconcileTripSkeletons(trip) calls after two new assignments produce exactly one skeleton per place, not two', async () => {
      const { journey, trip } = await linkedJourneyTrip();
      const days = daysOf(trip.id);
      const placeA = createPlace(testDb, trip.id, { name: 'Race Place A' });
      const placeB = createPlace(testDb, trip.id, { name: 'Race Place B' });
      createDayAssignment(testDb, days[0].id, placeA.id);
      createDayAssignment(testDb, days[1].id, placeB.id);

      await Promise.all([
        svc.reconcileTripSkeletons(trip.id),
        svc.reconcileTripSkeletons(trip.id),
      ]);

      const countFor = (placeId: number) =>
        (testDb.prepare('SELECT COUNT(*) AS n FROM journey_entries WHERE journey_id = ? AND source_place_id = ?').get(journey.id, placeId) as { n: number }).n;
      expect(countFor(placeA.id)).toBe(1);
      expect(countFor(placeB.id)).toBe(1);
    });

    it('onPlaceCreated racing reconcileTripSkeletons for the same new assignment produces exactly one skeleton, not two', async () => {
      const { journey, trip } = await linkedJourneyTrip();
      const days = daysOf(trip.id);
      const place = createPlace(testDb, trip.id, { name: 'Race Place C' });
      createDayAssignment(testDb, days[0].id, place.id);

      await Promise.all([
        svc.onPlaceCreated(trip.id, place.id),
        svc.reconcileTripSkeletons(trip.id),
      ]);

      const count = (testDb.prepare('SELECT COUNT(*) AS n FROM journey_entries WHERE journey_id = ? AND source_place_id = ?').get(journey.id, place.id) as { n: number }).n;
      expect(count).toBe(1);
    });
  });
});

// -- the same place on two days (#2329) ---------------------------------------

describe('a place standing on more than one day', () => {
  async function linkedJourneyTrip() {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, {
      title: 'Repeat Trip',
      start_date: '2026-05-01',
      end_date: '2026-05-03',
    });
    await svc.addTripToJourney(journey.id, trip.id, user.id);
    return { user, journey, trip };
  }

  function daysOf(tripId: number) {
    return testDb.prepare('SELECT id, date FROM days WHERE trip_id = ? ORDER BY date ASC').all(tripId) as {
      id: number;
      date: string;
    }[];
  }

  function skeletonsFor(journeyId: number, placeId: number) {
    return testDb
      .prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ? ORDER BY entry_date ASC')
      .all(journeyId, placeId) as any[];
  }

  it('JOURNEY-SVC-REPEAT-001: syncTripPlaces writes one skeleton per day, not one per place', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { title: 'Two Nights', start_date: '2026-05-01', end_date: '2026-05-03' });
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Reykjavík' });
    createDayAssignment(testDb, days[0].id, place.id);
    createDayAssignment(testDb, days[1].id, place.id);

    await svc.syncTripPlaces(journey.id, trip.id, user.id);

    expect(skeletonsFor(journey.id, place.id).map((e) => e.entry_date)).toEqual([days[0].date, days[1].date]);
  });

  it('JOURNEY-SVC-REPEAT-002: a second call adds nothing', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { title: 'Idempotent', start_date: '2026-05-01', end_date: '2026-05-03' });
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Vík' });
    createDayAssignment(testDb, days[0].id, place.id);
    createDayAssignment(testDb, days[1].id, place.id);

    await svc.syncTripPlaces(journey.id, trip.id, user.id);
    await svc.syncTripPlaces(journey.id, trip.id, user.id);

    expect(skeletonsFor(journey.id, place.id)).toHaveLength(2);
  });

  it('JOURNEY-SVC-REPEAT-003: onPlaceCreated fires once per day the place already stands on', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Höfn' });
    createDayAssignment(testDb, days[1].id, place.id);
    createDayAssignment(testDb, days[2].id, place.id);

    await svc.onPlaceCreated(trip.id, place.id);

    expect(skeletonsFor(journey.id, place.id).map((e) => e.entry_date)).toEqual([days[1].date, days[2].date]);
  });

  it('JOURNEY-SVC-REPEAT-004: assigning the place to a second day adds a second entry and keeps the first', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Akureyri' });
    createDayAssignment(testDb, days[0].id, place.id);
    await svc.reconcileTripSkeletons(trip.id);
    const first = skeletonsFor(journey.id, place.id)[0];
    testDb.prepare("UPDATE journey_entries SET type = 'entry', story = 'Sunset' WHERE id = ?").run(first.id);

    createDayAssignment(testDb, days[1].id, place.id);
    await svc.reconcileTripSkeletons(trip.id);

    const both = skeletonsFor(journey.id, place.id);
    expect(both.map((e) => e.entry_date)).toEqual([days[0].date, days[1].date]);
    expect(both[0].id).toBe(first.id);
    expect(both[0].story).toBe('Sunset');
    expect(both[1].type).toBe('skeleton');
  });

  it('JOURNEY-SVC-REPEAT-005: unassigning one day drops only that day', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Selfoss' });
    createDayAssignment(testDb, days[0].id, place.id);
    const second = createDayAssignment(testDb, days[1].id, place.id);
    await svc.reconcileTripSkeletons(trip.id);
    expect(skeletonsFor(journey.id, place.id)).toHaveLength(2);

    testDb.prepare('DELETE FROM day_assignments WHERE id = ?').run(second.id);
    await svc.reconcileTripSkeletons(trip.id);

    expect(skeletonsFor(journey.id, place.id).map((e) => e.entry_date)).toEqual([days[0].date]);
  });

  it('JOURNEY-SVC-REPEAT-006: moving one of the two assignments moves its entry rather than replacing it', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Geysir' });
    createDayAssignment(testDb, days[0].id, place.id);
    const second = createDayAssignment(testDb, days[1].id, place.id);
    await svc.reconcileTripSkeletons(trip.id);
    const movedId = skeletonsFor(journey.id, place.id)[1].id;

    testDb.prepare('UPDATE day_assignments SET day_id = ? WHERE id = ?').run(days[2].id, second.id);
    await svc.reconcileTripSkeletons(trip.id);

    const after = skeletonsFor(journey.id, place.id);
    expect(after.map((e) => e.entry_date)).toEqual([days[0].date, days[2].date]);
    expect(after[1].id).toBe(movedId);
  });

  it('JOURNEY-SVC-REPEAT-007: editing the place leaves each entry on its own day', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Old Name' });
    createDayAssignment(testDb, days[0].id, place.id);
    createDayAssignment(testDb, days[1].id, place.id);
    await svc.reconcileTripSkeletons(trip.id);

    testDb.prepare('UPDATE places SET name = ? WHERE id = ?').run('New Name', place.id);
    await svc.onPlaceUpdated(place.id);

    const after = skeletonsFor(journey.id, place.id);
    expect(after.map((e) => e.entry_date)).toEqual([days[0].date, days[1].date]);
    expect(after.map((e) => e.title)).toEqual(['New Name', 'New Name']);
  });

  it('JOURNEY-SVC-REPEAT-008: an entry with no assignment link is claimed, not annotated out', async () => {
    const { journey, trip } = await linkedJourneyTrip();
    const days = daysOf(trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Legacy Stop' });
    createDayAssignment(testDb, days[0].id, place.id);
    await svc.reconcileTripSkeletons(trip.id);
    const legacy = skeletonsFor(journey.id, place.id)[0];
    // What an install upgraded from before the column existed looks like.
    testDb
      .prepare("UPDATE journey_entries SET source_assignment_id = NULL, type = 'entry', story = 'Kept' WHERE id = ?")
      .run(legacy.id);

    await svc.reconcileTripSkeletons(trip.id);

    const after = skeletonsFor(journey.id, place.id);
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe(legacy.id);
    expect(after[0].source_assignment_id).not.toBeNull();
    expect(after[0].story).toBe('Kept');
  });
});

// ---------------------------------------------------------------------------
// Skeleton lifecycle, the photo gallery and the per-user preference row. These
// paths were reachable only through the REST controller before the fold, so the
// service-level branches below had no direct case.
// ---------------------------------------------------------------------------

/** A trip with one day and one place assigned to it — the shape skeleton sync reads. */
function tripWithPlace(userId: number, opts: { name?: string; date?: string } = {}) {
  const trip = createTrip(testDb, userId);
  const day = createDay(testDb, trip.id, { date: opts.date ?? '2026-05-01' });
  const place = createPlace(testDb, trip.id, { name: opts.name ?? 'Fushimi Inari' });
  createDayAssignment(testDb, day.id, place.id);
  return { trip, day, place };
}

function skeletonsOf(journeyId: number) {
  return testDb
    .prepare("SELECT * FROM journey_entries WHERE journey_id = ? AND type = 'skeleton' ORDER BY id")
    .all(journeyId) as any[];
}

describe('skeleton sync', () => {
  it('JOURNEY-SVC-SKEL-001: linking a trip materialises one skeleton per assigned place', async () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    const skeletons = skeletonsOf(journey.id);
    expect(skeletons).toHaveLength(1);
    expect(skeletons[0].title).toBe('Fushimi Inari');
    expect(skeletons[0].source_place_id).toBe(place.id);
    expect(skeletons[0].source_trip_id).toBe(trip.id);
  });

  it('JOURNEY-SVC-SKEL-002: syncing the same trip twice does not duplicate skeletons', async () => {
    const { user } = createUser(testDb);
    const { trip } = tripWithPlace(user.id);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });
    await svc.syncTripPlaces(journey.id, trip.id, user.id);
    expect(skeletonsOf(journey.id)).toHaveLength(1);
  });

  it('JOURNEY-SVC-SKEL-003: onPlaceCreated adds a skeleton to every journey the trip is linked to', async () => {
    const { user } = createUser(testDb);
    const { trip, day } = tripWithPlace(user.id);
    const a = await svc.createJourney(user.id, { title: 'A', trip_ids: [trip.id] });
    const b = await svc.createJourney(user.id, { title: 'B', trip_ids: [trip.id] });

    const extra = createPlace(testDb, trip.id, { name: 'Nishiki Market' });
    createDayAssignment(testDb, day.id, extra.id);
    await svc.onPlaceCreated(trip.id, extra.id);

    for (const j of [a, b]) {
      expect(skeletonsOf(j.id).map((s) => s.title)).toContain('Nishiki Market');
    }
  });

  it('JOURNEY-SVC-SKEL-004: onPlaceCreated is a no-op for a trip in no journey', async () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    await expect(svc.onPlaceCreated(trip.id, place.id)).resolves.toBeUndefined();
  });

  it('JOURNEY-SVC-SKEL-005: onPlaceUpdated carries the rename and the new address onto the skeleton', async () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    testDb.prepare('UPDATE places SET name = ?, address = ? WHERE id = ?').run('Kinkaku-ji', '1 Kinkakujicho', place.id);
    await svc.onPlaceUpdated(place.id);

    const [skeleton] = skeletonsOf(journey.id);
    expect(skeleton.title).toBe('Kinkaku-ji');
    expect(skeleton.location_name).toBe('1 Kinkakujicho');
  });

  it('JOURNEY-SVC-SKEL-006: onPlaceUpdated is a no-op when no skeleton points at the place', async () => {
    const { user } = createUser(testDb);
    const { place } = tripWithPlace(user.id);
    await expect(svc.onPlaceUpdated(place.id)).resolves.toBeUndefined();
  });

  it('JOURNEY-SVC-SKEL-007: onPlaceDeleted drops an empty skeleton outright', async () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });
    expect(skeletonsOf(journey.id)).toHaveLength(1);

    await svc.onPlaceDeleted(place.id);
    expect(skeletonsOf(journey.id)).toHaveLength(0);
  });

  it('JOURNEY-SVC-SKEL-008: onPlaceDeleted keeps a skeleton that has a story, detaches it and appends the note', async () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });
    const [skeleton] = skeletonsOf(journey.id);
    testDb.prepare('UPDATE journey_entries SET story = ? WHERE id = ?').run('We queued for an hour.', skeleton.id);

    await svc.onPlaceDeleted(place.id);

    const kept = testDb.prepare('SELECT * FROM journey_entries WHERE id = ?').get(skeleton.id) as any;
    expect(kept).toBeDefined();
    expect(kept.source_place_id).toBeNull();
    expect(kept.source_trip_id).toBeNull();
    // A skeleton that survives is promoted to a real entry.
    expect(kept.type).toBe('entry');
    expect(kept.story).toContain('removed from the trip plan');
  });

  it('JOURNEY-SVC-SKEL-009: reconcileTripSkeletons adds what is missing and removes what is gone', async () => {
    const { user } = createUser(testDb);
    const { trip, day, place } = tripWithPlace(user.id);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    // A second place lands without firing the hook, and the first is unassigned.
    const second = createPlace(testDb, trip.id, { name: 'Gion' });
    createDayAssignment(testDb, day.id, second.id);
    testDb.prepare('DELETE FROM day_assignments WHERE place_id = ?').run(place.id);

    await svc.reconcileTripSkeletons(trip.id);

    const titles = skeletonsOf(journey.id).map((s) => s.title);
    expect(titles).toContain('Gion');
    expect(titles).not.toContain('Fushimi Inari');
  });

  it('JOURNEY-SVC-SKEL-010: reconcileTripSkeletons is a no-op for a trip in no journey', async () => {
    const { user } = createUser(testDb);
    const { trip } = tripWithPlace(user.id);
    await expect(svc.reconcileTripSkeletons(trip.id)).resolves.toBeUndefined();
  });

  it('JOURNEY-SVC-SKEL-011: createJourney takes its cover from the first linked trip and strips the /uploads prefix', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare('UPDATE trips SET cover_image = ? WHERE id = ?').run('/uploads/covers/kyoto.jpg', trip.id);

    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });
    const row = testDb.prepare('SELECT cover_image FROM journeys WHERE id = ?').get(journey.id) as any;
    expect(row.cover_image).toBe('covers/kyoto.jpg');
  });
});

describe('journey gallery', () => {
  async function ownedEntry() {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const entry = (await svc.createEntry(journey.id, user.id, { entry_date: '2026-05-01', title: 'Day 1' }))!;
    return { user, journey, entry };
  }

  it('JOURNEY-SVC-PHOTO-001: addPhoto puts the file in the gallery and links it to the entry', async () => {
    const { user, journey, entry } = await ownedEntry();
    const photo = await svc.addPhoto(entry.id, user.id, 'journey/a.jpg', 'journey/a-thumb.jpg', 'Torii');
    expect(photo).toBeTruthy();

    const entries = (await svc.listEntries(journey.id, user.id))!;
    expect(entries.find((e) => e.id === entry.id)!.photos).toHaveLength(1);
  });

  it('JOURNEY-SVC-PHOTO-002: addPhoto refuses an unknown entry and a non-editor', async () => {
    const { entry } = await ownedEntry();
    const { user: stranger } = createUser(testDb);
    expect(await svc.addPhoto(999999, 1, 'journey/a.jpg')).toBeNull();
    expect(await svc.addPhoto(entry.id, stranger.id, 'journey/a.jpg')).toBeNull();
  });

  it('JOURNEY-SVC-PHOTO-003: uploadGalleryPhotos appends in order and refuses a non-editor', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });

    const first = await svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/1.jpg' }]);
    const second = await svc.uploadGalleryPhotos(journey.id, user.id, [
      { path: 'journey/2.jpg', thumbnail: 'journey/2-t.jpg' },
      { path: 'journey/3.mp4', mediaType: 'video', durationMs: 4200 },
    ]);
    expect(first).toHaveLength(1);
    expect(second).toHaveLength(2);

    const orders = testDb
      .prepare('SELECT sort_order FROM journey_photos WHERE journey_id = ? ORDER BY sort_order')
      .all(journey.id) as any[];
    expect(orders.map((o) => o.sort_order)).toEqual([0, 1, 2]);

    expect(await svc.uploadGalleryPhotos(journey.id, stranger.id, [{ path: 'journey/x.jpg' }])).toEqual([]);
  });

  it('JOURNEY-SVC-PHOTO-004: linkPhotoToEntry attaches a gallery row, unlinkPhotoFromEntry detaches it', async () => {
    const { user, journey, entry } = await ownedEntry();
    const [gallery] = await svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/a.jpg' }]);

    expect(await svc.linkPhotoToEntry(entry.id, gallery.id, user.id)).toBeTruthy();
    expect((await svc.listEntries(journey.id, user.id))!.find((e) => e.id === entry.id)!.photos).toHaveLength(1);

    expect(await svc.unlinkPhotoFromEntry(entry.id, gallery.id, user.id)).toBe(true);
    expect((await svc.listEntries(journey.id, user.id))!.find((e) => e.id === entry.id)!.photos).toHaveLength(0);
    // The gallery row survives the unlink — that is the whole point of the split.
    expect(testDb.prepare('SELECT 1 FROM journey_photos WHERE id = ?').get(gallery.id)).toBeDefined();
  });

  it('JOURNEY-SVC-PHOTO-005: link/unlink refuse an unknown entry and a non-editor', async () => {
    const { user, journey, entry } = await ownedEntry();
    const { user: stranger } = createUser(testDb);
    const [gallery] = await svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/a.jpg' }]);

    expect(await svc.linkPhotoToEntry(999999, gallery.id, user.id)).toBeNull();
    expect(await svc.linkPhotoToEntry(entry.id, gallery.id, stranger.id)).toBeNull();
    expect(await svc.unlinkPhotoFromEntry(999999, gallery.id, user.id)).toBe(false);
    expect(await svc.unlinkPhotoFromEntry(entry.id, gallery.id, stranger.id)).toBe(false);
  });

  it('JOURNEY-SVC-PHOTO-006: deleteGalleryPhoto removes the row and refuses an unknown id', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const [gallery] = await svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/a.jpg' }]);

    expect(await svc.deleteGalleryPhoto(gallery.id, user.id)).toBeTruthy();
    expect(testDb.prepare('SELECT 1 FROM journey_photos WHERE id = ?').get(gallery.id)).toBeUndefined();
    expect(await svc.deleteGalleryPhoto(999999, user.id)).toBeNull();
  });

  it('JOURNEY-SVC-PHOTO-007: deleteGalleryPhoto refuses a non-editor', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const [gallery] = await svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/a.jpg' }]);
    expect(await svc.deleteGalleryPhoto(gallery.id, stranger.id)).toBeNull();
  });

  // #2200: the gallery used to come out in upload order, so pictures caught up
  // with after the trip landed behind the ones added while it was running.
  it('JOURNEY-SVC-PHOTO-008: the gallery reads in capture order, not upload order', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });

    const shot = async (path: string, takenAt: string) => {
      const [row] = await svc.uploadGalleryPhotos(journey.id, user.id, [{ path }]);
      testDb.prepare('UPDATE trek_photos SET taken_at = ? WHERE id = ?').run(takenAt, row.photo_id);
    };

    await shot('journey/day3.jpg', '2026-05-03T18:00:00.000Z');
    await shot('journey/day1.jpg', '2026-05-01T08:30:00.000Z');
    await shot('journey/day2.jpg', '2026-05-02T12:00:00.000Z');

    const gallery = (await svc.getJourneyFull(journey.id, user.id))!.gallery as { file_path: string }[];
    expect(gallery.map((p) => p.file_path)).toEqual([
      'journey/day1.jpg',
      'journey/day2.jpg',
      'journey/day3.jpg',
    ]);
  });

  it('JOURNEY-SVC-PHOTO-009: a photo with no capture time rides on the date of the stop it hangs on', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const day1 = (await svc.createEntry(journey.id, user.id, { entry_date: '2026-05-01', title: 'Day 1' }))!;
    const day2 = (await svc.createEntry(journey.id, user.id, { entry_date: '2026-05-02', title: 'Day 2' }))!;

    // Day two was sorted out first and day one caught up afterwards, with the
    // EXIF gone (an iPhone upload is converted before it leaves the browser).
    const [dayTwoPhoto] = await svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/day2.jpg' }]);
    const [dayOnePhoto] = await svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/day1.jpg' }]);
    const [loose] = await svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/loose.jpg' }]);
    await svc.linkPhotoToEntry(day2.id, dayTwoPhoto.id, user.id);
    await svc.linkPhotoToEntry(day1.id, dayOnePhoto.id, user.id);
    // Pin the loose photo's upload time so the run does not depend on today's date.
    testDb
      .prepare('UPDATE journey_photos SET created_at = ? WHERE id = ?')
      .run(Date.parse('2026-06-01T00:00:00Z'), loose.id);

    const gallery = (await svc.getJourneyFull(journey.id, user.id))!.gallery as { file_path: string }[];
    expect(gallery.map((p) => p.file_path)).toEqual([
      'journey/day1.jpg',
      'journey/day2.jpg',
      'journey/loose.jpg',
    ]);
  });
});

describe('per-user journey preferences', () => {
  it('JOURNEY-SVC-PREF-001: hide_skeletons round-trips for the owner', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    expect(await svc.updateJourneyPreferences(journey.id, user.id, { hide_skeletons: true })).toEqual({ hide_skeletons: true });
    expect(await svc.updateJourneyPreferences(journey.id, user.id, { hide_skeletons: false })).toEqual({ hide_skeletons: false });
  });

  it('JOURNEY-SVC-PREF-002: an empty patch is accepted and changes nothing', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    await svc.updateJourneyPreferences(journey.id, user.id, { hide_skeletons: true });
    expect(await svc.updateJourneyPreferences(journey.id, user.id, {})).toEqual({ hide_skeletons: true });
  });

  it('JOURNEY-SVC-PREF-003: a stranger gets null, not a row', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    expect(await svc.updateJourneyPreferences(journey.id, stranger.id, { hide_skeletons: true })).toBeNull();
  });
});

describe('entry enrichment', () => {
  it('JOURNEY-SVC-ENRICH-001: tags and pros_cons come back parsed, and source_trip_name is resolved', async () => {
    const { user } = createUser(testDb);
    const { trip } = tripWithPlace(user.id);
    testDb.prepare('UPDATE trips SET title = ? WHERE id = ?').run('Japan 2026', trip.id);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    const [skeleton] = skeletonsOf(journey.id);
    testDb
      .prepare('UPDATE journey_entries SET tags = ?, pros_cons = ? WHERE id = ?')
      .run(JSON.stringify(['shrine']), JSON.stringify({ pros: ['quiet'], cons: [] }), skeleton.id);

    const entry = (await svc.listEntries(journey.id, user.id))!.find((e) => e.id === skeleton.id)!;
    expect(entry.tags).toEqual(['shrine']);
    expect((entry as any).pros_cons).toEqual({ pros: ['quiet'], cons: [] });
    expect((entry as any).source_trip_name).toBe('Japan 2026');
  });

  it('JOURNEY-SVC-ENRICH-002: an entry with no trip and no tags gets [] and null, not undefined', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const created = (await svc.createEntry(journey.id, user.id, { entry_date: '2026-05-01', title: 'Solo' }))!;

    const entry = (await svc.listEntries(journey.id, user.id))!.find((e) => e.id === created.id)!;
    expect(entry.tags).toEqual([]);
    expect((entry as any).pros_cons).toBeNull();
    expect((entry as any).source_trip_name).toBeNull();
  });
});

// ── GPX tracks on the journey map (#1260) ─────────────────────────────────────
describe('journeyTracks', () => {
  /** A GPX import stores the geometry on the place, as JSON [lat, lng] pairs. */
  const withGeometry = (placeId: number, geometry: unknown, color: string | null = null) =>
    testDb
      .prepare('UPDATE places SET route_geometry = ?, route_color = ? WHERE id = ?')
      .run(typeof geometry === 'string' ? geometry : JSON.stringify(geometry), color, placeId);

  it('JOURNEY-SVC-TRACKS-001: returns the tracks of the trips the entries came from', async () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    withGeometry(place.id, [[35.1, 135.7], [35.2, 135.8]], '#ff0000');
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    const tracks = (await svc.journeyTracks(journey.id, user.id))!;
    expect(tracks).toHaveLength(1);
    expect(tracks[0]).toMatchObject({ place_id: place.id, trip_id: trip.id, color: '#ff0000' });
    expect(tracks[0].points).toEqual([[35.1, 135.7], [35.2, 135.8]]);
  });

  it('JOURNEY-SVC-TRACKS-002: keeps the elevation out and the pair in', async () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    // The importer keeps elevation as a third value where the file had it.
    withGeometry(place.id, [[47.1, 11.2, 1830], [47.2, 11.3, 1902]]);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    expect((await svc.journeyTracks(journey.id, user.id))![0].points).toEqual([[47.1, 11.2], [47.2, 11.3]]);
  });

  it('JOURNEY-SVC-TRACKS-003: a place without geometry contributes nothing', async () => {
    const { user } = createUser(testDb);
    const { trip } = tripWithPlace(user.id);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    expect(await svc.journeyTracks(journey.id, user.id)).toEqual([]);
  });

  it('JOURNEY-SVC-TRACKS-004: unusable geometry is skipped, not fatal', async () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    const second = createPlace(testDb, trip.id, { name: 'Good one' });
    withGeometry(place.id, 'not json at all');
    withGeometry(second.id, [[1, 2], [3, 4]]);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    const tracks = (await svc.journeyTracks(journey.id, user.id))!;
    expect(tracks.map(t => t.place_id)).toEqual([second.id]);
  });

  it('JOURNEY-SVC-TRACKS-005: a single point is a pin, not a line', async () => {
    const { user } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    withGeometry(place.id, [[35.1, 135.7]]);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    expect(await svc.journeyTracks(journey.id, user.id)).toEqual([]);
  });

  it('JOURNEY-SVC-TRACKS-006: a stranger gets null, not another user route', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const { trip, place } = tripWithPlace(user.id);
    withGeometry(place.id, [[1, 2], [3, 4]]);
    const journey = await svc.createJourney(user.id, { title: 'J', trip_ids: [trip.id] });

    expect(await svc.journeyTracks(journey.id, stranger.id)).toBeNull();
  });
});

// ── Trip linking: whose journey, and whose photos (#1614 review) ─────────────

describe('addTripToJourney guards', () => {
  it('JOURNEY-SVC-100: refuses to link into a journey the caller cannot reach', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, owner.id, { title: "Owner's journey" });
    const trip = createTrip(testDb, stranger.id, { title: 'Stranger trip' });

    // The stranger owns the trip, so the trip gate passes — only the journey gate stops this.
    expect(await svc.addTripToJourney(journey.id, trip.id, stranger.id)).toBe(false);
    const links = testDb.prepare('SELECT * FROM journey_trips WHERE journey_id = ?').all(journey.id);
    expect(links).toHaveLength(0);
  });

  it('JOURNEY-SVC-101: a contributor may still link, the owner obviously too', async () => {
    const { user: owner } = createUser(testDb);
    const { user: helper } = createUser(testDb);
    const journey = createJourney(testDb, owner.id, { title: 'Shared journey' });
    testDb.prepare('INSERT INTO journey_contributors (journey_id, user_id, role, added_at) VALUES (?, ?, ?, ?)')
      .run(journey.id, helper.id, 'editor', new Date().toISOString());
    const trip = createTrip(testDb, helper.id, { title: 'Helper trip' });

    expect(await svc.addTripToJourney(journey.id, trip.id, helper.id)).toBe(true);
  });

  it('JOURNEY-SVC-102: not even a shared trip photo is copied any more', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id, { title: 'Photo journey' });
    const trip = createTrip(testDb, user.id, { title: 'Photo trip' });

    const r = testDb.prepare(
      "INSERT INTO trek_photos (provider, asset_id, owner_id, media_type) VALUES ('immich', 'shared-asset', ?, 'image')",
    ).run(user.id);
    testDb.prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, 1)')
      .run(trip.id, user.id, Number(r.lastInsertRowid));

    await svc.addTripToJourney(journey.id, trip.id, user.id);

    expect(testDb.prepare('SELECT 1 FROM journey_photos WHERE journey_id = ?').all(journey.id)).toHaveLength(0);
  });
});

// -- Dismissing a suggestion (discussion #2299) --------------------------------

describe('dismissed suggestions', () => {
  it('JOURNEY-SVC-103: a dismissed suggestion leaves every read but keeps its row', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const keep = createJourneyEntry(testDb, journey.id, user.id, { type: 'skeleton', title: 'Museum' });
    const drop = createJourneyEntry(testDb, journey.id, user.id, { type: 'skeleton', title: 'Aquarium' });

    await svc.updateEntry(drop.id, user.id, { dismissed: true });

    const full = (await svc.getJourneyFull(journey.id, user.id))!;
    expect(full.entries.map((e: { id: number }) => e.id)).toEqual([keep.id]);
    expect((await svc.listEntries(journey.id, user.id))!.map((e) => e.id)).toEqual([keep.id]);
    // The row has to survive, or syncTripPlaces offers the same place again.
    expect(testDb.prepare('SELECT dismissed FROM journey_entries WHERE id = ?').get(drop.id)).toEqual({
      dismissed: 1,
    });
  });

  it('JOURNEY-SVC-104: the journey reports how many were dismissed', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const a = createJourneyEntry(testDb, journey.id, user.id, { type: 'skeleton' });
    const b = createJourneyEntry(testDb, journey.id, user.id, { type: 'skeleton' });
    createJourneyEntry(testDb, journey.id, user.id, { type: 'skeleton' });

    await svc.updateEntry(a.id, user.id, { dismissed: true });
    await svc.updateEntry(b.id, user.id, { dismissed: true });

    expect((await svc.getJourneyFull(journey.id, user.id))!.dismissed_count).toBe(2);
  });

  it('JOURNEY-SVC-105: a dismissed place is not offered again by the trip sync', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { day_number: 1, date: '2026-01-15' });
    const place = createPlace(testDb, trip.id, { name: 'Aquarium' });
    createDayAssignment(testDb, day.id, place.id);

    await svc.addTripToJourney(journey.id, trip.id, user.id);
    const skeleton = (await svc.listEntries(journey.id, user.id))!.find((e) => e.type === 'skeleton')!;
    await svc.updateEntry(skeleton.id, user.id, { dismissed: true });

    await svc.syncTripPlaces(journey.id, trip.id, user.id);

    expect((await svc.listEntries(journey.id, user.id))!.filter((e) => e.type === 'skeleton')).toHaveLength(0);
  });

  it('JOURNEY-SVC-106: restoring brings them all back and says how many', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const a = createJourneyEntry(testDb, journey.id, user.id, { type: 'skeleton' });
    const b = createJourneyEntry(testDb, journey.id, user.id, { type: 'skeleton' });
    await svc.updateEntry(a.id, user.id, { dismissed: true });
    await svc.updateEntry(b.id, user.id, { dismissed: true });

    expect(await svc.restoreDismissedSuggestions(journey.id, user.id)).toEqual({ restored: 2 });
    expect(await svc.listEntries(journey.id, user.id)).toHaveLength(2);
  });

  it('JOURNEY-SVC-107: restoring nothing is not an error', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    expect(await svc.restoreDismissedSuggestions(journey.id, user.id)).toEqual({ restored: 0 });
  });

  it('JOURNEY-SVC-108: a viewer may not restore', async () => {
    const { user: owner } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');

    expect(await svc.restoreDismissedSuggestions(journey.id, viewer.id)).toBeNull();
  });
});

// -- The country behind an entry's coordinates ---------------------------------

describe('country_code', () => {
  it('JOURNEY-SVC-109: a created entry resolves its country from its coordinates', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const entry = (await svc.createEntry(journey.id, user.id, {
      entry_date: '2026-01-15',
      location_lat: 52.52,
      location_lng: 13.405,
    }))!;

    expect(entry.country_code).toBe('DE');
  });

  it('JOURNEY-SVC-110: an entry with no coordinates has no country', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const entry = (await svc.createEntry(journey.id, user.id, { entry_date: '2026-01-15' }))!;

    expect(entry.country_code).toBeNull();
  });

  it('JOURNEY-SVC-111: moving the pin moves the country with it', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = (await svc.createEntry(journey.id, user.id, {
      entry_date: '2026-01-15',
      location_lat: 52.52,
      location_lng: 13.405,
    }))!;

    const moved = (await svc.updateEntry(entry.id, user.id, { location_lat: 48.8584, location_lng: 2.2945 }))!;

    expect(moved.country_code).toBe('FR');
  });

  it('JOURNEY-SVC-112: taking the pin off clears the country', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = (await svc.createEntry(journey.id, user.id, {
      entry_date: '2026-01-15',
      location_lat: 52.52,
      location_lng: 13.405,
    }))!;

    const cleared = (await svc.updateEntry(entry.id, user.id, {
      location_lat: null as unknown as number,
      location_lng: null as unknown as number,
    }))!;

    expect(cleared.country_code).toBeNull();
  });

  it('JOURNEY-SVC-114: a place that moves across a border moves its skeleton entry country too', async () => {
    // The pin can also move without anybody editing the entry: the place it came
    // from is dragged, and the trip sync writes the new coordinates onto the
    // skeleton. The flag has to follow that write like it follows a manual one.
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { title: 'Border', start_date: '2026-08-01', end_date: '2026-08-03' });
    const place = createPlace(testDb, trip.id, { name: 'Grenzstein', lat: 48.8584, lng: 2.2945 });
    const day = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number };
    createDayAssignment(testDb, day.id, place.id);
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    const before = testDb.prepare(
      "SELECT country_code FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND type = 'skeleton'"
    ).get(journey.id, place.id) as { country_code: string | null };
    expect(before.country_code).toBe('FR');

    testDb.prepare('UPDATE places SET lat = ?, lng = ? WHERE id = ?').run(52.52, 13.405, place.id);
    await svc.onPlaceUpdated(place.id);

    const after = testDb.prepare(
      "SELECT country_code FROM journey_entries WHERE journey_id = ? AND source_place_id = ? AND type = 'skeleton'"
    ).get(journey.id, place.id) as { country_code: string | null };
    expect(after.country_code).toBe('DE');
  });

  it('JOURNEY-SVC-115: and so does a filled entry, whose location follows the place silently', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { title: 'Border 2', start_date: '2026-08-01', end_date: '2026-08-03' });
    const place = createPlace(testDb, trip.id, { name: 'Grenzstein', lat: 48.8584, lng: 2.2945 });
    const day = testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY date ASC LIMIT 1').get(trip.id) as { id: number };
    createDayAssignment(testDb, day.id, place.id);
    await svc.addTripToJourney(journey.id, trip.id, user.id);
    // Writing a story turns the skeleton into a filled entry.
    testDb.prepare("UPDATE journey_entries SET type = 'entry' WHERE source_place_id = ?").run(place.id);

    testDb.prepare('UPDATE places SET lat = ?, lng = ? WHERE id = ?').run(52.52, 13.405, place.id);
    await svc.onPlaceUpdated(place.id);

    const after = testDb.prepare(
      'SELECT country_code, location_lat FROM journey_entries WHERE source_place_id = ?'
    ).get(place.id) as { country_code: string | null; location_lat: number };
    expect(after).toMatchObject({ country_code: 'DE', location_lat: 52.52 });
  });

  it('JOURNEY-SVC-113: an edit that does not touch the pin leaves the country alone', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = (await svc.createEntry(journey.id, user.id, {
      entry_date: '2026-01-15',
      location_lat: 52.52,
      location_lng: 13.405,
    }))!;

    const renamed = (await svc.updateEntry(entry.id, user.id, { title: 'Berlin' }))!;

    expect(renamed.country_code).toBe('DE');
  });
});

// -- Which optional fields a journey keeps -------------------------------------

describe('entry field switches', () => {
  it('JOURNEY-SVC-114: a fresh journey keeps all three', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    const row = (await svc.getJourneyFull(journey.id, user.id))! as unknown as Record<string, number>;

    expect([row.show_verdict, row.show_mood, row.show_weather]).toEqual([1, 1, 1]);
  });

  it('JOURNEY-SVC-115: the owner can put one away, and booleans reach the INTEGER column', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);

    await svc.updateJourney(journey.id, user.id, { show_mood: false, show_weather: false });

    const row = (await svc.getJourneyFull(journey.id, user.id))! as unknown as Record<string, number>;
    expect([row.show_verdict, row.show_mood, row.show_weather]).toEqual([1, 0, 0]);
  });

  it('JOURNEY-SVC-116: an editor may not reshape the journey', async () => {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');

    expect(await svc.updateJourney(journey.id, editor.id, { show_mood: false })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Plan 3g Task 1 — repository parity + mutation proofs (R9's brief: "this is
// the bulk of this task's actual work"). Everything above this line is the
// pre-existing suite, exercised unchanged against the converted service
// (only the construction block at the very top of this file changed). These
// new cases go straight at the four repositories built this task
// (`journeysRepoDirect`/`contributorsRepoDirect`/`journeyTripsRepoDirect`/
// `entriesRepoDirect`, captured in the shared `beforeAll` above) rather than
// only through `svc`, so each converted read model gets its own byte-level
// proof against the exact legacy statement text (plan3g-sql-inventory.md
// §1a-§1d), not just an outcome-level assertion through the service.
// ---------------------------------------------------------------------------

describe('Plan 3g Task 1 — repository parity (full-key toEqual against the legacy statement)', () => {
  /**
   * A fully-seeded journey: an owner plus BOTH contributor roles (editor and
   * viewer), one linked trip with places on two days, one place standing on
   * BOTH days (#2329's multi-day skeleton case), and one place whose skeleton
   * was filled in with a story and THEN removed from the trip (the
   * detach-and-annotate path, exercised via the real `onPlaceDeleted`).
   */
  async function seedFullJourney() {
    const { user: owner } = createUser(testDb);
    const { user: editor } = createUser(testDb);
    const { user: viewer } = createUser(testDb);
    const journey = createJourney(testDb, owner.id, { title: 'Parity Journey' });
    addJourneyContributor(testDb, journey.id, editor.id, 'editor');
    addJourneyContributor(testDb, journey.id, viewer.id, 'viewer');

    const trip = createTrip(testDb, owner.id, {
      title: 'Parity Trip', start_date: '2026-05-01', end_date: '2026-05-03',
    });
    const day1 = createDay(testDb, trip.id, { date: '2026-05-01' });
    const day2 = createDay(testDb, trip.id, { date: '2026-05-02' });
    const multiDayPlace = createPlace(testDb, trip.id, { name: 'Hotel Nordic', lat: 60.39, lng: 5.32 });
    createDayAssignment(testDb, day1.id, multiDayPlace.id);
    createDayAssignment(testDb, day2.id, multiDayPlace.id);
    const singleDayPlace = createPlace(testDb, trip.id, { name: 'Fish Market', lat: 60.4, lng: 5.31 });
    createDayAssignment(testDb, day1.id, singleDayPlace.id);

    await svc.addTripToJourney(journey.id, trip.id, owner.id);

    // Fill in one of the skeletons, then run the `onPlaceDeleted` hook for its
    // place — the entry must survive, detached and annotated, per that
    // method's has-content branch. Matches JOURNEY-SVC-SKEL-008's own
    // ordering precedent (the hook runs against the still-existing place
    // row — the places domain's own row delete is a separate statement the
    // hook does not itself issue or depend on).
    const filledSkeleton = testDb
      .prepare('SELECT id FROM journey_entries WHERE source_place_id = ? LIMIT 1')
      .get(singleDayPlace.id) as { id: number };
    testDb.prepare("UPDATE journey_entries SET type = 'entry', story = 'Great fish' WHERE id = ?").run(filledSkeleton.id);
    await svc.onPlaceDeleted(singleDayPlace.id);
    // The place is now actually removed from the trip (the hook already
    // detached the entry, so this cascade touches nothing left referencing it).
    testDb.prepare('DELETE FROM day_assignments WHERE place_id = ?').run(singleDayPlace.id);
    testDb.prepare('DELETE FROM places WHERE id = ?').run(singleDayPlace.id);

    return { owner, editor, viewer, journey, trip, day1, day2, multiDayPlace, singleDayPlace };
  }

  it('the detached, annotated entry survives the place removal (fixture sanity check)', async () => {
    const { journey } = await seedFullJourney();

    const entries = await entriesRepoDirect.listForJourney(journey.id);
    const detached = entries.find((e) => e.location_name === 'Fish Market');

    expect(detached).toBeDefined();
    expect(detached!.source_place_id).toBeNull();
    expect(detached!.source_trip_id).toBeNull();
    expect(detached!.type).toBe('entry');
    expect(detached!.story).toContain('Great fish');
    expect(detached!.story).toContain('removed from the trip plan');
  });

  it('JourneysRepository.listForUser (JG8) matches the legacy statement, full row and order', async () => {
    const { owner } = await seedFullJourney();
    // A second, unrelated journey so the WHERE/ORDER BY have something to discriminate.
    createJourney(testDb, owner.id, { title: 'Second Journey' });

    const legacy = testDb
      .prepare(
        `
      SELECT DISTINCT j.*,
        (SELECT COUNT(*) FROM journey_entries je WHERE je.journey_id = j.id AND je.type != 'skeleton') as entry_count,
        (SELECT COUNT(*) FROM journey_photos jp WHERE jp.journey_id = j.id) as photo_count,
        (SELECT COUNT(DISTINCT je3.location_name) FROM journey_entries je3 WHERE je3.journey_id = j.id AND je3.location_name IS NOT NULL AND je3.location_name != '') as place_count,
        (SELECT MIN(t.start_date) FROM journey_trips jt JOIN trips t ON jt.trip_id = t.id WHERE jt.journey_id = j.id) as trip_date_min,
        (SELECT MAX(t.end_date) FROM journey_trips jt JOIN trips t ON jt.trip_id = t.id WHERE jt.journey_id = j.id) as trip_date_max
      FROM journeys j
      LEFT JOIN journey_contributors jc ON j.id = jc.journey_id AND jc.user_id = ?
      WHERE j.user_id = ? OR jc.user_id = ?
      ORDER BY j.updated_at DESC
    `,
      )
      .all(owner.id, owner.id, owner.id);

    const converted = await journeysRepoDirect.listForUser(owner.id);
    expect(converted).toEqual(legacy);
  });

  it("JourneyContributorsRepository.listForJourney (JG18) matches the legacy statement — owner, editor AND viewer all present", async () => {
    const { journey } = await seedFullJourney();

    const legacy = testDb
      .prepare(
        `
      SELECT jc.journey_id, jc.user_id, jc.role, jc.added_at, u.username, u.avatar
      FROM journey_contributors jc JOIN users u ON jc.user_id = u.id
      WHERE jc.journey_id = ? ORDER BY jc.added_at
    `,
      )
      .all(journey.id);

    const converted = await contributorsRepoDirect.listForJourney(journey.id);
    expect(converted).toEqual(legacy);
    expect(converted.map((c) => c.role).sort()).toEqual(['editor', 'owner', 'viewer']);
  });

  it('JourneyTripsRepository.listForJourney (JG17) matches the legacy statement', async () => {
    const { journey } = await seedFullJourney();

    const legacy = testDb
      .prepare(
        `
      SELECT jt.trip_id, jt.added_at, t.title, t.start_date, t.end_date, t.cover_image, t.currency,
        (SELECT COUNT(*) FROM places WHERE trip_id = t.id) as place_count
      FROM journey_trips jt JOIN trips t ON jt.trip_id = t.id
      WHERE jt.journey_id = ? ORDER BY t.start_date ASC
    `,
      )
      .all(journey.id);

    const converted = await journeyTripsRepoDirect.listForJourney(journey.id);
    expect(converted).toEqual(legacy);
  });

  it('JourneyEntriesRepository.listForJourney (JG14) matches the legacy statement', async () => {
    const { journey } = await seedFullJourney();

    const legacy = testDb
      .prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND dismissed = 0 ORDER BY entry_date ASC, sort_order ASC, id ASC')
      .all(journey.id);

    const converted = await entriesRepoDirect.listForJourney(journey.id);
    expect(converted).toEqual(legacy);
  });

  it('JourneyTripsRepository.listAssignedPlacesForTrip (JG34) matches the legacy projection, including a place standing on two days (#2329)', async () => {
    const { trip, multiDayPlace } = await seedFullJourney();

    const legacy = (
      testDb
        .prepare(
          `
        SELECT p.*, da.id AS assignment_id, da.day_id, d.date as day_date, da.assignment_time, da.assignment_end_time, d.day_number
        FROM places p
        INNER JOIN day_assignments da ON da.place_id = p.id
        INNER JOIN days d ON da.day_id = d.id
        WHERE p.trip_id = ?
        ORDER BY d.day_number ASC, da.order_index ASC
      `,
        )
        .all(trip.id) as { id: number; name: string; address: string | null; lat: number | null; lng: number | null; place_time: string | null; assignment_id: number; day_date: string | null; assignment_time: string | null }[]
    ).map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
      place_time: r.place_time,
      assignment_id: r.assignment_id,
      day_date: r.day_date,
      assignment_time: r.assignment_time,
    }));

    const converted = await journeyTripsRepoDirect.listAssignedPlacesForTrip(trip.id);
    expect(converted).toEqual(legacy);
    // The multi-day place appears twice — once per assignment — proving #2329's
    // one-skeleton-per-assignment shape survives the conversion at the read layer.
    expect(converted.filter((r) => r.id === multiDayPlace.id)).toHaveLength(2);
  });
});

// M5d (task-5-review.md) — Task 2's read models had no full-key parity
// tests: mutations dropping `lng` from JG15 (M19) and from JG19's gallery
// read (M20) stayed green. Ported from the reviewer's own probe
// (`scratchpad/r3g/probe/zz-r3g-parity-probe.test.ts`, which the review
// names as the template), turned from console.log(OK/DIFF) reports into
// real `toEqual` assertions against the legacy statement run raw on the
// SAME seeded rows. One journey seeded with every tier this plan's read
// models touch: dated + undated trips, a multi-day place, an unattached
// gallery photo, ties on `sort_order`/`taken_at`, a video (excluded from
// the "photograph per stop" read), a dismissed entry, and a second,
// unrelated journey's photo (must never leak in).
describe('Plan 3g Task 2 — repository parity (full-key toEqual against the legacy statement, M5d)', () => {
  async function seedParityJourney() {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const d = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    const t1 = createTrip(testDb, owner.id, { title: 'T1', start_date: '2026-01-01', end_date: '2026-01-03' });
    const t2 = createTrip(testDb, owner.id, { title: 'T2 undated' });
    const t3 = createTrip(testDb, member.id, { title: 'T3 recent', start_date: d(10), end_date: d(5) });
    const t4 = createTrip(testDb, owner.id, { title: 'T4 recent', start_date: d(12), end_date: d(2) });
    testDb.prepare('INSERT INTO trip_members (trip_id, user_id) VALUES (?, ?)').run(t3.id, owner.id);
    const days = testDb.prepare('SELECT id, date FROM days WHERE trip_id = ? ORDER BY date').all(t1.id) as { id: number }[];
    const pA = createPlace(testDb, t1.id, { name: 'A' });
    const pB = createPlace(testDb, t1.id, { name: 'B', lat: 1, lng: 2 });
    createPlace(testDb, t1.id, { name: 'C unassigned' });
    const pD = createPlace(testDb, t2.id, { name: 'D' });
    testDb.prepare("UPDATE places SET route_geometry = '[[1,2],[3,4]]', route_color = '#f00' WHERE id IN (?, ?)").run(pA.id, pD.id);
    createDayAssignment(testDb, days[1].id, pA.id);
    createDayAssignment(testDb, days[0].id, pA.id);
    createDayAssignment(testDb, days[0].id, pB.id);
    createDayAssignment(testDb, days[2].id, pB.id, { order_index: 0 });
    const place4 = createPlace(testDb, t4.id, { name: 'X' });
    const d4 = createDay(testDb, t4.id, { date: d(3) });
    createDayAssignment(testDb, d4.id, place4.id);
    const journey = createJourney(testDb, owner.id);
    for (const tid of [t1.id, t2.id]) {
      testDb.prepare('INSERT INTO journey_trips (journey_id, trip_id, added_at) VALUES (?,?,1)').run(journey.id, tid);
      await svc.syncTripPlaces(journey.id, tid, owner.id);
    }
    const now = Date.now();
    const ins = testDb.prepare(
      `INSERT INTO journey_entries (journey_id, author_id, type, title, story, entry_date, entry_time, location_name, location_lat, location_lng, sort_order, created_at, updated_at, stats_excluded, dismissed) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    );
    const e1 = Number(ins.run(journey.id, owner.id, 'entry', 'E1', 's', '2026-01-02', '10:00', 'Paris', 48.8, 2.3, 0, now, now, 0, 0).lastInsertRowid);
    const e2 = Number(ins.run(journey.id, owner.id, 'entry', 'E2', null, '2026-01-02', '', null, null, null, 0, now, now, 1, 0).lastInsertRowid);
    const e3 = Number(ins.run(journey.id, owner.id, 'entry', 'E3 dismissed', null, '2026-01-01', null, 'X', null, null, 1, now, now, 0, 1).lastInsertRowid);
    const e4 = Number(ins.run(journey.id, owner.id, 'entry', 'E4', null, '2025-12-31', null, 'Paris', 1, 1, 5, now, now, 0, 0).lastInsertRowid);
    const tp = testDb.prepare(
      `INSERT INTO trek_photos (provider, asset_id, owner_id, file_path, thumbnail_path, width, height, media_type, taken_at, lat, lng) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    );
    const gp = testDb.prepare(`INSERT INTO journey_photos (journey_id, photo_id, caption, shared, sort_order, provider, asset_id, owner_id, created_at) VALUES (?,?,?,?,?,?,?,?,?)`);
    const jep = testDb.prepare(`INSERT INTO journey_entry_photos (entry_id, journey_photo_id, sort_order, created_at) VALUES (?,?,?,?)`);
    // taken_at/media_type combinations: null, empty string, two ties at the
    // same taken_at (one video — excluded from listFirstPhotoPerEntry), and
    // a null media_type (treated as 'image').
    const specs: [string | null, string | null][] = [
      [null, 'image'], ['', 'image'], ['2026-01-02T08:00:00', 'image'], ['2026-01-02T08:00:00', 'video'],
      [null, 'image'], ['', null], [null, 'image'],
    ];
    const gids: number[] = [];
    specs.forEach(([taken, mt], i) => {
      const pid = Number(
        tp.run('local', null, owner.id, `f${i}.jpg`, i % 2 ? null : `t${i}.jpg`, 100, i % 3 ? null : 50, mt ?? 'image', taken, i % 2 ? 1.5 : null, i % 2 ? 2.5 : null).lastInsertRowid,
      );
      gids.push(Number(gp.run(journey.id, pid, i % 2 ? `cap${i}` : null, i % 2, i % 3, null, null, null, 1700000000000 + (i % 4) * 1000).lastInsertRowid));
    });
    jep.run(e1, gids[0], 0, now); jep.run(e1, gids[1], 0, now); jep.run(e1, gids[2], 0, now);
    jep.run(e2, gids[0], 1, now); jep.run(e2, gids[3], 0, now);
    jep.run(e4, gids[5], 2, now); jep.run(e4, gids[4], 2, now);
    jep.run(e3, gids[6], 0, now);
    // An unrelated journey's photo — must never leak into this journey's reads.
    const other = createJourney(testDb, member.id);
    const opid = Number(tp.run('local', null, member.id, 'o.jpg', null, null, null, 'image', null, null, null).lastInsertRowid);
    gp.run(other.id, opid, null, 0, 0, null, null, null, 1);

    return { owner, member, journey };
  }

  const LEG = {
    JG15: `SELECT gp.id, jep.entry_id, gp.photo_id, gp.caption, jep.sort_order, gp.shared, gp.created_at,
      tp.provider, tp.asset_id, tp.owner_id, tp.file_path, tp.thumbnail_path, tp.width, tp.height,
      tp.media_type, tp.duration_ms, tp.taken_at, tp.lat, tp.lng FROM journey_entry_photos jep
      JOIN journey_photos gp ON gp.id  = jep.journey_photo_id
      JOIN trek_photos    tp ON tp.id  = gp.photo_id WHERE jep.entry_id IN (SELECT id FROM journey_entries WHERE journey_id = ?) ORDER BY jep.sort_order ASC`,
    JG19: `SELECT gp.id, gp.journey_id, gp.photo_id, gp.caption, gp.shared, gp.sort_order, gp.created_at,
      tp.provider, tp.asset_id, tp.owner_id, tp.file_path, tp.thumbnail_path, tp.width, tp.height,
      tp.media_type, tp.duration_ms, tp.taken_at, tp.lat, tp.lng FROM journey_photos gp JOIN trek_photos tp ON tp.id = gp.photo_id WHERE gp.journey_id = ? ${GALLERY_CHRONOLOGICAL_ORDER}`,
    STATS_ENTRIES: `SELECT id, title, location_name, location_lat, location_lng, entry_date, source_trip_id, source_place_id, stats_excluded FROM journey_entries WHERE journey_id = ? AND dismissed = 0 ORDER BY entry_date ASC, sort_order ASC, id ASC`,
    STATS_TRIPS: `SELECT t.id, t.title, t.start_date AS start, t.end_date AS end FROM journey_trips jt JOIN trips t ON t.id = jt.trip_id WHERE jt.journey_id = ? ORDER BY t.start_date IS NULL, t.start_date ASC, t.id ASC`,
    STATS_PLACES: `SELECT p.id, p.name, p.lat, p.lng, p.trip_id AS tripId, MIN(d.date) AS day, MIN(da.order_index) AS ord FROM journey_trips jt JOIN places p ON p.trip_id = jt.trip_id LEFT JOIN day_assignments da ON da.place_id = p.id LEFT JOIN days d ON d.id = da.day_id WHERE jt.journey_id = ? GROUP BY p.id ORDER BY day IS NULL, day ASC, ord ASC, p.id ASC`,
    STATS_PLACECOUNT: `SELECT COUNT(*) AS n FROM journey_trips jt JOIN places p ON p.trip_id = jt.trip_id WHERE jt.journey_id = ?`,
    STATS_PHOTOCOUNT: `SELECT COUNT(*) AS n FROM journey_photos WHERE journey_id = ?`,
    STATS_EPHOTOS: `SELECT jep.entry_id AS entryId, gp.photo_id AS photoId FROM journey_entry_photos jep JOIN journey_photos gp ON gp.id = jep.journey_photo_id JOIN trek_photos tp ON tp.id = gp.photo_id WHERE gp.journey_id = ? AND (tp.media_type IS NULL OR tp.media_type = 'image') ORDER BY jep.entry_id ASC, jep.sort_order ASC, gp.sort_order ASC, gp.id ASC`,
    TRACKS: `SELECT DISTINCT p.id AS place_id, p.trip_id, p.name, p.route_color, p.route_geometry FROM journey_entries je JOIN places p ON p.trip_id = je.source_trip_id WHERE je.journey_id = ? AND je.source_trip_id IS NOT NULL AND p.route_geometry IS NOT NULL ORDER BY p.trip_id, p.id`,
    SUGG: `SELECT t.id, t.title, t.start_date, t.end_date, t.cover_image, (SELECT COUNT(*) FROM places p INNER JOIN day_assignments da ON da.place_id = p.id WHERE p.trip_id = t.id) as place_count FROM trips t LEFT JOIN trip_members tm ON t.id = tm.trip_id AND tm.user_id = ? WHERE (t.user_id = ? OR tm.user_id = ?) AND t.end_date IS NOT NULL AND t.end_date >= ? AND t.end_date <= date('now') AND t.id NOT IN (SELECT trip_id FROM journey_trips) ORDER BY t.end_date DESC`,
    PICKER: `SELECT t.id, t.title, t.start_date, t.end_date, t.cover_image, (SELECT COUNT(*) FROM places p INNER JOIN day_assignments da ON da.place_id = p.id WHERE p.trip_id = t.id) as place_count FROM trips t LEFT JOIN trip_members tm ON t.id = tm.trip_id AND tm.user_id = ? WHERE t.user_id = ? OR tm.user_id = ? ORDER BY t.start_date DESC`,
  };

  /** L8 — JG15's flat row order can differ from legacy on `sort_order` ties across entries (join order vs. the IN subquery); the only consumer groups by entry, so the parity contract is the GROUPED shape, not the flat row order. */
  function groupedByEntry(rows: { entry_id: number; id: number }[]) {
    const out: Record<number, number[]> = {};
    for (const r of rows) (out[r.entry_id] ||= []).push(r.id);
    return out;
  }

  it('JourneyEntryPhotosRepository.listForJourney (JG15) matches the legacy statement, grouped by entry (L8: flat order may tie-break differently)', async () => {
    const { journey } = await seedParityJourney();
    const legacy = testDb.prepare(LEG.JG15).all(journey.id) as { entry_id: number; id: number }[];
    const converted = (await entryPhotosRepoDirect.listForJourney(journey.id)) as unknown as { entry_id: number; id: number }[];

    expect(groupedByEntry(converted)).toEqual(groupedByEntry(legacy));
    // Full-key equality still holds per row (only ORDER may tie-differ) — a
    // sorted-by-id comparison catches a dropped/renamed column.
    const sortById = (rows: { id: number }[]) => [...rows].sort((a, b) => a.id - b.id);
    expect(sortById(converted)).toEqual(sortById(legacy));
  });

  it('JourneyPhotosRepository.galleryRead (JG19, GALLERY_CHRONOLOGICAL_ORDER) matches the legacy statement exactly, including row order', async () => {
    const { journey } = await seedParityJourney();
    const legacy = testDb.prepare(LEG.JG19).all(journey.id);
    const converted = await photosRepoDirect.galleryRead(journey.id);
    expect(converted).toEqual(legacy);
  });

  it('JourneyEntriesRepository.listStatsRows (JG64) matches the legacy statement', async () => {
    const { journey } = await seedParityJourney();
    const legacy = testDb.prepare(LEG.STATS_ENTRIES).all(journey.id);
    expect(await entriesRepoDirect.listStatsRows(journey.id)).toEqual(legacy);
  });

  it('JourneyEntriesRepository.listStatsTrips (JG65) matches the legacy statement, undated trips sorted last', async () => {
    const { journey } = await seedParityJourney();
    const legacy = testDb.prepare(LEG.STATS_TRIPS).all(journey.id);
    expect(await entriesRepoDirect.listStatsTrips(journey.id)).toEqual(legacy);
  });

  it('JourneyEntriesRepository.listStatsPlaces (JG66) matches the legacy statement, one row per place at its earliest day', async () => {
    const { journey } = await seedParityJourney();
    const legacy = testDb.prepare(LEG.STATS_PLACES).all(journey.id);
    expect(await entriesRepoDirect.listStatsPlaces(journey.id)).toEqual(legacy);
  });

  it('JourneyEntriesRepository.countStatsPlaces (JG67) matches the legacy count', async () => {
    const { journey } = await seedParityJourney();
    const legacy = (testDb.prepare(LEG.STATS_PLACECOUNT).get(journey.id) as { n: number }).n;
    expect(await entriesRepoDirect.countStatsPlaces(journey.id)).toBe(legacy);
  });

  it('JourneyPhotosRepository.countForJourney (JG68) matches the legacy count', async () => {
    const { journey } = await seedParityJourney();
    const legacy = (testDb.prepare(LEG.STATS_PHOTOCOUNT).get(journey.id) as { n: number }).n;
    expect(await photosRepoDirect.countForJourney(journey.id)).toBe(legacy);
  });

  it('JourneyEntryPhotosRepository.listFirstPhotoPerEntry (JG69) matches the legacy statement, videos excluded', async () => {
    const { journey } = await seedParityJourney();
    const legacy = testDb.prepare(LEG.STATS_EPHOTOS).all(journey.id);
    expect(await entryPhotosRepoDirect.listFirstPhotoPerEntry(journey.id)).toEqual(legacy);
  });

  it('JourneyEntriesRepository.listTracksSource (JG63) matches the legacy statement', async () => {
    const { journey } = await seedParityJourney();
    const legacy = testDb.prepare(LEG.TRACKS).all(journey.id);
    expect(await entriesRepoDirect.listTracksSource(journey.id)).toEqual(legacy);
  });

  it('JourneyEntriesRepository.listSuggestedTrips (JG120) matches the legacy statement', async () => {
    const { owner } = await seedParityJourney();
    const since = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const legacy = testDb.prepare(LEG.SUGG).all(owner.id, owner.id, owner.id, since);
    expect(await entriesRepoDirect.listSuggestedTrips(owner.id, since, todayUtc())).toEqual(legacy);
  });

  it('JourneyEntriesRepository.listUserTripsPicker (JG121) matches the legacy statement — owner and a member', async () => {
    const { owner, member } = await seedParityJourney();
    const legacyOwner = testDb.prepare(LEG.PICKER).all(owner.id, owner.id, owner.id);
    const legacyMember = testDb.prepare(LEG.PICKER).all(member.id, member.id, member.id);
    expect(await entriesRepoDirect.listUserTripsPicker(owner.id)).toEqual(legacyOwner);
    expect(await entriesRepoDirect.listUserTripsPicker(member.id)).toEqual(legacyMember);
  });
});

describe('Plan 3g Task 1 — mutation proofs (R5/R7)', () => {
  it("JG119: JourneyContributorsRepository.deleteNonOwner never removes the owner row, even targeted at the owner's own id", async () => {
    const { user: owner } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    const changed = await contributorsRepoDirect.deleteNonOwner(journey.id, owner.id);

    expect(changed).toBe(0);
    const row = testDb
      .prepare('SELECT role FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .get(journey.id, owner.id) as { role: string } | undefined;
    expect(row?.role).toBe('owner');
  });

  it("JG119 mutation check: the statement WITHOUT the role != 'owner' guard WOULD have removed the same row — proves the test above is not vacuous", async () => {
    const { user: owner } = createUser(testDb);
    const journey = createJourney(testDb, owner.id);

    // The exact statement JG119's guard replaces (no `role != 'owner'` clause).
    const res = testDb
      .prepare('DELETE FROM journey_contributors WHERE journey_id = ? AND user_id = ?')
      .run(journey.id, owner.id);
    expect(res.changes).toBe(1);
  });

  it('AP1: a non-member caller is refused (no insert, no broadcast) — and stubbing findAccessible to always succeed removes that refusal', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const foreignTrip = createTrip(testDb, stranger.id, { title: "Stranger's Trip" });
    const broadcastSpy = vi.spyOn(RealtimeService.prototype, 'broadcastToUser').mockImplementation(() => {});

    try {
      const refused = await svc.addTripToJourney(journey.id, foreignTrip.id, user.id);

      expect(refused).toBe(false);
      expect(broadcastSpy).not.toHaveBeenCalled();
      const link = testDb
        .prepare('SELECT * FROM journey_trips WHERE journey_id = ? AND trip_id = ?')
        .get(journey.id, foreignTrip.id);
      expect(link).toBeUndefined();

      // Mutation check: stub AP1's own primitive to always report access — the
      // exact guard-bypass AP1 exists to close (plan3g-inputs.md §0's
      // "the REST route never did" history). Restored in `finally`.
      const findAccessibleSpy = vi
        .spyOn(tripsRepoDirect, 'findAccessible')
        .mockResolvedValue({ id: foreignTrip.id, user_id: stranger.id, currency: null });
      try {
        const bypassed = await svc.addTripToJourney(journey.id, foreignTrip.id, user.id);

        // With the guard's own primitive stubbed truthy, the SAME call now
        // succeeds — proving the refusal above genuinely depends on AP1's
        // real `findAccessible` check, not on some other guard.
        expect(bypassed).toBe(true);
        const linkAfterBypass = testDb
          .prepare('SELECT * FROM journey_trips WHERE journey_id = ? AND trip_id = ?')
          .get(journey.id, foreignTrip.id);
        expect(linkAfterBypass).toBeDefined();
      } finally {
        findAccessibleSpy.mockRestore();
      }
    } finally {
      broadcastSpy.mockRestore();
    }
  });
});

describe('Plan 3g Task 1 — reconcileTripSkeletons: all three branches in one call', () => {
  it('inserts a newly-assigned place, claims an unclaimed pre-assignment-link row, and drops a gone assignment, simultaneously', async () => {
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const trip = createTrip(testDb, user.id, { title: 'Three Branches', start_date: '2026-06-01', end_date: '2026-06-03' });
    const day1 = createDay(testDb, trip.id, { date: '2026-06-01' });
    const day2 = createDay(testDb, trip.id, { date: '2026-06-02' });

    const keepPlace = createPlace(testDb, trip.id, { name: 'Keep' });
    const dropPlace = createPlace(testDb, trip.id, { name: 'Drop' });
    const claimPlace = createPlace(testDb, trip.id, { name: 'Claim' });

    createDayAssignment(testDb, day1.id, keepPlace.id);
    const dropAssignment = createDayAssignment(testDb, day1.id, dropPlace.id);
    await svc.addTripToJourney(journey.id, trip.id, user.id);

    // An "unclaimed" pre-assignment-link skeleton for claimPlace — the shape
    // a backfill (or a row from before the assignment link existed) leaves
    // behind: `source_place_id` set, `source_assignment_id` NULL.
    const claimAssignment = createDayAssignment(testDb, day2.id, claimPlace.id);
    testDb
      .prepare(
        `
      INSERT INTO journey_entries (journey_id, source_trip_id, source_place_id, source_assignment_id, author_id, type, title, entry_date, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, NULL, ?, 'skeleton', ?, ?, 0, ?, ?)
    `,
      )
      .run(journey.id, trip.id, claimPlace.id, user.id, claimPlace.name, '2026-06-02', Date.now(), Date.now());

    // Change the plan three ways at once: drop dropPlace's assignment (branch
    // 3), leave keepPlace untouched (a control — no branch should fire for
    // it), and add a brand-new place to day 2 (branch 1). claimPlace's day-2
    // assignment (already on the plan, above) is what branch 2 claims.
    testDb.prepare('DELETE FROM day_assignments WHERE id = ?').run(dropAssignment.id);
    const newPlace = createPlace(testDb, trip.id, { name: 'New' });
    createDayAssignment(testDb, day2.id, newPlace.id);

    await svc.reconcileTripSkeletons(trip.id);

    const entries = testDb.prepare('SELECT * FROM journey_entries WHERE journey_id = ?').all(journey.id) as {
      source_place_id: number | null;
      source_assignment_id: number | null;
      type: string;
    }[];

    // Branch 1 — insert: the brand-new place got a skeleton.
    expect(entries.some((e) => e.source_place_id === newPlace.id && e.type === 'skeleton')).toBe(true);

    // Branch 2 — claim: the unclaimed row now carries claimAssignment's id,
    // not a second, freshly-inserted row.
    const claimed = entries.filter((e) => e.source_place_id === claimPlace.id);
    expect(claimed).toHaveLength(1);
    expect(claimed[0].source_assignment_id).toBe(claimAssignment.id);

    // Branch 3 — drop: dropPlace's empty skeleton is gone outright (no story, no photos).
    expect(entries.some((e) => e.source_place_id === dropPlace.id)).toBe(false);

    // Control: keepPlace's already-synced skeleton is untouched — the fixture
    // doesn't over-fire a branch that shouldn't apply to it.
    expect(entries.some((e) => e.source_place_id === keepPlace.id)).toBe(true);
  });
});

// Plan 3g Task 2 — the four `uow.transactional` blocks (JG-TX1..4) and
// JG112's mutation proof. Appended per R9 (Task 1 owns the construction/
// wrapping pattern above; this only adds new coverage).
describe('Plan 3g Task 2 — transaction rollback proofs (JG-TX1..4)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('JG-TX1 (addPhoto): a failure after ensureInGallery\'s insert rolls the insert back — no orphan journey_photos row', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const entry = await svc.createEntry(journey.id, user.id, { entry_date: '2026-01-01' });

    vi.spyOn(photosRepoDirect, 'findIdByJourneyAndPhoto').mockRejectedValueOnce(new Error('boom'));

    await expect(svc.addPhoto(entry!.id, user.id, 'journey/tx1.jpg')).rejects.toThrow('boom');

    const rows = testDb.prepare('SELECT * FROM journey_photos WHERE journey_id = ?').all(journey.id);
    expect(rows).toHaveLength(0);
  });

  it('JG-TX2 (addProviderPhoto): a failure after ensureInGallery\'s insert rolls the insert back — no orphan journey_photos row', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const entry = await svc.createEntry(journey.id, user.id, { entry_date: '2026-01-01' });

    vi.spyOn(photosRepoDirect, 'findIdByJourneyAndPhoto').mockRejectedValueOnce(new Error('boom'));

    await expect(svc.addProviderPhoto(entry!.id, user.id, 'immich', 'asset-tx2')).rejects.toThrow('boom');

    const rows = testDb.prepare('SELECT * FROM journey_photos WHERE journey_id = ?').all(journey.id);
    expect(rows).toHaveLength(0);
  });

  it('JG-TX3 (addProviderPhotoToGallery): a failure after ensureInGallery\'s insert rolls the insert back — no orphan journey_photos row', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });

    vi.spyOn(photosRepoDirect, 'findIdByJourneyAndPhoto').mockRejectedValueOnce(new Error('boom'));

    await expect(svc.addProviderPhotoToGallery(journey.id, user.id, 'immich', 'asset-tx3')).rejects.toThrow('boom');

    const rows = testDb.prepare('SELECT * FROM journey_photos WHERE journey_id = ?').all(journey.id);
    expect(rows).toHaveLength(0);
  });

  it('JG-TX4 (reorderEntries): a failure touching the journey after the sort_order loop rolls EVERY sort_order write back, not just the last one', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const e1 = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-01-01' });
    const e2 = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-01-01' });
    const e3 = createJourneyEntry(testDb, journey.id, user.id, { entry_date: '2026-01-01' });
    testDb.prepare('UPDATE journey_entries SET sort_order = 0 WHERE id IN (?, ?, ?)').run(e1.id, e2.id, e3.id);

    vi.spyOn(journeysRepoDirect, 'updateFields').mockRejectedValueOnce(new Error('boom'));

    await expect(svc.reorderEntries(journey.id, user.id, [e3.id, e1.id, e2.id])).rejects.toThrow('boom');

    // None of the three sort_order writes the loop made before the journey
    // touch failed should have survived the rollback — every entry is still
    // at its pre-call sort_order (0), not just the last one in the loop.
    const rows = testDb.prepare('SELECT id, sort_order FROM journey_entries WHERE journey_id = ? ORDER BY id').all(journey.id) as {
      id: number;
      sort_order: number;
    }[];
    for (const r of rows) expect(r.sort_order).toBe(0);
  });
});

describe('Plan 3g Task 2 — JG112 mutation proof (sort_order table targeting)', () => {
  it('updatePhoto\'s sort_order write lands on journey_entry_photos (entry-scoped), never journey_photos (the gallery row\'s own, unrelated sort_order)', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const entry = await svc.createEntry(journey.id, user.id, { entry_date: '2026-01-01' });
    const [photo] = await svc.uploadGalleryPhotos(journey.id, user.id, [{ path: 'journey/jg112.jpg' }]);
    await svc.linkPhotoToEntry(entry!.id, photo.id, user.id);

    const galleryBefore = (
      testDb.prepare('SELECT sort_order FROM journey_photos WHERE id = ?').get(photo.id) as { sort_order: number }
    ).sort_order;

    const updated = await svc.updatePhoto(photo.id, user.id, { sort_order: 7 });

    // The junction row (this entry's own view of the photo's position) moved.
    const junctionRow = testDb
      .prepare('SELECT sort_order FROM journey_entry_photos WHERE journey_photo_id = ?')
      .get(photo.id) as { sort_order: number };
    expect(junctionRow.sort_order).toBe(7);
    expect(updated!.sort_order).toBe(7);

    // A copy-paste bug swapping JG111/JG112's target tables would leave the
    // junction row untouched and instead bump `journey_photos.sort_order`
    // (the gallery's OWN, unrelated ordering column, same name, different
    // table) to 7 — asserting it is STILL the pre-call value is what a
    // table-swap regression would fail.
    const galleryAfter = (
      testDb.prepare('SELECT sort_order FROM journey_photos WHERE id = ?').get(photo.id) as { sort_order: number }
    ).sort_order;
    expect(galleryAfter).toBe(galleryBefore);
  });
});

describe('journeyIdOfEntry', () => {
  it('JOURNEY-SVC-ENTRY-JOURNEY-001: names the journey an entry sits in, and null for an entry that does not exist', async () => {
    // The capture refresh (#1587) only knows the entry the photos went to and has
    // to tell the journey they belong to.
    const { user } = createUser(testDb);
    const journey = createJourney(testDb, user.id);
    const entry = createJourneyEntry(testDb, journey.id, user.id);

    expect(await svc.journeyIdOfEntry(entry.id)).toBe(journey.id);
    expect(await svc.journeyIdOfEntry(999999)).toBeNull();
  });
});
