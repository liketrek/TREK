import { ADDON_IDS } from '../../addons';
import { PhotoProviders } from '../../db/entities/PhotoProviders.entity';
import { TripAlbumLinks } from '../../db/entities/TripAlbumLinks.entity';
import { TripPhotos } from '../../db/entities/TripPhotos.entity';
import { Trips } from '../../db/entities/Trips.entity';
import { Users } from '../../db/entities/Users.entity';
import type { PhotoProvidersRepository } from '../../db/repositories/PhotoProviders.repository';
import type { TripAlbumLinksRepository } from '../../db/repositories/TripAlbumLinks.repository';
import type { TripPhotosRepository } from '../../db/repositories/TripPhotos.repository';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { AddonsService } from '../addons/addons.service';
import { encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { UnitOfWork } from '../database/unit-of-work';
import { NotificationsService } from '../notifications/notifications.service';
import { TrekPhotoRegistrationService } from '../photos/trek-photo-registration.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ImmichService } from './immich.service';
import { MemoriesAccessService } from './memories-access.service';
import {
  fail,
  success,
  mapDbError,
  type Selection,
  type ServiceResult,
  type SyncAlbumResult,
} from './memories.helpers';
import { SynologyService } from './synology.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

/**
 * The provider-agnostic trip photo surface: which photos a trip shows, which
 * albums it is linked to, and the album sync that writes provider assets into
 * the trip. The providers themselves never write here - that direction is what
 * used to close the import cycle.
 */
@Injectable()
export class UnifiedMemoriesService {
  constructor(
    private readonly photos: TrekPhotoRegistrationService,
    private readonly immich: ImmichService,
    private readonly synology: SynologyService,
    private readonly access: MemoriesAccessService,
    private readonly notifications: NotificationsService,
    private readonly addons: AddonsService,
    private readonly uow: UnitOfWork,
    private readonly realtime: RealtimeService,
    @InjectRepository(PhotoProviders) private readonly photoProviders: PhotoProvidersRepository,
    @InjectRepository(TripPhotos) private readonly tripPhotos: TripPhotosRepository,
    @InjectRepository(TripAlbumLinks) private readonly tripAlbumLinks: TripAlbumLinksRepository,
    @InjectRepository(Users) private readonly users: UsersRepository,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
  ) {}

  private async _providers(): Promise<Array<{ id: string; enabled: boolean }>> {
    // A provider only counts as enabled while the journey addon is — its whole
    // surface lives inside journeys. Covers rows left enabled from before
    // updateAddon cascaded the journey disable.
    const journeyOn = await this.addons.isAddonEnabled(ADDON_IDS.JOURNEY);
    const rows = await this.photoProviders.listAll();
    return rows.map((r) => ({ id: r.id, enabled: journeyOn && r.enabled === 1 }));
  }

  private async _validProvider(provider: string): Promise<ServiceResult<string>> {
    const providers = await this._providers();
    const found = providers.find((p) => p.id === provider);
    if (!found) {
      return fail(`Provider: "${provider}" is not supported`, 400);
    }
    if (!found.enabled) {
      return fail(`Provider: "${provider}" is not enabled, contact server administrator`, 400);
    }
    return success(provider);
  }

  async listTripPhotos(tripId: string, userId: number): Promise<ServiceResult<any[]>> {
    const access = await this.trips.findAccessible(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    try {
      const enabledProviders = (await this._providers()).filter((p) => p.enabled).map((p) => p.id);

      if (enabledProviders.length === 0) {
        return fail('No photo providers enabled', 400);
      }

      const photos = await this.tripPhotos.listForTrip(tripId, userId, enabledProviders);

      return success(photos);
    } catch (error) {
      return mapDbError(error, 'Failed to list trip photos');
    }
  }

  async listTripAlbumLinks(tripId: string, userId: number): Promise<ServiceResult<any[]>> {
    const access = await this.trips.findAccessible(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    const enabledProviders = (await this._providers()).filter((p) => p.enabled).map((p) => p.id);

    if (enabledProviders.length === 0) {
      return fail('No photo providers enabled', 400);
    }

    try {
      const links = await this.tripAlbumLinks.listForTrip(tripId, enabledProviders);

      return success(links);
    } catch (error) {
      return mapDbError(error, 'Failed to list trip album links');
    }
  }

  //-----------------------------------------------
  // managing photos in trip

  private async _addTripPhoto(
    tripId: string,
    userId: number,
    provider: string,
    assetId: string,
    shared: boolean,
    albumLinkId?: string,
    passphrase?: string,
  ): Promise<ServiceResult<boolean>> {
    const providerResult = await this._validProvider(provider);
    if (!providerResult.success) {
      return providerResult as ServiceResult<boolean>;
    }
    try {
      // The photo row and its trip link together: no registered photo without its link.
      const added = await this.uow.transactional(async () => {
        const photoId = await this.photos.getOrCreate(provider, assetId, userId, passphrase);
        return await this.tripPhotos.insertIgnore({
          trip_id: tripId,
          user_id: userId,
          photo_id: photoId,
          shared: shared ? 1 : 0,
          album_link_id: albumLinkId || null,
        });
      });
      return success(added);
    } catch (error) {
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
    const access = await this.trips.findAccessible(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    if (selections.length === 0) {
      return fail('No photos selected', 400);
    }

    let added = 0;
    for (const selection of selections) {
      const providerResult = await this._validProvider(selection.provider);
      if (!providerResult.success) {
        return providerResult as ServiceResult<{ added: number; shared: boolean }>;
      }
      for (const raw of selection.asset_ids) {
        const assetId = String(raw || '').trim();
        if (!assetId) continue;
        const result = await this._addTripPhoto(
          tripId,
          userId,
          selection.provider,
          assetId,
          shared,
          albumLinkId,
          selection.passphrase,
        );
        if (!result.success) {
          return result as ServiceResult<{ added: number; shared: boolean }>;
        }
        if (result.data) {
          added++;
        }
      }
    }

    await this._notifySharedTripPhotos(tripId, userId, added);
    this.realtime.broadcast(tripId, 'memories:updated', { userId }, sid);
    return success({ added, shared });
  }

  async setTripPhotoSharing(
    tripId: string,
    userId: number,
    photoId: number,
    shared: boolean,
    sid?: string,
  ): Promise<ServiceResult<true>> {
    const access = await this.trips.findAccessible(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    try {
      await this.tripPhotos.setShared(tripId, userId, photoId, shared ? 1 : 0);

      await this._notifySharedTripPhotos(tripId, userId, 1);
      this.realtime.broadcast(tripId, 'memories:updated', { userId }, sid);
      return success(true);
    } catch (error) {
      return mapDbError(error, 'Failed to update photo sharing');
    }
  }

  async removeTripPhoto(tripId: string, userId: number, photoId: number, sid?: string): Promise<ServiceResult<true>> {
    const access = await this.trips.findAccessible(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    try {
      await this.uow.transactional(async () => {
        await this.tripPhotos.deleteForUserPhoto(tripId, userId, photoId);
        await this.photos.deleteIfOrphan(photoId);
      });
      this.realtime.broadcast(tripId, 'memories:updated', { userId }, sid);

      return success(true);
    } catch (error) {
      return mapDbError(error, 'Failed to remove trip photo');
    }
  }

  // ----------------------------------------------
  // managing album links in trip

  async createTripAlbumLink(
    tripId: string,
    userId: number,
    providerRaw: unknown,
    albumIdRaw: unknown,
    albumNameRaw: unknown,
    passphrase?: string,
  ): Promise<ServiceResult<true>> {
    const access = await this.trips.findAccessible(tripId, userId);
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

    const providerResult = await this._validProvider(provider);
    if (!providerResult.success) {
      return providerResult as ServiceResult<true>;
    }

    try {
      const encryptedPassphrase = passphrase ? encrypt_api_key(passphrase) : null;
      const added = await this.tripAlbumLinks.insertIgnore({
        trip_id: tripId,
        user_id: userId,
        provider,
        album_id: albumId,
        album_name: albumName,
        passphrase: encryptedPassphrase,
      });

      if (!added) {
        return fail('Album already linked', 409);
      }

      return success(true);
    } catch (error) {
      return mapDbError(error, 'Failed to link album');
    }
  }

  async removeAlbumLink(tripId: string, linkId: string, userId: number): Promise<ServiceResult<true>> {
    const access = await this.trips.findAccessible(tripId, userId);
    if (!access) {
      return fail('Trip not found or access denied', 404);
    }

    try {
      const linkedPhotoIds = await this.tripPhotos.listPhotoIdsForAlbumLink(tripId, linkId);

      await this.uow.transactional(async () => {
        await this.tripPhotos.deleteForAlbumLink(tripId, linkId);
        await this.tripAlbumLinks.deleteScoped(linkId, tripId, userId);
        for (const photo_id of linkedPhotoIds) await this.photos.deleteIfOrphan(photo_id);
      });

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
      const actorRow = await this.users.findUsernameEmail(actorUserId);

      const tripTitle = await this.trips.getTitle(tripId);

      this.notifications
        .send({
          event: 'photos_shared',
          actorId: actorUserId,
          scope: 'trip',
          targetId: Number(tripId),
          params: {
            trip: tripTitle || 'Untitled',
            actor: actorRow?.email || 'Unknown',
            count: String(added),
            tripId: String(tripId),
          },
        })
        .catch(() => {});
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

    await this.access.updateSyncTimeForAlbumLink(linkId);

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

    await this.access.updateSyncTimeForAlbumLink(linkId);

    return success({ added: result.data.added, total: collected.data.total });
  }
}
