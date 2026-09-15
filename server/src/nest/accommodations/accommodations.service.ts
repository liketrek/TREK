import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { DatabaseService, type PlaceWithTags, type TripAccess } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AssignmentsService } from '../assignments/assignments.service';
import type { User } from '../../types';

type Trip = TripAccess;

type MirroredAssignment = ReturnType<AssignmentsService['createAssignment']>;

/** How a surface sends the mirror's events; see announceMirror. */
export type MirrorSender = <E extends TrekWsTripEventName>(event: E, payload: TrekWsPayload<E>) => void;

/** What a stay write did to the day plan, on top of writing the stay itself. */
export interface AccommodationMirror {
  /** The day stop the booking added, or null when that day already held the place. */
  created: MirroredAssignment | null;
  /** The booking's own stop, carried to where the booking now is. */
  moved: { assignment: MirroredAssignment; oldDayId: number } | null;
  /** Stops the booking still stands on but no longer owns (a night dropped, the place kept). */
  updated: MirroredAssignment[];
  /** Day stops the booking took back, because it moved days or was deleted. */
  removed: { id: number; dayId: number }[];
  /** The place, when this write was the one that typed it as lodging. */
  stamped: PlaceWithTags | null;
}

/** A write that left the day plan alone. Exported for the surfaces that write a
 *  stay row themselves and have to answer with a mirror either way. */
export const noStayMirror = (): AccommodationMirror => ({ created: null, moved: null, updated: [], removed: [], stamped: null });
const noMirror = noStayMirror;

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
 *
 * It also owns the day stop a booking implies. A road-trip stop IS a day
 * assignment: the rail, the server-side plan and the map all build their stops
 * from day_assignments and only look the stay up afterwards, to hang check-in
 * and check-out on one. A stay written without an assignment is therefore
 * invisible to every routing surface, which is what made people enter their
 * hotel a second time as an ordinary place. The road-trip side has always
 * written both halves in one go (the place, its day, and the stay); this is the
 * day planner catching up, in the domain that writes the stay, so the next
 * surface to book a night does not have to remember it.
 */
@Injectable()
export class AccommodationsService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly assignments: AssignmentsService,
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

  remove(id: string | number, opts: { keepStop?: boolean } = {}) {
    return this.deleteAccommodation(id, opts);
  }

  // -------------------------------------------------------------------------
  // For a surface that writes the stay row itself
  //
  // The booking form does: it fills day_accommodations straight from a hotel
  // reservation, with its own COALESCE semantics and its own field set, and
  // folding that into createAccommodation would mean bending one of the two out
  // of shape. What must not be duplicated is the stop, so these three open the
  // mirror to it and keep the SQL here.
  //
  // A night entered on the booking form is a night entered in Days: it shows in
  // the day header exactly like one added there. Road trip mode draws the same
  // booking as a service stop instead, so the stop is not a second edit to the
  // day plan, it is the same one in the other view. That is why writing it does
  // not ask for more than the booking already did.
  // -------------------------------------------------------------------------

  /** Put a freshly written stay on the map. */
  attachStayStop(accommodationId: number, placeId: number | null, dayId: number, checkIn?: string | null): AccommodationMirror {
    return this.mirrorStay(accommodationId, placeId, dayId, checkIn);
  }

  /** Carry a stay's own stop over to where the stay now is. */
  moveStayStop(accommodationId: number, placeId: number | null, dayId: number, checkIn?: string | null): AccommodationMirror {
    return this.remirrorStay(accommodationId, placeId, dayId, checkIn);
  }

  /** Take back the stops of a stay that is being deleted elsewhere. */
  dropStayStops(accommodationId: number): AccommodationMirror {
    return this.releaseStops(accommodationId, {});
  }

  /**
   * Send what a stay write did to the day plan, and let the journey skeletons
   * catch up the way an assignment route does.
   *
   * Takes the sender rather than broadcasting itself: REST and the plugin RPC
   * hand their socket id in, the MCP tools tag their events, and the fan-out is
   * the one part that must not exist in three copies.
   */
  announceMirror(tripId: string | number, mirror: AccommodationMirror, send: MirrorSender, socketId?: string): void {
    for (const stop of mirror.removed) send('assignment:deleted', { assignmentId: stop.id, dayId: stop.dayId });
    if (mirror.created) send('assignment:created', { assignment: mirror.created });
    if (mirror.moved) {
      send('assignment:moved', {
        assignment: mirror.moved.assignment,
        oldDayId: mirror.moved.oldDayId,
        newDayId: mirror.moved.assignment.day_id,
      });
    }
    for (const stop of mirror.updated) send('assignment:updated', { assignment: stop });
    if (mirror.stamped) send('place:updated', { place: mirror.stamped });

    // A night is seated by its check-in, which renumbers the stops around it. The
    // created/moved event alone puts the row at the end of the day on every other
    // screen, so the day that changed sends its order along.
    for (const dayId of this.touchedDays(mirror)) {
      const orderedIds = this.db.all<{ id: number }>(
        'SELECT id FROM day_assignments WHERE day_id = ? ORDER BY order_index', dayId).map(row => row.id);
      send('assignment:reordered', { dayId, orderedIds });
    }

    if (mirror.created || mirror.moved || mirror.removed.length > 0) this.assignments.reconcile(tripId, socketId);
  }

  /** Days whose stop order this write can have changed, each named once. */
  private touchedDays(mirror: AccommodationMirror): number[] {
    const days = new Set<number>();
    if (mirror.created) days.add(mirror.created.day_id);
    if (mirror.moved) { days.add(mirror.moved.assignment.day_id); days.add(mirror.moved.oldDayId); }
    for (const stop of mirror.removed) days.add(stop.dayId);
    return [...days];
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

  /**
   * Put the booking's check-in day on the map.
   *
   * Only the check-in day gets a stop, even for a fortnight's stay: that is the
   * day you drive there, and it is exactly what the road-trip side writes for a
   * night it books itself. The later nights ride on the stay row, which is where
   * the rail reads check-out from.
   *
   * Runs inside the caller's transaction.
   */
  /**
   * Where in the day the booked night belongs.
   *
   * Last, unless the booking names an hour. A night usually ends the day, which is why
   * that is the default — but a check-in at eleven says the traveller is at the desk
   * before whatever they pinned to the afternoon, and dropping the stop behind it built
   * a drive that visits the hotel after the sixteen-hundred it was booked around.
   *
   * Only stops that carry a clock of their own are compared. One without a time takes
   * its position from the chain, not from the hour, so pushing past it would move a
   * stop the traveller placed deliberately.
   */
  private positionForCheckIn(dayId: number, checkIn: string | null | undefined, excludeId?: number): number | undefined {
    if (!checkIn) return undefined;
    // excludeId leaves the row being re-seated out of the chain it is measured
    // against. Without it a night parked at the end of the day can find itself.
    const rows = this.db.all<{ order_index: number; at: string | null }>(`
      SELECT da.order_index, COALESCE(da.assignment_time, p.place_time) AS at
      FROM day_assignments da JOIN places p ON p.id = da.place_id
      WHERE da.day_id = ? AND da.id != ? ORDER BY da.order_index
    `, dayId, excludeId ?? -1);
    const later = rows.find(row => row.at !== null && row.at > checkIn);
    return later?.order_index;
  }

  /**
   * Whether the night already sits where its check-in says it should.
   *
   * Read off the chain rather than recomputed, because the index a fresh insert would
   * get is not the index this row already occupies. Two ways to be wrong: something
   * with a later hour ahead of it, or something with an earlier one behind it. Stops
   * without an hour are passed over in both directions — their place in the chain is
   * the traveller's doing, not a clock's.
   */
  private seatedByCheckIn(dayId: number, ownId: number, checkIn: string | null | undefined): boolean {
    if (!checkIn) return true;
    const rows = this.db.all<{ id: number; at: string | null }>(`
      SELECT da.id, COALESCE(da.assignment_time, p.place_time) AS at
      FROM day_assignments da JOIN places p ON p.id = da.place_id
      WHERE da.day_id = ? ORDER BY da.order_index
    `, dayId);
    const own = rows.findIndex(row => row.id === ownId);
    if (own < 0) return true;
    const laterAhead = rows.slice(0, own).some(row => row.at !== null && row.at > checkIn);
    const earlierBehind = rows.slice(own + 1).some(row => row.at !== null && row.at <= checkIn);
    return !laterAhead && !earlierBehind;
  }

  /**
   * Type the place as lodging, unless the traveller already typed it themselves.
   *
   * 'hotel' is a service stop: it takes no number, stays out of the day's stop
   * count and falls under the existing "show service stops in Days" switch. Without
   * the stamp a booked night made here would look nothing like one booked in the
   * road trip. Only ever filled in when it is empty: a type the traveller picked
   * (a campsite, say) is theirs.
   */
  private stampLodging(placeId: number): PlaceWithTags | null {
    const place = this.db.get<{ stop_type: string | null }>('SELECT stop_type FROM places WHERE id = ?', placeId);
    if (!place || place.stop_type) return null;
    this.db.run("UPDATE places SET stop_type = 'hotel' WHERE id = ?", placeId);
    return this.db.getPlaceWithTags(placeId);
  }

  /**
   * Carry the booking's own stop to where the booking now is, in place.
   *
   * A day stop is more than a (day, place) pair. Its participants and any road-trip
   * day boundary hang off its id by ON DELETE CASCADE, and its note, its hour and its
   * end-of-day flag live in its own columns. Deleting the row and inserting a fresh
   * one loses every bit of that, and correcting a booking's date is not a request to
   * strip the stop the traveller built on it.
   *
   * Null when the row cannot simply move, because the target day already holds that
   * place under a stop of its own: then ours has to go rather than stand beside it.
   *
   * Runs inside the caller's transaction.
   */
  private relocateOwnStop(
    stop: { id: number; day_id: number; order_index: number },
    placeId: number,
    dayId: number,
    checkIn?: string | null,
  ): MirroredAssignment | null {
    if (this.db.get('SELECT id FROM day_assignments WHERE day_id = ? AND place_id = ? AND id != ?', dayId, placeId, stop.id)) {
      return null;
    }

    // Close the gap the row leaves behind. A no-op when it is not changing days,
    // because it is put back into that same numbering two statements down.
    this.db.run(
      'UPDATE day_assignments SET order_index = order_index - 1 WHERE day_id = ? AND order_index > ?',
      stop.day_id, stop.order_index,
    );

    // Park it at the end of the target day first, then seat it by the check-in the
    // same way a fresh insert would. Two steps, because the index it should get is
    // read off the chain it is not part of yet.
    const max = this.db.get<{ max: number | null }>(
      'SELECT MAX(order_index) AS max FROM day_assignments WHERE day_id = ? AND id != ?', dayId, stop.id)!;
    const end = (max.max !== null ? max.max : -1) + 1;
    this.db.run('UPDATE day_assignments SET day_id = ?, place_id = ?, order_index = ? WHERE id = ?', dayId, placeId, end, stop.id);

    const seat = this.positionForCheckIn(dayId, checkIn, stop.id);
    if (seat !== undefined && seat < end) {
      this.db.run(
        'UPDATE day_assignments SET order_index = order_index + 1 WHERE day_id = ? AND order_index >= ? AND id != ?',
        dayId, seat, stop.id,
      );
      this.db.run('UPDATE day_assignments SET order_index = ? WHERE id = ?', seat, stop.id);
    }

    return this.assignments.getAssignmentWithPlace(stop.id);
  }

  private mirrorStay(accommodationId: number, placeId: number | null, dayId: number, checkIn?: string | null): AccommodationMirror {
    const mirror = noMirror();
    // A stay can outlive its place (place_id is ON DELETE SET NULL) and the booking
    // form writes stays that never had one. Nothing to put on the map then.
    if (!placeId) return mirror;

    mirror.stamped = this.stampLodging(placeId);

    // The road-trip flow assigns the place to the day and only then books the night.
    // Claiming that row would make cancelling the booking delete a stop the traveller
    // placed, so the booking rides along with it and marks nothing as its own. Same
    // answer for a place already planned for that day by hand.
    if (this.db.get('SELECT id FROM day_assignments WHERE day_id = ? AND place_id = ?', dayId, placeId)) return mirror;

    // Through AssignmentsService, so the stop lands at the end of the day with the
    // order_index every other new assignment gets. Evening is where you arrive at a
    // hotel, and the day planner has no drive to position it against anyway.
    //
    // The booking id goes in with the INSERT, not as an UPDATE afterwards: what this
    // returns is the row the answer hands the client, and stamping the id on later
    // would leave that copy without it. The day list has nothing else to tell the
    // stop from a place the traveller added, so it would show the hotel a second
    // time until the next reload.
    mirror.created = this.assignments.createAssignment(dayId, placeId, null, {
      accommodationId,
      orderIndex: this.positionForCheckIn(dayId, checkIn),
    });
    return mirror;
  }

  /** The day stops this booking, and only this booking, put on the plan. */
  private ownStops(accommodationId: number) {
    return this.db.all<{ id: number; day_id: number; place_id: number; order_index: number }>(
      'SELECT id, day_id, place_id, order_index FROM day_assignments WHERE accommodation_id = ?', accommodationId
    );
  }

  /**
   * Let go of the stops a booking owns, because the booking is going away.
   *
   * Only the ones it put there itself. A stop the traveller placed and then
   * booked a night at keeps standing, which is how cancelling a night in the road
   * trip has always behaved.
   *
   * keepStop hands it to the traveller instead of taking it away. That is the road
   * trip popup turning a night back into a pause: they asked to drop the booking,
   * not the place, and the stop is mid-drive where re-adding it would land it at
   * the end of the day.
   *
   * Runs inside the caller's transaction.
   */
  private releaseStops(accommodationId: number, opts: { keepStop?: boolean }): AccommodationMirror {
    const mirror = noMirror();
    for (const stop of this.ownStops(accommodationId)) {
      if (opts.keepStop) {
        this.db.run('UPDATE day_assignments SET accommodation_id = NULL WHERE id = ?', stop.id);
        // The stop stays, but it is the traveller's now. Days hides a stop whose
        // accommodation_id is set, so a client left holding the old row keeps the
        // place invisible on a day it is standing on.
        const released = this.assignments.getAssignmentWithPlace(stop.id);
        if (released) mirror.updated.push(released);
        continue;
      }
      this.db.run('DELETE FROM day_assignments WHERE id = ?', stop.id);
      mirror.removed.push({ id: stop.id, dayId: stop.day_id });
    }
    return mirror;
  }

  /**
   * Carry the mirrored stop over to wherever the booking now is.
   *
   * Only its own stop moves. A booking that owns none is one whose stop belongs to
   * the traveller: booked in road trip mode, where the place was put on the day
   * first, or booked for a place they had already planned there. Moving that is not
   * ours to do, and putting a second one on the new day next to it is exactly the
   * duplicate this whole change is meant to remove. Stays booked before any of this
   * existed get their stop from the migration, not from the next edit.
   *
   * Runs inside the caller's transaction.
   */
  private remirrorStay(accommodationId: number, placeId: number | null, dayId: number, checkIn?: string | null): AccommodationMirror {
    const own = this.ownStops(accommodationId);
    if (own.length === 0) return noMirror();
    if (own.length === 1 && own[0].day_id === dayId && own[0].place_id === placeId) {
      // Same place, same day — but a check-in moved to a different hour can still put
      // the night somewhere else in the chain, and a stop sitting after the afternoon
      // it was booked around is the plan reading back wrong.
      if (this.seatedByCheckIn(dayId, own[0].id, checkIn)) return noMirror();
    }

    const mirror = noMirror();

    // One stop is the ordinary case, and it can be carried across rather than
    // rebuilt. Everything hanging off the row survives that: its participants, its
    // note, its hour, its end-of-day flag and the road-trip day boundary anchored
    // on its id, all of which a DELETE takes with it.
    if (own.length === 1 && placeId) {
      const moved = this.relocateOwnStop(own[0], placeId, dayId, checkIn);
      if (moved) {
        mirror.moved = { assignment: moved, oldDayId: own[0].day_id };
        mirror.stamped = this.stampLodging(placeId);
        return mirror;
      }
    }

    for (const stop of own) {
      this.db.run('DELETE FROM day_assignments WHERE id = ?', stop.id);
      mirror.removed.push({ id: stop.id, dayId: stop.day_id });
    }
    const fresh = this.mirrorStay(accommodationId, placeId, dayId, checkIn);
    mirror.created = fresh.created;
    mirror.stamped = fresh.stamped;
    return mirror;
  }

  createAccommodation(tripId: string | number, data: CreateAccommodationData) {
    const { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } = data;

    // The stay, its partner hotel reservation and the day stop it implies are one
    // logical write, and an atomic one, so a failed insert halfway can't leave an orphan.
    const written = this.db.transaction(() => {
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

      return { accommodationId: newId, mirror: this.mirrorStay(Number(newId), place_id ?? null, start_day_id, check_in) };
    });

    return { accommodation: this.getAccommodationWithPlace(written.accommodationId), mirror: written.mirror };
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

    // The stay row and the day stop that mirrors it describe the same booking, so a
    // move that wrote only one of the two must not survive.
    const mirror = this.db.transaction(() => {
      this.db.run(
        'UPDATE day_accommodations SET place_id = ?, start_day_id = ?, end_day_id = ?, check_in = ?, check_in_end = ?, check_out = ?, confirmation = ?, notes = ? WHERE id = ?',
        newPlaceId, newStartDayId, newEndDayId, newCheckIn, newCheckInEnd, newCheckOut, newConfirmation, newNotes, id
      );
      return this.remirrorStay(Number(id), newPlaceId, newStartDayId, newCheckIn);
    });

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

    return { accommodation: this.getAccommodationWithPlace(Number(id)), mirror };
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
  deleteAccommodation(id: string | number, opts: { keepStop?: boolean } = {}): {
    linkedReservationId: number | null;
    deletedBudgetItemId: number | null;
    linkedReservationIds: number[];
    deletedBudgetItemIds: number[];
    mirror: AccommodationMirror;
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

      const mirror = this.releaseStops(Number(id), opts);

      this.db.run('DELETE FROM day_accommodations WHERE id = ?', id);
      const linkedReservationIds = linkedRes.map(r => r.id);
      return {
        linkedReservationId: linkedReservationIds[0] ?? null,
        deletedBudgetItemId: deletedBudgetItemIds[0] ?? null,
        linkedReservationIds,
        deletedBudgetItemIds,
        mirror,
      };
    });
  }
}
