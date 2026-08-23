import { Injectable } from '@nestjs/common';
import exifr from 'exifr';
import { PhotoResolverService } from './photo-resolver.service';
import { StorageService } from '../storage/storage.service';
import { TrekPhotosRepository } from '../photos/trek-photos.repository';

/**
 * Ask the provider when and where a photo was taken, and record it (#1614).
 *
 * The picker already sees these values, but the add call carries only the asset
 * id — widening that contract would have meant trusting the client for something
 * the provider can be asked for directly, and would have left the MCP path, the
 * album sync and every already-imported photo without them.
 *
 * Runs detached and never throws: a provider that is slow, unreachable or simply
 * does not know must not fail the add the user is waiting on. A photo without
 * capture metadata is the normal case, not an error — it just will not appear on
 * the map.
 */
@Injectable()
export class PhotoCaptureBackfillService {
  constructor(
    private readonly resolver: PhotoResolverService,
    private readonly photos: TrekPhotosRepository,
    private readonly storage: StorageService,
  ) {}

  /** Fire-and-forget for a batch that was just added. */
  schedule(trekPhotoIds: number[], userId: number): void {
    if (!trekPhotoIds.length) return;
    void this.run(trekPhotoIds, userId);
  }

  /** Awaitable form, so tests do not have to chase a floating promise. */
  async run(trekPhotoIds: number[], userId: number): Promise<void> {
    for (const id of trekPhotoIds) {
      try {
        const photo = this.photos.resolve(id);
        // A row that already knows both has nothing to gain, and a provider call
        // per photo is the expensive part of an album import.
        if (!photo || (photo.taken_at && photo.lat != null && photo.lng != null)) continue;

        // A local file has no provider to ask — the answer is in its own EXIF, and
        // getPhotoInfo would only hand back what the DB row already says.
        if (photo.provider === 'local') {
          const meta = await this.readLocalExif(photo.file_path);
          if (meta) this.photos.recordCaptureMetadata(id, meta);
          continue;
        }

        const info = await this.resolver.getPhotoInfo(userId, id);
        if (!info.success) continue;

        this.photos.recordCaptureMetadata(id, {
          takenAt: info.data.takenAt ?? null,
          lat: info.data.lat ?? null,
          lng: info.data.lng ?? null,
        });
      } catch (err) {
        console.error(`[Photos] capture backfill failed for ${id}:`, err instanceof Error ? err.message : err);
      }
    }
  }

  /**
   * EXIF of an uploaded file.
   *
   * Note for anyone chasing "my phone photo has no location": the client converts
   * HEIC before upload and that conversion drops GPS, so an iPhone photo arrives
   * here already stripped. Nothing to read is the expected outcome far more often
   * than not — hence no logging on the empty case.
   */
  private async readLocalExif(
    filePath?: string | null,
  ): Promise<{ takenAt: string | null; lat: number | null; lng: number | null } | null> {
    if (!filePath) return null;
    // photos.file_path is uploads-relative 'journey/<name>' by every writer;
    // anything else reads as a miss (same rule as photo-resolver). Central key
    // validation (storage-keys.ts) rejects a name that still carries a path,
    // so a stored path can never climb out of the journey category.
    if (!filePath.startsWith('journey/')) return null;
    const name = filePath.slice('journey/'.length);

    type Exif = { DateTimeOriginal?: Date; CreateDate?: Date; latitude?: number; longitude?: number };
    let parsed: Exif | null;
    try {
      parsed = await this.storage.withLocalFile('journey', name, async abs =>
        (await exifr.parse(abs, {
          pick: ['DateTimeOriginal', 'CreateDate', 'latitude', 'longitude'],
        })) as Exif | null,
      );
    } catch {
      // A vanished object, an invalid key, not an image, a truncated upload,
      // a video — none of it is an error here.
      return null;
    }
    if (!parsed) return null;

    const taken = parsed.DateTimeOriginal ?? parsed.CreateDate ?? null;
    const takenAt = taken instanceof Date && !Number.isNaN(taken.getTime()) ? taken.toISOString() : null;
    const lat = typeof parsed.latitude === 'number' ? parsed.latitude : null;
    const lng = typeof parsed.longitude === 'number' ? parsed.longitude : null;
    return takenAt || lat != null ? { takenAt, lat, lng } : null;
  }
}
