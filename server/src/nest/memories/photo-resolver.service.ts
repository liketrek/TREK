import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import path from 'path';
import fs from 'fs';
import type { TrekPhoto } from '../../types';
import { decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { TrekPhotosRepository } from '../photos/trek-photos.repository';
import { UPLOADS_ROOT } from './uploads-root';
import { ImmichService } from './immich.service';
import { SynologyService } from './synology.service';
import { ThumbnailService } from './thumbnail.service';
import { TrekPhotoCacheService } from './trek-photo-cache.service';
import { fail, success, type AssetInfo, type ServiceResult } from './memories.helpers';

/**
 * Resolves a stored trek_photo to bytes or metadata by asking whichever provider
 * owns it. The storage half of the old photoResolverService lives in
 * nest/photos/trek-photos.repository.ts; this is the dispatch half.
 */
@Injectable()
export class PhotoResolverService {
  constructor(
    private readonly photos: TrekPhotosRepository,
    private readonly immich: ImmichService,
    private readonly synology: SynologyService,
    private readonly thumbnails: ThumbnailService,
    private readonly cache: TrekPhotoCacheService,
  ) {}

  // ── Streaming ────────────────────────────────────────────────────────────

  private async streamCachedThumbnail(
    res: Response,
    photo: TrekPhoto,
    fetchBytes: () => Promise<{ bytes: Buffer; contentType: string } | { error: string; status: number }>,
    fallback: () => Promise<unknown>,
  ): Promise<void> {
    const key = this.cache.cacheKey(photo.provider!, photo.asset_id!, 'thumbnail', photo.owner_id!);

    if (this.cache.serveFresh(res, key)) return;

    const existing = this.cache.getInFlight(key);
    if (existing) {
      const bytes = await existing;
      if (bytes && this.cache.serveFresh(res, key)) return;
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
    if (bytes && this.cache.serveFresh(res, key)) return;
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
      const uploadsRoot = UPLOADS_ROOT;

      if (kind === 'thumbnail') {
        const isVideo = photo.media_type === 'video';
        let thumbRel = photo.thumbnail_path ?? null;
        // Only raster images get a lazily-generated Jimp thumbnail; Jimp can't decode
        // video, so a video relies on the poster captured at upload (#823).
        if (!thumbRel && !isVideo) {
          const result = await this.thumbnails.ensureLocalThumbnail(uploadsRoot, photo.file_path);
          if (result) {
            thumbRel = result.thumbnailRelPath;
            this.photos.recordLocalThumbnail(photo.id, thumbRel, result.width, result.height);
          }
        }
        if (thumbRel) {
          const thumbAbs = path.join(uploadsRoot, thumbRel);
          if (fs.existsSync(thumbAbs)) {
            res.set('Cache-Control', 'public, max-age=86400, immutable');
            res.set('X-Content-Type-Options', 'nosniff');
            res.sendFile(thumbAbs);
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

      const localPath = path.join(uploadsRoot, photo.file_path);
      if (fs.existsSync(localPath)) {
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('X-Content-Type-Options', 'nosniff');
        res.sendFile(localPath);
        return;
      }
    }

    switch (photo.provider) {
      case 'local': {
        res.status(404).json({ error: 'File not found' });
        return;
      }
      case 'immich': {
        if (kind === 'thumbnail') {
          await this.streamCachedThumbnail(
            res, photo,
            () => this.immich.fetchImmichThumbnailBytes(userId, photo.asset_id!, photo.owner_id!),
            () => this.immich.streamImmichAsset(res, userId, photo.asset_id!, kind, photo.owner_id!, { mediaType: photo.media_type }),
          );
          return;
        }
        await this.immich.streamImmichAsset(res, userId, photo.asset_id!, kind, photo.owner_id!, { mediaType: photo.media_type, range });
        return;
      }
      case 'synologyphotos': {
        const passphrase = photo.passphrase ? (decrypt_api_key(photo.passphrase) || undefined) : undefined;
        if (kind === 'thumbnail') {
          await this.streamCachedThumbnail(
            res, photo,
            () => this.synology.fetchSynologyThumbnailBytes(userId, photo.owner_id!, photo.asset_id!, passphrase),
            () => this.synology.streamSynologyAsset(res, userId, photo.owner_id!, photo.asset_id!, kind, undefined, passphrase),
          );
          return;
        }
        await this.synology.streamSynologyAsset(res, userId, photo.owner_id!, photo.asset_id!, kind, undefined, passphrase);
        return;
      }
      default:
        res.status(400).json({ error: `Unknown provider: ${photo.provider}` });
    }
  }

  // ── Asset Info ────────────────────────────────────────────────────────────

  async getPhotoInfo(
    userId: number,
    photoId: number,
  ): Promise<ServiceResult<AssetInfo>> {
    const photo = this.photos.resolve(photoId);
    if (!photo) return fail('Photo not found', 404);

    switch (photo.provider) {
      case 'local': {
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
      case 'immich': {
        const result = await this.immich.getAssetInfo(userId, photo.asset_id!, photo.owner_id!);
        if (result.error) return fail(result.error, result.status || 500);
        return success(result.data as AssetInfo);
      }
      case 'synologyphotos': {
        const passphrase = photo.passphrase ? (decrypt_api_key(photo.passphrase) || undefined) : undefined;
        return this.synology.getSynologyAssetInfo(userId, photo.asset_id!, photo.owner_id!, passphrase);
      }
      default:
        return fail(`Unknown provider: ${photo.provider}`, 400);
    }
  }
}
