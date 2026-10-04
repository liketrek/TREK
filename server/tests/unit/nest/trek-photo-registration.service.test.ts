/**
 * TrekPhotoRegistrationService (class renamed from `TrekPhotosRepository`,
 * Plan 3e R13 — collided with the generated ORM `TrekPhotos.repository.ts`;
 * file/test renamed to match, Plan 4 Task 8a) — PH1-11, now onto
 * `TrekPhotosRepository`/`TripPhotosRepository` (the ORM ones).
 *
 * The three sources of a photo's "when and where" disagree in how much they
 * know: a provider search answers with coordinates, the same provider's
 * album listing does not, and a local file gives them up only once its EXIF
 * has been read (#1614). These pin the merge rule that keeps a later,
 * emptier answer from erasing an earlier one, plus the rest of PH1-11.
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { createSnapshotTestDb } from '../../helpers/db-mock';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { createUser, createTrip } from '../../helpers/factories';
import { TrekPhotoRegistrationService } from '../../../src/nest/photos/trek-photo-registration.service';
import { TrekPhotos } from '../../../src/db/entities/TrekPhotos.entity';
import { TripPhotos } from '../../../src/db/entities/TripPhotos.entity';
import { JourneyPhotos } from '../../../src/db/entities/JourneyPhotos.entity';
import { TripAlbumLinks } from '../../../src/db/entities/TripAlbumLinks.entity';
import { decrypt_api_key } from '../../../src/nest/common/crypto/apiKeyCrypto';

const testDb = createSnapshotTestDb();
let t: TestOrm;
let repo: TrekPhotoRegistrationService;

beforeAll(async () => {
  t = await createTestOrm(testDb);
  repo = new TrekPhotoRegistrationService(t.repo(TrekPhotos), t.repo(TripPhotos), t.repo(JourneyPhotos));
});

beforeEach(() => { resetTestDb(testDb); t.clear(); });
afterAll(async () => { await t.close(); testDb.close(); });

// A fresh path per call: getOrCreateLocal is keyed on file_path and resetTestDb
// leaves trek_photos alone, so a shared path would hand every test the same row.
let seq = 0;
async function makePhoto(): Promise<number> {
  return await repo.getOrCreateLocal(`/uploads/journey/${++seq}.jpg`, null, null, null, 'image', null);
}

function rawRow(id: number): unknown {
  return testDb.prepare('SELECT * FROM trek_photos WHERE id = ?').get(id);
}

function read(id: number) {
  return testDb.prepare('SELECT taken_at, lat, lng FROM trek_photos WHERE id = ?').get(id) as {
    taken_at: string | null; lat: number | null; lng: number | null;
  };
}

describe('TrekPhotoRegistrationService.recordCaptureMetadata', () => {
  it('TREKPHOTO-001: stores the capture time and coordinates', async () => {
    const id = await makePhoto();
    await repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });

    expect(read(id)).toEqual({ taken_at: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
  });

  it('TREKPHOTO-002: a later, emptier answer does not erase what is known', async () => {
    const id = await makePhoto();
    await repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
    // The album listing knows the date but not the place.
    await repo.recordCaptureMetadata(id, { takenAt: '2020-01-01T00:00:00Z', lat: null, lng: null });

    expect(read(id)).toEqual({ taken_at: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
  });

  it('TREKPHOTO-003: fills only the half that was still missing', async () => {
    const id = await makePhoto();
    await repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z' });
    await repo.recordCaptureMetadata(id, { lat: 48.8584, lng: 2.2945 });

    expect(read(id)).toEqual({ taken_at: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
  });

  it('TREKPHOTO-004: refuses half a coordinate pair rather than landing on null island', async () => {
    const id = await makePhoto();
    await repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z', lat: 48.8584, lng: null });

    expect(read(id)).toEqual({ taken_at: '2026-03-15T10:20:00Z', lat: null, lng: null });
  });

  it('TREKPHOTO-005: an answer with nothing in it touches no row', async () => {
    const id = await makePhoto();
    await repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
    await repo.recordCaptureMetadata(id, {});

    expect(read(id)).toEqual({ taken_at: '2026-03-15T10:20:00Z', lat: 48.8584, lng: 2.2945 });
  });

  it('TREKPHOTO-006: says whether the row learned anything, so a refresh is only sent for news', async () => {
    const id = await makePhoto();

    expect(await repo.recordCaptureMetadata(id, { takenAt: '2026-03-15T10:20:00Z' })).toBe(true);
    // Same answer again: every COALESCE keeps what is there.
    expect(await repo.recordCaptureMetadata(id, { takenAt: '2020-01-01T00:00:00Z' })).toBe(false);
    // Half a pair is dropped, so there is nothing new in it either.
    expect(await repo.recordCaptureMetadata(id, { lat: 48.8584, lng: null })).toBe(false);
    expect(await repo.recordCaptureMetadata(id, { lat: 48.8584, lng: 2.2945 })).toBe(true);
    expect(await repo.recordCaptureMetadata(id, {})).toBe(false);
    expect(await repo.recordCaptureMetadata(999999, { takenAt: '2026-03-15T10:20:00Z' })).toBe(false);
  });
});

describe('TrekPhotoRegistrationService.getOrCreate (PH1-3)', () => {
  it('TREKPHOTO-010: registers a new remote asset', async () => {
    const { user } = createUser(testDb);
    const id = await repo.getOrCreate('immich', 'asset-1', user.id, undefined, 'video');
    expect(rawRow(id)).toMatchObject({ provider: 'immich', asset_id: 'asset-1', owner_id: user.id, media_type: 'video' });
  });

  it('TREKPHOTO-011: a repeat lookup returns the same id rather than inserting a duplicate row', async () => {
    const { user } = createUser(testDb);
    const first = await repo.getOrCreate('immich', 'asset-2', user.id);
    const second = await repo.getOrCreate('immich', 'asset-2', user.id);
    expect(second).toBe(first);
    expect(testDb.prepare('SELECT COUNT(*) as c FROM trek_photos WHERE asset_id = ?').get('asset-2')).toEqual({ c: 1 });
  });

  it('TREKPHOTO-012 (PH2): a passphrase on an already-registered asset re-encrypts and replaces it', async () => {
    const { user } = createUser(testDb);
    const id = await repo.getOrCreate('synologyphotos', 'asset-3', user.id, 'first-pass');
    await repo.getOrCreate('synologyphotos', 'asset-3', user.id, 'second-pass');

    const row = rawRow(id) as { passphrase: string };
    expect(decrypt_api_key(row.passphrase)).toBe('second-pass');
  });

  it('TREKPHOTO-013: a passphrase-free repeat lookup leaves the stored passphrase untouched', async () => {
    const { user } = createUser(testDb);
    const id = await repo.getOrCreate('synologyphotos', 'asset-4', user.id, 'keep-me');
    await repo.getOrCreate('synologyphotos', 'asset-4', user.id);

    const row = rawRow(id) as { passphrase: string };
    expect(decrypt_api_key(row.passphrase)).toBe('keep-me');
  });
});

describe('TrekPhotoRegistrationService.getOrCreateLocal (PH4-5)', () => {
  it('TREKPHOTO-020: registers a new local photo', async () => {
    const id = await repo.getOrCreateLocal('journey/a.jpg', 'journey/thumbs/a.jpg', 800, 600, 'image', null);
    expect(rawRow(id)).toMatchObject({
      provider: 'local', file_path: 'journey/a.jpg', thumbnail_path: 'journey/thumbs/a.jpg', width: 800, height: 600,
    });
  });

  it('TREKPHOTO-021: a repeat lookup on the same path returns the same id', async () => {
    const first = await repo.getOrCreateLocal('journey/b.jpg');
    const second = await repo.getOrCreateLocal('journey/b.jpg', 'ignored-thumb.jpg', 1, 1);
    expect(second).toBe(first);
    // The second call's fields never reach the row — getOrCreateLocal only inserts once.
    expect(rawRow(first)).toMatchObject({ thumbnail_path: null, width: null, height: null });
  });
});

describe('TrekPhotoRegistrationService.resolve (PH6) — parity with the legacy SELECT *', () => {
  it('TREKPHOTO-030: a remote photo with capture metadata partially set matches the raw row byte-for-byte, full key set', async () => {
    const { user } = createUser(testDb);
    const id = await repo.getOrCreate('immich', 'asset-parity', user.id, 'a-passphrase', 'video');
    await repo.recordCaptureMetadata(id, { takenAt: '2026-05-01T00:00:00Z', lat: null, lng: null });

    const legacy = testDb.prepare('SELECT * FROM trek_photos WHERE id = ?').get(id);
    const resolved = await repo.resolve(id);

    expect(resolved).toEqual(legacy);
  });

  it('TREKPHOTO-031: a local photo with a full coordinate pair matches the raw row byte-for-byte, full key set', async () => {
    const id = await repo.getOrCreateLocal('journey/parity.jpg', 'journey/thumbs/parity.jpg', 800, 600, 'image', null);
    await repo.recordCaptureMetadata(id, { takenAt: '2026-05-02T00:00:00Z', lat: 48.1, lng: 11.6 });

    const legacy = testDb.prepare('SELECT * FROM trek_photos WHERE id = ?').get(id);
    const resolved = await repo.resolve(id);

    expect(resolved).toEqual(legacy);
  });

  it('TREKPHOTO-032: an unknown id resolves to null, not a thrown error', async () => {
    expect(await repo.resolve(999999)).toBeNull();
  });
});

describe('TrekPhotoRegistrationService.setProvider (PH7)', () => {
  it('TREKPHOTO-040: retargets a local photo onto a provider once uploaded there', async () => {
    const { user } = createUser(testDb);
    const id = await repo.getOrCreateLocal('journey/retarget.jpg');
    await repo.setProvider(id, 'immich', 'new-asset', user.id);

    expect(rawRow(id)).toMatchObject({ provider: 'immich', asset_id: 'new-asset', owner_id: user.id });
  });
});

describe('TrekPhotoRegistrationService.recordLocalThumbnail (PH8)', () => {
  it('TREKPHOTO-050: stamps a generated thumbnail and its dimensions', async () => {
    const id = await repo.getOrCreateLocal('journey/thumb-src.jpg');
    await repo.recordLocalThumbnail(id, 'journey/thumbs/thumb-src.jpg', 800, 600);

    expect(rawRow(id)).toMatchObject({ thumbnail_path: 'journey/thumbs/thumb-src.jpg', width: 800, height: 600 });
  });

  it('TREKPHOTO-051: a re-generated thumbnail does not blank dimensions already known', async () => {
    const id = await repo.getOrCreateLocal('journey/thumb-keep.jpg', null, 1200, 900);
    await repo.recordLocalThumbnail(id, 'journey/thumbs/thumb-keep.jpg', 400, 300);

    // COALESCE(width, ?) keeps the already-known 1200x900, not the new 400x300.
    expect(rawRow(id)).toMatchObject({ thumbnail_path: 'journey/thumbs/thumb-keep.jpg', width: 1200, height: 900 });
  });
});

describe('TrekPhotoRegistrationService.deleteIfOrphan (PH10-11)', () => {
  it('TREKPHOTO-060: an unreferenced remote photo is deleted', async () => {
    const { user } = createUser(testDb);
    const id = await repo.getOrCreate('immich', 'orphan-1', user.id);
    await repo.deleteIfOrphan(id);
    expect(rawRow(id)).toBeUndefined();
  });

  it('TREKPHOTO-061: a photo still referenced by trip_photos (3e-owned) is kept', async () => {
    const { user } = createUser(testDb);
    const id = await repo.getOrCreate('immich', 'referenced-1', user.id);
    const trip = createTrip(testDb, user.id);
    testDb.prepare('INSERT INTO trip_photos (trip_id, user_id, photo_id, shared) VALUES (?, ?, ?, 1)').run(trip.id, user.id, id);

    await repo.deleteIfOrphan(id);
    expect(rawRow(id)).toBeDefined();
  });

  it('TREKPHOTO-062: a photo still referenced by journey_photos (Plan 3g, converted onto JourneyPhotosRepository.existsForPhoto) is kept', async () => {
    const { user } = createUser(testDb);
    const id = await repo.getOrCreate('immich', 'referenced-2', user.id);
    testDb.prepare("INSERT INTO journeys (user_id, title, status, created_at, updated_at) VALUES (?, 'J', 'draft', 0, 0)").run(user.id);
    const journeyId = testDb.prepare('SELECT id FROM journeys WHERE user_id = ?').get(user.id) as { id: number };
    testDb.prepare('INSERT INTO journey_photos (journey_id, photo_id, created_at) VALUES (?, ?, 0)').run(journeyId.id, id);

    await repo.deleteIfOrphan(id);
    expect(rawRow(id)).toBeDefined();
  });

  it('TREKPHOTO-063: an unreferenced LOCAL photo is never reclaimed here — its bytes are ours', async () => {
    const id = await repo.getOrCreateLocal('journey/never-reclaimed.jpg');
    await repo.deleteIfOrphan(id);
    expect(rawRow(id)).toBeDefined();
  });
});

describe('M1: TripAlbumLinksRepository/TripPhotosRepository onConflict + empty-array branches', () => {
  it('TripAlbumLinksRepository.insertIgnore returns true on a fresh insert and false on a repeat (onConflict doNothing); listForTrip short-circuits on an empty provider list', async () => {
    const albumLinks = t.repo(TripAlbumLinks);
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const row = { trip_id: trip.id, user_id: user.id, provider: 'immich', album_id: 'alb-1', album_name: 'Album', passphrase: null };

    expect(await albumLinks.insertIgnore(row)).toBe(true);
    expect(await albumLinks.insertIgnore(row)).toBe(false); // same (trip, user, provider, album_id) — conflict
    expect(await albumLinks.listForTrip(trip.id, [])).toEqual([]);
  });

  it('TripPhotosRepository.insertIgnore returns true on a fresh insert and false on a repeat (onConflict doNothing); listForTrip short-circuits on an empty provider list', async () => {
    const tripPhotos = t.repo(TripPhotos);
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const photoId = await repo.getOrCreate('immich', 'photo-1', user.id);
    const row = { trip_id: trip.id, user_id: user.id, photo_id: photoId, shared: 1, album_link_id: null };

    expect(await tripPhotos.insertIgnore(row)).toBe(true);
    expect(await tripPhotos.insertIgnore(row)).toBe(false); // same (trip, user, photo) — conflict
    expect(await tripPhotos.listForTrip(trip.id, user.id, [])).toEqual([]);
  });
});
