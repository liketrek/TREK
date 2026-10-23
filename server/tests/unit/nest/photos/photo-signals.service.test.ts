/**
 * PhotoSignalsService (PHSVC-*): a photo is measured once and its signals
 * kept; a caller waits at most so long and is told how many are still
 * pending; a photo is in line once however often it is asked for, the line is
 * bounded and fetches are at most two at a time, and photos asked for later
 * queue behind; a provider that does not answer, a thread that cannot start or
 * a first timeout is tried again on the next call, a photo that cannot be
 * measured is not; a provider's turned sides follow its upright thumbnail.
 * Taken from PhotoSignalsModule over a snapshot test db, the bytes from a
 * stubbed resolver and, unless a case swaps it, measured on the calling thread.
 */
import { JourneyPhotos } from '../../../../src/db/entities/JourneyPhotos.entity';
import { TrekPhotoSignals } from '../../../../src/db/entities/TrekPhotoSignals.entity';
import { TrekPhotos } from '../../../../src/db/entities/TrekPhotos.entity';
import { PhotoResolverService, type PhotoSignalSource } from '../../../../src/nest/memories/photo-resolver.service';
import {
  PHOTO_SIGNALS_ALGO,
  PHOTO_SIGNALS_RUNNER,
  type PhotoSignalsRunner,
} from '../../../../src/nest/photos/photo-signals-runner';
import { PhotoSignalsModule } from '../../../../src/nest/photos/photo-signals.module';
import {
  MAX_ORIGINAL_BYTES,
  MAX_QUEUED_PHOTOS,
  PARALLEL_FETCHES,
  PhotoSignalsService,
} from '../../../../src/nest/photos/photo-signals.service';
import { createSnapshotTestDb } from '../../../helpers/db-mock';
import { makeJourney } from '../../../helpers/factories/journeys';
import { countRows, insertRow, insertRows } from '../../../helpers/factories/rows';
import { makeUser } from '../../../helpers/factories/users';
import { resetTestDb } from '../../../helpers/test-db';
import { createTestModule, type TestModule } from '../../../helpers/test-module';
import { createTestOrm, type TestOrm } from '../../../helpers/test-orm';

import { Jimp } from 'jimp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const db = createSnapshotTestDb();
const resolver = { readForSignals: vi.fn<(photoId: number, maxBytes: number) => Promise<PhotoSignalSource>>() };
let orm: TestOrm;
let photo: Buffer;

/** The service in a container of its own, with the resolver stubbed and, when given, the runner too. */
async function boot(runner?: PhotoSignalsRunner): Promise<{ t: TestModule; signals: PhotoSignalsService }> {
  const t = await createTestModule({
    db,
    imports: [PhotoSignalsModule],
    overrides: [
      { provide: PhotoResolverService, useValue: resolver },
      ...(runner ? [{ provide: PHOTO_SIGNALS_RUNNER, useValue: runner }] : []),
    ],
  });
  return { t, signals: t.get(PhotoSignalsService) };
}

let main: { t: TestModule; signals: PhotoSignalsService };

beforeAll(async () => {
  orm = await createTestOrm(db);
  main = await boot();
  photo = Buffer.from(await new Jimp({ width: 300, height: 200, color: 0x808080ff }).getBuffer('image/jpeg'));
});
beforeEach(() => {
  resetTestDb(db);
  orm.clear();
  resolver.readForSignals.mockReset();
});
afterAll(async () => {
  await main.t.close();
  await orm.close();
  db.close();
});

/** A journey with these photos in its gallery, in this order; answers their trek_photos ids. */
async function gallery(kinds: Array<'image' | 'video'>) {
  const { user } = await makeUser(orm);
  const journey = await makeJourney(orm, user.id);
  const ids = await insertRows(
    orm,
    TrekPhotos,
    kinds.map((kind) => ({ provider: 'local', owner: user.id, file_path: 'journey/p.jpg', media_type: kind })),
  );
  await insertRows(
    orm,
    JourneyPhotos,
    ids.map((id, i) => ({ journey: journey.id, photo: id, sort_order: i, created_at: Date.now() })),
  );
  return { journeyId: journey.id, ids };
}

/** A promise the case settles when it likes. */
function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

describe('PhotoSignalsService', () => {
  it('PHSVC-001: measures a gallery photo once, keeps it, and leaves the videos out', async () => {
    const empty = await gallery([]);
    expect(await main.signals.galleryFacts(empty.journeyId)).toEqual([]);
    expect(await main.signals.signalsFor([])).toEqual({ byPhoto: new Map(), pending: 0 });
    const { journeyId, ids } = await gallery(['image', 'video']);
    const id = ids[0] ?? 0;
    resolver.readForSignals.mockResolvedValue({ kind: 'original', bytes: photo });

    const facts = await main.signals.galleryFacts(journeyId);
    expect(facts.map((f) => f.photo_id)).toEqual([id]);
    const first = await main.signals.signalsFor(facts.map((f) => f.photo_id));
    expect(first.pending).toBe(0);
    expect(first.byPhoto.get(id)).toMatchObject({ origWidth: 300, origHeight: 200, clipped: 0 });
    expect(first.byPhoto.get(id)?.phash).toMatch(/^[0-9a-f]{16}$/);
    expect(resolver.readForSignals).toHaveBeenCalledWith(id, MAX_ORIGINAL_BYTES);

    const again = await main.signals.signalsFor([id]);
    expect(again.byPhoto.get(id)).toEqual(first.byPhoto.get(id));
    expect(resolver.readForSignals).toHaveBeenCalledTimes(1);
    expect(await countRows(orm, TrekPhotoSignals, { photo: ids[0], algo: PHOTO_SIGNALS_ALGO })).toBe(1);
    expect(await countRows(orm, TrekPhotoSignals)).toBe(1);
  });

  it("PHSVC-002: a provider's thumbnail keeps the original's size it reports; nothing to measure is an answer, no answer is not", async () => {
    const { ids } = await gallery(['image', 'image', 'image']);
    const [thumb, none, offline] = ids as [number, number, number];
    const sources = new Map<number, PhotoSignalSource>([
      [thumb, { kind: 'thumbnail', bytes: photo, width: 6000, height: 4000 }],
      [none, { kind: 'none' }],
    ]);
    resolver.readForSignals.mockImplementation((photoId) =>
      Promise.resolve<PhotoSignalSource>(sources.get(photoId) ?? { kind: 'unavailable' }),
    );

    const first = await main.signals.signalsFor(ids);
    expect(first.pending).toBe(1);
    expect(first.byPhoto.get(thumb)).toMatchObject({ origWidth: 6000, origHeight: 4000 });
    expect(first.byPhoto.get(thumb)?.sharpness).toEqual(expect.any(Number));
    expect(first.byPhoto.get(none)).toEqual({
      phash: null,
      sharpness: null,
      clipped: null,
      origWidth: null,
      origHeight: null,
    });
    expect(first.byPhoto.has(offline)).toBe(false);

    await main.signals.signalsFor(ids);
    expect(resolver.readForSignals.mock.calls.map(([id]) => id)).toEqual([thumb, none, offline, offline]);
  });

  it('PHSVC-003: a measurement of an older version counts as missing and is made again', async () => {
    const { ids } = await gallery(['image']);
    const id = ids[0] ?? 0;
    await insertRow(orm, TrekPhotoSignals, { photo: id, algo: PHOTO_SIGNALS_ALGO - 1, sharpness: 1 });
    resolver.readForSignals.mockResolvedValue({ kind: 'original', bytes: photo });

    const { byPhoto } = await main.signals.signalsFor([id]);
    expect(byPhoto.get(id)?.origWidth).toBe(300);
    expect(await countRows(orm, TrekPhotoSignals)).toBe(1);
  });

  it('PHSVC-004: waits at most as long as told, and a photo asked for twice is in line once', async () => {
    const { ids } = await gallery(['image']);
    const id = ids[0] ?? 0;
    const bytes = deferred<PhotoSignalSource>();
    resolver.readForSignals.mockReturnValue(bytes.promise);

    const [a, b] = await Promise.all([
      main.signals.signalsFor([id], { waitMs: 20 }),
      main.signals.signalsFor([id], { waitMs: 20 }),
    ]);
    expect([a.pending, b.pending]).toEqual([1, 1]);
    expect(resolver.readForSignals).toHaveBeenCalledTimes(1);

    bytes.resolve({ kind: 'none' });
    await vi.waitFor(async () => expect(await countRows(orm, TrekPhotoSignals)).toBe(1));
    expect((await main.signals.signalsFor([id], { waitMs: 0 })).pending).toBe(0);
    expect(resolver.readForSignals).toHaveBeenCalledTimes(1);
  });
});

describe('PhotoSignalsService, the line', () => {
  it('PHSVC-005: fetches two photos at a time and keeps no more than the line holds', async () => {
    const bytes = deferred<PhotoSignalSource>();
    resolver.readForSignals.mockReturnValue(bytes.promise);
    const ids = Array.from({ length: MAX_QUEUED_PHOTOS + 5 }, (_, i) => 900_000 + i);

    const { pending } = await main.signals.signalsFor(ids, { waitMs: 0 });
    expect(pending).toBe(ids.length);
    expect(resolver.readForSignals).toHaveBeenCalledTimes(PARALLEL_FETCHES);

    // Nothing answers: the line drains without writing, the photos past its end were never in it.
    bytes.resolve({ kind: 'unavailable' });
    await vi.waitFor(() => expect(resolver.readForSignals).toHaveBeenCalledTimes(MAX_QUEUED_PHOTOS));
    expect(await countRows(orm, TrekPhotoSignals)).toBe(0);
  });

  it('PHSVC-006: a photo that times out twice is measured as nothing, once is tried again; busy or unavailable is left for later', async () => {
    const runner = { measure: vi.fn<PhotoSignalsRunner['measure']>(), close: vi.fn(() => Promise.resolve()) };
    const own = await boot(runner);
    try {
      const { ids } = await gallery(['image', 'image', 'image']);
      const [slow, busy, unavailable] = ids as [number, number, number];
      const reasons = new Map([
        [slow, 'timeout'],
        [busy, 'busy'],
        [unavailable, 'unavailable'],
      ]);
      // Each photo's bytes carry its place in `ids`, so the runner knows which one it holds.
      resolver.readForSignals.mockImplementation((photoId) =>
        Promise.resolve<PhotoSignalSource>({ kind: 'original', bytes: Buffer.from([ids.indexOf(photoId)]) }),
      );
      runner.measure.mockImplementation((bytes) =>
        Promise.reject(new Error(reasons.get(ids[bytes[0] ?? 0] ?? 0), { cause: new Error('no thread script') })),
      );

      const first = await own.signals.signalsFor(ids);
      expect(first.pending).toBe(3);
      expect(await countRows(orm, TrekPhotoSignals)).toBe(0);
      const second = await own.signals.signalsFor(ids);
      expect(second.byPhoto.get(slow)).toMatchObject({ sharpness: null, origWidth: null });
      expect([second.byPhoto.has(busy), second.byPhoto.has(unavailable)]).toEqual([false, false]);
      expect(second.pending).toBe(2);
      expect(await countRows(orm, TrekPhotoSignals)).toBe(1);
      expect(runner.measure).toHaveBeenCalledTimes(6);
    } finally {
      await own.t.close();
    }
    expect(runner.close).toHaveBeenCalledTimes(1);
  });

  it('PHSVC-008: a photo whose bytes cannot be read stays pending, and the line goes on', async () => {
    const { ids } = await gallery(['image', 'image']);
    const [broken, fine] = ids as [number, number];
    resolver.readForSignals.mockImplementation((photoId) =>
      photoId === broken
        ? Promise.reject(new Error('disk gone'))
        : Promise.resolve<PhotoSignalSource>({ kind: 'none' }),
    );

    const { byPhoto, pending } = await main.signals.signalsFor([broken, fine]);
    expect(pending).toBe(1);
    expect(byPhoto.has(fine)).toBe(true);
    expect(await countRows(orm, TrekPhotoSignals)).toBe(1);
  });

  it('PHSVC-007: once the module is shutting down a photo is no longer put in line', async () => {
    const own = await boot();
    try {
      const { ids } = await gallery(['image']);
      await own.signals.onModuleDestroy();
      const { pending } = await own.signals.signalsFor(ids, { waitMs: 0 });
      expect(pending).toBe(1);
      expect(resolver.readForSignals).not.toHaveBeenCalled();
    } finally {
      await own.t.close();
    }
  });

  it('PHSVC-009: photos asked for later answer what is stored and queue behind, neither waited for nor counted', async () => {
    const { ids } = await gallery(['image', 'image', 'image']);
    const [asked, stored, behind] = ids as [number, number, number];
    await insertRow(orm, TrekPhotoSignals, { photo: stored, algo: PHOTO_SIGNALS_ALGO, sharpness: 42 });
    const slow = deferred<PhotoSignalSource>();
    resolver.readForSignals.mockImplementation((photoId) =>
      photoId === behind ? slow.promise : Promise.resolve<PhotoSignalSource>({ kind: 'none' }),
    );

    const { byPhoto, pending } = await main.signals.signalsFor([asked], { later: [stored, behind, asked] });
    expect(pending).toBe(0);
    expect(byPhoto.get(stored)?.sharpness).toBe(42);
    expect(byPhoto.has(behind)).toBe(false);
    expect(resolver.readForSignals.mock.calls.map(([id]) => id)).toEqual([asked, behind]);

    slow.resolve({ kind: 'none' });
    await vi.waitFor(async () => expect(await countRows(orm, TrekPhotoSignals)).toBe(3));
  });

  it("PHSVC-010: a provider's sides that disagree with its upright thumbnail on the long side are turned to match", async () => {
    const { ids } = await gallery(['image', 'image', 'image', 'image']);
    const [turned, square, undecoded, unsized] = ids as [number, number, number, number];
    // An undecoded thumbnail (Immich's WebP) cannot say which side is long, so the provider's sides stay.
    const sources = new Map<number, PhotoSignalSource>([
      [turned, { kind: 'thumbnail', bytes: photo, width: 4000, height: 6000 }],
      [square, { kind: 'thumbnail', bytes: photo, width: 5000, height: 5000 }],
      [undecoded, { kind: 'thumbnail', bytes: Buffer.from('RIFF....WEBP'), width: 4000, height: 6000 }],
      [unsized, { kind: 'thumbnail', bytes: photo, width: null, height: null }],
    ]);
    resolver.readForSignals.mockImplementation((photoId) =>
      Promise.resolve<PhotoSignalSource>(sources.get(photoId) ?? { kind: 'none' }),
    );

    const { byPhoto } = await main.signals.signalsFor(ids);
    expect(byPhoto.get(turned)).toMatchObject({ origWidth: 6000, origHeight: 4000 });
    expect(byPhoto.get(square)).toMatchObject({ origWidth: 5000, origHeight: 5000 });
    expect(byPhoto.get(undecoded)).toMatchObject({ sharpness: null, origWidth: 4000, origHeight: 6000 });
    expect(byPhoto.get(unsized)).toMatchObject({ origWidth: null, origHeight: null });
    expect(byPhoto.get(unsized)?.sharpness).toEqual(expect.any(Number));
  });

  it('PHSVC-011: the book engine reads the original size, brightness, colours, busy grid and salient point of a photo', async () => {
    const { ids } = await gallery(['image', 'image', 'image']);
    const [measured, older, broken] = ids as [number, number, number];
    resolver.readForSignals.mockResolvedValue({ kind: 'original', bytes: photo });
    await main.signals.signalsFor([measured]);
    await insertRow(orm, TrekPhotoSignals, { photo: older, algo: PHOTO_SIGNALS_ALGO - 1, orig_width: 800, luma: 0.5 });
    await insertRow(orm, TrekPhotoSignals, {
      photo: broken,
      algo: PHOTO_SIGNALS_ALGO,
      palette: 'not json',
      busy: 'abc',
      sal_x: 0.25,
      sal_y: 0.75,
    });

    const book = await main.signals.bookSignals([measured, older, broken, measured]);

    const own = book.get(measured);
    expect(own).toMatchObject({ width: 300, height: 200, luma: 128, busy: '0'.repeat(64) });
    expect(own?.palette).toEqual([expect.stringMatching(/^#[0-9a-f]{6}:1\.00$/)]);
    expect(own?.salient).toBeUndefined();
    // An older measurement still knows the size, never the colours.
    expect(book.get(older)).toEqual({ width: 800, height: null, luma: 128 });
    // A broken palette or grid reads as none; the salient point beside it still counts.
    expect(book.get(broken)).toEqual({ width: null, height: null, salient: { x: 0.25, y: 0.75 } });
    expect(await main.signals.bookSignals([])).toEqual(new Map());
  });
});
