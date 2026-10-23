/**
 * `TrekPhotoSignalsRepository` (PSIGREPO-*): one measurement per photo,
 * replaced by the next, gone with its photo; read back for many photos at once
 * past SQLite's bound-value limit; and the gallery facts the book photo picker
 * starts from, in gallery order and for one journey only; the colour signals
 * (palette, busy grid, salient point) of the newest measurement only.
 */
import { JourneyPhotos } from '../../../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotoSignals } from '../../../../src/db/entities/TrekPhotoSignals.entity';
import { TrekPhotos } from '../../../../src/db/entities/TrekPhotos.entity';
import type {
  TrekPhotoSignalsRepository,
  TrekPhotoSignalWrite,
} from '../../../../src/db/repositories/TrekPhotoSignals.repository';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeJourney } from '../../../helpers/factories/journeys';
import { countRows, deleteRows, insertRow } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let signals: TrekPhotoSignalsRepository;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  signals = t.repo(TrekPhotoSignals);
});
beforeEach(() => {
  resetTestDb(testDb);
  t.clear();
});
afterAll(async () => {
  await t.close();
  testDb.close();
});

const measured = (photoId: number, over: Partial<TrekPhotoSignalWrite> = {}): TrekPhotoSignalWrite => ({
  photo_id: photoId,
  algo: 1,
  phash: '0123456789abcdef',
  sharpness: 412.5,
  luma: 0.48,
  clipped: 0.01,
  orig_width: 4032,
  orig_height: 3024,
  ...over,
});

async function trekPhoto(ownerId: number, over: Partial<{ taken_at: string; media_type: string }> = {}) {
  return insertRow(t, TrekPhotos, { provider: 'local', owner: ownerId, file_path: 'journey/p.jpg', ...over });
}

describe('TrekPhotoSignalsRepository', () => {
  it('PSIGREPO-001: a measurement reads back as written, and the next one of the same photo replaces it', async () => {
    const { user } = await makeUser(t);
    const photoId = await trekPhoto(user.id);
    expect(await signals.listForPhotos([photoId])).toEqual([]);

    await signals.saveSignals(measured(photoId));
    const [first] = await signals.listForPhotos([photoId]);
    expect(first).toMatchObject(measured(photoId));
    expect(first?.computed_at).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    const unmeasurable = measured(photoId, {
      algo: 2,
      phash: null,
      sharpness: null,
      luma: null,
      clipped: null,
      orig_width: null,
      orig_height: null,
    });
    await signals.saveSignals(unmeasurable);
    expect(await signals.listForPhotos([photoId])).toEqual([expect.objectContaining(unmeasurable)]);
    expect(await countRows(t, TrekPhotoSignals)).toBe(1);
  });

  it('PSIGREPO-002: reads the measurements of more photos than one statement may bind', async () => {
    const { user } = await makeUser(t);
    const first = await trekPhoto(user.id);
    const last = await trekPhoto(user.id);
    await signals.saveSignals(measured(first));
    await signals.saveSignals(measured(last, { sharpness: 12 }));
    const ids = [first, ...Array.from({ length: 450 }, (_, i) => 100_000 + i), last];
    const rows = await signals.listForPhotos(ids);
    expect(rows.map((r) => [r.photo_id, r.sharpness]).sort((a, b) => Number(a[0]) - Number(b[0]))).toEqual([
      [first, 412.5],
      [last, 12],
    ]);
  });

  it('PSIGREPO-003: a measurement goes with its photo', async () => {
    const { user } = await makeUser(t);
    const photoId = await trekPhoto(user.id);
    await signals.saveSignals(measured(photoId));
    await deleteRows(t, TrekPhotos, { id: photoId });
    expect(await countRows(t, TrekPhotoSignals)).toBe(0);
  });

  it("PSIGREPO-004: the gallery facts are one journey's photos in gallery order, with when, where and what they are", async () => {
    const { user } = await makeUser(t);
    const journey = await makeJourney(t, user.id);
    const other = await makeJourney(t, user.id);
    const late = await trekPhoto(user.id, { taken_at: '2026-07-03T10:00:00' });
    const early = await insertRow(t, TrekPhotos, {
      provider: 'immich',
      asset_id: 'a1',
      owner: user.id,
      width: 1440,
      height: 1080,
      lat: 38.71,
      lng: -9.13,
    });
    const clip = await trekPhoto(user.id, { media_type: 'video' });
    const elsewhere = await trekPhoto(user.id);
    const now = Date.now();
    await insertRow(t, JourneyPhotos, { journey: journey.id, photo: late, sort_order: 2, created_at: now });
    await insertRow(t, JourneyPhotos, {
      journey: journey.id,
      photo: early,
      caption: 'Tram 28',
      sort_order: 1,
      created_at: now,
    });
    await insertRow(t, JourneyPhotos, { journey: journey.id, photo: clip, sort_order: 2, created_at: now });
    await insertRow(t, JourneyPhotos, { journey: other.id, photo: elsewhere, sort_order: 0, created_at: now });

    expect(await signals.listGalleryFacts(journey.id)).toEqual([
      {
        photo_id: early,
        caption: 'Tram 28',
        provider: 'immich',
        media_type: 'image',
        width: 1440,
        height: 1080,
        taken_at: null,
        lat: 38.71,
        lng: -9.13,
      },
      expect.objectContaining({ photo_id: late, caption: null, taken_at: '2026-07-03T10:00:00', media_type: 'image' }),
      expect.objectContaining({ photo_id: clip, media_type: 'video' }),
    ]);
  });

  it('PSIGREPO-005: the colours, the busy grid and the salient point read back, and a later measurement without them clears them', async () => {
    const { user } = await makeUser(t);
    const photoId = await trekPhoto(user.id);
    const colours = { palette: '["#336699:0.6","#f0e0d0:0.4"]', busy: 'f'.repeat(64), sal_x: 0.25, sal_y: 0.75 };
    await signals.saveSignals(measured(photoId, { algo: 3, ...colours }));
    expect(await signals.listForPhotos([photoId])).toEqual([expect.objectContaining({ algo: 3, ...colours })]);

    await signals.saveSignals(measured(photoId, { algo: 2 }));
    expect(await signals.listForPhotos([photoId])).toEqual([
      expect.objectContaining({ algo: 2, palette: null, busy: null, sal_x: null, sal_y: null }),
    ]);
  });
});
