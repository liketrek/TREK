/**
 * Optimistic-concurrency / 409 conflict tests (#1135) for the place + packing
 * update services. A matching If-Match token (or none) updates as before; a
 * stale token returns the conflict sentinel carrying the server's current row.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  function getPlaceWithTags(placeId: number | string) {
    const p = db.prepare('SELECT * FROM places WHERE id = ?').get(placeId);
    if (!p) return null;
    return { ...(p as object), category: null, tags: [] };
  }
  return {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags,
    canAccessTrip: async () => null,
    isOwner: async () => false,
  };
});
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-secret',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import { db as testDb } from '../../../src/db/database';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip } from '../../helpers/factories';
import { accommodationsOver } from '../../helpers/accommodations-service';
import { isUpdateConflict } from '../../../src/nest/common/conflictResult';
import { PackingService } from '../../../src/nest/packing/packing.service';
import { PlacesService } from '../../../src/nest/places/places.service';
import { MapsService } from '../../../src/nest/maps/maps.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { QueryHelpersService } from '../../../src/nest/query-helpers/query-helpers.service';
import { UnsplashService } from '../../../src/nest/unsplash/unsplash.service';
import { PlacePhotoCacheService } from '../../../src/nest/place-photos/place-photo-cache.service';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { notificationsStub } from '../../helpers/notifications';
import { makeStorageFixture } from '../../helpers/storage-fixture';
import {
  createTestUnitOfWork,
  createTestAppSettingsRepo,
  createTestUsersRepo,
  createTestTagsRepo,
  createTestPlaceRatingsRepo,
  createTestAssignmentParticipantsRepo,
  createTestGooglePlacePhotoMetaRepo,
  createTestPlacesRepo,
  createTestPlaceDetailsCacheRepo,
  createTestTripMembersRepo,
  createTestDayAssignmentsRepo,
  createTestCategoriesRepo,
  createTestTripsRepo,
  sharedTestOrm,
} from '../../helpers/test-uow';
import { createTestBudgetItemsRepo } from '../../helpers/files-repos';
import { createTestCollectionPlacesRepo } from '../../helpers/test-uow';
import {
  createTestJourneysRepo, createTestJourneyContributorsRepo, createTestJourneyTripsRepo, createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo, createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
import {
  createTestPackingItemsRepo,
  createTestPackingItemContributorsRepo,
  createTestPackingBagsRepo,
  createTestPackingCategoryAssigneesRepo,
  createTestPackingTemplatesRepo,
  createTestPackingTemplateCategoriesRepo,
  createTestPackingTemplateItemsRepo,
} from '../../helpers/packing-repos';
import { noGoogleQuota } from '../../helpers/google-quota';

const realtime = new RealtimeService();
const runtimeEnv = new RuntimeEnvService();

let packing: PackingService;
let places: PlacesService;
let photoCache: PlacePhotoCacheService;
beforeAll(async () => {
  // One cache instance shared by maps and places, the way the container
  // wires it: the service's stampede guard only works if there is exactly
  // one of them. Plan 3c Task 1: PlacePhotoCacheService now takes the two
  // repositories too. Plan 4 Task 4: `DatabaseService` is gone — every
  // service below is fully repository-backed, so the `dbs.canAccessTrip`/
  // `isOwner`/`rosterUserIds`/`getPlaceWithTags` spies this block used to
  // route to a real `DatabaseService` are dead; removed with it.
  photoCache = new PlacePhotoCacheService(
    makeStorageFixture('photos/google/').storage,
    await createTestGooglePlacePhotoMetaRepo(testDb),
    await createTestPlacesRepo(testDb),
    await createTestCollectionPlacesRepo(testDb),
  );
  const t = await sharedTestOrm(testDb);
  packing = new PackingService(
    new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
    realtime,
    notificationsStub(),
    await createTestUnitOfWork(testDb),
    await createTestPackingItemsRepo(testDb),
    await createTestPackingItemContributorsRepo(testDb),
    await createTestPackingBagsRepo(testDb),
    await createTestPackingCategoryAssigneesRepo(testDb),
    await createTestPackingTemplatesRepo(testDb),
    await createTestPackingTemplateCategoriesRepo(testDb),
    await createTestPackingTemplateItemsRepo(testDb),
    await createTestTripsRepo(testDb),
    await createTestTripMembersRepo(testDb),
  );
  places = new PlacesService(
  new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)),
  realtime,
  new MapsService(photoCache, await createTestAppSettingsRepo(testDb), await createTestUsersRepo(testDb), await createTestPlaceDetailsCacheRepo(testDb), await createTestPlacesRepo(testDb), noGoogleQuota),
  new QueryHelpersService(await createTestTagsRepo(testDb), await createTestPlaceRatingsRepo(testDb), await createTestAssignmentParticipantsRepo(testDb)),
  new UnsplashService(await createTestAppSettingsRepo(testDb), await createTestUsersRepo(testDb), runtimeEnv, makeStorageFixture('').storage),
  photoCache,
  new JourneyDomainService(
    realtime, new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), await createTestJourneyPhotosRepo(testDb)), await createTestUnitOfWork(testDb),
    await createTestJourneysRepo(testDb), await createTestJourneyContributorsRepo(testDb),
    await createTestJourneyTripsRepo(testDb), await createTestJourneyEntriesRepo(testDb), await createTestTripsRepo(testDb),
    // Plan 3g Task 2 constructor-ripple: JourneyPhotosRepository/JourneyEntryPhotosRepository/PlacesRepository.
    await createTestJourneyPhotosRepo(testDb), await createTestJourneyEntryPhotosRepo(testDb), await createTestPlacesRepo(testDb),
  ),
  makeStorageFixture('').storage,
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
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

async function freshPlace(tripId: number) {
  const place = await places.create(String(tripId), { name: 'Original' }) as unknown as { id: number; updated_at: string };
  return place;
}

describe('PlacesService.update — optimistic concurrency', () => {
  it('updates normally when no If-Match token is sent (back-compat)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = await freshPlace(trip.id);

    const result = await places.update(String(trip.id), String(place.id), { name: 'Edited' });
    expect(isUpdateConflict(result)).toBe(false);
    expect((result as { name: string }).name).toBe('Edited');
  });

  it('updates when the If-Match token matches the current updated_at', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = await freshPlace(trip.id);

    const result = await places.update(String(trip.id), String(place.id), { name: 'Edited' }, place.updated_at);
    expect(isUpdateConflict(result)).toBe(false);
    expect((result as { name: string }).name).toBe('Edited');
  });

  it('returns a conflict (with the server row) when the token is stale', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = await freshPlace(trip.id);

    const result = await places.update(String(trip.id), String(place.id), { name: 'Mine' }, '1999-01-01 00:00:00');
    expect(isUpdateConflict(result)).toBe(true);
    if (isUpdateConflict(result)) {
      expect((result.server as { name: string }).name).toBe('Original');
    }
    // The row must NOT have been overwritten.
    const row = testDb.prepare('SELECT name FROM places WHERE id = ?').get(place.id) as { name: string };
    expect(row.name).toBe('Original');
  });

  it('returns null for a place that does not exist', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    expect(await places.update(String(trip.id), '999999', { name: 'x' }, 'whatever')).toBeNull();
  });
});

describe('updateItem (packing) — optimistic concurrency', () => {
  it('migration added updated_at and createItem stamps it', async () => {
    const cols = testDb.prepare("PRAGMA table_info('packing_items')").all() as { name: string }[];
    expect(cols.map(c => c.name)).toContain('updated_at');

    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = await packing.createItem(trip.id, { name: 'Socks' }) as { id: number; updated_at: string | null };
    expect(item.updated_at).toBeTruthy();
  });

  it('returns a conflict when the packing token is stale', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = await packing.createItem(trip.id, { name: 'Socks' }, user.id) as { id: number; updated_at: string };

    const stale = await packing.updateItem(trip.id, item.id, { name: 'Mine' }, ['name'], '1999-01-01 00:00:00', user.id);
    expect(isUpdateConflict(stale)).toBe(true);

    const fresh = await packing.updateItem(trip.id, item.id, { name: 'Edited' }, ['name'], item.updated_at, user.id);
    expect(isUpdateConflict(fresh)).toBe(false);
    expect((fresh as { name: string }).name).toBe('Edited');
  });
})
