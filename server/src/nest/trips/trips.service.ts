import { Injectable } from '@nestjs/common';
import path from 'path';
import { EntityManager } from '@mikro-orm/core';
import { Trips } from '../../db/entities/Trips.entity';
import { Days } from '../../db/entities/Days.entity';
import { JourneyEntries } from '../../db/entities/JourneyEntries.entity';
import { Users } from '../../db/entities/Users.entity';
import { Places } from '../../db/entities/Places.entity';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import { AssignmentParticipants } from '../../db/entities/AssignmentParticipants.entity';
import { Tags } from '../../db/entities/Tags.entity';
import { DayNotes } from '../../db/entities/DayNotes.entity';
import { RoadtripVias } from '../../db/entities/RoadtripVias.entity';
import { RoadtripDayTracks } from '../../db/entities/RoadtripDayTracks.entity';
import { RoadtripPreferences } from '../../db/entities/RoadtripPreferences.entity';
import { RoadtripDayBoundaries } from '../../db/entities/RoadtripDayBoundaries.entity';
import { DayAccommodations } from '../../db/entities/DayAccommodations.entity';
import { Reservations } from '../../db/entities/Reservations.entity';
import { BudgetItems } from '../../db/entities/BudgetItems.entity';
import { BudgetItemMembers } from '../../db/entities/BudgetItemMembers.entity';
import { BudgetItemPayers } from '../../db/entities/BudgetItemPayers.entity';
import { BudgetCategoryOrder } from '../../db/entities/BudgetCategoryOrder.entity';
import { PackingBags } from '../../db/entities/PackingBags.entity';
import { PackingItems } from '../../db/entities/PackingItems.entity';
import { TodoItems } from '../../db/entities/TodoItems.entity';
import { Tours } from '../../db/entities/Tours.entity';
import { TourWaypoints } from '../../db/entities/TourWaypoints.entity';
import type { TourWaypointRow } from '../../db/repositories/TourWaypoints.repository';
import {
  MAX_TRIP_DAYS,
  addIsoDays,
  planDayGrid,
  resolveDayGridRange,
  tripSpanDays,
  type ActiveTrip,
  type DayGridPlan,
  type DayGridRemoval,
  type TrekWsPayload,
  type TrekWsTripEventName,
} from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import type { Trip, User } from '../../types';
import { DaysService } from '../days/days.service';
import { BudgetService, type CurrencyRebase } from '../budget/budget.service';
import { ReservationsService } from '../reservations/reservations.service';
import { VacayService } from '../vacay/vacay.service';
import { UnsplashService } from '../unsplash/unsplash.service';
import { StorageService } from '../storage/storage.service';
import { SettingsService } from '../settings/settings.service';
import { escapeLikePattern } from '../places/places.helpers';
import { NotFoundError, ValidationError } from '../common/domain-errors';
import { UnitOfWork } from '../database/unit-of-work';
import { legacyBoundIntegerText } from '../common/row-id';
import { appClock } from '../common/timezoneService';

/**
 * The date range is refused, not cut short: generateDays used to clip the day
 * rows at the limit while the trip kept its full end date, so everything past
 * the cut-off had dates but no day to go on (#2403). An inverted range is
 * refused here as well, because a start date moved past the stored end date
 * arrives on its own and would otherwise empty the trip.
 */
function assertTripSpan(startDate: string, endDate: string) {
  const span = tripSpanDays(startDate, endDate);
  if (span < 1) throw new ValidationError('End date must be after start date');
  if (span > MAX_TRIP_DAYS) throw new ValidationError(`A trip can span at most ${MAX_TRIP_DAYS} days`);
}

/**
 * Strips `feed_token` from a trip row on its way out.
 *
 * The column is the sole credential for the anonymous /api/feed/trip/:token.ics
 * route, and `SELECT t.*` hands it to every reader of the trip. Gating the
 * token endpoint on `share_manage` means nothing while any member can read the
 * same value out of the trip payload, so the two go together. No TREK client
 * reads the field (it is absent from client/ and shared/ entirely).
 */
export function withoutFeedToken<T>(row: T): T {
  if (row && typeof row === 'object') delete (row as Record<string, unknown>).feed_token;
  return row;
}


interface CreateTripData {
  title: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  currency?: string;
  reminder_days?: number;
  day_count?: number;
}

// Nullable where the wire contract (tripUpdateRequestSchema) is nullable — the
// legacy route accepted arbitrary JSON, so null always reached these fields.
interface UpdateTripData {
  title?: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  currency?: string;
  is_archived?: boolean | number;
  cover_image?: string | null;
  reminder_days?: number;
  day_count?: number;
  date_shift_mode?: 'keep_bookings' | 'shift_all';
}

export interface UpdateTripResult {
  updatedTrip: any;
  changes: Record<string, unknown>;
  isAdminEdit: boolean;
  ownerEmail?: string;
  newTitle: string;
  newReminder: number;
  oldReminder: number;
  /** The day rows a changed range took away, as they stood before; empty when none went. */
  removedDays: DayGridRemoval[];
}

export interface DeleteTripInfo {
  tripId: number;
  title: string;
  ownerId: number;
  isAdminDelete: boolean;
  ownerEmail?: string;
}

export interface AddMemberResult {
  member: { id: number; username: string; email: string; avatar?: string | null; role: string; avatar_url: string | null };
  targetUserId: number;
  tripTitle: string;
}

export interface TransferOwnershipResult {
  tripTitle: string;
  fromEmail: string;
  toEmail: string;
}

// ── Guest members (#1362) ───────────────────────────────────────────────────
//
// A guest is a credential-less users row (is_guest=1) joined into trip_members, so
// it is assignable everywhere a real member is (budget splits, packing, to-dos, day
// participants) yet can never authenticate (the auth/global-list guards exclude
// is_guest=1). The display name lives in users.username so every existing JOIN that
// renders a member name shows the guest correctly; a synthetic, non-deliverable
// email keeps the UNIQUE/NOT NULL constraints satisfied.

export interface GuestMember {
  id: number;
  username: string;
  email: string;
  role: 'member';
  is_guest: true;
  avatar_url: null;
}

/**
 * Trip aggregate root, DI-native. Membership, the calendar export and the two
 * read aggregates live in their own domains now; what is left is the write core
 * plus day generation, which is why the constructor is far shorter than the
 * fourteen parameters it started with. The SQL moved 1:1 from the legacy
 * services/tripService.ts: identical statements, the `||` falsy-coercion
 * defaults, the post-write TRIP_SELECT re-selects and the mixed
 * named/positional parameter styles are all preserved byte-for-byte.
 * Post-migration quirk fixes on top of the 1:1 move: the multi-statement
 * deletes (remove, deleteGuest's re-split + user delete) run in
 * db.transaction(), listMembers' owner row COALESCEs display_name like
 * the member rows, and create() defaults the currency to the owner's display
 * currency instead of the legacy EUR literal. Auth (canAccessTrip), per-field permission checks and
 * audit logging stay in the controller (1:1 with the legacy route);
 * trip:updated / trip:deleted broadcasts stay in the controller too — this
 * service emits none.
 */
@Injectable()
export class TripsService {
  constructor(
    private readonly reservations: ReservationsService,
    private readonly days: DaysService,
    private readonly permissions: PermissionsService,
    private readonly budget: BudgetService,
    private readonly vacay: VacayService,
    private readonly realtime: RealtimeService,
    private readonly unsplash: UnsplashService,
    private readonly storage: StorageService,
    private readonly uow: UnitOfWork,
    // Plan 3c Task 0b (task-0a-review-security.md F-A1): `canAccessTrip`/
    // `isOwner` below resolve `TripsRepository` directly through this,
    // rather than through `this.dbs.canAccessTrip`/`isOwner` — the third of
    // the security review's three sites, alongside `TripAccessGuard` and
    // `TripOwnerGuard`. `EntityManager` is `@Global()` (`MikroOrmModule
    // .forRoot`'s core module), so no module needs new wiring.
    private readonly em: EntityManager,
    private readonly settings: SettingsService,
  ) {}

  // Plan 3c Task 7: the raw better-sqlite3 handle used to back `remove`'s
  // TP32/TP33 (journey_entries) — converted by Plan 3g Task 4 onto
  // `JourneyEntriesRepository` below. Every method in this file
  // reads/writes through `tripsRepo`/`daysRepo`/`journeyEntriesRepo` (or a
  // sibling repository reached the same way `TripsService.canAccessTrip`/
  // `.isOwner` already did since Task 0b: `this.em.getRepository(...)`, not
  // a constructor parameter — the shared per-request `EntityManager`
  // caches repositories, so this is the same instance a hand-constructed
  // test spies on). Plan 4 Task 4 dropped the dead `DatabaseService`
  // injection and this `get db()` getter with it.

  private get tripsRepo() {
    return this.em.getRepository(Trips);
  }

  private get daysRepo() {
    return this.em.getRepository(Days);
  }

  /**
   * The currency a trip gets when the caller names none: the person's display
   * currency, admin default merged in, else EUR. The trip dialog pre-fills the
   * same value on the client, so a trip created through MCP or a plugin lands
   * in the currency the person reads amounts in instead of always in EUR.
   */
  private async defaultCurrencyFor(userId: number): Promise<string> {
    const preferred = (await this.settings.getUserSettings(userId)).default_currency;
    return typeof preferred === 'string' && preferred.trim() ? preferred.trim() : 'EUR';
  }

  // Plan 3g Task 4 (TP32/TP33) — `journey_entries`' trip-wide skeleton
  // cleanup/detach, reached the same `this.em.getRepository(...)` way as
  // `tripsRepo`/`daysRepo` above.
  private get journeyEntriesRepo() {
    return this.em.getRepository(JourneyEntries);
  }

  // Plan 3c Task 8 (`copy`'s own 6 owned tables): resolved the same way
  // `tripsRepo`/`daysRepo` above are — `this.em.getRepository(...)`, not a
  // new constructor parameter.
  private get placesRepo() {
    return this.em.getRepository(Places);
  }

  private get dayAssignmentsRepo() {
    return this.em.getRepository(DayAssignments);
  }

  private get assignmentParticipantsRepo() {
    return this.em.getRepository(AssignmentParticipants);
  }

  private get tagsRepo() {
    return this.em.getRepository(Tags);
  }

  private get dayNotesRepo() {
    return this.em.getRepository(DayNotes);
  }

  // Plan 3d Task 6 (`copy`'s 11 survivors — roadtrip vias/tracks/preferences/
  // boundaries, day_accommodations, reservations): same `this.em
  // .getRepository(...)` pattern as the Task 8 getters above, not a new
  // constructor parameter.
  private get roadtripViasRepo() {
    return this.em.getRepository(RoadtripVias);
  }

  private get roadtripDayTracksRepo() {
    return this.em.getRepository(RoadtripDayTracks);
  }

  private get roadtripPreferencesRepo() {
    return this.em.getRepository(RoadtripPreferences);
  }

  private get roadtripDayBoundariesRepo() {
    return this.em.getRepository(RoadtripDayBoundaries);
  }

  private get dayAccommodationsRepo() {
    return this.em.getRepository(DayAccommodations);
  }

  // Plan 3d Task 7 whole-plan review (item 8/D4): TP58/TP59 (the
  // reservations copy read/insert) moved onto `ReservationsRepository` —
  // the table they read/write — out of `ReservationEndpointsRepository`,
  // where they used to live only because Task 4 owned this file for the
  // Task 6 tree window. Same `this.em.getRepository(...)` pattern as every
  // other getter above.
  private get reservationsRepo() {
    return this.em.getRepository(Reservations);
  }

  // Plan 3e Task 2 (budget) — TP60-65/74-75 only (the budget-family rows of
  // `copy`'s 14 survivors; TP66-69/packing and TP72-73/todo are Tasks 3/4's).
  // Same `this.em.getRepository(...)` pattern as every getter above.
  private get budgetItemsRepo() {
    return this.em.getRepository(BudgetItems);
  }

  private get budgetItemMembersRepo() {
    return this.em.getRepository(BudgetItemMembers);
  }

  private get budgetItemPayersRepo() {
    return this.em.getRepository(BudgetItemPayers);
  }

  private get budgetCategoryOrderRepo() {
    return this.em.getRepository(BudgetCategoryOrder);
  }

  // Plan 3e Task 3 (packing) — TP66-69 only (the packing-family rows of
  // `copy`'s 14 survivors). Same `this.em.getRepository(...)` pattern as
  // every getter above.
  private get packingBagsRepo() {
    return this.em.getRepository(PackingBags);
  }

  private get packingItemsRepo() {
    return this.em.getRepository(PackingItems);
  }

  // Plan 3e Task 4 (todo) — TP72-73 only (the todo-family rows of `copy`'s
  // 14 survivors). Same `this.em.getRepository(...)` pattern as every
  // getter above.
  private get todoItemsRepo() {
    return this.em.getRepository(TodoItems);
  }

  // Tours (#2586): a Tour's facet row and its route waypoints, copied with
  // the place they hang off. Same `this.em.getRepository(...)` pattern.
  private get toursRepo() {
    return this.em.getRepository(Tours);
  }

  private get tourWaypointsRepo() {
    return this.em.getRepository(TourWaypoints);
  }

  async canAccessTrip(tripId: string | number, userId: number) {
    const access = await this.em.getRepository(Trips).findAccessible(tripId, userId);
    return access as { user_id: number } | null | undefined;
  }

  async isOwner(tripId: string | number, userId: number): Promise<boolean> {
    return await this.em.getRepository(Trips).isOwner(tripId, userId);
  }

  async can(action: string, role: string, ownerId: number | null, userId: number, isMember: boolean): Promise<boolean> {
    return this.permissions.checkPermission(action, role, ownerId, userId, isMember);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  // ── Day generation ────────────────────────────────────────────────────────

  /**
   * Lay the trip's day rows out for a range, by the shared planDayGrid rule the
   * trip dialog warns by: the plan says which row takes which position and date
   * and which rows go, and this carries it out. The two-phase numbering keeps
   * UNIQUE(trip_id, day_number) quiet while rows swap places. A removed day
   * takes its assignments, notes and every stay checking in or out on it along
   * through the foreign keys, as it always has (#909). Returns the plan it ran.
   *
   * TP77/TP78 read the grid, then TP2/TP9/TP10/TP11 (all `DaysRepository`)
   * carry it out, sequentially (`for…of`, never `Promise.all`: order is
   * load-bearing against `UNIQUE(trip_id, day_number)`). The whole rebuild
   * runs in one `uow.transactional` — a savepoint when `updateTrip`'s own
   * block already holds the transaction, its own transaction from `create`.
   */
  async generateDays(tripId: number | bigint | string, startDate: string | null, endDate: string | null, dayCount?: number): Promise<DayGridPlan> {
    const trip_id = Number(tripId);
    return await this.uow.transactional(async () => {
      const existing = await this.daysRepo.listForDayGrid(trip_id); // TP77
      const stays = await this.daysRepo.listDayGridStays(trip_id); // TP78

      const plan = planDayGrid({
        days: existing.map(d => ({ id: d.id, day_number: d.day_number, date: d.date, hasPlanItems: !!d.has_plan_items })),
        stays,
        startDate,
        endDate,
        dayCount,
      });

      const dateBefore = new Map(existing.map(d => [d.id, d.date]));
      for (let i = 0; i < existing.length; i++) await this.daysRepo.setDayNumber(existing[i].id, -(i + 1)); // TP2
      for (let i = 0; i < plan.rows.length; i++) {
        const row = plan.rows[i];
        if (row.id === null) await this.daysRepo.insertDay({ trip_id, day_number: i + 1, date: row.date }); // TP10
        // A row that had no date and gets none is only renumbered, so an odd
        // stored value is left as it was, the way the rebuild always treated it.
        else if (row.date === null && !dateBefore.get(row.id)) await this.daysRepo.setDayNumber(row.id, i + 1); // TP2
        else await this.daysRepo.setDayNumberAndDate(row.id, i + 1, row.date); // TP9
      }
      for (const gone of plan.removed) await this.daysRepo.deleteById(gone.id); // TP11
      return plan;
    });
  }

  // ── Trip CRUD ─────────────────────────────────────────────────────────────

  /** TP16/TP17 — `TripsRepository.listForUser` (`TRIP_SELECT` + the access join, ONE builder, inventory §11a/§11c). */
  async list(userId: number, archived: number | null) {
    return this.tripsRepo.listForUser(userId, archived);
  }

  async create(userId: number, data: CreateTripData) {
    // One given date makes a week, on REST and MCP alike. Calendar arithmetic
    // in UTC: a local-time Date shifted across a DST change lost or gained a day.
    let startDate = data.start_date || null;
    let endDate = data.end_date || null;
    if (startDate && !endDate) endDate = addIsoDays(startDate, 6);
    else if (!startDate && endDate) startDate = addIsoDays(endDate, -6);
    if (startDate && endDate) assertTripSpan(startDate, endDate);
    const rd = data.reminder_days !== undefined
      ? (Number(data.reminder_days) >= 0 && Number(data.reminder_days) <= 30 ? Number(data.reminder_days) : 3)
      : 3;
    const currency = data.currency || (await this.defaultCurrencyFor(userId));

    // The trip and its days commit together: a failure in between used to leave
    // a dated trip without a single day.
    const tripId = await this.uow.transactional(async () => {
      const id = await this.tripsRepo.insertTrip({ // TP18
        user_id: userId,
        title: data.title,
        description: data.description || null,
        start_date: startDate,
        end_date: endDate,
        currency,
        reminder_days: rd,
      });
      await this.generateDays(id, startDate, endDate, data.day_count);
      return id;
    });

    const trip = await this.tripsRepo.findForViewer(tripId, userId); // TP19 — the creator always owns it, so the access predicate is trivially satisfied
    return { trip, tripId, reminderDays: rd };
  }

  /** TP20 — `TripsRepository.findForViewer`: `TRIP_SELECT` scoped to one trip AND the access predicate. */
  async get(tripId: string | number, userId: number) {
    return await this.tripsRepo.findForViewer(tripId, userId) as Trip | undefined;
  }

  /**
   * The trip a user most likely means by "my trip" right now: the one running
   * today, else the next one starting, else the one that started most recently.
   * Archived trips never qualify. Same order the dashboard hero picks its
   * spotlight with (client sortTrips) — the two must agree, or "open my trip on
   * startup" would land somewhere other than the trip the dashboard features.
   *
   * Kept separate from list() on purpose: this runs on the very first paint of
   * a startup redirect, so it reads four columns of one row instead of every
   * trip with its per-trip day/place counts.
   */
  /** TP21 — `TripsRepository.activeTrip`: the triple `CASE WHEN … relevance` projection and the double-`CASE WHEN` `ORDER BY`. */
  async activeTrip(userId: number, today = appClock().date) {
    return await this.tripsRepo.activeTrip(userId, today) as ActiveTrip & { relevance: number } | undefined;
  }

  /**
   * The user's trips, archived ones included, with places whose name or address
   * contains `query` (#2190). Up to three names per trip; a query under two
   * characters matches nothing, it would match every place there is.
   */
  async searchPlaces(userId: number, query: string): Promise<{ trip_id: number; places: string[] }[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const like = `%${escapeLikePattern(q)}%`;
    const rows = await this.tripsRepo.searchPlaceNames(userId, like); // TP79
    const byTrip = new Map<number, string[]>();
    for (const row of rows) {
      const names = byTrip.get(row.trip_id) ?? [];
      if (names.length < 3 && !names.includes(row.name)) names.push(row.name);
      byTrip.set(row.trip_id, names);
    }
    return [...byTrip].map(([trip_id, places]) => ({ trip_id, places }));
  }

  /** TP22 — `TripsRepository.findRaw` (shared with `TripReadModelService.getTripSummary`, TR-B, per the inventory's own note that they are the identical statement). */
  async getRaw(tripId: string | number): Promise<Trip | undefined> {
    const row = await this.tripsRepo.findRaw(tripId);
    return (row ?? undefined) as Trip | undefined;
  }

  async searchCoverImages(query: string, userId: number) {
    return this.unsplash.searchUnsplashPhotos(query, 9, await this.unsplash.getUnsplashKey(userId));
  }

  /** TP23 — `TripsRepository.getOwnerId` (already existed, TB1), reshaped to the legacy `{user_id}` row shape (matches `TripReadModelService`'s own TR-A reshape). */
  async getOwner(tripId: string | number): Promise<{ user_id: number } | undefined> {
    const ownerId = await this.tripsRepo.getOwnerId(tripId);
    return ownerId === null ? undefined : { user_id: ownerId };
  }

  /**
   * The folded legacy updateTrip core. The plugin RPC host calls it without `rebase` (the legacy
   * host path never rebased); update() below passes one. TP24 to TP29 (inventory §11c): the budget
   * rebase, the trip row (TP25), the leave entries that follow its dates and the rebuilt day grid
   * are one transaction, so a failing `generateDays` or booking resync leaves all of them as they were.
   */
  async updateTrip(tripId: string | number, userId: number, data: UpdateTripData, userRole: string, rebase: CurrencyRebase | null = null): Promise<UpdateTripResult> {
    const trip = await this.tripsRepo.findRaw(tripId) as (Trip & { reminder_days?: number }) | null; // TP24
    if (!trip) throw new NotFoundError('Trip not found');

    const { title, description, currency, is_archived, cover_image, reminder_days } = data;
    const { newStart, newEnd, dayCount, regenerate } = this.resolveRange(trip, data);

    const newTitle = title || trip.title;
    const newDesc = description !== undefined ? description : trip.description;
    const newCurrency = currency || trip.currency;
    const newArchived = is_archived !== undefined ? (is_archived ? 1 : 0) : trip.is_archived;
    const newCover = cover_image !== undefined ? cover_image : trip.cover_image;
    const oldReminder = (trip as any).reminder_days ?? 3;
    const newReminder = reminder_days !== undefined
      ? (Number(reminder_days) >= 0 && Number(reminder_days) <= 30 ? Number(reminder_days) : oldReminder)
      : oldReminder;

    const tripIdNum = Number(tripId); // safe: `trip` above only resolved through the raw-bind seam on a real row (Task 6 review's own ruling on this exact conversion)
    // The row, the leave entries that follow its dates and the rebuilt day grid are
    // one write: a failure halfway used to leave a trip whose days missed its dates.
    let removedDays: DayGridRemoval[] = [];
    await this.uow.transactional(async () => {
      // Before the row: the rebase reads the outgoing currency off it (#1543).
      if (rebase) await this.budget.applyCurrencyRebase(tripId, rebase);
      await this.tripsRepo.updateTripRow(tripIdNum, { // TP25
        title: newTitle,
        description: newDesc ?? null,
        start_date: newStart || null,
        end_date: newEnd || null,
        currency: newCurrency,
        // Task 7 security review L1 (absorbed here): `newArchived` is already
        // `trip.is_archived` verbatim when `data.is_archived` was never sent —
        // the legacy statement bound that value AS-IS, including a stored
        // `NULL`. A `?? 0` fold here would write `0` in that case instead,
        // silently un-nulling a column the caller never asked to change.
        is_archived: newArchived,
        cover_image: newCover ?? null,
        reminder_days: newReminder,
      });

      if (trip.start_date && trip.end_date && newStart && newStart !== trip.start_date)
        await this.vacay.shiftOwnerEntriesForTripWindow(trip.user_id, trip.start_date, trip.end_date, newStart);

      if (regenerate) {
        // Accommodations have no absolute date columns, so their pre-change dates must be
        // snapshotted before generateDays re-dates the day rows in place.
        const prevDays = await this.daysRepo.listOrderedForReorder(tripIdNum); // TP26
        const prevDateByDayId = new Map(prevDays.map(d => [d.id, d.date]));
        removedDays = (await this.generateDays(tripId, newStart || null, newEnd || null, dayCount)).removed;
        if (data.date_shift_mode === 'shift_all') {
          // Explicit "shift everything": bookings stay glued to their (re-dated) day rows,
          // so re-stamp reservation_time to follow — same rules as reorderDays/insertDay.
          const newDays = await this.daysRepo.listOrderedForReorder(tripIdNum); // TP27
          const newDateByDayId = new Map(newDays.map(d => [d.id, d.date]));
          await this.days.restampReservationDates(tripIdNum, prevDateByDayId, newDateByDayId);
        } else {
          // Default: generateDays re-dates day rows positionally; re-anchor dated bookings to
          // the day matching their absolute reservation_time, and accommodations (+ their
          // linked hotel reservations) to the days now holding their pre-change dates (#1288).
          await this.reservations.resyncReservationDays(tripId);
          await this.days.resyncAccommodationDays(tripIdNum, prevDateByDayId);
        }
      }
    });

    const changes: Record<string, unknown> = {};
    if (title && title !== trip.title) changes.title = title;
    if (newStart !== trip.start_date) changes.start_date = newStart;
    if (newEnd !== trip.end_date) changes.end_date = newEnd;
    if (newReminder !== oldReminder) changes.reminder_days = newReminder === 0 ? 'none' : `${newReminder} days`;
    if (is_archived !== undefined && newArchived !== trip.is_archived) changes.archived = !!newArchived;

    const isAdminEdit = userRole === 'admin' && trip.user_id !== userId;
    let ownerEmail: string | undefined;
    if (Object.keys(changes).length > 0 && isAdminEdit) {
      ownerEmail = (await this.em.getRepository(Users).getEmail(trip.user_id)) ?? undefined; // TP28
    }

    // TP29 — every caller of updateTrip has already passed an access check for
    // this exact trip (canAccessTrip / requireTripEdit), so the access
    // predicate `findForViewer` applies is always trivially satisfied here —
    // same reasoning as `create`'s TP19 re-select above.
    const updatedTrip = await this.tripsRepo.findForViewer(tripId, userId);

    return { updatedTrip, changes, isAdminEdit, ownerEmail, newTitle, newReminder, oldReminder, removedDays };
  }

  /**
   * The dates the update leaves the trip with, checked before anything is
   * written. The day grid is rebuilt whenever a date moves or a day_count
   * arrives, and a dated rebuild runs over the whole range, so the range is
   * held to the limit exactly then. A trip stored with a longer range can
   * still be renamed.
   */
  private resolveRange(trip: Trip, data: UpdateTripData) {
    const { start_date, end_date } = data;
    if (start_date && end_date && new Date(end_date) < new Date(start_date))
      throw new ValidationError('End date must be after start date');
    const range = resolveDayGridRange(trip, data);
    if (range.regenerate && range.newStart && range.newEnd) assertTripSpan(range.newStart, range.newEnd);
    return range;
  }

  async update(tripId: string | number, userId: number, body: UpdateTripData, role: string) {
    // A refused range must not leave the budget rebased onto a currency the trip
    // never took, so the dates are checked before the first write.
    const trip = await this.getRaw(tripId);
    if (!trip) throw new NotFoundError('Trip not found');
    this.resolveRange(trip, body);
    // Re-anchor the budget so frozen rates and currency-less expenses do not point at a currency
    // the trip left (#1543). The rates are fetched here, the rebase is written with the trip row.
    const rebase = await this.budget.prepareCurrencyRebase(tripId, body.currency);
    return await this.updateTrip(tripId, userId, body, role, rebase);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  /**
   * TP30–TP34 (inventory §11c) — every statement, including TP32/TP33
   * (`journey_entries`), moves through a repository (TP32/TP33 converted by
   * Plan 3g Task 4 onto `JourneyEntriesRepository`).
   */
  async remove(tripId: string | number, userId: number, userRole: string): Promise<DeleteTripInfo> {
    const trip = await this.tripsRepo.findIdTitleOwner(tripId); // TP30 (the `id` field this method also selects is unused here)
    if (!trip) throw new NotFoundError('Trip not found');

    const isAdminDelete = userRole === 'admin' && trip.user_id !== userId;
    let ownerEmail: string | undefined;
    if (isAdminDelete) {
      ownerEmail = (await this.em.getRepository(Users).getEmail(trip.user_id)) ?? undefined; // TP31
    }

    // Quirk fix on top of the 1:1 move: the three-statement delete runs in a
    // transaction, so a failure mid-flow can't leave journey entries detached
    // from a trip that still exists.
    await this.uow.transactional(async () => {
      // Clean up journey entries synced from this trip before deleting
      // Delete skeleton entries (unfilled synced places)
      await this.journeyEntriesRepo.deleteAllSkeletonsForTrip(Number(tripId)); // TP32 — converted (Plan 3g Task 4)
      // Detach filled entries (keep user's written content, just remove trip link)
      await this.journeyEntriesRepo.detachAllFilledForTrip(Number(tripId)); // TP33 — converted (Plan 3g Task 4)

      await this.tripsRepo.deleteById(Number(tripId)); // TP34 — safe: `trip` above only resolved through the raw-bind seam on a real row
    });

    return { tripId: Number(tripId), title: trip.title, ownerId: trip.user_id, isAdminDelete, ownerEmail };
  }

  // ── Cover image ───────────────────────────────────────────────────────────

  async deleteOldCover(coverImage: string | null | undefined): Promise<void> {
    if (!coverImage) return;
    // cover_image is client-supplied, so treat it as untrusted: covers are flat
    // filenames in the 'covers' category — basename() confines the delete to
    // it, and central key validation rejects anything hostile (swallowed like
    // the old containment guard; an external https URL is likewise a no-op).
    await this.storage.delete('covers', path.basename(coverImage)).catch(() => {
      /* external URL or already gone */
    });
  }

  /** TP35 — `TripsRepository.setCoverImage`. */
  async updateCoverImage(tripId: string | number, coverUrl: string): Promise<void> {
    await this.tripsRepo.setCoverImage(Number(tripId), coverUrl); // safe: only called after `getRaw`/`getOwner` matched the same id through the raw-bind seam
  }

  // ── Copy / duplicate ─────────────────────────────────────────────────────

  /**
   * Duplicates a trip (all days, places with their Tour facets and waypoints,
   * assignments, accommodations, reservations, budget, packing bags/items, day
   * notes) into a new trip owned by `newOwnerId`.
   * Cross-links are remapped to the copied rows (reservation↔budget item,
   * reservation↔accommodation) and split data travels with the copy
   * (budget_item_members/payers incl. paid flags, assignment_participants).
   * Packing items and to-dos are reset to unchecked. Returns the new trip's ID.
   */
  async copy(sourceTripId: string | number, newOwnerId: number, title?: string): Promise<number> {
    const src = await this.tripsRepo.findRaw(sourceTripId); // TP36
    if (!src) throw new NotFoundError('Trip not found');

    const newTitle = title || src.title;

    return await this.uow.transactional(async () => {
      const newTripId = await this.tripsRepo.insertTripCopy({ // TP37
        user_id: newOwnerId,
        title: newTitle,
        description: src.description,
        start_date: src.start_date,
        end_date: src.end_date,
        currency: src.currency,
        cover_image: src.cover_image,
        reminder_days: src.reminder_days ?? 3,
      });

      const oldDays = await this.daysRepo.listByTrip(Number(sourceTripId)); // TP38
      const dayMap = new Map<number, number>();
      for (const d of oldDays) {
        const newDayId = await this.daysRepo.insertDayCopy({ // TP39
          trip_id: newTripId, day_number: d.day_number, date: d.date, notes: d.notes, title: d.title,
        });
        dayMap.set(d.id, newDayId);
      }

      const oldPlaces = await this.placesRepo.listAllForTrip(sourceTripId); // TP40
      const placeMap = new Map<number, number>();
      for (const p of oldPlaces) {
        const newPlaceId = await this.placesRepo.insertPlaceCopy({ // TP41
          trip_id: newTripId, name: p.name, description: p.description, lat: p.lat, lng: p.lng,
          address: p.address, category_id: p.category_id, price: p.price, currency: p.currency,
          reservation_status: p.reservation_status, reservation_notes: p.reservation_notes,
          reservation_datetime: p.reservation_datetime, place_time: p.place_time, end_time: p.end_time,
          duration_minutes: p.duration_minutes, notes: p.notes, image_url: p.image_url,
          google_place_id: p.google_place_id, google_ftid: p.google_ftid, website: p.website, phone: p.phone,
          transport_mode: p.transport_mode, osm_id: p.osm_id, amap_poi_id: p.amap_poi_id,
          route_geometry: p.route_geometry, route_color: p.route_color, stop_type: p.stop_type,
          fill_percent: p.fill_percent,
        });
        placeMap.set(p.id, newPlaceId);
      }

      // The road-trip shaping goes with the copy. A via is not decoration: it is
      // the road the traveller chose over the one the router prefers, and a day
      // track is the line a day was fitted to. Leaving them behind gave back a
      // trip that looks complete and quietly drives somewhere else — visible
      // only once somebody starts editing the copy, with nothing to recover
      // from. Both tables are keyed by day, so they ride on `dayMap`.
      const oldVias = await this.roadtripViasRepo.listForTrip(Number(sourceTripId)); // TP42
      for (const v of oldVias) {
        const newDayId = dayMap.get(v.day_id);
        if (newDayId) {
          await this.roadtripViasRepo.insertVia({ day_id: newDayId, after_order_index: v.after_order_index, sequence: v.sequence, lat: v.lat, lng: v.lng }); // TP43
        }
      }

      const oldTracks = await this.roadtripDayTracksRepo.listForTrip(Number(sourceTripId)); // TP44
      for (const t of oldTracks) {
        const newDayId = dayMap.get(t.day_id);
        // The track is a place of the trip, so it has been copied too — but skip
        // the row rather than point it at the original, the way the assignment
        // and accommodation loops below skip an id they cannot map.
        const newPlaceId = placeMap.get(t.place_id);
        // `upsertTrack`'s ON CONFLICT branch never fires on this call path:
        // `newDayId` is a day that was just inserted into the brand-new trip
        // above, so no `roadtrip_day_tracks` row can already exist for it —
        // a plain INSERT (the legacy statement) and this upsert produce the
        // identical single row.
        if (newDayId && newPlaceId) await this.roadtripDayTracksRepo.upsertTrack(newDayId, newPlaceId, t.stray_km); // TP45
      }

      const oldTags = await this.tagsRepo.listPlaceTagsForTrip(sourceTripId); // TP46
      for (const t of oldTags) {
        const newPlaceId = placeMap.get(t.place_id);
        if (newPlaceId) await this.tagsRepo.insertIgnore(newPlaceId, [t.tag_id]); // TP47
      }

      // A Tour is a place plus its `tours` facet and the waypoints its route was
      // planned through. Without them the copy holds an ordinary place with a
      // line on it: no longer listed as a Tour, and its route can't be edited
      // because the points it was drawn from are gone. The facet row goes first,
      // since the waypoints reference it.
      const oldTours = await this.toursRepo.listRowsForTrip(Number(sourceTripId));
      const copiedTours = new Set<number>();
      for (const { place_id, ...tour } of oldTours) {
        const newPlaceId = placeMap.get(place_id);
        if (!newPlaceId) continue;
        await this.toursRepo.insertCopy(newPlaceId, tour);
        copiedTours.add(place_id);
      }

      const waypointsByPlace = new Map<number, TourWaypointRow[]>();
      for (const { place_id, ...waypoint } of await this.tourWaypointsRepo.listForTrip(Number(sourceTripId))) {
        if (!copiedTours.has(place_id)) continue;
        const list = waypointsByPlace.get(place_id) ?? [];
        list.push(waypoint);
        waypointsByPlace.set(place_id, list);
      }
      for (const [placeId, waypoints] of waypointsByPlace) {
        await this.tourWaypointsRepo.insertForPlace(placeMap.get(placeId)!, waypoints);
      }

      const oldAssignments = await this.dayAssignmentsRepo.listAllForTrip(sourceTripId); // TP48
      const assignmentMap = new Map<number, number>();
      for (const a of oldAssignments) {
        const newDayId = dayMap.get(a.day_id);
        const newPlaceId = placeMap.get(a.place_id);
        if (newDayId && newPlaceId) {
          const newAssignmentId = await this.dayAssignmentsRepo.insertAssignmentCopy({ // TP49
            day_id: newDayId, place_id: newPlaceId, order_index: a.order_index, notes: a.notes,
            reservation_status: a.reservation_status, reservation_notes: a.reservation_notes,
            reservation_datetime: a.reservation_datetime, assignment_time: a.assignment_time,
            assignment_end_time: a.assignment_end_time, end_day: a.end_day ?? 0,
          });
          assignmentMap.set(a.id, newAssignmentId);
        }
      }

      const oldPreferences = await this.roadtripPreferencesRepo.listForTrip(Number(sourceTripId)); // TP50
      for (const pref of oldPreferences) {
        await this.roadtripPreferencesRepo.upsertValue(newTripId, pref.key, pref.value); // TP50
      }

      const oldBoundaries = await this.roadtripDayBoundariesRepo.listForTrip(Number(sourceTripId)); // TP51
      for (const boundary of oldBoundaries) {
        const from = assignmentMap.get(boundary.from_assignment_id);
        const to = boundary.to_assignment_id === null ? null : assignmentMap.get(boundary.to_assignment_id);
        // `upsertBoundary`'s ON CONFLICT branch never fires here either — the
        // new trip's `roadtrip_day_boundaries` starts empty, same reasoning
        // as the via/track upserts above.
        if (from && to !== undefined) {
          await this.roadtripDayBoundariesRepo.upsertBoundary(newTripId, { day_number: boundary.day_number, from_assignment_id: from, to_assignment_id: to, fraction: boundary.fraction }); // TP52
        }
      }

      const oldParticipants = await this.assignmentParticipantsRepo.listForTrip(sourceTripId); // TP53
      for (const ap of oldParticipants) {
        const newAssignmentId = assignmentMap.get(ap.assignment_id);
        if (newAssignmentId) await this.assignmentParticipantsRepo.insertIgnore(newAssignmentId, [ap.user_id]); // TP54
      }

      const oldAccom = await this.dayAccommodationsRepo.listAllForTrip(Number(sourceTripId)); // TP55
      const accomMap = new Map<number, number>();
      for (const a of oldAccom) {
        const newPlaceId = a.place_id != null ? placeMap.get(a.place_id) : undefined;
        const newStartDay = dayMap.get(a.start_day_id);
        const newEndDay = dayMap.get(a.end_day_id);
        if (newPlaceId && newStartDay && newEndDay) {
          const newAccomId = await this.dayAccommodationsRepo.insertStay({ // TP56
            trip_id: newTripId, place_id: newPlaceId, start_day_id: newStartDay, end_day_id: newEndDay,
            check_in: a.check_in, check_in_end: a.check_in_end, check_out: a.check_out, confirmation: a.confirmation, notes: a.notes,
          });
          accomMap.set(a.id, newAccomId);
        }
      }

      // A booked night's stop carries the booking that put it there. Left blank, the
      // copy draws the hotel twice: once as the stop and once as the overnight block,
      // which is the duplicate the mirror exists to remove. Stamped afterwards rather
      // than at insert time, because the bookings are copied after the stops.
      for (const a of oldAssignments) {
        if (!a.accommodation_id) continue;
        const newAssignmentId = assignmentMap.get(a.id);
        const newAccomId = accomMap.get(a.accommodation_id);
        if (newAssignmentId && newAccomId) await this.dayAssignmentsRepo.setAccommodation(newAssignmentId, newAccomId); // TP57
      }

      const oldReservations = await this.reservationsRepo.listAllForTrip(Number(sourceTripId)); // TP58
      // The external_* / sync_enabled columns are deliberately not copied: the
      // duplicate must not inherit the source's external sync identity.
      const reservationMap = new Map<number, number>();
      for (const r of oldReservations) {
        // accommodation_id is a TEXT column, so the SOURCE value reads back
        // as a string — coerce before the number-keyed map lookup or the
        // link silently nulls.
        const newAccomId = r.accommodation_id != null ? (accomMap.get(Number(r.accommodation_id)) ?? null) : null;
        const newReservationId = await this.reservationsRepo.insertReservationCopy({
          trip_id: newTripId,
          day_id: r.day_id ? (dayMap.get(r.day_id) ?? null) : null,
          // end_day_id is a day reference too (multi-day transport) — remap it like
          // day_id, otherwise the duplicated trip loses the reservation's end-day link.
          end_day_id: r.end_day_id ? (dayMap.get(r.end_day_id) ?? null) : null,
          place_id: r.place_id ? (placeMap.get(r.place_id) ?? null) : null,
          assignment_id: r.assignment_id ? (assignmentMap.get(r.assignment_id) ?? null) : null,
          // the NEW value is re-formatted to the legacy raw-bound `'<id>.0'`
          // TEXT shape on the way back out — see `legacyBoundIntegerText`.
          accommodation_id: newAccomId != null ? legacyBoundIntegerText(newAccomId) : null,
          title: r.title, reservation_time: r.reservation_time, reservation_end_time: r.reservation_end_time,
          location: r.location, confirmation_number: r.confirmation_number, notes: r.notes, url: r.url, status: r.status, type: r.type,
          // ingest_state travels with the copy: a staged booking must not turn
          // 'live' just because the trip was duplicated, or it lands in the
          // duplicate's public feed.
          metadata: r.metadata, day_plan_position: r.day_plan_position, needs_review: r.needs_review ?? 0, ingest_state: r.ingest_state ?? 'live',
        }); // TP59
        reservationMap.set(r.id, newReservationId);
      }

      // TP60 — Plan 3e Task 2, converted.
      const oldBudget = await this.budgetItemsRepo.listAllForTrip(sourceTripId);
      const budgetMap = new Map<number, number>();
      for (const b of oldBudget) {
        // TP61 — Plan 3e Task 2, converted (`insertCopy`, carries `paid_by_user_id` verbatim).
        const newItemId = await this.budgetItemsRepo.insertCopy({
          trip_id: newTripId, category: b.category, name: b.name, total_price: b.total_price, persons: b.persons, days: b.days,
          note: b.note, sort_order: b.sort_order,
          reservation_id: b.reservation_id ? (reservationMap.get(b.reservation_id) ?? null) : null,
          currency: b.currency, exchange_rate: b.exchange_rate ?? 1, expense_date: b.expense_date,
          ticket_json: b.ticket_json, paid_by_user_id: b.paid_by_user_id,
        });
        budgetMap.set(b.id, newItemId);
      }

      // TP62 — Plan 3e Task 2, converted.
      const oldBudgetMembers = await this.budgetItemMembersRepo.listRawForTrip(sourceTripId);
      for (const bm of oldBudgetMembers) {
        const newItemId = budgetMap.get(bm.budget_item_id);
        // TP63 — Plan 3e Task 2, converted.
        if (newItemId) await this.budgetItemMembersRepo.insertIgnore({ budget_item_id: newItemId, user_id: bm.user_id, paid: bm.paid ?? 0, amount: bm.amount });
      }

      // TP64 — Plan 3e Task 2, converted.
      const oldBudgetPayers = await this.budgetItemPayersRepo.listRawForTrip(sourceTripId);
      for (const bp of oldBudgetPayers) {
        const newItemId = budgetMap.get(bp.budget_item_id);
        // TP65 — Plan 3e Task 2, converted.
        if (newItemId) await this.budgetItemPayersRepo.insertIgnore({ budget_item_id: newItemId, user_id: bp.user_id, amount: bp.amount ?? 0 });
      }

      // TP66 — Plan 3e Task 3, converted.
      const oldBags = await this.packingBagsRepo.listAllForTrip(sourceTripId);
      const bagMap = new Map<number, number>();
      for (const bag of oldBags) {
        // TP67 — Plan 3e Task 3, converted (`insertBag`, PK42's own column set).
        const newBagId = await this.packingBagsRepo.insertBag({
          trip_id: newTripId, name: bag.name, color: bag.color, sort_order: bag.sort_order, weight_limit_grams: bag.weight_limit_grams,
        });
        bagMap.set(bag.id, newBagId);
      }

      // Only what the copier may carry over: the Common list plus their own items.
      // This used to take every row and re-insert it without is_private/owner_id,
      // so both fell back to the column defaults and another member's Personal or
      // Shared item reappeared in the copy as a Common item visible to everyone.
      // A restricted item stays restricted, and it stays owned by the copier —
      // recipient rows are not carried over, and the copy has its own roster.
      // TP68 — Plan 3e Task 3, converted (security-sensitive: the privacy filter).
      const oldPacking = await this.packingItemsRepo.listOwnListForCopy(sourceTripId, newOwnerId);
      for (const p of oldPacking) {
        const isPrivate = p.is_private ? 1 : 0;
        // TP69 — Plan 3e Task 3, converted.
        await this.packingItemsRepo.insertCopy({
          trip_id: newTripId, name: p.name, category: p.category, sort_order: p.sort_order, weight_grams: p.weight_grams,
          bag_id: p.bag_id ? (bagMap.get(p.bag_id) ?? null) : null,
          is_private: isPrivate, owner_id: isPrivate ? newOwnerId : null,
        });
      }

      const oldNotes = await this.dayNotesRepo.listByTrip(sourceTripId); // TP70
      for (const n of oldNotes) {
        const newDayId = dayMap.get(n.day_id);
        if (newDayId) {
          await this.dayNotesRepo.insertNoteCopy({ // TP71
            day_id: newDayId, trip_id: newTripId, text: n.text, time: n.time, icon: n.icon, sort_order: n.sort_order,
          });
        }
      }

      // TP72 — Plan 3e Task 4, converted.
      const oldTodos = await this.todoItemsRepo.listAllForTrip(sourceTripId);
      for (const t of oldTodos) {
        // TP73 — Plan 3e Task 4, converted (`assigned_user_id` deliberately not carried over).
        await this.todoItemsRepo.insertCopy({
          trip_id: newTripId, name: t.name, category: t.category, sort_order: t.sort_order,
          due_date: t.due_date, description: t.description, priority: t.priority,
        });
      }

      // TP74 — Plan 3e Task 2, converted.
      const oldCategoryOrder = await this.budgetCategoryOrderRepo.listForTrip(sourceTripId);
      for (const o of oldCategoryOrder) {
        // TP75 — Plan 3e Task 2, converted (plain insert, not `OR IGNORE` — matching legacy).
        await this.budgetCategoryOrderRepo.insertCopy(newTripId, o.category, o.sort_order);
      }

      return newTripId;
    });
  }

  /** TP76 — Re-read a freshly copied trip in list shape via `TripsRepository.findForViewer` (the same private `tripSelectQuery` builder `get()`/`list()` use; the creator/copier always owns the new trip, so the access predicate is trivially satisfied — `create`'s TP19 precedent). The `TRIP_SELECT` string constant this used to re-render by hand is deleted — `tripSelectQuery` is the one source for the projection now (Task 7 review, absorbed here). */
  async getCopiedTrip(newTripId: number, userId: number) {
    return await this.tripsRepo.findForViewer(newTripId, userId);
  }

}

// Defined in common/ so calendar and maps can raise them without importing the
// trip aggregate; re-exported here because nine files already import them from
// this module.
export { NotFoundError, ValidationError };
