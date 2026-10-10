/**
 * Unit tests for the DI-native CollectionsService (COLLECTIONS-SVC-001 … 092;
 * moved 1:1 from the legacy tests/unit/services/collectionsService.test.ts,
 * case IDs preserved — the 080/081 membership-lookup cases are new with the
 * fold, and the 090–092 band pins the post-fold quirk fixes: all-or-nothing
 * bulk writes and socket-id forwarding on the from-trip saves). Real in-memory SQLite (full schema + migrations) so the SQL —
 * owner/member visibility, the collection-scoped dedup, the fusion state
 * machine and the widened photo-cache reference check — is exercised
 * faithfully. Keeps its own clearCollections() reset (the shared
 * resetTestDb RESET_TABLES list has no collection tables).
 */
import { asLegacyResult } from '../../helpers/domain-error';
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
  };
});

import { db as testDb } from '../../../src/db/database';

const notifSend = vi.fn().mockResolvedValue(undefined);

import fs from 'fs';
import path from 'path';
import { createUser, createTrip, createPlace, createCategory, createTag, addTripMember, createDay, createDayAssignment } from '../../helpers/factories';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { CollectionsService } from '../../../src/nest/collections/collections.service';
import { buildPlaceImportService } from '../../helpers/place-import';
import { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import { notificationsStub } from '../../helpers/notifications';
import {
  createTestUnitOfWork, createTestAppSettingsRepo, createTestGooglePlacePhotoMetaRepo, createTestPlacesRepo,
  createTestCollectionsRepo, createTestCollectionMembersRepo, createTestCollectionLabelsRepo, createTestCategoriesRepo,
  createTestCollectionPlacesRepo, createTestCollectionPlaceRatingsRepo, createTestTripsRepo, createTestTripMembersRepo,
  createTestPlaceRatingsRepo, createTestTagsRepo, createTestUsersRepo,
} from '../../helpers/test-uow';
import { sharedTestOrm } from '../../helpers/test-uow';
import { countRows, deleteRows, findRow, findRows, insertRow, updateRows } from '../../helpers/factories/rows';
import { addCollectionMember } from '../../helpers/factories/collections';
import { CollectionLabels } from '../../../src/db/entities/CollectionLabels.entity';
import { CollectionMembers } from '../../../src/db/entities/CollectionMembers.entity';
import { CollectionPlaceRatings } from '../../../src/db/entities/CollectionPlaceRatings.entity';
import { CollectionPlaces } from '../../../src/db/entities/CollectionPlaces.entity';
import { Collections } from '../../../src/db/entities/Collections.entity';
import { GooglePlacePhotoMeta } from '../../../src/db/entities/GooglePlacePhotoMeta.entity';
import { PlaceRatings } from '../../../src/db/entities/PlaceRatings.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { Tags } from '../../../src/db/entities/Tags.entity';
import { Users } from '../../../src/db/entities/Users.entity';
import { FakeRealtimeService } from '../../helpers/fake-realtime';

const realtime = new FakeRealtimeService();
const broadcastToUser = realtime.broadcastToUserMock;

const orm = () => sharedTestOrm(testDb);

/** Puts the user on the list as an accepted member, with the role the column defaults to unless given. */
async function joinCollection(colId: number, userId: number, role?: 'viewer' | 'editor' | 'admin') {
  await addCollectionMember(await orm(), colId, userId, role ? { role } : {});
}

/** How many saved places a list holds. */
async function placesIn(colId: number): Promise<{ n: number }> {
  return { n: await countRows(await orm(), CollectionPlaces, { collection: colId }) };
}

/** How many member rows (any status) a list holds. */
async function membersOf(colId: number): Promise<{ n: number }> {
  return { n: await countRows(await orm(), CollectionMembers, { collection: colId }) };
}

/** The newest place on a trip. */
async function newestPlace(tripId: number): Promise<{ id: number }> {
  const [row] = await findRows(await orm(), Places, { trip: tripId }, { id: 'desc' });
  return { id: row.id };
}

/** The votes stored on a trip place. */
async function placeVotes(placeId: number): Promise<{ user_id: number; rating: number }[]> {
  return (await findRows(await orm(), PlaceRatings, { place: placeId })).map(v => ({ user_id: v.user_id, rating: v.rating }));
}

/** The votes stored on a saved place. */
async function savedPlaceVotes(collectionPlaceId: number): Promise<{ user_id: number; rating: number }[]> {
  return (await findRows(await orm(), CollectionPlaceRatings, { collectionPlace: collectionPlaceId })).map(v => ({ user_id: v.user_id, rating: v.rating }));
}

const storageFx = makeStorageFixture('');
let svc: CollectionsService;
// R6's two-layer-order proof (savePlace/copyToTrip) needs a distinguishable
// spy on the TRIP-access call — captured here so the tests below can assert
// on call order/count, not just the final HTTP status (the brief's own
// warning: a reversed check order still refuses in the end, via a different
// path, so an ordinary pass/fail test would not catch a regression).
let tripsRepoForSpy: Awaited<ReturnType<typeof createTestTripsRepo>>;
let permissionsForSpy: PermissionsService;
// The real cache: these cases assert what removeIfUnreferenced actually does
// about collection_places (#1081), so a stub would assert nothing.
// Plan 3c Task 1: built inside the async `beforeAll` below now — the
// constructor needs two repositories, resolved through `createTestOrm`.
let photoCache: PlacePhotoCacheService;
const removeIfUnreferenced = (id: string) => photoCache.removeIfUnreferenced(id);
// Plan 3h Task 1 (part A, R6's construction pattern): the SAME direct-construction
// shape every converted service in this program uses for its own hand-built unit
// test (`atlas.service.test.ts`/`journey-domain.service.test.ts` precedent) — real
// repositories resolved off `sharedTestOrm(testDb)` (via `createTestXRepo` helpers,
// `allowGlobalContext: true` by default, `test-orm.ts`'s own docstring), no
// `withRequestContext` wrapper needed or added anywhere in this file. Plan 3h Task 2
// (part B) finished the conversion: `DatabaseService` is GONE from the constructor
// entirely (savePlace onward was its last use) — the trip/place/tag/user
// repositories below are Task 2's own additions.
beforeAll(async () => {
  tripsRepoForSpy = await createTestTripsRepo(testDb);
  permissionsForSpy = new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb));
  svc = new CollectionsService(
    permissionsForSpy,
    realtime, notificationsStub(notifSend), storageFx.storage, await createTestUnitOfWork(testDb),
    await createTestCollectionsRepo(testDb), await createTestCollectionMembersRepo(testDb),
    await createTestCollectionLabelsRepo(testDb), await createTestCategoriesRepo(testDb),
    await createTestCollectionPlacesRepo(testDb), await createTestCollectionPlaceRatingsRepo(testDb),
    tripsRepoForSpy, await createTestTripMembersRepo(testDb),
    await createTestPlacesRepo(testDb), await createTestPlaceRatingsRepo(testDb),
    await createTestTagsRepo(testDb), await createTestUsersRepo(testDb),
    buildPlaceImportService(),
  );
  photoCache = new PlacePhotoCacheService(
    makeStorageFixture('photos/google/').storage,
    await createTestGooglePlacePhotoMetaRepo(testDb),
    await createTestPlacesRepo(testDb),
    await createTestCollectionPlacesRepo(testDb),
  );
});

function clearCollections() {
  testDb.exec(`
    DELETE FROM collection_place_labels;
    DELETE FROM collection_labels;
    DELETE FROM collection_place_tags;
    DELETE FROM collection_places;
    DELETE FROM collection_members;
    DELETE FROM collections;
    DELETE FROM google_place_photo_meta;
    DELETE FROM place_tags;
    DELETE FROM places;
    DELETE FROM trip_members;
    DELETE FROM trips;
    DELETE FROM users;
  `);
}

beforeAll(async () => {
});

beforeEach(() => {
  clearCollections();
  broadcastToUser.mockClear();
  notifSend.mockClear();
});

afterAll(() => {
  testDb.close();
});

// ── Lists CRUD + visibility ──────────────────────────────────────────────────

describe('collections CRUD + visibility', () => {
  it('COLLECTIONS-SVC-001: createCollection + listCollections is owner-scoped', async () => {
    const a = createUser(testDb).user;
    const b = createUser(testDb).user;
    const col = await svc.createCollection(a.id, { name: 'Tokyo' });
    expect(col.is_owner).toBe(true);
    expect(col.owner_id).toBe(a.id);

    expect((await svc.listCollections(a.id)).collections).toHaveLength(1);
    expect((await svc.listCollections(b.id)).collections).toHaveLength(0);
  });

  it('COLLECTIONS-SVC-001b: lists and labels created at the same time take one position each', async () => {
    const a = createUser(testDb).user;
    // Without the transaction every one read the same MAX and they shared a position.
    const lists = await Promise.all(['A', 'B', 'C'].map((name) => svc.createCollection(a.id, { name })));
    expect(lists.map((l) => l.sort_order).sort((x, y) => x - y)).toEqual([0, 1, 2]);
    const labels = await Promise.all(['Food', 'Sights', 'Bars'].map((name) => svc.createLabel(a.id, lists[0].id, name)));
    expect(labels.map((l) => l.sort_order).sort((x, y) => x - y)).toEqual([0, 1, 2]);
  });

  it('COLLECTIONS-SVC-001c: two labels of one name created at the same time: one lands, the other is a 409', async () => {
    const a = createUser(testDb).user;
    const list = await svc.createCollection(a.id, { name: 'Tokyo' });
    const results = await Promise.allSettled([svc.createLabel(a.id, list.id, 'Food'), svc.createLabel(a.id, list.id, 'Food')]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((r) => r.status === 'rejected')).toMatchObject({ reason: { status: 409 } });
  });

  it('COLLECTIONS-SVC-002: getCollection 404 for a non-member', async () => {
    const a = createUser(testDb).user;
    const b = createUser(testDb).user;
    const col = await svc.createCollection(a.id, { name: 'Private' });
    await expect(svc.getCollection(b.id, col.id)).rejects.toThrow();
    try { await svc.getCollection(b.id, col.id); } catch (e) { expect((e as { status: number }).status).toBe(404); }
  });

  it('COLLECTIONS-SVC-003b: an edit and a new cover stamp updated_at in the canonical timestamp text', async () => {
    const a = createUser(testDb).user;
    const col = await svc.createCollection(a.id, { name: 'Stamped' });
    await updateRows(await orm(), Collections, { id: col.id }, { updated_at: '2000-01-01 00:00:00' });

    const updated = await svc.updateCollection(a.id, col.id, { name: 'Renamed' });
    expect(updated.updated_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(updated.updated_at).not.toBe('2000-01-01 00:00:00');

    await updateRows(await orm(), Collections, { id: col.id }, { updated_at: '2000-01-01 00:00:00' });
    const covered = await svc.setCollectionCover(a.id, col.id, '/uploads/covers/x.jpg');
    expect(covered.updated_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    expect(covered.updated_at).not.toBe('2000-01-01 00:00:00');
  });

  it('COLLECTIONS-SVC-003: updateCollection renames; reorder only touches visible rows', async () => {
    const a = createUser(testDb).user;
    const col = await svc.createCollection(a.id, { name: 'Old' });
    const updated = await svc.updateCollection(a.id, col.id, { name: 'New' });
    expect(updated.name).toBe('New');

    const b = createUser(testDb).user;
    const other = await svc.createCollection(b.id, { name: 'B-list' }); // b's first list → sort_order 0
    await svc.reorderCollections(a.id, [other.id, col.id]); // a cannot see other → skipped; col → index 1
    const otherRow = (await findRow(await orm(), Collections, { id: other.id }))!;
    const colRow = (await findRow(await orm(), Collections, { id: col.id }))!;
    expect(otherRow.sort_order).toBe(0); // untouched — not visible to a
    expect(colRow.sort_order).toBe(1); // reordered to its index in the visible-filtered list
  });
});

// ── Saved places + dedup ─────────────────────────────────────────────────────

describe('saved places + dedup', () => {
  it('COLLECTIONS-SVC-010: savePlace sets owner_id=owner, saved_by=caller, no itinerary cols', async () => {
    const owner = createUser(testDb).user;
    const member = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Shared' });
    await joinCollection(col.id, member.id);

    const res = await svc.savePlace(member.id, { collection_id: col.id, name: 'Senso-ji', lat: 35.71, lng: 139.79 });
    expect(res.place).toBeDefined();
    // test-sql-allow: SELECT * shows the table's real columns, and the assertion is that no itinerary column is among them.
    const row = testDb.prepare('SELECT * FROM collection_places WHERE id = ?').get(res.place!.id) as Record<string, unknown>;
    expect(row.owner_id).toBe(owner.id);
    expect(row.saved_by).toBe(member.id);
    expect('reservation_status' in row).toBe(false);
    expect('place_time' in row).toBe(false);
  });

  it('COLLECTIONS-SVC-011: second identical save is a duplicate; force inserts', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Dedup' });
    await svc.savePlace(u.id, { collection_id: col.id, name: 'Eiffel Tower' });

    const dup = await svc.savePlace(u.id, { collection_id: col.id, name: 'eiffel tower' });
    expect(dup.duplicate).toBe(true);
    expect(dup.duplicateOf?.name).toBe('Eiffel Tower');

    const forced = await svc.savePlace(u.id, { collection_id: col.id, name: 'eiffel tower', force: true });
    expect(forced.place).toBeDefined();
    expect(await placesIn(col.id)).toEqual({ n: 2 });
  });

  it('COLLECTIONS-SVC-012: savePlace attaches tags', async () => {
    const u = createUser(testDb).user;
    const tag = createTag(testDb, u.id, { name: 'food' });
    const col = await svc.createCollection(u.id, { name: 'Tagged' });
    const res = await svc.savePlace(u.id, { collection_id: col.id, name: 'Ramen', tag_ids: [tag.id] });
    expect(res.place!.tags?.map((t) => t.name)).toContain('food');
  });

  it('CL49 (Plan 3h Task 7 review, M1 coverage): updatePlace with tag_ids rewrites the tag set (CollectionPlacesRepository.deleteTags)', async () => {
    const u = createUser(testDb).user;
    const food = createTag(testDb, u.id, { name: 'food' });
    const views = createTag(testDb, u.id, { name: 'views' });
    const col = await svc.createCollection(u.id, { name: 'Tagged' });
    const res = await svc.savePlace(u.id, { collection_id: col.id, name: 'Ramen', tag_ids: [food.id] });
    expect(res.place!.tags?.map((t) => t.name)).toEqual(['food']);

    // A second tag_ids write must DROP the old tag rather than accumulate —
    // only possible if the old assignment rows were actually deleted first.
    await svc.updatePlace(u.id, res.place!.id, { tag_ids: [views.id] });
    const stored = (await svc.getCollection(u.id, col.id)).places.find((p) => p.id === res.place!.id)!;
    expect(stored.tags?.map((t) => t.name)).toEqual(['views']);

    // An empty tag_ids array clears every tag.
    await svc.updatePlace(u.id, res.place!.id, { tag_ids: [] });
    const cleared = (await svc.getCollection(u.id, col.id)).places.find((p) => p.id === res.place!.id)!;
    expect(cleared.tags ?? []).toEqual([]);
  });

  it('COLLECTIONS-SVC-013: savePlace rejects an inaccessible collection (404)', async () => {
    const a = createUser(testDb).user;
    const b = createUser(testDb).user;
    const col = await svc.createCollection(a.id, { name: 'Locked' });
    await expect(svc.savePlace(b.id, { collection_id: col.id, name: 'X' })).rejects.toThrow();
  });

  it('COLLECTIONS-SVC-100: a NAMED candidate does not merge into a different place at the same coordinates', async () => {
    // The wrong-city hazard: findDuplicateCollectionPlace used to fall through to
    // a coordinate match for a named candidate whose name did not match anything,
    // which would report two distinct places at one address (the restaurant and
    // the bar) as duplicates of each other.
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Berlin' });
    await svc.savePlace(u.id, { collection_id: col.id, name: 'Ground Floor Diner', lat: 52.52, lng: 13.405 });

    const result = await svc.savePlace(u.id, { collection_id: col.id, name: 'Rooftop Bar', lat: 52.52, lng: 13.405 });

    expect(result.duplicate).toBeFalsy();
    expect(result.place).toBeDefined();
  });

  it('CL27 (Plan 3h Task 7 review, M1 coverage): an UNNAMED candidate falls back to the coordinate dedup branch (CollectionsRepository.findDuplicateByCoords)', async () => {
    // `placeMatchStrategies` only offers `coords` when the name normalizes away
    // to nothing (blank/whitespace); a single space satisfies the DTO's
    // `min(1)` but still normalizes to null, so it reaches the coords branch
    // this repository method serves.
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Unnamed pins' });
    await svc.savePlace(u.id, { collection_id: col.id, name: ' ', lat: 48.8566, lng: 2.3522 });

    const withinTolerance = await svc.savePlace(u.id, { collection_id: col.id, name: ' ', lat: 48.85665, lng: 2.35215 });
    expect(withinTolerance.duplicate).toBe(true);

    const outsideTolerance = await svc.savePlace(u.id, { collection_id: col.id, name: ' ', lat: 48.9, lng: 2.5 });
    expect(outsideTolerance.duplicate).toBeFalsy();
  });

  it('COLLECTIONS-SVC-101: a provider id still recognises a renamed place a name/coords search would miss', async () => {
    // google_place_id/google_ftid/osm_id are stored on every collection_places row
    // but were never read back for dedup, so a renamed place with no matching
    // name or coordinates could be saved again under its old provider id.
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Renames' });
    await svc.savePlace(u.id, {
      collection_id: col.id,
      name: 'Original Name',
      lat: 1,
      lng: 1,
      google_place_id: 'ChIJ_abc',
    });

    const result = await svc.savePlace(u.id, {
      collection_id: col.id,
      name: 'Renamed By User',
      lat: 2,
      lng: 2,
      google_place_id: 'ChIJ_abc',
    });

    expect(result.duplicate).toBe(true);
    expect(result.duplicateOf?.name).toBe('Original Name');
  });

  it('COLLECTIONS-SVC-102: the bulk import recognises a renamed place by its provider id too', async () => {
    // savePlace was not the only caller. The bulk copy carries the provider ids
    // into the row it writes, so asking without them would recognise less than
    // the row it just wrote already knows.
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Rome' });
    const trip = createTrip(testDb, u.id);
    const place = createPlace(testDb, trip.id, { name: 'Trattoria da Enzo' });
    await updateRows(await orm(), Places, { id: place.id }, { google_ftid: '0x1:0x2' });
    await svc.savePlace(u.id, { collection_id: col.id, name: 'Dinner Tuesday', lat: 41.88, lng: 12.47, google_ftid: '0x1:0x2' });

    const out = await svc.saveFromTripPlaces(u.id, col.id, trip.id, [place.id]);

    expect(out.copied).toBe(0);
    expect(out.skipped.map(s => s.name)).toEqual(['Trattoria da Enzo']);
  });

  it('COLLECTIONS-SVC-103: the import picker marks that same place as already saved', async () => {
    // The dialog and the import have to agree: a row shown as new that the import
    // then refuses is the drift this method exists to prevent.
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Rome' });
    const trip = createTrip(testDb, u.id);
    const place = createPlace(testDb, trip.id, { name: 'Trattoria da Enzo' });
    await updateRows(await orm(), Places, { id: place.id }, { google_ftid: '0x1:0x2' });
    await svc.savePlace(u.id, { collection_id: col.id, name: 'Dinner Tuesday', lat: 41.88, lng: 12.47, google_ftid: '0x1:0x2' });

    const listed = (await svc.importablePlaces(u.id, col.id, trip.id)).places.find(p => p.place_id === place.id);

    expect(listed?.already_in_list).toBe(true);
  });
});

// ── save-from-trip provenance + IDOR ─────────────────────────────────────────

describe('saveFromTripPlace', () => {
  it('COLLECTIONS-SVC-014: records provenance from a readable trip', async () => {
    const u = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, u.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    const col = await svc.createCollection(u.id, { name: 'From trip' });

    const res = await svc.saveFromTripPlace(u.id, col.id, trip.id, place.id);
    expect(res.place!.source_trip_id).toBe(trip.id);
    expect(res.place!.source_place_id).toBe(place.id);
    expect(res.place!.name).toBe('Louvre');
  });

  it('COLLECTIONS-SVC-015: rejects a trip the user cannot read (no IDOR)', async () => {
    const owner = createUser(testDb).user;
    const stranger = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id, { name: 'Secret' });
    const col = await svc.createCollection(stranger.id, { name: 'Mine' });

    await expect(svc.saveFromTripPlace(stranger.id, col.id, trip.id, place.id)).rejects.toThrow();
    try { await svc.saveFromTripPlace(stranger.id, col.id, trip.id, place.id); } catch (e) { expect((e as { status: number }).status).toBe(404); }
  });
});

// ── status + move ────────────────────────────────────────────────────────────

describe('status + updatePlace move', () => {
  it('COLLECTIONS-SVC-016: setStatus cycles idea→want→visited', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'S' });
    const p = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Place' })).place!;
    expect(p.status).toBe('idea');
    expect((await svc.setStatus(u.id, p.id, 'want')).status).toBe('want');
    expect((await svc.setStatus(u.id, p.id, 'visited')).status).toBe('visited');
  });

  it('COLLECTIONS-SVC-017: updatePlace moves to another list (asserts access on target, resets owner_id)', async () => {
    const owner = createUser(testDb).user;
    const a = await svc.createCollection(owner.id, { name: 'A' });
    const targetOwner = createUser(testDb).user;
    const b = await svc.createCollection(targetOwner.id, { name: 'B' });
    // owner is also an accepted member of b so the move target is visible to them
    await joinCollection(b.id, owner.id);

    const p = (await svc.savePlace(owner.id, { collection_id: a.id, name: 'Movable' })).place!;
    const moved = await svc.updatePlace(owner.id, p.id, { collection_id: b.id });
    expect(moved.collection_id).toBe(b.id);
    const row = (await findRow(await orm(), CollectionPlaces, { id: p.id }))!;
    expect(row.owner_id).toBe(targetOwner.id); // reset to the target collection's owner
  });

  it('COLLECTIONS-SVC-018: updatePlace move to an inaccessible target is rejected', async () => {
    const owner = createUser(testDb).user;
    const a = await svc.createCollection(owner.id, { name: 'A' });
    const stranger = createUser(testDb).user;
    const b = await svc.createCollection(stranger.id, { name: 'B' });
    const p = (await svc.savePlace(owner.id, { collection_id: a.id, name: 'X' })).place!;
    await expect(svc.updatePlace(owner.id, p.id, { collection_id: b.id })).rejects.toThrow();
  });

  // #1870: the address column was missing from the UPDATE set, so a typo or a
  // moved restaurant could only be fixed by deleting and re-adding the place.
  it('COLLECTIONS-SVC-019: updatePlace corrects the address and clears it with null', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Rome' });
    const p = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Trattoria', address: 'Via Vechia 1' })).place!;

    expect((await svc.updatePlace(u.id, p.id, { address: 'Via Nuova 1' })).address).toBe('Via Nuova 1');
    expect((await svc.updatePlace(u.id, p.id, { address: null })).address).toBeNull();
  });

  it('COLLECTIONS-SVC-019b: an update without an address leaves the stored one alone', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Rome' });
    const p = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Trattoria', address: 'Via Vechia 1' })).place!;

    expect((await svc.updatePlace(u.id, p.id, { name: 'Trattoria da Enzo' })).address).toBe('Via Vechia 1');
  });
});

// ── copy to trip ─────────────────────────────────────────────────────────────

describe('copyToTrip', () => {
  it('COLLECTIONS-SVC-020: reduced INSERT (itinerary defaults), skips dups, copies tags', async () => {
    const u = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, u.id);
    const tag = createTag(testDb, u.id, { name: 'must-see' });
    const col = await svc.createCollection(u.id, { name: 'Plan' });
    const p1 = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Colosseum', tag_ids: [tag.id] })).place!;

    // pre-existing trip place that should make a duplicate
    createPlace(testDb, trip.id, { name: 'Pantheon' });
    const p2 = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Pantheon' })).place!;

    const res = await svc.copyToTrip(u.id, { trip_id: trip.id, place_ids: [p1.id, p2.id] });
    expect(res.copied).toBe(1);
    expect(res.skipped.map((s) => s.name)).toEqual(['Pantheon']);

    const inserted = (await findRow(await orm(), Places, { trip: trip.id, name: 'Colosseum' }))!;
    expect(inserted.reservation_status).toBe('none'); // itinerary column took the table default
    expect(inserted.duration_minutes).toBe(60);
    const tagLink = { n: await countRows(await orm(), Tags, { place_tags_inverse: inserted.id }) };
    expect(tagLink).toEqual({ n: 1 });
  });

  it('COLLECTIONS-SVC-021: rejects place_ids from a collection the user cannot see', async () => {
    const owner = createUser(testDb).user;
    const stranger = createUser(testDb).user;
    createCategory(testDb);
    const hidden = await svc.createCollection(owner.id, { name: 'Hidden' });
    const p = (await svc.savePlace(owner.id, { collection_id: hidden.id, name: 'Secret' })).place!;
    const trip = createTrip(testDb, stranger.id);

    await expect(svc.copyToTrip(stranger.id, { trip_id: trip.id, place_ids: [p.id] })).rejects.toThrow();
  });

  it('COLLECTIONS-SVC-022: rejects a trip the user cannot edit (403/404)', async () => {
    const u = createUser(testDb).user;
    const owner2 = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, owner2.id); // u has no access
    const col = await svc.createCollection(u.id, { name: 'C' });
    const p = (await svc.savePlace(u.id, { collection_id: col.id, name: 'X' })).place!;
    await expect(svc.copyToTrip(u.id, { trip_id: trip.id, place_ids: [p.id] })).rejects.toThrow();
  });

  it('COLLECTIONS-SVC-023: a trip MEMBER can copy (place_edit allowed)', async () => {
    const owner2 = createUser(testDb).user;
    const member = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, owner2.id);
    addTripMember(testDb, trip.id, member.id);
    const col = await svc.createCollection(member.id, { name: 'C' });
    const p = (await svc.savePlace(member.id, { collection_id: col.id, name: 'Forum' })).place!;
    const res = await svc.copyToTrip(member.id, { trip_id: trip.id, place_ids: [p.id] });
    expect(res.copied).toBe(1);
  });
});

// ── delete + delete-many ─────────────────────────────────────────────────────

describe('delete places', () => {
  it('COLLECTIONS-SVC-024: deletePlace + deletePlacesMany assert access', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'D' });
    const p1 = (await svc.savePlace(u.id, { collection_id: col.id, name: 'A' })).place!;
    const p2 = (await svc.savePlace(u.id, { collection_id: col.id, name: 'B' })).place!;
    await svc.deletePlace(u.id, p1.id);
    expect(await placesIn(col.id)).toEqual({ n: 1 });
    expect(await svc.deletePlacesMany(u.id, [p2.id])).toEqual([p2.id]);
    expect(await placesIn(col.id)).toEqual({ n: 0 });
  });
});

// ── Fusion state machine ─────────────────────────────────────────────────────

describe('fusion invitations', () => {
  async function setup() {
    const owner = createUser(testDb).user;
    const target = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Fusion' });
    return { owner, target, col };
  }

  it('COLLECTIONS-SVC-030: sendInvite — self 400, unknown 404, non-owner 403, happy path', async () => {
    const { owner, target, col } = await setup();
    expect((await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, owner.id))).status).toBe(400);
    expect((await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, 99999))).status).toBe(404);
    expect((await asLegacyResult(svc.sendInvite(col.id, target.id, target.username, target.email, owner.id))).status).toBe(403); // non-owner inviter

    const ok = await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id));
    expect(ok.error).toBeUndefined();
    expect(broadcastToUser).toHaveBeenCalledWith(target.id, expect.objectContaining({ type: 'collections:invite' }));
    // the notification send is fire-and-forget via a dynamic import — flush microtasks.
    await vi.waitFor(() => expect(notifSend).toHaveBeenCalledWith(expect.objectContaining({ event: 'collection_invite', targetId: target.id })));
  });

  it('COLLECTIONS-SVC-031: double-invite while pending → 400; existing member → 400', async () => {
    const { owner, target, col } = await setup();
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id));
    expect((await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id))).status).toBe(400);
    await asLegacyResult(svc.acceptInvite(target.id, col.id, undefined));
    expect((await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id))).error).toBe('Already a member');
  });

  it('COLLECTIONS-SVC-032: acceptInvite — 404 with no pending; flips to accepted → member now sees list', async () => {
    const { owner, target, col } = await setup();
    expect((await asLegacyResult(svc.acceptInvite(target.id, col.id, undefined))).status).toBe(404);
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id));
    expect((await asLegacyResult(svc.acceptInvite(target.id, col.id, undefined))).error).toBeUndefined();
    expect((await svc.listCollections(target.id)).collections.map((c) => c.id)).toContain(col.id);
  });

  it('COLLECTIONS-SVC-033: accept-after-cancel → 404 (no orphan accept)', async () => {
    const { owner, target, col } = await setup();
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id));
    await svc.cancelInvite(col.id, owner.id, target.id);
    expect((await asLegacyResult(svc.acceptInvite(target.id, col.id, undefined))).status).toBe(404);
  });

  it('COLLECTIONS-SVC-034: declineInvite removes the pending row', async () => {
    const { owner, target, col } = await setup();
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id));
    await svc.declineInvite(target.id, col.id, undefined);
    expect(await membersOf(col.id)).toEqual({ n: 0 });
  });

  it('COLLECTIONS-SVC-035: cancelInvite is owner-only', async () => {
    const { owner, target, col } = await setup();
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id));
    await expect(svc.cancelInvite(col.id, target.id, target.id)).rejects.toThrow(); // non-owner
    await svc.cancelInvite(col.id, owner.id, target.id); // owner ok
    expect(await membersOf(col.id)).toEqual({ n: 0 });
  });

  it('COLLECTIONS-SVC-036: leaveCollection — member ok, owner blocked (400)', async () => {
    const { owner, target, col } = await setup();
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id));
    await asLegacyResult(svc.acceptInvite(target.id, col.id, undefined));
    await svc.leaveCollection(target.id, col.id, undefined);
    expect((await svc.listCollections(target.id)).collections.map((c) => c.id)).not.toContain(col.id);

    await expect(svc.leaveCollection(owner.id, col.id, undefined)).rejects.toThrow();
    try { await svc.leaveCollection(owner.id, col.id, undefined); } catch (e) { expect((e as { status: number }).status).toBe(400); }
  });

  it('COLLECTIONS-SVC-037: availableUsers is scoped to THIS collection only (no one-fusion bug)', async () => {
    const owner = createUser(testDb).user;
    const target = createUser(testDb).user;
    const colA = await svc.createCollection(owner.id, { name: 'A' });
    const colB = await svc.createCollection(owner.id, { name: 'B' });
    // target is accepted in A; must still be invitable to B
    await asLegacyResult(svc.sendInvite(colA.id, owner.id, owner.username, owner.email, target.id));
    await asLegacyResult(svc.acceptInvite(target.id, colA.id, undefined));

    const forB = (await svc.availableUsers(owner.id, colB.id)).map((u) => u.id);
    expect(forB).toContain(target.id);
    const forA = (await svc.availableUsers(owner.id, colA.id)).map((u) => u.id);
    expect(forA).not.toContain(target.id); // already a member of A
  });

  it('COLLECTIONS-SVC-038: availableUsers excludes self + guests', async () => {
    const owner = createUser(testDb).user;
    const normal = createUser(testDb).user;
    const guest = createUser(testDb).user;
    await updateRows(await orm(), Users, { id: guest.id }, { is_guest: 1 });
    const col = await svc.createCollection(owner.id, { name: 'C' });
    const ids = (await svc.availableUsers(owner.id, col.id)).map((u) => u.id);
    expect(ids).toContain(normal.id);
    expect(ids).not.toContain(owner.id);
    expect(ids).not.toContain(guest.id);
  });

  it('COLLECTIONS-SVC-039: visibility = owner OR accepted member (pending does NOT grant access)', async () => {
    const { owner, target, col } = await setup();
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, target.id));
    await expect(svc.getCollection(target.id, col.id)).rejects.toThrow(); // pending, no access yet
    await asLegacyResult(svc.acceptInvite(target.id, col.id, undefined));
    expect((await svc.getCollection(target.id, col.id)).collection.id).toBe(col.id);
  });
});

// ── deleteCollection snapshot + broadcast + cascade ──────────────────────────

describe('deleteCollection', () => {
  it('COLLECTIONS-SVC-040: owner-only; snapshots accepted+pending, broadcasts collections:deleted, cascades', async () => {
    const owner = createUser(testDb).user;
    const accepted = createUser(testDb).user;
    const pending = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Doomed' });
    await svc.savePlace(owner.id, { collection_id: col.id, name: 'P' });
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, accepted.id));
    await asLegacyResult(svc.acceptInvite(accepted.id, col.id, undefined));
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, pending.id));

    // a non-owner member cannot delete
    await expect(svc.deleteCollection(accepted.id, col.id)).rejects.toThrow();

    broadcastToUser.mockClear();
    await svc.deleteCollection(owner.id, col.id);

    const targets = broadcastToUser.mock.calls.map((c) => c[0]);
    expect(targets).toEqual(expect.arrayContaining([accepted.id, pending.id]));
    expect(targets).not.toContain(owner.id);
    expect(broadcastToUser.mock.calls.every((c) => (c[1] as { type: string }).type === 'collections:deleted')).toBe(true);

    expect(await countRows(await orm(), Collections, { id: col.id })).toBe(0);
    expect(await placesIn(col.id)).toEqual({ n: 0 });
    expect(await membersOf(col.id)).toEqual({ n: 0 });
  });
});

// ── owner_id semantics: member account deletion keeps shared content ─────────

describe('owner_id semantics', () => {
  it('COLLECTIONS-SVC-041: deleting a MEMBER account nulls saved_by but keeps the place', async () => {
    const owner = createUser(testDb).user;
    const member = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Shared' });
    await joinCollection(col.id, member.id);
    const p = (await svc.savePlace(member.id, { collection_id: col.id, name: 'Kept' })).place!;

    await deleteRows(await orm(), Users, { id: member.id });

    const row = (await findRow(await orm(), CollectionPlaces, { id: p.id }))!;
    expect(row).not.toBeNull();
    expect(row.owner_id).toBe(owner.id);
    expect(row.saved_by).toBeNull(); // ON DELETE SET NULL
  });
});

// ── Photo-cache guard ────────────────────────────────────────────────────────

describe('photo-cache widening', () => {
  it('COLLECTIONS-SVC-042: a collection_places row keeps a photo no places row references', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Photos' });
    // cache meta for place_id 'gp-x', referenced ONLY by a collection_places row.
    await insertRow(await orm(), GooglePlacePhotoMeta, { place_id: 'gp-x', attribution: null, fetched_at: Date.now() });
    await svc.savePlace(u.id, { collection_id: col.id, name: 'Cached', google_place_id: 'gp-x' });

    await removeIfUnreferenced('gp-x'); // would evict if isReferenced ignored collection_places

    const meta = await findRow(await orm(), GooglePlacePhotoMeta, { place_id: 'gp-x' });
    expect(meta).not.toBeNull();
  });

  it('COLLECTIONS-SVC-043: an unreferenced photo is still reclaimable', async () => {
    await insertRow(await orm(), GooglePlacePhotoMeta, { place_id: 'gp-orphan', attribution: null, fetched_at: Date.now() });
    await removeIfUnreferenced('gp-orphan');
    const meta = await findRow(await orm(), GooglePlacePhotoMeta, { place_id: 'gp-orphan' });
    expect(meta).toBeNull();
  });
});

// ── Labels ───────────────────────────────────────────────────────────────────

function addMember(colId: number, userId: number, role: 'viewer' | 'editor' | 'admin') {
  return joinCollection(colId, userId, role);
}

describe('collection labels', () => {
  it('COLLECTIONS-SVC-050: createLabel is returned by getCollection; duplicate name is 409', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Germany' });
    const label = await svc.createLabel(u.id, col.id, 'Berlin', '#ff0000');
    expect(label.name).toBe('Berlin');
    expect(label.collection_id).toBe(col.id);
    expect((await svc.getCollection(u.id, col.id)).collection.labels).toHaveLength(1);

    await expect(svc.createLabel(u.id, col.id, 'berlin')).rejects.toThrow(); // case-insensitive dup
    try { await svc.createLabel(u.id, col.id, 'berlin'); } catch (e) { expect((e as { status: number }).status).toBe(409); }
  });

  it('COLLECTIONS-SVC-051: a viewer cannot manage labels (403); an editor can', async () => {
    const owner = createUser(testDb).user;
    const viewer = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Trip' });
    await addMember(col.id, viewer.id, 'viewer');
    await expect(svc.createLabel(viewer.id, col.id, 'X')).rejects.toThrow(expect.objectContaining({ status: 403, message: 'You have read-only access to this list' }));
    expect((await svc.getCollection(owner.id, col.id)).collection.labels).toHaveLength(0);

    const editor = createUser(testDb).user;
    await addMember(col.id, editor.id, 'editor');
    expect((await svc.createLabel(editor.id, col.id, 'Museums')).id).toBeGreaterThan(0);
  });

  it('COLLECTIONS-SVC-052: updatePlace label_ids sets labels; a label from another list is ignored', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'DE' });
    const other = await svc.createCollection(u.id, { name: 'Other' });
    const l1 = await svc.createLabel(u.id, col.id, 'Berlin');
    const foreign = await svc.createLabel(u.id, other.id, 'Paris');
    const place = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Gate' })).place!;
    await svc.updatePlace(u.id, place.id, { label_ids: [l1.id, foreign.id] });
    const stored = (await svc.getCollection(u.id, col.id)).places.find(p => p.id === place.id)!;
    expect(stored.label_ids).toEqual([l1.id]);
  });

  it('COLLECTIONS-SVC-053: assignLabels bulk-adds then unassigns across places', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'DE' });
    const l = await svc.createLabel(u.id, col.id, 'Coast');
    const p1 = (await svc.savePlace(u.id, { collection_id: col.id, name: 'A' })).place!;
    const p2 = (await svc.savePlace(u.id, { collection_id: col.id, name: 'B' })).place!;

    expect((await svc.assignLabels(u.id, [l.id], [p1.id, p2.id], false)).changed).toBe(2);
    expect((await svc.getCollection(u.id, col.id)).places.every(p => p.label_ids?.includes(l.id))).toBe(true);

    await svc.assignLabels(u.id, [l.id], [p1.id], true);
    const after = (await svc.getCollection(u.id, col.id)).places;
    expect(after.find(p => p.id === p1.id)!.label_ids).toEqual([]);
    expect(after.find(p => p.id === p2.id)!.label_ids).toEqual([l.id]);
  });

  it('COLLECTIONS-SVC-054: deleteLabel removes it and cascades its place assignments', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'DE' });
    const l = await svc.createLabel(u.id, col.id, 'Berlin');
    const p = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Gate' })).place!;
    await svc.updatePlace(u.id, p.id, { label_ids: [l.id] });

    await svc.deleteLabel(u.id, l.id);
    expect((await svc.getCollection(u.id, col.id)).collection.labels).toHaveLength(0);
    expect((await svc.getCollection(u.id, col.id)).places.find(x => x.id === p.id)!.label_ids).toEqual([]);
  });

  it('COLLECTIONS-SVC-055: moving a place to another list drops its labels', async () => {
    const u = createUser(testDb).user;
    const a = await svc.createCollection(u.id, { name: 'A' });
    const b = await svc.createCollection(u.id, { name: 'B' });
    const l = await svc.createLabel(u.id, a.id, 'Berlin');
    const p = (await svc.savePlace(u.id, { collection_id: a.id, name: 'Gate' })).place!;
    await svc.updatePlace(u.id, p.id, { label_ids: [l.id] });

    await svc.updatePlace(u.id, p.id, { collection_id: b.id });
    expect((await svc.getCollection(u.id, b.id)).places.find(x => x.id === p.id)!.label_ids).toEqual([]);
  });
});

// ── Custom saved-place image (#1136) ─────────────────────────────────────────

describe('custom saved-place image', () => {
  function writePlaceImage(name: string): string {
    const filePath = path.join(storageFx.root, name);
    fs.writeFileSync(filePath, 'jpeg-bytes');
    return filePath;
  }

  it('COLLECTIONS-SVC-060: updatePlace sets image_url', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Photos' });
    const p = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Pic' })).place!;
    const updated = await svc.updatePlace(u.id, p.id, { image_url: '/uploads/places/col-set.jpg' });
    expect(updated.image_url).toBe('/uploads/places/col-set.jpg');
  });

  it('COLLECTIONS-SVC-061: setPlaceImage stores the url and reclaims a replaced upload', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Photos' });
    const p = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Pic' })).place!;
    const fileA = writePlaceImage('col-replace-a.jpg');
    await svc.setPlaceImage(u.id, p.id, '/uploads/places/col-replace-a.jpg');
    expect(fs.existsSync(fileA)).toBe(true);

    const res = await svc.setPlaceImage(u.id, p.id, '/uploads/places/col-replace-b.jpg');
    expect(res.image_url).toBe('/uploads/places/col-replace-b.jpg');
    expect(fs.existsSync(fileA)).toBe(false);
  });

  it('COLLECTIONS-SVC-062: deletePlace reclaims the uploaded image when unreferenced', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Photos' });
    const p = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Pic', image_url: '/uploads/places/col-delete.jpg' })).place!;
    const fileA = writePlaceImage('col-delete.jpg');
    expect(fs.existsSync(fileA)).toBe(true);

    await svc.deletePlace(u.id, p.id);
    expect(fs.existsSync(fileA)).toBe(false);
  });
});

// ── Collaborative ratings (#1435) ────────────────────────────────────────────

describe('collaborative ratings (#1435)', () => {
  it('COLLECTIONS-SVC-070: setRating stores a vote, updates it, and clears with null', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Rate' });
    const p = (await svc.savePlace(u.id, { collection_id: col.id, name: 'Louvre' })).place!;

    let updated = await svc.setRating(u.id, p.id, 5);
    expect(updated.rating_avg).toBe(5);
    expect(updated.rating_count).toBe(1);
    expect(updated.ratings?.find(r => r.user_id === u.id)?.rating).toBe(5);

    updated = await svc.setRating(u.id, p.id, 3); // same user re-votes → replaces, not appends
    expect(updated.rating_avg).toBe(3);
    expect(updated.rating_count).toBe(1);

    updated = await svc.setRating(u.id, p.id, null); // clear
    expect(updated.rating_avg).toBeNull();
    expect(updated.rating_count).toBe(0);
  });

  it('COLLECTIONS-SVC-071: every accepted member may vote; the value is the average', async () => {
    const owner = createUser(testDb).user;
    const member = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Shared rate' });
    // A viewer (read-only) member — still allowed to cast a personal vote.
    await joinCollection(col.id, member.id, 'viewer');
    const p = (await svc.savePlace(owner.id, { collection_id: col.id, name: 'Notre-Dame' })).place!;

    await svc.setRating(owner.id, p.id, 5);
    const updated = await svc.setRating(member.id, p.id, 2);
    expect(updated.rating_count).toBe(2);
    expect(updated.rating_avg).toBe(3.5);
  });

  it('COLLECTIONS-SVC-072: a non-member cannot rate', async () => {
    const owner = createUser(testDb).user;
    const outsider = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Private rate' });
    const p = (await svc.savePlace(owner.id, { collection_id: col.id, name: 'Secret' })).place!;
    await expect(svc.setRating(outsider.id, p.id, 4)).rejects.toThrow();
  });

  it('COLLECTIONS-SVC-073: saving a trip place copies only the saver + shared-member votes', async () => {
    const owner = createUser(testDb).user;
    const shared = createUser(testDb).user;   // member of BOTH the trip and the collection
    const tripOnly = createUser(testDb).user; // member of the trip only
    const col = await svc.createCollection(owner.id, { name: 'From trip rated' });
    await joinCollection(col.id, shared.id, 'editor');

    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, shared.id);
    addTripMember(testDb, trip.id, tripOnly.id);
    const place = createPlace(testDb, trip.id, { name: 'Colosseum' });
    await insertRow(await orm(), PlaceRatings, { place: place.id, user: owner.id, rating: 5 });
    await insertRow(await orm(), PlaceRatings, { place: place.id, user: shared.id, rating: 4 });
    await insertRow(await orm(), PlaceRatings, { place: place.id, user: tripOnly.id, rating: 1 });

    const saved = (await svc.savePlace(owner.id, {
      collection_id: col.id, name: 'Colosseum', source_trip_id: trip.id, source_place_id: place.id,
    })).place!;

    const votes = await savedPlaceVotes(saved.id);
    const voterIds = votes.map(v => v.user_id).sort((a, b) => a - b);
    expect(voterIds).toEqual([owner.id, shared.id].sort((a, b) => a - b));
    expect(votes.find(v => v.user_id === tripOnly.id)).toBeUndefined();
  });

  it('COLLECTIONS-SVC-074: copying a saved place into a trip carries its ratings along', async () => {
    const owner = createUser(testDb).user;
    const member = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Copyable' });
    await joinCollection(col.id, member.id, 'editor');
    const cp = (await svc.savePlace(owner.id, { collection_id: col.id, name: 'Trevi' })).place!;
    await svc.setRating(owner.id, cp.id, 5);
    await svc.setRating(member.id, cp.id, 3);

    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id); // member is on the trip, so their vote carries
    const res = await svc.copyToTrip(owner.id, { trip_id: trip.id, place_ids: [cp.id] });
    expect(res.copied).toBe(1);

    const newPlace = await newestPlace(trip.id);
    const votes = await placeVotes(newPlace.id);
    expect(votes).toHaveLength(2);
    expect(votes.find(v => v.user_id === owner.id)?.rating).toBe(5);
    expect(votes.find(v => v.user_id === member.id)?.rating).toBe(3);
  });

  it('COLLECTIONS-SVC-075: savePlace does NOT harvest ratings from a source place the caller cannot access', async () => {
    const attacker = createUser(testDb).user;
    const victim = createUser(testDb).user;
    const col = await svc.createCollection(attacker.id, { name: 'Harvest attempt' });
    // The victim is a member of the attacker's collection (so they'd be "eligible").
    await joinCollection(col.id, victim.id, 'editor');
    // A PRIVATE trip the attacker is not on, with the victim's vote on a place.
    const privateTrip = createTrip(testDb, victim.id);
    const secret = createPlace(testDb, privateTrip.id, { name: 'Secret spot' });
    await insertRow(await orm(), PlaceRatings, { place: secret.id, user: victim.id, rating: 5 });

    const saved = (await svc.savePlace(attacker.id, {
      collection_id: col.id, name: 'x', source_trip_id: privateTrip.id, source_place_id: secret.id,
    })).place!;

    const stolen = await savedPlaceVotes(saved.id);
    expect(stolen).toHaveLength(0); // no access to the source trip → nothing copied
  });

  it('COLLECTIONS-SVC-076: copyToTrip carries only votes from members of the target trip', async () => {
    const owner = createUser(testDb).user;
    const inTrip = createUser(testDb).user;    // collection member AND trip member
    const notInTrip = createUser(testDb).user; // collection member only
    const col = await svc.createCollection(owner.id, { name: 'Mixed membership' });
    for (const u of [inTrip, notInTrip]) {
      await joinCollection(col.id, u.id, 'editor');
    }
    const cp = (await svc.savePlace(owner.id, { collection_id: col.id, name: 'Pantheon' })).place!;
    await svc.setRating(owner.id, cp.id, 5);
    await svc.setRating(inTrip.id, cp.id, 4);
    await svc.setRating(notInTrip.id, cp.id, 1);

    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, inTrip.id);
    await svc.copyToTrip(owner.id, { trip_id: trip.id, place_ids: [cp.id] });

    const newPlace = await newestPlace(trip.id);
    const ids = (await placeVotes(newPlace.id))
      .map(v => v.user_id).sort((a, b) => a - b);
    expect(ids).toEqual([owner.id, inTrip.id].sort((a, b) => a - b));
    expect(ids).not.toContain(notInTrip.id);
  });
});

// ── Membership lookups ───────────────────────────────────────────────────────

describe('membership lookups', () => {
  it('COLLECTIONS-SVC-080: findMembership matches by google id and coords, never by bare name', async () => {
    const u = createUser(testDb).user;
    const col = await svc.createCollection(u.id, { name: 'Lookup' });
    await svc.savePlace(u.id, { collection_id: col.id, name: 'Starbucks', lat: 48.8584, lng: 2.2945, google_place_id: 'gp-1' });

    expect((await svc.findMembership(u.id, { google_place_id: 'gp-1' })).saved).toBe(true);
    expect((await svc.findMembership(u.id, { lat: 48.8584, lng: 2.2945 })).saved).toBe(true);
    // A bare name is deliberately NOT a condition on its own — no false positives.
    expect(await svc.findMembership(u.id, { name: 'Starbucks' })).toEqual({ saved: false, lists: [] });
    // No lists at all short-circuits.
    const other = createUser(testDb).user;
    expect(await svc.findMembership(other.id, { google_place_id: 'gp-1' })).toEqual({ saved: false, lists: [] });
  });

  it('COLLECTIONS-SVC-081: findMembershipForUser reports owner / accepted / pending / none', async () => {
    const owner = createUser(testDb).user;
    const member = createUser(testDb).user;
    const outsider = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'M' });

    expect(await svc.findMembershipForUser(owner.id, col.id)).toEqual({ is_member: true, is_owner: true, status: 'accepted' });
    expect(await svc.findMembershipForUser(outsider.id, col.id)).toEqual({ is_member: false, is_owner: false, status: null });

    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, member.id));
    expect(await svc.findMembershipForUser(member.id, col.id)).toEqual({ is_member: false, is_owner: false, status: 'pending' });
    await asLegacyResult(svc.acceptInvite(member.id, col.id, undefined));
    expect(await svc.findMembershipForUser(member.id, col.id)).toEqual({ is_member: true, is_owner: false, status: 'accepted' });
  });
});

// ── Post-fold quirk fixes (the trailing fix(server) commit) ─────────────────

describe('atomic bulk writes (post-fold quirk fixes)', () => {
  it('COLLECTIONS-SVC-090: deletePlacesMany is all-or-nothing — a mid-list 403 deletes nothing', async () => {
    const u = createUser(testDb).user;
    const otherOwner = createUser(testDb).user;
    const mine = await svc.createCollection(u.id, { name: 'Mine' });
    const shared = await svc.createCollection(otherOwner.id, { name: 'Shared' });
    // u is an editor on the shared list — can add/edit but NOT delete (owner/admin only).
    await joinCollection(shared.id, u.id, 'editor');
    const p1 = (await svc.savePlace(u.id, { collection_id: mine.id, name: 'Deletable' })).place!;
    const p2 = (await svc.savePlace(u.id, { collection_id: shared.id, name: 'Protected' })).place!;

    // The relocated legacy interleaved checks with deletes, so p1 was gone by
    // the time p2's 403 fired. Now every id is checked first: nothing deleted.
    await expect(svc.deletePlacesMany(u.id, [p1.id, p2.id])).rejects.toThrow('Only an admin can delete places from this list');
    expect(await countRows(await orm(), CollectionPlaces, { id: p1.id })).toBe(1);
    expect(await countRows(await orm(), CollectionPlaces, { id: p2.id })).toBe(1);
  });

  it('COLLECTIONS-SVC-091: assignLabels permission-checks every list before writing anything', async () => {
    const u = createUser(testDb).user;
    const otherOwner = createUser(testDb).user;
    const mine = await svc.createCollection(u.id, { name: 'Mine' });
    const readonly = await svc.createCollection(otherOwner.id, { name: 'ReadOnly' });
    await joinCollection(readonly.id, u.id, 'viewer');
    const label = await svc.createLabel(u.id, mine.id, 'Coast');
    const pa = (await svc.savePlace(u.id, { collection_id: mine.id, name: 'A' })).place!;
    const pb = await insertRow(await orm(), CollectionPlaces, { collection: readonly.id, owner: otherOwner.id, savedByRef: otherOwner.id, name: 'B' });

    // The relocated legacy checked per list inside the write loop, so `mine`
    // was labeled before `readonly`'s 403 fired. Now all lists check first.
    await expect(svc.assignLabels(u.id, [label.id], [pa.id, Number(pb)], false)).rejects.toThrow('You have read-only access to this list');
    expect(await countRows(await orm(), CollectionLabels, { collection_place_labels_inverse: pa.id })).toBe(0);
  });

  it('COLLECTIONS-SVC-092: from-trip saves forward the socket id so the origin client does not echo', async () => {
    const u = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, u.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    // Distinct coords — the factory default would coord-dedup against Louvre.
    const place2 = createPlace(testDb, trip.id, { name: 'Orsay', lat: 48.86, lng: 2.3266 });
    const col = await svc.createCollection(u.id, { name: 'From trip' });

    broadcastToUser.mockClear();
    await svc.saveFromTripPlace(u.id, col.id, trip.id, place.id, undefined, 'sock-1');
    expect(broadcastToUser).toHaveBeenCalledWith(u.id, expect.objectContaining({ type: 'collections:updated' }), 'sock-1');

    broadcastToUser.mockClear();
    await svc.saveFromTripPlaces(u.id, col.id, trip.id, [place2.id], undefined, 'sock-2');
    expect(broadcastToUser).toHaveBeenCalledWith(u.id, expect.objectContaining({ type: 'collections:updated' }), 'sock-2');
  });
});

// ── Bulk "visited" from a trip (#1469) ───────────────────────────────────────

/** The stored status of a saved place, read straight off the row. */
async function statusOf(placeId: number): Promise<string> {
  return (await findRow(await orm(), CollectionPlaces, { id: placeId }))!.status;
}

describe('bulk status', () => {
  it('COLLECTIONS-SVC-093: setStatusMany writes one status across lists and counts only real changes', async () => {
    const u = createUser(testDb).user;
    const a = await svc.createCollection(u.id, { name: 'A' });
    const b = await svc.createCollection(u.id, { name: 'B' });
    const pa = (await svc.savePlace(u.id, { collection_id: a.id, name: 'Louvre' })).place!;
    const pb = (await svc.savePlace(u.id, { collection_id: b.id, name: 'Louvre' })).place!;
    await svc.setStatus(u.id, pb.id, 'visited');

    // pb is already visited, so only pa is a change.
    expect(await svc.setStatusMany(u.id, [pa.id, pb.id], 'visited')).toEqual({ updated: 1 });
    expect(await statusOf(pa.id)).toBe('visited');
    expect(await svc.setStatusMany(u.id, [pa.id, pb.id], 'visited')).toEqual({ updated: 0 });
  });

  it('COLLECTIONS-SVC-094: setStatusMany is all-or-nothing — a read-only list stops the batch', async () => {
    const owner = createUser(testDb).user;
    const viewer = createUser(testDb).user;
    const mine = await svc.createCollection(viewer.id, { name: 'Mine' });
    const readonly = await svc.createCollection(owner.id, { name: 'Shared' });
    await addMember(readonly.id, viewer.id, 'viewer');
    const p1 = (await svc.savePlace(viewer.id, { collection_id: mine.id, name: 'Louvre' })).place!;
    const p2 = (await svc.savePlace(owner.id, { collection_id: readonly.id, name: 'Louvre' })).place!;

    await expect(svc.setStatusMany(viewer.id, [p1.id, p2.id], 'visited')).rejects.toThrow('You have read-only access to this list');
    expect(await statusOf(p1.id)).toBe('idea');
  });

  it('COLLECTIONS-SVC-095: setStatusFromTrip marks every saved copy of the selected trip places', async () => {
    const u = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, u.id);
    const louvre = createPlace(testDb, trip.id, { name: 'Louvre', lat: 48.8606, lng: 2.3376 });
    const orsay = createPlace(testDb, trip.id, { name: 'Orsay', lat: 48.86, lng: 2.3266 });
    const a = await svc.createCollection(u.id, { name: 'Paris' });
    const b = await svc.createCollection(u.id, { name: 'Museums' });
    await svc.saveFromTripPlace(u.id, a.id, trip.id, louvre.id);
    await svc.saveFromTripPlace(u.id, b.id, trip.id, louvre.id);
    await svc.saveFromTripPlace(u.id, a.id, trip.id, orsay.id);

    expect(await svc.setStatusFromTrip(u.id, trip.id, [louvre.id], 'visited')).toEqual({ updated: 2, places: 1 });
    const statuses = await findRows(await orm(), CollectionPlaces, {}, { id: 'asc' });
    expect(statuses.map(s => s.status)).toEqual(['visited', 'visited', 'idea']);
  });

  it('COLLECTIONS-SVC-096: a place renamed in the list is still found by its source link', async () => {
    const u = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, u.id);
    const place = createPlace(testDb, trip.id, { name: 'Trattoria da Enzo', lat: 41.88, lng: 12.47 });
    const col = await svc.createCollection(u.id, { name: 'Rome' });
    const saved = (await svc.saveFromTripPlace(u.id, col.id, trip.id, place.id)).place!;
    // Renamed on both sides, and moved far enough that coordinates cannot match.
    await svc.updatePlace(u.id, saved.id, { name: 'Dinner spot', lat: 45, lng: 9 });
    await updateRows(await orm(), Places, { id: place.id }, { name: 'Enzo' });

    expect(await svc.setStatusFromTrip(u.id, trip.id, [place.id], 'visited')).toEqual({ updated: 1, places: 1 });
  });

  it('COLLECTIONS-SVC-097: a trip the caller cannot see is a 404, and unsaved places are a no-op', async () => {
    const u = createUser(testDb).user;
    const stranger = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, u.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });

    await expect(svc.setStatusFromTrip(stranger.id, trip.id, [place.id], 'visited')).rejects.toThrow('Trip not found');
    expect(await svc.setStatusFromTrip(u.id, trip.id, [place.id], 'visited')).toEqual({ updated: 0, places: 0 });
  });

  it('COLLECTIONS-SVC-098: lists the caller may only read are skipped, not refused', async () => {
    const owner = createUser(testDb).user;
    const viewer = createUser(testDb).user;
    createCategory(testDb);
    const trip = createTrip(testDb, viewer.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre', lat: 48.8606, lng: 2.3376 });
    const readonly = await svc.createCollection(owner.id, { name: 'Shared' });
    await addMember(readonly.id, viewer.id, 'viewer');
    const theirs = (await svc.savePlace(owner.id, { collection_id: readonly.id, name: 'Louvre', lat: 48.8606, lng: 2.3376 })).place!;

    expect(await svc.setStatusFromTrip(viewer.id, trip.id, [place.id], 'visited')).toEqual({ updated: 0, places: 0 });
    expect(await statusOf(theirs.id)).toBe('idea');
  });

  it('COLLECTIONS-SVC-099: findMembership reports the per-list status and edit right', async () => {
    const owner = createUser(testDb).user;
    const viewer = createUser(testDb).user;
    const readonly = await svc.createCollection(owner.id, { name: 'Shared' });
    await addMember(readonly.id, viewer.id, 'viewer');
    const saved = (await svc.savePlace(owner.id, { collection_id: readonly.id, name: 'Louvre', google_place_id: 'gp-9' })).place!;
    await svc.setStatus(owner.id, saved.id, 'visited');

    expect((await svc.findMembership(viewer.id, { google_place_id: 'gp-9' })).lists).toEqual([
      { collection_id: readonly.id, name: 'Shared', place_id: saved.id, status: 'visited', can_edit: false },
    ]);
    expect((await svc.findMembership(owner.id, { google_place_id: 'gp-9' })).lists[0].can_edit).toBe(true);
  });
});

// ── Export / import as a file (#2198) ────────────────────────────────────────

describe('exportCollection / importCollection (#2198)', () => {
  /** A list with two labels, a category and one place carrying both. */
  async function seedList(ownerId: number) {
    const cat = createCategory(testDb, { name: 'Restaurant' });
    const col = await svc.createCollection(ownerId, { name: 'Lisbon', description: 'Three days', color: '#ef4444' });
    const must = await svc.createLabel(ownerId, col.id, 'Must see', '#ff0000');
    const rain = await svc.createLabel(ownerId, col.id, 'Rainy day', '#00ff00');
    const market = (await svc.savePlace(ownerId, {
      collection_id: col.id, name: 'Time Out Market', description: 'Market hall',
      lat: 38.7071, lng: -9.1459, address: 'Av. 24 de Julho 49', notes: 'Before noon',
      website: 'https://timeoutmarket.com/', phone: '+351 210 606 040', osm_id: 'node/1',
      status: 'want', category_id: cat.id, price: 12, currency: 'EUR',
    })).place!;
    const view = (await svc.savePlace(ownerId, { collection_id: col.id, name: 'Miradouro', lat: 38.7195, lng: -9.1327 })).place!;
    await svc.assignLabels(ownerId, [must.id], [market.id], false);
    await svc.assignLabels(ownerId, [rain.id], [view.id], false);
    return { col, cat, must, rain, market, view };
  }

  it('COLLECTIONS-SVC-100: a file carries the list, its labels and each place with its label names', async () => {
    const owner = createUser(testDb).user;
    const { col, market } = await seedList(owner.id);

    const file = await svc.exportCollection(owner.id, col.id);

    expect(file.format).toBe('trek.collection');
    expect(file.version).toBe(1);
    expect(file).toMatchObject({ name: 'Lisbon', description: 'Three days', color: '#ef4444' });
    expect(file.labels).toEqual([
      { name: 'Must see', color: '#ff0000' },
      { name: 'Rainy day', color: '#00ff00' },
    ]);
    expect(file.places).toHaveLength(2);
    const first = file.places[0] as Record<string, unknown>;
    expect(first).toMatchObject({
      name: 'Time Out Market', description: 'Market hall', lat: 38.7071, lng: -9.1459,
      address: 'Av. 24 de Julho 49', notes: 'Before noon', website: 'https://timeoutmarket.com/',
      phone: '+351 210 606 040', osm_id: 'node/1', status: 'want', price: 12, currency: 'EUR',
      category: 'Restaurant', labels: ['Must see'],
    });
    expect(market.id).toBeGreaterThan(0);
  });

  it('COLLECTIONS-SVC-101: a file carries no ids, no members and no ratings', async () => {
    const owner = createUser(testDb).user;
    const member = createUser(testDb).user;
    const { col, market } = await seedList(owner.id);
    await addMember(col.id, member.id, 'editor');
    await svc.setRating(member.id, market.id, 5);

    const file = await svc.exportCollection(owner.id, col.id);
    const serialised = JSON.stringify(file);

    for (const forbidden of ['"id"', 'collection_id', 'owner_id', 'saved_by', 'source_trip_id', 'source_place_id', 'rating', 'user_id', 'category_id']) {
      expect(serialised, forbidden).not.toContain(forbidden);
    }
  });

  it('COLLECTIONS-SVC-102: an instance-local image path does not leave the instance', async () => {
    const owner = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Pictures' });
    await svc.savePlace(owner.id, { collection_id: col.id, name: 'Uploaded', image_url: '/uploads/places/secret.jpg' });
    await svc.savePlace(owner.id, { collection_id: col.id, name: 'Proxied', image_url: '/api/maps/place-photo/abc' });
    await svc.savePlace(owner.id, { collection_id: col.id, name: 'Remote', image_url: 'https://example.com/photo.jpg' });

    const images = (await svc.exportCollection(owner.id, col.id)).places.map(p => (p as { image_url?: string | null }).image_url);

    expect(images).toEqual([null, null, 'https://example.com/photo.jpg']);
  });

  it('COLLECTIONS-SVC-103: a member may export, a stranger may not', async () => {
    const owner = createUser(testDb).user;
    const viewer = createUser(testDb).user;
    const stranger = createUser(testDb).user;
    const { col } = await seedList(owner.id);
    await addMember(col.id, viewer.id, 'viewer');

    expect((await svc.exportCollection(viewer.id, col.id)).places).toHaveLength(2);
    try {
      await svc.exportCollection(stranger.id, col.id);
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as { status: number }).status).toBe(404);
    }
  });

  it('COLLECTIONS-SVC-104: a file round-trips into an equivalent list of the importer', async () => {
    const owner = createUser(testDb).user;
    const other = createUser(testDb).user;
    const { col } = await seedList(owner.id);
    const file = await svc.exportCollection(owner.id, col.id);

    const result = await svc.importCollection(other.id, { file });
    const created = result.collection as { id: number; owner_id: number; name: string };

    expect(result).toMatchObject({ imported: 2, skipped: 0 });
    expect(created.owner_id).toBe(other.id);
    expect(created.name).toBe('Lisbon');
    // Re-exporting the copy gives the same file, bar the timestamp.
    const again = await svc.exportCollection(other.id, created.id);
    expect({ ...again, exported_at: undefined }).toEqual({ ...file, exported_at: undefined });
  });

  it('COLLECTIONS-SVC-105: the importer may rename the list on the way in', async () => {
    const owner = createUser(testDb).user;
    const { col } = await seedList(owner.id);
    const file = await svc.exportCollection(owner.id, col.id);

    const created = (await svc.importCollection(owner.id, { file, name: 'Lisbon (from Ana)' })).collection as { id: number; name: string };

    expect(created.name).toBe('Lisbon (from Ana)');
    // And the original is untouched.
    expect((await svc.getCollection(owner.id, col.id)).collection.name).toBe('Lisbon');
  });

  it('COLLECTIONS-SVC-106: a category arrives by name, matched case-insensitively, unknown names drop', async () => {
    const owner = createUser(testDb).user;
    createCategory(testDb, { name: 'Restaurant' });

    const created = (await svc.importCollection(owner.id, { file: {
      format: 'trek.collection', version: 1, name: 'Categories', places: [
        { name: 'Exact', category: 'Restaurant' },
        { name: 'Sloppy', category: '  rEsTaUrAnT  ' },
        { name: 'Unknown', category: 'Not a category here' },
        { name: 'None' },
      ],
    } })).collection as { id: number };

    const places = (await svc.getCollection(owner.id, created.id)).places;
    expect(places.map(p => p.category?.name ?? null)).toEqual(['Restaurant', 'Restaurant', null, null]);
  });

  it('COLLECTIONS-SVC-107: labels are recreated and only names the file defines are assigned', async () => {
    const owner = createUser(testDb).user;

    const created = (await svc.importCollection(owner.id, { file: {
      format: 'trek.collection', version: 1, name: 'Labelled',
      labels: [{ name: 'Must see', color: '#ff0000' }, { name: 'Must see', color: '#00ff00' }],
      places: [
        { name: 'Tagged', labels: ['Must see'] },
        { name: 'Sloppy case', labels: ['  MUST SEE '] },
        { name: 'Ghost label', labels: ['Never defined'] },
      ],
    } })).collection as { id: number };

    const detail = await svc.getCollection(owner.id, created.id);
    // The duplicate name collapses to one label.
    expect(detail.collection.labels).toHaveLength(1);
    const labelId = detail.collection.labels![0].id;
    expect(detail.places.map(p => p.label_ids)).toEqual([[labelId], [labelId], []]);
  });

  it('COLLECTIONS-SVC-108: a place the contract refuses is skipped, the rest still arrive', async () => {
    const owner = createUser(testDb).user;

    const result = await svc.importCollection(owner.id, { file: {
      format: 'trek.collection', version: 1, name: 'Mixed', places: [
        { name: 'Good' },
        { noName: true },
        { name: '' },
        { name: 'Also good' },
        null,
      ],
    } });

    expect(result).toMatchObject({ imported: 2, skipped: 3 });
    const created = result.collection as { id: number };
    expect((await svc.getCollection(owner.id, created.id)).places.map(p => p.name)).toEqual(['Good', 'Also good']);
  });

  it('COLLECTIONS-SVC-109: a file cannot hand the importer ids, provenance or other people', async () => {
    const owner = createUser(testDb).user;
    const victim = createUser(testDb).user;
    const trip = createTrip(testDb, victim.id);
    const place = createPlace(testDb, trip.id, { name: 'Private place' });

    const created = (await svc.importCollection(owner.id, { file: {
      format: 'trek.collection', version: 1, name: 'Hostile', places: [{
        name: 'Claims things',
        id: 9999, collection_id: 1, owner_id: victim.id, saved_by: victim.id,
        source_trip_id: trip.id, source_place_id: place.id,
      } as never],
    } })).collection as { id: number };

    const row = (await findRow(await orm(), CollectionPlaces, { collection: created.id }))!;
    expect(row.owner_id).toBe(owner.id);
    expect(row.saved_by).toBe(owner.id);
    expect(row.source_trip_id).toBeNull();
    expect(row.source_place_id).toBeNull();
    expect(row.id).not.toBe(9999);
  });

  it('COLLECTIONS-SVC-110: a link the browser must not follow arrives as nothing, the place still does', async () => {
    const owner = createUser(testDb).user;

    const created = (await svc.importCollection(owner.id, { file: {
      format: 'trek.collection', version: 1, name: 'Links', places: [
        { name: 'Script', website: 'javascript:alert(1)' as never },
        { name: 'Local image', image_url: '/uploads/x.jpg' as never },
        { name: 'Fine', website: 'https://example.com', image_url: 'https://example.com/p.jpg' },
      ],
    } })).collection as { id: number };

    const places = (await svc.getCollection(owner.id, created.id)).places;
    expect(places.map(p => p.name)).toEqual(['Script', 'Local image', 'Fine']);
    expect(places[0].website).toBeNull();
    expect(places[1].image_url).toBeNull();
    expect(places[2]).toMatchObject({ website: 'https://example.com', image_url: 'https://example.com/p.jpg' });
  });

  it('COLLECTIONS-SVC-111: an import writes nothing at all when one of its writes fails', async () => {
    const owner = createUser(testDb).user;
    const before = (await svc.listCollections(owner.id)).collections.length;
    const insert = testDb.prepare.bind(testDb);
    // Plan 3h Task 1: `writeFilePlaces`'s INSERT now goes through Kysely
    // (`CollectionsRepository.insertFilePlace`), which compiles to lowercase,
    // double-quoted SQL (`insert into "collection_places" (...)`) — matched
    // case-insensitively here instead of the legacy literal uppercase text.
    const spy = vi.spyOn(testDb, 'prepare').mockImplementation((sql: string) => {
      if (/insert\s+into\s+"?collection_places"?/i.test(sql)) throw new Error('disk is full');
      return insert(sql);
    });

    try {
      await expect(svc.importCollection(owner.id, { file: {
        format: 'trek.collection', version: 1, name: 'Doomed', places: [{ name: 'Never arrives' }],
      } })).rejects.toThrow('disk is full');
    } finally {
      spy.mockRestore();
    }

    expect((await svc.listCollections(owner.id)).collections).toHaveLength(before);
  });
});

// ── The same file into a list that is already there (#2301 follow-up) ────────

describe('importIntoCollection', () => {
  const file = (places: unknown[], labels?: { name: string; color?: string }[]) => ({
    format: 'trek.collection' as const, version: 1, name: 'From a friend',
    description: 'Their notes', color: '#ef4444', ...(labels ? { labels } : {}), places,
  });

  it('COLLECTIONS-SVC-120: adds the file to the list and leaves the list itself alone', async () => {
    const owner = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Lisbon', description: 'Mine', color: '#111827' });
    await svc.savePlace(owner.id, { collection_id: col.id, name: 'Time Out Market' });

    const result = await svc.importIntoCollection(owner.id, col.id, { file: file([{ name: 'Belém' }, { name: 'Alfama' }]) });

    expect(result).toMatchObject({ imported: 2, skipped: 0, duplicates: 0 });
    const after = await svc.getCollection(owner.id, col.id);
    expect(after.collection).toMatchObject({ name: 'Lisbon', description: 'Mine', color: '#111827' });
    expect(after.places.map(p => p.name)).toEqual(['Time Out Market', 'Belém', 'Alfama']);
    // Appended after what was there, so a manual order survives.
    const orders = (await findRows(await orm(), CollectionPlaces, { collection: col.id }, { sort_order: 'asc' })).map(r => ({ name: r.name, sort_order: r.sort_order }));
    expect(orders).toEqual([
      { name: 'Time Out Market', sort_order: 0 },
      { name: 'Belém', sort_order: 1 },
      { name: 'Alfama', sort_order: 2 },
    ]);
  });

  it('COLLECTIONS-SVC-121: a place the list already has is counted and left exactly as it was', async () => {
    const owner = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Lisbon' });
    const mine = (await svc.savePlace(owner.id, {
      collection_id: col.id, name: 'Time Out Market', notes: 'Before noon', status: 'visited', osm_id: 'node/1',
    })).place!;

    const result = await svc.importIntoCollection(owner.id, col.id, { file: file([
      { name: 'Time Out Market', notes: 'Overrated', status: 'idea' },
      { name: 'Renamed at the source', osm_id: 'node/1' },
      { name: 'Belém' },
    ]) });

    expect(result).toMatchObject({ imported: 1, duplicates: 2, skipped: 0 });
    const places = (await svc.getCollection(owner.id, col.id)).places;
    expect(places.map(p => p.name)).toEqual(['Time Out Market', 'Belém']);
    expect(places[0]).toMatchObject({ id: mine.id, notes: 'Before noon', status: 'visited' });
  });

  it('COLLECTIONS-SVC-122: a file that lists the same place twice adds it once', async () => {
    const owner = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Lisbon' });

    const result = await svc.importIntoCollection(owner.id, col.id, { file: file([{ name: 'Belém' }, { name: 'belém' }]) });

    expect(result).toMatchObject({ imported: 1, duplicates: 1 });
  });

  it('COLLECTIONS-SVC-123: labels are matched by name, and only the missing ones are created', async () => {
    const owner = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Lisbon' });
    const must = await svc.createLabel(owner.id, col.id, 'Must see', '#ff0000');

    await svc.importIntoCollection(owner.id, col.id, { file: file(
      [{ name: 'Belém', labels: ['Must see', 'Rainy day'] }],
      [{ name: 'must see', color: '#00ff00' }, { name: 'Rainy day', color: '#0000ff' }],
    ) });

    const labels = (await svc.getCollection(owner.id, col.id)).collection.labels ?? [];
    expect(labels.map(l => ({ name: l.name, color: l.color }))).toEqual([
      // The list's own label keeps its name and its colour.
      { name: 'Must see', color: '#ff0000' },
      { name: 'Rainy day', color: '#0000ff' },
    ]);
    const added = (await svc.getCollection(owner.id, col.id)).places.find(p => p.name === 'Belém')!;
    expect([...(added.label_ids ?? [])].sort()).toEqual([must.id, labels[1].id].sort());
  });

  it('COLLECTIONS-SVC-124: an editor may add a file, a viewer may not, a stranger does not see the list', async () => {
    const owner = createUser(testDb).user;
    const editor = createUser(testDb).user;
    const viewer = createUser(testDb).user;
    const stranger = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Shared' });
    await addMember(col.id, editor.id, 'editor');
    await addMember(col.id, viewer.id, 'viewer');

    expect(await svc.importIntoCollection(editor.id, col.id, { file: file([{ name: 'Belém' }]) })).toMatchObject({ imported: 1 });
    await expect(svc.importIntoCollection(viewer.id, col.id, { file: file([{ name: 'Alfama' }]) })).rejects.toThrow();
    try {
      await svc.importIntoCollection(stranger.id, col.id, { file: file([{ name: 'Alfama' }]) });
      throw new Error('should have thrown');
    } catch (e) {
      expect((e as { status: number }).status).toBe(404);
    }
    expect((await svc.getCollection(owner.id, col.id)).places.map(p => p.name)).toEqual(['Belém']);
  });

  it('COLLECTIONS-SVC-125: the places stay the list owner\'s, saved by whoever brought the file', async () => {
    const owner = createUser(testDb).user;
    const editor = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Shared' });
    await addMember(col.id, editor.id, 'editor');

    await svc.importIntoCollection(editor.id, col.id, { file: file([{ name: 'Belém' }]) });

    const stored = (await findRow(await orm(), CollectionPlaces, { collection: col.id }))!;
    expect({ owner_id: stored.owner_id, saved_by: stored.saved_by }).toEqual({ owner_id: owner.id, saved_by: editor.id });
  });

  it('COLLECTIONS-SVC-126: everyone on the list is told once, and nothing is said when nothing changed', async () => {
    const owner = createUser(testDb).user;
    const member = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Shared' });
    await addMember(col.id, member.id, 'editor');
    await svc.savePlace(owner.id, { collection_id: col.id, name: 'Belém' });
    broadcastToUser.mockClear();

    await svc.importIntoCollection(owner.id, col.id, { file: file([{ name: 'Alfama' }]) });
    // Once per person on the list, whole import, not once per place.
    expect(broadcastToUser).toHaveBeenCalledTimes(2);
    expect(broadcastToUser).toHaveBeenCalledWith(member.id, expect.objectContaining({ type: 'collections:updated' }), undefined);

    broadcastToUser.mockClear();
    const again = await svc.importIntoCollection(owner.id, col.id, { file: file([{ name: 'Alfama' }]) });
    expect(again).toMatchObject({ imported: 0, duplicates: 1 });
    expect(broadcastToUser).not.toHaveBeenCalled();
  });

  it('COLLECTIONS-SVC-127: a file that fails halfway leaves the list as it was', async () => {
    const owner = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Lisbon' });
    await svc.savePlace(owner.id, { collection_id: col.id, name: 'Time Out Market' });
    const real = testDb.prepare.bind(testDb);
    // Plan 3h Task 1: see COLLECTIONS-SVC-111's own comment — the Kysely-compiled
    // INSERT is lowercase/double-quoted now, matched case-insensitively.
    const spy = vi.spyOn(testDb, 'prepare').mockImplementation((sql: string) => {
      if (/insert\s+into\s+"?collection_places"?/i.test(sql)) throw new Error('disk is full');
      return real(sql);
    });

    try {
      await expect(svc.importIntoCollection(owner.id, col.id, {
        file: file([{ name: 'Belém' }], [{ name: 'Rainy day' }]),
      })).rejects.toThrow('disk is full');
    } finally {
      spy.mockRestore();
    }

    expect((await svc.getCollection(owner.id, col.id)).places.map(p => p.name)).toEqual(['Time Out Market']);
    expect((await svc.getCollection(owner.id, col.id)).collection.labels ?? []).toEqual([]);
  });
});

// ── The same list as GPX (#2301) ─────────────────────────────────────────────

describe('exportCollectionGpx / readCollectionGpx (#2301)', () => {
  const fixture = (name: string) => fs.readFileSync(path.join(__dirname, '../../fixtures/gpx', name), 'utf8');

  it('COLLECTIONS-SVC-120: a list that goes out as GPX comes back as the same list', async () => {
    const owner = createUser(testDb).user;
    const other = createUser(testDb).user;
    const cat = createCategory(testDb, { name: 'Restaurant' });
    const col = await svc.createCollection(owner.id, { name: 'Lisbon', description: 'Three days', color: '#ef4444' });
    const must = await svc.createLabel(owner.id, col.id, 'Must see', '#ff0000');
    await svc.createLabel(owner.id, col.id, 'Rainy day', '#00ff00');
    const market = (await svc.savePlace(owner.id, {
      collection_id: col.id, name: 'Time Out Market', description: 'Market hall', lat: 38.7071, lng: -9.1459,
      address: 'Av. 24 de Julho 49', notes: 'Before noon', website: 'https://timeoutmarket.com/',
      phone: '+351 210 606 040', osm_id: 'node/1', status: 'want', category_id: cat.id, price: 12.5, currency: 'EUR',
      links: [{ url: 'https://menu.example/', label: 'Menu' }],
    })).place!;
    await svc.savePlace(owner.id, { collection_id: col.id, name: 'Miradouro', lat: 38.7195, lng: -9.1327, status: 'visited' });
    await svc.assignLabels(owner.id, [must.id], [market.id], false);
    const original = await svc.exportCollection(owner.id, col.id);

    const exported = await svc.exportCollectionGpx(owner.id, col.id);
    const read = svc.readCollectionGpx({ gpx: exported.gpx, file_name: 'lisbon.gpx' });
    const result = await svc.importCollection(other.id, { file: read.file });

    expect(exported).toMatchObject({ name: 'Lisbon', waypoints: 2, omitted: 0 });
    expect(read).toMatchObject({ skipped: 0, track_points: 0 });
    expect(result).toMatchObject({ imported: 2, skipped: 0 });
    // Names, coordinates, notes, website, category, labels, status and the rest:
    // exported again from the copy, the file is the one the original gave.
    const again = await svc.exportCollection(other.id, (result.collection as { id: number }).id);
    expect({ ...again, exported_at: undefined }).toEqual({ ...original, exported_at: undefined });
  });

  it('COLLECTIONS-SVC-121: a place without coordinates is left out and counted, and a stranger gets nothing', async () => {
    const owner = createUser(testDb).user;
    const stranger = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Mixed' });
    await svc.savePlace(owner.id, { collection_id: col.id, name: 'Pinned', lat: 1, lng: 2 });
    await svc.savePlace(owner.id, { collection_id: col.id, name: 'Somewhere vague' });

    const result = await svc.exportCollectionGpx(owner.id, col.id);

    expect(result).toMatchObject({ name: 'Mixed', waypoints: 1, omitted: 1 });
    expect(result.gpx).toContain('<name>Pinned</name>');
    expect(result.gpx).not.toContain('Somewhere vague');
    await expect(svc.exportCollectionGpx(stranger.id, col.id)).rejects.toThrow(expect.objectContaining({ status: 404 }));
  });

  it('COLLECTIONS-SVC-122: OsmAnd favourites become a list, their groups matched against the palette', async () => {
    const owner = createUser(testDb).user;
    createCategory(testDb, { name: 'Restaurant' });

    const read = svc.readCollectionGpx({ gpx: fixture('osmand-favourites.gpx'), file_name: 'favourites.gpx' });
    const created = (await svc.importCollection(owner.id, { file: read.file, name: 'Lisbon favourites' })).collection as { id: number };

    const detail = await svc.getCollection(owner.id, created.id);
    expect(detail.collection.name).toBe('Lisbon favourites');
    expect(detail.places.map(p => [p.name, p.category?.name ?? null, p.address ?? null])).toEqual([
      ['Time Out Market', 'Restaurant', 'Av. 24 de Julho 49, 1200-479 Lisboa'],
      // No "Viewpoints" in this palette, and a file does not get to add one.
      ['Miradouro de Santa Luzia', null, null],
      ['Pastéis de Belém', null, 'R. de Belém 84 92, 1300-085 Lisboa'],
    ]);
  });

  it('COLLECTIONS-SVC-123: reading a GPX writes nothing, whatever is in it', async () => {
    const owner = createUser(testDb).user;
    const before = await countRows(await orm(), Collections);

    svc.readCollectionGpx({ gpx: fixture('garmin-sym.gpx') });
    expect(() => svc.readCollectionGpx({ gpx: fixture('hostile-doctype.gpx') })).toThrow(expect.objectContaining({ code: 'unreadable' }));

    expect(await countRows(await orm(), Collections)).toBe(before);
    expect((await svc.listCollections(owner.id)).collections).toHaveLength(0);
  });
});

// ── Plan 3h Task 1 — repository-conversion parity (CL1-CL36) ────────────────
//
// The describe blocks above already exercise every converted method through
// the service's own public behaviour (createCollection/listCollections/
// getCollection/updateCollection/reorderCollections/exportCollection/
// importCollection/deleteCollection), asserting against raw `testDb.prepare`
// reads the same way a hand-rolled "legacy" comparison would. This block adds
// the two things the brief calls out explicitly: a full-key `toEqual` parity
// test on a fully-seeded `getCollectionRow`/`getCollection` read (owner +
// admin + editor + viewer + a pending invite; places with labels and ratings
// from more than one voter), and a dedicated ordering proof for
// `deleteCollection`'s CL33/34 snapshot-before-CL35-cascade shape (R6's own
// risk note: a reversed order still passes an ordinary status-code test).
describe('Plan 3h Task 1 — repository conversion parity', () => {
  it('COLLECTIONS-SVC-200: getCollection is full-key identical to the legacy read model on a fully seeded list', async () => {
    const owner = createUser(testDb).user;
    const admin = createUser(testDb).user;
    const editor = createUser(testDb).user;
    const viewer = createUser(testDb).user;
    const pending = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Full house', description: 'Every role', color: '#111111' });
    await addMember(col.id, admin.id, 'admin');
    await addMember(col.id, editor.id, 'editor');
    await addMember(col.id, viewer.id, 'viewer');
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, pending.id));

    const tag = createTag(testDb, owner.id, { name: 'Foodie' });
    const place = (await svc.savePlace(owner.id, {
      collection_id: col.id, name: 'Cafe', lat: 1, lng: 2, tag_ids: [tag.id],
    })).place!;
    await svc.setRating(owner.id, place.id, 5);
    await svc.setRating(admin.id, place.id, 3);

    const result = await svc.getCollection(owner.id, col.id);

    // The legacy read model, recomputed independently from raw SQL against
    // the same seeded rows — the oracle this test proves the repository
    // conversion against, kept structurally separate from the production
    // code path it verifies.
    // test-sql-allow: legacy read-model oracle, recomputed from raw SQL on purpose.
    const colRow = testDb.prepare('SELECT * FROM collections WHERE id = ?').get(col.id) as Record<string, unknown>;
    // test-sql-allow: legacy read-model oracle, recomputed from raw SQL on purpose.
    const placeCount = (testDb.prepare('SELECT COUNT(*) AS n FROM collection_places WHERE collection_id = ?').get(col.id) as { n: number }).n;
    const legacyMembers = [
      { user_id: owner.id, username: owner.username, email: owner.email, avatar: null, status: 'accepted', role: 'admin', is_owner: true },
      // CL13's own `SELECT ... FROM collection_members cm JOIN users u ...`
      // has NO status filter — both the accepted admin/editor/viewer AND the
      // still-`pending` invite come back, ordered by `u.username`.
      ...[
        { u: admin, role: 'admin', status: 'accepted' },
        { u: editor, role: 'editor', status: 'accepted' },
        { u: viewer, role: 'viewer', status: 'accepted' },
        { u: pending, role: 'editor', status: 'pending' },
      ]
        .sort((a, b) => a.u.username.localeCompare(b.u.username))
        .map(({ u, role, status }) => ({ user_id: u.id, username: u.username, email: u.email, avatar: null, status, role, is_owner: false })),
    ];
    // test-sql-allow: legacy read-model oracle, recomputed from raw SQL on purpose.
    const placeRow = testDb.prepare('SELECT * FROM collection_places WHERE collection_id = ?').get(col.id) as Record<string, unknown>;
    const ratingRows = testDb
      // test-sql-allow: legacy read-model oracle, recomputed from raw SQL on purpose.
      .prepare('SELECT cpr.user_id, cpr.rating FROM collection_place_ratings cpr WHERE cpr.collection_place_id = ? ORDER BY cpr.created_at')
      .all(place.id) as { user_id: number; rating: number }[];

    expect(result.collection).toMatchObject({
      id: colRow.id, owner_id: colRow.owner_id, name: colRow.name, description: colRow.description,
      color: colRow.color, is_owner: true, place_count: placeCount,
    });
    expect(result.collection.members).toEqual(legacyMembers);
    expect(result.places).toHaveLength(1);
    expect(result.places[0]).toMatchObject({
      id: placeRow.id, collection_id: placeRow.collection_id, name: placeRow.name, lat: placeRow.lat, lng: placeRow.lng,
      tags: [{ id: tag.id, name: tag.name, color: tag.color }],
    });
    expect(result.places[0].ratings).toEqual(ratingRows.map((r) => ({ user_id: r.user_id, rating: r.rating, username: expect.any(String), avatar: null })));
    expect(result.places[0].rating_avg).toBe((5 + 3) / 2);
    expect(result.places[0].rating_count).toBe(2);
  });

  it('COLLECTIONS-SVC-201: deleteCollection snapshots CL33/34 recipients BEFORE CL35 cascades — every legacy recipient is still notified once the rows are gone', async () => {
    const owner = createUser(testDb).user;
    const accepted = createUser(testDb).user;
    const pending = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Ordering proof' });
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, accepted.id));
    await asLegacyResult(svc.acceptInvite(accepted.id, col.id, undefined));
    await asLegacyResult(svc.sendInvite(col.id, owner.id, owner.username, owner.email, pending.id));

    broadcastToUser.mockClear();
    // Captured at CALL time, not after `deleteCollection` returns — if the
    // cascade ran before the snapshot (the reversed, wrong order), this would
    // already be 0 even for the first broadcast; the proof is that it is
    // ALWAYS 0, for EVERY broadcast, because the snapshot ran first and the
    // cascade already happened by the time any broadcast fires.
    const memberCountAtBroadcastTime: number[] = [];
    broadcastToUser.mockImplementation(() => {
      // test-sql-allow: the count has to be taken synchronously, at the moment the broadcast fires.
      memberCountAtBroadcastTime.push((testDb.prepare('SELECT COUNT(*) AS n FROM collection_members WHERE collection_id = ?').get(col.id) as { n: number }).n);
    });

    await svc.deleteCollection(owner.id, col.id);

    const targets = broadcastToUser.mock.calls.map((c) => c[0]);
    expect(targets).toEqual(expect.arrayContaining([accepted.id, pending.id]));
    expect(memberCountAtBroadcastTime.every((n) => n === 0)).toBe(true);
    expect(memberCountAtBroadcastTime.length).toBeGreaterThan(0);
  });
});

// ── Plan 3h Task 2 (collections part B) — R6's two-layer order + CL45/CL69 parity ──

describe('Plan 3h Task 2 — R6 two-layer authorization order', () => {
  it('COLLECTIONS-SVC-210: savePlace refuses on the collection-edit gate BEFORE the trip-access check ever runs', async () => {
    const owner = createUser(testDb).user;
    const attacker = createUser(testDb).user;
    // The attacker has NO role on this list at all (not owner, not a member).
    const col = await svc.createCollection(owner.id, { name: 'No access' });
    // A trip/place the ATTACKER genuinely CAN access — if the check order
    // were reversed (trip-access first), this call would sail straight past
    // the trip-access check and only be refused later, if at all. The spy is
    // the brief's own warning made concrete: the final status alone (404,
    // same as a "trip not found" 404) would not distinguish the two orders —
    // only proof that the trip-access call never fired does.
    const attackerTrip = createTrip(testDb, attacker.id);
    const attackerPlace = createPlace(testDb, attackerTrip.id, { name: 'Mine' });

    const spy = vi.spyOn(tripsRepoForSpy, 'findAccessible');
    spy.mockClear();
    try {
      await svc.savePlace(attacker.id, {
        collection_id: col.id, name: 'x', source_trip_id: attackerTrip.id, source_place_id: attackerPlace.id,
      });
      expect.unreachable('savePlace should have refused');
    } catch (e) {
      expect((e as { status: number }).status).toBe(404);
      expect((e as Error).message).toBe('Collection not found');
    }
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('COLLECTIONS-SVC-211: copyToTrip checks trip access BEFORE the place_edit permission check — the OPPOSITE order from savePlace', async () => {
    const owner = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Copy order' });
    const cp = (await svc.savePlace(owner.id, { collection_id: col.id, name: 'Somewhere' })).place!;
    const strangerTrip = createTrip(testDb, createUser(testDb).user.id); // owner has no access to this trip

    const spy = vi.spyOn(permissionsForSpy, 'checkPermission');
    spy.mockClear();
    try {
      await svc.copyToTrip(owner.id, { trip_id: strangerTrip.id, place_ids: [cp.id] });
      expect.unreachable('copyToTrip should have refused');
    } catch (e) {
      expect((e as { status: number }).status).toBe(404);
      expect((e as Error).message).toBe('Trip not found');
    }
    // The permission check is the SECOND layer for this method — never
    // reached when the first layer (trip access) already refused.
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('COLLECTIONS-SVC-212: copyToTrip into a trip the caller cannot access writes NOTHING into places (CL64/65/66 cross-tenant guard)', async () => {
    const owner = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Guard proof' });
    // The caller can see this collection place perfectly well (they own the
    // list it lives on) — the guard that matters is the TARGET TRIP, not the
    // source collection.
    const cp = (await svc.savePlace(owner.id, { collection_id: col.id, name: 'Guarded' })).place!;
    const strangerOwner = createUser(testDb).user;
    const strangerTrip = createTrip(testDb, strangerOwner.id); // owner (the caller) is not on this trip

    const before = await countRows(await orm(), Places, { trip: strangerTrip.id });
    await expect(svc.copyToTrip(owner.id, { trip_id: strangerTrip.id, place_ids: [cp.id] })).rejects.toThrow();
    const after = await countRows(await orm(), Places, { trip: strangerTrip.id });
    expect(after).toBe(before); // no places row (CL64), and therefore no place_tags/place_ratings rows either
  });
});

describe('Plan 3h Task 2 — CL45/CL69 full-key parity', () => {
  it('COLLECTIONS-SVC-213: importablePlaces resolves the EARLIEST day for a place assigned to several days (CL45)', async () => {
    const owner = createUser(testDb).user;
    const col = await svc.createCollection(owner.id, { name: 'Import parity' });
    const trip = createTrip(testDb, owner.id);
    const place = createPlace(testDb, trip.id, { name: 'Multi-day spot' });
    // Created (and assigned) LATER day first, earlier day second — the
    // correlated MIN(day_number)/ORDER BY ... LIMIT 1 subqueries must not
    // accidentally resolve to insertion order or assignment order.
    const day2 = createDay(testDb, trip.id, { day_number: 2, date: '2024-06-02' });
    const day1 = createDay(testDb, trip.id, { day_number: 1, date: '2024-06-01' });
    createDayAssignment(testDb, day2.id, place.id);
    createDayAssignment(testDb, day1.id, place.id);

    const { places } = await svc.importablePlaces(owner.id, col.id, trip.id);
    expect(places).toHaveLength(1);
    expect(places[0].place_id).toBe(place.id);
    expect(places[0].day_number).toBe(1); // MIN(day_number), not the first assignment written
    expect(places[0].date).toBe('2024-06-01'); // the SAME earliest day's own date, not day2's
    expect(places[0].scheduled).toBe(true);
    expect(places[0].already_in_list).toBe(false);
  });

  it('COLLECTIONS-SVC-214: findMembership matches BOTH a provider-id-only place and a coordinate-tolerance-only place in the same OR (CL69, rule 23)', async () => {
    const owner = createUser(testDb).user;
    const colA = await svc.createCollection(owner.id, { name: 'Provider match' });
    const colB = await svc.createCollection(owner.id, { name: 'Coord match' });
    // Matches ONLY by google_place_id — its own coordinates are far from the query's.
    const byProvider = (await svc.savePlace(owner.id, {
      collection_id: colA.id, name: 'Provider Place', google_place_id: 'gp-parity-123', lat: 10, lng: 10,
    })).place!;
    // Matches ONLY by coordinate tolerance — no provider id of its own at all.
    const byCoords = (await svc.savePlace(owner.id, {
      collection_id: colB.id, name: 'Coord Place', lat: 48.8566, lng: 2.3522,
    })).place!;

    const result = await svc.findMembership(owner.id, { google_place_id: 'gp-parity-123', lat: 48.8566, lng: 2.3522 });
    expect(result.saved).toBe(true);
    const placeIds = result.lists.map(l => l.place_id).sort((a, b) => a - b);
    // Neither branch of the typed OR dropped the other's match: a narrowed
    // condition set would return only one of these two rows.
    expect(placeIds).toEqual([byProvider.id, byCoords.id].sort((a, b) => a - b));
  });
});
