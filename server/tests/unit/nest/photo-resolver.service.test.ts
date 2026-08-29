/**
 * PhotoResolverService — the provider dispatch half of the old
 * photoResolverService.
 *
 * It routes a stored trek_photo to bytes: local file, generated thumbnail, or
 * the provider that owns the asset. None of this was measured before the fold
 * (services/memories/ sits outside the coverage gate), so the branch that
 * decides a poster-less video must 404 rather than stream the whole file as a
 * "thumbnail" had no case at all.
 */
import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { DatabaseService } from '../../../src/nest/database/database.service';
import type { ImmichService } from '../../../src/nest/memories/immich.service';
import { PhotoProviderRegistry } from '../../../src/nest/memories/photo-provider.registry';
import { PhotoResolverService } from '../../../src/nest/memories/photo-resolver.service';
import { ImmichPhotoProvider } from '../../../src/nest/memories/providers/immich.provider';
import { SynologyPhotoProvider } from '../../../src/nest/memories/providers/synology.provider';
import type { SynologyService } from '../../../src/nest/memories/synology.service';
import type { ThumbnailService } from '../../../src/nest/memories/thumbnail.service';
import type { TrekPhotoCacheService } from '../../../src/nest/memories/trek-photo-cache.service';
import { TrekPhotosRepository } from '../../../src/nest/photos/trek-photos.repository';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  return {
    testDb: db,
    dbMock: {
      db,
      closeDb: () => {},
      reinitialize: () => {},
      canAccessTrip: () => null,
      isOwner: () => false,
      getPlaceWithTags: () => null,
    },
  };
});
vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'x'.repeat(40),
  ENCRYPTION_KEY: 'a'.repeat(64),
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/nest/common/crypto/apiKeyCrypto', () => ({
  decrypt_api_key: (v: string) => v,
  encrypt_api_key: (v: string) => v,
  maybe_encrypt_api_key: (v: string) => v,
}));

const immich = {
  streamImmichAsset: vi.fn(),
  fetchImmichThumbnailBytes: vi.fn(),
  getAssetInfo: vi.fn(),
};
const synology = {
  streamSynologyAsset: vi.fn(),
  fetchSynologyThumbnailBytes: vi.fn(),
  getSynologyAssetInfo: vi.fn(),
};
const thumbnails = { ensureLocalThumbnail: vi.fn() };
// The cache has its own suite; here it is a switch for hit/miss/in-flight.
const cache = {
  cacheKey: vi.fn(() => 'k'),
  serveFresh: vi.fn(() => false),
  getInFlight: vi.fn(() => undefined),
  setInFlight: vi.fn(),
  put: vi.fn(),
};
// Local bytes go through the storage facade (slice 3); the resolver only ever
// addresses the 'journey' category with the 'journey/' prefix stripped.
const storage = { exists: vi.fn(), sendToResponse: vi.fn() };

const dbs = new DatabaseService(testDb);
const repo = new TrekPhotosRepository(dbs);
// Real adapters over the stubbed services, and a real registry: the cases below
// keep asserting on immich.streamImmichAsset/synology.streamSynologyAsset, so
// they now also pin the adapters' argument mapping — which is where the two
// providers' differing parameter orders used to be a transposition waiting to
// happen.
const providers = new PhotoProviderRegistry([
  new ImmichPhotoProvider(immich as unknown as ImmichService),
  new SynologyPhotoProvider(synology as unknown as SynologyService),
]);
const svc = new PhotoResolverService(
  repo,
  thumbnails as unknown as ThumbnailService,
  cache as unknown as TrekPhotoCacheService,
  providers,
  storage as unknown as import('../../../src/nest/storage/storage.service').StorageService,
);

function makeRes() {
  return { status: vi.fn().mockReturnThis(), json: vi.fn(), set: vi.fn(), sendFile: vi.fn(), end: vi.fn() };
}

/** Insert a trek_photos row directly so each case controls the exact shape. */
function insertPhoto(cols: Record<string, unknown>): number {
  const keys = Object.keys(cols);
  const res = testDb
    .prepare(`INSERT INTO trek_photos (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`)
    .run(...keys.map((k) => cols[k] as never));
  return Number(res.lastInsertRowid);
}

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  vi.clearAllMocks();
  // owner_id carries a FK to users; the cases pick fixed ids, so seed them.
  testDb.prepare('DELETE FROM trek_photos').run();
  for (const id of [2, 3, 4, 5, 9]) {
    testDb
      .prepare("INSERT OR IGNORE INTO users (id, username, email, password_hash) VALUES (?, ?, ?, 'x')")
      .run(id, `u${id}`, `u${id}@example.test`);
  }
  cache.serveFresh.mockReturnValue(false);
  cache.getInFlight.mockReturnValue(undefined);
  cache.cacheKey.mockReturnValue('k');
  storage.exists.mockResolvedValue(false);
  storage.sendToResponse.mockResolvedValue(undefined);
});

afterAll(() => testDb.close());

describe('streamPhoto — dispatch', () => {
  it('RESOLVE-001: 404s a photo id that does not exist', async () => {
    const res = makeRes();
    await svc.streamPhoto(res as never, 1, 999999, 'original');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Photo not found' });
  });

  it('RESOLVE-002: a local row whose file is gone answers "File not found", not a provider call', async () => {
    const id = insertPhoto({ provider: 'local', file_path: 'nope/missing.jpg' });
    const res = makeRes();

    await svc.streamPhoto(res as never, 1, id, 'original');

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'File not found' });
    expect(immich.streamImmichAsset).not.toHaveBeenCalled();
    expect(synology.streamSynologyAsset).not.toHaveBeenCalled();
  });

  it('RESOLVE-003: a poster-less video 404s instead of streaming the whole file as a thumbnail', async () => {
    // #823: falling through here would push a full video down a thumbnail request.
    const id = insertPhoto({ provider: 'local', file_path: 'nope/clip.mp4', media_type: 'video' });
    const res = makeRes();

    await svc.streamPhoto(res as never, 1, id, 'thumbnail');

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No poster available' });
    expect(thumbnails.ensureLocalThumbnail).not.toHaveBeenCalled();
  });

  it('RESOLVE-004: a local image with no thumbnail asks for one to be generated', async () => {
    const id = insertPhoto({ provider: 'local', file_path: 'nope/photo.jpg' });
    thumbnails.ensureLocalThumbnail.mockResolvedValue(null);
    const res = makeRes();

    await svc.streamPhoto(res as never, 1, id, 'thumbnail');

    expect(thumbnails.ensureLocalThumbnail).toHaveBeenCalledOnce();
  });

  it('RESOLVE-005: a generated thumbnail is recorded on the row', async () => {
    const id = insertPhoto({ provider: 'local', file_path: 'nope/photo.jpg' });
    thumbnails.ensureLocalThumbnail.mockResolvedValue({
      thumbnailRelPath: 'journey/thumbs/abc.jpg',
      width: 800,
      height: 600,
    });
    const res = makeRes();

    await svc.streamPhoto(res as never, 1, id, 'thumbnail');

    const row = testDb.prepare('SELECT thumbnail_path, width, height FROM trek_photos WHERE id = ?').get(id) as {
      thumbnail_path: string;
      width: number;
      height: number;
    };
    expect(row).toEqual({ thumbnail_path: 'journey/thumbs/abc.jpg', width: 800, height: 600 });
  });

  it('RESOLVE-014: a local thumbnail hit streams through storage with the immutable headers', async () => {
    const id = insertPhoto({ provider: 'local', file_path: 'journey/x.jpg', thumbnail_path: 'journey/thumbs/h.jpg' });
    storage.exists.mockResolvedValue(true);
    const res = makeRes();

    await svc.streamPhoto(res as never, 1, id, 'thumbnail');

    expect(storage.exists).toHaveBeenCalledWith('journey', 'thumbs/h.jpg');
    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400, immutable');
    expect(res.set).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(storage.sendToResponse).toHaveBeenCalledWith('journey', 'thumbs/h.jpg', res);
  });

  it('RESOLVE-015: a local original hit streams through storage with the day-long cache header', async () => {
    const id = insertPhoto({ provider: 'local', file_path: 'journey/x.jpg' });
    storage.exists.mockResolvedValue(true);
    const res = makeRes();

    await svc.streamPhoto(res as never, 1, id, 'original');

    expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
    expect(res.set).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
    expect(storage.sendToResponse).toHaveBeenCalledWith('journey', 'x.jpg', res);
  });

  it('RESOLVE-016: a missing thumbnail falls through to the original for images', async () => {
    const id = insertPhoto({ provider: 'local', file_path: 'journey/x.jpg', thumbnail_path: 'journey/thumbs/h.jpg' });
    storage.exists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const res = makeRes();

    await svc.streamPhoto(res as never, 1, id, 'thumbnail');

    expect(storage.sendToResponse).toHaveBeenCalledWith('journey', 'x.jpg', res);
  });

  it('RESOLVE-017: a video whose recorded poster is gone 404s instead of falling through (#823)', async () => {
    const id = insertPhoto({
      provider: 'local',
      file_path: 'journey/clip.mp4',
      thumbnail_path: 'journey/thumbs/t.jpg',
      media_type: 'video',
    });
    storage.exists.mockResolvedValue(false);
    const res = makeRes();

    await svc.streamPhoto(res as never, 1, id, 'thumbnail');

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No poster available' });
    expect(storage.sendToResponse).not.toHaveBeenCalled();
  });

  it('RESOLVE-019: a rejecting exists check (invalid key) reads as a local miss for thumb and original', async () => {
    const id = insertPhoto({ provider: 'local', file_path: 'journey/x.jpg', thumbnail_path: 'journey/thumbs/h.jpg' });
    storage.exists.mockRejectedValue(new Error('invalid storage key'));
    const res = makeRes();

    await svc.streamPhoto(res as never, 1, id, 'thumbnail');

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'File not found' });
    expect(storage.sendToResponse).not.toHaveBeenCalled();
  });

  it('RESOLVE-018: a file_path outside journey/ reads as a local miss without touching storage', async () => {
    const id = insertPhoto({ provider: 'local', file_path: 'nope/other.jpg' });
    const res = makeRes();

    await svc.streamPhoto(res as never, 1, id, 'original');

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'File not found' });
    expect(storage.exists).not.toHaveBeenCalled();
  });

  it('RESOLVE-006: an immich original goes straight to the provider with the range header', async () => {
    const id = insertPhoto({ provider: 'immich', asset_id: 'a1', owner_id: 5 });
    const res = makeRes();

    await svc.streamPhoto(res as never, 3, id, 'original', 'bytes=0-99');

    expect(immich.streamImmichAsset).toHaveBeenCalledWith(
      res,
      3,
      'a1',
      'original',
      5,
      expect.objectContaining({ range: 'bytes=0-99' }),
    );
  });

  it('RESOLVE-007: an immich thumbnail served from cache never reaches the provider', async () => {
    const id = insertPhoto({ provider: 'immich', asset_id: 'a1', owner_id: 5 });
    cache.serveFresh.mockReturnValue(true);
    const res = makeRes();

    await svc.streamPhoto(res as never, 3, id, 'thumbnail');

    expect(immich.fetchImmichThumbnailBytes).not.toHaveBeenCalled();
    expect(immich.streamImmichAsset).not.toHaveBeenCalled();
  });

  it('RESOLVE-008: a synology original forwards the decrypted passphrase', async () => {
    const id = insertPhoto({ provider: 'synologyphotos', asset_id: 's1', owner_id: 9, passphrase: 'secret' });
    const res = makeRes();

    await svc.streamPhoto(res as never, 4, id, 'original');

    expect(synology.streamSynologyAsset).toHaveBeenCalledWith(res, 4, 9, 's1', 'original', undefined, 'secret');
  });

  it('RESOLVE-009: a synology row without a passphrase forwards undefined, not an empty string', async () => {
    const id = insertPhoto({ provider: 'synologyphotos', asset_id: 's2', owner_id: 9 });
    const res = makeRes();

    await svc.streamPhoto(res as never, 4, id, 'original');

    expect(synology.streamSynologyAsset).toHaveBeenCalledWith(res, 4, 9, 's2', 'original', undefined, undefined);
  });
});

describe('getPhotoInfo — dispatch', () => {
  it('RESOLVE-010: rejects an unknown photo id', async () => {
    const result = await svc.getPhotoInfo(1, 999999);
    expect(result.success).toBe(false);
  });

  it('RESOLVE-011: asks immich for an immich asset', async () => {
    const id = insertPhoto({ provider: 'immich', asset_id: 'a1', owner_id: 5 });
    immich.getAssetInfo.mockResolvedValue({ success: true, data: { id: 'a1' } });

    await svc.getPhotoInfo(3, id);

    expect(immich.getAssetInfo).toHaveBeenCalled();
    expect(synology.getSynologyAssetInfo).not.toHaveBeenCalled();
  });

  it('RESOLVE-012: asks synology for a synology asset', async () => {
    const id = insertPhoto({ provider: 'synologyphotos', asset_id: 's1', owner_id: 9 });
    synology.getSynologyAssetInfo.mockResolvedValue({ success: true, data: { id: 's1' } });

    await svc.getPhotoInfo(4, id);

    expect(synology.getSynologyAssetInfo).toHaveBeenCalled();
    expect(immich.getAssetInfo).not.toHaveBeenCalled();
  });

  it('RESOLVE-013: an unknown provider is an error, not a crash', async () => {
    const id = insertPhoto({ provider: 'picasa', asset_id: 'p1', owner_id: 2 });
    const result = await svc.getPhotoInfo(1, id);
    expect(result.success).toBe(false);
  });
});
