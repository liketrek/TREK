import { Injectable } from '@nestjs/common';
import { db } from '../../db/database';
import * as svc from '../../services/journeyService';
import * as share from '../../services/journeyShareService';
import { uploadToImmich, streamImmichAsset } from '../../services/memories/immichService';
import { streamPhoto } from '../../services/memories/photoResolverService';
import { isAddonEnabled } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';
import type { Response } from 'express';

/**
 * Thin Nest wrapper around the existing journey services. Access control lives
 * inside journeyService (each call returns null/false for no-access), so this
 * just re-exposes the functions plus the share-link helpers, the Immich mirror
 * and the addon gate the legacy mount enforced.
 */
@Injectable()
export class JourneyService {
  journeyAddonEnabled(): boolean {
    return isAddonEnabled(ADDON_IDS.JOURNEY);
  }

  // Journeys
  listJourneys(userId: number) { return svc.listJourneys(userId); }
  createJourney(userId: number, data: Parameters<typeof svc.createJourney>[1]) { return svc.createJourney(userId, data); }
  getJourneyFull(id: number, userId: number) { return svc.getJourneyFull(id, userId); }
  updateJourney(id: number, userId: number, data: Parameters<typeof svc.updateJourney>[2]) { return svc.updateJourney(id, userId, data); }
  deleteJourney(id: number, userId: number) { return svc.deleteJourney(id, userId); }
  getSuggestions(userId: number) { return svc.getSuggestions(userId); }
  listUserTrips(userId: number) { return svc.listUserTrips(userId); }
  updateJourneyPreferences(id: number, userId: number, data: Parameters<typeof svc.updateJourneyPreferences>[2]) { return svc.updateJourneyPreferences(id, userId, data); }

  // Trips
  addTripToJourney(id: number, tripId: number, userId: number) { return svc.addTripToJourney(id, tripId, userId); }
  removeTripFromJourney(id: number, tripId: number, userId: number) { return svc.removeTripFromJourney(id, tripId, userId); }

  // Entries
  listEntries(id: number, userId: number) { return svc.listEntries(id, userId); }
  // Entry create/update bodies are free-form in the legacy route (req.body: any);
  // the cast keeps that boundary here so callers needn't pre-shape the payload.
  createEntry(id: number, userId: number, data: Record<string, unknown>, sid?: string) { return svc.createEntry(id, userId, data as Parameters<typeof svc.createEntry>[2], sid); }
  updateEntry(entryId: number, userId: number, data: Parameters<typeof svc.updateEntry>[2], sid?: string) { return svc.updateEntry(entryId, userId, data, sid); }
  deleteEntry(entryId: number, userId: number, sid?: string) { return svc.deleteEntry(entryId, userId, sid); }
  reorderEntries(id: number, userId: number, orderedIds: number[], sid?: string) { return svc.reorderEntries(id, userId, orderedIds, sid); }

  // Photos
  addPhoto(entryId: number, userId: number, filePath: string, thumbnailPath: string | undefined, caption: string | undefined) { return svc.addPhoto(entryId, userId, filePath, thumbnailPath, caption); }
  setPhotoProvider(photoId: number, provider: string, assetId: string, ownerId: number) { return svc.setPhotoProvider(photoId, provider, assetId, ownerId); }
  addProviderPhoto(entryId: number, userId: number, provider: string, assetId: string, caption?: string, passphrase?: string, mediaType?: string) { return svc.addProviderPhoto(entryId, userId, provider, assetId, caption, passphrase, mediaType); }
  linkPhotoToEntry(entryId: number, journeyPhotoId: number, userId: number) { return svc.linkPhotoToEntry(entryId, journeyPhotoId, userId); }
  unlinkPhotoFromEntry(entryId: number, journeyPhotoId: number, userId: number) { return svc.unlinkPhotoFromEntry(entryId, journeyPhotoId, userId); }
  updatePhoto(photoId: number, userId: number, data: Parameters<typeof svc.updatePhoto>[2]) { return svc.updatePhoto(photoId, userId, data); }
  deletePhoto(photoId: number, userId: number) { return svc.deletePhoto(photoId, userId); }
  uploadGalleryPhotos(id: number, userId: number, filePaths: Parameters<typeof svc.uploadGalleryPhotos>[2]) { return svc.uploadGalleryPhotos(id, userId, filePaths); }
  addProviderPhotoToGallery(id: number, userId: number, provider: string, assetId: string, caption?: string, passphrase?: string, mediaType?: string) { return svc.addProviderPhotoToGallery(id, userId, provider, assetId, caption, passphrase, mediaType); }
  deleteGalleryPhoto(journeyPhotoId: number, userId: number) { return svc.deleteGalleryPhoto(journeyPhotoId, userId); }

  // Contributors
  addContributor(id: number, userId: number, targetUserId: number, role: 'editor' | 'viewer') { return svc.addContributor(id, userId, targetUserId, role); }
  updateContributorRole(id: number, userId: number, targetUserId: number, role: 'editor' | 'viewer') { return svc.updateContributorRole(id, userId, targetUserId, role); }
  removeContributor(id: number, userId: number, targetUserId: number) { return svc.removeContributor(id, userId, targetUserId); }

  // Share links
  // Authorization: only someone with access to the journey may read its public
  // share token — same access model as create/delete here and the
  // get_journey_share_link MCP tool.
  getJourneyShareLink(id: number, userId: number) {
    if (!svc.canAccessJourney(id, userId)) return null;
    return share.getJourneyShareLink(id);
  }
  createOrUpdateJourneyShareLink(id: number, userId: number, data: Parameters<typeof share.createOrUpdateJourneyShareLink>[2]) { return share.createOrUpdateJourneyShareLink(id, userId, data); }
  deleteJourneyShareLink(id: number, userId: number) { return share.deleteJourneyShareLink(id, userId); }

  // Immich mirror (only when the user opted in via integration settings)
  immichAutoUploadEnabled(userId: number): boolean {
    const prefs = db.prepare('SELECT immich_auto_upload FROM users WHERE id = ?').get(userId) as { immich_auto_upload?: number } | undefined;
    return !!prefs?.immich_auto_upload;
  }
  uploadToImmich(userId: number, relativePath: string, originalName: string) { return uploadToImmich(userId, relativePath, originalName); }

  // Public (share-token) access — no auth, validated by token.
  getPublicJourney(token: string) { return share.getPublicJourney(token); }
  validateShareTokenForPhoto(token: string, photoId: number) { return share.validateShareTokenForPhoto(token, photoId); }
  validateShareTokenForAsset(token: string, assetId: string) { return share.validateShareTokenForAsset(token, assetId); }
  streamPhoto(res: Response, ownerId: number, photoId: number, kind: 'thumbnail' | 'original') { return streamPhoto(res, ownerId, photoId, kind); }
  streamImmichAsset(res: Response, userId: number, assetId: string, kind: 'thumbnail' | 'original', ownerId: number) { return streamImmichAsset(res, userId, assetId, kind, ownerId); }
  async streamSynologyAsset(res: Response, userId: number, ownerId: number, assetId: string, kind: 'thumbnail' | 'original') {
    const { streamSynologyAsset } = await import('../../services/memories/synologyService');
    return streamSynologyAsset(res, userId, ownerId, assetId, kind);
  }
}
