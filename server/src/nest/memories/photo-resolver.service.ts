import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import type { TrekPhoto } from '../../types';
import { decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { TrekPhotosRepository } from '../photos/trek-photos.repository';
import { ThumbnailService } from './thumbnail.service';
import { TrekPhotoCacheService } from './trek-photo-cache.service';
import { fail, success, type AssetInfo, type ServiceResult } from './memories.helpers';
import { PhotoProviderRegistry } from './photo-provider.registry';
import type { PhotoAssetRef } from './photo-provider';
import { StorageService } from '../storage/storage.service';

/**
 * Resolves a stored trek_photo to bytes or metadata by asking whichever provider
 * owns it. The storage half of the old photoResolverService lives in
 * nest/photos/trek-photos.repository.ts; this is the dispatch half.
 *
 * It no longer knows WHICH providers exist (#584). It held ImmichService and
 * SynologyService and a `switch` over their ids; it holds the registry now, so
 * a third backend is a registration in memories.module.ts rather than a case
 * added in two places here and a third in journey-public.controller.ts.
 */
@Injectable()
export class PhotoResolverService {
  constructor(
    private readonly photos: TrekPhotosRepository,
    private readonly thumbnails: ThumbnailService,
    private readonly cache: TrekPhotoCacheService,
    private readonly providers: PhotoProviderRegistry,
    private readonly storage: StorageService,
  ) {}

  /** photos.file_path / thumbnail_path are uploads-relative 'journey/…' by
   * every writer; anything else reads as a local miss, matching the old
   * existsSync(join(uploadsRoot, file_path)) === false path. */
  private storageName(relPath: string): string | null {
    return relPath.startsWith('journey/') ? relPath.slice('journey/'.length) : null;
  }

  // ── Streaming ────────────────────────────────────────────────────────────

  private async streamCachedThumbnail(
    res: Response,
    photo: TrekPhoto,
    fetchBytes: () => Promise<{ bytes: Buffer; contentType: string } | { error: string; status: number }>,
    fallback: () => Promise<unknown>,
  ): Promise<void> {
    const key = this.cache.cacheKey(photo.provider!, photo.asset_id!, 'thumbnail', photo.owner_id!);

    if (await this.cache.serveFresh(res, key)) return;

    const existing = this.cache.getInFlight(key);
    if (existing !== undefined) {
      const bytes = await existing;
      if (bytes && (await this.cache.serveFresh(res, key))) return;
      await fallback();
      return;
    }

    const promise = fetchBytes().then(async result => {
      if ('error' in result) return null;
      await this.cache.put(key, result.bytes, result.contentType);
      return result.bytes;
    });
    this.cache.setInFlight(key, promise);

    const bytes = await promise;
    if (bytes && (await this.cache.serveFresh(res, key))) return;
    await fallback();
  }

  async streamPhoto(
    res: Response,
    userId: number,
    photoId: number,
    kind: 'thumbnail' | 'original',
    range?: string,
  ): Promise<void> {
    const photo = this.photos.resolve(photoId);
    if (!photo) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    if (photo.file_path) {
      if (kind === 'thumbnail') {
        const isVideo = photo.media_type === 'video';
        let thumbRel = photo.thumbnail_path ?? null;
        // Only raster images get a lazily-generated Jimp thumbnail; Jimp can't decode
        // video, so a video relies on the poster captured at upload (#823).
        if (!thumbRel && !isVideo) {
          const result = await this.thumbnails.ensureLocalThumbnail(photo.file_path);
          if (result) {
            thumbRel = result.thumbnailRelPath;
            this.photos.recordLocalThumbnail(photo.id, thumbRel, result.width, result.height);
          }
        }
        if (thumbRel) {
          const thumbName = this.storageName(thumbRel);
          if (thumbName && (await this.storage.exists('journey', thumbName).catch(() => false))) {
            res.set('Cache-Control', 'public, max-age=86400, immutable');
            res.set('X-Content-Type-Options', 'nosniff');
            await this.storage.sendToResponse('journey', thumbName, res);
            return;
          }
        }
        // A poster-less video must NOT fall through to streaming the whole file as a
        // "thumbnail"; let the client render its own placeholder instead.
        if (isVideo) {
          res.status(404).json({ error: 'No poster available' });
          return;
        }
        // Images fall through to original if the thumbnail is unavailable.
      }

      const name = this.storageName(photo.file_path);
      if (name && (await this.storage.exists('journey', name).catch(() => false))) {
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('X-Content-Type-Options', 'nosniff');
        await this.storage.sendToResponse('journey', name, res);
        return;
      }
    }

    // 'local' is not a provider: the bytes are on this disk, the block above
    // already tried to send them, and there is no backend left to ask.
    if (photo.provider === 'local') {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const provider = this.providers.get(photo.provider);
    if (!provider) {
      res.status(400).json({ error: `Unknown provider: ${photo.provider}` });
      return;
    }

    const ref = this.refFor(photo, userId);
    if (kind === 'thumbnail') {
      await this.streamCachedThumbnail(
        res, photo,
        () => provider.fetchThumbnailBytes(ref),
        // The fallback streams the thumbnail itself, so it carries no Range.
        () => provider.streamAsset(res, ref, kind),
      );
      return;
    }
    await provider.streamAsset(res, { ...ref, range }, kind);
  }

  /**
   * The stored row as a provider-shaped request. One place decrypts the
   * Synology share passphrase, and one place decides which of the two user ids
   * means "whose credentials".
   */
  private refFor(photo: TrekPhoto, userId: number): PhotoAssetRef {
    return {
      userId,
      ownerId: photo.owner_id!,
      assetId: photo.asset_id!,
      passphrase: photo.passphrase ? (decrypt_api_key(photo.passphrase) || undefined) : undefined,
      mediaType: photo.media_type,
    };
  }

  // ── Asset Info ────────────────────────────────────────────────────────────

  async getPhotoInfo(
    userId: number,
    photoId: number,
  ): Promise<ServiceResult<AssetInfo>> {
    const photo = this.photos.resolve(photoId);
    if (!photo) return fail('Photo not found', 404);

    // Local rows answer from the row itself — nothing to ask.
    if (photo.provider === 'local') {
      return success({
        id: String(photo.id),
        takenAt: photo.created_at,
        city: null,
        country: null,
        width: photo.width,
        height: photo.height,
        fileName: photo.file_path?.split('/').pop() || null,
      } as AssetInfo);
    }

    const provider = this.providers.get(photo.provider);
    if (!provider) return fail(`Unknown provider: ${photo.provider}`, 400);
    return provider.getAssetInfo(this.refFor(photo, userId));
  }
}
