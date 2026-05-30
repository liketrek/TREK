import { Injectable } from '@nestjs/common';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as dayNoteService from '../../services/dayNoteService';

type Trip = NonNullable<ReturnType<typeof dayNoteService.verifyTripAccess>>;

/**
 * Thin Nest wrapper around the existing day-note service. Trip access + the
 * 'day_edit' permission reuse the legacy checks; the SQL is unchanged.
 */
@Injectable()
export class DayNotesService {
  verifyTripAccess(tripId: string, userId: number) {
    return dayNoteService.verifyTripAccess(tripId, userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return checkPermission('day_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  list(dayId: string, tripId: string) {
    return dayNoteService.listNotes(dayId, tripId);
  }

  dayExists(dayId: string, tripId: string) {
    return dayNoteService.dayExists(dayId, tripId);
  }

  getNote(id: string, dayId: string, tripId: string) {
    return dayNoteService.getNote(id, dayId, tripId);
  }

  create(dayId: string, tripId: string, text: string, time?: string, icon?: string, sortOrder?: number) {
    return dayNoteService.createNote(dayId, tripId, text, time, icon, sortOrder);
  }

  update(id: string, current: Parameters<typeof dayNoteService.updateNote>[1], fields: { text?: string; time?: string; icon?: string; sort_order?: number }) {
    return dayNoteService.updateNote(id, current, fields);
  }

  remove(id: string): void {
    dayNoteService.deleteNote(id);
  }
}
