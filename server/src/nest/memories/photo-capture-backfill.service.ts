import { Injectable } from '@nestjs/common';
import { PhotoResolverService } from './photo-resolver.service';
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

        const info = await this.resolver.getPhotoInfo(id, userId);
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
}
