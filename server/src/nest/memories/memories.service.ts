import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { ImmichService } from './immich.service';
import { SynologyService } from './synology.service';
import { UnifiedMemoriesService } from './unified-memories.service';
import { MemoriesAccessService } from './memories-access.service';
import type { Selection } from './memories.helpers';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';

/**
 * Controller-facing facade over the memories domain. Every method forwards to
 * the provider that owns the work — UnifiedMemoriesService for the trip-side
 * photo surface, ImmichService and SynologyService for the providers,
 * MemoriesAccessService for the shared access checks. No business logic here.
 */
@Injectable()
export class MemoriesService {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly unified: UnifiedMemoriesService,
    private readonly immich: ImmichService,
    private readonly synology: SynologyService,
    private readonly access: MemoriesAccessService,
  ) {}

  // ── Access check (reused by both provider asset routes) ──────────────────
  canAccessUserPhoto(requestingUserId: number, ownerUserId: number, tripId: string, assetId: string, provider: string): boolean {
    return this.access.canAccessUserPhoto(requestingUserId, ownerUserId, tripId, assetId, provider);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId?: string): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  // ── Unified ──────────────────────────────────────────────────────────────
  listTripPhotos(tripId: string, userId: number) {
    return this.unified.listTripPhotos(tripId, userId);
  }

  addTripPhotos(tripId: string, userId: number, shared: boolean, selections: Selection[], sid: string) {
    return this.unified.addTripPhotos(tripId, userId, shared, selections, sid);
  }

  setTripPhotoSharing(tripId: string, userId: number, photoId: number, shared: boolean) {
    return this.unified.setTripPhotoSharing(tripId, userId, photoId, shared);
  }

  removeTripPhoto(tripId: string, userId: number, photoId: number) {
    return this.unified.removeTripPhoto(tripId, userId, photoId);
  }

  listTripAlbumLinks(tripId: string, userId: number) {
    return this.unified.listTripAlbumLinks(tripId, userId);
  }

  createTripAlbumLink(tripId: string, userId: number, provider: unknown, albumId: unknown, albumName: unknown, passphrase?: string) {
    return this.unified.createTripAlbumLink(tripId, userId, provider, albumId, albumName, passphrase);
  }

  removeAlbumLink(tripId: string, linkId: string, userId: number) {
    return this.unified.removeAlbumLink(tripId, linkId, userId);
  }

  // ── Immich ─────────────────────────────────────────────────────────────────
  immichGetConnectionSettings(userId: number) {
    return this.immich.getConnectionSettings(userId);
  }

  immichSaveSettings(userId: number, immichUrl: string | undefined, immichApiKey: string | undefined, clientIp: string | null) {
    return this.immich.saveImmichSettings(userId, immichUrl, immichApiKey, clientIp);
  }

  immichSetAutoUpload(userId: number, enabled: boolean): void {
    this.immich.setImmichAutoUpload(userId, enabled);
  }

  immichGetConnectionStatus(userId: number) {
    return this.immich.getConnectionStatus(userId);
  }

  immichTestConnection(immichUrl: string, immichApiKey: string) {
    return this.immich.testConnection(immichUrl, immichApiKey);
  }

  immichBrowseTimeline(userId: number) {
    return this.immich.browseTimeline(userId);
  }

  immichSearchPhotos(userId: number, from: string | undefined, to: string | undefined, page: number, size: number) {
    return this.immich.searchPhotos(userId, from, to, page, size);
  }

  immichIsValidAssetId(assetId: string): boolean {
    return this.immich.isValidAssetId(assetId);
  }

  immichGetAssetInfo(userId: number, assetId: string, ownerId: number) {
    return this.immich.getAssetInfo(userId, assetId, ownerId);
  }

  immichStreamAsset(res: Response, userId: number, assetId: string, kind: 'thumbnail' | 'original', ownerId: number) {
    return this.immich.streamImmichAsset(res, userId, assetId, kind, ownerId);
  }

  immichListAlbums(userId: number) {
    return this.immich.listAlbums(userId);
  }

  immichGetAlbumPhotos(userId: number, albumId: string) {
    return this.immich.getAlbumPhotos(userId, albumId);
  }

  immichSyncAlbumAssets(tripId: string, linkId: string, userId: number, sid: string) {
    return this.unified.syncImmichAlbum(tripId, linkId, userId, sid);
  }

  // ── Synology ────────────────────────────────────────────────────────────────
  synologyGetSettings(userId: number) {
    return this.synology.getSynologySettings(userId);
  }

  synologyUpdateSettings(userId: number, url: string, username: string, password: string, skipSsl: boolean) {
    return this.synology.updateSynologySettings(userId, url, username, password, skipSsl);
  }

  synologyGetStatus(userId: number) {
    return this.synology.getSynologyStatus(userId);
  }

  synologyTestConnection(userId: number, url: string, username: string, password: string, otp: string, skipSsl: boolean) {
    return this.synology.testSynologyConnection(userId, url, username, password, otp, skipSsl);
  }

  synologyListAlbums(userId: number) {
    return this.synology.listSynologyAlbums(userId);
  }

  synologyGetAlbumPhotos(userId: number, albumId: string, passphrase?: string) {
    return this.synology.getSynologyAlbumPhotos(userId, albumId, passphrase);
  }

  synologySyncAlbumLink(userId: number, tripId: string, linkId: string, sid: string) {
    return this.unified.syncSynologyAlbum(userId, tripId, linkId, sid);
  }

  synologySearchPhotos(userId: number, from: string | undefined, to: string | undefined, offset: number, limit: number) {
    return this.synology.searchSynologyPhotos(userId, from, to, offset, limit);
  }

  synologyGetAssetInfo(userId: number, photoId: string, ownerId: number, passphrase?: string) {
    return this.synology.getSynologyAssetInfo(userId, photoId, ownerId, passphrase);
  }

  synologyStreamAsset(res: Response, userId: number, ownerId: number, photoId: string, kind: 'thumbnail' | 'original', size: string, passphrase?: string) {
    return this.synology.streamSynologyAsset(res, userId, ownerId, photoId, kind, size, passphrase);
  }
}
