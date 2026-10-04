import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { addIsoDays, MAX_TRIP_DAYS, planDatedAppend } from '@trek/shared';
import type { RoadtripDayBoundary, TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import { PermissionsService } from '../permissions/permissions.service';
import { QueryHelpersService } from '../query-helpers/query-helpers.service';
import { carryViasWith, locatedStopIdsWith, reseatOwnStopWith } from '../accommodations/night-seat';
import { formatAssignmentWithPlace } from '../common/rowShape';
import type { User } from '../../types';
import { UnitOfWork } from '../database/unit-of-work';
import { toRowId } from '../common/row-id';
import { Days } from '../../db/entities/Days.entity';
import type { DaysRepository, DayOrderRow, DayRow } from '../../db/repositories/Days.repository';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import type { DayAssignmentsRepository } from '../../db/repositories/DayAssignments.repository';
import { DayNotes } from '../../db/entities/DayNotes.entity';
import type { DayNotesRepository } from '../../db/repositories/DayNotes.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { Reservations } from '../../db/entities/Reservations.entity';
import type { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { ReservationEndpoints } from '../../db/entities/ReservationEndpoints.entity';
import type { ReservationEndpointsRepository } from '../../db/repositories/ReservationEndpoints.repository';
import { DayAccommodations } from '../../db/entities/DayAccommodations.entity';
import type { DayAccommodationsRepository } from '../../db/repositories/DayAccommodations.repository';
import { RoadtripVias } from '../../db/entities/RoadtripVias.entity';
import type { RoadtripViasRepository } from '../../db/repositories/RoadtripVias.repository';
import { RoadtripDayBoundaries } from '../../db/entities/RoadtripDayBoundaries.entity';
import type { RoadtripDayBoundariesRepository } from '../../db/repositories/RoadtripDayBoundaries.repository';

type Trip = TripAccess;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Add `n` days to a YYYY-MM-DD date string, staying entirely in UTC. The shared
 * day-grid rule, so the planner counts the date it promises the way this writes it.
 */
export const addDays = addIsoDays;

function dayDelta(from: string, to: string): number {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / MS_PER_DAY);
}

/** Replace the date part of an ISO-ish timestamp, keeping any time suffix. */
function withDatePart(timestamp: string, date: string): string {
  return date + (timestamp.length > 10 ? timestamp.slice(10) : '');
}

/** Thrown for invalid reorder/insert requests; mapped to HTTP 400 by the controller. */
export class DayReorderError extends Error {}

/**
 * A dated day the trip cannot take: it has no dates, or it would grow past the
 * day limit. REST answers 400, MCP a tool error, a plugin BadParams.
 */
export class DayAppendError extends Error {}

export const NO_DATES_MESSAGE = 'This trip has no dates. Add a day without a date instead.';

/** How a surface sends what a day write changed; the MCP tools and the plugin RPC hand the same sender twice. */
export type DaySender = <E extends TrekWsTripEventName>(event: E, payload: TrekWsPayload<E>) => void;

/** What adding the next dated day did to the trip, for the surface that announces it. */
export interface DatedDayAppend {
  /** The new day, in the shape the create route answers with. */
  day: DayRow & { assignments: unknown[]; notes_items: unknown[] };
  /** The trip's end date now, which is the new day's date. */
  endDate: string;
  /** The road trip day boundaries after they moved back with their days, or null when none moved. */
  boundaries: RoadtripDayBoundary[] | null;
  /** The trip re-read in list shape for the viewer: its end date and its day count changed. */
  trip: unknown;
}

/**
 * Day domain service — the day + day-assignment-projection SQL now lives in
 * `DaysRepository`/`DayAssignmentsRepository`/`DayNotesRepository` (Plan 3c
 * Task 2); `restampReservationDates`/`assertNoInvertedAccommodation` and
 * `resyncAccommodationDays`'s `reservations`/`reservation_endpoints`/
 * `day_accommodations` statements now go through `ReservationsRepository`/
 * `ReservationEndpointsRepository` (Plan 3d Task 2) and
 * `DayAccommodationsRepository` (Plan 3d Task 3) — no raw SQL left in this
 * file. Trip access rides `TripsRepository.findAccessible` (Plan 4 Task 2 —
 * off `DatabaseService.canAccessTrip`); mutations use the 'day_edit'
 * permission; the WebSocket broadcast keeps its legacy call path.
 *
 * Day ids arriving from a route (`:id`) are an **affinity seam**: the legacy
 * statement bound the route string straight into `WHERE id = ?` with no
 * `Number()`/validation of its own, relying on SQLite's own text/integer
 * affinity. `getDay` is the one gate that converts and answers the legacy
 * not-found (`toRowId` → `undefined`, program rule 15); every mutation below
 * is only ever reached downstream of a successful `getDay` call in the same
 * request (REST/MCP/RPC all check-then-act), so `toRowId(id)!` there is not
 * a live 404 path, just the same non-null-assert style this file already
 * used before conversion (`this.db.get<Day>(...)!`).
 *
 * `tripId` is the DY0 seam, and the claim this docstring used to make about
 * it was WRONG (Task 9 whole-plan review, H2, live): `TripAccessGuard`
 * validates `:tripId` with a bare `Number(tripId)` — a `Number()` seam, not
 * an affinity seam — so `Number('0x12')` is `18`, a real trip's row id, and
 * the guard authorises it. That is LOOSER than `toRowId`'s canonical-decimal
 * check (program rule 15). Every ORM-converted entry point below used to
 * re-parse with its OWN bare `Number(tripId)`, agreeing with the guard,
 * while `restampReservationDates` and `assertNoInvertedAccommodation` kept
 * binding the RAW ROUTE STRING on `reservations`/`day_accommodations`
 * (Plan 3d survivors, an affinity seam a hex id never matches) — so one
 * `PUT .../days/reorder` request could renumber a real trip's days (the
 * `Number()` half agreeing with the guard) while its own
 * inverted-accommodation guard silently matched zero rows (the raw-string
 * half), writing a stay whose end precedes its start with no error. Every
 * entry point now parses ONCE with `toRowId(tripId)` and threads that same
 * value into every survivor and read; a `toRowId` miss answers the entry
 * point's own legacy-shaped not-found (`list` → `{ days: [] }`, `getDay` →
 * `undefined`, `reorder`/`insert` → `DayReorderError`, caught by the
 * controller's `reorder` handler into the legacy 400) rather than let the
 * guard's wider `Number()` grant reach a downstream raw bind that disagrees
 * with it. `create`/`insert` answer the SAME 404 `TripAccessGuard` itself
 * would have given a non-numeric id (Task 9 fix round 2, M-1): the guard's
 * bare `Number(tripId)` authorises shapes like `18.0`/`18 `/`+18`/`18e0`
 * that `toRowId` refuses, and the legacy raw INSERT stored those through
 * SQLite affinity (201), so a plain `Error` here was a fresh regression —
 * a manufactured 500 for an id the gate itself authorised, not a legacy-
 * parity miss (the same class of defect ruled in `PlacesService`, A-M1).
 */
@Injectable()
export class DaysService {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly queryHelpers: QueryHelpersService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Days) private readonly daysRepo: DaysRepository,
    @InjectRepository(DayAssignments) private readonly dayAssignmentsRepo: DayAssignmentsRepository,
    @InjectRepository(DayNotes) private readonly dayNotesRepo: DayNotesRepository,
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    // Plan 3d Task 2 (DY14–DY18, DY23): `restampReservationDates`/
    // `resyncAccommodationDays`'s `reservations`/`reservation_endpoints`
    // statements convert onto these two — the only new constructor params
    // this task adds (`day_accommodations` stays raw here, Task 3's own).
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    @InjectRepository(ReservationEndpoints) private readonly reservationEndpointsRepo: ReservationEndpointsRepository,
    // Plan 3d Task 3 (DY19/DY20/DY22): `assertNoInvertedAccommodation`'s
    // read and `resyncAccommodationDays`'s `day_accommodations` statements
    // convert onto this — Task 2 deliberately left it unadded ("Task 3's own").
    @InjectRepository(DayAccommodations) private readonly dayAccommodationsRepo: DayAccommodationsRepository,
    // The stay stop a re-dated stay carries re-pins its day's drawn roads
    // (carryStayStop), and a dated append moves the road trip day boundaries
    // back with their days (shiftBoundariesBack).
    @InjectRepository(RoadtripVias) private readonly roadtripViasRepo: RoadtripViasRepository,
    @InjectRepository(RoadtripDayBoundaries) private readonly roadtripDayBoundariesRepo: RoadtripDayBoundariesRepository,
  ) {}

  async verifyTripAccess(tripId: string | number, userId: number) {
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is
    // gone: this reuses the TripsRepository already injected for other
    // reads and calls findAccessible.
    return await this.tripsRepo.findAccessible(Number(tripId), userId);
  }

  async canEdit(trip: Trip, user: User): Promise<boolean> {
    return this.permissions.checkPermission('day_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  // -------------------------------------------------------------------------
  // Day assignment helpers
  // -------------------------------------------------------------------------

  /** DY1 — `DayAssignmentsRepository.listForDay`, the single-day ordered projection. */
  async getAssignmentsForDay(dayId: number | string) {
    const assignments = await this.dayAssignmentsRepo.listForDay(Number(dayId));

    // One batched tag load instead of the legacy per-assignment query; the
    // non-compact loader returns the same full tag rows (t.* minus the join
    // key), so the output shape is unchanged.
    const tagsByPlaceId = await this.queryHelpers.loadTagsByPlaceIds([...new Set(assignments.map(a => a.place_id))]);

    return assignments.map(a => {
      const tags = tagsByPlaceId[a.place_id] || [];

      return {
        id: a.id,
        day_id: a.day_id,
        order_index: a.order_index,
        end_day: a.end_day === 1,
        route_excluded: a.route_excluded === 1,
        notes: a.notes,
        // Repeated here for the same reason stop_type is: the day list hides the stop
        // a booking wrote, and this copy is one of the paths that feed it.
        accommodation_id: a.accommodation_id ?? null,
        created_at: a.created_at,
        place: {
          id: a.place_id,
          name: a.place_name,
          description: a.place_description,
          lat: a.lat,
          lng: a.lng,
          address: a.address,
          category_id: a.category_id,
          price: a.price,
          currency: a.place_currency,
          place_time: a.place_time,
          end_time: a.end_time,
          duration_minutes: a.duration_minutes,
          notes: a.place_notes,
          image_url: a.image_url,
          transport_mode: a.transport_mode,
          google_place_id: a.google_place_id,
          google_ftid: a.google_ftid,
          osm_id: a.osm_id,
          amap_poi_id: a.amap_poi_id,
          website: a.website,
          phone: a.phone,
          // Hand-built here rather than through `formatAssignmentWithPlace`, so every
          // place column has to be repeated twice — which is how the road-trip kind went
          // missing and made a petrol station render as an ordinary numbered stop.
          stop_type: a.stop_type ?? null,
          category: a.category_id ? {
            id: a.category_id,
            name: a.category_name,
            color: a.category_color,
            icon: a.category_icon,
          } : null,
          tags,
        }
      };
    });
  }

  // -------------------------------------------------------------------------
  // Day CRUD
  // -------------------------------------------------------------------------

  async list(tripId: string | number) {
    // Rule 21 / H2: `toRowId`, not `Number()` — see the class docstring. A
    // trip id `TripAccessGuard`'s looser `Number()` authorised but this
    // stricter parse refuses answers the same `{ days: [] }` an affinity-seam
    // raw bind would have (no row ever matches a hex/decimal-spelled id).
    const tid = toRowId(tripId);
    if (tid === null) return { days: [] };
    const days = await this.daysRepo.listByTrip(tid);

    if (days.length === 0) {
      return { days: [] };
    }

    const dayIds = days.map(d => d.id);

    const allAssignments = await this.dayAssignmentsRepo.listWithPlaceAndCategory(dayIds);

    const placeIds = [...new Set(allAssignments.map(a => a.place_id))];
    const tagsByPlaceId = await this.queryHelpers.loadTagsByPlaceIds(placeIds, { compact: true });

    const allAssignmentIds = allAssignments.map(a => a.id);
    const participantsByAssignment = await this.queryHelpers.loadParticipantsByAssignmentIds(allAssignmentIds);

    const assignmentsByDayId: Record<number, ReturnType<typeof formatAssignmentWithPlace>[]> = {};
    for (const a of allAssignments) {
      if (!assignmentsByDayId[a.day_id]) assignmentsByDayId[a.day_id] = [];
      // Plan 3c Task 2 review, "For Task 3" §6.3: `formatAssignmentWithPlace`
      // is now typed on the repository's own `AssignmentWithPlaceRow` (rule
      // 16's honestly-nullable columns), so no cast is needed here — the
      // `as unknown as AssignmentRow` this line used to carry moved to
      // `rowShape.ts`'s parameter type instead, once, for every call site.
      assignmentsByDayId[a.day_id].push(formatAssignmentWithPlace(a, tagsByPlaceId[a.place_id] || [], participantsByAssignment[a.id] || []));
    }

    const allNotes = await this.dayNotesRepo.listByDayIds(dayIds);
    const notesByDayId: Record<number, typeof allNotes[number][]> = {};
    for (const note of allNotes) {
      if (!notesByDayId[note.day_id]) notesByDayId[note.day_id] = [];
      notesByDayId[note.day_id].push(note);
    }

    const daysWithAssignments = days.map(day => ({
      ...day,
      assignments: assignmentsByDayId[day.id] || [],
      notes_items: notesByDayId[day.id] || [],
    }));

    return { days: daysWithAssignments };
  }

  async create(tripId: string | number, date?: string, notes?: string) {
    // Rule 21 / M-1 (Task 9 fix round 2): `toRowId`, not `Number()`. A miss
    // here answers the SAME 404 `TripAccessGuard` gives a non-numeric id
    // (`trip-access.guard.ts`'s own body) — for a hex-spelled id (`0x12`)
    // that is legacy-shaped parity (the raw INSERT's FK violation was a
    // 500, but the guard itself never let a hex id past); for a
    // non-canonical-but-numeric id the guard's looser `Number()` DOES
    // authorise (`18.0`, `18 `, `+18`, `18e0`), a plain `Error` used to
    // become a manufactured 500 the legacy affinity bind never produced
    // (it stored those through affinity and answered 201) — the same class
    // of defect `PlacesService.create` was fixed for (A-M1).
    const tripIdNum = toRowId(tripId);
    if (tripIdNum === null) throw new HttpException({ error: 'Trip not found' }, 404);
    // DY5: `DaysRepository.maxDayNumber` already folds the no-rows case to 0
    // (`?? 0`); the `|| 0` here is the legacy expression kept verbatim so a
    // stored 0 still becomes 1 — the same outcome either fold produces, but
    // the ruling is to keep the literal formula in the service.
    const maxDayNumber = await this.daysRepo.maxDayNumber(tripIdNum);
    const dayNumber = (maxDayNumber || 0) + 1;

    const day = await this.daysRepo.createDay({
      trip_id: tripIdNum,
      day_number: dayNumber,
      date: date || null,
      notes: notes || null,
    });
    return { ...day, assignments: [] };
  }

  async getDay(id: string | number, tripId: string | number) {
    const dayId = toRowId(id);
    if (dayId === null) return undefined;
    // Rule 21 / H2: `toRowId`, not `Number()` — see the class docstring.
    const tid = toRowId(tripId);
    if (tid === null) return undefined;
    return await this.daysRepo.findInTrip(dayId, tid);
  }

  async update(id: string | number, current: { notes?: string | null; title?: string | null }, fields: { notes?: string; title?: string | null }) {
    const dayId = toRowId(id)!;
    // Both columns use the presence sentinel: an absent key preserves the
    // current value (the legacy version always wrote notes, so setting a title
    // silently wiped the day's notes — the client sends the two fields in
    // separate requests). Note the asymmetry: `notes` falls back through `||`
    // (an empty string clears too), `title` through `??` (only null/undefined
    // clear) — both byte-identical to the legacy statement's own coercions.
    const notes = 'notes' in fields ? (fields.notes || null) : (current.notes ?? null);
    const title = 'title' in fields ? (fields.title ?? null) : (current.title ?? null);
    await this.daysRepo.updateNotesAndTitle(dayId, notes, title);
    const updatedDay = (await this.daysRepo.findById(dayId))!;
    return { ...updatedDay, assignments: await this.getAssignmentsForDay(dayId) };
  }

  /**
   * Set the whole-day default route mode (#1281). Its own endpoint so it can't wipe
   * notes/title the way the general day update would, and symmetric with the
   * per-leg assignment transport setter. Per-segment leg modes still override it.
   */
  async setDefaultTransportMode(id: string | number, mode: string | null) {
    const dayId = toRowId(id)!;
    await this.daysRepo.setDefaultTransportMode(dayId, mode ?? null);
    const updatedDay = (await this.daysRepo.findById(dayId))!;
    return { ...updatedDay, assignments: await this.getAssignmentsForDay(dayId) };
  }

  /**
   * The trip in list shape, as the trip routes answer it, for a day write that
   * changed the trip itself (its end date, its day count). Read through the
   * repository rather than TripsService, which imports this class.
   */
  async getTripForViewer(tripId: string | number, userId: number): Promise<unknown> {
    // DY37
    return await this.tripsRepo.findListShapeById(tripId, userId);
  }

  // -------------------------------------------------------------------------
  // Day reorder / insert (#589)
  //
  // Reordering keeps every day ROW stable (so assignments, notes, accommodations,
  // photos and multi-day reservation positions ride along by id) and only changes
  // each row's day_number — its position. On a dated trip the calendar dates stay
  // pinned to their slots (position i keeps the i-th date) and the day's content
  // moves across them. Because a booking's day is derived from the date part of
  // reservation_time, every booking on a day whose date changed gets that date
  // re-stamped onto the day's new date (time-of-day preserved), so day_id stays
  // consistent and the booking moves with its day.
  // -------------------------------------------------------------------------

  /**
   * After day dates have been re-pinned, re-stamp the date of every booking on a
   * moved day so reservation_time/reservation_end_time follow their day's new
   * date (time-of-day preserved). Transport endpoints (flight legs) shift by the
   * same per-booking day delta so multi-leg timing stays internally consistent.
   *
   * DY14–DY18 — Plan 3d Task 2: converted onto `ReservationsRepository
   * .listForRestamp`/`setReservationTime`/`setReservationEndTime` and
   * `ReservationEndpointsRepository.listIdAndDate`/`setLocalDate`, inside the
   * caller's `uow.transactional` block (unchanged — repository methods never
   * open their own transaction, program brief item 7).
   *
   * `tripId: number` (Task 9 fix wave, H2): every caller now passes the ONE
   * `toRowId`-parsed value its own entry point already computed, never the
   * raw route string — binding the raw string here (an affinity seam) is
   * exactly the mismatch that let a hex-spelled trip id's reorder skip this
   * statement entirely while the `Number()`-parsed half of the same request
   * acted on a real trip (see the class docstring).
   */
  async restampReservationDates(
    tripId: number,
    oldDateById: Map<number, string | null>,
    newDateById: Map<number, string | null>,
  ): Promise<void> {
    // DY14 — Plan 3d
    const reservations = await this.reservationsRepo.listForRestamp(tripId);

    for (const r of reservations) {
      if (r.day_id != null && r.reservation_time) {
        const oldDate = oldDateById.get(r.day_id);
        const newDate = newDateById.get(r.day_id);
        if (oldDate && newDate && oldDate !== newDate) {
          // DY15 — Plan 3d
          await this.reservationsRepo.setReservationTime(r.id, withDatePart(r.reservation_time, newDate));
          // Shift each transport leg's local_date by the same number of days.
          const delta = dayDelta(oldDate, newDate);
          if (delta !== 0) {
            // DY17 — Plan 3d
            for (const ep of await this.reservationEndpointsRepo.listIdAndDate(r.id)) {
              // DY18 — Plan 3d
              if (ep.local_date) await this.reservationEndpointsRepo.setLocalDate(ep.id, addDays(ep.local_date, delta));
            }
          }
        }
      }
      if (r.end_day_id != null && r.reservation_end_time) {
        const oldDate = oldDateById.get(r.end_day_id);
        const newDate = newDateById.get(r.end_day_id);
        if (oldDate && newDate && oldDate !== newDate) {
          // DY16 — Plan 3d
          await this.reservationsRepo.setReservationEndTime(r.id, withDatePart(r.reservation_end_time, newDate));
        }
      }
    }
  }

  /**
   * A stay must not end before it begins after a reorder/insert.
   *
   * DY19 — Plan 3d Task 3: the statement's root table is `day_accommodations`
   * (joined to `days` only to read `day_number`), so it converts on
   * `DayAccommodationsRepository.listStartEndDayNumbers` (the shared class
   * Task 2 stubbed and this task appends to), not a new method on
   * `DaysRepository` — `days` here is only the JOIN target.
   *
   * `tripId: number` (Task 9 fix wave, H2): the same parsed-once value every
   * other survivor in this class now takes — see `restampReservationDates`'s
   * docstring for why binding the raw route string here was the live bug.
   */
  private async assertNoInvertedAccommodation(tripId: number): Promise<void> {
    // DY19 — Plan 3d Task 3: `DayAccommodationsRepository.listStartEndDayNumbers`.
    const spans = await this.dayAccommodationsRepo.listStartEndDayNumbers(tripId);
    for (const span of spans) {
      if (span.start_no > span.end_no) {
        throw new DayReorderError('This move would make an accommodation end before it starts.');
      }
    }
  }

  /**
   * After a trip's date range changes, generateDays positionally re-dates the day rows
   * (keeping their ids), so an accommodation — which has no absolute date, only
   * start_day_id/end_day_id — visually shifts with the range (#1288). Re-anchor each
   * stay to the days now holding its pre-change dates (from the snapshot taken before
   * generateDays ran). A stay whose dates fall outside the new range is left glued to
   * its day rows, mirroring resyncReservationDays' out-of-range semantics, so moving a
   * whole trip still shifts everything together. The linked hotel reservation follows
   * its accommodation's start day in both branches.
   *
   * DY20/DY22 — Plan 3d Task 3: `DayAccommodationsRepository.listForResync`/
   * `setDayRange`. DY21 (`DaysRepository.findByTripAndDate`) and DY25
   * (`DaysRepository.findById`) convert — both root on `days`, which this
   * plan owns. DY24, the `day_assignments` stop that follows its booking, is
   * seated by its check-in on the day it moves to, see `carryStayStop` (DY39/
   * DY40). DY23 (`reservations`) converts onto
   * `ReservationsRepository.restampLinkedReservation` — Plan 3d Task 2.
   *
   * `tripId: number` (Task 9 fix wave, H2): callers now pass their own
   * `toRowId`-parsed value; DY20's read uses it too (previously the raw
   * route string — the same affinity-seam mismatch documented on
   * `restampReservationDates`).
   */
  async resyncAccommodationDays(
    tripId: number,
    prevDateByDayId: Map<number, string | null>,
  ): Promise<void> {
    // DY20
    const stays = await this.dayAccommodationsRepo.listForResync(tripId);
    if (stays.length === 0) return;

    for (const stay of stays) {
      const oldStartDate = prevDateByDayId.get(stay.start_day_id);
      const oldEndDate = prevDateByDayId.get(stay.end_day_id);
      if (oldStartDate && oldEndDate) {
        // DY21
        const newStart = await this.daysRepo.findByTripAndDate(tripId, oldStartDate);
        const newEnd = await this.daysRepo.findByTripAndDate(tripId, oldEndDate);
        if (newStart && newEnd && newStart.day_number <= newEnd.day_number
          && (newStart.id !== stay.start_day_id || newEnd.id !== stay.end_day_id)) {
          // DY22
          await this.dayAccommodationsRepo.setDayRange(stay.id, newStart.id, newEnd.id);
          if (newStart.id !== stay.start_day_id) await this.carryStayStop(stay, newStart.id);
          stay.start_day_id = newStart.id;
        }
      }
      // Keep the linked reservation on the stay's (possibly re-dated) start day — its
      // reservation_time is a snapshot of that day's date, stale after any range change.
      // DY25
      const startDay = await this.daysRepo.findById(stay.start_day_id);
      if (startDay?.date) {
        // DY23 — Plan 3d
        await this.reservationsRepo.restampLinkedReservation(stay.id, stay.start_day_id, startDay.date);
      }
    }
  }

  /**
   * The day stop a booking wrote moves with it, the way its linked booking does.
   * Left behind it would sit on a day the traveller no longer sleeps there, with
   * nothing on screen to say why. Seated on its new day by its check-in like a
   * night booked there (night-seat.ts), with the drawn roads of both days re-pinned
   * behind the stops they were drawn after. A day that already holds the place under
   * a stop of the traveller's keeps that one, and the booking rides along with it.
   *
   * DY39 — `SELECT id, day_id, place_id, order_index FROM day_assignments WHERE
   * accommodation_id = ? AND day_id != ?`: `listOwnedByStay` (AC25) with the
   * target day filtered out here. DY40 — `SELECT id FROM day_assignments WHERE
   * day_id = ? AND place_id = ?` (`existsForDayAndPlace`), then `DELETE ... WHERE
   * id = ?` (`deleteById`) and the gap closed (`closeGap`, AC19's statement).
   * Runs inside the caller's transaction.
   */
  private async carryStayStop(stay: { id: number; check_in: string | null }, dayId: number): Promise<void> {
    // DY39
    const own = (await this.dayAssignmentsRepo.listOwnedByStay(stay.id)).filter(stop => stop.day_id !== dayId);
    for (const stop of own) {
      const before: [number, number[]][] = [];
      for (const id of [stop.day_id, dayId]) before.push([id, await locatedStopIdsWith(this.dayAssignmentsRepo, id)]);
      // DY40
      if (await this.dayAssignmentsRepo.existsForDayAndPlace(dayId, stop.place_id)) {
        await this.dayAssignmentsRepo.deleteById(stop.id);
        // `order_index > NULL` matches no row, so a stop without a position closes no gap.
        if (stop.order_index !== null) await this.dayAssignmentsRepo.closeGap(stop.day_id, stop.order_index);
      } else {
        await reseatOwnStopWith(this.dayAssignmentsRepo, stop, stop.place_id, dayId, { id: stay.id, check_in: stay.check_in });
      }
      for (const [id, previousIds] of before) {
        await carryViasWith(this.roadtripViasRepo, id, previousIds, await locatedStopIdsWith(this.dayAssignmentsRepo, id));
      }
    }
  }

  /**
   * Reorder whole days. `orderedIds` is the desired full sequence of this trip's
   * day ids (a permutation of the current ids).
   */
  async reorder(tripId: string | number, orderedIds: number[]) {
    // Rule 21 / H2: `toRowId`, not `Number()` — see the class docstring. A
    // miss throws the SAME permutation error an empty `rows` set would
    // (nothing ever matches a hex/decimal-spelled id), so the controller's
    // existing `DayReorderError` → 400 catch answers it, before any write —
    // never the "renumber a real trip, skip the invariant check" split this
    // fixes.
    const tripIdNum = toRowId(tripId);
    if (tripIdNum === null) throw new DayReorderError('orderedIds must be a permutation of the trip day ids.');
    const rows: DayOrderRow[] = await this.daysRepo.listOrderedForReorder(tripIdNum);

    const existingIds = new Set(rows.map(r => r.id));
    if (orderedIds.length !== rows.length || !orderedIds.every(id => existingIds.has(id))) {
      throw new DayReorderError('orderedIds must be a permutation of the trip day ids.');
    }

    const oldDateById = new Map(rows.map(r => [r.id, r.date]));
    // Dates stay pinned to slots: position i keeps the i-th date (ascending).
    const sortedDates = rows.map(r => r.date).filter((d): d is string => !!d).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const isDated = sortedDates.length > 0;

    await this.uow.transactional(async () => {
      // Two-phase renumber to dodge UNIQUE(trip_id, day_number) collisions —
      // one `nativeUpdate` per row, in the legacy order, both phases inside
      // this same transaction.
      for (const [i, id] of orderedIds.entries()) {
        await this.daysRepo.setDayNumber(id, -(i + 1));
      }
      const newDateById = new Map<number, string | null>();
      for (const [i, id] of orderedIds.entries()) {
        const date = isDated ? (sortedDates[i] ?? null) : null;
        await this.daysRepo.setDayNumberAndDate(id, i + 1, date);
        newDateById.set(id, date);
      }

      if (isDated) await this.restampReservationDates(tripIdNum, oldDateById, newDateById);
      await this.assertNoInvertedAccommodation(tripIdNum);
    });

    return await this.list(tripIdNum);
  }

  /**
   * Insert a new empty day at a 1-based position (default: append at the end).
   * On a dated trip the trip gains one calendar day: dates re-pin so the slots
   * stay contiguous, the trip's end_date extends by one day, and bookings on
   * shifted days have their dates re-stamped (same rules as reorder).
   */
  async insert(tripId: string | number, position?: number) {
    // Rule 21 / M-1 (Task 9 fix round 2): `toRowId`, not `Number()` — see
    // `reorder`'s comment above and the class docstring. `insert` answers
    // the SAME 404 `create` does (see its comment): `TripAccessGuard`'s own
    // body, for the ids the guard's looser `Number()` seam authorises but
    // `toRowId` refuses. A plain `Error` used to become a manufactured 500
    // for `18.0`/`18 `/`+18`/`18e0` — ids the legacy raw INSERT stored
    // through affinity and answered 201 for — rather than the renumber-
    // then-skip-the-invariant split H2 found for hex ids.
    const tripIdNum = toRowId(tripId);
    if (tripIdNum === null) throw new HttpException({ error: 'Trip not found' }, 404);
    const rows: DayOrderRow[] = await this.daysRepo.listOrderedForReorder(tripIdNum);
    const n = rows.length;
    const pos = Math.min(Math.max(position ?? n + 1, 1), n + 1);
    const datedRows = rows.filter(r => r.date) as { id: number; day_number: number; date: string }[];
    const isDated = datedRows.length > 0;

    if (!isDated) {
      const newId = await this.uow.transactional(async () => {
        const toShift = rows.filter(r => r.day_number >= pos);
        for (const r of toShift) await this.daysRepo.setDayNumber(r.id, -r.day_number);
        const insertedId = await this.daysRepo.insertDay({ trip_id: tripIdNum, day_number: pos, date: null });
        for (const r of toShift) await this.daysRepo.setDayNumber(r.id, r.day_number + 1);
        return insertedId;
      });
      const day = (await this.daysRepo.findById(newId))!;
      return { ...day, assignments: [], notes_items: [] };
    }

    // Dated trip: rebuild N+1 contiguous dates from the earliest date.
    const start = datedRows.map(r => r.date).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))[0];
    const dates = Array.from({ length: n + 1 }, (_, i) => addDays(start, i));
    const oldDateById = new Map(rows.map(r => [r.id, r.date]));

    const newId = await this.uow.transactional(async () => {
      for (const [i, r] of rows.entries()) await this.daysRepo.setDayNumber(r.id, -(i + 1));
      const insertedId = await this.daysRepo.insertDay({ trip_id: tripIdNum, day_number: pos, date: dates[pos - 1] });

      const orderedIds = rows.map(r => r.id);
      orderedIds.splice(pos - 1, 0, insertedId);
      const newDateById = new Map<number, string | null>();
      for (const [i, id] of orderedIds.entries()) {
        await this.daysRepo.setDayNumberAndDate(id, i + 1, dates[i]);
        newDateById.set(id, dates[i]);
      }

      await this.restampReservationDates(tripIdNum, oldDateById, newDateById);
      await this.assertNoInvertedAccommodation(tripIdNum);
      // DY35 — `TripsRepository.setEndDate`, added this task for Task 7 to reuse.
      await this.tripsRepo.setEndDate(tripIdNum, dates[dates.length - 1]);

      return insertedId;
    });
    const day = (await this.daysRepo.findById(newId))!;
    return { ...day, assignments: [], notes_items: [] };
  }

  /**
   * Add the calendar day after the trip's last date and extend the trip to it.
   *
   * Unlike insert(), no day that is already there changes its date. The new day
   * goes right behind the last dated day, so the days without a date stay
   * undated and move one place back, the road trip boundaries drawn on them with
   * them. No booking moves either. One transaction, reads included, so two clicks
   * in a row add two days one after the other instead of the same date twice.
   *
   * Throws a DayAppendError for a trip without dates and for one that would grow
   * past the day limit; nothing is written then.
   *
   * Reads: `SELECT start_date, end_date FROM trips WHERE id = ?`
   * (`TripsRepository.findDatesById`) and DY26's day order. Writes: DY27's
   * two-phase renumber, DY6's insert with notes (`createDay`, which reads the
   * row back), RB5/RB7 for the boundaries and DY38 for the end date.
   */
  async appendDated(tripId: string | number, viewerId: number, notes?: string): Promise<DatedDayAppend> {
    // The same parse-once gate `create`/`insert` use (class docstring).
    const trip = toRowId(tripId);
    if (trip === null) throw new HttpException({ error: 'Trip not found' }, 404);
    const appended = await this.uow.transactional(async () => {
      const range = await this.tripsRepo.findDatesById(trip);
      const rows: DayOrderRow[] = await this.daysRepo.listOrderedForReorder(trip);
      const plan = planDatedAppend(range ?? {}, rows.map(r => r.date));
      if (!plan) throw new DayAppendError(NO_DATES_MESSAGE);
      if (!plan.fits) throw new DayAppendError(`A trip can span at most ${MAX_TRIP_DAYS} days`);

      // The dates are a prefix of the day order on any trip the planner wrote;
      // the highest dated number keeps that true even on one that drifted.
      const position = rows.reduce((last, r) => (r.date ? Math.max(last, r.day_number) : last), 0) + 1;
      const later = rows.filter(r => r.day_number >= position);
      // Two phases, to get past UNIQUE(trip_id, day_number) on the way.
      for (const r of later) await this.daysRepo.setDayNumber(r.id, -r.day_number);
      const day = await this.daysRepo.createDay({ trip_id: trip, day_number: position, date: plan.date, notes: notes || null });
      for (const r of later) await this.daysRepo.setDayNumber(r.id, r.day_number + 1);

      const boundaries = await this.shiftBoundariesBack(trip, position);
      // DY38
      await this.tripsRepo.setEndDateTouched(trip, plan.date);
      return { day: { ...day, assignments: [], notes_items: [] }, endDate: plan.date, boundaries };
    });
    return { ...appended, trip: await this.getTripForViewer(trip, viewerId) };
  }

  /**
   * Boundaries are keyed by day number, so the ones on the days that moved back
   * move back with them. One at a time and from the last one down: the key is
   * the primary key, and a CHECK keeps it at 1 or above, so the negative two-step
   * the days use is not available here. Returns the list after the move, or null
   * when no boundary had to move.
   */
  private async shiftBoundariesBack(tripId: number, fromNumber: number): Promise<RoadtripDayBoundary[] | null> {
    // RB5
    const later = await this.roadtripDayBoundariesRepo.listDayNumbersFrom(tripId, fromNumber);
    if (later.length === 0) return null;
    // RB7
    for (const dayNumber of later) await this.roadtripDayBoundariesRepo.moveDayNumber(tripId, dayNumber, dayNumber + 1);
    // RB1
    return await this.roadtripDayBoundariesRepo.listForTrip(tripId);
  }

  /**
   * The one place a dated append is fanned out. The collaborators take the new
   * day through day:reordered, the insert shape, because it can land in front of
   * the days without a date and day:created only appends; that event makes them
   * pull the whole list. The trip follows for its end date and day count. Moved
   * boundaries go to every screen, the adding one included, which holds them
   * outside the day list.
   */
  announceDatedAppend(append: DatedDayAppend, send: { all: DaySender; others: DaySender }): void {
    send.others('day:reordered', { day: append.day });
    if (append.boundaries) send.all('roadtripBoundary:changed', { boundaries: append.boundaries });
    if (append.trip) send.others('trip:updated', { trip: append.trip });
  }
}
