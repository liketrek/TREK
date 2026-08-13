import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { DatabaseService, type TripAccess } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import type { User } from '../../types';

type Trip = TripAccess;

export interface DayAccommodation {
  id: number;
  trip_id: number;
  place_id: number | null;
  start_day_id: number;
  end_day_id: number;
  check_in: string | null;
  check_in_end: string | null;
  check_out: string | null;
  confirmation: string | null;
  notes: string | null;
}

export interface CreateAccommodationData {
  place_id: number;
  start_day_id: number;
  end_day_id: number;
  check_in?: string;
  check_in_end?: string;
  check_out?: string;
  confirmation?: string;
  notes?: string;
}

/**
 * Accommodations: the stay rows in day_accommodations plus the hotel reservation
 * and budget item that hang off them.
 *
 * The SQL used to live on DaysService while this class owned the routes and
 * delegated every call into it — one fachlichkeit split across two modules.
 * The statements moved here unchanged. What deliberately stayed in days/ is the
 * reorder side: assertNoInvertedAccommodation and resyncAccommodationDays are
 * about re-dating day rows, and the accommodation is the thing being carried,
 * not the thing doing the carrying.
 *
 * Still gated by 'day_edit', the same permission as days.
 */
@Injectable()
export class AccommodationsService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
  ) {}

  private get db() {
    return this.dbs;
  }

  /** Owner or member, returning the trip. Takes a number too: the MCP tools pass
   *  the parsed id, the REST path the raw param. */
  verifyTripAccess(tripId: string | number, userId: number) {
    return this.dbs.canAccessTrip(Number(tripId), userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return this.permissions.checkPermission('day_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  // -------------------------------------------------------------------------
  // The route-facing names the controller has always used.
  // -------------------------------------------------------------------------

  list(tripId: string | number) {
    return this.listAccommodations(tripId);
  }

  validateRefs(tripId: string | number, placeId?: number, startDayId?: number, endDayId?: number) {
    return this.validateAccommodationRefs(tripId, placeId, startDayId, endDayId);
  }

  get(id: string | number, tripId: string | number) {
    return this.getAccommodation(id, tripId);
  }

  create(tripId: string | number, data: CreateAccommodationData) {
    return this.createAccommodation(tripId, data);
  }

  update(id: string | number, existing: DayAccommodation, fields: Parameters<AccommodationsService['updateAccommodation']>[2]) {
    return this.updateAccommodation(id, existing, fields);
  }

  remove(id: string | number) {
    return this.deleteAccommodation(id);
  }

  // -------------------------------------------------------------------------
  // Accommodation CRUD
  // -------------------------------------------------------------------------


  private getAccommodationWithPlace(id: number | bigint) {
    return this.db.get(`
    SELECT a.*, p.name as place_name, p.address as place_address, p.image_url as place_image, p.lat as place_lat, p.lng as place_lng
    FROM day_accommodations a
    LEFT JOIN places p ON a.place_id = p.id
    WHERE a.id = ?
  `, id);
  }

  listAccommodations(tripId: string | number) {
    return this.db.all(`
    SELECT a.*, p.name as place_name, p.address as place_address, p.image_url as place_image, p.lat as place_lat, p.lng as place_lng,
           r.title as reservation_title
    FROM day_accommodations a
    LEFT JOIN places p ON a.place_id = p.id
    LEFT JOIN reservations r ON r.accommodation_id = a.id
    WHERE a.trip_id = ?
    ORDER BY a.created_at ASC
  `, tripId);
  }

  validateAccommodationRefs(tripId: string | number, placeId?: number, startDayId?: number, endDayId?: number) {
    const errors: { field: string; message: string }[] = [];
    if (placeId !== undefined) {
      const place = this.db.get('SELECT id FROM places WHERE id = ? AND trip_id = ?', placeId, tripId);
      if (!place) errors.push({ field: 'place_id', message: 'Place not found' });
    }
    if (startDayId !== undefined) {
      const startDay = this.db.get('SELECT id FROM days WHERE id = ? AND trip_id = ?', startDayId, tripId);
      if (!startDay) errors.push({ field: 'start_day_id', message: 'Start day not found' });
    }
    if (endDayId !== undefined) {
      const endDay = this.db.get('SELECT id FROM days WHERE id = ? AND trip_id = ?', endDayId, tripId);
      if (!endDay) errors.push({ field: 'end_day_id', message: 'End day not found' });
    }
    return errors;
  }

  createAccommodation(tripId: string | number, data: CreateAccommodationData) {
    const { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } = data;

    // The stay and its partner hotel reservation are one logical write —
    // atomic, so a failed reservation insert can't leave an orphan stay.
    const accommodationId = this.db.transaction(() => {
      const result = this.db.run(
        'INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        tripId, place_id, start_day_id, end_day_id, check_in || null, check_in_end || null, check_out || null, confirmation || null, notes || null
      );

      const newId = result.lastInsertRowid;

      // Auto-create linked reservation for this accommodation
      const placeName = this.db.get<{ name: string }>('SELECT name FROM places WHERE id = ?', place_id)?.name || 'Hotel';
      const startDayDate = this.db.get<{ date: string }>('SELECT date FROM days WHERE id = ?', start_day_id)?.date || null;
      const meta: Record<string, string> = {};
      if (check_in) meta.check_in_time = check_in;
      if (check_in_end) meta.check_in_end_time = check_in_end;
      if (check_out) meta.check_out_time = check_out;
      this.db.run(`
    INSERT INTO reservations (trip_id, day_id, title, reservation_time, location, confirmation_number, notes, status, type, accommodation_id, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', 'hotel', ?, ?)
  `,
        tripId, start_day_id, placeName, startDayDate || null, null,
        confirmation || null, notes || null, newId,
        Object.keys(meta).length > 0 ? JSON.stringify(meta) : null
      );

      return newId;
    });

    return this.getAccommodationWithPlace(accommodationId);
  }

  getAccommodation(id: string | number, tripId: string | number) {
    return this.db.get<DayAccommodation>('SELECT * FROM day_accommodations WHERE id = ? AND trip_id = ?', id, tripId);
  }

  updateAccommodation(id: string | number, existing: DayAccommodation, fields: {
    place_id?: number; start_day_id?: number; end_day_id?: number;
    check_in?: string; check_in_end?: string; check_out?: string; confirmation?: string; notes?: string;
  }) {
    const newPlaceId = fields.place_id !== undefined ? fields.place_id : existing.place_id;
    const newStartDayId = fields.start_day_id !== undefined ? fields.start_day_id : existing.start_day_id;
    const newEndDayId = fields.end_day_id !== undefined ? fields.end_day_id : existing.end_day_id;
    const newCheckIn = fields.check_in !== undefined ? fields.check_in : existing.check_in;
    const newCheckInEnd = fields.check_in_end !== undefined ? fields.check_in_end : existing.check_in_end;
    const newCheckOut = fields.check_out !== undefined ? fields.check_out : existing.check_out;
    const newConfirmation = fields.confirmation !== undefined ? fields.confirmation : existing.confirmation;
    const newNotes = fields.notes !== undefined ? fields.notes : existing.notes;

    this.db.run(
      'UPDATE day_accommodations SET place_id = ?, start_day_id = ?, end_day_id = ?, check_in = ?, check_in_end = ?, check_out = ?, confirmation = ?, notes = ? WHERE id = ?',
      newPlaceId, newStartDayId, newEndDayId, newCheckIn, newCheckInEnd, newCheckOut, newConfirmation, newNotes, id
    );

    // Sync check-in/out/confirmation to every linked reservation. The booking form
    // lets more than one hotel booking point at the same block and there is no
    // unique constraint on reservations.accommodation_id, so a single .get() would
    // silently leave the others on the old times.
    const linkedRes = this.db.all<{ id: number; metadata: string | null }>('SELECT id, metadata FROM reservations WHERE accommodation_id = ?', Number(id));
    for (const res of linkedRes) {
      const meta = res.metadata ? JSON.parse(res.metadata) : {};
      if (newCheckIn) meta.check_in_time = newCheckIn;
      if (newCheckInEnd) meta.check_in_end_time = newCheckInEnd;
      if (newCheckOut) meta.check_out_time = newCheckOut;
      this.db.run('UPDATE reservations SET metadata = ?, confirmation_number = COALESCE(?, confirmation_number) WHERE id = ?',
        JSON.stringify(meta), newConfirmation || null, res.id);
    }

    return this.getAccommodationWithPlace(Number(id));
  }

  /**
   * Delete accommodation and its linked reservations (and any linked budget items),
   * atomically.
   *
   * Takes ALL linked reservations, not just the first: reservations.accommodation_id
   * carries no foreign key and no unique constraint, so a second booking pointed at
   * the same block used to survive the delete as a row referencing an accommodation
   * that no longer exists. `linkedReservationId` / `deletedBudgetItemId` stay on the
   * result as the first of each, because the RPC, MCP and REST callers read them.
   */
  deleteAccommodation(id: string | number): {
    linkedReservationId: number | null;
    deletedBudgetItemId: number | null;
    linkedReservationIds: number[];
    deletedBudgetItemIds: number[];
  } {
    return this.db.transaction(() => {
      const linkedRes = this.db.all<{ id: number }>('SELECT id FROM reservations WHERE accommodation_id = ?', Number(id));
      const deletedBudgetItemIds: number[] = [];
      for (const res of linkedRes) {
        const linkedBudget = this.db.get<{ id: number }>('SELECT id FROM budget_items WHERE reservation_id = ?', res.id);
        if (linkedBudget) {
          this.db.run('DELETE FROM budget_items WHERE id = ?', linkedBudget.id);
          deletedBudgetItemIds.push(linkedBudget.id);
        }
        this.db.run('DELETE FROM reservations WHERE id = ?', res.id);
      }

      this.db.run('DELETE FROM day_accommodations WHERE id = ?', id);
      const linkedReservationIds = linkedRes.map(r => r.id);
      return {
        linkedReservationId: linkedReservationIds[0] ?? null,
        deletedBudgetItemId: deletedBudgetItemIds[0] ?? null,
        linkedReservationIds,
        deletedBudgetItemIds,
      };
    });
  }
}
