import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JourneyDomainService } from './journey-domain.service';
import { JourneyShareService } from './journey-share.service';
import { ImmichService } from '../memories/immich.service';
import { PhotoProviderRegistry } from '../memories/photo-provider.registry';
import { PhotoResolverService } from '../memories/photo-resolver.service';
import { AddonsService } from '../addons/addons.service';
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
  constructor(
    private readonly dbs: DatabaseService,
    private readonly addons: AddonsService,
    private readonly immich: ImmichService,
    private readonly providers: PhotoProviderRegistry,
    private readonly photoResolver: PhotoResolverService,
    private readonly journey: JourneyDomainService,
    private readonly share: JourneyShareService,
  ) {}

  private get db() {
    return this.dbs.connection;
  }

  journeyAddonEnabled(): boolean {
    return this.addons.isAddonEnabled(ADDON_IDS.JOURNEY);
  }

  // Journeys
  listJourneys(userId: number) { return this.journey.listJourneys(userId); }
  createJourney(userId: number, data: Parameters<typeof this.journey.createJourney>[1]) { return this.journey.createJourney(userId, data); }
  getJourneyFull(id: number, userId: number) { return this.journey.getJourneyFull(id, userId); }
  updateJourney(id: number, userId: number, data: Parameters<typeof this.journey.updateJourney>[2]) { return this.journey.updateJourney(id, userId, data); }
  deleteJourney(id: number, userId: number) { return this.journey.deleteJourney(id, userId); }
  getSuggestions(userId: number) { return this.journey.getSuggestions(userId); }
  listUserTrips(userId: number) { return this.journey.listUserTrips(userId); }
  updateJourneyPreferences(id: number, userId: number, data: Parameters<typeof this.journey.updateJourneyPreferences>[2]) { return this.journey.updateJourneyPreferences(id, userId, data); }

  // Trips
  addTripToJourney(id: number, tripId: number, userId: number) { return this.journey.addTripToJourney(id, tripId, userId); }
  removeTripFromJourney(id: number, tripId: number, userId: number) { return this.journey.removeTripFromJourney(id, tripId, userId); }

  // Entries
  listEntries(id: number, userId: number) { return this.journey.listEntries(id, userId); }
  journeyTracks(id: number, userId: number) { return this.journey.journeyTracks(id, userId); }
  journeyStats(id: number, userId: number) { return this.journey.journeyStats(id, userId); }
  // Entry create/update bodies are free-form in the legacy route (req.body: any);
  // the cast keeps that boundary here so callers needn't pre-shape the payload.
  createEntry(id: number, userId: number, data: Record<string, unknown>, sid?: string) { return this.journey.createEntry(id, userId, data as Parameters<typeof this.journey.createEntry>[2], sid); }
  updateEntry(entryId: number, userId: number, data: Parameters<typeof this.journey.updateEntry>[2], sid?: string) { return this.journey.updateEntry(entryId, userId, data, sid); }
  deleteEntry(entryId: number, userId: number, sid?: string) { return this.journey.deleteEntry(entryId, userId, sid); }
  reorderEntries(id: number, userId: number, orderedIds: number[], sid?: string) { return this.journey.reorderEntries(id, userId, orderedIds, sid); }

  // Photos
  addPhoto(entryId: number, userId: number, filePath: string, thumbnailPath: string | undefined, caption: string | undefined) { return this.journey.addPhoto(entryId, userId, filePath, thumbnailPath, caption); }
  setPhotoProvider(photoId: number, provider: string, assetId: string, ownerId: number) { return this.journey.setPhotoProvider(photoId, provider, assetId, ownerId); }
  addProviderPhoto(entryId: number, userId: number, provider: string, assetId: string, caption?: string, passphrase?: string, mediaType?: string) { return this.journey.addProviderPhoto(entryId, userId, provider, assetId, caption, passphrase, mediaType); }
  linkPhotoToEntry(entryId: number, journeyPhotoId: number, userId: number) { return this.journey.linkPhotoToEntry(entryId, journeyPhotoId, userId); }
  unlinkPhotoFromEntry(entryId: number, journeyPhotoId: number, userId: number) { return this.journey.unlinkPhotoFromEntry(entryId, journeyPhotoId, userId); }
  updatePhoto(photoId: number, userId: number, data: Parameters<typeof this.journey.updatePhoto>[2]) { return this.journey.updatePhoto(photoId, userId, data); }
  deletePhoto(photoId: number, userId: number) { return this.journey.deletePhoto(photoId, userId); }
  uploadGalleryPhotos(id: number, userId: number, filePaths: Parameters<typeof this.journey.uploadGalleryPhotos>[2]) { return this.journey.uploadGalleryPhotos(id, userId, filePaths); }
  addProviderPhotoToGallery(id: number, userId: number, provider: string, assetId: string, caption?: string, passphrase?: string, mediaType?: string) { return this.journey.addProviderPhotoToGallery(id, userId, provider, assetId, caption, passphrase, mediaType); }
  deleteGalleryPhoto(journeyPhotoId: number, userId: number) { return this.journey.deleteGalleryPhoto(journeyPhotoId, userId); }

  // Contributors
  addContributor(id: number, userId: number, targetUserId: number, role: 'editor' | 'viewer') { return this.journey.addContributor(id, userId, targetUserId, role); }
  updateContributorRole(id: number, userId: number, targetUserId: number, role: 'editor' | 'viewer') { return this.journey.updateContributorRole(id, userId, targetUserId, role); }
  removeContributor(id: number, userId: number, targetUserId: number) { return this.journey.removeContributor(id, userId, targetUserId); }

  // Share links
  // Authorization lives in JourneyShareService.readJourneyShareLink, which the
  // MCP tool reads through as well; { allowed: false } is a refusal, not "no
  // link exists".
  getJourneyShareLink(id: number, userId: number) { return this.share.readJourneyShareLink(id, userId); }
  createOrUpdateJourneyShareLink(id: number, userId: number, data: Parameters<typeof this.share.createOrUpdateJourneyShareLink>[2]) { return this.share.createOrUpdateJourneyShareLink(id, userId, data); }
  deleteJourneyShareLink(id: number, userId: number) { return this.share.deleteJourneyShareLink(id, userId); }

  // Immich mirror (only when the user opted in via integration settings)
  immichAutoUploadEnabled(userId: number): boolean {
    const prefs = this.db.prepare('SELECT immich_auto_upload FROM users WHERE id = ?').get(userId) as { immich_auto_upload?: number } | undefined;
    return !!prefs?.immich_auto_upload;
  }
  uploadToImmich(userId: number, relativePath: string, originalName: string) { return this.immich.uploadToImmich(userId, relativePath, originalName); }

  // Public (share-token) access — no auth, validated by token.
  getPublicJourney(token: string) { return this.share.getPublicJourney(token); }
  validateShareTokenForPhoto(token: string, photoId: number) { return this.share.validateShareTokenForPhoto(token, photoId); }
  validateShareTokenForAsset(token: string, assetId: string) { return this.share.validateShareTokenForAsset(token, assetId); }
  streamPhoto(res: Response, ownerId: number, photoId: number, kind: 'thumbnail' | 'original') { return this.photoResolver.streamPhoto(res, ownerId, photoId, kind); }
  /**
   * Stream a shared journey asset from whichever backend holds it.
   *
   * Replaced a pair of per-provider passthroughs (and, before those, a dynamic
   * import() around a since-removed cycle). The public controller used to pick
   * between them with `provider === 'immich' ? … : trySynology()`, so a third
   * provider would have been handed to Synology and 404'd from inside its
   * parser. An unregistered provider is now told apart from a failing one.
   */
  streamProviderAsset(
    res: Response,
    provider: string,
    ref: { userId: number; ownerId: number; assetId: string },
    kind: 'thumbnail' | 'original',
  ): Promise<void> | null {
    const backend = this.providers.get(provider);
    if (!backend) return null;
    return backend.streamAsset(res, ref, kind);
  }
}
