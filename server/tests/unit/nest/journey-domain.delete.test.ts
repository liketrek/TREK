/**
 * JourneyDomainService: what deleting a journey does with the photos of its gallery
 * (#2924). A photo row only this journey linked goes with it and its files are handed
 * to the storage release; one a trip or another journey still links keeps its row.
 * The service comes from its module over a snapshot test db, the release is a spy.
 */
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { JourneyDomainModule } from '../../../src/nest/journey/journey-domain.module';
import { JourneyDomainService } from '../../../src/nest/journey/journey-domain.service';
import { StorageReleaseService } from '../../../src/nest/storage/storage-release.service';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { findRows, insertRow } from '../../helpers/factories/rows';
import { makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { releaseNothing } from '../../helpers/storage-release';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import type { EntityClass, EntityDTO, FilterQuery } from '@mikro-orm/core';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
const release = releaseNothing();
let t: TestModule;
let orm: TestOrm;
let svc: JourneyDomainService;

async function one<T extends object>(entity: EntityClass<T>, where: FilterQuery<T>) {
  return (await findRows(orm, entity, where))[0] as EntityDTO<T> | undefined;
}

beforeAll(async () => {
  t = await createTestModule({
    db,
    imports: [JourneyDomainModule],
    overrides: [{ provide: StorageReleaseService, useValue: release }],
  });
  svc = t.get(JourneyDomainService);
  orm = await createTestOrm(db);
});
beforeEach(() => {
  resetTestDb(db);
  orm.clear();
});
afterAll(async () => {
  await orm.close();
  await t.close();
  db.close();
});

describe('deleteJourney and its gallery', () => {
  it('JOURNEY-SVC-022b: deleting a journey drops the photo rows only it held and releases their files', async () => {
    const { user } = await makeUser(orm);
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
    const { user } = await makeUser(orm);
    const journey = await svc.createJourney(user.id, { title: 'J' });
    const other = await svc.createJourney(user.id, { title: 'Other' });
    const trip = await makeTrip(orm, user.id);
    const [shared, inTrip, alone] = await svc.uploadGalleryPhotos(journey.id, user.id, [
      { path: 'journey/shared.jpg' },
      { path: 'journey/trip.jpg' },
      { path: 'journey/alone.jpg' },
    ]);
    // The same file uploaded to a second journey reuses its photo row.
    const [again] = await svc.uploadGalleryPhotos(other.id, user.id, [{ path: 'journey/shared.jpg' }]);
    expect(again.photo_id).toBe(shared.photo_id);
    await insertRow(orm, TripPhotos, { trip: trip.id, user: user.id, photo: inTrip.photo_id, shared: 1 });

    expect(await svc.deleteJourney(journey.id, user.id)).toBe(true);

    expect(await one(TrekPhotos, { id: shared.photo_id })).toBeDefined();
    expect(await one(TrekPhotos, { id: inTrip.photo_id })).toBeDefined();
    expect(await one(TrekPhotos, { id: alone.photo_id })).toBeUndefined();
    expect(await one(JourneyPhotos, { journey: other.id, photo: shared.photo_id })).toBeDefined();
  });
});
