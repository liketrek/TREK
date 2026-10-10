import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { NOTE_COLORS, type TrekWsPayload, type TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import type { DayNote, User } from '../../types';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import { DayNotes } from '../../db/entities/DayNotes.entity';
import type { DayNotesRepository } from '../../db/repositories/DayNotes.repository';
import { Days } from '../../db/entities/Days.entity';
import type { DaysRepository } from '../../db/repositories/Days.repository';
import { TripAccessService } from '../trip-membership/trip-access.service';

/**
 * Day-notes domain service — the legacy dayNoteService SQL folded in over
 * the injected DatabaseService (byte-identical statements and
 * coercions). Trip access rides TripsRepository.findAccessible; the
 * 'day_edit' permission reuses the legacy check.
 *
 * Plan 4 Task 1: the seven `day_notes`/`days` reads/writes below moved off
 * `DatabaseService` onto `DayNotesRepository`/`DaysRepository.existsInTrip`.
 * Plan 4 Task 2: `verifyTripAccess`'s `canAccessTrip` delegate is now
 * `TripsRepository.findAccessible` directly — `DatabaseService` is gone from
 * this file entirely.
 */
/**
 * Only a colour the palette actually offers reaches the column (#1629).
 *
 * The Zod contract can only say "a short string" — it has no way to express the
 * palette without pinning the UI's choices into the wire format — so the check
 * that matters lives here. Anything else is stored as "no colour", which is the
 * neutral card, rather than being rejected: a bad colour is not a reason to lose
 * the note someone just wrote.
 */
export function normalizeNoteColor(color: string | null | undefined): string | null {
  if (!color) return null;
  return (NOTE_COLORS as readonly string[]).includes(color) ? color : null;
}

@Injectable()
export class DayNotesService {
  constructor(
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is gone:
    // this injects TripAccessService (trip-membership) (same constructor slot) and
    // calls findAccessible.
    private readonly trips: TripAccessService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    @InjectRepository(DayNotes) private readonly dayNotes: DayNotesRepository,
    @InjectRepository(Days) private readonly days: DaysRepository,
  ) {}

  async verifyTripAccess(tripId: string | number, userId: number): Promise<TripAccess | undefined> {
    return await this.trips.findAccessible(tripId, userId);
  }

  async canEdit(trip: TripAccess, user: User): Promise<boolean> {
    return this.permissions.checkPermission('day_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  async list(dayId: string | number, tripId: string | number) {
    return this.dayNotes.listByDayAndTrip(dayId, tripId);
  }

  async dayExists(dayId: string | number, tripId: string | number) {
    return this.days.existsInTrip(dayId, tripId);
  }

  async getNote(id: string | number, dayId: string | number, tripId: string | number) {
    return this.dayNotes.findByIdDayTrip(id, dayId, tripId);
  }

  async create(dayId: string | number, tripId: string | number, text: string, time?: string | null, icon?: string | null, sortOrder?: number, color?: string | null) {
    // `dayId`/`tripId` bind raw (D4's T5 escape hatch, matching the legacy
    // statement's own no-conversion bind) — `createNote`'s column set wants
    // numbers, but every real caller here already passes an id that matched
    // a route/permission check earlier in the request; `Number(...)` mirrors
    // that seam exactly (same shape `TripMembersRepository.addIgnoringConflict`'s
    // docstring documents for an INSERT-shaped write behind a raw-bind guard).
    return this.dayNotes.createNote({
      day_id: Number(dayId),
      trip_id: Number(tripId),
      text: text.trim(),
      time: time || null,
      icon: icon || '📝',
      sort_order: sortOrder ?? 9999,
      color: normalizeNoteColor(color),
    });
  }

  async update(id: string | number, current: DayNote, fields: { text?: string; time?: string | null; icon?: string | null; sort_order?: number; color?: string | null }) {
    return this.dayNotes.updateNote(id, {
      text: fields.text !== undefined ? fields.text.trim() : current.text,
      time: fields.time !== undefined ? fields.time : current.time,
      icon: fields.icon !== undefined ? fields.icon : current.icon,
      sort_order: fields.sort_order !== undefined ? fields.sort_order : current.sort_order,
      color: fields.color !== undefined ? normalizeNoteColor(fields.color) : (current.color ?? null),
    });
  }

  async remove(id: string | number): Promise<void> {
    await this.dayNotes.deleteById(id);
  }
}
