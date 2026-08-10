import { Injectable } from '@nestjs/common';
import { decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { DatabaseService } from '../database/database.service';
import { fail, success, type ServiceResult } from './memories.helpers';

/**
 * Who may see which photo, and the album-link lookups the provider syncs need.
 *
 * Split from the pure helpers because these are the only DB-backed ones. Both
 * access checks answer for photos that live under a trip *or* a journey — a
 * provider asset is reachable through either, which is why neither check can
 * live in the trips or journey domain alone.
 */
@Injectable()
export class MemoriesAccessService {
  constructor(private readonly db: DatabaseService) {}

  canAccessUserPhoto(requestingUserId: number, ownerUserId: number, tripId: string, assetId: string, provider: string): boolean {
    if (requestingUserId === ownerUserId) {
      return true;
    }

    // Journey photos use tripId=0 — check journey_photos + journey_contributors
    if (tripId === '0') {
      const journeyPhoto = this.db.get<{ journey_id: number }>(`
            SELECT gp.journey_id
            FROM journey_photos gp
            JOIN trek_photos tkp ON tkp.id = gp.photo_id
            WHERE tkp.asset_id = ?
              AND tkp.provider = ?
              AND tkp.owner_id = ?
            LIMIT 1
        `, assetId, provider, ownerUserId);
      if (!journeyPhoto) return false;

      const access = this.db.get(`
            SELECT 1 FROM journeys WHERE id = ? AND user_id = ?
            UNION ALL
            SELECT 1 FROM journey_contributors WHERE journey_id = ? AND user_id = ?
            LIMIT 1
        `, journeyPhoto.journey_id, requestingUserId, journeyPhoto.journey_id, requestingUserId);
      return !!access;
    }

    // Regular trip photos — join through trek_photos
    const sharedAsset = this.db.get(`
    SELECT 1
    FROM trip_photos tp
    JOIN trek_photos tkp ON tkp.id = tp.photo_id
    WHERE tp.user_id = ?
      AND tkp.asset_id = ?
      AND tkp.provider = ?
      AND tp.trip_id = ?
      AND tp.shared = 1
    LIMIT 1
    `, ownerUserId, assetId, provider, tripId);

    if (!sharedAsset) {
      return false;
    }
    return !!this.db.canAccessTrip(tripId, requestingUserId);
  }

  // ── Unified photo access check (trek_photos based) ──────────────────────

  canAccessTrekPhoto(requestingUserId: number, trekPhotoId: number): boolean {
    const photo = this.db.get<{ id: number; provider: string; owner_id: number | null }>('SELECT * FROM trek_photos WHERE id = ?', trekPhotoId);
    if (!photo) return false;

    // Owner always has access
    if (photo.owner_id === requestingUserId) return true;

    // Check trip_photos — is this photo shared in a trip the user has access to?
    const tripAccess = this.db.get(`
        SELECT 1 FROM trip_photos tp
        WHERE tp.photo_id = ?
          AND tp.shared = 1
          AND EXISTS (
            SELECT 1 FROM trip_members tm WHERE tm.trip_id = tp.trip_id AND tm.user_id = ?
            UNION ALL
            SELECT 1 FROM trips t WHERE t.id = tp.trip_id AND t.user_id = ?
          )
        LIMIT 1
    `, trekPhotoId, requestingUserId, requestingUserId);
    if (tripAccess) return true;

    // Check journey_photos — is this photo in a journey the user can access?
    const journeyAccess = this.db.get(`
        SELECT 1 FROM journey_photos gp
        WHERE gp.photo_id = ?
          AND EXISTS (
            SELECT 1 FROM journeys j WHERE j.id = gp.journey_id AND j.user_id = ?
            UNION ALL
            SELECT 1 FROM journey_contributors jc WHERE jc.journey_id = gp.journey_id AND jc.user_id = ?
          )
        LIMIT 1
    `, trekPhotoId, requestingUserId, requestingUserId);
    if (journeyAccess) return true;

    // Local photos without owner (uploaded files) — check if user has journey access
    if (photo.provider === 'local' && !photo.owner_id) {
      return !!journeyAccess;
    }

    return false;
  }

  // ── Album link syncing ──────────────────────────────────────────────────

  getAlbumIdFromLink(tripId: string, linkId: string, userId: number): ServiceResult<string> {
    const access = this.db.canAccessTrip(tripId, userId);
    if (!access) return fail('Trip not found or access denied', 404);

    try {
      const row = this.db.get<{ album_id: string }>(
        'SELECT album_id FROM trip_album_links WHERE id = ? AND trip_id = ? AND user_id = ?',
        linkId, tripId, userId,
      );

      return row ? success(row.album_id) : fail('Album link not found', 404);
    } catch {
      return fail('Failed to retrieve album link', 500);
    }
  }

  getAlbumLinkForSync(tripId: string, linkId: string, userId: number): ServiceResult<{ albumId: string; passphrase?: string }> {
    const access = this.db.canAccessTrip(tripId, userId);
    if (!access) return fail('Trip not found or access denied', 404);

    try {
      const row = this.db.get<{ album_id: string; passphrase: string | null }>(
        'SELECT album_id, passphrase FROM trip_album_links WHERE id = ? AND trip_id = ? AND user_id = ?',
        linkId, tripId, userId,
      );

      if (!row) return fail('Album link not found', 404);

      const decrypted = row.passphrase ? decrypt_api_key(row.passphrase) ?? undefined : undefined;
      return success({ albumId: row.album_id, passphrase: decrypted || undefined });
    } catch {
      return fail('Failed to retrieve album link', 500);
    }
  }

  updateSyncTimeForAlbumLink(linkId: string): void {
    this.db.run('UPDATE trip_album_links SET last_synced_at = CURRENT_TIMESTAMP WHERE id = ?', linkId);
  }
}
