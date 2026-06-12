import { Injectable } from '@nestjs/common';
import { broadcast } from '../../websocket';
import { canAccessTrip } from '../../db/database';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as dayService from '../../services/dayService';

type Trip = { user_id: number };

/**
 * Thin Nest wrapper around the accommodation parts of the existing day service.
 * Accommodations are gated by the 'day_edit' permission (same as days) and the
 * SQL + cascade (linked reservation / budget cleanup on delete) reuse the legacy
 * code unchanged.
 */
@Injectable()
export class AccommodationsService {
  /** Mirrors the requireTripAccess middleware (owner or member), returning the trip. */
  verifyTripAccess(tripId: string, userId: number) {
    return canAccessTrip(Number(tripId), userId) as Trip | null | undefined;
  }

  canEdit(trip: Trip, user: User): boolean {
    return checkPermission('day_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  list(tripId: string) {
    return dayService.listAccommodations(tripId);
  }

  validateRefs(tripId: string, placeId?: number, startDayId?: number, endDayId?: number) {
    return dayService.validateAccommodationRefs(tripId, placeId, startDayId, endDayId);
  }

  get(id: string, tripId: string) {
    return dayService.getAccommodation(id, tripId);
  }

  create(tripId: string, data: Parameters<typeof dayService.createAccommodation>[1]) {
    return dayService.createAccommodation(tripId, data);
  }

  update(id: string, existing: Parameters<typeof dayService.updateAccommodation>[1], fields: Parameters<typeof dayService.updateAccommodation>[2]) {
    return dayService.updateAccommodation(id, existing, fields);
  }

  remove(id: string) {
    return dayService.deleteAccommodation(id);
  }
}
