import { Injectable } from '@nestjs/common';
import { broadcast } from '../../websocket';
import { canAccessTrip } from '../../db/database';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as svc from '../../services/placeService';
import { onPlaceCreated, onPlaceUpdated, onPlaceDeleted } from '../../services/journeyService';

type Trip = { user_id: number };

/**
 * Thin Nest wrapper around the existing place service. Trip access mirrors the
 * requireTripAccess middleware (canAccessTrip); mutations use 'place_edit'. The
 * SQL, the GPX/map/list importers and the journey hooks reuse the legacy code
 * unchanged.
 */
@Injectable()
export class PlacesService {
  verifyTripAccess(tripId: string, userId: number) {
    return canAccessTrip(Number(tripId), userId) as Trip | null | undefined;
  }

  canEdit(trip: Trip, user: User): boolean {
    return checkPermission('place_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  list(tripId: string, filters: { search?: string; category?: string; tag?: string }) {
    return svc.listPlaces(tripId, filters);
  }

  get(tripId: string, id: string) {
    return svc.getPlace(tripId, id);
  }

  create(tripId: string, data: Parameters<typeof svc.createPlace>[1]) {
    return svc.createPlace(tripId, data);
  }

  update(tripId: string, id: string, data: Parameters<typeof svc.updatePlace>[2], ifMatch?: string) {
    return svc.updatePlace(tripId, id, data, ifMatch);
  }

  remove(tripId: string, id: string): boolean {
    return svc.deletePlace(tripId, id);
  }

  removeMany(tripId: string, ids: number[]): number[] {
    return svc.deletePlacesMany(tripId, ids);
  }

  updateMany(tripId: string, ids: number[], data: Parameters<typeof svc.updatePlacesMany>[2]) {
    return svc.updatePlacesMany(tripId, ids, data);
  }

  importGpx(
    tripId: string,
    buffer: Buffer,
    opts: { importWaypoints: boolean; importRoutes: boolean; importTracks: boolean; defaultName?: string },
  ) {
    return svc.importGpx(tripId, buffer, opts);
  }

  importMapFile(tripId: string, buffer: Buffer, filename: string, opts: svc.KmlImportOptions) {
    return svc.importMapFile(tripId, buffer, filename, opts);
  }

  importGoogleList(tripId: string, url: string, opts?: Parameters<typeof svc.importGoogleList>[2]) {
    return svc.importGoogleList(tripId, url, opts);
  }

  importNaverList(tripId: string, url: string, opts?: Parameters<typeof svc.importNaverList>[2]) {
    return svc.importNaverList(tripId, url, opts);
  }

  searchImage(tripId: string, id: string, userId: number) {
    return svc.searchPlaceImage(tripId, id, userId);
  }

  // Journey hooks — non-fatal, mirroring the route's try/catch wrappers.
  onCreated(tripId: string, placeId: number): void { try { onPlaceCreated(Number(tripId), placeId); } catch { /* non-fatal */ } }
  onUpdated(placeId: number): void { try { onPlaceUpdated(placeId); } catch { /* non-fatal */ } }
  onDeleted(placeId: number): void { try { onPlaceDeleted(placeId); } catch { /* non-fatal */ } }
}
