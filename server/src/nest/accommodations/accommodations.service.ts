import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { RoadtripVia, TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { UnitOfWork } from '../database/unit-of-work';
import { PermissionsService } from '../permissions/permissions.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { toRowId, legacyBoundIntegerText } from '../common/row-id';
import { DayAccommodations } from '../../db/entities/DayAccommodations.entity';
import type { DayAccommodationsRepository, DayAccommodationRow } from '../../db/repositories/DayAccommodations.repository';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import type { DayAssignmentsRepository } from '../../db/repositories/DayAssignments.repository';
import { Places } from '../../db/entities/Places.entity';
import type { PlacesRepository, PlaceWithTagsRow as PlaceWithTags } from '../../db/repositories/Places.repository';
import { Days } from '../../db/entities/Days.entity';
import type { DaysRepository } from '../../db/repositories/Days.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository, TripAccess } from '../../db/repositories/Trips.repository';
import { RoadtripVias } from '../../db/entities/RoadtripVias.entity';
import type { RoadtripViasRepository } from '../../db/repositories/RoadtripVias.repository';
import { Reservations } from '../../db/entities/Reservations.entity';
import type { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import type { BudgetItemsRepository } from '../../db/repositories/BudgetItems.repository';
import { carryViasWith, locatedStopIdsWith, reseatOwnStopWith, seatHolds, seatIndexAmong, seatIndexWith, type Night } from './night-seat';
import type { User } from '../../types';

type Trip = TripAccess;

type MirroredAssignment = Awaited<ReturnType<AssignmentsService['createAssignment']>>;

/** One day's drawn roads after a write re-pinned them, as the road trip broadcasts them. */
type DayVias = { dayId: number; vias: RoadtripVia[] };

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
  /** Days whose drawn roads were re-pinned because a stop of theirs changed position.
   *  Absent when none did, which is what a mirror built elsewhere means too. */
  vias?: DayVias[];
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
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly assignments: AssignmentsService,
    private readonly uow: UnitOfWork,
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is gone:
    // this injects TripsRepository directly and calls findAccessible.
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(DayAccommodations) private readonly dayAccommodationsRepo: DayAccommodationsRepository,
    @InjectRepository(DayAssignments) private readonly dayAssignmentsRepo: DayAssignmentsRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    @InjectRepository(Days) private readonly daysRepo: DaysRepository,
    @InjectRepository(RoadtripVias) private readonly roadtripViasRepo: RoadtripViasRepository,
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    // Plan 3e Task 2 (budget) — additive, AC41/42 only.
    @InjectRepository(BudgetItems) private readonly budgetItemsRepo: BudgetItemsRepository,
  ) {}

  /** Owner or member, returning the trip. Takes a number too: the MCP tools pass
   *  the parsed id, the REST path the raw param. */
  async verifyTripAccess(tripId: string | number, userId: number) {
    return await this.trips.findAccessible(Number(tripId), userId);
  }

  async canEdit(trip: Trip, user: User): Promise<boolean> {
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
  async attachStayStop(accommodationId: number, placeId: number | null, dayId: number, checkIn?: string | null): Promise<AccommodationMirror> {
    return this.mirrorStay(accommodationId, placeId, dayId, checkIn);
  }

  /** Carry a stay's own stop over to where the stay now is. `checkInChanged` says the
   *  booking was given a new hour, which seats the night afresh (see remirrorStay). */
  async moveStayStop(
    accommodationId: number,
    placeId: number | null,
    dayId: number,
    checkIn?: string | null,
    opts: { checkInChanged?: boolean } = {},
  ): Promise<AccommodationMirror> {
    return this.remirrorStay(accommodationId, placeId, dayId, checkIn, opts);
  }

  /** Take back the stops of a stay that is being deleted elsewhere. */
  async dropStayStops(accommodationId: number): Promise<AccommodationMirror> {
    return this.releaseStops(accommodationId, {});
  }

  /**
   * PL16 (`PlacesService.cancelStaysAt`) — the stays booked at a place, by
   * id. `PlacesService` reaches this repository read through the
   * `AccommodationsService` it already injects (for the cascade itself)
   * rather than a `DayAccommodationsRepository` dependency of its own —
   * avoids widening `PlacesService`'s constructor (and the shared positional
   * test-helper wiring several other suites depend on) for one read.
   */
  async listStayIdsForPlace(tripId: number, placeId: number): Promise<number[]> {
    const stays = await this.dayAccommodationsRepo.listForPlace(tripId, placeId);
    return stays.map(s => s.id);
  }

  /**
   * Send what a stay write did to the day plan, and let the journey skeletons
   * catch up the way an assignment route does.
   *
   * Takes the sender rather than broadcasting itself: the MCP tools tag their
   * events, REST and the plugin RPC send them plain, and the fan-out is the one
   * part that must not exist in three copies. None of them skips the socket that
   * sent the request. The day order and the vias sent here are news to that
   * session too, and they only make sense arriving behind the stop they concern.
   */
  async announceMirror(tripId: string | number, mirror: AccommodationMirror, send: MirrorSender, socketId?: string): Promise<void> {
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
    for (const dayId of await this.touchedDays(mirror)) {
      // AC1
      const orderedIds = await this.dayAssignmentsRepo.listIdsForDay(dayId);
      send('assignment:reordered', { dayId, orderedIds });
    }
    // After the order, the way the time sort sends them: the planner routes the
    // anchors it holds against the order it holds, and the two have to land together.
    for (const day of mirror.vias ?? []) send('roadtripVia:changed', day);

    if (mirror.created || mirror.moved || mirror.removed.length > 0) await this.assignments.reconcile(tripId, socketId);
  }

  /** Days whose stop order this write can have changed, each named once. */
  private async touchedDays(mirror: AccommodationMirror): Promise<number[]> {
    const days = new Set<number>();
    if (mirror.created) days.add(mirror.created.day_id);
    if (mirror.moved) { days.add(mirror.moved.assignment.day_id); days.add(mirror.moved.oldDayId); }
    for (const stop of mirror.removed) days.add(stop.dayId);
    return [...days];
  }

  // -------------------------------------------------------------------------
  // Accommodation CRUD
  // -------------------------------------------------------------------------


  private async getAccommodationWithPlace(id: number) {
    // AC2
    return await this.dayAccommodationsRepo.findWithPlace(id);
  }

  async listAccommodations(tripId: string | number) {
    // AC3
    return await this.dayAccommodationsRepo.listForTripWithPlaceAndBooking(tripId);
  }

  async validateAccommodationRefs(tripId: string | number, placeId?: number, startDayId?: number, endDayId?: number) {
    const errors: { field: string; message: string }[] = [];
    if (placeId !== undefined) {
      // AC4
      const place = await this.placesRepo.existsInTrip(placeId, Number(tripId));
      if (!place) errors.push({ field: 'place_id', message: 'Place not found' });
    }
    if (startDayId !== undefined) {
      // AC5
      const startDay = await this.daysRepo.existsInTrip(startDayId, tripId);
      if (!startDay) errors.push({ field: 'start_day_id', message: 'Start day not found' });
    }
    if (endDayId !== undefined) {
      // AC6
      const endDay = await this.daysRepo.existsInTrip(endDayId, tripId);
      if (!endDay) errors.push({ field: 'end_day_id', message: 'End day not found' });
    }
    return errors;
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
  private async stampLodging(placeId: number): Promise<PlaceWithTags | null> {
    // AC9
    const place = await this.placesRepo.getStopType(placeId);
    if (!place || place.stop_type) return null;
    // AC10
    await this.placesRepo.stampHotel(placeId);
    // AC11 — Plan 4 Task 3: `DatabaseService.getPlaceWithTags` inlined onto
    // `PlacesRepository.findWithTagsAndRatings` directly (`placesRepo` was
    // already injected below for other reads).
    return await this.placesRepo.findWithTagsAndRatings(placeId);
  }

  /**
   * Each day's located stops in order, taken before a write that can move them.
   *
   * That order is the index space the day's vias are pinned to: a via sits behind
   * the n-th stop that has coordinates, not behind a row id. Stops without
   * coordinates are never routed and so never counted.
   */
  private async stopOrders(dayIds: number[]): Promise<Map<number, number[]>> {
    const result = new Map<number, number[]>();
    for (const dayId of new Set(dayIds)) {
      // AC7
      result.set(dayId, await locatedStopIdsWith(this.dayAssignmentsRepo, dayId));
    }
    return result;
  }

  /**
   * Keep every drawn road behind the stop it was drawn after, now that this write
   * has seated, moved or taken out a stop on these days (planViaCarry has the rules).
   *
   * A night seated by its check-in ahead of the afternoon renumbers everything
   * behind it, and a via pinned to position one would otherwise bend the drive
   * into the hotel instead of the leg it was drawn on. Persisted and visible to
   * everyone, so it is put right where the stop moved and reported on the mirror.
   *
   * Runs inside the caller's transaction.
   */
  private async reanchorVias(mirror: AccommodationMirror, before: Map<number, number[]>): Promise<void> {
    for (const [dayId, previousIds] of before) {
      // AC7
      const nextIds = await locatedStopIdsWith(this.dayAssignmentsRepo, dayId);
      // AC13/AC14/AC15/AC17 (night-seat.ts `carryViasWith`)
      if (!(await carryViasWith(this.roadtripViasRepo, dayId, previousIds, nextIds))) continue;
      // AC16
      this.noteVias(mirror, { dayId, vias: await this.roadtripViasRepo.listForDay(dayId) });
    }
  }

  /** One entry per day: a write that takes a stop off a day and puts one back on
   *  the same day reports the state it left behind, not both steps. */
  private noteVias(mirror: AccommodationMirror, day: DayVias): void {
    mirror.vias = [...(mirror.vias ?? []).filter(known => known.dayId !== day.dayId), day];
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
  private async relocateOwnStop(
    stop: { id: number; day_id: number; order_index: number | null },
    placeId: number,
    dayId: number,
    night: Night,
  ): Promise<MirroredAssignment | null> {
    // AC18
    if (await this.dayAssignmentsRepo.existsForDayAndPlace(dayId, placeId, stop.id)) {
      return null;
    }
    // AC19/AC20/AC21/AC22/AC23 (night-seat.ts `reseatOwnStopWith`)
    await reseatOwnStopWith(this.dayAssignmentsRepo, stop, placeId, dayId, night);
    return this.assignments.getAssignmentWithPlace(stop.id);
  }

  /**
   * Put the booking's check-in day on the map.
   *
   * Only the check-in day gets a stop, even for a fortnight's stay: that is the
   * day you drive there, and it is exactly what the road-trip side writes for a
   * night it books itself. The later nights ride on the stay row: a trip that
   * starts and ends its days at the stay seats the hotel at the edges of the days
   * around them from it (`seatNightBookends`), and reads the check-out there as a
   * label only.
   *
   * Runs inside the caller's transaction.
   */
  private async mirrorStay(accommodationId: number, placeId: number | null, dayId: number, checkIn?: string | null): Promise<AccommodationMirror> {
    const mirror = noMirror();
    // A stay can outlive its place (place_id is ON DELETE SET NULL) and the booking
    // form writes stays that never had one. Nothing to put on the map then.
    if (!placeId) return mirror;

    mirror.stamped = await this.stampLodging(placeId);

    // The road-trip flow assigns the place to the day and only then books the night.
    // Claiming that row would make cancelling the booking delete a stop the traveller
    // placed, so the booking rides along with it and marks nothing as its own. Same
    // answer for a place already planned for that day by hand.
    // AC24
    if (await this.dayAssignmentsRepo.existsForDayAndPlace(dayId, placeId)) return mirror;

    const before = await this.stopOrders([dayId]);
    // Through AssignmentsService, seated where the check-in says (night-seat.ts),
    // with everything behind it moved up one.
    //
    // The booking id goes in with the INSERT, not as an UPDATE afterwards: what this
    // returns is the row the answer hands the client, and stamping the id on later
    // would leave that copy without it. The day list has nothing else to tell the
    // stop from a place the traveller added, so it would show the hotel a second
    // time until the next reload.
    mirror.created = await this.assignments.createAssignment(dayId, placeId, null, {
      accommodationId,
      // AC7
      orderIndex: await seatIndexWith(this.dayAssignmentsRepo, dayId, { id: accommodationId, check_in: checkIn }),
    });
    await this.reanchorVias(mirror, before);
    return mirror;
  }

  /** The day stops this booking, and only this booking, put on the plan. */
  private async ownStops(accommodationId: number) {
    // AC25
    return await this.dayAssignmentsRepo.listOwnedByStay(accommodationId);
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
  private async releaseStops(accommodationId: number, opts: { keepStop?: boolean }): Promise<AccommodationMirror> {
    const mirror = noMirror();
    const own = await this.ownStops(accommodationId);
    const before = await this.stopOrders(own.map(stop => stop.day_id));
    for (const stop of own) {
      if (opts.keepStop) {
        // AC26
        await this.dayAssignmentsRepo.clearStay(stop.id);
        // The stop stays, but it is the traveller's now. Days hides a stop whose
        // accommodation_id is set, so a client left holding the old row keeps the
        // place invisible on a day it is standing on.
        const released = await this.assignments.getAssignmentWithPlace(stop.id);
        if (released) mirror.updated.push(released);
        continue;
      }
      // AC27
      await this.dayAssignmentsRepo.deleteById(stop.id);
      mirror.removed.push({ id: stop.id, dayId: stop.day_id });
    }
    await this.reanchorVias(mirror, before);
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
  private async remirrorStay(
    accommodationId: number,
    placeId: number | null,
    dayId: number,
    checkIn?: string | null,
    opts: { checkInChanged?: boolean } = {},
  ): Promise<AccommodationMirror> {
    const own = await this.ownStops(accommodationId);
    if (own.length === 0) return noMirror();
    const night: Night = { id: accommodationId, check_in: checkIn };
    if (own.length === 1 && own[0].day_id === dayId && own[0].place_id === placeId) {
      // Same place, same day. A stop already where a fresh seat would put it stays,
      // whatever the edit: relocating it would land it in the same place and report
      // a move that moved nothing. A check-in given a new hour seats the night afresh
      // otherwise, the way booking it with that hour would have; any other edit
      // leaves the stop alone unless the clocks around it say it is in the wrong
      // place, so a night the traveller dragged somewhere stays there through a
      // change of notes.
      // AC7 (one read, both checks)
      const rows = await this.dayAssignmentsRepo.listSeatRows(dayId);
      const settled = seatIndexAmong(rows, night, own[0].id) === own[0].order_index
        || (!opts.checkInChanged && seatHolds(rows, own[0].id, checkIn));
      if (settled) return noMirror();
    }

    const mirror = noMirror();

    // One stop is the ordinary case, and it can be carried across rather than
    // rebuilt. Everything hanging off the row survives that: its participants, its
    // note, its hour, its end-of-day flag and the road-trip day boundary anchored
    // on its id, all of which a DELETE takes with it.
    if (own.length === 1 && placeId) {
      const before = await this.stopOrders([own[0].day_id, dayId]);
      const moved = await this.relocateOwnStop(own[0], placeId, dayId, night);
      if (moved) {
        mirror.moved = { assignment: moved, oldDayId: own[0].day_id };
        mirror.stamped = await this.stampLodging(placeId);
        await this.reanchorVias(mirror, before);
        return mirror;
      }
    }

    const beforeRebuild = await this.stopOrders(own.map(stop => stop.day_id));
    for (const stop of own) {
      // AC28
      await this.dayAssignmentsRepo.deleteById(stop.id);
      mirror.removed.push({ id: stop.id, dayId: stop.day_id });
    }
    await this.reanchorVias(mirror, beforeRebuild);
    const fresh = await this.mirrorStay(accommodationId, placeId, dayId, checkIn);
    mirror.created = fresh.created;
    mirror.stamped = fresh.stamped;
    for (const day of fresh.vias ?? []) this.noteVias(mirror, day);
    return mirror;
  }

  async createAccommodation(tripId: string | number, data: CreateAccommodationData) {
    const { place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes } = data;

    // The stay, its partner hotel reservation and the day stop it implies are one
    // logical write, and an atomic one, so a failed insert halfway can't leave an orphan.
    const written = await this.uow.transactional(async () => {
      // AC30
      const newId = await this.dayAccommodationsRepo.insertStay({
        trip_id: tripId,
        place_id: place_id ?? null,
        start_day_id,
        end_day_id,
        check_in: check_in || null,
        check_in_end: check_in_end || null,
        check_out: check_out || null,
        confirmation: confirmation || null,
        notes: notes || null,
      });

      // Auto-create linked reservation for this accommodation
      // AC31
      const placeName = (await this.placesRepo.getName(place_id))?.name || 'Hotel';
      // AC32
      const startDayDate = (await this.daysRepo.findById(start_day_id))?.date || null;
      const meta: Record<string, string> = {};
      if (check_in) meta.check_in_time = check_in;
      if (check_in_end) meta.check_in_end_time = check_in_end;
      if (check_out) meta.check_out_time = check_out;
      // AC33
      await this.reservationsRepo.insertHotelPartner({
        trip_id: tripId,
        day_id: start_day_id,
        title: placeName,
        reservation_time: startDayDate || null,
        confirmation_number: confirmation || null,
        notes: notes || null,
        accommodation_id: legacyBoundIntegerText(newId),
        metadata: Object.keys(meta).length > 0 ? JSON.stringify(meta) : null,
      });

      return { accommodationId: newId, mirror: await this.mirrorStay(newId, place_id ?? null, start_day_id, check_in) };
    });

    return { accommodation: await this.getAccommodationWithPlace(written.accommodationId), mirror: written.mirror };
  }

  async getAccommodation(id: string | number, tripId: string | number): Promise<DayAccommodationRow | undefined> {
    // AC34 — the trip-scoping guard every write path (REST update/delete,
    // MCP, RPC) re-reads through. Both ids parsed ONCE here (rule 21); a
    // miss reads as `undefined`, matching the legacy raw-bind miss.
    const idNum = toRowId(id);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return undefined;
    return await this.dayAccommodationsRepo.findInTrip(idNum, tripIdNum);
  }

  async updateAccommodation(id: string | number, existing: DayAccommodation, fields: {
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
    const mirror = await this.uow.transactional(async () => {
      // AC36 — `existing.id`, the SAME id AC34's gate (`getAccommodation`)
      // already resolved (rule 21): the caller always reads `existing` from
      // that gate first, so this reuses its value rather than re-parsing the
      // raw `id` parameter.
      await this.dayAccommodationsRepo.updateStay(existing.id, {
        place_id: newPlaceId,
        start_day_id: newStartDayId,
        end_day_id: newEndDayId,
        check_in: newCheckIn,
        check_in_end: newCheckInEnd,
        check_out: newCheckOut,
        confirmation: newConfirmation,
        notes: newNotes,
      });
      return await this.remirrorStay(existing.id, newPlaceId, newStartDayId, newCheckIn, {
        checkInChanged: fields.check_in !== undefined && (fields.check_in || null) !== (existing.check_in || null),
      });
    });

    // Sync check-in/out/confirmation to every linked reservation. The booking form
    // lets more than one hotel booking point at the same block and there is no
    // unique constraint on reservations.accommodation_id, so a single .get() would
    // silently leave the others on the old times.
    // AC37 — runs AFTER the transaction above commits (§18.6, R5 class: pre-existing, flagged not fixed).
    const linkedRes = await this.reservationsRepo.listIdMetadataByStay(existing.id);
    for (const res of linkedRes) {
      const meta = res.metadata ? JSON.parse(res.metadata) : {};
      if (newCheckIn) meta.check_in_time = newCheckIn;
      if (newCheckInEnd) meta.check_in_end_time = newCheckInEnd;
      if (newCheckOut) meta.check_out_time = newCheckOut;
      // AC38
      await this.reservationsRepo.setMetadataAndConfirmation(res.id, JSON.stringify(meta), newConfirmation || null);
    }

    return { accommodation: await this.getAccommodationWithPlace(existing.id), mirror };
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
  async deleteAccommodation(id: string | number, opts: { keepStop?: boolean } = {}): Promise<{
    linkedReservationId: number | null;
    deletedBudgetItemId: number | null;
    linkedReservationIds: number[];
    deletedBudgetItemIds: number[];
    mirror: AccommodationMirror;
  }> {
    // AC39 — `toRowId(id)!`: every caller (REST `.remove()`, MCP, RPC) already
    // called `getAccommodation`/AC34 as its own gate before reaching here,
    // with the SAME raw `id` (rule 21) — the `AssignmentsService` precedent
    // for a write downstream of a separately-gated existence check.
    const idNum = toRowId(id)!;
    return await this.uow.transactional(async () => {
      // AC40
      const linkedRes = await this.reservationsRepo.listIdsByStay(idNum);
      const deletedBudgetItemIds: number[] = [];
      for (const res of linkedRes) {
        // AC41/AC42 — every expense on the booking, not just the first (#2084).
        for (const linkedBudget of await this.budgetItemsRepo.listIdsByReservation(res.id)) {
          await this.budgetItemsRepo.deleteById(linkedBudget.id);
          deletedBudgetItemIds.push(linkedBudget.id);
        }
        // AC43
        await this.reservationsRepo.deleteById(res.id);
      }

      const mirror = await this.releaseStops(idNum, opts);

      // AC44 — no trip scoping (the legacy statement has none either; the
      // caller already scoped `id` via AC34's guard).
      await this.dayAccommodationsRepo.deleteById(idNum);
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
