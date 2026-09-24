import { Injectable } from '@nestjs/common';
import { addIsoDays, MAX_TRIP_DAYS, planDatedAppend } from '@trek/shared';
import type { RoadtripDayBoundary, TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { DatabaseService, type TripAccess } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { QueryHelpersService } from '../query-helpers/query-helpers.service';
import { carryVias, locatedStopIds, reseatOwnStop } from '../accommodations/night-seat';
import { formatAssignmentWithPlace } from '../common/rowShape';
import { TRIP_SELECT } from '../trips/trip-select';
import type { AssignmentRow, Day, DayNote, User } from '../../types';

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
  day: Day & { assignments: unknown[]; notes_items: unknown[] };
  /** The trip's end date now, which is the new day's date. */
  endDate: string;
  /** The road trip day boundaries after they moved back with their days, or null when none moved. */
  boundaries: RoadtripDayBoundary[] | null;
  /** The trip re-read in list shape for the viewer: its end date and its day count changed. */
  trip: unknown;
}

type DayRow = { id: number; day_number: number; date: string | null };

/**
 * Day domain service — owns the day + accommodation SQL (moved 1:1 from the
 * legacy services/dayService.ts: identical statements, the `||` falsy-coercion
 * defaults, the post-write re-selects, the two-phase negative-day_number
 * renumber and the reservation re-stamping). The legacy hand-rolled
 * BEGIN/COMMIT blocks in reorder/insert became db.transaction() (same
 * rollback-on-throw semantics, savepoint-safe when nested). Verified defects
 * were fixed after the port (2026-07): update() now presence-sentinels BOTH
 * columns (the legacy always-write wiped notes when only a title was sent),
 * createAccommodation/deleteAccommodation run their multi-statement writes in
 * a transaction, and getAssignmentsForDay batch-loads tags instead of one
 * query per assignment. Trip access
 * rides DatabaseService.canAccessTrip; mutations use the
 * 'day_edit' permission; the WebSocket broadcast keeps its legacy call path.
 * There are no non-Nest consumers left. days.bridge.ts served them and was
 * deleted once the last one folded into the container.
 */
@Injectable()
export class DaysService {
  constructor(
    private readonly db: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly queryHelpers: QueryHelpersService,
  ) {}

  verifyTripAccess(tripId: string | number, userId: number) {
    return this.db.canAccessTrip(Number(tripId), userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return this.permissions.checkPermission('day_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  // -------------------------------------------------------------------------
  // Day assignment helpers
  // -------------------------------------------------------------------------

  getAssignmentsForDay(dayId: number | string) {
    const assignments = this.db.all<AssignmentRow>(`
    SELECT da.*, p.id as place_id, p.name as place_name, p.description as place_description,
      p.lat, p.lng, p.address, p.category_id, p.price, p.currency as place_currency,
      COALESCE(da.assignment_time, p.place_time) as place_time,
      COALESCE(da.assignment_end_time, p.end_time) as end_time,
      p.duration_minutes, p.notes as place_notes,
      p.image_url, p.transport_mode, p.google_place_id, p.google_ftid, p.osm_id, p.amap_poi_id, p.website, p.phone, p.stop_type, p.fill_percent,
      c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM day_assignments da
    JOIN places p ON da.place_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE da.day_id = ?
    ORDER BY da.order_index ASC, da.created_at ASC
  `, dayId);

    // One batched tag load instead of the legacy per-assignment query; the
    // non-compact loader returns the same full tag rows (t.* minus the join
    // key), so the output shape is unchanged.
    const tagsByPlaceId = this.queryHelpers.loadTagsByPlaceIds([...new Set(assignments.map(a => a.place_id))]);

    return assignments.map(a => {
      const tags = tagsByPlaceId[a.place_id] || [];

      return {
        id: a.id,
        day_id: a.day_id,
        order_index: a.order_index,
        end_day: a.end_day === 1,
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

  list(tripId: string | number) {
    const days = this.db.all<Day>('SELECT * FROM days WHERE trip_id = ? ORDER BY day_number ASC', tripId);

    if (days.length === 0) {
      return { days: [] };
    }

    const dayIds = days.map(d => d.id);
    const dayPlaceholders = dayIds.map(() => '?').join(',');

    const allAssignments = this.db.all<AssignmentRow>(`
    SELECT da.*, p.id as place_id, p.name as place_name, p.description as place_description,
      p.lat, p.lng, p.address, p.category_id, p.price, p.currency as place_currency,
      COALESCE(da.assignment_time, p.place_time) as place_time,
      COALESCE(da.assignment_end_time, p.end_time) as end_time,
      p.duration_minutes, p.notes as place_notes,
      p.image_url, p.transport_mode, p.google_place_id, p.google_ftid, p.osm_id, p.amap_poi_id, p.website, p.phone, p.stop_type, p.fill_percent,
      c.name as category_name, c.color as category_color, c.icon as category_icon
    FROM day_assignments da
    JOIN places p ON da.place_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE da.day_id IN (${dayPlaceholders})
    ORDER BY da.order_index ASC, da.created_at ASC
  `, ...dayIds);

    const placeIds = [...new Set(allAssignments.map(a => a.place_id))];
    const tagsByPlaceId = this.queryHelpers.loadTagsByPlaceIds(placeIds, { compact: true });

    const allAssignmentIds = allAssignments.map(a => a.id);
    const participantsByAssignment = this.queryHelpers.loadParticipantsByAssignmentIds(allAssignmentIds);

    const assignmentsByDayId: Record<number, ReturnType<typeof formatAssignmentWithPlace>[]> = {};
    for (const a of allAssignments) {
      if (!assignmentsByDayId[a.day_id]) assignmentsByDayId[a.day_id] = [];
      assignmentsByDayId[a.day_id].push(formatAssignmentWithPlace(a, tagsByPlaceId[a.place_id] || [], participantsByAssignment[a.id] || []));
    }

    const allNotes = this.db.all<DayNote>(
      `SELECT * FROM day_notes WHERE day_id IN (${dayPlaceholders}) ORDER BY sort_order ASC, created_at ASC`,
      ...dayIds
    );
    const notesByDayId: Record<number, DayNote[]> = {};
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

  create(tripId: string | number, date?: string, notes?: string) {
    const maxDay = this.db.get<{ max: number | null }>('SELECT MAX(day_number) as max FROM days WHERE trip_id = ?', tripId)!;
    const dayNumber = (maxDay.max || 0) + 1;

    const result = this.db.run(
      'INSERT INTO days (trip_id, day_number, date, notes) VALUES (?, ?, ?, ?)',
      tripId, dayNumber, date || null, notes || null
    );

    const day = this.db.get<Day>('SELECT * FROM days WHERE id = ?', result.lastInsertRowid)!;
    return { ...day, assignments: [] };
  }

  getDay(id: string | number, tripId: string | number) {
    return this.db.get<Day>('SELECT * FROM days WHERE id = ? AND trip_id = ?', id, tripId);
  }

  update(id: string | number, current: Day, fields: { notes?: string; title?: string | null }) {
    // Both columns use the presence sentinel: an absent key preserves the
    // current value (the legacy version always wrote notes, so setting a title
    // silently wiped the day's notes — the client sends the two fields in
    // separate requests).
    this.db.run('UPDATE days SET notes = ?, title = ? WHERE id = ?',
      'notes' in fields ? (fields.notes || null) : (current.notes ?? null),
      'title' in fields ? (fields.title ?? null) : (current.title ?? null),
      id
    );
    const updatedDay = this.db.get<Day>('SELECT * FROM days WHERE id = ?', id)!;
    return { ...updatedDay, assignments: this.getAssignmentsForDay(id) };
  }

  /**
   * Set the whole-day default route mode (#1281). Its own endpoint so it can't wipe
   * notes/title the way the general day update would, and symmetric with the
   * per-leg assignment transport setter. Per-segment leg modes still override it.
   */
  setDefaultTransportMode(id: string | number, mode: string | null) {
    this.db.run('UPDATE days SET default_transport_mode = ? WHERE id = ?', mode ?? null, id);
    const updatedDay = this.db.get<Day>('SELECT * FROM days WHERE id = ?', id)!;
    return { ...updatedDay, assignments: this.getAssignmentsForDay(id) };
  }

  /**
   * The trip in list shape, as the trip routes answer it, for a day write that
   * changed the trip itself (its end date, its day count). Read through the leaf
   * query rather than TripsService, which imports this class.
   */
  getTripForViewer(tripId: string | number, userId: number): unknown {
    return this.db.prepare(`${TRIP_SELECT} WHERE t.id = :tripId`).get({ userId, tripId });
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
   */
  restampReservationDates(
    tripId: string | number,
    oldDateById: Map<number, string | null>,
    newDateById: Map<number, string | null>,
  ): void {
    const reservations = this.db.all<{
      id: number; day_id: number | null; end_day_id: number | null;
      reservation_time: string | null; reservation_end_time: string | null;
    }>(
      'SELECT id, day_id, end_day_id, reservation_time, reservation_end_time FROM reservations WHERE trip_id = ?',
      tripId
    );

    const setTime = this.db.prepare('UPDATE reservations SET reservation_time = ? WHERE id = ?');
    const setEndTime = this.db.prepare('UPDATE reservations SET reservation_end_time = ? WHERE id = ?');
    const endpoints = this.db.prepare('SELECT id, local_date FROM reservation_endpoints WHERE reservation_id = ?');
    const setEndpointDate = this.db.prepare('UPDATE reservation_endpoints SET local_date = ? WHERE id = ?');

    for (const r of reservations) {
      if (r.day_id != null && r.reservation_time) {
        const oldDate = oldDateById.get(r.day_id);
        const newDate = newDateById.get(r.day_id);
        if (oldDate && newDate && oldDate !== newDate) {
          setTime.run(withDatePart(r.reservation_time, newDate), r.id);
          // Shift each transport leg's local_date by the same number of days.
          const delta = dayDelta(oldDate, newDate);
          if (delta !== 0) {
            for (const ep of endpoints.all(r.id) as { id: number; local_date: string | null }[]) {
              if (ep.local_date) setEndpointDate.run(addDays(ep.local_date, delta), ep.id);
            }
          }
        }
      }
      if (r.end_day_id != null && r.reservation_end_time) {
        const oldDate = oldDateById.get(r.end_day_id);
        const newDate = newDateById.get(r.end_day_id);
        if (oldDate && newDate && oldDate !== newDate) {
          setEndTime.run(withDatePart(r.reservation_end_time, newDate), r.id);
        }
      }
    }
  }

  /** A stay must not end before it begins after a reorder/insert. */
  private assertNoInvertedAccommodation(tripId: string | number): void {
    const spans = this.db.all<{ id: number; start_no: number; end_no: number }>(`
    SELECT a.id, s.day_number AS start_no, e.day_number AS end_no
    FROM day_accommodations a
    JOIN days s ON a.start_day_id = s.id
    JOIN days e ON a.end_day_id = e.id
    WHERE a.trip_id = ?
  `, tripId);
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
   */
  resyncAccommodationDays(
    tripId: string | number,
    prevDateByDayId: Map<number, string | null>,
  ): void {
    const stays = this.db.all<{ id: number; start_day_id: number; end_day_id: number; check_in: string | null }>(
      'SELECT id, start_day_id, end_day_id, check_in FROM day_accommodations WHERE trip_id = ?',
      tripId
    );
    if (stays.length === 0) return;

    const dayByDate = this.db.prepare('SELECT id, day_number FROM days WHERE trip_id = ? AND date = ? LIMIT 1');
    const updateStay = this.db.prepare('UPDATE day_accommodations SET start_day_id = ?, end_day_id = ? WHERE id = ?');
    const restampLinkedRes = this.db.prepare(`
    UPDATE reservations SET day_id = :dayId,
      reservation_time = CASE WHEN reservation_time IS NULL THEN :date
        ELSE :date || SUBSTR(reservation_time, 11) END
    WHERE accommodation_id = :accId AND type = 'hotel'
  `);

    for (const stay of stays) {
      const oldStartDate = prevDateByDayId.get(stay.start_day_id);
      const oldEndDate = prevDateByDayId.get(stay.end_day_id);
      if (oldStartDate && oldEndDate) {
        const newStart = dayByDate.get(tripId, oldStartDate) as { id: number; day_number: number } | undefined;
        const newEnd = dayByDate.get(tripId, oldEndDate) as { id: number; day_number: number } | undefined;
        if (newStart && newEnd && newStart.day_number <= newEnd.day_number
          && (newStart.id !== stay.start_day_id || newEnd.id !== stay.end_day_id)) {
          updateStay.run(newStart.id, newEnd.id, stay.id);
          if (newStart.id !== stay.start_day_id) this.carryStayStop(stay, newStart.id);
          stay.start_day_id = newStart.id;
        }
      }
      // Keep the linked reservation on the stay's (possibly re-dated) start day — its
      // reservation_time is a snapshot of that day's date, stale after any range change.
      const startDayDate = this.db.get<{ date: string | null }>('SELECT date FROM days WHERE id = ?', stay.start_day_id)?.date;
      if (startDayDate) {
        restampLinkedRes.run({ dayId: stay.start_day_id, date: startDayDate, accId: stay.id });
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
   */
  private carryStayStop(stay: { id: number; check_in: string | null }, dayId: number): void {
    const own = this.db.all<{ id: number; day_id: number; place_id: number; order_index: number }>(
      'SELECT id, day_id, place_id, order_index FROM day_assignments WHERE accommodation_id = ? AND day_id != ?', stay.id, dayId
    );
    for (const stop of own) {
      const before = [stop.day_id, dayId].map((id): [number, number[]] => [id, locatedStopIds(this.db, id)]);
      if (this.db.get('SELECT id FROM day_assignments WHERE day_id = ? AND place_id = ?', dayId, stop.place_id)) {
        this.db.run('DELETE FROM day_assignments WHERE id = ?', stop.id);
        this.db.run('UPDATE day_assignments SET order_index = order_index - 1 WHERE day_id = ? AND order_index > ?',
          stop.day_id, stop.order_index);
      } else {
        reseatOwnStop(this.db, stop, stop.place_id, dayId, { id: stay.id, check_in: stay.check_in });
      }
      for (const [id, previousIds] of before) carryVias(this.db, id, previousIds, locatedStopIds(this.db, id));
    }
  }

  /**
   * Reorder whole days. `orderedIds` is the desired full sequence of this trip's
   * day ids (a permutation of the current ids).
   */
  reorder(tripId: string | number, orderedIds: number[]) {
    const rows = this.db.all<{ id: number; day_number: number; date: string | null }>(
      'SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number',
      tripId
    );

    const existingIds = new Set(rows.map(r => r.id));
    if (orderedIds.length !== rows.length || !orderedIds.every(id => existingIds.has(id))) {
      throw new DayReorderError('orderedIds must be a permutation of the trip day ids.');
    }

    const oldDateById = new Map(rows.map(r => [r.id, r.date]));
    // Dates stay pinned to slots: position i keeps the i-th date (ascending).
    const sortedDates = rows.map(r => r.date).filter((d): d is string => !!d).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    const isDated = sortedDates.length > 0;

    const setDayNumber = this.db.prepare('UPDATE days SET day_number = ? WHERE id = ?');
    const setDayNumberAndDate = this.db.prepare('UPDATE days SET day_number = ?, date = ? WHERE id = ?');

    this.db.transaction(() => {
      // Two-phase renumber to dodge UNIQUE(trip_id, day_number) collisions.
      orderedIds.forEach((id, i) => setDayNumber.run(-(i + 1), id));
      const newDateById = new Map<number, string | null>();
      orderedIds.forEach((id, i) => {
        const date = isDated ? (sortedDates[i] ?? null) : null;
        setDayNumberAndDate.run(i + 1, date, id);
        newDateById.set(id, date);
      });

      if (isDated) this.restampReservationDates(tripId, oldDateById, newDateById);
      this.assertNoInvertedAccommodation(tripId);
    });

    return this.list(tripId);
  }

  /**
   * Insert a new empty day at a 1-based position (default: append at the end).
   * On a dated trip the trip gains one calendar day: dates re-pin so the slots
   * stay contiguous, the trip's end_date extends by one day, and bookings on
   * shifted days have their dates re-stamped (same rules as reorder).
   */
  insert(tripId: string | number, position?: number) {
    const rows = this.db.all<{ id: number; day_number: number; date: string | null }>(
      'SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number',
      tripId
    );
    const n = rows.length;
    const pos = Math.min(Math.max(position ?? n + 1, 1), n + 1);
    const datedRows = rows.filter(r => r.date) as { id: number; day_number: number; date: string }[];
    const isDated = datedRows.length > 0;

    const setDayNumber = this.db.prepare('UPDATE days SET day_number = ? WHERE id = ?');

    if (!isDated) {
      const newRowid = this.db.transaction(() => {
        const toShift = rows.filter(r => r.day_number >= pos);
        toShift.forEach(r => setDayNumber.run(-r.day_number, r.id));
        const result = this.db.run('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, NULL)', tripId, pos);
        toShift.forEach(r => setDayNumber.run(r.day_number + 1, r.id));
        return result.lastInsertRowid;
      });
      const day = this.db.get<Day>('SELECT * FROM days WHERE id = ?', newRowid)!;
      return { ...day, assignments: [], notes_items: [] };
    }

    // Dated trip: rebuild N+1 contiguous dates from the earliest date.
    const start = datedRows.map(r => r.date).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))[0];
    const dates = Array.from({ length: n + 1 }, (_, i) => addDays(start, i));
    const oldDateById = new Map(rows.map(r => [r.id, r.date]));
    const setDayNumberAndDate = this.db.prepare('UPDATE days SET day_number = ?, date = ? WHERE id = ?');

    const newId = this.db.transaction(() => {
      rows.forEach((r, i) => setDayNumber.run(-(i + 1), r.id));
      const result = this.db.run('INSERT INTO days (trip_id, day_number, date) VALUES (?, ?, ?)', tripId, pos, dates[pos - 1]);
      const insertedId = Number(result.lastInsertRowid);

      const orderedIds = rows.map(r => r.id);
      orderedIds.splice(pos - 1, 0, insertedId);
      const newDateById = new Map<number, string | null>();
      orderedIds.forEach((id, i) => {
        setDayNumberAndDate.run(i + 1, dates[i], id);
        newDateById.set(id, dates[i]);
      });

      this.restampReservationDates(tripId, oldDateById, newDateById);
      this.assertNoInvertedAccommodation(tripId);
      this.db.run('UPDATE trips SET end_date = ? WHERE id = ?', dates[dates.length - 1], tripId);

      return insertedId;
    });
    const day = this.db.get<Day>('SELECT * FROM days WHERE id = ?', newId)!;
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
   */
  appendDated(tripId: string | number, viewerId: number, notes?: string): DatedDayAppend {
    const trip = Number(tripId);
    const appended = this.db.transaction(() => {
      const range = this.db.get<{ start_date: string | null; end_date: string | null }>(
        'SELECT start_date, end_date FROM trips WHERE id = ?', trip,
      );
      const rows = this.db.all<DayRow>('SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number', trip);
      const plan = planDatedAppend(range ?? {}, rows.map(r => r.date));
      if (!plan) throw new DayAppendError(NO_DATES_MESSAGE);
      if (!plan.fits) throw new DayAppendError(`A trip can span at most ${MAX_TRIP_DAYS} days`);

      // The dates are a prefix of the day order on any trip the planner wrote;
      // the highest dated number keeps that true even on one that drifted.
      const position = rows.reduce((last, r) => (r.date ? Math.max(last, r.day_number) : last), 0) + 1;
      const later = rows.filter(r => r.day_number >= position);
      const setDayNumber = this.db.prepare('UPDATE days SET day_number = ? WHERE id = ?');
      // Two phases, to get past UNIQUE(trip_id, day_number) on the way.
      later.forEach(r => setDayNumber.run(-r.day_number, r.id));
      const inserted = this.db.run(
        'INSERT INTO days (trip_id, day_number, date, notes) VALUES (?, ?, ?, ?)', trip, position, plan.date, notes || null,
      );
      later.forEach(r => setDayNumber.run(r.day_number + 1, r.id));

      const boundaries = this.shiftBoundariesBack(trip, position);
      this.db.run('UPDATE trips SET end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', plan.date, trip);
      const day = this.db.get<Day>('SELECT * FROM days WHERE id = ?', inserted.lastInsertRowid)!;
      return { day: { ...day, assignments: [], notes_items: [] }, endDate: plan.date, boundaries };
    });
    return { ...appended, trip: this.getTripForViewer(trip, viewerId) };
  }

  /**
   * Boundaries are keyed by day number, so the ones on the days that moved back
   * move back with them. One at a time and from the last one down: the key is
   * the primary key, and a CHECK keeps it at 1 or above, so the negative two-step
   * the days use is not available here. Returns the list after the move, or null
   * when no boundary had to move.
   */
  private shiftBoundariesBack(tripId: number, fromNumber: number): RoadtripDayBoundary[] | null {
    const later = this.db.all<{ day_number: number }>(
      'SELECT day_number FROM roadtrip_day_boundaries WHERE trip_id = ? AND day_number >= ? ORDER BY day_number DESC',
      tripId, fromNumber,
    );
    if (later.length === 0) return null;
    const move = this.db.prepare('UPDATE roadtrip_day_boundaries SET day_number = ? WHERE trip_id = ? AND day_number = ?');
    for (const row of later) move.run(row.day_number + 1, tripId, row.day_number);
    return this.db.all<RoadtripDayBoundary>(
      'SELECT day_number, from_assignment_id, to_assignment_id, fraction FROM roadtrip_day_boundaries WHERE trip_id = ? ORDER BY day_number',
      tripId,
    );
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
