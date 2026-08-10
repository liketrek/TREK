import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import type { DayNote, User } from '../../types';
import { DatabaseService, type TripAccess } from '../database/database.service';

/**
 * Day-notes domain service — the legacy dayNoteService SQL folded in over
 * the injected DatabaseService (byte-identical statements and
 * coercions). Trip access rides DatabaseService.canAccessTrip; the 'day_edit'
 * permission reuses the legacy check.
 */
@Injectable()
export class DayNotesService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
  ) {}

  verifyTripAccess(tripId: string | number, userId: number): TripAccess | undefined {
    return this.dbs.canAccessTrip(tripId, userId);
  }

  canEdit(trip: TripAccess, user: User): boolean {
    return this.permissions.checkPermission('day_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  list(dayId: string | number, tripId: string | number) {
    return this.dbs.all(
      'SELECT * FROM day_notes WHERE day_id = ? AND trip_id = ? ORDER BY sort_order ASC, created_at ASC',
      dayId, tripId,
    );
  }

  dayExists(dayId: string | number, tripId: string | number) {
    return this.dbs.get('SELECT id FROM days WHERE id = ? AND trip_id = ?', dayId, tripId);
  }

  getNote(id: string | number, dayId: string | number, tripId: string | number) {
    return this.dbs.get<DayNote>('SELECT * FROM day_notes WHERE id = ? AND day_id = ? AND trip_id = ?', id, dayId, tripId);
  }

  create(dayId: string | number, tripId: string | number, text: string, time?: string | null, icon?: string | null, sortOrder?: number) {
    const result = this.dbs.run(
      'INSERT INTO day_notes (day_id, trip_id, text, time, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      dayId, tripId, text.trim(), time || null, icon || '📝', sortOrder ?? 9999,
    );
    return this.dbs.get('SELECT * FROM day_notes WHERE id = ?', result.lastInsertRowid);
  }

  update(id: string | number, current: DayNote, fields: { text?: string; time?: string | null; icon?: string | null; sort_order?: number }) {
    this.dbs.run(
      'UPDATE day_notes SET text = ?, time = ?, icon = ?, sort_order = ? WHERE id = ?',
      fields.text !== undefined ? fields.text.trim() : current.text,
      fields.time !== undefined ? fields.time : current.time,
      fields.icon !== undefined ? fields.icon : current.icon,
      fields.sort_order !== undefined ? fields.sort_order : current.sort_order,
      id,
    );
    return this.dbs.get('SELECT * FROM day_notes WHERE id = ?', id);
  }

  remove(id: string | number): void {
    this.dbs.run('DELETE FROM day_notes WHERE id = ?', id);
  }
}
