/**
 * JOURNEY-SVC-022b/022c: what deleting a journey does with the photos of its gallery
 * (#2924). Split from journey-domain.service.test.ts, which is at its size baseline;
 * the service is built the same way.
 */
import { db as testDb } from '../../../src/db/database';
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { createUser, createTrip } from '../../helpers/factories';
import { findRows } from '../../helpers/factories/rows';
import {
  createTestJourneysRepo,
  createTestJourneyContributorsRepo,
  createTestJourneyTripsRepo,
  createTestJourneyEntriesRepo,
  createTestJourneyPhotosRepo,
  createTestJourneyEntryPhotosRepo,
} from '../../helpers/journey-repos';
import { releaseNothing } from '../../helpers/storage-release';
import { resetTestDb } from '../../helpers/test-db';
import { createTestUnitOfWork, sharedTestOrm, createTestTripsRepo, createTestPlacesRepo } from '../../helpers/test-uow';
import type { EntityClass, EntityDTO, FilterQuery } from '@mikro-orm/core';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../helpers/db-mock');
  const db = createSnapshotTestDb();
  return { db, closeDb: () => {}, reinitialize: () => {} };
});

const orm = () => sharedTestOrm(testDb);
const release = releaseNothing();
let svc: JourneyDomainService;

async function one<T extends object>(entity: EntityClass<T>, where: FilterQuery<T>) {
  return (await findRows(await orm(), entity, where))[0] as EntityDTO<T> | undefined;
}

beforeAll(async () => {
  const t = await sharedTestOrm(testDb);
  const photosRepo = await createTestJourneyPhotosRepo(testDb);
  svc = new JourneyDomainService(
    new RealtimeService(),
    new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), photosRepo),
    await createTestUnitOfWork(testDb),
    await createTestJourneysRepo(testDb),
    await createTestJourneyContributorsRepo(testDb),
    await createTestJourneyTripsRepo(testDb),
    await createTestJourneyEntriesRepo(testDb),
    await createTestTripsRepo(testDb),
    photosRepo,
    await createTestJourneyEntryPhotosRepo(testDb),
    await createTestPlacesRepo(testDb),
    release,
  );
});

beforeEach(() => {
  resetTestDb(testDb);
});

afterAll(() => {
  testDb.close();
});

describe('deleteJourney and its gallery', () => {
  it('JOURNEY-SVC-022b: deleting a journey drops the photo rows only it held and releases their files', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const [photo, video] = await svc.uploadGalleryPhotos(journey.id, user.id, [
      { path: 'journey/a.jpg' },
      { path: 'journey/b.mp4', thumbnail: 'journey/b-poster.jpg', mediaType: 'video' },
    ]);
    release.releaseValues.mockClear();

    expect(await svc.deleteJourney(journey.id, user.id)).toBe(true);

    expect(await one(TrekPhotos, { id: { $in: [photo.photo_id, video.photo_id] } })).toBeUndefined();
    expect(release.releaseValues).toHaveBeenCalledTimes(1);
    const [values, options] = release.releaseValues.mock.calls[0] as unknown as [Array<string | null>, unknown];
    expect(values.filter(Boolean).sort()).toEqual(['journey/a.jpg', 'journey/b-poster.jpg', 'journey/b.mp4']);
    expect(options).toEqual({ bare: 'journey' });
  });

  it('JOURNEY-SVC-022c: a photo another journey or a trip still links keeps its row through the delete', async () => {
    const { user } = createUser(testDb);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const other = await svc.createJourney(user.id, { title: 'Other' });
    const trip = createTrip(testDb, user.id);
    const [shared, inTrip, alone] = await svc.uploadGalleryPhotos(journey.id, user.id, [
      { path: 'journey/shared.jpg' },
      { path: 'journey/trip.jpg' },
      { path: 'journey/alone.jpg' },
    ]);
    // The same file uploaded to a second journey reuses its photo row.
    const [again] = await svc.uploadGalleryPhotos(other.id, user.id, [{ path: 'journey/shared.jpg' }]);
    expect(again.photo_id).toBe(shared.photo_id);
    testDb
      .prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id) VALUES (?, ?, ?)')
      .run(trip.id, user.id, inTrip.photo_id);

    expect(await svc.deleteJourney(journey.id, user.id)).toBe(true);

    expect(await one(TrekPhotos, { id: shared.photo_id })).toBeDefined();
    expect(await one(TrekPhotos, { id: inTrip.photo_id })).toBeDefined();
    expect(await one(TrekPhotos, { id: alone.photo_id })).toBeUndefined();
    expect(await one(JourneyPhotos, { journey: other.id, photo: shared.photo_id })).toBeDefined();
  });
});
