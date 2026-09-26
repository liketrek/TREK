import { Injectable } from '@nestjs/common';
import { PhotoCaptureBackfillService } from '../memories/photo-capture-backfill.service';
import { JourneyDomainService } from './journey-domain.service';

/** The trek_photos ids of freshly added journey photo rows, whatever shape the add answered with. */
function trekPhotoIdsOf(photos: readonly unknown[]): number[] {
  return photos
    .map(p => (p as { photo_id?: unknown } | null)?.photo_id)
    .filter((id): id is number => typeof id === 'number');
}

/**
 * Capture times for photos that just landed on a journey, and the refresh that
 * has to follow them (#1587).
 *
 * The add answers before anyone has asked the provider when each photo was
 * taken (#1614 keeps that on the server rather than trusting the client). So
 * the reload a client does straight after the add still sees the new photos
 * without taken_at, and the gallery files them at the end by import time. Once
 * the backfill has written something, everyone on the journey is told, the
 * importer included: its own reload came too early, which is why the event
 * excludes no socket.
 *
 * One place for the REST routes, the MCP tool and the plugin RPC, so no surface
 * can add provider photos that stay out of order until somebody reloads.
 *
 * Uploads from a device fill their capture times here too, but tell nobody (see
 * scheduleUpload): one upload request carries one file, so a refresh per request
 * would reload every open client once per photo of a bulk upload.
 */
@Injectable()
export class JourneyPhotoCaptureService {
  constructor(
    private readonly backfill: PhotoCaptureBackfillService,
    private readonly journey: JourneyDomainService,
  ) {}

  /** Provider photos just added to a journey, to its gallery or to one of its entries. Detached. */
  scheduleForJourney(journeyId: number, photos: readonly unknown[], userId: number): void {
    const ids = trekPhotoIdsOf(photos);
    if (!ids.length) return;
    void this.fill(journeyId, ids, userId);
  }

  /** Provider photos just added to an entry, for a caller that only knows the entry. Detached. */
  scheduleForEntry(entryId: number, photos: readonly unknown[], userId: number): void {
    const ids = trekPhotoIdsOf(photos);
    if (!ids.length) return;
    void this.fill(this.journey.journeyIdOfEntry(entryId), ids, userId);
  }

  /**
   * Photos uploaded from a device: read their capture times, and nothing more.
   * Detached.
   *
   * No refresh on purpose. The client sends one file per upload request and
   * reloads the journey itself once the last one is in, so an event per request
   * would only make every other open client reload once per uploaded photo. The
   * refresh belongs to the provider adds, where one request carries the batch.
   */
  scheduleUpload(photos: readonly unknown[], userId: number): void {
    const ids = trekPhotoIdsOf(photos);
    if (!ids.length) return;
    this.backfill.schedule(ids, userId);
  }

  /**
   * Awaitable form, so tests do not have to chase a floating promise. Answers
   * whether the batch changed anything. Never rejects: it runs detached, and a
   * refresh that could not be sent is a gallery that sorts right on the next
   * reload, not a failed add.
   */
  async fill(journeyId: number | null, trekPhotoIds: number[], userId: number): Promise<boolean> {
    let changed = false;
    try {
      changed = await this.backfill.run(trekPhotoIds, userId);
      if (changed && journeyId != null) {
        this.journey.broadcastJourneyEvent(journeyId, 'journey:photos:updated', {});
      }
    } catch (err) {
      console.error(`[Journey] capture refresh failed for journey ${journeyId}:`, err instanceof Error ? err.message : err);
    }
    return changed;
  }
}
