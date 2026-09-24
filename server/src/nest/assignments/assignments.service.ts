import { Injectable } from '@nestjs/common';
import { chronoOrder, type RoadtripVia, type TrekWsPayload, type TrekWsTripEventName } from '@trek/shared';
import { isEmptyReanchoring, reanchorByStopOrder, type AnchoredVia } from '@trek/shared/roadtrip';
import { RealtimeService } from '../realtime/realtime.service';
import { DatabaseService, type TripAccess } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { QueryHelpersService } from '../query-helpers/query-helpers.service';
import { formatAssignmentWithPlace } from '../common/rowShape';
import type { AssignmentRow, DayAssignment, User, Participant } from '../../types';
import { JourneyDomainService } from '../journey/journey-domain.service';

type Trip = TripAccess;

/** One stop of a day as the time sort reads it. */
interface DayStopRow {
  id: number;
  order_index: number;
  effective_time: string | null;
  located: number;
}

/**
 * What saving a time changed besides the stop itself, so each caller can tell the
 * trip. `reordered` carries the day's whole order and `vias` the day's re-pinned
 * vias; both stay null when the save left every stop where it was.
 */
export interface AssignmentTimeUpdate {
  assignment: ReturnType<AssignmentsService['getAssignmentWithPlace']>;
  reordered: { dayId: number; orderedIds: number[] } | null;
  vias: { dayId: number; vias: RoadtripVia[] } | null;
}

/**
 * Where the time sort puts a value it cannot read as a clock time: after every real
 * time, which is where the '99:99' sentinel has always put a time without a colon. A
 * legacy "morning" keeps sorting where it did. The client reads such a value as no
 * time at all; that difference is older than this rule and left alone.
 */
const UNREADABLE_TIME = 99 * 60 + 99;

function sortMinutes(time: string | null): number | null {
  if (!time) return null;
  const clock = /(?:^|T)(\d{1,2}):(\d{2})/.exec(time);
  return clock ? Number(clock[1]) * 60 + Number(clock[2]) : UNREADABLE_TIME;
}

/**
 * Assignments domain service — owns the day-assignment SQL (relocated from the
 * legacy services/assignmentService.ts, then hardened: every multi-statement
 * write runs in a transaction, moveAssignment derives the source day from the
 * row instead of trusting the caller, empty-string times clear like null, and
 * single-assignment reads embed the same compact tag projection the list path
 * uses). Trip access rides DatabaseService.canAccessTrip; mutations use
 * 'day_edit'. The batch tag/participant loaders are injected as
 * QueryHelpersService (shared with the day, share and place services).
 * Every consumer injects this class (assignments.bridge.ts is deleted —
 * PlacesMcp injects it from AssignmentsDomainModule now).
 */
@Injectable()
export class AssignmentsService {
  constructor(
    private readonly dbs: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly queryHelpers: QueryHelpersService,
    private readonly journey: JourneyDomainService,
  ) {}

  verifyTripAccess(tripId: string | number, userId: number) {
    return this.dbs.canAccessTrip(Number(tripId), userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return this.permissions.checkPermission('day_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast<E extends TrekWsTripEventName>(tripId: string, event: E, payload: TrekWsPayload<E>, socketId: string | undefined): void {
    this.realtime.broadcast(tripId, event, payload, socketId);
  }

  /**
   * Re-mirror the trip's day-assigned places onto every linked journey's skeleton
   * suggestions. Called after any assignment mutation (create/delete/move/time) so
   * the journey stays in sync. Non-fatal, like the route's try/catch.
   */
  reconcile(tripId: string | number, socketId?: string): void {
    try { this.journey.reconcileTripSkeletons(Number(tripId), socketId); } catch { /* non-fatal */ }
  }

  /**
   * One stop, shaped the way every assignment event and REST answer carries it.
   * Public because the accommodation mirror moves a stop in place and has to hand
   * the moved row back in exactly this shape.
   */
  getAssignmentWithPlace(assignmentId: number | bigint) {
    const a = this.dbs.get<AssignmentRow>(`
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
      WHERE da.id = ?
    `, assignmentId);

    if (!a) return null;

    // Same compact tag projection as listDayAssignments, so an assignment has
    // one wire shape regardless of which read path produced it.
    const tags = this.queryHelpers.loadTagsByPlaceIds([a.place_id], { compact: true })[a.place_id] || [];

    const participants = this.dbs.all<Participant>(`
      SELECT ap.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
      FROM assignment_participants ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.assignment_id = ?
    `, a.id);

    // The same shaper the list path uses. It was spelled out here as a third hand-kept
    // copy of the place shape, and the copy silently dropped `stop_type`: the optimistic
    // row the client had drawn as a fuel stop was replaced, a beat later, by this answer
    // without it — so a petrol station turned into an ordinary numbered place while you
    // watched.
    return formatAssignmentWithPlace(a, tags, participants);
  }

  listDayAssignments(dayId: string | number) {
    const assignments = this.dbs.all<AssignmentRow>(`
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

    const placeIds = [...new Set(assignments.map(a => a.place_id))];
    const tagsByPlaceId = this.queryHelpers.loadTagsByPlaceIds(placeIds, { compact: true });

    const assignmentIds = assignments.map(a => a.id);
    const participantsByAssignment = this.queryHelpers.loadParticipantsByAssignmentIds(assignmentIds);

    return assignments.map(a => {
      return formatAssignmentWithPlace(a, tagsByPlaceId[a.place_id] || [], participantsByAssignment[a.id] || []);
    });
  }

  dayExists(dayId: string | number, tripId: string | number) {
    return !!this.dbs.get('SELECT id FROM days WHERE id = ? AND trip_id = ?', dayId, tripId);
  }

  placeExists(placeId: unknown, tripId: string | number) {
    return !!this.dbs.get('SELECT id FROM places WHERE id = ? AND trip_id = ?', placeId, tripId);
  }

  /**
   * @param opts.accommodationId The lodging booking this stop belongs to, when a
   * booking is what put it there. Written by the INSERT rather than stamped on
   * afterwards: the row this returns is what the answer hands the client, and a
   * stop that reaches it without its booking id is one the day list cannot tell
   * from a place the traveller added, so it draws the hotel a second time.
   */
  createAssignment(dayId: string | number, placeId: unknown, notes?: string | null, opts: { accommodationId?: number; orderIndex?: number } = {}) {
    const result = this.dbs.transaction(() => {
      const maxOrder = this.dbs.get<{ max: number | null }>('SELECT MAX(order_index) as max FROM day_assignments WHERE day_id = ?', dayId)!;
      const end = (maxOrder.max !== null ? maxOrder.max : -1) + 1;
      // Somewhere in the middle when the caller says so, which means everything from
      // there on moves down. The end is still the default and still what every caller
      // but one asks for.
      const orderIndex = opts.orderIndex !== undefined ? Math.max(0, Math.min(opts.orderIndex, end)) : end;
      if (orderIndex < end) {
        this.dbs.run('UPDATE day_assignments SET order_index = order_index + 1 WHERE day_id = ? AND order_index >= ?', dayId, orderIndex);
      }

      return this.dbs.run(
        'INSERT INTO day_assignments (day_id, place_id, order_index, notes, accommodation_id) VALUES (?, ?, ?, ?, ?)',
        dayId, placeId, orderIndex, notes || null, opts.accommodationId ?? null
      );
    });

    return this.getAssignmentWithPlace(result.lastInsertRowid);
  }

  assignmentExistsInDay(id: string | number, dayId: string | number, tripId: string | number) {
    return !!this.dbs.get(
      'SELECT da.id FROM day_assignments da JOIN days d ON da.day_id = d.id WHERE da.id = ? AND da.day_id = ? AND d.trip_id = ?',
      id, dayId, tripId
    );
  }

  deleteAssignment(id: string | number): void {
    this.dbs.run('DELETE FROM day_assignments WHERE id = ?', id);
  }

  reorderAssignments(dayId: string | number, orderedIds: number[]): void {
    const update = this.dbs.prepare('UPDATE day_assignments SET order_index = ? WHERE id = ? AND day_id = ?');
    this.dbs.transaction(() => {
      orderedIds.forEach((id: number, index: number) => {
        update.run(index, id, dayId);
      });
    });
  }

  getAssignmentForTrip(id: string | number, tripId: string | number) {
    return this.dbs.get<DayAssignment>(`
      SELECT da.* FROM day_assignments da
      JOIN days d ON da.day_id = d.id
      WHERE da.id = ? AND d.trip_id = ?
    `, id, tripId);
  }

  moveAssignment(id: string | number, newDayId: unknown, orderIndex: number | null | undefined) {
    // The source day comes from the row, not the caller — callers can't lie
    // about (or race on) where the assignment was.
    const oldDayId = this.dbs.transaction(() => {
      const row = this.dbs.get<{ day_id: number }>('SELECT day_id FROM day_assignments WHERE id = ?', id);
      this.dbs.run('UPDATE day_assignments SET day_id = ?, order_index = ? WHERE id = ?', newDayId, orderIndex ?? 0, id);
      return row?.day_id;
    });
    const updated = this.getAssignmentWithPlace(Number(id));
    return { assignment: updated, oldDayId };
  }

  getParticipants(assignmentId: string | number) {
    return this.dbs.all(`
      SELECT ap.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
      FROM assignment_participants ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.assignment_id = ?
    `, assignmentId);
  }

  /**
   * Saves a visit's own start and end, and puts the day back in time order when the
   * start changed. The rule is the planner's (`chronoOrder`): an untimed stop stays
   * behind the stop it followed. This used to append every untimed stop after the
   * timed ones, so one start time pulled a stop planned last to the top of the day.
   *
   * The rule is shared, what it reads is not. This sorts the day's stops alone, with a
   * booked night timed by its check-in. The planner sorts day notes and bookings in
   * between them and never draws the night's row. An untimed stop behind a timed note
   * or train takes that item's time there and the previous stop's time here, so on
   * such a day the order stored and the order drawn can differ. The old sort did the
   * same.
   */
  updateTime(id: string | number, placeTime: unknown, endTime: unknown): AssignmentTimeUpdate {
    const sorted = this.dbs.transaction(() => {
      const stored = this.dbs.get<{ day_id: number; start: string | null }>(`
        SELECT da.day_id, COALESCE(da.assignment_time, p.place_time, acc.check_in) AS start
        FROM day_assignments da
        JOIN places p ON da.place_id = p.id
        LEFT JOIN day_accommodations acc ON acc.id = da.accommodation_id
        WHERE da.id = ?
      `, id);

      // Falsy times (null, undefined, '') all clear the override — an empty
      // string is a clear, not a stored value.
      this.dbs.run('UPDATE day_assignments SET assignment_time = ?, assignment_end_time = ? WHERE id = ?',
        placeTime || null, endTime || null, id);

      // Only a start that moved sorts. An end is a label. A start sent again as it
      // stood (the place form saving an End, the stay dialog taking one off, an MCP
      // call that names only the end) leaves the day the way the traveller left it,
      // which can be out of time order on purpose. Compared the way the sort reads
      // it, so a visit given the time its place already had moves nothing either. A
      // cleared start leaves the day alone too.
      if (!placeTime || !stored) return null;
      if (sortMinutes(String(placeTime)) === sortMinutes(stored.start)) return null;
      return this.sortDayByTime(stored.day_id);
    });

    return {
      assignment: this.getAssignmentWithPlace(Number(id)),
      reordered: sorted ? { dayId: sorted.dayId, orderedIds: sorted.orderedIds } : null,
      vias: sorted?.viasMoved ? { dayId: sorted.dayId, vias: this.listDayVias(sorted.dayId) } : null,
    };
  }

  /**
   * Puts one day in time order. Writes nothing when it already is, which is the usual
   * case: most starts are typed in the order the day is planned.
   */
  private sortDayByTime(dayId: number): { dayId: number; orderedIds: number[]; viasMoved: boolean } | null {
    // A booked night's hour lives on the booking, not on the stop: nobody types a
    // time into a hotel row, they type a check-in. Left out of this, the night
    // counted as untimed and stayed wherever it had been dropped, so pinning an
    // afternoon stop sorted that one and left the hotel sitting in front of or
    // behind it by accident.
    const rows = this.dbs.all<DayStopRow>(`
      SELECT da.id, da.order_index, COALESCE(da.assignment_time, p.place_time, acc.check_in) as effective_time,
        (p.lat IS NOT NULL AND p.lng IS NOT NULL) as located
      FROM day_assignments da
      JOIN places p ON da.place_id = p.id
      LEFT JOIN day_accommodations acc ON acc.id = da.accommodation_id
      WHERE da.day_id = ?
      ORDER BY da.order_index ASC, da.created_at ASC, da.id ASC
    `, dayId);

    const sorted = chronoOrder(rows, row => sortMinutes(row.effective_time));
    if (sorted.every((row, i) => row === rows[i])) return null;

    // Numbered from 0, the way a drag stores a day (`reorderAssignments`). The order
    // goes out as a list of ids and every client numbers it by position, so keys kept
    // with their gaps would put the day notes and bookings that sort between stops in
    // one place for the writer, who reads the day back, and in another for everyone
    // else. Only a stop whose key changes is written.
    const update = this.dbs.prepare('UPDATE day_assignments SET order_index = ? WHERE id = ?');
    sorted.forEach((row, i) => {
      if (row.order_index !== i) update.run(i, row.id);
    });

    return { dayId, orderedIds: sorted.map(row => row.id), viasMoved: this.reanchorVias(dayId, rows, sorted) };
  }

  /**
   * Keeps every drawn road behind the stop it was drawn after, the rule the planner
   * applies when stops are dragged (`reanchorByStopOrder`). A via is pinned to a
   * POSITION among the day's located stops, so a sort that moves a stop would
   * otherwise hand the vias behind it to other legs. Inside the sort's transaction:
   * an order without its vias is a road the traveller never drew.
   *
   * No sequence renumbering, unlike RoadtripService.reanchor: a reorder maps each leg
   * onto a different one, so two legs' vias never end up on the same leg.
   */
  private reanchorVias(dayId: number, before: DayStopRow[], after: DayStopRow[]): boolean {
    const located = (rows: DayStopRow[]) => rows.filter(row => row.located).map(row => row.id);
    const previousIds = located(before);
    const nextIds = located(after);
    // Only stops without coordinates moved. The router never sees those, so every leg
    // is still the one it was.
    if (previousIds.every((stopId, i) => stopId === nextIds[i])) return false;

    // A via behind the day's last stop bends the drive into the next day, on a trip
    // with connected days or a night drive (the planner's `anchorFor` files it there).
    // It stays with that stop while the sort leaves it last, and goes once the sort puts
    // another stop last (`seamViaIndex`, applied inside `reanchorByStopOrder`): it lies on
    // the road to tomorrow, not on the leg that stop leaves by now. The same rule the
    // planner's own drags follow.
    const vias = this.dbs.all<AnchoredVia>('SELECT id, after_order_index, lat, lng FROM roadtrip_vias WHERE day_id = ?', dayId);
    const plan = reanchorByStopOrder(vias, previousIds, nextIds);
    for (const viaId of plan.remove) {
      this.dbs.run('DELETE FROM roadtrip_vias WHERE id = ? AND day_id = ?', viaId, dayId);
    }
    for (const via of plan.vias) {
      this.dbs.run('UPDATE roadtrip_vias SET after_order_index = ? WHERE id = ? AND day_id = ?', via.after_order_index, via.id, dayId);
    }
    return !isEmptyReanchoring(plan);
  }

  /**
   * The day's vias in the shape the road trip routes broadcast them. RoadtripService
   * has this query too, but its module imports this one, so it cannot be injected here.
   */
  private listDayVias(dayId: number): RoadtripVia[] {
    return this.dbs.all<RoadtripVia>(
      `SELECT id, day_id, after_order_index, sequence, lat, lng, created_at
         FROM roadtrip_vias
        WHERE day_id = ?
        ORDER BY after_order_index, sequence, id`,
      dayId,
    );
  }

  setEndDay(id: string | number, endDay: boolean) {
    this.dbs.run('UPDATE day_assignments SET end_day = ? WHERE id = ?', endDay ? 1 : 0, id);
    return this.getAssignmentWithPlace(Number(id));
  }

  /**
   * Edit the per-assignment note after creation (#2163) — until now the note
   * was write-once via the create paths (REST body, MCP tools, plugin RPC) and
   * invisible in the app. Falsy notes ('' or null) clear the column, the same
   * `notes || null` normalisation createAssignment applies. No auto-sort and no
   * journey reconcile: the note affects neither the day order nor the skeleton
   * mirror (same as the transport-mode writes).
   */
  updateNotes(id: string | number, notes: string | null | undefined) {
    this.dbs.run('UPDATE day_assignments SET notes = ? WHERE id = ?', notes || null, id);
    return this.getAssignmentWithPlace(Number(id));
  }

  /**
   * Set the travel mode of the leg leaving this stop (#1281). null clears the
   * override so the leg falls back to the day's default_transport_mode. This is
   * sticky by design: changing the whole-day default never touches a leg that
   * carries its own explicit mode.
   */
  setLegTransportMode(id: string | number, mode: string | null) {
    this.dbs.run('UPDATE day_assignments SET leg_transport_mode = ? WHERE id = ?', mode ?? null, id);
    return this.getAssignmentWithPlace(Number(id));
  }

  /**
   * Set the travel mode of the leg arriving at this stop (#1281 boundary legs).
   * Mirrors setLegTransportMode but targets incoming_leg_transport_mode; inert
   * when the previous timeline element is a place (the column is only read for
   * non-place origins like a booking arrival or a morning hotel departure).
   */
  setIncomingLegTransportMode(id: string | number, mode: string | null) {
    this.dbs.run('UPDATE day_assignments SET incoming_leg_transport_mode = ? WHERE id = ?', mode ?? null, id);
    return this.getAssignmentWithPlace(Number(id));
  }

  /**
   * Both callers have already proven the assignment sits on `tripId`; this
   * settles the other half, that the ids in the body do too. Off-roster ids drop
   * silently rather than 400, matching bag members and reservation travellers —
   * the participants box sends the whole list back on every edit, so rejecting
   * the request would strand a trip whose membership changed underneath it.
   */
  setParticipants(assignmentId: string | number, userIds: number[], tripId: string | number) {
    const roster = this.dbs.rosterUserIds(tripId);
    const scoped = userIds.filter(id => roster.has(id));
    this.dbs.transaction(() => {
      this.dbs.run('DELETE FROM assignment_participants WHERE assignment_id = ?', assignmentId);
      if (scoped.length > 0) {
        const insert = this.dbs.prepare('INSERT OR IGNORE INTO assignment_participants (assignment_id, user_id) VALUES (?, ?)');
        for (const userId of scoped) insert.run(assignmentId, userId);
      }
    });

    return this.dbs.all(`
      SELECT ap.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
      FROM assignment_participants ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.assignment_id = ?
    `, assignmentId);
  }
}
