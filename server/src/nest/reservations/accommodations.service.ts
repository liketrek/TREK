import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { DatabaseService, type TripAccess } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import type { User } from '../../types';
import { DaysService } from '../days/days.service';

type Trip = TripAccess;

/**
 * Thin Nest wrapper around the accommodation parts of the day domain.
 * Accommodations are gated by the 'day_edit' permission (same as days) and the
 * SQL + cascade (linked reservation / budget cleanup on delete) live on the
 * injected DaysService (the DI-native home of the legacy dayService).
 */
@Injectable()
export class AccommodationsService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly days: DaysService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
  ) {}

  /** Mirrors the requireTripAccess middleware (owner or member), returning the trip. */
  verifyTripAccess(tripId: string, userId: number) {
    return this.dbs.canAccessTrip(Number(tripId), userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return this.permissions.checkPermission('day_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  list(tripId: string) {
    return this.days.listAccommodations(tripId);
  }

  validateRefs(tripId: string, placeId?: number, startDayId?: number, endDayId?: number) {
    return this.days.validateAccommodationRefs(tripId, placeId, startDayId, endDayId);
  }

  get(id: string, tripId: string) {
    return this.days.getAccommodation(id, tripId);
  }

  create(tripId: string, data: Parameters<DaysService['createAccommodation']>[1]) {
    return this.days.createAccommodation(tripId, data);
  }

  update(id: string, existing: Parameters<DaysService['updateAccommodation']>[1], fields: Parameters<DaysService['updateAccommodation']>[2]) {
    return this.days.updateAccommodation(id, existing, fields);
  }

  remove(id: string) {
    return this.days.deleteAccommodation(id);
  }
}
