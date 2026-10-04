/**
 * PhotoCaptureBackfillService against real files (#2512).
 *
 * The sibling suite mocks exifr, which is how a pick that could never return GPS
 * and a date read in the wrong zone both passed it: the mock handed back exactly
 * what the code hoped exifr would. Here exifr reads real JPEG bytes carrying the
 * tags a phone writes, through a real StorageService, with the process in a zone
 * that is neither UTC nor the photographer's.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { PhotoCaptureBackfillService } from '../../../src/nest/memories/photo-capture-backfill.service';
import type { PhotoResolverService } from '../../../src/nest/memories/photo-resolver.service';
import type { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { jpegWithExif, type ExifJpegTags } from '../../helpers/exif-jpeg';
import { makeStorageFixture, type StorageFixture } from '../../helpers/storage-fixture';

// Normandy, west of Greenwich, so a dropped sign would show.
const NORMANDY = { lat: 49.274523, lng: -0.703421 };

let fx: StorageFixture;
let prevTz: string | undefined;
let seq = 0;

beforeAll(() => { fx = makeStorageFixture('journey/'); });
afterAll(() => fx.cleanup());
beforeEach(() => {
  prevTz = process.env.TZ;
  process.env.TZ = 'America/Chicago';
});
afterEach(() => {
  if (prevTz === undefined) delete process.env.TZ;
  else process.env.TZ = prevTz;
});

/** Stores `bytes` as a local journey upload, runs the backfill on it, returns what was recorded. */
async function backfill(bytes: Buffer): Promise<unknown[][]> {
  const name = `upload-${++seq}.jpg`;
  await fx.storage.put('journey', name, Readable.from(bytes), { contentType: 'image/jpeg' });
  const recordCaptureMetadata = vi.fn();
  const photos = {
    resolve: (id: number) => ({ id, provider: 'local', file_path: `journey/${name}`, taken_at: null, lat: null, lng: null }),
    recordCaptureMetadata,
  } as unknown as TrekPhotoRegistrationService;
  const svc = new PhotoCaptureBackfillService({} as PhotoResolverService, photos, fx.storage);
  await svc.run([7], 1);
  return recordCaptureMetadata.mock.calls;
}

const photo = (tags: ExifJpegTags) => backfill(jpegWithExif(tags));

describe('PhotoCaptureBackfillService reading real EXIF', () => {
  it('EXIF-001: the reported phone photo gets its true instant and its GPS', async () => {
    const calls = await photo({
      DateTimeOriginal: '2026:05:30 15:52:19',
      CreateDate: '2026:05:30 15:52:19',
      OffsetTime: '+02:00',
      OffsetTimeOriginal: '+02:00',
      OffsetTimeDigitized: '+02:00',
      gps: NORMANDY,
    });

    expect(calls).toHaveLength(1);
    const [id, meta] = calls[0] as [number, { takenAt: string; lat: number; lng: number }];
    expect(id).toBe(7);
    // Not 20:52:19Z, which is 15:52 read as Chicago time.
    expect(meta.takenAt).toBe('2026-05-30T13:52:19.000Z');
    expect(meta.lat).toBeCloseTo(NORMANDY.lat, 5);
    expect(meta.lng).toBeCloseTo(NORMANDY.lng, 5);
  });

  it('EXIF-002: the offset is found in OffsetTimeDigitized when it is the only one', async () => {
    const calls = await photo({ DateTimeOriginal: '2026:05:30 15:52:19', OffsetTimeDigitized: '+02:00' });
    expect(calls).toEqual([[7, { takenAt: '2026-05-30T13:52:19.000Z', lat: null, lng: null }]]);
  });

  it('EXIF-003: the offset is found in OffsetTime when it is the only one', async () => {
    const calls = await photo({ DateTimeOriginal: '2026:05:30 15:52:19', OffsetTime: '+09:00' });
    expect(calls).toEqual([[7, { takenAt: '2026-05-30T06:52:19.000Z', lat: null, lng: null }]]);
  });

  it('EXIF-004: DateTimeOriginal goes with its own offset when the tags disagree', async () => {
    const calls = await photo({
      DateTimeOriginal: '2026:05:30 15:52:19',
      OffsetTimeOriginal: '+02:00',
      OffsetTimeDigitized: '+05:00',
      OffsetTime: '-03:00',
    });
    expect(calls).toEqual([[7, { takenAt: '2026-05-30T13:52:19.000Z', lat: null, lng: null }]]);
  });

  it('EXIF-005: CreateDate stands in for a missing DateTimeOriginal, with its own offset first', async () => {
    const calls = await photo({
      CreateDate: '2026:05:30 21:10:00',
      OffsetTimeDigitized: '+01:00',
      OffsetTimeOriginal: '+02:00',
    });
    expect(calls).toEqual([[7, { takenAt: '2026-05-30T20:10:00.000Z', lat: null, lng: null }]]);
  });

  it('EXIF-006: CreateDate also stands in when DateTimeOriginal is garbage', async () => {
    const calls = await photo({
      DateTimeOriginal: '0000:00:00 00:00:00',
      CreateDate: '2026:05:30 15:52:19',
      OffsetTimeOriginal: '+02:00',
    });
    expect(calls).toEqual([[7, { takenAt: '2026-05-30T13:52:19.000Z', lat: null, lng: null }]]);
  });

  it('EXIF-007: with no offset the stamp is read in the server zone, exactly as before', async () => {
    const calls = await photo({ DateTimeOriginal: '2026:05:30 15:52:19' });
    // 15:52 CDT.
    expect(calls).toEqual([[7, { takenAt: '2026-05-30T20:52:19.000Z', lat: null, lng: null }]]);
  });

  it('EXIF-008: a malformed offset is ignored like a missing one', async () => {
    for (const bad of ['+2:00', '   :  ', '+99:00', 'CEST']) {
      const calls = await photo({ DateTimeOriginal: '2026:05:30 15:52:19', OffsetTimeOriginal: bad });
      expect(calls, bad).toEqual([[7, { takenAt: '2026-05-30T20:52:19.000Z', lat: null, lng: null }]]);
    }
  });

  it('EXIF-009: an impossible or garbage date is not stored, and does not cost the location', async () => {
    for (const bad of ['0000:00:00 00:00:00', '2026:02:30 25:61:00', '    :  :     :  :  ', 'not a date']) {
      const calls = await photo({ DateTimeOriginal: bad, OffsetTimeOriginal: '+02:00', gps: NORMANDY });
      expect(calls, bad).toHaveLength(1);
      const [, meta] = calls[0] as [number, { takenAt: string | null; lat: number; lng: number }];
      expect(meta.takenAt, bad).toBeNull();
      expect(meta.lat, bad).toBeCloseTo(NORMANDY.lat, 5);
      expect(meta.lng, bad).toBeCloseTo(NORMANDY.lng, 5);
    }
  });

  it('EXIF-010: an impossible date with nothing else to go on records nothing', async () => {
    expect(await photo({ DateTimeOriginal: '2026:02:30 10:00:00' })).toEqual([]);
  });

  it('EXIF-011: GPS without any date still puts the photo on the map', async () => {
    const calls = await photo({ gps: { lat: -33.856784, lng: 151.215297 } });
    expect(calls).toHaveLength(1);
    const [, meta] = calls[0] as [number, { takenAt: string | null; lat: number; lng: number }];
    expect(meta.takenAt).toBeNull();
    expect(meta.lat).toBeCloseTo(-33.856784, 5);
    expect(meta.lng).toBeCloseTo(151.215297, 5);
  });

  it('EXIF-012: a JPEG without EXIF and a file that is not an image both record nothing', async () => {
    const plain = fs.readFileSync(path.join(__dirname, '../../fixtures/small-image.jpg'));
    expect(await backfill(plain)).toEqual([]);
    expect(await backfill(Buffer.from('definitely not a jpeg'))).toEqual([]);
  });

  it('EXIF-013: a GPS block of zeros, as a receiver without a fix writes it, is no location', async () => {
    const zeros = { lat: 0, lng: 0 };
    expect(await photo({ DateTimeOriginal: '2026:05:30 15:52:19', OffsetTimeOriginal: '+02:00', gps: zeros }))
      .toEqual([[7, { takenAt: '2026-05-30T13:52:19.000Z', lat: null, lng: null }]]);
    // Nothing else to go on: nothing is recorded, rather than a pin in the Gulf of Guinea.
    expect(await photo({ gps: zeros })).toEqual([]);
  });

  it('EXIF-014: a real place on the equator or the prime meridian keeps its location', async () => {
    for (const gps of [{ lat: 0, lng: 32.58 }, { lat: 51.4779, lng: 0 }]) {
      const calls = await photo({ gps });
      expect(calls, JSON.stringify(gps)).toHaveLength(1);
      const [, meta] = calls[0] as [number, { lat: number; lng: number }];
      expect(meta.lat).toBeCloseTo(gps.lat, 5);
      expect(meta.lng).toBeCloseTo(gps.lng, 5);
    }
  });

  it('EXIF-015: a stamp that carries its own zone is read in that zone', async () => {
    const calls = await photo({ DateTimeOriginal: '2026:05:30 15:52:19 UTC', OffsetTimeOriginal: '+02:00' });
    expect(calls).toEqual([[7, { takenAt: '2026-05-30T15:52:19.000Z', lat: null, lng: null }]]);
  });
});
