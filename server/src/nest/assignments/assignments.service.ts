import { Injectable } from '@nestjs/common';
import type { TrekWsPayload, TrekWsTripEventName } from '@trek/shared';
import { RealtimeService } from '../realtime/realtime.service';
import { DatabaseService, type TripAccess } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { QueryHelpersService } from '../query-helpers/query-helpers.service';
import { formatAssignmentWithPlace } from '../common/rowShape';
import type { AssignmentRow, DayAssignment, User } from '../../types';
import { JourneyDomainService } from '../journey/journey-domain.service';

type Trip = TripAccess;

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

  private getAssignmentWithPlace(assignmentId: number | bigint) {
    const a = this.dbs.get<AssignmentRow>(`
      SELECT da.*, p.id as place_id, p.name as place_name, p.description as place_description,
        p.lat, p.lng, p.address, p.category_id, p.price, p.currency as place_currency,
        COALESCE(da.assignment_time, p.place_time) as place_time,
        COALESCE(da.assignment_end_time, p.end_time) as end_time,
        p.duration_minutes, p.notes as place_notes,
        p.image_url, p.transport_mode, p.google_place_id, p.google_ftid, p.osm_id, p.website, p.phone,
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

    const participants = this.dbs.all(`
      SELECT ap.user_id, COALESCE(u.display_name, u.username) AS username, u.avatar
      FROM assignment_participants ap
      JOIN users u ON ap.user_id = u.id
      WHERE ap.assignment_id = ?
    `, a.id);

    return {
      id: a.id,
      day_id: a.day_id,
      place_id: a.place_id,
      order_index: a.order_index,
      notes: a.notes,
      assignment_time: a.assignment_time ?? null,
      assignment_end_time: a.assignment_end_time ?? null,
      leg_transport_mode: a.leg_transport_mode ?? null,
      incoming_leg_transport_mode: a.incoming_leg_transport_mode ?? null,
      participants,
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
        website: a.website,
        phone: a.phone,
        category: a.category_id ? {
          id: a.category_id,
          name: a.category_name,
          color: a.category_color,
          icon: a.category_icon,
        } : null,
        tags,
      }
    };
  }

  listDayAssignments(dayId: string | number) {
    const assignments = this.dbs.all<AssignmentRow>(`
      SELECT da.*, p.id as place_id, p.name as place_name, p.description as place_description,
        p.lat, p.lng, p.address, p.category_id, p.price, p.currency as place_currency,
        COALESCE(da.assignment_time, p.place_time) as place_time,
        COALESCE(da.assignment_end_time, p.end_time) as end_time,
        p.duration_minutes, p.notes as place_notes,
        p.image_url, p.transport_mode, p.google_place_id, p.google_ftid, p.osm_id, p.website, p.phone,
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

  createAssignment(dayId: string | number, placeId: unknown, notes?: string | null) {
    const result = this.dbs.transaction(() => {
      const maxOrder = this.dbs.get<{ max: number | null }>('SELECT MAX(order_index) as max FROM day_assignments WHERE day_id = ?', dayId)!;
      const orderIndex = (maxOrder.max !== null ? maxOrder.max : -1) + 1;

      return this.dbs.run(
        'INSERT INTO day_assignments (day_id, place_id, order_index, notes) VALUES (?, ?, ?, ?)',
        dayId, placeId, orderIndex, notes || null
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

  updateTime(id: string | number, placeTime: unknown, endTime: unknown) {
    this.dbs.transaction(() => {
      // Falsy times (null, undefined, '') all clear the override — an empty
      // string is a clear, not a stored value.
      this.dbs.run('UPDATE day_assignments SET assignment_time = ?, assignment_end_time = ? WHERE id = ?',
        placeTime || null, endTime || null, id);

      // Auto-sort: reorder timed assignments chronologically within the day
      if (placeTime) {
        const assignment = this.dbs.get<{ day_id: number }>('SELECT day_id FROM day_assignments WHERE id = ?', id);
        if (assignment) {
          const dayAssignments = this.dbs.all<{ id: number; effective_time: string | null }>(`
            SELECT da.id, COALESCE(da.assignment_time, p.place_time) as effective_time
            FROM day_assignments da
            JOIN places p ON da.place_id = p.id
            WHERE da.day_id = ?
            ORDER BY da.order_index ASC
          `, assignment.day_id);

          // Separate timed and untimed, sort timed by time
          const timed = dayAssignments.filter(a => a.effective_time).sort((a, b) => {
            const ta = a.effective_time!.includes(':') ? a.effective_time! : '99:99';
            const tb = b.effective_time!.includes(':') ? b.effective_time! : '99:99';
            return ta.localeCompare(tb);
          });
          const untimed = dayAssignments.filter(a => !a.effective_time);

          // Interleave: timed in chronological order, untimed keep relative position
          const reordered = [...timed, ...untimed];
          const update = this.dbs.prepare('UPDATE day_assignments SET order_index = ? WHERE id = ?');
          reordered.forEach((a, i) => update.run(i, a.id));
        }
      }
    });

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
