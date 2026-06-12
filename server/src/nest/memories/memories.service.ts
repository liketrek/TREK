import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import {
  listTripPhotos,
  listTripAlbumLinks,
  createTripAlbumLink,
  removeAlbumLink,
  addTripPhotos,
  removeTripPhoto,
  setTripPhotoSharing,
} from '../../services/memories/unifiedService';
import {
  getConnectionSettings,
  saveImmichSettings,
  setImmichAutoUpload,
  testConnection,
  getConnectionStatus,
  browseTimeline,
  searchPhotos,
  streamImmichAsset,
  listAlbums,
  getAlbumPhotos,
  syncAlbumAssets,
  getAssetInfo,
  isValidAssetId,
} from '../../services/memories/immichService';
import {
  getSynologySettings,
  updateSynologySettings,
  getSynologyStatus,
  testSynologyConnection,
  listSynologyAlbums,
  getSynologyAlbumPhotos,
  syncSynologyAlbumLink,
  searchSynologyPhotos,
  getSynologyAssetInfo,
  streamSynologyAsset,
} from '../../services/memories/synologyService';
import { canAccessUserPhoto } from '../../services/memories/helpersService';
import type { Selection } from '../../services/memories/helpersService';
import { broadcast } from '../../websocket';

/**
 * Thin Nest wrapper around the existing memories (photo-providers) services.
 * Every method delegates to the legacy `services/memories/*` code unchanged so
 * the provider logic, the per-provider access checks and the streaming helpers
 * behave byte-identically to the legacy Express routers. No new business logic
 * lives here.
 */
@Injectable()
export class MemoriesService {
  // ── Access check (reused by both provider asset routes) ──────────────────
  canAccessUserPhoto(requestingUserId: number, ownerUserId: number, tripId: string, assetId: string, provider: string): boolean {
    return canAccessUserPhoto(requestingUserId, ownerUserId, tripId, assetId, provider);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId?: string): void {
    broadcast(tripId, event, payload, socketId);
  }

  // ── Unified ──────────────────────────────────────────────────────────────
  listTripPhotos(tripId: string, userId: number) {
    return listTripPhotos(tripId, userId);
  }

  addTripPhotos(tripId: string, userId: number, shared: boolean, selections: Selection[], sid: string) {
    return addTripPhotos(tripId, userId, shared, selections, sid);
  }

  setTripPhotoSharing(tripId: string, userId: number, photoId: number, shared: boolean) {
    return setTripPhotoSharing(tripId, userId, photoId, shared);
  }

  removeTripPhoto(tripId: string, userId: number, photoId: number) {
    return removeTripPhoto(tripId, userId, photoId);
  }

  listTripAlbumLinks(tripId: string, userId: number) {
    return listTripAlbumLinks(tripId, userId);
  }

  createTripAlbumLink(tripId: string, userId: number, provider: unknown, albumId: unknown, albumName: unknown, passphrase?: string) {
    return createTripAlbumLink(tripId, userId, provider, albumId, albumName, passphrase);
  }

  removeAlbumLink(tripId: string, linkId: string, userId: number) {
    return removeAlbumLink(tripId, linkId, userId);
  }

  // ── Immich ─────────────────────────────────────────────────────────────────
  immichGetConnectionSettings(userId: number) {
    return getConnectionSettings(userId);
  }

  immichSaveSettings(userId: number, immichUrl: string | undefined, immichApiKey: string | undefined, clientIp: string | null) {
    return saveImmichSettings(userId, immichUrl, immichApiKey, clientIp);
  }

  immichSetAutoUpload(userId: number, enabled: boolean): void {
    setImmichAutoUpload(userId, enabled);
  }

  immichGetConnectionStatus(userId: number) {
    return getConnectionStatus(userId);
  }

  immichTestConnection(immichUrl: string, immichApiKey: string) {
    return testConnection(immichUrl, immichApiKey);
  }

  immichBrowseTimeline(userId: number) {
    return browseTimeline(userId);
  }

  immichSearchPhotos(userId: number, from: string | undefined, to: string | undefined, page: number, size: number) {
    return searchPhotos(userId, from, to, page, size);
  }

  immichIsValidAssetId(assetId: string): boolean {
    return isValidAssetId(assetId);
  }

  immichGetAssetInfo(userId: number, assetId: string, ownerId: number) {
    return getAssetInfo(userId, assetId, ownerId);
  }

  immichStreamAsset(res: Response, userId: number, assetId: string, kind: 'thumbnail' | 'original', ownerId: number) {
    return streamImmichAsset(res, userId, assetId, kind, ownerId);
  }

  immichListAlbums(userId: number) {
    return listAlbums(userId);
  }

  immichGetAlbumPhotos(userId: number, albumId: string) {
    return getAlbumPhotos(userId, albumId);
  }

  immichSyncAlbumAssets(tripId: string, linkId: string, userId: number, sid: string) {
    return syncAlbumAssets(tripId, linkId, userId, sid);
  }

  // ── Synology ────────────────────────────────────────────────────────────────
  synologyGetSettings(userId: number) {
    return getSynologySettings(userId);
  }

  synologyUpdateSettings(userId: number, url: string, username: string, password: string, skipSsl: boolean) {
    return updateSynologySettings(userId, url, username, password, skipSsl);
  }

  synologyGetStatus(userId: number) {
    return getSynologyStatus(userId);
  }

  synologyTestConnection(userId: number, url: string, username: string, password: string, otp: string, skipSsl: boolean) {
    return testSynologyConnection(userId, url, username, password, otp, skipSsl);
  }

  synologyListAlbums(userId: number) {
    return listSynologyAlbums(userId);
  }

  synologyGetAlbumPhotos(userId: number, albumId: string, passphrase?: string) {
    return getSynologyAlbumPhotos(userId, albumId, passphrase);
  }

  synologySyncAlbumLink(userId: number, tripId: string, linkId: string, sid: string) {
    return syncSynologyAlbumLink(userId, tripId, linkId, sid);
  }

  synologySearchPhotos(userId: number, from: string | undefined, to: string | undefined, offset: number, limit: number) {
    return searchSynologyPhotos(userId, from, to, offset, limit);
  }

  synologyGetAssetInfo(userId: number, photoId: string, ownerId: number, passphrase?: string) {
    return getSynologyAssetInfo(userId, photoId, ownerId, passphrase);
  }

  synologyStreamAsset(res: Response, userId: number, ownerId: number, photoId: string, kind: 'thumbnail' | 'original', size: string, passphrase?: string) {
    return streamSynologyAsset(res, userId, ownerId, photoId, kind, size, passphrase);
  }
}
