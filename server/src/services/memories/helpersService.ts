import { canAccessTrip, db } from "../../db/database";
import { decrypt_api_key } from '../../nest/common/crypto/apiKeyCrypto';
// The ServiceResult envelope, the asset shapes and pipeAsset moved to
// nest/memories/memories.helpers.ts — this file is down to the DB-backed
// access checks and album-link lookups, and folds with the providers.
import { fail, success, type ServiceResult } from '../../nest/memories/memories.helpers';
export * from '../../nest/memories/memories.helpers';

//for loading routes to settings page, and validating which services user has connected
type PhotoProviderConfig = {
    settings_get: string;
    settings_put: string;
    status_get: string;
    test_post: string;
};


export function getPhotoProviderConfig(providerId: string): PhotoProviderConfig {
    const prefix = `/integrations/memories/${providerId}`;
    return {
        settings_get: `${prefix}/settings`,
        settings_put: `${prefix}/settings`,
        status_get: `${prefix}/status`,
        test_post: `${prefix}/test`,
    };
}

//-----------------------------------------------
//access check helper

export function canAccessUserPhoto(requestingUserId: number, ownerUserId: number, tripId: string, assetId: string, provider: string): boolean {
    if (requestingUserId === ownerUserId) {
        return true;
    }

    // Journey photos use tripId=0 — check journey_photos + journey_contributors
    if (tripId === '0') {
        const journeyPhoto = db.prepare(`
            SELECT gp.journey_id
            FROM journey_photos gp
            JOIN trek_photos tkp ON tkp.id = gp.photo_id
            WHERE tkp.asset_id = ?
              AND tkp.provider = ?
              AND tkp.owner_id = ?
            LIMIT 1
        `).get(assetId, provider, ownerUserId) as { journey_id: number } | undefined;
        if (!journeyPhoto) return false;

        const access = db.prepare(`
            SELECT 1 FROM journeys WHERE id = ? AND user_id = ?
            UNION ALL
            SELECT 1 FROM journey_contributors WHERE journey_id = ? AND user_id = ?
            LIMIT 1
        `).get(journeyPhoto.journey_id, requestingUserId, journeyPhoto.journey_id, requestingUserId);
        return !!access;
    }

    // Regular trip photos — join through trek_photos
    const sharedAsset = db.prepare(`
    SELECT 1
    FROM trip_photos tp
    JOIN trek_photos tkp ON tkp.id = tp.photo_id
    WHERE tp.user_id = ?
      AND tkp.asset_id = ?
      AND tkp.provider = ?
      AND tp.trip_id = ?
      AND tp.shared = 1
    LIMIT 1
    `).get(ownerUserId, assetId, provider, tripId);

    if (!sharedAsset) {
        return false;
    }
    return !!canAccessTrip(tripId, requestingUserId);
}


// ── Unified photo access check (trek_photos based) ──────────────────────

export function canAccessTrekPhoto(requestingUserId: number, trekPhotoId: number): boolean {
    const photo = db.prepare('SELECT * FROM trek_photos WHERE id = ?').get(trekPhotoId) as { id: number; provider: string; owner_id: number | null } | undefined;
    if (!photo) return false;

    // Owner always has access
    if (photo.owner_id === requestingUserId) return true;

    // Check trip_photos — is this photo shared in a trip the user has access to?
    const tripAccess = db.prepare(`
        SELECT 1 FROM trip_photos tp
        WHERE tp.photo_id = ?
          AND tp.shared = 1
          AND EXISTS (
            SELECT 1 FROM trip_members tm WHERE tm.trip_id = tp.trip_id AND tm.user_id = ?
            UNION ALL
            SELECT 1 FROM trips t WHERE t.id = tp.trip_id AND t.user_id = ?
          )
        LIMIT 1
    `).get(trekPhotoId, requestingUserId, requestingUserId);
    if (tripAccess) return true;

    // Check journey_photos — is this photo in a journey the user can access?
    const journeyAccess = db.prepare(`
        SELECT 1 FROM journey_photos gp
        WHERE gp.photo_id = ?
          AND EXISTS (
            SELECT 1 FROM journeys j WHERE j.id = gp.journey_id AND j.user_id = ?
            UNION ALL
            SELECT 1 FROM journey_contributors jc WHERE jc.journey_id = gp.journey_id AND jc.user_id = ?
          )
        LIMIT 1
    `).get(trekPhotoId, requestingUserId, requestingUserId);
    if (journeyAccess) return true;

    // Local photos without owner (uploaded files) — check if user has journey access
    if (photo.provider === 'local' && !photo.owner_id) {
        return !!journeyAccess;
    }

    return false;
}


// ----------------------------------------------
//helpers for album link syncing

export function getAlbumIdFromLink(tripId: string, linkId: string, userId: number): ServiceResult<string> {
    const access = canAccessTrip(tripId, userId);
    if (!access) return fail('Trip not found or access denied', 404);

    try {
        const row = db.prepare('SELECT album_id FROM trip_album_links WHERE id = ? AND trip_id = ? AND user_id = ?')
            .get(linkId, tripId, userId) as { album_id: string } | null;

        return row ? success(row.album_id) : fail('Album link not found', 404);
    } catch {
        return fail('Failed to retrieve album link', 500);
    }
}

export function getAlbumLinkForSync(tripId: string, linkId: string, userId: number): ServiceResult<{ albumId: string; passphrase?: string }> {
    const access = canAccessTrip(tripId, userId);
    if (!access) return fail('Trip not found or access denied', 404);

    try {
        const row = db.prepare('SELECT album_id, passphrase FROM trip_album_links WHERE id = ? AND trip_id = ? AND user_id = ?')
            .get(linkId, tripId, userId) as { album_id: string; passphrase: string | null } | null;

        if (!row) return fail('Album link not found', 404);

        const decrypted = row.passphrase ? decrypt_api_key(row.passphrase) ?? undefined : undefined;
        return success({ albumId: row.album_id, passphrase: decrypted || undefined });
    } catch {
        return fail('Failed to retrieve album link', 500);
    }
}

export function updateSyncTimeForAlbumLink(linkId: string): void {
    db.prepare('UPDATE trip_album_links SET last_synced_at = CURRENT_TIMESTAMP WHERE id = ?').run(linkId);
}
