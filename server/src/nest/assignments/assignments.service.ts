import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { chronoOrder, type RoadtripVia, type TrekWsPayload, type TrekWsTripEventName } from '@trek/shared';
import { isEmptyReanchoring, reanchorByStopOrder } from '@trek/shared/roadtrip';
import { RealtimeService } from '../realtime/realtime.service';
import type { TripAccess } from '../../db/repositories/Trips.repository';
import { PermissionsService } from '../permissions/permissions.service';
import { QueryHelpersService } from '../query-helpers/query-helpers.service';
import { formatAssignmentWithPlace } from '../common/rowShape';
import type { User } from '../../types';
import { JourneyDomainService } from '../journey/journey-domain.service';
import { UnitOfWork } from '../database/unit-of-work';
import { toRowId } from '../common/row-id';
import { DayAssignments } from '../../db/entities/DayAssignments.entity';
import type { DayAssignmentsRepository, DayStopRow } from '../../db/repositories/DayAssignments.repository';
import { AssignmentParticipants } from '../../db/entities/AssignmentParticipants.entity';
import type { AssignmentParticipantsRepository } from '../../db/repositories/AssignmentParticipants.repository';
import { Days } from '../../db/entities/Days.entity';
import type { DaysRepository } from '../../db/repositories/Days.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { Places } from '../../db/entities/Places.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import { TripMembers } from '../../db/entities/TripMembers.entity';
import type { TripMembersRepository } from '../../db/repositories/TripMembers.repository';
import { RoadtripVias } from '../../db/entities/RoadtripVias.entity';
import type { RoadtripViasRepository } from '../../db/repositories/RoadtripVias.repository';

type Trip = TripAccess;

/**
 * What saving a time changed besides the stop itself, so each caller can tell the
 * trip. `reordered` carries the day's whole order and `vias` the day's re-pinned
 * vias; both stay null when the save left every stop where it was.
 */
export interface AssignmentTimeUpdate {
  assignment: Awaited<ReturnType<AssignmentsService['getAssignmentWithPlace']>>;
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
 *
 * The day-assignment/participant SQL now lives in `DayAssignmentsRepository`/
 * `AssignmentParticipantsRepository` (Plan 3c Task 3, consuming Task 2's
 * `findWithPlaceAndCategory`/`listForDay` projection unchanged for AS1/AS3);
 * AS20–AS23 (`roadtrip_vias`) now live in `RoadtripViasRepository` (Plan 3d
 * Task 1) — AS20/AS21/AS22 convert inside `updateTime`'s existing
 * transaction (legacy order, R7's non-transactional class does not apply
 * here since these three already ran inside a transaction), and AS23
 * (`listDayVias`) is retired in favour of the repository's own `listForDay`
 * (RT2's one copy). AS5 (`placeExists`) called
 * `PlacesRepository.existsInTrip` through Task 4's follow-up, once that file
 * was free (it moved off an inlined `qb()` read this class carried for one
 * session while `Places.repository.ts` was another task's exclusive file).
 *
 * **Assignment/day/place ids arriving from a route/tool are `toRowId`'d
 * inside each existence gate, not passed through on the affinity seam**
 * (Task 3 review H1, a live regression fixed by Task 4): `dayExists`/
 * `placeExists`/`assignmentExistsInDay`/`getAssignmentForTrip` used to bind
 * the caller's raw id straight into their own read, which SQLite's
 * text/integer affinity matches for a shape (`"3 "`, `"3.0"`, `"+3"`)
 * `toRowId` rejects — so a gate could answer "found" for an id the mutation
 * behind it, converting with its own `toRowId(id)!`, then treated as `null`
 * (a 500 on `move`, a silent no-write "success" on `notes`/`delete`). Fixed
 * the way `DaysService.getDay` (`days.service.ts:238-242`, the correct
 * precedent — NOT the raw pass-through this docstring previously,
 * incorrectly, cited it for) does it: `toRowId` runs INSIDE the gate, which
 * returns not-found on `null`, so every mutation's own `toRowId(id)!` below
 * can never disagree with the gate that authorized it — the non-null
 * assertion is dead-code-safe for real, not just by convention.
 */
@Injectable()
export class AssignmentsService {
  constructor(
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is gone:
    // this injects TripsRepository directly and calls findAccessible.
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    private readonly permissions: PermissionsService,
    private readonly realtime: RealtimeService,
    private readonly queryHelpers: QueryHelpersService,
    private readonly journey: JourneyDomainService,
    private readonly uow: UnitOfWork,
    @InjectRepository(DayAssignments) private readonly dayAssignmentsRepo: DayAssignmentsRepository,
    @InjectRepository(AssignmentParticipants) private readonly assignmentParticipantsRepo: AssignmentParticipantsRepository,
    @InjectRepository(Days) private readonly daysRepo: DaysRepository,
    @InjectRepository(Places) private readonly placesRepo: PlacesRepository,
    @InjectRepository(TripMembers) private readonly tripMembersRepo: TripMembersRepository,
    @InjectRepository(RoadtripVias) private readonly roadtripViasRepo: RoadtripViasRepository,
  ) {}

  async verifyTripAccess(tripId: string | number, userId: number) {
    return await this.trips.findAccessible(Number(tripId), userId);
  }

  async canEdit(trip: Trip, user: User): Promise<boolean> {
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
  async reconcile(tripId: string | number, socketId?: string): Promise<void> {
    try {
      await this.journey.reconcileTripSkeletons(Number(tripId), socketId);
    } catch { /* non-fatal */ }
  }

  /**
   * One stop, shaped the way every assignment event and REST answer carries it.
   * Public because the accommodation mirror moves a stop in place and has to hand
   * the moved row back in exactly this shape.
   */
  async getAssignmentWithPlace(assignmentId: number | bigint) {
    // AS1 — `DayAssignmentsRepository.findWithPlaceAndCategory`, Task 2's
    // projection, consumed unchanged.
    const a = await this.dayAssignmentsRepo.findWithPlaceAndCategory(Number(assignmentId));

    if (!a) return null;

    // Same compact tag projection as listDayAssignments, so an assignment has
    // one wire shape regardless of which read path produced it.
    const tags = (await this.queryHelpers.loadTagsByPlaceIds([a.place_id], { compact: true }))[a.place_id] || [];

    // AS2 — `AssignmentParticipantsRepository.listWithDisplayName`
    // (COALESCE(display_name, username), unlike QH3's raw username).
    const participants = await this.assignmentParticipantsRepo.listWithDisplayName(a.id);

    // The same shaper the list path uses. It was spelled out here as a third hand-kept
    // copy of the place shape, and the copy silently dropped `stop_type`: the optimistic
    // row the client had drawn as a fuel stop was replaced, a beat later, by this answer
    // without it — so a petrol station turned into an ordinary numbered place while you
    // watched.
    //
    // `formatAssignmentWithPlace` is typed on `AssignmentWithPlaceRow` directly
    // (Plan 3c Task 2 review, "For Task 3" §6.3) — no cast needed here.
    return formatAssignmentWithPlace(a, tags, participants);
  }

  async listDayAssignments(dayId: string | number) {
    // AS3 — `DayAssignmentsRepository.listForDay`, Task 2's projection (the
    // same statement text DY1 uses), consumed unchanged. `toRowId`, not a
    // bare `Number()` (Task 2 review point 7): the repository takes a real
    // number and the sole caller (`DayAssignmentsController.list`) already
    // gates on `dayExists` in the same request.
    const assignments = await this.dayAssignmentsRepo.listForDay(toRowId(dayId)!);

    const placeIds = [...new Set(assignments.map(a => a.place_id))];
    const tagsByPlaceId = await this.queryHelpers.loadTagsByPlaceIds(placeIds, { compact: true });

    const assignmentIds = assignments.map(a => a.id);
    // QH3 (`QueryHelpersService.loadParticipantsByAssignmentIds`) — deliberately
    // WITHOUT the COALESCE `getAssignmentWithPlace`/`getParticipants` apply
    // (inventory §18.10); unchanged from before this conversion.
    const participantsByAssignment = await this.queryHelpers.loadParticipantsByAssignmentIds(assignmentIds);

    return assignments.map(a => {
      return formatAssignmentWithPlace(a, tagsByPlaceId[a.place_id] || [], participantsByAssignment[a.id] || []);
    });
  }

  /**
   * AS4 — `DaysRepository.existsInTrip`, `dayId` `toRowId`'d INSIDE this
   * gate (Task 3 review H1 fix, absorbed in Task 4): `createAssignment`
   * (the only write behind this gate) converts `dayId` with its own
   * `toRowId(dayId)!` — a non-canonical id (`"3 "`, `"3.0"`) must answer
   * "not found" HERE, not pass `DaysRepository.existsInTrip`'s own raw-bind
   * affinity match and then hit `toRowId(dayId)!` downstream returning
   * `null` (the live regression: a `day_id: null` INSERT, 500).
   *
   * **`tripId` is `toRowId`'d here too (Task 4 review H1, the trip-id half,
   * fixed in the same fix round).** This docstring previously claimed
   * `Number(tripId)` was "the correct, unchanged shape", citing
   * `DaysService.getDay` as a precedent that "keeps its `tripId`
   * unconverted too" — both halves of that claim were wrong: the legacy
   * raw-SQL base (`94c6efbbc`) bound `tripId` RAW here (it was never
   * `Number(tripId)` to begin with, so nothing was "unchanged"), and
   * `DaysService.getDay` keeps the raw string, it does not convert it
   * either — there was no precedent for `Number()` at all. `Number('0xb')`
   * is `11`, a real trip's row id, so a hex trip id passed this gate
   * against a REAL trip while `createAssignment`'s place lookup and the
   * actual INSERT ran scoped to the trip in the route string — live:
   * `POST /api/trips/0xb/days/:d/assignments` was the legacy's 404 "Day not
   * found" and is now fixed back to that 404, not the 201 the `Number()`
   * gate produced. `toRowId` rejects the same non-canonical trip-id
   * spellings the place/day/assignment ids already reject, so a hex trip id
   * answers "not found" here instead of reaching a real trip's row.
   */
  async dayExists(dayId: string | number, tripId: string | number) {
    const id = toRowId(dayId);
    if (id === null) return false;
    const tid = toRowId(tripId);
    if (tid === null) return false;
    return await this.daysRepo.existsInTrip(id, tid);
  }

  /**
   * AS5 — `PlacesRepository.existsInTrip`, same H1 fix and reasoning as
   * `dayExists` above: `createAssignment`'s own `toRowId(placeId)!` must
   * never disagree with this gate. `PlacesRepository.existsInTrip` itself
   * narrowed its `id` parameter to `number` for this exact reason
   * (`Places.repository.ts`'s own docstring) — Plan 3c Task 1 originally
   * landed the method, Task 4 repointed this call site and applied the H1
   * fix in the same change. `tripId` is `toRowId`'d here too, for the same
   * trip-id-half-of-H1 reason `dayExists` above now documents.
   */
  async placeExists(placeId: unknown, tripId: string | number) {
    const id = toRowId(placeId);
    if (id === null) return false;
    const tid = toRowId(tripId);
    if (tid === null) return false;
    return await this.placesRepo.existsInTrip(id, tid);
  }

  /**
   * @param opts.accommodationId The lodging booking this stop belongs to, when a
   * booking is what put it there. Written by the INSERT rather than stamped on
   * afterwards: the row this returns is what the answer hands the client, and a
   * stop that reaches it without its booking id is one the day list cannot tell
   * from a place the traveller added, so it draws the hotel a second time.
   */
  async createAssignment(dayId: string | number, placeId: unknown, notes?: string | null, opts: { accommodationId?: number; orderIndex?: number } = {}) {
    // Downstream of the caller's own dayExists/placeExists gate in the same
    // request (every real call site), so the non-null assertion is
    // dead-code-safe — the class docstring's affinity-seam note.
    const dayIdNum = toRowId(dayId)!;
    const placeIdNum = toRowId(placeId)!;

    const insertedId = await this.uow.transactional(async () => {
      // AS6 — the explicit null check (not `||`) is load-bearing: a stored 0
      // order_index must survive, which `maxOrder || -1` would not.
      const maxOrder = await this.dayAssignmentsRepo.maxOrderIndex(dayIdNum);
      const end = (maxOrder !== null ? maxOrder : -1) + 1;
      // Somewhere in the middle when the caller says so, which means everything from
      // there on moves down. The end is still the default and still what every caller
      // but one asks for.
      const orderIndex = opts.orderIndex !== undefined ? Math.max(0, Math.min(opts.orderIndex, end)) : end;
      if (orderIndex < end) {
        await this.dayAssignmentsRepo.shiftOrderFrom(dayIdNum, orderIndex); // AS7
      }

      return await this.dayAssignmentsRepo.insertAssignment({ // AS8
        day_id: dayIdNum,
        place_id: placeIdNum,
        order_index: orderIndex,
        notes: notes || null,
        accommodation_id: opts.accommodationId ?? null,
      });
    });

    return await this.getAssignmentWithPlace(insertedId);
  }

  /**
   * AS9 — `DayAssignmentsRepository.existsInDay`, `id` `toRowId`'d INSIDE
   * this gate (Task 3 review H1 fix, absorbed in Task 4): `deleteAssignment`
   * (the only write behind this gate, `AssignmentsController.remove`) converts
   * `id` with its own `toRowId(id)!` — this must reject exactly what that
   * rejects. `dayId`/`tripId` keep the legacy's own raw-bind scoping
   * (`DayAssignmentsRepository.existsInDay`'s own `number | string`
   * parameters, unchanged): `deleteAssignment` never reads either back, so
   * there is no gate-vs-write id to disagree on for them.
   */
  async assignmentExistsInDay(id: string | number, dayId: string | number, tripId: string | number) {
    const rowId = toRowId(id);
    if (rowId === null) return false;
    return await this.dayAssignmentsRepo.existsInDay(rowId, dayId, tripId);
  }

  /** AS10 — `DayAssignmentsRepository.deleteById`. */
  async deleteAssignment(id: string | number): Promise<void> {
    await this.dayAssignmentsRepo.deleteById(toRowId(id)!);
  }

  /**
   * Empties a day: every place comes off it in one transaction, while the day, its
   * notes and its bookings stay (#2470). Returns the removed ids so each can be
   * announced the way a single unassign is. Both callers gate on `dayExists` first,
   * which `toRowId`s inside the gate, so the non-null assertion below is safe.
   */
  async clearDay(dayId: string | number): Promise<number[]> {
    const dayIdNum = toRowId(dayId)!;
    return await this.uow.transactional(async () => {
      const ids = await this.dayAssignmentsRepo.listIdsToClear(dayIdNum); // AS32
      await this.dayAssignmentsRepo.deleteForDay(dayIdNum); // AS33
      return ids;
    });
  }

  /**
   * AS11 — `DayAssignmentsRepository.setOrderIndex`, day-scoped, one row per
   * id, sequentially and in the legacy's own order (not `Promise.all` — the
   * program's transaction-ordering rule).
   */
  async reorderAssignments(dayId: string | number, orderedIds: number[]): Promise<void> {
    const dayIdNum = toRowId(dayId)!;
    await this.uow.transactional(async () => {
      for (const [index, id] of orderedIds.entries()) {
        await this.dayAssignmentsRepo.setOrderIndex(id, dayIdNum, index);
      }
    });
  }

  /**
   * AS12 — `DayAssignmentsRepository.findInTrip`, `id` `toRowId`'d INSIDE
   * this gate (Task 3 review H1 fix, absorbed in Task 4): every mutation
   * behind this gate (`updateTime`, `setEndDay`, `updateNotes`,
   * `setLegTransportMode`, `setIncomingLegTransportMode`, `setParticipants`,
   * and `ItineraryRpc.unassign` via `moveAssignment`) converts `id` with its
   * own `toRowId(id)!` — this must reject exactly what those reject, the
   * same shape `assignmentExistsInDay` above uses for `deleteAssignment`.
   * `tripId` keeps the legacy's own raw-bind scoping, unchanged.
   */
  async getAssignmentForTrip(id: string | number, tripId: string | number) {
    const rowId = toRowId(id);
    if (rowId === null) return undefined;
    return await this.dayAssignmentsRepo.findInTrip(rowId, tripId);
  }

  async moveAssignment(id: string | number, newDayId: unknown, orderIndex: number | null | undefined) {
    const idNum = toRowId(id)!;
    // The source day comes from the row, not the caller — callers can't lie
    // about (or race on) where the assignment was.
    const oldDayId = await this.uow.transactional(async () => {
      const dayId = await this.dayAssignmentsRepo.getDayId(idNum); // AS13
      await this.dayAssignmentsRepo.moveToDay(idNum, toRowId(newDayId)!, orderIndex ?? 0); // AS14
      return dayId;
    });
    const updated = await this.getAssignmentWithPlace(idNum);
    return { assignment: updated, oldDayId };
  }

  /** AS15 — `AssignmentParticipantsRepository.listWithDisplayName`, the same AS2/AS31 statement. */
  async getParticipants(assignmentId: string | number) {
    return await this.assignmentParticipantsRepo.listWithDisplayName(toRowId(assignmentId)!);
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
  async updateTime(id: string | number, placeTime: unknown, endTime: unknown): Promise<AssignmentTimeUpdate> {
    const idNum = toRowId(id)!;
    const sorted = await this.uow.transactional(async () => {
      // AS16 — the three-way COALESCE, via Kysely (no ORM relation to
      // `day_accommodations` — see `DayAssignmentsRepository`'s docstring).
      const stored = await this.dayAssignmentsRepo.effectiveStart(idNum);

      // Falsy times (null, undefined, '') all clear the override — an empty
      // string is a clear, not a stored value. AS17.
      await this.dayAssignmentsRepo.setTimes(idNum, (placeTime as string | null | undefined) || null, (endTime as string | null | undefined) || null);

      // Only a start that moved sorts. An end is a label. A start sent again as it
      // stood (the place form saving an End, the stay dialog taking one off, an MCP
      // call that names only the end) leaves the day the way the traveller left it,
      // which can be out of time order on purpose. Compared the way the sort reads
      // it, so a visit given the time its place already had moves nothing either. A
      // cleared start leaves the day alone too.
      if (!placeTime || !stored) return null;
      if (sortMinutes(String(placeTime)) === sortMinutes(stored.start)) return null;
      return await this.sortDayByTime(stored.day_id);
    });

    // AS23 — `RoadtripViasRepository.listForDay`, the one copy of this projection
    // (RT2/AC16); the "deliberate duplicate" the legacy docstring warned against
    // dedupe-ing is gone now that a repository is the one place to inject it from.
    const vias = sorted?.viasMoved ? { dayId: sorted.dayId, vias: await this.roadtripViasRepo.listForDay(sorted.dayId) } : null;

    return {
      assignment: await this.getAssignmentWithPlace(idNum),
      reordered: sorted ? { dayId: sorted.dayId, orderedIds: sorted.orderedIds } : null,
      vias,
    };
  }

  /**
   * Puts one day in time order. Writes nothing when it already is, which is the usual
   * case: most starts are typed in the order the day is planned.
   */
  private async sortDayByTime(dayId: number): Promise<{ dayId: number; orderedIds: number[]; viasMoved: boolean } | null> {
    // A booked night's hour lives on the booking, not on the stop: nobody types a
    // time into a hotel row, they type a check-in. Left out of this, the night
    // counted as untimed and stayed wherever it had been dropped, so pinning an
    // afternoon stop sorted that one and left the hotel sitting in front of or
    // behind it by accident.
    //
    // AS18 — `DayAssignmentsRepository.listForTimeSort`, via Kysely.
    const rows = await this.dayAssignmentsRepo.listForTimeSort(dayId);

    const sorted = chronoOrder(rows, row => sortMinutes(row.effective_time));
    if (sorted.every((row, i) => row === rows[i])) return null;

    // Numbered from 0, the way a drag stores a day (`reorderAssignments`). The order
    // goes out as a list of ids and every client numbers it by position, so keys kept
    // with their gaps would put the day notes and bookings that sort between stops in
    // one place for the writer, who reads the day back, and in another for everyone
    // else. Only a stop whose key changes is written. AS19 — no day scoping,
    // unlike AS11's `reorderAssignments` (`setOrderIndex`'s `day_id` left
    // `undefined`), sequentially and in the legacy's own order.
    for (const [i, row] of sorted.entries()) {
      if (row.order_index !== i) await this.dayAssignmentsRepo.setOrderIndex(row.id, undefined, i);
    }

    return { dayId, orderedIds: sorted.map(row => row.id), viasMoved: await this.reanchorVias(dayId, rows, sorted) };
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
  private async reanchorVias(dayId: number, before: DayStopRow[], after: DayStopRow[]): Promise<boolean> {
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
    // AS20 — `RoadtripViasRepository.listForReanchor`.
    const vias = await this.roadtripViasRepo.listForReanchor(dayId);
    const plan = reanchorByStopOrder(vias, previousIds, nextIds);
    for (const viaId of plan.remove) {
      // AS21 — `RoadtripViasRepository.deleteInDay` (= RT19).
      await this.roadtripViasRepo.deleteInDay(viaId, dayId);
    }
    for (const via of plan.vias) {
      // AS22 — `RoadtripViasRepository.setAnchor` (= RT20).
      await this.roadtripViasRepo.setAnchor(via.id, dayId, via.after_order_index);
    }
    return !isEmptyReanchoring(plan);
  }

  /** AS24 — `DayAssignmentsRepository.setEndDay`. */
  async setEndDay(id: string | number, endDay: boolean) {
    const idNum = toRowId(id)!;
    await this.dayAssignmentsRepo.setEndDay(idNum, endDay ? 1 : 0);
    return await this.getAssignmentWithPlace(idNum);
  }

  /**
   * Edit the per-assignment note after creation (#2163) — until now the note
   * was write-once via the create paths (REST body, MCP tools, plugin RPC) and
   * invisible in the app. Falsy notes ('' or null) clear the column, the same
   * `notes || null` normalisation createAssignment applies. No auto-sort and no
   * journey reconcile: the note affects neither the day order nor the skeleton
   * mirror (same as the transport-mode writes). AS25.
   */
  async updateNotes(id: string | number, notes: string | null | undefined) {
    const idNum = toRowId(id)!;
    await this.dayAssignmentsRepo.setNotes(idNum, notes || null);
    return await this.getAssignmentWithPlace(idNum);
  }

  /**
   * Set the travel mode of the leg leaving this stop (#1281). null clears the
   * override so the leg falls back to the day's default_transport_mode. This is
   * sticky by design: changing the whole-day default never touches a leg that
   * carries its own explicit mode. AS26.
   */
  async setLegTransportMode(id: string | number, mode: string | null) {
    const idNum = toRowId(id)!;
    await this.dayAssignmentsRepo.setLegMode(idNum, mode ?? null);
    return await this.getAssignmentWithPlace(idNum);
  }

  /**
   * Set the travel mode of the leg arriving at this stop (#1281 boundary legs).
   * Mirrors setLegTransportMode but targets incoming_leg_transport_mode; inert
   * when the previous timeline element is a place (the column is only read for
   * non-place origins like a booking arrival or a morning hotel departure). AS27.
   */
  async setIncomingLegTransportMode(id: string | number, mode: string | null) {
    const idNum = toRowId(id)!;
    await this.dayAssignmentsRepo.setIncomingLegMode(idNum, mode ?? null);
    return await this.getAssignmentWithPlace(idNum);
  }

  /**
   * Keep a stop on the day but out of its route (#2532): it stays in the list and on
   * the map, and the route runs from the stop before it straight to the one after.
   */
  async setRouteExcluded(id: string | number, excluded: boolean) {
    const idNum = toRowId(id)!;
    await this.dayAssignmentsRepo.setRouteExcluded(idNum, excluded ? 1 : 0); // AS34
    return await this.getAssignmentWithPlace(idNum);
  }

  /**
   * Both callers have already proven the assignment sits on `tripId`; this
   * settles the other half, that the ids in the body do too. Off-roster ids drop
   * silently rather than 400, matching bag members and reservation travellers —
   * the participants box sends the whole list back on every edit, so rejecting
   * the request would strand a trip whose membership changed underneath it.
   */
  async setParticipants(assignmentId: string | number, userIds: number[], tripId: string | number) {
    const idNum = toRowId(assignmentId)!;
    // AS28 — `TripMembersRepository.rosterUserIds`; off-roster ids drop silently.
    const roster = await this.tripMembersRepo.rosterUserIds(tripId);
    const scoped = userIds.filter(id => roster.has(id));
    await this.uow.transactional(async () => {
      await this.assignmentParticipantsRepo.deleteForAssignment(idNum); // AS29
      if (scoped.length > 0) {
        await this.assignmentParticipantsRepo.insertIgnore(idNum, scoped); // AS30 — `upsertMany`/`onConflictAction: 'ignore'`
      }
    });

    // AS31
    return await this.assignmentParticipantsRepo.listWithDisplayName(idNum);
  }
}
