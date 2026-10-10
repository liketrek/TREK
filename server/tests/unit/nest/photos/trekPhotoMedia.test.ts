/**
 * trek_photos media_type persistence (#823): a local or provider photo row can
 * be registered as a video and the discriminator round-trips.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

vi.mock('../../../../src/db/database', async () => {
  const { createSnapshotTestDb } = await import('../../../helpers/db-mock');
  const db = createSnapshotTestDb();
  // FKs off: this suite only checks media_type persistence, not owner/user integrity.
  db.exec('PRAGMA foreign_keys = OFF');
  return { db, closeDb: () => {}, reinitialize: () => {}, getPlaceWithTags: async () => null, canAccessTrip: async () => null, isOwner: async () => false };
});

import { db as testDb } from '../../../../src/db/database';
import { createUser } from '../../../helpers/factories';
import { TrekPhotoRegistrationService } from '../../../../src/nest/photos/trek-photo-registration.service';
import { TrekPhotos } from '../../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../../src/db/entities/TripPhotos.entity';
import { JourneyPhotos } from '../../../../src/db/entities/JourneyPhotos.entity';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';
import { deleteRows } from '../../../helpers/factories/rows';

// Was photos.bridge, deleted with the other three that had no consumer outside
// the container. These call the repository directly now.
let t: TestOrm;
let trekPhotos: TrekPhotoRegistrationService;
const getOrCreateTrekPhoto = (...a: Parameters<TrekPhotoRegistrationService['getOrCreate']>) => trekPhotos.getOrCreate(...a);
const getOrCreateLocalTrekPhoto = (...a: Parameters<TrekPhotoRegistrationService['getOrCreateLocal']>) => trekPhotos.getOrCreateLocal(...a);
const resolveTrekPhoto = (id: number) => trekPhotos.resolve(id);

beforeAll(async () => {
  t = await createTestOrm(testDb);
  trekPhotos = new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), t.repo(JourneyPhotos));
});

beforeEach(async () => {
  await deleteRows(t, TrekPhotos);
});

afterAll(async () => {
  await t.close();
  testDb.close();
});

describe('trek_photos media_type', () => {
  it('migration added media_type (default image) and duration_ms', () => {
    // test-sql-allow: the column list comes from PRAGMA table_info, which no entity or repository maps.
    const cols = (testDb.prepare("PRAGMA table_info('trek_photos')").all() as { name: string }[]).map(c => c.name);
    expect(cols).toContain('media_type');
    expect(cols).toContain('duration_ms');
  });

  it('a local photo defaults to image', async () => {
    const id = await getOrCreateLocalTrekPhoto('journey/a.jpg');
    expect((await resolveTrekPhoto(id))!.media_type).toBe('image');
  });

  it('a local video stores media_type=video + duration', async () => {
    const id = await getOrCreateLocalTrekPhoto('journey/clip.mp4', 'journey/poster.jpg', null, null, 'video', 4200);
    const row = (await resolveTrekPhoto(id))!;
    expect(row.media_type).toBe('video');
    expect(row.duration_ms).toBe(4200);
    expect(row.thumbnail_path).toBe('journey/poster.jpg');
  });

  it('a provider photo can be registered as video', async () => {
    const { user } = createUser(testDb);
    const id = await getOrCreateTrekPhoto('immich', 'asset-1', user.id, undefined, 'video');
    expect((await resolveTrekPhoto(id))!.media_type).toBe('video');
  });
});
