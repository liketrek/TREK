import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { withRequestContext } from '../database/request-context';
import { PhotoCaptureBackfillService } from '../memories/photo-capture-backfill.service';
import { MapsService } from '../maps/maps.service';
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
 *
 * Every schedule* method runs its work after the add has answered, so each one
 * forks its own request context with `withRequestContext` instead of riding the
 * `EntityManager` fork of a request that is already over — the same shape the
 * import-job runner (`ImportJobsService#start`) and the webhook nudge timer
 * (`DocSyncWebhookController#schedule`) use for their detached chains.
 */
@Injectable()
export class JourneyPhotoCaptureService {
  constructor(
    private readonly backfill: PhotoCaptureBackfillService,
    private readonly journey: JourneyDomainService,
    private readonly maps: MapsService,
    private readonly orm: MikroORM,
  ) {}

  /** Provider photos just added to a journey, to its gallery or to one of its entries. Detached. */
  scheduleForJourney(journeyId: number, photos: readonly unknown[], userId: number): void {
    const ids = trekPhotoIdsOf(photos);
    if (!ids.length) return;
    void withRequestContext(this.orm, () => this.fill(journeyId, ids, userId));
  }

  /** Provider photos just added to an entry, for a caller that only knows the entry. Detached. */
  scheduleForEntry(entryId: number, photos: readonly unknown[], userId: number): void {
    const ids = trekPhotoIdsOf(photos);
    if (!ids.length) return;
    void withRequestContext(this.orm, () => this.fillForEntry(entryId, ids, userId));
  }

  /** scheduleForEntry's detached half: find the entry's journey, then fill. Never rejects. */
  private async fillForEntry(entryId: number, trekPhotoIds: number[], userId: number): Promise<void> {
    let journeyId: number | null;
    try {
      journeyId = await this.journey.journeyIdOfEntry(entryId);
    } catch (err) {
      console.error(`[Journey] capture refresh failed for entry ${entryId}:`, err instanceof Error ? err.message : err);
      return;
    }
    await this.fill(journeyId, trekPhotoIds, userId);
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
    // The placing is chained inside the fork, not after it, so it runs in the
    // same context as the backfill rather than in whatever the caller had.
    void withRequestContext(this.orm, () => this.backfill.run(ids, userId).then(() => this.placeEntries(ids)))
      .catch(err => console.error('[Journey] capture for uploads failed:', err instanceof Error ? err.message : err));
  }

  /**
   * Entries waiting for a place get the one their photo was taken at (#1003),
   * then a name for it, then everyone on the journey hears about it. The name is
   * best effort: a geocoder that does not answer leaves a pin without a label,
   * which the owner can still name by hand.
   */
  async placeEntries(trekPhotoIds: number[]): Promise<number> {
    let placed: Awaited<ReturnType<JourneyDomainService['placeEntriesFromPhotos']>>;
    try {
      placed = await this.journey.placeEntriesFromPhotos(trekPhotoIds);
    } catch (err) {
      // An extra on top of the capture times: it must never cost the refresh below it.
      console.error('[Journey] placing entries from photos failed:', err instanceof Error ? err.message : err);
      return 0;
    }
    if (!placed.length) return 0;
    await Promise.all(placed.map(async (p) => {
      try {
        const where = await this.maps.reverseGeocode(String(p.lat), String(p.lng), undefined, { timeoutMs: 8000, locality: true });
        const name = where.name || where.address;
        if (name) await this.journey.nameEntryLocation(p.entryId, name);
      } catch { /* the pin stands without a name */ }
    }));
    for (const journeyId of new Set(placed.map(p => p.journeyId))) {
      await this.journey.broadcastJourneyEvent(journeyId, 'journey:photos:updated', {});
    }
    return placed.length;
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
      // Its own broadcast when it places something; the one below is about order.
      await this.placeEntries(trekPhotoIds);
      if (changed && journeyId != null) {
        await this.journey.broadcastJourneyEvent(journeyId, 'journey:photos:updated', {});
      }
    } catch (err) {
      console.error(`[Journey] capture refresh failed for journey ${journeyId}:`, err instanceof Error ? err.message : err);
    }
    return changed;
  }
}
