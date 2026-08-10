import { Injectable } from '@nestjs/common';
import { broadcast } from '../../websocket';
import { encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { DatabaseService } from '../database/database.service';
import { TrekPhotosRepository } from '../photos/trek-photos.repository';
import { ImmichService } from './immich.service';
import { SynologyService } from './synology.service';
import { MemoriesAccessService } from './memories-access.service';
import {
  fail,
  success,
  mapDbError,
  type Selection,
  type ServiceResult,
  type SyncAlbumResult,
} from './memories.helpers';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * The provider-agnostic trip photo surface: which photos a trip shows, which
 * albums it is linked to, and the album sync that writes provider assets into
 * the trip. The providers themselves never write here - that direction is what
 * used to close the import cycle.
 */
@Injectable()
export class UnifiedMemoriesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly photos: TrekPhotosRepository,
    private readonly immich: ImmichService,
    private readonly synology: SynologyService,
    private readonly access: MemoriesAccessService,
    private readonly notifications: NotificationsService,
  ) {}

  private _providers(): Array<{id: string; enabled: boolean}> {
    const rows = this.db.prepare('SELECT id, enabled FROM photo_providers').all() as Array<{id: string; enabled: number}>;
    return rows.map(r => ({ id: r.id, enabled: r.enabled === 1 }));
  } 

  private _validProvider(provider: string): ServiceResult<string> {
    const providers = this._providers();
    const found = providers.find(p => p.id === provider);
    if (!found) {
      return fail(`Provider: "${provider}" is not supported`, 400);
    }
    if (!found.enabled) {
      return fail(`Provider: "${provider}" is not enabled, contact server administrator`, 400);
    }
    return success(provider);
  }




  listTripPhotos(tripId: string, userId: number): ServiceResult<any[]> {
    const access = this.db.canAccessTrip(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    try {

      const enabledProviders = this._providers().filter(p => p.enabled).map(p => p.id);

      if (enabledProviders.length === 0) {
        return fail('No photo providers enabled', 400);
      }

      const photos = this.db.prepare(`
        SELECT tp.photo_id, tkp.asset_id, tkp.provider, tp.user_id, tp.shared, tp.added_at,
               u.username, u.avatar
        FROM trip_photos tp
        JOIN trek_photos tkp ON tkp.id = tp.photo_id
        JOIN users u ON tp.user_id = u.id
        WHERE tp.trip_id = ?
          AND (tp.user_id = ? OR tp.shared = 1)
          AND tkp.provider IN (${enabledProviders.map(() => '?').join(',')})
        ORDER BY tp.added_at ASC
      `).all(tripId, userId, ...enabledProviders);

      return success(photos);
    } catch (error) {
      return mapDbError(error, 'Failed to list trip photos');
    }
  }

  listTripAlbumLinks(tripId: string, userId: number): ServiceResult<any[]> {
    const access = this.db.canAccessTrip(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

  
      const enabledProviders = this._providers().filter(p => p.enabled).map(p => p.id);

      if (enabledProviders.length === 0) {
        return fail('No photo providers enabled', 400);
      }

    try {
      const links = this.db.prepare(`
        SELECT tal.id,
               tal.trip_id,
               tal.user_id,
               tal.provider,
               tal.album_id,
               tal.album_name,
               tal.sync_enabled,
               tal.last_synced_at,
               tal.created_at,
               u.username
        FROM trip_album_links tal
        JOIN users u ON tal.user_id = u.id
        WHERE tal.trip_id = ?
          AND tal.provider IN (${enabledProviders.map(() => '?').join(',')})
        ORDER BY tal.created_at ASC
      `).all(tripId, ...enabledProviders);

      return success(links);
    } catch (error) {
      return mapDbError(error, 'Failed to list trip album links');
    }
  }

  //-----------------------------------------------
  // managing photos in trip

  private _addTripPhoto(tripId: string, userId: number, provider: string, assetId: string, shared: boolean, albumLinkId?: string, passphrase?: string): ServiceResult<boolean> {
    const providerResult = this._validProvider(provider);
    if (!providerResult.success) {
      return providerResult as ServiceResult<boolean>;
    }
    try {
      const photoId = this.photos.getOrCreate(provider, assetId, userId, passphrase);
      const result = this.db.prepare(
        'INSERT OR IGNORE INTO trip_photos (trip_id, user_id, photo_id, shared, album_link_id) VALUES (?, ?, ?, ?, ?)'
      ).run(tripId, userId, photoId, shared ? 1 : 0, albumLinkId || null);
      return success(result.changes > 0);
    }
    catch (error) {
      return mapDbError(error, 'Failed to add photo to trip');
    }
  }

  async addTripPhotos(
    tripId: string,
    userId: number,
    shared: boolean,
    selections: Selection[],
    sid: string,
    albumLinkId?: string,
  ): Promise<ServiceResult<{ added: number; shared: boolean }>> {
    const access = this.db.canAccessTrip(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    if (selections.length === 0) {
      return fail('No photos selected', 400);
    }

    let added = 0;
    for (const selection of selections) {
      const providerResult = this._validProvider(selection.provider);
      if (!providerResult.success) {
        return providerResult as ServiceResult<{ added: number; shared: boolean }>;
      }
      for (const raw of selection.asset_ids) {
        const assetId = String(raw || '').trim();
        if (!assetId) continue;
        const result = this._addTripPhoto(tripId, userId, selection.provider, assetId, shared, albumLinkId, selection.passphrase);
        if (!result.success) {
          return result as ServiceResult<{ added: number; shared: boolean }>;
        }
        if (result.data) {
          added++;
        }
      }
    }

    await this._notifySharedTripPhotos(tripId, userId, added);
    broadcast(tripId, 'memories:updated', { userId }, sid);
    return success({ added, shared });
  }


  async setTripPhotoSharing(
    tripId: string,
    userId: number,
    photoId: number,
    shared: boolean,
    sid?: string,
  ): Promise<ServiceResult<true>> {
    const access = this.db.canAccessTrip(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    try {
      this.db.prepare(`
        UPDATE trip_photos
        SET shared = ?
        WHERE trip_id = ?
          AND user_id = ?
          AND photo_id = ?
      `).run(shared ? 1 : 0, tripId, userId, photoId);

      await this._notifySharedTripPhotos(tripId, userId, 1);
      broadcast(tripId, 'memories:updated', { userId }, sid);
      return success(true);
    } catch (error) {
      return mapDbError(error, 'Failed to update photo sharing');
    }
  }

  removeTripPhoto(
    tripId: string,
    userId: number,
    photoId: number,
    sid?: string,
  ): ServiceResult<true> {
    const access = this.db.canAccessTrip(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    try {
      this.db.prepare(`
        DELETE FROM trip_photos
        WHERE trip_id = ?
          AND user_id = ?
          AND photo_id = ?
      `).run(tripId, userId, photoId);

      this.photos.deleteIfOrphan(photoId);
      broadcast(tripId, 'memories:updated', { userId }, sid);

      return success(true);
    } catch (error) {
      return mapDbError(error, 'Failed to remove trip photo');
    }
  }

  // ----------------------------------------------
  // managing album links in trip

  createTripAlbumLink(tripId: string, userId: number, providerRaw: unknown, albumIdRaw: unknown, albumNameRaw: unknown, passphrase?: string): ServiceResult<true> {
    const access = this.db.canAccessTrip(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    const provider = String(providerRaw || '').toLowerCase();
    const albumId = String(albumIdRaw || '').trim();
    const albumName = String(albumNameRaw || '').trim();

    if (!provider) {
      return fail('provider is required', 400);
    }
    if (!albumId) {
      return fail('album_id required', 400);
    }


    const providerResult = this._validProvider(provider);
    if (!providerResult.success) {
      return providerResult as ServiceResult<true>;
    }

    try {
      const encryptedPassphrase = passphrase ? encrypt_api_key(passphrase) : null;
      const result = this.db.prepare(
        'INSERT OR IGNORE INTO trip_album_links (trip_id, user_id, provider, album_id, album_name, passphrase) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(tripId, userId, provider, albumId, albumName, encryptedPassphrase);

      if (result.changes === 0) {
        return fail('Album already linked', 409);
      }

      return success(true);
    } catch (error) {
      return mapDbError(error, 'Failed to link album');
    }
  }

  removeAlbumLink(tripId: string, linkId: string, userId: number): ServiceResult<true> {
    const access = this.db.canAccessTrip(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    try {
      const linkedPhotos = this.db.prepare('SELECT photo_id FROM trip_photos WHERE trip_id = ? AND album_link_id = ?')
        .all(tripId, linkId) as Array<{ photo_id: number }>;

      this.db.transaction(() => {
        this.db.prepare('DELETE FROM trip_photos WHERE trip_id = ? AND album_link_id = ?')
          .run(tripId, linkId);
        this.db.prepare('DELETE FROM trip_album_links WHERE id = ? AND trip_id = ? AND user_id = ?')
          .run(linkId, tripId, userId);
      });

      for (const { photo_id } of linkedPhotos) {
        this.photos.deleteIfOrphan(photo_id);
      }

      return success(true);
    } catch (error) {
      return mapDbError(error, 'Failed to remove album link');
    }
  }


  //-----------------------------------------------
  // notifications helper

  private async _notifySharedTripPhotos(
    tripId: string,
    actorUserId: number,
    added: number,
  ): Promise<ServiceResult<void>> {
    if (added <= 0) return success(undefined);

    try {
      const actorRow = this.db.prepare('SELECT username, email FROM users WHERE id = ?').get(actorUserId) as { username: string | null, email: string | null };

      const tripInfo = this.db.prepare('SELECT title FROM trips WHERE id = ?').get(tripId) as { title: string } | undefined;

    
      this.notifications.send({ event: 'photos_shared', actorId: actorUserId, scope: 'trip', targetId: Number(tripId), params: { trip: tripInfo?.title || 'Untitled', actor: actorRow?.email || 'Unknown', count: String(added), tripId: String(tripId) } }).catch(() => {});
      return success(undefined);
    } catch {
      return fail('Failed to send notifications', 500);
    }
  }

  // ── Album sync (orchestration) ────────────────────────────────────────────
  //
  // The provider services collect the asset ids; adding them to the trip and
  // stamping the link is this module's job, because addTripPhotos lives here.
  // Keeping the write on this side is what lets immich/synology stop importing
  // this module — the cycle immich -> unified -> photoResolver -> immich is gone.
  // Both functions return exactly what the combined provider-side ones returned.

  async syncImmichAlbum(
    tripId: string,
    linkId: string,
    userId: number,
    sid: string,
  ): Promise<{ success?: boolean; added?: number; total?: number; error?: string; status?: number }> {
    const collected = await this.immich.collectAlbumSelection(tripId, linkId, userId);
    if ('error' in collected) return { error: collected.error, status: collected.status };

    const result = await this.addTripPhotos(tripId, userId, true, [collected.selection], sid, linkId);
    if ('error' in result) return { error: result.error.message, status: result.error.status };

    this.access.updateSyncTimeForAlbumLink(linkId);

    return { success: true, added: result.data.added, total: collected.total };
  }

  async syncSynologyAlbum(
    userId: number,
    tripId: string,
    linkId: string,
    sid: string,
  ): Promise<ServiceResult<SyncAlbumResult>> {
    const collected = await this.synology.collectSynologyAlbumSelection(userId, tripId, linkId);
    if (!collected.success) return collected as ServiceResult<SyncAlbumResult>;

    const result = await this.addTripPhotos(tripId, userId, true, [collected.data.selection], sid, linkId);
    if (!result.success) return result as ServiceResult<SyncAlbumResult>;

    this.access.updateSyncTimeForAlbumLink(linkId);

    return success({ added: result.data.added, total: collected.data.total });
  }
}
