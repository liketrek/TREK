/**
 * JourneyAiPhotosService (JAIPH-*): which gallery photos the Studio assistant
 * may show a model, taken from JourneyBookModule over a snapshot test db.
 * Only the asking user's own photos, the journey's owner standing in for a
 * photo that names nobody; a stranger is told the journey is not there.
 */
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { JourneyAiPhotosService } from '../../../src/nest/journey/journey-ai-photos.service';
import { JourneyBookModule } from '../../../src/nest/journey/journey-book.module';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { addJourneyContributor, makeJourney } from '../../helpers/factories/journeys';
import { insertRow } from '../../helpers/factories/rows';
import { makeUser } from '../../helpers/factories/users';
import { resetTestDb } from '../../helpers/test-db';
import { createTestModule, type TestModule } from '../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const db = createSnapshotTestDb();
let t: TestModule;
let orm: TestOrm;

beforeAll(async () => {
  t = await createTestModule({ db, imports: [JourneyBookModule] });
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

/** A photo in the journey's gallery, contributed by `ownerId` (null: nobody named); answers its photo id. */
async function galleryPhoto(journeyId: number, ownerId: number | null): Promise<number> {
  const photoId = await insertRow(orm, TrekPhotos, { provider: 'local', owner: ownerId, file_path: 'journey/p.jpg' });
  await insertRow(orm, JourneyPhotos, { journey: journeyId, photo: photoId, sort_order: 0, created_at: Date.now() });
  return photoId;
}

describe('JourneyAiPhotosService', () => {
  it('JAIPH-001: each member may show their own photos only; a photo naming nobody counts as the owner', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: editor } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    await addJourneyContributor(orm, journey.id, editor.id, 'editor');
    const ownersPhoto = await galleryPhoto(journey.id, owner.id);
    const unnamed = await galleryPhoto(journey.id, null);
    const editorsPhoto = await galleryPhoto(journey.id, editor.id);

    const service = t.get(JourneyAiPhotosService);
    expect([...(await service.ownPhotoIds(journey.id, owner.id))].sort()).toEqual([ownersPhoto, unnamed].sort());
    expect([...(await service.ownPhotoIds(journey.id, editor.id))]).toEqual([editorsPhoto]);
  });

  it('JAIPH-002: a photo of another journey never counts; a stranger is told the journey is not there', async () => {
    const { user: owner } = await makeUser(orm);
    const { user: stranger } = await makeUser(orm);
    const journey = await makeJourney(orm, owner.id);
    const other = await makeJourney(orm, owner.id);
    await galleryPhoto(other.id, owner.id);

    const service = t.get(JourneyAiPhotosService);
    expect((await service.ownPhotoIds(journey.id, owner.id)).size).toBe(0);
    await expect(service.ownPhotoIds(journey.id, stranger.id)).rejects.toThrow('Journey not found');
  });
});
