/**
 * PhotoCaptureBackfillService (#1614) — asking the provider when and where a
 * photo was taken, after the add the user was waiting on has already answered.
 */
import { describe, it, expect, vi } from 'vitest';
import { PhotoCaptureBackfillService } from '../../../src/nest/memories/photo-capture-backfill.service';
import type { PhotoResolverService } from '../../../src/nest/memories/photo-resolver.service';
import type { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';

type Row = { id: number; taken_at?: string | null; lat?: number | null; lng?: number | null };

function build(rows: Row[], info: Record<number, unknown>) {
  const recordCaptureMetadata = vi.fn();
  const getPhotoInfo = vi.fn(async (id: number) =>
    info[id] ? { success: true, data: info[id] } : { success: false, error: 'nope', status: 404 },
  );
  const photos = {
    resolve: (id: number) => rows.find(r => r.id === id) ?? null,
    recordCaptureMetadata,
  } as unknown as TrekPhotosRepository;
  const resolver = { getPhotoInfo } as unknown as PhotoResolverService;
  return { svc: new PhotoCaptureBackfillService(resolver, photos), recordCaptureMetadata, getPhotoInfo };
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

  it('CAPTURE-006: an empty batch touches nothing', () => {
    const { svc, getPhotoInfo } = build([], {});
    svc.schedule([], 1);
    expect(getPhotoInfo).not.toHaveBeenCalled();
  });
});
