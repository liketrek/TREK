/**
 * PhotoCaptureBackfillService (#1614) — asking the provider when and where a
 * photo was taken, after the add the user was waiting on has already answered.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// exifr reads real files; the local branch is about which tags are picked and what
// is done with them, not about decoding a JPEG.
vi.mock('exifr', () => ({ default: { parse: vi.fn() } }));
import exifr from 'exifr';
import { PhotoCaptureBackfillService } from '../../../src/nest/memories/photo-capture-backfill.service';
import type { PhotoResolverService } from '../../../src/nest/memories/photo-resolver.service';
import type { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';
import type { StorageService } from '../../../src/nest/storage/storage.service';

// The storage layer's job here is only to hand the EXIF reader a real path;
// materialization (local fast-path vs remote temp download) has its own tests.
const storageStub = {
  withLocalFile: vi.fn(async (_category: string, name: string, fn: (absPath: string) => Promise<unknown>) => fn(`/uploads/journey/${name}`)),
} as unknown as StorageService;

type Row = { id: number; provider?: string; file_path?: string | null; taken_at?: string | null; lat?: number | null; lng?: number | null };

function build(rows: Row[], info: Record<number, unknown>) {
  const recordCaptureMetadata = vi.fn();
  // Keyed on the SECOND argument on purpose: the resolver's signature is
  // (userId, photoId), and a mock that keys on the first one passes just as
  // happily when the two are swapped at the call site.
  const getPhotoInfo = vi.fn(async (_userId: number, id: number) =>
    info[id] ? { success: true, data: info[id] } : { success: false, error: 'nope', status: 404 },
  );
  const photos = {
    resolve: (id: number) => rows.find(r => r.id === id) ?? null,
    recordCaptureMetadata,
  } as unknown as TrekPhotosRepository;
  const resolver = { getPhotoInfo } as unknown as PhotoResolverService;
  return { svc: new PhotoCaptureBackfillService(resolver, photos, storageStub), recordCaptureMetadata, getPhotoInfo };
}

/**
 * A service whose provider stops answering user 1 until `recover` is called, the
 * way a NAS that has gone away holds a lookup until its timeout, and answers
 * every other user at once.
 */
function buildHung(rows: Row[]) {
  const nas = { up: false, pending: [] as Array<() => void> };
  const getPhotoInfo = vi.fn(async (userId: number, _id: number) => {
    if (userId === 1 && !nas.up) {
      await new Promise<void>(resolve => {
        nas.pending.push(resolve);
      });
    }
    return { success: true, data: { takenAt: '2026-03-15T08:00:00Z' } };
  });
  const recordCaptureMetadata = vi.fn(() => true);
  const photos = {
    resolve: (id: number) => rows.find(r => r.id === id) ?? null,
    recordCaptureMetadata,
  } as unknown as TrekPhotosRepository;
  const svc = new PhotoCaptureBackfillService({ getPhotoInfo } as unknown as PhotoResolverService, photos, storageStub);
  const recover = () => {
    nas.up = true;
    for (const answer of nas.pending.splice(0)) answer();
  };
  return { svc, getPhotoInfo, recordCaptureMetadata, recover };
}

/** How many users the service is holding lookup slots for right now. */
function usersWithSlots(svc: PhotoCaptureBackfillService): number {
  return (svc as unknown as { slots: Map<number, unknown> }).slots.size;
}

describe('PhotoCaptureBackfillService', () => {
  it('CAPTURE-001: records what the provider knows', async () => {
    const { svc, recordCaptureMetadata } = build(
      [{ id: 7 }],
      { 7: { takenAt: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 } },
    );

    await svc.run([7], 1);

    expect(recordCaptureMetadata).toHaveBeenCalledWith(7, {
      takenAt: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945,
    });
  });

  it('CAPTURE-002: skips a row that already knows both, so an album import is not a provider call per photo', async () => {
    const { svc, getPhotoInfo } = build(
      [{ id: 7, taken_at: '2026-03-15T10:20:00Z', lat: 1, lng: 2 }],
      { 7: { takenAt: 'x' } },
    );

    await svc.run([7], 1);

    expect(getPhotoInfo).not.toHaveBeenCalled();
  });

  it('CAPTURE-003: still asks when only half is known', async () => {
    const { svc, getPhotoInfo } = build(
      [{ id: 7, taken_at: '2026-03-15T10:20:00Z' }],
      { 7: { takenAt: '2026-03-15T10:20:00Z', lat: 48.8, lng: 2.2 } },
    );

    await svc.run([7], 1);

    expect(getPhotoInfo).toHaveBeenCalledTimes(1);
  });

  it('CAPTURE-004: a provider that refuses leaves the row alone and does not throw', async () => {
    const { svc, recordCaptureMetadata } = build([{ id: 7 }], {});

    await expect(svc.run([7], 1)).resolves.toBe(false);
    expect(recordCaptureMetadata).not.toHaveBeenCalled();
  });

  it('CAPTURE-005: one failing photo does not take down the rest of the batch', async () => {
    const { svc, recordCaptureMetadata } = build(
      [{ id: 7 }, { id: 8 }],
      { 8: { takenAt: '2026-03-16T08:00:00Z', lat: null, lng: null } },
    );
    // 7 has no info entry, so getPhotoInfo answers unsuccessfully for it.

    await svc.run([7, 8], 1);

    expect(recordCaptureMetadata).toHaveBeenCalledTimes(1);
    expect(recordCaptureMetadata).toHaveBeenCalledWith(8, {
      takenAt: '2026-03-16T08:00:00Z', lat: null, lng: null,
    });
  });

  it('CAPTURE-006a: passes the acting user and the photo id in the order the resolver declares', async () => {
    const { svc, getPhotoInfo } = build([{ id: 7 }], { 7: { takenAt: '2026-03-15T10:20:00Z' } });

    await svc.run([7], 42);

    expect(getPhotoInfo).toHaveBeenCalledWith(42, 7);
  });

  it('CAPTURE-006: an empty batch touches nothing', () => {
    const { svc, getPhotoInfo } = build([], {});
    svc.schedule([], 1);
    expect(getPhotoInfo).not.toHaveBeenCalled();
  });

  it('CAPTURE-016: answers whether any row learned something, which is what the journey refresh hangs off', async () => {
    const { svc, recordCaptureMetadata } = build(
      [{ id: 7 }, { id: 8 }],
      { 7: { takenAt: '2026-03-15T10:20:00Z' }, 8: { takenAt: '2026-03-16T08:00:00Z' } },
    );
    // The repository reports no change for 7 (it already knew) and news for 8.
    recordCaptureMetadata.mockImplementation((id: number) => id === 8);

    await expect(svc.run([7, 8], 1)).resolves.toBe(true);

    recordCaptureMetadata.mockReturnValue(false);
    await expect(svc.run([7, 8], 1)).resolves.toBe(false);
  });

  /** A service whose provider takes a moment per photo and counts how many lookups overlap. */
  function buildSlow(count: number) {
    const rows = Array.from({ length: count }, (_, i) => ({ id: i + 1 }));
    const recordCaptureMetadata = vi.fn(() => true);
    const load = { inFlight: 0, peak: 0 };
    const getPhotoInfo = vi.fn(async (_userId: number, id: number) => {
      load.inFlight++;
      load.peak = Math.max(load.peak, load.inFlight);
      await new Promise(resolve => setTimeout(resolve, 5));
      load.inFlight--;
      return { success: true, data: { takenAt: `2026-03-${String((id % 28) + 1).padStart(2, '0')}T08:00:00Z` } };
    });
    const photos = {
      resolve: (id: number) => rows.find(r => r.id === id) ?? null,
      recordCaptureMetadata,
    } as unknown as TrekPhotosRepository;
    const svc = new PhotoCaptureBackfillService({ getPhotoInfo } as unknown as PhotoResolverService, photos, storageStub);
    return { svc, rows, recordCaptureMetadata, getPhotoInfo, load };
  }

  it('CAPTURE-017: one run asks about a few photos at a time instead of one after the other, never more than four', async () => {
    const { svc, rows, recordCaptureMetadata, getPhotoInfo, load } = buildSlow(10);

    await expect(svc.run(rows.map(r => r.id), 1)).resolves.toBe(true);

    expect(load.peak).toBe(4);
    expect(getPhotoInfo).toHaveBeenCalledTimes(10);
    expect(recordCaptureMetadata.mock.calls.map(c => (c as unknown[])[0]).sort((a, b) => (a as number) - (b as number)))
      .toEqual(rows.map(r => r.id));
  });

  it('CAPTURE-018: the four slots are shared by every run of one user, so batches that start together still keep four in flight', async () => {
    // A 1,500-photo import arrives as three batches of 500, each its own detached
    // run; a cap per run would have let them open twelve lookups at once.
    const { svc, rows, getPhotoInfo, load } = buildSlow(15);
    const ids = rows.map(r => r.id);

    const results = await Promise.all([svc.run(ids.slice(0, 5), 1), svc.run(ids.slice(5, 10), 1), svc.run(ids.slice(10), 1)]);

    expect(results).toEqual([true, true, true]);
    expect(load.peak).toBe(4);
    expect(getPhotoInfo).toHaveBeenCalledTimes(15);

    // Every slot came back: a later run gets the full four again.
    load.peak = 0;
    await svc.run(ids.slice(0, 8), 1);
    expect(load.peak).toBe(4);
  });

  it('CAPTURE-019: two overlapping runs of one user together never have more than four lookups open', async () => {
    // Say a gallery import and an entry import landing at the same moment: each
    // run starts four workers of its own, and only four of the eight may ask.
    const { svc, rows, getPhotoInfo, load } = buildSlow(12);
    const ids = rows.map(r => r.id);

    const first = svc.run(ids.slice(0, 6), 1);
    const second = svc.run(ids.slice(6), 1);

    await expect(Promise.all([first, second])).resolves.toEqual([true, true]);
    expect(load.peak).toBe(4);
    expect(getPhotoInfo).toHaveBeenCalledTimes(12);
  });

  it('CAPTURE-020: a lookup that throws gives its slot back', async () => {
    const { svc, rows, getPhotoInfo, load } = buildSlow(8);
    const ids = rows.map(r => r.id);
    // The first four lookups take every slot and then throw. Had they kept their
    // slots, the other four photos would wait for ever and the run never end.
    const slowAnswer = getPhotoInfo.getMockImplementation()!;
    getPhotoInfo.mockImplementation(async (userId: number, id: number) => {
      if (id > 4) return slowAnswer(userId, id);
      load.inFlight++;
      load.peak = Math.max(load.peak, load.inFlight);
      await new Promise(resolve => setTimeout(resolve, 5));
      load.inFlight--;
      throw new Error('NAS gone');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(svc.run(ids, 1)).resolves.toBe(true);
      expect(getPhotoInfo).toHaveBeenCalledTimes(8);
      expect(error).toHaveBeenCalledWith('[Photos] capture backfill failed for 1:', 'NAS gone');

      // All four slots are free again for the next import.
      load.peak = 0;
      getPhotoInfo.mockImplementation(slowAnswer);
      await svc.run(ids, 1);
      expect(load.peak).toBe(4);
      expect(usersWithSlots(svc)).toBe(0);
    } finally {
      error.mockRestore();
    }
  });

  it('CAPTURE-021: a provider that knows only the place records the place, and the time stays unknown', async () => {
    const { svc, recordCaptureMetadata } = build([{ id: 7 }], { 7: { lat: 48.8584, lng: 2.2945 } });

    await svc.run([7], 1);

    expect(recordCaptureMetadata).toHaveBeenCalledWith(7, { takenAt: null, lat: 48.8584, lng: 2.2945 });
  });

  it('CAPTURE-022: a lookup that throws something other than an Error is logged as it is', async () => {
    const { svc, getPhotoInfo } = build([{ id: 7 }], {});
    getPhotoInfo.mockImplementation(async () => { throw 'socket hang up'; });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await expect(svc.run([7], 1)).resolves.toBe(false);
      expect(error).toHaveBeenCalledWith('[Photos] capture backfill failed for 7:', 'socket hang up');
    } finally {
      error.mockRestore();
    }
  });

  it('CAPTURE-023: a NAS that stopped answering one user holds up nobody else', async () => {
    const { svc, getPhotoInfo, recordCaptureMetadata, recover } = buildHung(
      Array.from({ length: 10 }, (_, i) => ({ id: i + 1 })),
    );

    // User 1 imports eight photos: the first four lookups take every slot of
    // theirs and hang, the other four wait behind them.
    const stuck = svc.run([1, 2, 3, 4, 5, 6, 7, 8], 1);
    await vi.waitFor(() => expect(getPhotoInfo).toHaveBeenCalledTimes(4));

    // User 2's import is not queued behind them.
    await expect(svc.run([9, 10], 2)).resolves.toBe(true);
    expect(getPhotoInfo).toHaveBeenCalledWith(2, 9);
    expect(getPhotoInfo).toHaveBeenCalledWith(2, 10);
    expect(recordCaptureMetadata).toHaveBeenCalledWith(10, { takenAt: '2026-03-15T08:00:00Z', lat: null, lng: null });
    expect(getPhotoInfo).toHaveBeenCalledTimes(6);
    expect(usersWithSlots(svc)).toBe(1);

    // Once the NAS is back, user 1's run finishes and leaves no slots behind.
    recover();
    await expect(stuck).resolves.toBe(true);
    expect(getPhotoInfo).toHaveBeenCalledTimes(10);
    expect(usersWithSlots(svc)).toBe(0);
  });

  it('CAPTURE-024: every user has four slots of their own, so two importers may have eight lookups open', async () => {
    const { svc, rows, getPhotoInfo, load } = buildSlow(12);
    const ids = rows.map(r => r.id);

    await expect(Promise.all([svc.run(ids.slice(0, 6), 1), svc.run(ids.slice(6), 2)])).resolves.toEqual([true, true]);

    expect(load.peak).toBe(8);
    expect(getPhotoInfo).toHaveBeenCalledTimes(12);
    expect(usersWithSlots(svc)).toBe(0);
  });
});

describe('PhotoCaptureBackfillService — local files', () => {
  // Reset *and* give it a benign default. A bare mockReset leaves the mock with no
  // implementation at all, and a later mockImplementation that throws then trips
  // vitest's unhandled-error reporting instead of reaching the code's own catch.
  beforeEach(() => {
    vi.mocked(exifr.parse).mockReset();
    vi.mocked(exifr.parse).mockResolvedValue({});
  });

  function localBuild(rows: Row[]) {
    const recordCaptureMetadata = vi.fn();
    const getPhotoInfo = vi.fn();
    const photos = {
      resolve: (id: number) => rows.find(r => r.id === id) ?? null,
      recordCaptureMetadata,
    } as unknown as TrekPhotosRepository;
    const resolver = { getPhotoInfo } as unknown as PhotoResolverService;
    return { svc: new PhotoCaptureBackfillService(resolver, photos, storageStub), recordCaptureMetadata, getPhotoInfo };
  }

  it('CAPTURE-007: reads a local file rather than asking a provider', async () => {
    // Raw values, as exifr hands them over with reviveValues off (#2512).
    vi.mocked(exifr.parse).mockResolvedValue({
      DateTimeOriginal: '2026:03:15 11:20:00',
      OffsetTimeOriginal: '+01:00',
      latitude: 48.8584,
      longitude: 2.2945,
    });
    const { svc, recordCaptureMetadata, getPhotoInfo } = localBuild([
      { id: 7, provider: 'local', file_path: 'journey/a.jpg' },
    ]);

    await svc.run([7], 1);

    expect(getPhotoInfo).not.toHaveBeenCalled();
    expect(recordCaptureMetadata).toHaveBeenCalledWith(7, {
      takenAt: '2026-03-15T10:20:00.000Z', lat: 48.8584, lng: 2.2945,
    });
  });

  it('CAPTURE-008: falls back to CreateDate when the original timestamp is missing', async () => {
    vi.mocked(exifr.parse).mockResolvedValue({ CreateDate: '2026:03:16 08:00:00', OffsetTimeDigitized: '+00:00' });
    const { svc, recordCaptureMetadata } = localBuild([
      { id: 7, provider: 'local', file_path: 'journey/a.jpg' },
    ]);

    await svc.run([7], 1);

    expect(recordCaptureMetadata).toHaveBeenCalledWith(7, {
      takenAt: '2026-03-16T08:00:00.000Z', lat: null, lng: null,
    });
  });

  it('CAPTURE-016: a coordinate that is not a real one drops the pair, not the capture time', async () => {
    // 0,0 is what a receiver without a fix writes, not a place (#2512).
    for (const [latitude, longitude] of [[Number.NaN, 2.2945], [48.8584, 200], [91, 2.2945], [48.8584, undefined], [0, 0]]) {
      vi.mocked(exifr.parse).mockResolvedValue({
        DateTimeOriginal: '2026:03:15 11:20:00', OffsetTimeOriginal: '+01:00', latitude, longitude,
      });
      const { svc, recordCaptureMetadata } = localBuild([
        { id: 7, provider: 'local', file_path: 'journey/a.jpg' },
      ]);

      await svc.run([7], 1);

      expect(recordCaptureMetadata).toHaveBeenCalledWith(7, {
        takenAt: '2026-03-15T10:20:00.000Z', lat: null, lng: null,
      });
    }
  });

  it('CAPTURE-017: a bad coordinate with no usable date records nothing', async () => {
    vi.mocked(exifr.parse).mockResolvedValue({ DateTimeOriginal: 'garbage', latitude: 48.8584 });
    const { svc, recordCaptureMetadata } = localBuild([
      { id: 7, provider: 'local', file_path: 'journey/a.jpg' },
    ]);

    await svc.run([7], 1);

    expect(recordCaptureMetadata).not.toHaveBeenCalled();
  });

  it('CAPTURE-009: a file with nothing readable is left alone', async () => {
    vi.mocked(exifr.parse).mockResolvedValue({});
    const { svc, recordCaptureMetadata } = localBuild([
      { id: 7, provider: 'local', file_path: 'journey/a.jpg' },
    ]);

    await svc.run([7], 1);

    expect(recordCaptureMetadata).not.toHaveBeenCalled();
  });

  it('CAPTURE-010: an unreadable file is not an error', async () => {
    // Throws synchronously. A mock that *rejects* leaves vitest recording the
    // settlement of a promise nothing else owns, and the run fails on that even
    // though the code under test caught it. The catch is the same either way.
    vi.mocked(exifr.parse).mockImplementation((() => { throw new Error('not an image'); }) as never);
    const { svc, recordCaptureMetadata } = localBuild([
      { id: 7, provider: 'local', file_path: 'journey/a.jpg' },
    ]);

    await expect(svc.run([7], 1)).resolves.toBe(false);
    expect(recordCaptureMetadata).not.toHaveBeenCalled();
  });

  it('CAPTURE-011: a stored path that climbs out of the uploads tree is refused', async () => {
    const { svc, recordCaptureMetadata } = localBuild([
      { id: 7, provider: 'local', file_path: '../../../etc/passwd' },
    ]);

    await svc.run([7], 1);

    expect(exifr.parse).not.toHaveBeenCalled();
    expect(recordCaptureMetadata).not.toHaveBeenCalled();
  });

  it('CAPTURE-012: a local row without a path is skipped', async () => {
    const { svc, recordCaptureMetadata } = localBuild([{ id: 7, provider: 'local' }]);

    await svc.run([7], 1);

    expect(exifr.parse).not.toHaveBeenCalled();
    expect(recordCaptureMetadata).not.toHaveBeenCalled();
  });

  it('CAPTURE-013: a row that no longer exists is skipped', async () => {
    const { svc, recordCaptureMetadata } = localBuild([]);
    await svc.run([99], 1);
    expect(recordCaptureMetadata).not.toHaveBeenCalled();
  });

  it('CAPTURE-014: a throwing lookup is swallowed so the detached task survives', async () => {
    const recordCaptureMetadata = vi.fn();
    const photos = {
      resolve: () => { throw new Error('db gone'); },
      recordCaptureMetadata,
    } as unknown as TrekPhotosRepository;
    const svc = new PhotoCaptureBackfillService({} as PhotoResolverService, photos, storageStub);

    await expect(svc.run([7], 1)).resolves.toBe(false);
    expect(recordCaptureMetadata).not.toHaveBeenCalled();
  });

  it('CAPTURE-015: schedule kicks the run off for a non-empty batch', async () => {
    vi.mocked(exifr.parse).mockResolvedValue({ DateTimeOriginal: '2026:03:15 10:20:00', OffsetTimeOriginal: '+00:00' });
    const { svc, recordCaptureMetadata } = localBuild([
      { id: 7, provider: 'local', file_path: 'journey/a.jpg' },
    ]);

    svc.schedule([7], 1);
    await vi.waitFor(() => expect(recordCaptureMetadata).toHaveBeenCalled());
  });

  it('CAPTURE-025: a device upload reads its EXIF while the same user\'s provider lookups hang', async () => {
    vi.mocked(exifr.parse).mockResolvedValue({ DateTimeOriginal: '2026:03:15 10:20:00', OffsetTimeOriginal: '+00:00' });
    const { svc, getPhotoInfo, recordCaptureMetadata, recover } = buildHung([
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 },
      { id: 5, provider: 'local', file_path: 'journey/upload.jpg' },
    ]);

    // The user's own import has every lookup slot taken by a NAS that hangs.
    const stuck = svc.run([1, 2, 3, 4], 1);
    await vi.waitFor(() => expect(getPhotoInfo).toHaveBeenCalledTimes(4));

    // A file on TREK's own storage needs no slot, so the upload is not queued.
    await expect(svc.run([5], 1)).resolves.toBe(true);
    expect(storageStub.withLocalFile).toHaveBeenCalledWith('journey', 'upload.jpg', expect.any(Function));
    expect(recordCaptureMetadata).toHaveBeenCalledWith(5, { takenAt: '2026-03-15T10:20:00.000Z', lat: null, lng: null });
    expect(getPhotoInfo).toHaveBeenCalledTimes(4);

    recover();
    await expect(stuck).resolves.toBe(true);
  });
});
