import { Injectable } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import { DatabaseService } from '../database/database.service';
import type { ActiveTrip, TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { PermissionsService } from '../permissions/permissions.service';
import type { Trip, User } from '../../types';
import { DaysService } from '../days/days.service';
import { BudgetService } from '../budget/budget.service';
import { ReservationsService } from '../reservations/reservations.service';
import { VacayService } from '../vacay/vacay.service';
import { UnsplashService } from '../unsplash/unsplash.service';
import { NotFoundError, ValidationError } from '../common/domain-errors';

export const MS_PER_DAY = 86400000;
export const MAX_TRIP_DAYS = 365;

export const TRIP_SELECT = `
  SELECT t.*,
    (SELECT COUNT(*) FROM days d WHERE d.trip_id = t.id) as day_count,
    (SELECT COUNT(*) FROM places p WHERE p.trip_id = t.id) as place_count,
    CASE WHEN t.user_id = :userId THEN 1 ELSE 0 END as is_owner,
    u.username as owner_username,
    (SELECT COUNT(*) FROM trip_members tm WHERE tm.trip_id = t.id) as shared_count
  FROM trips t
  JOIN users u ON u.id = t.user_id
`;

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
 * plus day generation, which is why the constructor is eight parameters instead
 * of fourteen. The SQL moved 1:1 from the legacy
 * services/tripService.ts: identical statements, the `||` falsy-coercion
 * defaults, the post-write TRIP_SELECT re-selects and the mixed
 * named/positional parameter styles are all preserved byte-for-byte.
 * Post-migration quirk fixes on top of the 1:1 move: the multi-statement
 * deletes (remove, deleteGuest's re-split + user delete) run in
 * db.transaction(), and listMembers' owner row COALESCEs display_name like
 * the member rows. Auth (canAccessTrip), per-field permission checks and
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
  ) {}

  private get db() {
    return this.dbs.connection;
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

  generateDays(tripId: number | bigint | string, startDate: string | null, endDate: string | null, maxDays?: number, dayCount?: number) {
    const existing = this.db.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ?').all(tripId) as { id: number; day_number: number; date: string | null }[];
    const setDayNumber = this.db.prepare('UPDATE days SET day_number = ? WHERE id = ?');

    // Helper: two-phase renumber to avoid UNIQUE(trip_id, day_number) collisions
    function renumber(days: { id: number }[]) {
      days.forEach((d, i) => setDayNumber.run(-(i + 1), d.id));
      days.forEach((d, i) => setDayNumber.run(i + 1, d.id));
    }

    if (!startDate || !endDate) {
      // Nullify all dated days instead of deleting them — preserves assignments/notes/accommodations
      const withDates = existing.filter(d => d.date);
      if (withDates.length > 0) {
        const nullify = this.db.prepare('UPDATE days SET date = NULL WHERE id = ?');
        for (const d of withDates) nullify.run(d.id);
      }
      // Now all days are dateless — adjust count toward dayCount target
      const allDays = this.db.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number }[];
      const targetCount = Math.min(Math.max(dayCount ?? (allDays.length || 7), 1), MAX_TRIP_DAYS);
      const needed = targetCount - allDays.length;
      if (needed > 0) {
        const insert = this.db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, NULL)');
        for (let i = 0; i < needed; i++) insert.run(tripId, allDays.length + i + 1);
      } else if (needed < 0) {
        // Only trim trailing empty days to avoid destroying content
        const candidates = this.db.prepare(
          `SELECT d.id FROM days d
           WHERE d.trip_id = ?
             AND NOT EXISTS (SELECT 1 FROM day_assignments da WHERE da.day_id = d.id)
             AND NOT EXISTS (SELECT 1 FROM day_notes dn WHERE dn.day_id = d.id)
             AND NOT EXISTS (SELECT 1 FROM day_accommodations dac WHERE dac.start_day_id = d.id OR dac.end_day_id = d.id)
           ORDER BY d.day_number DESC
           LIMIT ?`
        ).all(tripId, -needed) as { id: number }[];
        const del = this.db.prepare('DELETE FROM days WHERE id = ?');
        for (const d of candidates) del.run(d.id);
      }
      const remaining = this.db.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number }[];
      renumber(remaining);
      return;
    }

    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const startMs = Date.UTC(sy, sm - 1, sd);
    const endMs = Date.UTC(ey, em - 1, ed);
    const numDays = Math.min(Math.floor((endMs - startMs) / MS_PER_DAY) + 1, maxDays ?? MAX_TRIP_DAYS);

    const targetDates: string[] = [];
    for (let i = 0; i < numDays; i++) {
      const d = new Date(startMs + i * MS_PER_DAY);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      targetDates.push(`${yyyy}-${mm}-${dd}`);
    }

    // Split into dated (sorted by day_number = position) and dateless (spare pool)
    const dated = existing.filter(d => d.date).sort((a, b) => a.day_number - b.day_number);
    const dateless = existing.filter(d => !d.date).sort((a, b) => a.day_number - b.day_number);

    // Phase 1: stamp all existing days with negative day_numbers to free up slots
    const allExisting = [...dated, ...dateless];
    allExisting.forEach((d, i) => setDayNumber.run(-(i + 1), d.id));

    const assignDay = this.db.prepare('UPDATE days SET date = ?, day_number = ? WHERE id = ?');
    const insert = this.db.prepare('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)');

    let datelessIdx = 0;

    for (let i = 0; i < targetDates.length; i++) {
      const date = targetDates[i];
      if (i < dated.length) {
        // Positional remap: existing dated day i gets new date — keeps all children
        assignDay.run(date, i + 1, dated[i].id);
      } else if (datelessIdx < dateless.length) {
        // Reuse a dateless day — keeps its assignments, notes, etc.
        assignDay.run(date, i + 1, dateless[datelessIdx].id);
        datelessIdx++;
      } else {
        insert.run(tripId, i + 1, date);
      }
    }

    // Overflow dated days (trip shrunk): delete them (issue #909).
    // Cascade removes their assignments, notes, and accommodations.
    const del = this.db.prepare('DELETE FROM days WHERE id = ?');
    for (let i = targetDates.length; i < dated.length; i++) {
      del.run(dated[i].id);
    }

    // Any remaining unused dateless days: drop the empty placeholders so day_count
    // reflects the dated range, but keep ones that still hold content (assignments,
    // notes, accommodations) — mirrors the dateless-path trimming above (#1083).
    // Base must be max(targetDates.length, dated.length) to avoid colliding with
    // positives already assigned by the main loop or the overflow loop above.
    const isEmptyDay = this.db.prepare(
      `SELECT NOT EXISTS (SELECT 1 FROM day_assignments da WHERE da.day_id = @id)
            AND NOT EXISTS (SELECT 1 FROM day_notes dn WHERE dn.day_id = @id)
            AND NOT EXISTS (SELECT 1 FROM day_accommodations dac WHERE dac.start_day_id = @id OR dac.end_day_id = @id) AS empty`
    );
    const maxAssigned = Math.max(targetDates.length, dated.length);
    let keptDateless = 0;
    for (let i = datelessIdx; i < dateless.length; i++) {
      const empty = (isEmptyDay.get({ id: dateless[i].id }) as { empty: number }).empty;
      if (empty) {
        del.run(dateless[i].id);
      } else {
        setDayNumber.run(maxAssigned + keptDateless + 1, dateless[i].id);
        keptDateless++;
      }
    }

    // Final renumber to compact and eliminate any gaps/negatives
    const remaining = this.db.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number }[];
    renumber(remaining);
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

  create(userId: number, data: CreateTripData, maxDays?: number) {
    const rd = data.reminder_days !== undefined
      ? (Number(data.reminder_days) >= 0 && Number(data.reminder_days) <= 30 ? Number(data.reminder_days) : 3)
      : 3;

    const result = this.db.prepare(`
      INSERT INTO trips (user_id, title, description, start_date, end_date, currency, reminder_days)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, data.title, data.description || null, data.start_date || null, data.end_date || null, data.currency || 'EUR', rd);

    const tripId = result.lastInsertRowid;
    this.generateDays(tripId, data.start_date || null, data.end_date || null, maxDays, data.day_count);

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

    const { title, description, start_date, end_date, currency, is_archived, cover_image, reminder_days } = data;

    if (start_date && end_date && new Date(end_date) < new Date(start_date))
      throw new ValidationError('End date must be after start date');

    const newTitle = title || trip.title;
    const newDesc = description !== undefined ? description : trip.description;
    const newStart = start_date !== undefined ? start_date : trip.start_date;
    const newEnd = end_date !== undefined ? end_date : trip.end_date;
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

    const dayCount = data.day_count ? Math.min(Math.max(Number(data.day_count) || 7, 1), MAX_TRIP_DAYS) : undefined;
    if (newStart !== trip.start_date || newEnd !== trip.end_date || dayCount) {
      this.db.transaction(() => {
        // Accommodations have no absolute date columns, so their pre-change dates must be
        // snapshotted before generateDays re-dates the day rows in place.
        const prevDateByDayId = new Map(
          (this.db.prepare('SELECT id, date FROM days WHERE trip_id = ?').all(tripId) as { id: number; date: string | null }[])
            .map(d => [d.id, d.date]),
        );
        this.generateDays(tripId, newStart || null, newEnd || null, undefined, dayCount);
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

    return { updatedTrip, changes, isAdminEdit, ownerEmail, newTitle, newReminder, oldReminder };
  }

  async update(tripId: string | number, userId: number, body: UpdateTripData, role: string) {
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
        UPDATE journey_entries SET source_trip_id = NULL, source_place_id = NULL
        WHERE source_trip_id = ?
      `).run(tripId);

      this.db.prepare('DELETE FROM trips WHERE id = ?').run(tripId);
    })();

    return { tripId: Number(tripId), title: trip.title, ownerId: trip.user_id, isAdminDelete, ownerEmail };
  }

  // ── Cover image ───────────────────────────────────────────────────────────

  deleteOldCover(coverImage: string | null | undefined): void {
    if (!coverImage) return;
    // cover_image is client-supplied, so treat it as untrusted: covers live in
    // uploads/covers as a flat filename — use basename() and confine the unlink
    // to that directory. (dist/nest/trips is one level deeper than the legacy
    // dist/services home, hence the extra '..' — same resolved directory.)
    const coversDir = path.resolve(__dirname, '../../../uploads/covers');
    const resolvedPath = path.resolve(path.join(coversDir, path.basename(coverImage)));
    if (resolvedPath.startsWith(coversDir + path.sep) && fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }
  }

  updateCoverImage(tripId: string | number, coverUrl: string): void {
    this.db.prepare('UPDATE trips SET cover_image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(coverUrl, tripId);
  }

  // ── Copy / duplicate ─────────────────────────────────────────────────────

  /**
   * Duplicates a trip (all days, places, assignments, accommodations, reservations,
   * budget, packing bags/items, day notes) into a new trip owned by `newOwnerId`.
   * Packing items are reset to unchecked. Budget paid status is cleared.
   * Returns the new trip's ID.
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
          route_geometry, route_color)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of oldPlaces) {
        const r = insertPlace.run(newTripId, p.name, p.description, p.lat, p.lng, p.address, p.category_id,
          p.price, p.currency, p.reservation_status, p.reservation_notes, p.reservation_datetime,
          p.place_time, p.end_time, p.duration_minutes, p.notes, p.image_url, p.google_place_id,
          p.google_ftid, p.website, p.phone, p.transport_mode, p.osm_id, p.route_geometry, p.route_color);
        placeMap.set(p.id, r.lastInsertRowid);
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
        INSERT INTO day_assignments (day_id, place_id, order_index, notes, reservation_status, reservation_notes, reservation_datetime, assignment_time, assignment_end_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of oldAssignments) {
        const newDayId = dayMap.get(a.day_id);
        const newPlaceId = placeMap.get(a.place_id);
        if (newDayId && newPlaceId) {
          const r = insertAssignment.run(newDayId, newPlaceId, a.order_index, a.notes,
            a.reservation_status, a.reservation_notes, a.reservation_datetime,
            a.assignment_time, a.assignment_end_time);
          assignmentMap.set(a.id, r.lastInsertRowid);
        }
      }

      const oldAccom = this.db.prepare('SELECT * FROM day_accommodations WHERE trip_id = ?').all(sourceTripId) as any[];
      const accomMap = new Map<number, number | bigint>();
      const insertAccom = this.db.prepare(`
        INSERT INTO day_accommodations (trip_id, place_id, start_day_id, end_day_id, check_in, check_out, confirmation, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of oldAccom) {
        const newPlaceId = placeMap.get(a.place_id);
        const newStartDay = dayMap.get(a.start_day_id);
        const newEndDay = dayMap.get(a.end_day_id);
        if (newPlaceId && newStartDay && newEndDay) {
          const r = insertAccom.run(newTripId, newPlaceId, newStartDay, newEndDay, a.check_in, a.check_out, a.confirmation, a.notes);
          accomMap.set(a.id, r.lastInsertRowid);
        }
      }

      const oldReservations = this.db.prepare('SELECT * FROM reservations WHERE trip_id = ?').all(sourceTripId) as any[];
      const insertReservation = this.db.prepare(`
        INSERT INTO reservations (trip_id, day_id, end_day_id, place_id, assignment_id, accommodation_id, title, reservation_time, reservation_end_time,
          location, confirmation_number, notes, status, type, metadata, day_plan_position, needs_review)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of oldReservations) {
        insertReservation.run(newTripId,
          r.day_id ? (dayMap.get(r.day_id) ?? null) : null,
          // end_day_id is a day reference too (multi-day transport) — remap it like
          // day_id, otherwise the duplicated trip loses the reservation's end-day link.
          r.end_day_id ? (dayMap.get(r.end_day_id) ?? null) : null,
          r.place_id ? (placeMap.get(r.place_id) ?? null) : null,
          r.assignment_id ? (assignmentMap.get(r.assignment_id) ?? null) : null,
          r.accommodation_id ? (accomMap.get(r.accommodation_id) ?? null) : null,
          r.title, r.reservation_time, r.reservation_end_time,
          r.location, r.confirmation_number, r.notes, r.status, r.type,
          r.metadata, r.day_plan_position, r.needs_review ?? 0);
      }

      const oldBudget = this.db.prepare('SELECT * FROM budget_items WHERE trip_id = ?').all(sourceTripId) as any[];
      const insertBudget = this.db.prepare(`
        INSERT INTO budget_items (trip_id, category, name, total_price, persons, days, note, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const b of oldBudget) {
        insertBudget.run(newTripId, b.category, b.name, b.total_price, b.persons, b.days, b.note, b.sort_order);
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

      const oldPacking = this.db.prepare('SELECT * FROM packing_items WHERE trip_id = ?').all(sourceTripId) as any[];
      const insertPacking = this.db.prepare(`
        INSERT INTO packing_items (trip_id, name, checked, category, sort_order, weight_grams, bag_id, updated_at)
        VALUES (?, ?, 0, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      for (const p of oldPacking) {
        insertPacking.run(newTripId, p.name, p.category, p.sort_order, p.weight_grams,
          p.bag_id ? (bagMap.get(p.bag_id) ?? null) : null);
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
