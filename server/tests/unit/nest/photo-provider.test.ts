import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The PhotoProvider seam (#584).
 *
 * What is worth pinning here is not that a lookup works — it is the two things
 * the old `switch (photo.provider)` could not express. First, that a backend
 * arrives by registration rather than by editing three dispatch sites. Second,
 * that the adapters put the caller and the credential owner in the right slots:
 * Immich took `(userId, assetId, ownerId)` and Synology `(userId, targetUserId,
 * photoId)`, so a transposition would have compiled and served another user's
 * photo.
 */
import { PhotoProviderRegistry } from '../../../src/nest/memories/photo-provider.registry';
import { ImmichPhotoProvider } from '../../../src/nest/memories/providers/immich.provider';
import { SynologyPhotoProvider } from '../../../src/nest/memories/providers/synology.provider';
import type { ImmichService } from '../../../src/nest/memories/immich.service';
import type { SynologyService } from '../../../src/nest/memories/synology.service';
import type { PhotoAssetRef, PhotoProvider } from '../../../src/nest/memories/photo-provider';
import type { Response } from 'express';

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

const immichProvider = new ImmichPhotoProvider(immich as unknown as ImmichService);
const synologyProvider = new SynologyPhotoProvider(synology as unknown as SynologyService);

// Caller and credential owner deliberately differ: a shared album is reached
// with the OWNER's credentials on behalf of the viewer.
const ref: PhotoAssetRef = {
  userId: 7,
  ownerId: 42,
  assetId: 'asset-1',
  passphrase: 'share-pw',
  mediaType: 'image',
  range: 'bytes=0-99',
};

const res = {} as Response;

beforeEach(() => {
  vi.clearAllMocks();
  immich.streamImmichAsset.mockResolvedValue(undefined);
  synology.streamSynologyAsset.mockResolvedValue(undefined);
});

describe('PhotoProviderRegistry', () => {
  it('PROV-001: resolves a stored photo\'s provider column', () => {
    const registry = new PhotoProviderRegistry([immichProvider, synologyProvider]);
    expect(registry.get('immich')).toBe(immichProvider);
    expect(registry.get('synologyphotos')).toBe(synologyProvider);
    expect(registry.ids().sort()).toEqual(['immich', 'synologyphotos']);
  });

  it('PROV-002: answers undefined for local, null and an unknown id', () => {
    const registry = new PhotoProviderRegistry([immichProvider, synologyProvider]);
    // 'local' is storage, not a backend, and never gets a row in photo_providers.
    expect(registry.get('local')).toBeUndefined();
    expect(registry.get(null)).toBeUndefined();
    expect(registry.get(undefined)).toBeUndefined();
    expect(registry.get('photoprism')).toBeUndefined();
  });

  it('PROV-003: a new backend arrives by registration, with no dispatch site touched', () => {
    const photoprism: PhotoProvider = {
      id: 'photoprism',
      streamAsset: vi.fn(),
      fetchThumbnailBytes: vi.fn(),
      getAssetInfo: vi.fn(),
    };
    const registry = new PhotoProviderRegistry([immichProvider, synologyProvider, photoprism]);
    expect(registry.get('photoprism')).toBe(photoprism);
  });
});

describe('ImmichPhotoProvider', () => {
  it('PROV-004: maps the ref onto the service\'s (userId, assetId, ownerId) order', async () => {
    await immichProvider.streamAsset(res, ref, 'original');
    expect(immich.streamImmichAsset).toHaveBeenCalledWith(res, 7, 'asset-1', 'original', 42, {
      mediaType: 'image',
      range: 'bytes=0-99',
    });

    await immichProvider.fetchThumbnailBytes(ref);
    expect(immich.fetchImmichThumbnailBytes).toHaveBeenCalledWith(7, 'asset-1', 42);
  });

  it('PROV-007: turns the service\'s {data,error} into a ServiceResult', async () => {
    immich.getAssetInfo.mockResolvedValue({ data: { id: 'a' } });
    expect(await immichProvider.getAssetInfo(ref)).toEqual({ success: true, data: { id: 'a' } });

    immich.getAssetInfo.mockResolvedValue({ error: 'gone', status: 404 });
    expect(await immichProvider.getAssetInfo(ref)).toEqual({
      success: false,
      error: { message: 'gone', status: 404 },
    });

    // No status from the service is a server error, not a silent success.
    immich.getAssetInfo.mockResolvedValue({ error: 'gone' });
    expect(await immichProvider.getAssetInfo(ref)).toEqual({
      success: false,
      error: { message: 'gone', status: 500 },
    });
  });
});

describe('SynologyPhotoProvider', () => {
  it('PROV-008: maps the ref onto the service\'s (userId, ownerId, assetId) order', async () => {
    await synologyProvider.streamAsset(res, ref, 'thumbnail');
    // size stays undefined, as every caller left it.
    expect(synology.streamSynologyAsset).toHaveBeenCalledWith(res, 7, 42, 'asset-1', 'thumbnail', undefined, 'share-pw');

    await synologyProvider.fetchThumbnailBytes(ref);
    expect(synology.fetchSynologyThumbnailBytes).toHaveBeenCalledWith(7, 42, 'asset-1', 'share-pw');
  });

  it('PROV-009: passes the share passphrase to getAssetInfo, in its own argument order', async () => {
    synology.getSynologyAssetInfo.mockResolvedValue({ data: { id: 'a' } });
    await synologyProvider.getAssetInfo(ref);
    expect(synology.getSynologyAssetInfo).toHaveBeenCalledWith(7, 'asset-1', 42, 'share-pw');
  });

  it('PROV-010: forwards an absent passphrase as undefined rather than an empty string', async () => {
    await synologyProvider.streamAsset(res, { userId: 1, ownerId: 1, assetId: 'x' }, 'original');
    expect(synology.streamSynologyAsset).toHaveBeenCalledWith(res, 1, 1, 'x', 'original', undefined, undefined);
  });
});
