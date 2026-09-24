import { Injectable } from '@nestjs/common';
import path from 'path';
import { DatabaseService } from '../database/database.service';
import {
  MAX_TRIP_DAYS,
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
import { BudgetService } from '../budget/budget.service';
import { ReservationsService } from '../reservations/reservations.service';
import { VacayService } from '../vacay/vacay.service';
import { UnsplashService } from '../unsplash/unsplash.service';
import { StorageService } from '../storage/storage.service';
import { SettingsService } from '../settings/settings.service';
import { NotFoundError, ValidationError } from '../common/domain-errors';
import { TRIP_SELECT } from './trip-select';

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

// The list-shape query and the feed-token scrub live in a leaf file so the days
// domain can read the same trip row without importing this module (which
// imports DaysService). Re-exported here so every existing importer is unchanged.
export { TRIP_SELECT, withoutFeedToken } from './trip-select';

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
    private readonly dbs: DatabaseService,
    private readonly reservations: ReservationsService,
    private readonly days: DaysService,
    private readonly permissions: PermissionsService,
    private readonly budget: BudgetService,
    private readonly vacay: VacayService,
    private readonly realtime: RealtimeService,
    private readonly unsplash: UnsplashService,
    private readonly storage: StorageService,
    private readonly settings: SettingsService,
  ) {}

  private get db() {
    return this.dbs.connection;
  }

  /**
   * The currency a trip gets when the caller names none: the person's display
   * currency, admin default merged in, else EUR. The trip dialog pre-fills the
   * same value on the client, so a trip created through MCP or a plugin lands
   * in the currency the person reads amounts in instead of always in EUR.
   */
  private defaultCurrencyFor(userId: number): string {
    const preferred = this.settings.getUserSettings(userId).default_currency;
    return typeof preferred === 'string' && preferred.trim() ? preferred.trim() : 'EUR';
  }

  canAccessTrip(tripId: string | number, userId: number) {
    return this.dbs.canAccessTrip(tripId, userId) as { user_id: number } | null | undefined;
  }

  isOwner(tripId: string | number, userId: number): boolean {
    return this.dbs.isOwner(tripId, userId);
  }

  can(action: string, role: string, ownerId: number | null, userId: number, isMember: boolean): boolean {
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
   */
  generateDays(tripId: number | bigint | string, startDate: string | null, endDate: string | null, dayCount?: number): DayGridPlan {
    return this.db.transaction(() => {
      const existing = this.db.prepare(`
        SELECT d.id, d.day_number, d.date,
          EXISTS (SELECT 1 FROM day_assignments da WHERE da.day_id = d.id)
            OR EXISTS (SELECT 1 FROM day_notes dn WHERE dn.day_id = d.id) AS has_plan_items
        FROM days d WHERE d.trip_id = ?
      `).all(tripId) as { id: number; day_number: number; date: string | null; has_plan_items: number }[];
      const stays = this.db.prepare(`
        SELECT dac.start_day_id, dac.end_day_id FROM day_accommodations dac
        WHERE dac.start_day_id IN (SELECT id FROM days WHERE trip_id = ?)
           OR dac.end_day_id IN (SELECT id FROM days WHERE trip_id = ?)
      `).all(tripId, tripId) as { start_day_id: number; end_day_id: number }[];

      const plan = planDayGrid({
        days: existing.map(d => ({ id: d.id, day_number: d.day_number, date: d.date, hasPlanItems: !!d.has_plan_items })),
        stays,
        startDate,
        endDate,
        dayCount,
      });

      const dateBefore = new Map(existing.map(d => [d.id, d.date]));
      const setDayNumber = this.db.prepare('UPDATE days SET day_number = ? WHERE id = ?');
      const assignDay = this.db.prepare('UPDATE days SET date = ?, day_number = ? WHERE id = ?');
      const insert = this.db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)');
      const del = this.db.prepare('DELETE FROM days WHERE id = ?');

      existing.forEach((d, i) => setDayNumber.run(-(i + 1), d.id));
      plan.rows.forEach((row, i) => {
        if (row.id === null) insert.run(tripId, i + 1, row.date);
        // A row that had no date and gets none is only renumbered, so an odd
        // stored value is left as it was, the way the rebuild always treated it.
        else if (row.date === null && !dateBefore.get(row.id)) setDayNumber.run(i + 1, row.id);
        else assignDay.run(row.date, i + 1, row.id);
      });
      for (const gone of plan.removed) del.run(gone.id);
      return plan;
    })();
  }

  // ── Trip CRUD ─────────────────────────────────────────────────────────────

  list(userId: number, archived: number | null) {
    if (archived === null) {
      return this.db.prepare(`
        ${TRIP_SELECT}
        LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
        WHERE (t.user_id = :userId OR m.user_id IS NOT NULL)
        ORDER BY t.created_at DESC
      `).all({ userId });
    }
    return this.db.prepare(`
      ${TRIP_SELECT}
      LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
      WHERE (t.user_id = :userId OR m.user_id IS NOT NULL) AND t.is_archived = :archived
      ORDER BY t.created_at DESC
    `).all({ userId, archived });
  }

  create(userId: number, data: CreateTripData) {
    if (data.start_date && data.end_date) assertTripSpan(data.start_date, data.end_date);
    const rd = data.reminder_days !== undefined
      ? (Number(data.reminder_days) >= 0 && Number(data.reminder_days) <= 30 ? Number(data.reminder_days) : 3)
      : 3;

    const result = this.db.prepare(`
      INSERT INTO trips (user_id, title, description, start_date, end_date, currency, reminder_days)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, data.title, data.description || null, data.start_date || null, data.end_date || null, data.currency || this.defaultCurrencyFor(userId), rd);

    const tripId = result.lastInsertRowid;
    this.generateDays(tripId, data.start_date || null, data.end_date || null, data.day_count);

    const trip = this.db.prepare(`${TRIP_SELECT} WHERE t.id = :tripId`).get({ userId, tripId });
    return { trip, tripId: Number(tripId), reminderDays: rd };
  }

  get(tripId: string | number, userId: number) {
    return this.db.prepare(`
      ${TRIP_SELECT}
      LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
      WHERE t.id = :tripId AND (t.user_id = :userId OR m.user_id IS NOT NULL)
    `).get({ userId, tripId }) as Trip | undefined;
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
  activeTrip(userId: number, today = new Date().toISOString().slice(0, 10)) {
    return this.db.prepare(`
      SELECT t.id, t.title, t.start_date, t.end_date,
        CASE
          WHEN t.start_date IS NOT NULL AND t.end_date IS NOT NULL AND t.start_date <= :today AND t.end_date >= :today THEN 0
          WHEN t.start_date IS NOT NULL AND t.start_date >= :today THEN 1
          ELSE 2
        END AS relevance
      FROM trips t
      LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = :userId
      WHERE (t.user_id = :userId OR m.user_id IS NOT NULL) AND t.is_archived = 0
      ORDER BY relevance ASC,
        CASE WHEN relevance < 2 THEN t.start_date END ASC,
        CASE WHEN relevance = 2 THEN t.start_date END DESC
      LIMIT 1
    `).get({ userId, today }) as ActiveTrip & { relevance: number } | undefined;
  }

  getRaw(tripId: string | number): Trip | undefined {
    return this.db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId) as Trip | undefined;
  }

  searchCoverImages(query: string, userId: number) {
    return this.unsplash.searchUnsplashPhotos(query, 9, this.unsplash.getUnsplashKey(userId));
  }

  getOwner(tripId: string | number): { user_id: number } | undefined {
    return this.db.prepare('SELECT user_id FROM trips WHERE id = ?').get(tripId) as { user_id: number } | undefined;
  }

  /**
   * The folded legacy updateTrip core — no currency rebase. The REST path goes
   * through update() below; the plugin RPC host calls this directly (parity:
   * the legacy host path never rebased).
   */
  updateTrip(tripId: string | number, userId: number, data: UpdateTripData, userRole: string): UpdateTripResult {
    const trip = this.db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId) as Trip & { reminder_days?: number } | undefined;
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

    this.db.prepare(`
      UPDATE trips SET title=?, description=?, start_date=?, end_date=?,
        currency=?, is_archived=?, cover_image=?, reminder_days=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(newTitle, newDesc, newStart || null, newEnd || null, newCurrency, newArchived, newCover, newReminder, tripId);

    if (trip.start_date && trip.end_date && newStart && newStart !== trip.start_date)
      this.vacay.shiftOwnerEntriesForTripWindow(trip.user_id, trip.start_date, trip.end_date, newStart);

    let removedDays: DayGridRemoval[] = [];
    if (regenerate) {
      this.db.transaction(() => {
        // Accommodations have no absolute date columns, so their pre-change dates must be
        // snapshotted before generateDays re-dates the day rows in place.
        const prevDateByDayId = new Map(
          (this.db.prepare('SELECT id, date FROM days WHERE trip_id = ?').all(tripId) as { id: number; date: string | null }[])
            .map(d => [d.id, d.date]),
        );
        removedDays = this.generateDays(tripId, newStart || null, newEnd || null, dayCount).removed;
        if (data.date_shift_mode === 'shift_all') {
          // Explicit "shift everything": bookings stay glued to their (re-dated) day rows,
          // so re-stamp reservation_time to follow — same rules as reorderDays/insertDay.
          const newDateByDayId = new Map(
            (this.db.prepare('SELECT id, date FROM days WHERE trip_id = ?').all(tripId) as { id: number; date: string | null }[])
              .map(d => [d.id, d.date]),
          );
          this.days.restampReservationDates(tripId, prevDateByDayId, newDateByDayId);
        } else {
          // Default: generateDays re-dates day rows positionally; re-anchor dated bookings to
          // the day matching their absolute reservation_time, and accommodations (+ their
          // linked hotel reservations) to the days now holding their pre-change dates (#1288).
          this.reservations.resyncReservationDays(tripId);
          this.days.resyncAccommodationDays(tripId, prevDateByDayId);
        }
      })();
    }

    const changes: Record<string, unknown> = {};
    if (title && title !== trip.title) changes.title = title;
    if (newStart !== trip.start_date) changes.start_date = newStart;
    if (newEnd !== trip.end_date) changes.end_date = newEnd;
    if (newReminder !== oldReminder) changes.reminder_days = newReminder === 0 ? 'none' : `${newReminder} days`;
    if (is_archived !== undefined && newArchived !== trip.is_archived) changes.archived = !!newArchived;

    const isAdminEdit = userRole === 'admin' && trip.user_id !== userId;
    let ownerEmail: string | undefined;
    if (Object.keys(changes).length > 0 && isAdminEdit) {
      ownerEmail = (this.db.prepare('SELECT email FROM users WHERE id = ?').get(trip.user_id) as { email: string } | undefined)?.email;
    }

    const updatedTrip = this.db.prepare(`${TRIP_SELECT} WHERE t.id = :tripId`).get({ userId, tripId });

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
    const trip = this.getRaw(tripId);
    if (!trip) throw new NotFoundError('Trip not found');
    this.resolveRange(trip, body);
    // Re-anchor the budget while the outgoing currency is still on the trip row,
    // otherwise the frozen FX rates and the currency-less expenses that inherit the
    // trip's base are left pointing at a currency that no longer exists (#1543).
    await this.budget.rebaseTripCurrency(tripId, body.currency);
    return this.updateTrip(tripId, userId, body, role);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  remove(tripId: string | number, userId: number, userRole: string): DeleteTripInfo {
    const trip = this.db.prepare('SELECT title, user_id FROM trips WHERE id = ?').get(tripId) as { title: string; user_id: number } | undefined;
    if (!trip) throw new NotFoundError('Trip not found');

    const isAdminDelete = userRole === 'admin' && trip.user_id !== userId;
    let ownerEmail: string | undefined;
    if (isAdminDelete) {
      ownerEmail = (this.db.prepare('SELECT email FROM users WHERE id = ?').get(trip.user_id) as { email: string } | undefined)?.email;
    }

    // Quirk fix on top of the 1:1 move: the three-statement delete runs in a
    // transaction, so a failure mid-flow can't leave journey entries detached
    // from a trip that still exists.
    this.db.transaction(() => {
      // Clean up journey entries synced from this trip before deleting
      // Delete skeleton entries (unfilled synced places)
      this.db.prepare(`
        DELETE FROM journey_entries
        WHERE source_trip_id = ? AND type = 'skeleton'
      `).run(tripId);
      // Detach filled entries (keep user's written content, just remove trip link)
      this.db.prepare(`
        UPDATE journey_entries SET source_trip_id = NULL, source_place_id = NULL, source_assignment_id = NULL
        WHERE source_trip_id = ?
      `).run(tripId);

      this.db.prepare('DELETE FROM trips WHERE id = ?').run(tripId);
    })();

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

  updateCoverImage(tripId: string | number, coverUrl: string): void {
    this.db.prepare('UPDATE trips SET cover_image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(coverUrl, tripId);
  }

  // ── Copy / duplicate ─────────────────────────────────────────────────────

  /**
   * Duplicates a trip (all days, places, assignments, accommodations, reservations,
   * budget, packing bags/items, day notes) into a new trip owned by `newOwnerId`.
   * Cross-links are remapped to the copied rows (reservation↔budget item,
   * reservation↔accommodation) and split data travels with the copy
   * (budget_item_members/payers incl. paid flags, assignment_participants).
   * Packing items and to-dos are reset to unchecked. Returns the new trip's ID.
   */
  copy(sourceTripId: string | number, newOwnerId: number, title?: string): number {
    const src = this.db.prepare('SELECT * FROM trips WHERE id = ?').get(sourceTripId) as any;
    if (!src) throw new NotFoundError('Trip not found');

    const newTitle = title || src.title;

    const fn = this.db.transaction(() => {
      const tripResult = this.db.prepare(`
        INSERT INTO trips (user_id, title, description, start_date, end_date, currency, cover_image, is_archived, reminder_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
      `).run(newOwnerId, newTitle, src.description, src.start_date, src.end_date, src.currency, src.cover_image, src.reminder_days ?? 3);
      const newTripId = tripResult.lastInsertRowid;

      const oldDays = this.db.prepare('SELECT * FROM days WHERE trip_id = ? ORDER BY day_number').all(sourceTripId) as any[];
      const dayMap = new Map<number, number | bigint>();
      const insertDay = this.db.prepare('INSERT INTO days (trip_id, day_number, date, notes, title) VALUES (?, ?, ?, ?, ?)');
      for (const d of oldDays) {
        const r = insertDay.run(newTripId, d.day_number, d.date, d.notes, d.title);
        dayMap.set(d.id, r.lastInsertRowid);
      }

      const oldPlaces = this.db.prepare('SELECT * FROM places WHERE trip_id = ?').all(sourceTripId) as any[];
      const placeMap = new Map<number, number | bigint>();
      const insertPlace = this.db.prepare(`
        INSERT INTO places (trip_id, name, description, lat, lng, address, category_id, price, currency,
          reservation_status, reservation_notes, reservation_datetime, place_time, end_time,
          duration_minutes, notes, image_url, google_place_id, google_ftid, website, phone, transport_mode, osm_id,
          amap_poi_id, route_geometry, route_color, stop_type, fill_percent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of oldPlaces) {
        const r = insertPlace.run(newTripId, p.name, p.description, p.lat, p.lng, p.address, p.category_id,
          p.price, p.currency, p.reservation_status, p.reservation_notes, p.reservation_datetime,
          p.place_time, p.end_time, p.duration_minutes, p.notes, p.image_url, p.google_place_id,
          p.google_ftid, p.website, p.phone, p.transport_mode, p.osm_id, p.amap_poi_id, p.route_geometry,
          p.route_color, p.stop_type, p.fill_percent);
        placeMap.set(p.id, r.lastInsertRowid);
      }

      // The road-trip shaping goes with the copy. A via is not decoration: it is
      // the road the traveller chose over the one the router prefers, and a day
      // track is the line a day was fitted to. Leaving them behind gave back a
      // trip that looks complete and quietly drives somewhere else — visible
      // only once somebody starts editing the copy, with nothing to recover
      // from. Both tables are keyed by day, so they ride on `dayMap`.
      const oldVias = this.db.prepare(`
        SELECT v.* FROM roadtrip_vias v JOIN days d ON d.id = v.day_id WHERE d.trip_id = ?
      `).all(sourceTripId) as any[];
      const insertVia = this.db.prepare(
        'INSERT INTO roadtrip_vias (day_id, after_order_index, sequence, lat, lng) VALUES (?, ?, ?, ?, ?)',
      );
      for (const v of oldVias) {
        const newDayId = dayMap.get(v.day_id);
        if (newDayId) insertVia.run(newDayId, v.after_order_index, v.sequence, v.lat, v.lng);
      }

      const oldTracks = this.db.prepare(`
        SELECT t.* FROM roadtrip_day_tracks t JOIN days d ON d.id = t.day_id WHERE d.trip_id = ?
      `).all(sourceTripId) as any[];
      const insertTrack = this.db.prepare(
        'INSERT INTO roadtrip_day_tracks (day_id, place_id, stray_km) VALUES (?, ?, ?)',
      );
      for (const t of oldTracks) {
        const newDayId = dayMap.get(t.day_id);
        // The track is a place of the trip, so it has been copied too — but skip
        // the row rather than point it at the original, the way the assignment
        // and accommodation loops below skip an id they cannot map.
        const newPlaceId = placeMap.get(t.place_id);
        if (newDayId && newPlaceId) insertTrack.run(newDayId, newPlaceId, t.stray_km);
      }

      const oldTags = this.db.prepare(`
        SELECT pt.* FROM place_tags pt JOIN places p ON p.id = pt.place_id WHERE p.trip_id = ?
      `).all(sourceTripId) as any[];
      const insertTag = this.db.prepare('INSERT OR IGNORE INTO place_tags (place_id, tag_id) VALUES (?, ?)');
      for (const t of oldTags) {
        const newPlaceId = placeMap.get(t.place_id);
        if (newPlaceId) insertTag.run(newPlaceId, t.tag_id);
      }

      const oldAssignments = this.db.prepare(`
        SELECT da.* FROM day_assignments da JOIN days d ON d.id = da.day_id WHERE d.trip_id = ?
      `).all(sourceTripId) as any[];
      const assignmentMap = new Map<number, number | bigint>();
      const insertAssignment = this.db.prepare(`
        INSERT INTO day_assignments (day_id, place_id, order_index, notes, reservation_status, reservation_notes, reservation_datetime, assignment_time, assignment_end_time, end_day)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of oldAssignments) {
        const newDayId = dayMap.get(a.day_id);
        const newPlaceId = placeMap.get(a.place_id);
        if (newDayId && newPlaceId) {
          const r = insertAssignment.run(newDayId, newPlaceId, a.order_index, a.notes,
            a.reservation_status, a.reservation_notes, a.reservation_datetime,
            a.assignment_time, a.assignment_end_time, a.end_day ?? 0);
          assignmentMap.set(a.id, r.lastInsertRowid);
        }
      }

      this.db.prepare('INSERT INTO roadtrip_preferences (trip_id, key, value) SELECT ?, key, value FROM roadtrip_preferences WHERE trip_id = ?').run(newTripId, sourceTripId);
      const oldBoundaries = this.db.prepare('SELECT * FROM roadtrip_day_boundaries WHERE trip_id = ?').all(sourceTripId) as {
        day_number: number; from_assignment_id: number; to_assignment_id: number | null; fraction: number;
      }[];
      const insertBoundary = this.db.prepare('INSERT INTO roadtrip_day_boundaries (trip_id, day_number, from_assignment_id, to_assignment_id, fraction) VALUES (?, ?, ?, ?, ?)');
      for (const boundary of oldBoundaries) {
        const from = assignmentMap.get(boundary.from_assignment_id);
        const to = boundary.to_assignment_id === null ? null : assignmentMap.get(boundary.to_assignment_id);
        if (from && to !== undefined) insertBoundary.run(newTripId, boundary.day_number, from, to, boundary.fraction);
      }

      const oldParticipants = this.db.prepare(`
        SELECT ap.* FROM assignment_participants ap
        JOIN day_assignments da ON da.id = ap.assignment_id
        JOIN days d ON d.id = da.day_id
        WHERE d.trip_id = ?
      `).all(sourceTripId) as any[];
      const insertParticipant = this.db.prepare('INSERT OR IGNORE INTO assignment_participants (assignment_id, user_id) VALUES (?, ?)');
      for (const ap of oldParticipants) {
        const newAssignmentId = assignmentMap.get(ap.assignment_id);
        if (newAssignmentId) insertParticipant.run(newAssignmentId, ap.user_id);
      }

      const oldAccom = this.db.prepare('SELECT * FROM day_accommodations WHERE trip_id = ?').all(sourceTripId) as any[];
      const accomMap = new Map<number, number | bigint>();
      const insertAccom = this.db.prepare(`
        INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id, check_in, check_in_end, check_out, confirmation, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of oldAccom) {
        const newPlaceId = placeMap.get(a.place_id);
        const newStartDay = dayMap.get(a.start_day_id);
        const newEndDay = dayMap.get(a.end_day_id);
        if (newPlaceId && newStartDay && newEndDay) {
          const r = insertAccom.run(newTripId, newPlaceId, newStartDay, newEndDay, a.check_in, a.check_in_end, a.check_out, a.confirmation, a.notes);
          accomMap.set(a.id, r.lastInsertRowid);
        }
      }

      // A booked night's stop carries the booking that put it there. Left blank, the
      // copy draws the hotel twice: once as the stop and once as the overnight block,
      // which is the duplicate the mirror exists to remove. Stamped afterwards rather
      // than at insert time, because the bookings are copied after the stops.
      const stampCopiedStop = this.db.prepare('UPDATE day_assignments SET accommodation_id = ? WHERE id = ?');
      for (const a of oldAssignments) {
        if (!a.accommodation_id) continue;
        const newAssignmentId = assignmentMap.get(a.id);
        const newAccomId = accomMap.get(a.accommodation_id);
        if (newAssignmentId && newAccomId) stampCopiedStop.run(newAccomId, newAssignmentId);
      }

      const oldReservations = this.db.prepare('SELECT * FROM reservations WHERE trip_id = ?').all(sourceTripId) as any[];
      // The external_* / sync_enabled columns are deliberately not copied: the
      // duplicate must not inherit the source's external sync identity.
      const reservationMap = new Map<number, number | bigint>();
      const insertReservation = this.db.prepare(`
        INSERT INTO reservations (trip_id, day_id, end_day_id, place_id, assignment_id, accommodation_id, title, reservation_time, reservation_end_time,
          location, confirmation_number, notes, url, status, type, metadata, day_plan_position, needs_review, ingest_state)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of oldReservations) {
        const rr = insertReservation.run(newTripId,
          r.day_id ? (dayMap.get(r.day_id) ?? null) : null,
          // end_day_id is a day reference too (multi-day transport) — remap it like
          // day_id, otherwise the duplicated trip loses the reservation's end-day link.
          r.end_day_id ? (dayMap.get(r.end_day_id) ?? null) : null,
          r.place_id ? (placeMap.get(r.place_id) ?? null) : null,
          r.assignment_id ? (assignmentMap.get(r.assignment_id) ?? null) : null,
          // accommodation_id is a TEXT column, so it reads back as a string —
          // coerce before the number-keyed map lookup or the link silently nulls.
          r.accommodation_id != null ? (accomMap.get(Number(r.accommodation_id)) ?? null) : null,
          r.title, r.reservation_time, r.reservation_end_time,
          r.location, r.confirmation_number, r.notes, r.url, r.status, r.type,
          // ingest_state travels with the copy: a staged booking must not turn
          // 'live' just because the trip was duplicated, or it lands in the
          // duplicate's public feed.
          r.metadata, r.day_plan_position, r.needs_review ?? 0, r.ingest_state ?? 'live');
        reservationMap.set(r.id, rr.lastInsertRowid);
      }

      const oldBudget = this.db.prepare('SELECT * FROM budget_items WHERE trip_id = ?').all(sourceTripId) as any[];
      const budgetMap = new Map<number, number | bigint>();
      const insertBudget = this.db.prepare(`
        INSERT INTO budget_items (trip_id, category, name, total_price, persons, days, note, sort_order,
          reservation_id, currency, exchange_rate, expense_date, ticket_json, paid_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const b of oldBudget) {
        const br = insertBudget.run(newTripId, b.category, b.name, b.total_price, b.persons, b.days, b.note, b.sort_order,
          b.reservation_id ? (reservationMap.get(b.reservation_id) ?? null) : null,
          b.currency, b.exchange_rate ?? 1, b.expense_date, b.ticket_json, b.paid_by_user_id);
        budgetMap.set(b.id, br.lastInsertRowid);
      }

      const oldBudgetMembers = this.db.prepare(`
        SELECT bm.* FROM budget_item_members bm JOIN budget_items b ON b.id = bm.budget_item_id WHERE b.trip_id = ?
      `).all(sourceTripId) as any[];
      const insertBudgetMember = this.db.prepare('INSERT OR IGNORE INTO budget_item_members (budget_item_id, user_id, paid, amount) VALUES (?, ?, ?, ?)');
      for (const bm of oldBudgetMembers) {
        const newItemId = budgetMap.get(bm.budget_item_id);
        if (newItemId) insertBudgetMember.run(newItemId, bm.user_id, bm.paid ?? 0, bm.amount);
      }

      const oldBudgetPayers = this.db.prepare(`
        SELECT bp.* FROM budget_item_payers bp JOIN budget_items b ON b.id = bp.budget_item_id WHERE b.trip_id = ?
      `).all(sourceTripId) as any[];
      const insertBudgetPayer = this.db.prepare('INSERT OR IGNORE INTO budget_item_payers (budget_item_id, user_id, amount) VALUES (?, ?, ?)');
      for (const bp of oldBudgetPayers) {
        const newItemId = budgetMap.get(bp.budget_item_id);
        if (newItemId) insertBudgetPayer.run(newItemId, bp.user_id, bp.amount ?? 0);
      }

      const oldBags = this.db.prepare('SELECT * FROM packing_bags WHERE trip_id = ?').all(sourceTripId) as any[];
      const bagMap = new Map<number, number | bigint>();
      const insertBag = this.db.prepare(`
        INSERT INTO packing_bags (trip_id, name, color, weight_limit_grams, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const bag of oldBags) {
        const r = insertBag.run(newTripId, bag.name, bag.color, bag.weight_limit_grams, bag.sort_order);
        bagMap.set(bag.id, r.lastInsertRowid);
      }

      // Only what the copier may carry over: the Common list plus their own items.
      // This used to take every row and re-insert it without is_private/owner_id,
      // so both fell back to the column defaults and another member's Personal or
      // Shared item reappeared in the copy as a Common item visible to everyone.
      // A restricted item stays restricted, and it stays owned by the copier —
      // recipient rows are not carried over, and the copy has its own roster.
      const oldPacking = this.db.prepare(
        'SELECT * FROM packing_items WHERE trip_id = ? AND (is_private = 0 OR owner_id = ?)'
      ).all(sourceTripId, newOwnerId) as any[];
      const insertPacking = this.db.prepare(`
        INSERT INTO packing_items (trip_id, name, checked, category, sort_order, weight_grams, bag_id, is_private, owner_id, updated_at)
        VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      for (const p of oldPacking) {
        const isPrivate = p.is_private ? 1 : 0;
        insertPacking.run(newTripId, p.name, p.category, p.sort_order, p.weight_grams,
          p.bag_id ? (bagMap.get(p.bag_id) ?? null) : null,
          isPrivate, isPrivate ? newOwnerId : null);
      }

      const oldNotes = this.db.prepare('SELECT * FROM day_notes WHERE trip_id = ?').all(sourceTripId) as any[];
      const insertNote = this.db.prepare(`
        INSERT INTO day_notes (day_id, trip_id, text, time, icon, sort_order)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const n of oldNotes) {
        const newDayId = dayMap.get(n.day_id);
        if (newDayId) insertNote.run(newDayId, newTripId, n.text, n.time, n.icon, n.sort_order);
      }

      const oldTodos = this.db.prepare('SELECT * FROM todo_items WHERE trip_id = ?').all(sourceTripId) as any[];
      const insertTodo = this.db.prepare(`
        INSERT INTO todo_items (trip_id, name, checked, category, sort_order, due_date, description, assigned_user_id, priority)
        VALUES (?, ?, 0, ?, ?, ?, ?, NULL, ?)
      `);
      for (const t of oldTodos) {
        insertTodo.run(newTripId, t.name, t.category, t.sort_order, t.due_date, t.description, t.priority);
      }

      const oldCategoryOrder = this.db.prepare('SELECT category, sort_order FROM budget_category_order WHERE trip_id = ?').all(sourceTripId) as any[];
      const insertCategoryOrder = this.db.prepare(`
        INSERT INTO budget_category_order (trip_id, category, sort_order)
        VALUES (?, ?, ?)
      `);
      for (const o of oldCategoryOrder) {
        insertCategoryOrder.run(newTripId, o.category, o.sort_order);
      }

      return Number(newTripId);
    });

    return fn();
  }

  /** Re-read a freshly copied trip in list shape (mirrors the route's TRIP_SELECT query). */
  getCopiedTrip(newTripId: number, userId: number) {
    return this.db.prepare(`${TRIP_SELECT} WHERE t.id = :tripId`).get({ userId, tripId: newTripId });
  }

}

// Defined in common/ so calendar and maps can raise them without importing the
// trip aggregate; re-exported here because nine files already import them from
// this module.
export { NotFoundError, ValidationError };
