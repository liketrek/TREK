import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import { UnitOfWork } from '../database/unit-of-work';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import { ReservationsReadService, toTraveler } from './reservations-read.service';
import { keepMirroredPrice } from './reservation-metadata';
import type { Reservation, User } from '../../types';
import { BudgetService } from '../budget/budget.service';
import { typeToCostCategory } from '@trek/shared';
import { NotificationsService } from '../notifications/notifications.service';
import { AccommodationsService, noStayMirror, type AccommodationMirror } from '../accommodations/accommodations.service';
import { toRowId, legacyBoundIntegerText } from '../common/row-id';
import { Reservations } from '../../db/entities/Reservations.entity';
import type { ReservationsRepository } from '../../db/repositories/Reservations.repository';
import { ReservationEndpoints as ReservationEndpointsEntity } from '../../db/entities/ReservationEndpoints.entity';
import type { ReservationEndpointsRepository, ReservationEndpointRow } from '../../db/repositories/ReservationEndpoints.repository';
import { ReservationTravelers as ReservationTravelersEntity } from '../../db/entities/ReservationTravelers.entity';
import type { ReservationTravelersRepository } from '../../db/repositories/ReservationTravelers.repository';
import { ReservationDayPositions } from '../../db/entities/ReservationDayPositions.entity';
import type { ReservationDayPositionsRepository } from '../../db/repositories/ReservationDayPositions.repository';
import { DayAccommodations } from '../../db/entities/DayAccommodations.entity';
import type { DayAccommodationsRepository } from '../../db/repositories/DayAccommodations.repository';
import { Days } from '../../db/entities/Days.entity';
import type { DaysRepository } from '../../db/repositories/Days.repository';
import { Places } from '../../db/entities/Places.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import type { DayAssignmentsRepository } from '../../db/repositories/DayAssignments.repository';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import type { TripMembersRepository } from '../../db/repositories/TripMembers.repository';
import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository } from '../../db/repositories/Users.repository';
import { Trips } from '../../db/entities/Trips.entity';
import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import type { BudgetItemsRepository } from '../../db/repositories/BudgetItems.repository';
import type { TripsRepository } from '../../db/repositories/Trips.repository';

type Trip = TripAccess;
type BudgetEntry = { total_price?: number; category?: string; currency?: string | null; exchange_rate?: number } | undefined;

export interface ReservationEndpoint {
  id?: number;
  reservation_id?: number;
  role: 'from' | 'to' | 'stop';
  sequence: number;
  name: string;
  code: string | null;
  lat: number;
  lng: number;
  timezone: string | null;
  local_time: string | null;
  local_date: string | null;
}

export type EndpointInput = Omit<ReservationEndpoint, 'id' | 'reservation_id' | 'sequence'> & { sequence?: number };

// --- Travelers (#1517): trip members / named guests assigned to a booking -----

export interface ReservationTraveler {
  user_id: number;
  username: string;
  avatar: string | null;
  avatar_url?: string | null;
  is_guest?: number | null;
}

/** A reservation row as the joined list/get queries return it (open record —
 *  the legacy queries selected `r.*` and callers pass the row through; the
 *  named fields are the columns consumers read in a typed position). */
export type ReservationRow = Record<string, unknown> & {
  id: number;
  trip_id: number;
  title: string;
  status: string;
  type: string;
  metadata?: string | null;
  accommodation_id?: number | string | null;
  day_positions?: Record<number, number> | null;
  endpoints?: ReservationEndpoint[];
  travelers?: ReservationTraveler[];
};

interface CreateAccommodation {
  place_id?: number;
  start_day_id?: number;
  end_day_id?: number;
  check_in?: string;
  check_out?: string;
  confirmation?: string;
}

export interface CreateReservationData {
  title: string;
  reservation_time?: string;
  reservation_end_time?: string;
  location?: string;
  confirmation_number?: string;
  notes?: string;
  url?: string;
  day_id?: number;
  end_day_id?: number;
  place_id?: number;
  assignment_id?: number;
  status?: string;
  type?: string;
  accommodation_id?: number;
  metadata?: unknown;
  create_accommodation?: CreateAccommodation;
  endpoints?: EndpointInput[];
  needs_review?: boolean;
}

export interface UpdateReservationData {
  title?: string;
  reservation_time?: string;
  reservation_end_time?: string;
  location?: string;
  confirmation_number?: string;
  notes?: string;
  url?: string;
  day_id?: number;
  end_day_id?: number | null;
  place_id?: number;
  assignment_id?: number;
  status?: string;
  type?: string;
  accommodation_id?: number;
  metadata?: unknown;
  create_accommodation?: CreateAccommodation;
  endpoints?: EndpointInput[];
  needs_review?: boolean;
}

// The "does reservation_time actually carry a date, not just a bare HH:MM"
// question (#1934) that RS20's legacy `DATED` constant used to answer here
// now lives as `startsWithIsoDateKysely` inside
// `ReservationsRepository.listUpcomingForUser` (Plan 3d Task 4) — RS20 was
// this constant's only caller.

type AccommodationTimesMeta = {
  check_in_time?: string | null;
  check_in_end_time?: string | null;
  check_out_time?: string | null;
};

/**
 * Reservations domain service — owns the reservation SQL (moved 1:1 from the
 * legacy services/reservationService.ts: identical statements, the `||`
 * falsy-coercion defaults, the COALESCE update semantics and the post-write
 * re-selects; the multi-statement writes gained db.transaction() wrappers in
 * the post-fold quirk-fix commit, and the accommodation metadata sync now
 * keys off the resolved accommodation id so auto-created accommodations get
 * their check-in/out times too). Trip access,
 * the 'reservation_edit' permission and the WebSocket broadcast keep their
 * legacy call paths. The legacy route's budget side effects (auto-create /
 * update / delete a linked budget item) and the booking notification are
 * encapsulated here so the controller stays thin — behaviour is 1:1.
 * Every consumer injects this class now. reservations.bridge.ts existed for
 * the legacy tripService, airtrail import/sync and the transit/transports MCP
 * registrars, all of which have folded in; the plugin RPC host reaches it
 * through ReservationsRpc.
 */
@Injectable()
export class ReservationsService {
  constructor(
    private readonly permissions: PermissionsService,
    private readonly budget: BudgetService,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly reads: ReservationsReadService,
    private readonly accommodations: AccommodationsService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Reservations) private readonly reservationsRepo: ReservationsRepository,
    @InjectRepository(ReservationEndpointsEntity) private readonly endpointsRepo: ReservationEndpointsRepository,
    @InjectRepository(ReservationTravelersEntity) private readonly travelersRepo: ReservationTravelersRepository,
    @InjectRepository(ReservationDayPositions) private readonly dayPositionsRepo: ReservationDayPositionsRepository,
    @InjectRepository(DayAccommodations) private readonly dayAccommodationsRepo: DayAccommodationsRepository,
    @InjectRepository(Days) private readonly daysRepo: DaysRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    @InjectRepository(DayAssignments) private readonly dayAssignmentsRepo: DayAssignmentsRepository,
    @InjectRepository(TripMembers) private readonly tripMembersRepo: TripMembersRepository,
    @InjectRepository(Users) private readonly usersRepo: UsersRepository,
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    // Plan 3e Task 2 (budget) — additive, RS48/49/51-54 only.
    @InjectRepository(BudgetItems) private readonly budgetItemsRepo: BudgetItemsRepository,
  ) {}

  async verifyTripAccess(tripId: string | number, userId: number) {
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is
    // gone: this reuses the TripsRepository already injected for other
    // reads and calls findAccessible.
    return await this.tripsRepo.findAccessible(tripId, userId);
  }

  /**
   * `tripId` reaches every read/write below only downstream of
   * `TripAccessGuard` (REST) or an equivalent MCP/RPC check, which already
   * resolved it to a real trip with its own `Number()` coercion — this
   * mirrors that same coercion for repository calls whose typed filters
   * require a genuine `number` (program rule 23). `Number.isFinite`, not a
   * bare `Number(...)`: MikroORM inlines every bound parameter into the SQL
   * text (rule 22), so a stray `NaN` would render as the bare token `NaN`
   * and throw at prepare time (rule 15) rather than simply matching no
   * rows — `-1` never matches a real (positive, autoincrement) trip id, so
   * an already-impossible tripId here degrades to "no rows", never a 500.
   */
  private rowIdNum(value: string | number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : -1;
  }

  async canEdit(trip: Trip, user: User): Promise<boolean> {
    return this.permissions.checkPermission('reservation_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  /**
   * Announce the day stop a hotel booking wrote, the way the accommodations
   * routes announce theirs.
   *
   * Here rather than at each surface: eleven call sites reach create/update/
   * remove, all but the hotel ones carry an empty mirror, and the fan-out is the
   * one part that must not exist in eleven copies. Outside the transaction, so a
   * write that rolls back announces nothing.
   *
   * No socket id to skip: the stop is news to the sender too. Every other
   * booking event on this surface is echo-suppressed because the client already
   * drew what it sent, and it never sent this.
   */
  private async announceStayMirror(tripId: string | number, mirror: AccommodationMirror): Promise<void> {
    await this.accommodations.announceMirror(tripId, mirror, (event, payload) => this.realtime.broadcast(tripId, event, payload));
  }

  /** Fire-and-forget booking-change notification, mirroring the legacy dynamic import. */
  async notifyBookingChange(tripId: string | number, actorId: number, booking: string, type: string): Promise<void> {
    // Injected, not a lazy import of the old notifications bridge. The laziness bought
    // nothing the module graph does not already give — NotificationsModule
    // reaches nothing in this direction — and it hid the edge while handing the
    // send a second NotificationsService built outside the container.
    try {
      // RS1
      const actorEmail = await this.usersRepo.getEmail(actorId);
      if (!actorEmail) return;
      // RS2
      const tripTitle = await this.tripsRepo.getTitle(tripId);
      this.notifications.send({
        event: 'booking_change',
        actorId,
        scope: 'trip',
        targetId: Number(tripId),
        params: {
          trip: tripTitle || 'Untitled',
          actor: actorEmail,
          booking,
          type: type || 'booking',
          tripId: String(tripId),
        },
      }).catch(() => {});
    } catch {
      // Notifications must never make the booking write fail.
    }
  }

  async loadEndpointsByTrip(tripId: string | number): Promise<Map<number, ReservationEndpoint[]>> {
    // RS3
    const rows: ReservationEndpointRow[] = await this.endpointsRepo.listForTrip(this.rowIdNum(tripId));
    const map = new Map<number, ReservationEndpoint[]>();
    for (const r of rows) {
      const list = map.get(r.reservation_id) ?? [];
      // `role` is TEXT at the DB (unconstrained); `ReservationEndpoint.role`
      // narrows it to the three values every writer of this column sends —
      // the same widen-on-read the legacy `this.db.all<ReservationEndpoint>`
      // generic parameter asserted without any runtime check.
      list.push(r as ReservationEndpoint);
      map.set(r.reservation_id, list);
    }
    return map;
  }

  /**
   * Users assignable on a trip: its members (guests included) plus the
   * owner. RS4+RS5 — `TripMembersRepository.rosterUserIds` (the same two
   * reads, merged through the same `Set`, per the inventory's §18.9 ruling
   * that the two are provably identical).
   */
  private async assignableUserIds(tripId: string | number): Promise<Set<number>> {
    return this.tripMembersRepo.rosterUserIds(tripId);
  }

  async loadTravelersByTrip(tripId: string | number): Promise<Map<number, ReservationTraveler[]>> {
    // RS6
    const rows = await this.travelersRepo.listForTrip(this.rowIdNum(tripId));
    const map = new Map<number, ReservationTraveler[]>();
    for (const row of rows) {
      const list = map.get(row.reservation_id) ?? [];
      list.push(toTraveler(row));
      map.set(row.reservation_id, list);
    }
    return map;
  }

  async loadTravelers(reservationId: number | string): Promise<ReservationTraveler[]> {
    return this.reads.loadTravelers(reservationId);
  }

  /**
   * Replace a reservation's assigned travelers. Only real trip members/guests are
   * accepted — ids that aren't on the trip are silently dropped so a stale client
   * can't leak a cross-trip user. #1517.
   */
  async setReservationTravelers(reservationId: number | string, tripId: string | number, userIds: number[]): Promise<void> {
    // RS7: the roster is computed BEFORE the transaction opens (unchanged).
    const allowed = await this.assignableUserIds(tripId);
    const ids = [...new Set(userIds)].filter(uid => allowed.has(uid));
    const reservationIdNum = this.rowIdNum(reservationId);
    await this.uow.transactional(async () => {
      // RS8
      await this.travelersRepo.deleteForReservation(reservationIdNum);
      // RS9
      await this.travelersRepo.insertIgnore(reservationIdNum, ids);
    });
  }

  /** Assign trip members / named guests to a reservation (#1517). Null when off-trip. */
  async setTravelers(id: string, tripId: string, userIds: number[]) {
    if (!(await this.getReservation(id, tripId))) return null;
    await this.setReservationTravelers(id, tripId, userIds);
    return { travelers: await this.loadTravelers(id), reservation: await this.getReservationWithJoins(Number(id)) };
  }

  // Resolve the day row whose date matches the date portion of an ISO-ish
  // timestamp. Used to keep `day_id` / `end_day_id` in sync with
  // `reservation_time` / `reservation_end_time` so non-transport bookings
  // (tours, restaurants, events, ...) end up on the right day in the UI,
  // which now filters by day_id instead of reservation_time.
  private async resolveDayIdFromTime(
    tripId: string | number,
    time: string | null | undefined,
    clampToNearest = true,
  ): Promise<number | null> {
    if (!time) return null;
    const datePart = time.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
    // RS10
    const exact = await this.daysRepo.findByTripAndDate(this.rowIdNum(tripId), datePart);
    if (exact) return exact.id;
    // Fallback: clamp to the nearest day in the trip so an imported booking whose
    // exact date has no day row (or sits just outside the span) still lands on a day.
    // Skipped by callers (e.g. resyncReservationDays) that must leave a booking whose
    // date now falls outside the range untouched instead of snapping it to an edge day.
    if (!clampToNearest) return null;
    // RS11
    const nearestId = await this.reservationsRepo.findNearestDayId(this.rowIdNum(tripId), datePart);
    return nearestId ?? null;
  }

  // After a trip's date range changes, generateDays positionally re-dates the day rows
  // (keeping their ids), so a dated booking's day_id stays glued to a now-re-dated day and
  // the booking visually shifts by the offset (#1288). Re-anchor non-hotel bookings to the
  // day matching their absolute reservation_time — the same derivation create/update
  // use. Only updates when a matching day exists, so a booking whose date now falls outside
  // the new range is left untouched. Hotels linked to a day_accommodation are excluded here —
  // resyncAccommodationDays re-anchors the accommodation span and its linked reservation;
  // unlinked dated hotels (e.g. imported ones) re-anchor like any other booking.
  async resyncReservationDays(tripId: string | number): Promise<void> {
    // RS12 — read BEFORE the transaction (inside TripsService.updateTrip's outer tx), unchanged.
    const rows = await this.reservationsRepo.listResyncCandidates(this.rowIdNum(tripId));
    await this.uow.transactional(async () => {
      for (const r of rows) {
        const newDayId = await this.resolveDayIdFromTime(tripId, r.reservation_time, false);
        if (newDayId == null) continue;
        const newEndDayId = r.reservation_end_time
          ? ((await this.resolveDayIdFromTime(tripId, r.reservation_end_time, false)) ?? r.end_day_id)
          : r.end_day_id;
        if (newDayId !== r.day_id || newEndDayId !== r.end_day_id) {
          // RS13
          await this.reservationsRepo.setDays(r.id, newDayId, newEndDayId);
        }
      }
    });
  }

  private async saveEndpoints(reservationId: number, endpoints: EndpointInput[]): Promise<void> {
    // Run the transaction through DatabaseService (which re-derives the
    // statement from the injected connection on each call). The bridge
    // instance is built over the reinitialize-proof `db` Proxy, so a
    // demo-reset / restore-from-backup that closes and reinitialises the
    // connection can't leave this holding a dead handle — the legacy module
    // bound its transaction lazily per call for the same reason ("The
    // database connection is not open").
    await this.uow.transactional(async () => {
      // RS16
      await this.endpointsRepo.deleteForReservation(reservationId);
      // lat/lng are NOT NULL: an imported transport whose pick-up/return (or station/
      // stop) couldn't be geocoded reaches here with null coords. Skip those rows rather
      // than let the INSERT throw and fail the entire booking save — the dates still live
      // on reservation_time/reservation_end_time, so the booking lands on its day either way.
      const filtered = endpoints.filter((e) => e.lat != null && e.lng != null);
      for (const [i, e] of filtered.entries()) {
        // RS17
        await this.endpointsRepo.insertEndpoint({
          reservation_id: reservationId,
          role: e.role,
          sequence: e.sequence ?? i,
          name: e.name,
          code: e.code ?? null,
          lat: e.lat!,
          lng: e.lng!,
          timezone: e.timezone ?? null,
          local_time: e.local_time ?? null,
          local_date: e.local_date ?? null,
        });
      }
    });
  }

  async list(tripId: string | number) {
    // RS18. `ReservationRow`'s `status`/`type` are declared non-nullable
    // (every write path here always supplies a value — `status || 'pending'`
    // / `type || 'other'`, RS28/RS41) even though the physical columns are
    // nullable; the repository's honest `ReservationJoinRow` type keeps them
    // `string | null`. Neither the legacy raw row nor this one coerces a
    // genuine NULL at read time — spreading into a fresh object literal
    // (assignable to `ReservationRow`'s index signature the same way a
    // literal always is) changes only the compile-time claim, never a
    // runtime value, so a row a write path here never produces (a
    // hand-edited NULL) still reads back as `null` on the wire.
    const reservations: ReservationRow[] = (await this.reservationsRepo.listForTrip(tripId)).map((r) => ({ ...r }));

    // RS19
    const dayPositions = await this.dayPositionsRepo.listForTrip(this.rowIdNum(tripId));

    const posMap = new Map<number, Record<number, number>>();
    for (const dp of dayPositions) {
      if (!posMap.has(dp.reservation_id)) posMap.set(dp.reservation_id, {});
      posMap.get(dp.reservation_id)![dp.day_id] = dp.position;
    }

    const endpointsMap = await this.loadEndpointsByTrip(tripId);
    const travelersMap = await this.loadTravelersByTrip(tripId);

    for (const r of reservations) {
      r.day_positions = posMap.get(r.id) || null;
      r.endpoints = endpointsMap.get(r.id) || [];
      r.travelers = travelersMap.get(r.id) || [];
      // accommodation_id is a TEXT column; the integer FK reads back as a numeric
      // string (e.g. "14.0"). Normalize to an int so clients can parse it.
      r.accommodation_id = r.accommodation_id == null ? null : Math.trunc(Number(r.accommodation_id));
    }

    return reservations;
  }

  /**
   * Upcoming reservations across all of a user's active trips, soonest first.
   * Used by the dashboard's "Upcoming reservations" widget. A reservation counts
   * as upcoming when its own time is in the future, or — for timeless entries —
   * when its day falls on or after today. Cancelled bookings are skipped.
   * The default limit (6) matches the legacy inline handler.
   *
   * Hotels are left out on purpose (#1934). A stay covers a range rather than a
   * moment, so a week in one hotel would hold a slot in a six-entry widget for
   * the whole week and push out the bookings that actually happen on a day. The
   * accommodation belongs to the day plan, which shows it across its span.
   *
   * They also never worked here. A hotel keeps its dates on the linked stay, not
   * on the reservation: the booking form writes reservation_time = NULL and no
   * day_id, so a form-created hotel matched neither arm of the date test and was
   * invisible. The one path that did produce a visible row, the accommodation
   * panel's auto-created booking, stamps the start day into reservation_time
   * once and never restamps it, so moving the stay left the widget showing the
   * old date. Both halves of the report come from reading a hotel's date off
   * fields hotels do not use.
   *
   * RS20 — Task 4 (calendar + listUpcoming + the visibility predicate
   * consumers). Ruling (ii): ONE fully typed Kysely statement, in
   * `ReservationsRepository.listUpcomingForUser` — see that method's own
   * docstring for the CTE/`UNION ALL`/GLOB/CAST shape.
   */
  async listUpcoming(userId: number, limit = 6) {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date().toISOString();
    return await this.reservationsRepo.listUpcomingForUser(userId, today, now.slice(11, 16), limit);
  }

  async getReservationWithJoins(id: string | number) {
    return this.reads.getReservationWithJoins(id);
  }

  /**
   * Name every id in the body that points outside this trip.
   *
   * Permission on the trip in the URL does not cover the body: it carries ids
   * of its own, and a reservation happily stores a foreign accommodation_id,
   * whose delete cascade then follows it out of the caller's own trip. The MCP
   * tools have validated their referenced ids since they were written; this is
   * the same check where every writer can reach it.
   *
   * Returns the offending field names, empty when the body is clean.
   */
  async referencesOutsideTrip(tripId: string | number, data: CreateReservationData | UpdateReservationData): Promise<string[]> {
    const offenders: string[] = [];
    // An id that resolves to nothing is not an offender. accommodation_id in
    // particular carries no foreign key, so shortening a trip's date range
    // cascades the day_accommodations row away and leaves the reservation
    // pointing at a gap; update() has always healed that by clearing the link,
    // and refusing the whole write instead would make such a booking
    // permanently uneditable. Only a row that exists in a DIFFERENT trip is one
    // the caller must not have reached for.
    //
    // RS21 — a CLOSED union of table names dispatched to typed repository
    // calls (never an interpolated identifier): `DaysRepository.findById`,
    // the inherited `PlacesRepository.findOne` and
    // `DayAccommodationsRepository.getTripId`. R1: this was a SYNCHRONOUS
    // closure used as a boolean in the legacy code — now genuinely async, so
    // every call site below `await`s it; the async-closure mutation harness
    // (`tests/integration/async-closure-truthiness-guards.test.ts`,
    // RS21-001/RS21-002) proves a dropped `await` goes red.
    const elsewhere = async (table: 'days' | 'places' | 'day_accommodations', id: number): Promise<boolean> => {
      let rowTripId: number | undefined;
      if (table === 'days') {
        rowTripId = (await this.daysRepo.findById(id))?.trip_id;
      } else if (table === 'places') {
        rowTripId = (await this.placesRepo.findOne({ id }))?.trip_id;
      } else {
        rowTripId = await this.dayAccommodationsRepo.getTripId(id);
      }
      return rowTripId !== undefined && String(rowTripId) !== String(tripId);
    };

    const check = (field: string, offending: boolean) => { if (offending) offenders.push(field); };

    if (data.day_id != null) check('day_id', await elsewhere('days', data.day_id));
    if (data.end_day_id != null) check('end_day_id', await elsewhere('days', data.end_day_id));
    if (data.place_id != null) check('place_id', await elsewhere('places', data.place_id));
    if (data.accommodation_id != null) check('accommodation_id', await elsewhere('day_accommodations', data.accommodation_id));
    if (data.assignment_id != null) {
      // An assignment belongs to a trip through its day, so the join is the
      // lookup — same shape as the MCP tool's getAssignmentForTrip. RS22.
      const rowTripId = await this.reservationsRepo.getAssignmentTripId(data.assignment_id);
      check('assignment_id', rowTripId !== undefined && String(rowTripId) !== String(tripId));
    }

    const acc = data.create_accommodation;
    if (acc) {
      if (acc.place_id != null) check('create_accommodation.place_id', await elsewhere('places', acc.place_id));
      if (acc.start_day_id != null) check('create_accommodation.start_day_id', await elsewhere('days', acc.start_day_id));
      if (acc.end_day_id != null) check('create_accommodation.end_day_id', await elsewhere('days', acc.end_day_id));
    }

    return offenders;
  }

  /**
   * Name every id in the body that resolves to nothing on this trip.
   *
   * A second guard rather than a stricter referencesOutsideTrip: that one
   * answers "does this id belong to someone else", and a row that exists
   * nowhere cannot. accommodation_id depends on that answer staying no, or a
   * booking whose stay was cascaded away could never be saved again (#522).
   * The fields here are the ones carrying a real foreign key, where an id that
   * resolves to nothing is not a gap but a constraint failure, and SQLite
   * raising it reaches the caller as a bare 500 (#2355). accommodation_id is
   * absent by design; do not complete the list.
   *
   * Only a truthy id is looked up. The write paths below coerce 0 and '' to
   * NULL before they reach SQL, so naming one here would turn a body that
   * stores a null today into a 400.
   *
   * Returns the offending field names, empty when the body is clean. An id
   * that belongs to another trip is named here too — the REST controller asks
   * the older guard first, so that case keeps its own answer.
   */
  async unresolvedReferences(tripId: string | number, data: CreateReservationData | UpdateReservationData): Promise<string[]> {
    const offenders: string[] = [];
    // RS23 — a CLOSED union ('days' | 'places') dispatched to the existing
    // typed `existsInTrip` methods. R1: this closure has NO typed
    // intermediate the way `check()` gives `elsewhere` above — `tsc` does
    // NOT catch a dropped `await` here (Task 0's finding), so every call
    // site below is `await`ed deliberately and the async-closure mutation
    // harness (RS23-001) is the only net.
    const onTrip = async (table: 'days' | 'places', id: number): Promise<boolean> => {
      const tripIdNum = this.rowIdNum(tripId);
      return table === 'days' ? this.daysRepo.existsInTrip(id, tripIdNum) : this.placesRepo.existsInTrip(id, tripIdNum);
    };

    if (data.day_id && !(await onTrip('days', data.day_id))) offenders.push('day_id');
    if (data.end_day_id && !(await onTrip('days', data.end_day_id))) offenders.push('end_day_id');
    if (data.place_id && !(await onTrip('places', data.place_id))) offenders.push('place_id');
    if (data.assignment_id) {
      // An assignment belongs to a trip through its day, the same join the
      // other guard walks. RS24.
      const row = await this.dayAssignmentsRepo.findInTrip(data.assignment_id, tripId);
      if (!row) offenders.push('assignment_id');
    }

    // Only a hotel booking writes the stay row, so only there do these ids
    // reach SQL. Any other body carries them as dead weight today, and a 400
    // on a write that currently succeeds is not what this guard is for.
    if (data.create_accommodation && data.type === 'hotel') {
      const acc = data.create_accommodation;
      const errors = await this.accommodations.validateAccommodationRefs(
        tripId, acc.place_id || undefined, acc.start_day_id || undefined, acc.end_day_id || undefined,
      );
      for (const { field } of errors) offenders.push(`create_accommodation.${field}`);
    }

    return offenders;
  }

  /**
   * Is there still a row behind this id? Existence only — which trip it sits
   * on is the guards' question, and they answer it before the write. RS25 —
   * a CLOSED union dispatched to each entity's own inherited `findOne`
   * (never an interpolated identifier); no new method on `Days`/`Places`/
   * `DayAssignments` repositories.
   */
  private async referenceExists(table: 'days' | 'places' | 'day_assignments', id: number): Promise<boolean> {
    if (table === 'days') return (await this.daysRepo.findOne({ id })) !== null;
    if (table === 'places') return (await this.placesRepo.findOne({ id })) !== null;
    return (await this.dayAssignmentsRepo.findOne({ id })) !== null;
  }

  /**
   * An id whose row is gone reads as no id at all.
   *
   * day_id, end_day_id, place_id and assignment_id are declared ON DELETE SET
   * NULL, so a reference that resolves to nothing is precisely the state the
   * cascade leaves behind, and clearing it is what the column already promises.
   * Binding it instead is the foreign-key error that arrives as a bare 500
   * (#2355), and an update rebinds whatever the row already held, so a guard
   * on the body alone never reaches it.
   */
  private async resolvedOrNull(table: 'days' | 'places' | 'day_assignments', id: number | null): Promise<number | null> {
    return id != null && (await this.referenceExists(table, id)) ? id : null;
  }

  /**
   * day_accommodations.start_day_id and end_day_id are NOT NULL, so there is
   * nothing to heal an unresolvable one to and it can only be refused. The
   * write surfaces name the field long before this; this is the floor under
   * the importers and the plugin host, and it refuses rather than skipping so
   * an edit is never dropped in silence.
   *
   * Both days are already known to be set where this is called. A place is
   * not: the booking form writes stays that never had one.
   *
   * BadRequestException rather than a domain error class, because the filter
   * already knows what to do with it: a caller that reaches this over HTTP gets
   * the same 400 { error } the controller's own guard sends, and not the 500 an
   * unplaceable class would collapse to (#2355). Its message survives, so the
   * importer that logs and moves on still names the field.
   */
  private async requireResolvableStay(acc: CreateAccommodation): Promise<void> {
    const missing: string[] = [];
    if (acc.place_id && !(await this.referenceExists('places', acc.place_id))) missing.push('place_id');
    // Both days are already known to be set where this is called (the
    // docstring above) — every caller guards on `start_day_id && end_day_id`
    // before calling, so the non-null assertion here names a real invariant,
    // not a widened type.
    if (!(await this.referenceExists('days', acc.start_day_id!))) missing.push('start_day_id');
    if (!(await this.referenceExists('days', acc.end_day_id!))) missing.push('end_day_id');
    if (missing.length > 0) {
      throw new BadRequestException(`Unknown reference: ${missing.map((field) => `create_accommodation.${field}`).join(', ')}`);
    }
  }

  /** The accommodation insert, the reservation insert, the endpoint save and
   *  the metadata sync are one logical write — all-or-nothing. */
  async create(tripId: string | number, data: CreateReservationData): Promise<{ reservation: ReservationRow; accommodationCreated: boolean }> {
    const { stayMirror, ...written } = await this.uow.transactional(() => this.createInTx(tripId, data));
    await this.announceStayMirror(tripId, stayMirror);
    return written;
  }

  private async createInTx(tripId: string | number, data: CreateReservationData): Promise<{ reservation: ReservationRow; accommodationCreated: boolean; stayMirror: AccommodationMirror }> {
    const {
      title, reservation_time, reservation_end_time, location,
      confirmation_number, notes, url, day_id, end_day_id, place_id, assignment_id,
      status, type, accommodation_id, metadata, create_accommodation,
      endpoints, needs_review
    } = data;

    let accommodationCreated = false;
    let stayMirror = noStayMirror();

    // Auto-create accommodation for hotel reservations.
    //
    // The stay row is written here rather than through createAccommodation: this
    // surface has its own field set and its own COALESCE semantics, and folding
    // the two together would bend one of them out of shape. The day stop is the
    // part that must not exist twice, so it comes from AccommodationsService.
    let resolvedAccommodationId: number | null = accommodation_id || null;
    if (type === 'hotel' && !resolvedAccommodationId && create_accommodation) {
      const { place_id: accPlaceId, start_day_id, end_day_id, check_in, check_out, confirmation: accConf } = create_accommodation;
      if (start_day_id && end_day_id) {
        await this.requireResolvableStay(create_accommodation);
        // RS27
        resolvedAccommodationId = await this.dayAccommodationsRepo.insertBookingStay({
          trip_id: tripId,
          place_id: accPlaceId || null,
          start_day_id,
          end_day_id,
          check_in: check_in || null,
          check_out: check_out || null,
          confirmation: accConf || confirmation_number || null,
        });
        accommodationCreated = true;
        // Same night, same day header, so the same stop the road trip draws for a
        // night entered under Days. Without it the hotel booked on this form is the
        // one place the drive does not know about, which is the duplicate entry this
        // whole change exists to remove.
        stayMirror = await this.accommodations.attachStayStop(resolvedAccommodationId, accPlaceId || null, start_day_id, check_in);
      }
    }

    // Derive day_id / end_day_id from reservation_time when the client
    // didn't explicitly set them (non-hotel bookings only — hotels store
    // their date range on the linked day_accommodation).
    const resolvedType = type || 'other';
    let resolvedDayId: number | null = day_id ?? null;
    if (resolvedDayId == null && resolvedType !== 'hotel' && reservation_time) {
      resolvedDayId = await this.resolveDayIdFromTime(tripId, reservation_time);
    }
    let resolvedEndDayId: number | null = end_day_id ?? null;
    if (resolvedEndDayId == null && resolvedType !== 'hotel' && reservation_end_time) {
      resolvedEndDayId = await this.resolveDayIdFromTime(tripId, reservation_end_time);
    }

    resolvedDayId = await this.resolvedOrNull('days', resolvedDayId);
    resolvedEndDayId = await this.resolvedOrNull('days', resolvedEndDayId);
    const resolvedPlaceId = await this.resolvedOrNull('places', place_id || null);
    const resolvedAssignmentId = await this.resolvedOrNull('day_assignments', assignment_id || null);

    // RS28. `accommodation_id` bound as the TEXT column's string form (R2 —
    // the legacy statement bound a plain JS number, which better-sqlite3
    // binds as SQLite REAL, so the TEXT column stores the `'<id>.0'` shape,
    // not the plain integer text `String(n)` renders — H1, Plan 3d Task 7
    // review: this used to be `String(n)`, which stored a DIFFERENT shape
    // than the legacy and silently broke `restampLinkedReservation`/DY23's
    // REAL-bound compare. `legacyBoundIntegerText` reproduces the legacy
    // bytes exactly.
    const insertedId = await this.reservationsRepo.insertReservation({
      trip_id: this.rowIdNum(tripId),
      day_id: resolvedDayId,
      end_day_id: resolvedEndDayId,
      place_id: resolvedPlaceId,
      assignment_id: resolvedAssignmentId,
      title,
      reservation_time: reservation_time || null,
      reservation_end_time: reservation_end_time || null,
      location: location || null,
      confirmation_number: confirmation_number || null,
      notes: notes || null,
      url: url || null,
      status: status || 'pending',
      type: resolvedType,
      accommodation_id: resolvedAccommodationId == null ? null : legacyBoundIntegerText(resolvedAccommodationId),
      metadata: metadata ? JSON.stringify(metadata) : null,
      needs_review: needs_review ? 1 : 0,
    });

    if (endpoints && endpoints.length > 0) {
      await this.saveEndpoints(insertedId, endpoints);
    }

    // Sync check-in/out to accommodation if linked. Keyed off the RESOLVED id
    // (quirk fix): the legacy gate read the raw accommodation_id, so a hotel
    // whose accommodation was just auto-created above never received its
    // metadata check-in/out times or confirmation.
    if (resolvedAccommodationId && metadata) {
      const meta = (typeof metadata === 'string' ? JSON.parse(metadata) : metadata) as AccommodationTimesMeta;
      if (meta.check_in_time || meta.check_in_end_time || meta.check_out_time) {
        // RS29
        await this.dayAccommodationsRepo.patchTimes(
          resolvedAccommodationId, meta.check_in_time || null, meta.check_in_end_time || null, meta.check_out_time || null,
        );
      }
      if (confirmation_number) {
        // RS30
        await this.dayAccommodationsRepo.patchConfirmation(resolvedAccommodationId, confirmation_number);
      }
    }

    // The row was just inserted, so the re-select can't miss (legacy typed this any).
    const reservation = (await this.getReservationWithJoins(insertedId))!;
    return { reservation, accommodationCreated, stayMirror };
  }

  async updatePositions(tripId: string | number, positions: { id: number; day_plan_position?: number }[], dayId?: number | string | null) {
    if (dayId) {
      // Per-day positions for multi-day reservations, scoped the way the legacy
      // branch below already scopes its update. The table carries no trip_id and
      // its two foreign keys only ask that the ids exist, so the trip has to come
      // from the join: the row materialises only when the reservation and the day
      // agree on it. Doing that in the statement rather than as a pre-check also
      // makes a stale id a quiet no-op instead of a foreign-key error surfacing
      // as a 500.
      //
      // M4, Plan 3d Task 7 review: `dayId` parsed with `toRowId` (rule 21),
      // not `rowIdNum` — `rowIdNum`'s `Number(...)` fallback let a
      // hex/exponent `dayId` (`0x1`, `1e1`) coerce to a real day and reach
      // the join, where the legacy raw-bind statement's affinity never
      // converts a hex string and so matched no row. A miss here is the same
      // quiet no-op the join already gives a stale id — no write happens.
      const dayIdNum = toRowId(dayId);
      const tripIdNum = this.rowIdNum(tripId);
      if (dayIdNum === null) return;
      await this.uow.transactional(async () => {
        for (const item of positions) {
          // RS31/RS32. position is NOT NULL while the wire contract leaves the value optional.
          await this.dayPositionsRepo.upsertScoped(tripIdNum, item.id, dayIdNum, item.day_plan_position ?? 0);
        }
      });
    } else {
      // Legacy: update global position
      const tripIdNum = this.rowIdNum(tripId);
      await this.uow.transactional(async () => {
        for (const item of positions) {
          // RS33/RS34. `?? null`, never `undefined` (R8) — a `nativeUpdate`
          // partial SKIPS a column whose value is `undefined`, which would
          // leave the row's old position in place instead of clearing it,
          // unlike the legacy statement's own bind of `undefined` (which
          // better-sqlite3 writes as SQL NULL).
          await this.reservationsRepo.setDayPlanPosition(item.id, tripIdNum, item.day_plan_position ?? null);
        }
      });
    }
  }

  async getReservation(id: string | number, tripId: string | number): Promise<Reservation | undefined> {
    // RS35 — the trip-scoping guard every write path re-reads through. Both
    // ids parsed ONCE here (rule 21); a miss reads as `undefined`, matching
    // the legacy raw-bind miss.
    const idNum = toRowId(id);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) return undefined;
    const row = await this.reservationsRepo.findInTrip(idNum, tripIdNum);
    if (!row) return undefined;
    // `status`/`type` are NOT NULL in every row a write path here ever
    // produces (`status || 'pending'` / `type || 'other'`, RS28/RS41); the
    // fallback only guards the physical column's own nullability for a row
    // this service never wrote, the same defensive shape `resolvedType`
    // already applies at every call site that reads `current.type`.
    return { ...row, status: row.status ?? 'pending', type: row.type ?? 'other' };
  }

  /** The accommodation upsert, the reservation update, the endpoint replace
   *  and the metadata sync are one logical write — all-or-nothing. */
  async update(id: string | number, tripId: string | number, data: UpdateReservationData, current: Reservation): Promise<{ reservation: ReservationRow; accommodationChanged: boolean }> {
    const { stayMirror, ...written } = await this.uow.transactional(() => this.updateInTx(id, tripId, data, current));
    await this.announceStayMirror(tripId, stayMirror);
    return written;
  }

  private async updateInTx(id: string | number, tripId: string | number, data: UpdateReservationData, current: Reservation): Promise<{ reservation: ReservationRow; accommodationChanged: boolean; stayMirror: AccommodationMirror }> {
    const {
      title, reservation_time, reservation_end_time, location,
      confirmation_number, notes, url, day_id, end_day_id, place_id, assignment_id,
      status, type, accommodation_id, metadata, create_accommodation,
      endpoints, needs_review
    } = data;

    let accommodationChanged = false;
    let stayMirror = noStayMirror();

    // Update or create accommodation for hotel reservations.
    //
    // `resolvedAccId` deliberately keeps BOTH shapes alive, exactly as the
    // legacy code's own type lie did at runtime (`Reservation
    // .accommodation_id` claimed `number` while the raw row underneath was
    // always the TEXT column's string; `UpdateReservationData.accommodation_id`
    // carries the same lie for the INCOMING payload — the wire schema is
    // `z.union([z.number(), z.string()])`, so a string reaches here despite
    // the declared `number` type): when the payload names `accommodation_id`
    // it is USER INPUT and goes through `toRowId` (L2, Plan 3d Task 7
    // review — `Number('0x1')` used to coerce a hex-spelled link and pass
    // the existence check below where the legacy raw-bind statement's own
    // affinity never would; `toRowId` returns `null` for any non-canonical
    // shape, including a `'1.0'`/`' 1'` string — an ACCEPTED rule-15
    // narrowing here, since a payload value is untrusted input, unlike the
    // fallback below); when it falls back to `current.accommodation_id` it
    // is the UNCONVERTED string this reservation already stored (R2 — a
    // `"14.0"`-shaped value must round-trip byte-identical through a no-op
    // update, which running it through `toRowId` — or a `Number()`/
    // `String()` round-trip — would break: `toRowId('14.0')` is `null`,
    // which would silently drop the link on every edit that doesn't touch
    // `accommodation_id`; OUR OWN previously-written data is not the input
    // L2 is about). `accIdForRead(...)` below is the READ-only numeric form
    // every repository call needs; the final write formats a genuine
    // `number` through `legacyBoundIntegerText` (H1, Plan 3d Task 7 review —
    // a bare `String(...)` stored `'<id>'`, not the legacy's REAL-bound
    // `'<id>.0'`) and passes an already-string value through unchanged, a
    // no-op.
    let resolvedAccId: number | string | null = accommodation_id !== undefined
      ? (accommodation_id == null ? null : toRowId(accommodation_id))
      : (current.accommodation_id ?? null);
    const accIdForRead = (v: number | string | null): number | null => (v == null ? null : Number(v));
    if (resolvedAccId) {
      // Scoped to the trip on purpose: an id belonging to someone else's trip
      // must read as absent here, not as an accommodation to write through to.
      // RS37
      const accExists = await this.dayAccommodationsRepo.existsInTrip(accIdForRead(resolvedAccId)!, this.rowIdNum(tripId));
      if (!accExists) resolvedAccId = null;
    }
    if (type === 'hotel' && create_accommodation) {
      const { place_id: accPlaceId, start_day_id, end_day_id, check_in, check_out, confirmation: accConf } = create_accommodation;
      if (start_day_id && end_day_id) {
        await this.requireResolvableStay(create_accommodation);
        if (resolvedAccId) {
          const resolvedAccIdNum = accIdForRead(resolvedAccId)!;
          // RS38
          const priorCheckIn = await this.dayAccommodationsRepo.getCheckIn(resolvedAccIdNum);
          // RS39
          await this.dayAccommodationsRepo.updateFromBooking(resolvedAccIdNum, {
            place_id: accPlaceId || null,
            start_day_id,
            end_day_id,
            check_in: check_in || null,
            check_out: check_out || null,
            confirmation: accConf || confirmation_number || null,
          });
          // The stay just moved. Its stop moves with it, or it is left sitting on a
          // day nobody sleeps there any more, hidden from the day list because it
          // still carries this booking's id and stranded in the middle of the drive.
          stayMirror = await this.accommodations.moveStayStop(resolvedAccIdNum, accPlaceId || null, start_day_id, check_in, {
            checkInChanged: (check_in || null) !== (priorCheckIn ?? null),
          });
        } else if (accPlaceId) {
          // RS40
          resolvedAccId = await this.dayAccommodationsRepo.insertBookingStay({
            trip_id: tripId,
            place_id: accPlaceId,
            start_day_id,
            end_day_id,
            check_in: check_in || null,
            check_out: check_out || null,
            confirmation: accConf || confirmation_number || null,
          });
          stayMirror = await this.accommodations.attachStayStop(resolvedAccId, accPlaceId, start_day_id, check_in);
        }
        accommodationChanged = true;
      }
    }

    // metadata.price / priceCurrency are written by the expense side and by the
    // booking importer, never by the booking form: the client rebuilds metadata
    // from its fields on every save and carries only transit / airtrail_ids
    // over, so a plain edit used to wipe the price off the card until the
    // expense was re-saved. A payload that does not name the keys keeps them.
    const nextMetadata = keepMirroredPrice(metadata, current.metadata);

    const resolvedType = (type ?? current.type) || 'other';
    const nextReservationTime = resolvedType === 'hotel'
      ? null
      : (reservation_time !== undefined ? (reservation_time || null) : current.reservation_time);
    const nextReservationEndTime = resolvedType === 'hotel'
      ? null
      : (reservation_end_time !== undefined ? (reservation_end_time || null) : current.reservation_end_time);

    // day_id / end_day_id: honour an explicit value from the client,
    // otherwise derive from the (possibly updated) reservation_time so the
    // planner renders the booking on the correct day.
    let nextDayId: number | null;
    if (day_id != null) {
      // Explicit day from the client (e.g. moved on the planner).
      nextDayId = day_id;
    } else if (resolvedType !== 'hotel' && nextReservationTime) {
      // No day set but we have a date — pin it to the matching day so the booking
      // still shows in the Plan (covers bookings saved without a selected day, and
      // the case where an earlier edit cleared day_id).
      nextDayId = await this.resolveDayIdFromTime(tripId, nextReservationTime);
    } else if (day_id === undefined) {
      // Field absent and nothing to derive from — keep whatever it had.
      nextDayId = current.day_id ?? null;
    } else {
      nextDayId = null;
    }

    let nextEndDayId: number | null;
    if (end_day_id !== undefined) {
      nextEndDayId = end_day_id ?? null;
    } else if (reservation_end_time !== undefined && resolvedType !== 'hotel') {
      nextEndDayId = await this.resolveDayIdFromTime(tripId, nextReservationEndTime);
    } else {
      nextEndDayId = current.end_day_id ?? null;
    }

    nextDayId = await this.resolvedOrNull('days', nextDayId);
    nextEndDayId = await this.resolvedOrNull('days', nextEndDayId);
    const nextPlaceId = await this.resolvedOrNull('places', place_id !== undefined ? (place_id || null) : (current.place_id ?? null));
    const nextAssignmentId = await this.resolvedOrNull('day_assignments', assignment_id !== undefined ? (assignment_id || null) : (current.assignment_id ?? null));

    // RS41. The `PlacesRepository.updatePlace`/PL11 precedent: the four
    // legacy `COALESCE(?, col)` keep-if-null columns (`title`/`status`/
    // `type`/`needs_review`) are resolved to their FINAL value here, in JS,
    // against the `current` pre-image this method already holds — nothing
    // else in this same transaction touches those four columns between the
    // read and this write, so `current`'s snapshot is exactly what the
    // legacy statement's own SQL-side `COALESCE` against the live row would
    // have read.
    const idNum = this.rowIdNum(id);
    await this.reservationsRepo.updateReservation(idNum, {
      title: title || current.title,
      reservation_time: nextReservationTime,
      reservation_end_time: nextReservationEndTime,
      location: location !== undefined ? (location || null) : (current.location ?? null),
      confirmation_number: confirmation_number !== undefined ? (confirmation_number || null) : (current.confirmation_number ?? null),
      notes: notes !== undefined ? (notes || null) : (current.notes ?? null),
      url: url !== undefined ? (url || null) : ((current as Reservation & { url?: string | null }).url ?? null),
      day_id: nextDayId,
      end_day_id: nextEndDayId,
      place_id: nextPlaceId,
      assignment_id: nextAssignmentId,
      status: status || current.status,
      type: type || current.type,
      accommodation_id: resolvedAccId == null ? null : (typeof resolvedAccId === 'number' ? legacyBoundIntegerText(resolvedAccId) : resolvedAccId),
      metadata: nextMetadata !== undefined ? (nextMetadata ? JSON.stringify(nextMetadata) : null) : (current.metadata ?? null),
      needs_review: needs_review === undefined ? (current.needs_review ?? 0) : (needs_review ? 1 : 0),
    });

    if (endpoints !== undefined) {
      await this.saveEndpoints(idNum, endpoints);
    }

    // Sync check-in/out to accommodation if linked
    const resolvedMeta = nextMetadata !== undefined ? nextMetadata : (current.metadata ? JSON.parse(current.metadata as string) : null);
    if (resolvedAccId && resolvedMeta) {
      const meta = (typeof resolvedMeta === 'string' ? JSON.parse(resolvedMeta) : resolvedMeta) as AccommodationTimesMeta;
      const resolvedAccIdNum = accIdForRead(resolvedAccId)!;
      if (meta.check_in_time || meta.check_in_end_time || meta.check_out_time) {
        // RS42
        await this.dayAccommodationsRepo.patchTimes(
          resolvedAccIdNum, meta.check_in_time || null, meta.check_in_end_time || null, meta.check_out_time || null,
        );
      }
      const resolvedConf = confirmation_number !== undefined ? confirmation_number : current.confirmation_number;
      if (resolvedConf) {
        // RS43
        await this.dayAccommodationsRepo.patchConfirmation(resolvedAccIdNum, resolvedConf);
      }
    }

    // The caller passed the pre-checked `current` row, so the re-select can't
    // miss (legacy typed this any).
    const reservation = (await this.getReservationWithJoins(id))!;
    return { reservation, accommodationChanged, stayMirror };
  }

  /** The accommodation + budget-item + reservation deletes are one logical
   *  cascade — all-or-nothing. */
  async remove(id: string | number, tripId: string | number): Promise<{ deleted: { id: number; title: string; type: string | null; accommodation_id: string | null } | undefined; accommodationDeleted: boolean; deletedBudgetItemId: number | null; deletedBudgetItemIds: number[] }> {
    // M4, Plan 3d Task 7 review: parsed ONCE here with `toRowId` (rule 21),
    // not `rowIdNum` — `rowIdNum`'s `Number(...)` fallback let a hex/exponent
    // id (`0x1`, `1e1`) reach `findHeaderInTrip` and delete a real row where
    // the legacy raw-bind statement 404'd. A miss here answers exactly the
    // `findHeaderInTrip`-miss shape below, without touching the DB.
    const idNum = toRowId(id);
    const tripIdNum = toRowId(tripId);
    if (idNum === null || tripIdNum === null) {
      return { deleted: undefined, accommodationDeleted: false, deletedBudgetItemId: null, deletedBudgetItemIds: [] };
    }
    const removed = await this.uow.transactional(async () => {
      // RS45
      const reservation = await this.reservationsRepo.findHeaderInTrip(idNum, tripIdNum);
      if (!reservation) return { deleted: undefined, accommodationDeleted: false, deletedBudgetItemId: null, deletedBudgetItemIds: [], stayMirror: noStayMirror() };

      let accommodationDeleted = false;
      let stayMirror = noStayMirror();
      if (reservation.accommodation_id) {
        // trip_id in the check, not just the reservation's own scope: a row written
        // before referencesOutsideTrip existed can still carry a foreign
        // accommodation_id, and the cascade must not follow it. The stops go by
        // accommodation id alone, which is exactly the reach that guard denies.
        // accommodation_id is TEXT (R2); Number(...) here is a READ-time
        // normalisation only, the same `Math.trunc(Number(x))`-style
        // coercion every other reader of this column already applies — the
        // WRITE-side raw string (`reservation.accommodation_id`) still ships
        // unconverted in the `accommodation:deleted` broadcast payload below.
        const accIdNum = Number(reservation.accommodation_id);
        // RS46
        const ownStay = await this.dayAccommodationsRepo.existsInTrip(accIdNum, tripIdNum);
        if (ownStay) {
          // Released before the row goes, not after: the release looks the stops up
          // by accommodation id, and that pointer is cleared the moment the stay is
          // deleted. Reversed, the stop stands with nothing left to remove it, and
          // the day list hides it for carrying a booking id.
          stayMirror = await this.accommodations.dropStayStops(accIdNum);
          // RS47
          await this.dayAccommodationsRepo.deleteInTrip(accIdNum, tripIdNum);
          accommodationDeleted = true;
        }
      }

      // RS48/RS49: a booking can carry several expenses (#2084); every one of them goes with it.
      // Same `toRowId`-parsed ids the gate above (`findHeaderInTrip`) used (rule 21).
      const deletedBudgetItemIds = (await this.budgetItemsRepo.listIdAndCategoryByReservation(tripIdNum, idNum)).map(item => item.id);
      await this.budgetItemsRepo.deleteByIds(deletedBudgetItemIds);

      // RS50
      await this.reservationsRepo.deleteById(idNum);
      return { deleted: reservation, accommodationDeleted, deletedBudgetItemId: deletedBudgetItemIds[0] ?? null, deletedBudgetItemIds, stayMirror };
    });
    const { stayMirror, ...answer } = removed;
    await this.announceStayMirror(tripId, stayMirror);
    return answer;
  }

  /**
   * The linked cost a new booking's price becomes, in the currency the price was quoted
   * in and at the rate frozen for it now (#2525). An imported booking previewed its
   * $801.76 in dollars, then stored 801.76 in the trip's own currency, because only the
   * amount travelled. The rate is resolved here, before the writes and outside their
   * transaction (the fetch is network I/O, and `UnitOfWork.transactional` holds the
   * connection), the way the direct booking import and the Costs routes resolve it.
   * A currency that is not a three-letter code is dropped, which leaves the price in
   * the trip currency as before, and a rate is never taken from the caller.
   */
  async withFrozenRate(tripId: string | number, entry: BudgetEntry): Promise<BudgetEntry> {
    if (!entry || typeof entry !== 'object') return entry;
    const { currency: rawCurrency, exchange_rate: _callerRate, ...rest } = entry;
    const currency = typeof rawCurrency === 'string' ? rawCurrency.trim().toUpperCase() : '';
    if (!/^[A-Z]{3}$/.test(currency)) return rest;
    const priced: { currency?: string | null; exchange_rate?: number } = { currency };
    await this.budget.freezeForeignRate(tripId, priced);
    return { ...rest, currency, ...(priced.exchange_rate != null ? { exchange_rate: priced.exchange_rate } : {}) };
  }

  /** POST side effect: auto-create a linked budget item when a price is provided. */
  async syncBudgetOnCreate(tripId: string, reservationId: number, title: string, type: string | undefined, entry: BudgetEntry, socketId: string | undefined): Promise<void> {
    if (!entry || !(Number(entry.total_price) > 0)) return;
    try {
      const item = await this.budget.linkBudgetItemToReservation(tripId, reservationId, {
        name: title,
        category: entry.category || type || 'Other',
        total_price: entry.total_price!,
        ...(entry.currency ? { currency: entry.currency } : {}),
        ...(entry.exchange_rate != null ? { exchange_rate: entry.exchange_rate } : {}),
      });
      this.realtime.broadcast(tripId, 'budget:created', { item }, socketId);
    } catch (err) {
      console.error('[reservations] Failed to create budget entry:', err);
    }
  }

  /** PUT side effect: drop the linked budget item when the price is cleared, else create/update it. */
  async syncBudgetOnUpdate(tripId: string, id: string, title: string, type: string | undefined, currentTitle: string, currentType: string | undefined, entry: BudgetEntry, socketId: string | undefined): Promise<void> {
    // When the booking type changes, keep a linked expense's category in sync —
    // but only if it still carries the auto-derived category (so a manual pick in
    // the Costs editor is preserved). Runs regardless of create_budget_entry.
    if (type && currentType && type !== currentType) {
      const oldCat = typeToCostCategory(currentType);
      const newCat = typeToCostCategory(type);
      // RS51. Every linked expense (#2084), each only while it still has the derived category.
      const linked = oldCat === newCat ? [] : await this.budgetItemsRepo.listIdAndCategoryByReservation(tripId, id);
      for (const item of linked.filter(i => i.category === oldCat)) {
        const updated = await this.budget.updateBudgetItem(item.id, tripId, { category: newCat });
        this.realtime.broadcast(tripId, 'budget:updated', { item: updated }, socketId);
      }
    }

    // No budget entry on the payload — the booking edit isn't touching its linked
    // expense, so leave any linked item alone. Expenses are managed from the
    // booking's Costs section / the Costs tab, not by re-saving the booking.
    if (!entry) return;
    // The price field speaks for a single expense. With several linked (#2084)
    // it has none to mean, so they are managed from the Costs block only.
    // RS51
    if ((await this.budgetItemsRepo.listIdAndCategoryByReservation(tripId, id)).length > 1) return;

    if (!(Number(entry.total_price) > 0)) {
      // Explicit clear (total_price 0/empty) — drop the linked item. RS52 — Plan 3e Task 2, converted.
      const linked = await this.budgetItemsRepo.findIdByReservationInTrip(tripId, id);
      if (linked) {
        await this.budget.deleteBudgetItem(linked.id, tripId);
        this.realtime.broadcast(tripId, 'budget:deleted', { itemId: linked.id }, socketId);
      }
      return;
    }

    try {
      const itemName = title || currentTitle;
      const category = entry.category || type || currentType || 'Other';
      // RS53 — Plan 3e Task 2, converted.
      const existing = await this.budgetItemsRepo.findIdByReservationInTrip(tripId, id);
      if (existing) {
        const updated = await this.budget.updateBudgetItem(existing.id, tripId, { name: itemName, category, total_price: entry.total_price });
        this.realtime.broadcast(tripId, 'budget:updated', { item: updated }, socketId);
      } else {
        const item = await this.budget.createBudgetItem(tripId, { name: itemName, category, total_price: entry.total_price });
        // RS54 — Plan 3e Task 2, converted.
        await this.budgetItemsRepo.setReservationId(item.id, id);
        item.reservation_id = Number(id);
        this.realtime.broadcast(tripId, 'budget:created', { item }, socketId);
      }
    } catch (err) {
      console.error('[reservations] Failed to create/update budget entry:', err);
    }
  }
}
