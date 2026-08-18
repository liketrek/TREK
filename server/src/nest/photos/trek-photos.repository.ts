import { Injectable } from '@nestjs/common';
import { encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { DatabaseService } from '../database/database.service';
import type { TrekPhoto } from '../../types';

/**
 * The `trek_photos` table: register a photo, look one up, retarget it, drop it
 * when nothing references it any more.
 *
 * Split out of photoResolverService, which was two things in one file — this
 * half touches no photo provider at all, while the other half (streamPhoto,
 * getPhotoInfo, streamCachedThumbnail) dispatches to immich/synology. Keeping
 * them together is what forced every consumer that just wanted to store a row —
 * the unified trip-photo service, the journey service — to drag both providers
 * in behind it.
 *
 * It also draws the photos/ vs memories/ line: storage lives here, provider
 * dispatch stays with memories.
 */
@Injectable()
export class TrekPhotosRepository {
  constructor(private readonly db: DatabaseService) {}

  getOrCreate(
    provider: string,
    assetId: string,
    ownerId: number,
    passphrase?: string,
    mediaType: string = 'image',
  ): number {
    const existing = this.db.get<{ id: number }>(
      'SELECT id FROM trek_photos WHERE provider = ? AND asset_id = ? AND owner_id = ?',
      provider, assetId, ownerId,
    );
    if (existing) {
      if (passphrase) {
        this.db.run('UPDATE trek_photos SET passphrase = ? WHERE id = ?', encrypt_api_key(passphrase), existing.id);
      }
      return existing.id;
    }

    const res = this.db.run(
      'INSERT INTO trek_photos (provider, asset_id, owner_id, passphrase, media_type) VALUES (?, ?, ?, ?, ?)',
      provider, assetId, ownerId, passphrase ? encrypt_api_key(passphrase) : null, mediaType,
    );
    return Number(res.lastInsertRowid);
  }

  getOrCreateLocal(
    filePath: string,
    thumbnailPath?: string | null,
    width?: number | null,
    height?: number | null,
    mediaType: string = 'image',
    durationMs?: number | null,
  ): number {
    const existing = this.db.get<{ id: number }>(
      "SELECT id FROM trek_photos WHERE provider = 'local' AND file_path = ?", filePath,
    );
    if (existing) return existing.id;

    const res = this.db.run(
      'INSERT INTO trek_photos (provider, file_path, thumbnail_path, width, height, media_type, duration_ms) VALUES (?, ?, ?, ?, ?, ?, ?)',
      'local', filePath, thumbnailPath || null, width || null, height || null, mediaType, durationMs ?? null,
    );
    return Number(res.lastInsertRowid);
  }

  resolve(photoId: number): TrekPhoto | null {
    return this.db.get<TrekPhoto>('SELECT * FROM trek_photos WHERE id = ?', photoId) || null;
  }

  /** Retarget an existing row — used when a local photo is uploaded to Immich. */
  setProvider(trekPhotoId: number, provider: string, assetId: string, ownerId: number): void {
    this.db.run(
      'UPDATE trek_photos SET provider = ?, asset_id = ?, owner_id = ? WHERE id = ?',
      provider, assetId, ownerId, trekPhotoId,
    );
  }

  /**
   * Stamp a generated local thumbnail onto the row. COALESCE keeps dimensions
   * that were already known — a re-generated thumbnail must not blank them.
   */
  recordLocalThumbnail(photoId: number, thumbnailPath: string, width: number, height: number): void {
    this.db.run(
      'UPDATE trek_photos SET thumbnail_path = ?, width = COALESCE(width, ?), height = COALESCE(height, ?) WHERE id = ?',
      thumbnailPath, width, height, photoId,
    );
  }

  /**
   * Where and when the picture was taken (#1614).
   *
   * COALESCE throughout, for the same reason recordLocalThumbnail does it: the
   * three sources disagree in how much they know. A provider search answers with
   * coordinates, the same provider's album listing does not, and a local file
   * only gives them up once its EXIF has been read. Whichever arrives first wins,
   * and a later, emptier answer must not blank what is already there.
   *
   * A photo with neither is the normal case, not a failure.
   */
  recordCaptureMetadata(
    photoId: number,
    meta: { takenAt?: string | null; lat?: number | null; lng?: number | null },
  ): void {
    const { takenAt = null, lat = null, lng = null } = meta;
    if (takenAt == null && lat == null && lng == null) return;
    // Coordinates are stored as a pair or not at all — a lone latitude is not a
    // place, and half a pair would put the photo on the null island.
    const hasPair = Number.isFinite(lat) && Number.isFinite(lng);
    this.db.run(
      `UPDATE trek_photos
          SET taken_at = COALESCE(taken_at, ?),
              lat      = COALESCE(lat, ?),
              lng      = COALESCE(lng, ?)
        WHERE id = ?`,
      takenAt, hasPair ? lat : null, hasPair ? lng : null, photoId,
    );
  }

  /**
   * Drop the row once no trip and no journey references it. Local photos are
   * kept: their bytes are ours, and the file would outlive the row.
   */
  deleteIfOrphan(photoId: number): void {
    const stillUsed = this.db.get(`
      SELECT 1 FROM trip_photos WHERE photo_id = ?
      UNION ALL
      SELECT 1 FROM journey_photos WHERE photo_id = ?
      LIMIT 1
    `, photoId, photoId);
    if (stillUsed) return;
    this.db.run("DELETE FROM trek_photos WHERE id = ? AND provider != 'local'", photoId);
  }
}
