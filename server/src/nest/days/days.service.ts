import { Injectable } from '@nestjs/common';
import { broadcast } from '../../websocket';
import { canAccessTrip } from '../../db/database';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as dayService from '../../services/dayService';

type Trip = { user_id: number };

/**
 * Thin Nest wrapper around the day parts of the existing day service. Trip access
 * mirrors the requireTripAccess middleware (canAccessTrip); mutations use the
 * 'day_edit' permission. The SQL and the day/assignment shaping reuse the legacy
 * code unchanged.
 */
@Injectable()
export class DaysService {
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
    return dayService.listDays(tripId);
  }

  getDay(id: string, tripId: string) {
    return dayService.getDay(id, tripId);
  }

  create(tripId: string, date?: string, notes?: string) {
    return dayService.createDay(tripId, date, notes);
  }

  insert(tripId: string, position?: number) {
    return dayService.insertDay(tripId, position);
  }

  reorder(tripId: string, orderedIds: number[]) {
    return dayService.reorderDays(tripId, orderedIds);
  }

  update(id: string, current: Parameters<typeof dayService.updateDay>[1], fields: { notes?: string; title?: string | null }) {
    return dayService.updateDay(id, current, fields);
  }

  remove(id: string): void {
    dayService.deleteDay(id);
  }
}
