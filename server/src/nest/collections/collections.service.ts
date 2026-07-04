import { Injectable } from '@nestjs/common';
import * as svc from '../../services/collectionsService';
import type {
  CollectionCreateRequest,
  CollectionUpdateRequest,
  CollectionSavePlaceRequest,
  CollectionPlaceUpdateRequest,
  CollectionCopyToTripRequest,
  CollectionStatus,
} from '@trek/shared';

/**
 * Thin Nest wrapper around services/collectionsService. All access control lives
 * in the legacy service (assertAccess / isOwner throw, fusion returns {error});
 * this just re-exposes the functions one-to-one.
 */
@Injectable()
export class CollectionsService {
  listCollections(userId: number) { return svc.listCollections(userId); }
  getCollection(userId: number, id: number) { return svc.getCollection(userId, id); }
  createCollection(userId: number, body: CollectionCreateRequest) { return svc.createCollection(userId, body); }
  updateCollection(userId: number, id: number, body: CollectionUpdateRequest, socketId?: string) { return svc.updateCollection(userId, id, body, socketId); }
  setCollectionCover(userId: number, id: number, coverUrl: string | null, socketId?: string) { return svc.setCollectionCover(userId, id, coverUrl, socketId); }
  deleteCollection(userId: number, id: number) { return svc.deleteCollection(userId, id); }
  reorderCollections(userId: number, orderedIds: number[]) { return svc.reorderCollections(userId, orderedIds); }

  savePlace(userId: number, body: CollectionSavePlaceRequest, socketId?: string) { return svc.savePlace(userId, body, socketId); }
  saveFromTripPlace(userId: number, collectionId: number, tripId: number, placeId: number, force?: boolean) {
    return svc.saveFromTripPlace(userId, collectionId, tripId, placeId, force);
  }
  saveFromTripPlaces(userId: number, collectionId: number, tripId: number, placeIds: number[], force?: boolean) {
    return svc.saveFromTripPlaces(userId, collectionId, tripId, placeIds, force);
  }
  updatePlace(userId: number, placeId: number, body: CollectionPlaceUpdateRequest, socketId?: string) { return svc.updatePlace(userId, placeId, body, socketId); }
  setStatus(userId: number, placeId: number, status: CollectionStatus, socketId?: string) { return svc.setStatus(userId, placeId, status, socketId); }
  deletePlace(userId: number, placeId: number, socketId?: string) { return svc.deletePlace(userId, placeId, socketId); }
  deletePlacesMany(userId: number, ids: number[], socketId?: string) { return svc.deletePlacesMany(userId, ids, socketId); }

  copyToTrip(userId: number, body: CollectionCopyToTripRequest) { return svc.copyToTrip(userId, body); }
  findMembership(userId: number, query: { google_place_id?: string; google_ftid?: string; name?: string; lat?: number; lng?: number }) {
    return svc.findMembership(userId, query);
  }

  createLabel(userId: number, collectionId: number, name: string, color: string | undefined, socketId?: string) { return svc.createLabel(userId, collectionId, name, color, socketId); }
  updateLabel(userId: number, labelId: number, body: { name?: string; color?: string; sort_order?: number }, socketId?: string) { return svc.updateLabel(userId, labelId, body, socketId); }
  deleteLabel(userId: number, labelId: number, socketId?: string) { return svc.deleteLabel(userId, labelId, socketId); }
  assignLabels(userId: number, labelIds: number[], placeIds: number[], remove: boolean, socketId?: string) { return svc.assignLabels(userId, labelIds, placeIds, remove, socketId); }

  // Access helpers used by the controller's owner guards.
  assertAccess(userId: number, collectionId: number) { return svc.assertAccess(userId, collectionId); }
  isOwner(userId: number, collectionId: number) { return svc.isOwner(userId, collectionId); }

  sendInvite(collectionId: number, inviterId: number, inviterUsername: string, inviterEmail: string, targetUserId: number, role?: 'viewer' | 'editor' | 'admin') {
    return svc.sendInvite(collectionId, inviterId, inviterUsername, inviterEmail, targetUserId, role);
  }
  acceptInvite(userId: number, collectionId: number, socketId?: string) { return svc.acceptInvite(userId, collectionId, socketId); }
  declineInvite(userId: number, collectionId: number, socketId?: string) { return svc.declineInvite(userId, collectionId, socketId); }
  cancelInvite(collectionId: number, ownerId: number, targetUserId: number) { return svc.cancelInvite(collectionId, ownerId, targetUserId); }
  leaveCollection(userId: number, collectionId: number, socketId?: string) { return svc.leaveCollection(userId, collectionId, socketId); }
  removeMember(ownerId: number, collectionId: number, targetUserId: number) { return svc.removeMember(ownerId, collectionId, targetUserId); }
  setMemberRole(ownerId: number, collectionId: number, targetUserId: number, role: 'viewer' | 'editor' | 'admin') { return svc.setMemberRole(ownerId, collectionId, targetUserId, role); }
  availableUsers(ownerId: number, collectionId: number) { return svc.availableUsers(ownerId, collectionId); }
}
