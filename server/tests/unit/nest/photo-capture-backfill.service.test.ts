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

    await expect(svc.run([7], 1)).resolves.toBeUndefined();
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
    vi.mocked(exifr.parse).mockResolvedValue({
      DateTimeOriginal: new Date('2026-03-15T10:20:00Z'),
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
    vi.mocked(exifr.parse).mockResolvedValue({ CreateDate: new Date('2026-03-16T08:00:00Z') });
    const { svc, recordCaptureMetadata } = localBuild([
      { id: 7, provider: 'local', file_path: 'journey/a.jpg' },
    ]);

    await svc.run([7], 1);

    expect(recordCaptureMetadata).toHaveBeenCalledWith(7, {
      takenAt: '2026-03-16T08:00:00.000Z', lat: null, lng: null,
    });
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

    await expect(svc.run([7], 1)).resolves.toBeUndefined();
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

    await expect(svc.run([7], 1)).resolves.toBeUndefined();
    expect(recordCaptureMetadata).not.toHaveBeenCalled();
  });

  it('CAPTURE-015: schedule kicks the run off for a non-empty batch', async () => {
    vi.mocked(exifr.parse).mockResolvedValue({ DateTimeOriginal: new Date('2026-03-15T10:20:00Z') });
    const { svc, recordCaptureMetadata } = localBuild([
      { id: 7, provider: 'local', file_path: 'journey/a.jpg' },
    ]);

    svc.schedule([7], 1);
    await vi.waitFor(() => expect(recordCaptureMetadata).toHaveBeenCalled());
  });
});
