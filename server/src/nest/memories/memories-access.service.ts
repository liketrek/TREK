import { JourneyContributors } from '../../db/entities/JourneyContributors.entity';
import { JourneyPhotos } from '../../db/entities/JourneyPhotos.entity';
import { Journeys } from '../../db/entities/Journeys.entity';
import { TrekPhotos } from '../../db/entities/TrekPhotos.entity';
import { TripAlbumLinks } from '../../db/entities/TripAlbumLinks.entity';
import { TripPhotos } from '../../db/entities/TripPhotos.entity';
import { Trips } from '../../db/entities/Trips.entity';
import type { JourneyContributorsRepository } from '../../db/repositories/JourneyContributors.repository';
import type { JourneyPhotosRepository } from '../../db/repositories/JourneyPhotos.repository';
import type { JourneysRepository } from '../../db/repositories/Journeys.repository';
import type { TrekPhotosRepository } from '../../db/repositories/TrekPhotos.repository';
import type { TripAlbumLinksRepository } from '../../db/repositories/TripAlbumLinks.repository';
import type { TripPhotosRepository } from '../../db/repositories/TripPhotos.repository';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { toRowId } from '../common/row-id';
import { fail, success, type ServiceResult } from './memories.helpers';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * Who may see which photo, and the album-link lookups the provider syncs need.
 *
 * Split from the pure helpers because these are the only DB-backed ones. Both
 * access checks answer for photos that live under a trip *or* a journey — a
 * provider asset is reachable through either, which is why neither check can
 * live in the trips or journey domain alone.
 *
 * Stays a service, not a single-table repository (Plan 3e): it composes
 * access logic across `trip_photos`/`trek_photos`/`trip_album_links`
 * (this plan's own tables) and `journeys`/`journey_contributors`/
 * `journey_photos` (Plan 3g's — MA1/MA2/MA6, converted by Plan 3g Task 4
 * onto `JourneysRepository`/`JourneyContributorsRepository`/
 * `JourneyPhotosRepository`, NOT routed through `JourneyDomainService
 * .canAccessJourney` — this service re-implements the same owner-or
 * -contributor logic inline for its own reasons, composing it with the
 * trip-photo check in one method; a service-to-service dependency here
 * would be a bigger structural change than a survivor cleanup is scoped
 * for). Plan 4 Task 2 — the `canAccessTrip` primitive is now
 * `TripsRepository.findAccessible`, reusing the `trips` repository already
 * injected below; `DatabaseService` is gone from this file entirely.
 */
@Injectable()
export class MemoriesAccessService {
  constructor(
    @InjectRepository(TripPhotos) private readonly tripPhotos: TripPhotosRepository,
    @InjectRepository(TrekPhotos) private readonly trekPhotos: TrekPhotosRepository,
    @InjectRepository(TripAlbumLinks) private readonly tripAlbumLinks: TripAlbumLinksRepository,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    // Plan 3g Task 4 (MA1/MA2/MA6) — the journey half of the cross-domain
    // photo-access checks below.
    @InjectRepository(Journeys) private readonly journeys: JourneysRepository,
    @InjectRepository(JourneyContributors) private readonly journeyContributors: JourneyContributorsRepository,
    @InjectRepository(JourneyPhotos) private readonly journeyPhotos: JourneyPhotosRepository,
  ) {}

  /** MA2's owner-OR-contributor check, shared by MA2 and MA6's per-journey loop — the same two-branch `journeys`/`journey_contributors` logic `canAccessJourney` uses, re-implemented here (see the class docstring on why it isn't a call to `JourneyDomainService`). */
  private async ownerOrContributor(journeyId: number, userId: number): Promise<boolean> {
    if (await this.journeys.isOwnedByUser(journeyId, userId)) return true;
    return await this.journeyContributors.existsForUser(journeyId, userId);
  }

  async canAccessUserPhoto(
    requestingUserId: number,
    ownerUserId: number,
    tripId: string,
    assetId: string,
    provider: string,
  ): Promise<boolean> {
    if (requestingUserId === ownerUserId) {
      return true;
    }

    // Journey photos use tripId=0 — check journey_photos + journey_contributors
    if (tripId === '0') {
      // MA1 — converted (Plan 3g Task 4).
      const journeyId = await this.journeyPhotos.findJourneyIdForAsset(assetId, provider, ownerUserId);
      if (journeyId === undefined) return false;

      // MA2 — converted (Plan 3g Task 4).
      return await this.ownerOrContributor(journeyId, requestingUserId);
    }

    // Regular trip photos — join through trek_photos (MA3).
    const tripIdNum = toRowId(tripId);
    const sharedAsset =
      tripIdNum != null ? await this.tripPhotos.existsSharedForUser(tripIdNum, ownerUserId, assetId, provider) : false;

    if (!sharedAsset) {
      return false;
    }
    return !!(await this.trips.findAccessible(tripId, requestingUserId));
  }

  // ── Unified photo access check (trek_photos based) ──────────────────────

  async canAccessTrekPhoto(requestingUserId: number, trekPhotoId: number): Promise<boolean> {
    const photo = await this.trekPhotos.findById(trekPhotoId);
    if (!photo) return false;

    // Owner always has access
    if (photo.owner_id === requestingUserId) return true;

    // Check trip_photos — is this photo shared in a trip the user has access to?
    // MA5: the legacy `EXISTS(...trip_members/trips UNION ALL...)` predicate
    // is exactly `TripsRepository.findAccessible`'s own — reuse that builder
    // (R4) instead of hand-translating it into a second, independent form.
    const sharedTripIds = await this.tripPhotos.listTripIdsSharedForPhoto(trekPhotoId);
    for (const tripId of sharedTripIds) {
      if (await this.trips.findAccessible(tripId, requestingUserId)) return true;
    }

    // Check journey_photos — is this photo in a journey the user can access?
    // MA6 — converted (Plan 3g Task 4). Every journey this photo is linked
    // into (a photo can be in more than one journey's gallery), probed the
    // same loop-and-check shape as the trip-photo half above (MA5).
    let journeyAccess = false;
    for (const journeyId of await this.journeyPhotos.listJourneyIdsForPhoto(trekPhotoId)) {
      if (await this.ownerOrContributor(journeyId, requestingUserId)) {
        journeyAccess = true;
        break;
      }
    }
    if (journeyAccess) return true;

    // Local photos without owner (uploaded files) — check if user has journey access
    if (photo.provider === 'local' && !photo.owner_id) {
      return journeyAccess;
    }

    return false;
  }

  // ── Album link syncing ──────────────────────────────────────────────────

  async getAlbumIdFromLink(tripId: string, linkId: string, userId: number): Promise<ServiceResult<string>> {
    const access = await this.trips.findAccessible(tripId, userId);
    if (!access) return fail('Trip not found or access denied', 404);

    try {
      // MA7: `toRowId` on `tripId`/`linkId` — both already validated as a
      // reachable trip by `canAccessTrip` above; a non-canonical spelling of
      // either (rule 15's accepted narrowing) answers the same "not found"
      // the legacy raw-bind affinity would have for a row it couldn't match.
      const id = toRowId(linkId);
      const tripIdNum = toRowId(tripId);
      const row = id != null && tripIdNum != null ? await this.tripAlbumLinks.findScoped(id, tripIdNum, userId) : null;

      return row ? success(row.album_id) : fail('Album link not found', 404);
    } catch {
      return fail('Failed to retrieve album link', 500);
    }
  }

  async getAlbumLinkForSync(
    tripId: string,
    linkId: string,
    userId: number,
  ): Promise<ServiceResult<{ albumId: string; passphrase?: string }>> {
    const access = await this.trips.findAccessible(tripId, userId);
    if (!access) return fail('Trip not found or access denied', 404);

    try {
      // MA8 — same `toRowId` treatment as MA7 above.
      const id = toRowId(linkId);
      const tripIdNum = toRowId(tripId);
      const row = id != null && tripIdNum != null ? await this.tripAlbumLinks.findScoped(id, tripIdNum, userId) : null;

      if (!row) return fail('Album link not found', 404);

      const decrypted = row.passphrase ? (decrypt_api_key(row.passphrase) ?? undefined) : undefined;
      return success({ albumId: row.album_id, passphrase: decrypted || undefined });
    } catch {
      return fail('Failed to retrieve album link', 500);
    }
  }

  async updateSyncTimeForAlbumLink(linkId: string): Promise<void> {
    // MA9: unscoped by trip/user, matching the legacy statement — the caller
    // has already resolved `linkId` through `getAlbumIdFromLink`/
    // `getAlbumLinkForSync` (MA7/MA8) earlier in the same request. A
    // non-canonical id (rule 15) is a no-op here, same as a legacy UPDATE
    // that matched zero rows.
    const id = toRowId(linkId);
    if (id == null) return;
    await this.tripAlbumLinks.touchSyncTime(id);
  }
}
