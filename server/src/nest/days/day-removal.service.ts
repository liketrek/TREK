import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import type { RoadtripDayBoundary } from '@trek/shared';
import { UnitOfWork } from '../database/unit-of-work';
import { AccommodationsService, type AccommodationMirror, type MirrorSender } from '../accommodations/accommodations.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { DaysService } from './days.service';
import { toRowId } from '../common/row-id';
import { Days } from '../../db/entities/Days.entity';
import type { DaysRepository, DayOrderRow } from '../../db/repositories/Days.repository';
import { DayAccommodations } from '../../db/entities/DayAccommodations.entity';
import type { DayAccommodationsRepository } from '../../db/repositories/DayAccommodations.repository';
import { RoadtripDayBoundaries } from '../../db/entities/RoadtripDayBoundaries.entity';
import type { RoadtripDayBoundariesRepository } from '../../db/repositories/RoadtripDayBoundaries.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';

/** A day that has to stay where it is; REST answers 400, MCP a tool error, a plugin BadParams. */
export class DayDeleteError extends Error {}

/** The refusal every surface gives for the last day of a trip, word for word. */
export const LAST_DAY_MESSAGE = 'A trip needs at least one day.';

/** What deleting one day did to the trip, for the surface that announces it. */
export interface DayRemoval {
  dayId: number;
  /** The days that are left, in their new order. Their day_number is their position now. */
  orderedIds: number[];
  /** Stays that checked in or out on the day. They are cancelled with it. */
  stayIds: number[];
  /** The bookings those stays brought, deleted with them. */
  reservationIds: number[];
  /** The expenses written against those bookings. */
  budgetItemIds: number[];
  /** What cancelling each stay did to the day plan of the days that are left. */
  mirrors: AccommodationMirror[];
  /** The road trip day boundaries after they moved up with their days, or null when none changed. */
  boundaries: RoadtripDayBoundary[] | null;
  /** The trip's new last date when the day took it along, or null when the range stayed. */
  endDate: string | null;
  /** The trip re-read in list shape: its day count changed, and maybe its end date. */
  trip: unknown;
}

/**
 * How a surface sends a removal. `all` reaches every socket of the trip, the one
 * that asked included; `others` leaves that one out because its own answer
 * already carries the change. The MCP tools and the plugin RPC have no socket
 * of their own, so they hand the same sender twice.
 */
export interface DayRemovalSenders {
  all: MirrorSender;
  others: MirrorSender;
  socketId?: string;
}

/**
 * Deleting a day, for the three surfaces that offer it (REST, MCP, plugin RPC).
 *
 * The delete used to be a bare DELETE: the day numbers kept a hole, the dates
 * stayed where they were, a stay checking in or out on the day vanished by
 * cascade while its booking and that booking's expense stayed behind pointing
 * nowhere, and the journey was never told. It is the exact reverse of an insert
 * now. The later days move up one place, and on a dated trip the dates stay
 * pinned to their positions the way a reorder keeps them: every later day, with
 * its bookings, takes the date one slot earlier. A day without a date takes the
 * last date if the trip has one; otherwise the last date goes, and the trip ends
 * one day earlier, which is what insert does the other way round.
 *
 * Its own class rather than a method on DaysService because it needs the
 * accommodations and assignments services, and DaysService is built by hand in
 * enough suites that a wider constructor there would ripple through all of them.
 *
 * Statements: DY26 (the day order), DY13 (`DaysRepository.deleteById`), DY27/DY28
 * (the two-phase renumber), DY41 (the stays on the day), DY42 (the end date),
 * `TripsRepository.findDatesById` (the range) and RB1/RB4/RB6/RB7 (the road trip
 * day boundaries). Every write sits in one `uow.transactional`; the cancelled
 * stays nest theirs inside it.
 */
@Injectable()
export class DayRemovalService {
  constructor(
    private readonly days: DaysService,
    private readonly accommodations: AccommodationsService,
    private readonly assignments: AssignmentsService,
    private readonly uow: UnitOfWork,
    @InjectRepository(Days) private readonly daysRepo: DaysRepository,
    @InjectRepository(DayAccommodations) private readonly dayAccommodationsRepo: DayAccommodationsRepository,
    @InjectRepository(RoadtripDayBoundaries) private readonly boundariesRepo: RoadtripDayBoundariesRepository,
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
  ) {}

  /**
   * Delete the day in one transaction. Nothing is written when it throws, and it
   * throws a DayDeleteError for the last day of a trip. The journey catches up
   * afterwards, outside the transaction, and a failure there does not undo the delete.
   */
  async remove(tripId: string | number, dayId: string | number, viewer: { userId: number; socketId?: string }): Promise<DayRemoval> {
    // Every caller (REST, MCP, RPC) already proved the day via `getDay`, so neither id is a live 404 path here.
    const trip = toRowId(tripId)!;
    const id = toRowId(dayId)!;

    const removal = await this.uow.transactional(async () => {
      // DY26
      const rows: DayOrderRow[] = await this.daysRepo.listOrderedForReorder(trip);
      const target = rows.find(r => r.id === id);
      if (!target) throw new DayDeleteError('Day not found');
      if (rows.length <= 1) throw new DayDeleteError(LAST_DAY_MESSAGE);

      const cancelled = await this.cancelStays(trip, id);
      const boundariesBefore = await this.boundaries(trip);

      // The boundary drawn on this day goes with it; the day row takes its
      // assignments, notes, stops, roads and booking positions along by cascade.
      // RB4
      await this.boundariesRepo.deleteForDay(trip, target.day_number);
      // DY13
      await this.daysRepo.deleteById(id);

      const remaining = rows.filter(r => r.id !== id);
      await this.shiftBoundaries(trip, rows, remaining);
      const endDate = await this.renumber(trip, rows, remaining);

      const boundariesAfter = await this.boundaries(trip);
      const boundariesChanged = JSON.stringify(boundariesAfter) !== JSON.stringify(boundariesBefore);

      return {
        dayId: id,
        orderedIds: remaining.map(r => r.id),
        ...cancelled,
        boundaries: boundariesChanged ? boundariesAfter : null,
        endDate,
      };
    });

    // After the commit, the way an assignment route does it: the journey mirrors
    // the planned stops, and the day's stops are gone. reconcile() swallows its own
    // failures, so a journey problem cannot turn a finished delete into an error.
    await this.assignments.reconcile(trip, viewer.socketId);
    return { ...removal, trip: await this.days.getTripForViewer(trip, viewer.userId) };
  }

  /**
   * The one place a removal is fanned out. The collaborators drop the day first
   * and then renumber off day:reordered, which also makes them pull the re-dated
   * days and re-stamped bookings. The cancelled stays follow with what they did to
   * the other days, then the rows they took with them.
   */
  async announce(tripId: string | number, removal: DayRemoval, senders: DayRemovalSenders): Promise<void> {
    const { all, others, socketId } = senders;
    others('day:deleted', { dayId: removal.dayId });
    others('day:reordered', { orderedIds: removal.orderedIds });
    for (const mirror of removal.mirrors) await this.accommodations.announceMirror(tripId, mirror, all, socketId);
    // Without a socket id, as when a place takes its nights with it: the Bookings
    // list and the Costs total of the deleting tab hold these rows too.
    for (const reservationId of removal.reservationIds) all('reservation:deleted', { reservationId });
    for (const itemId of removal.budgetItemIds) all('budget:deleted', { itemId });
    for (const accommodationId of removal.stayIds) others('accommodation:deleted', { accommodationId });
    if (removal.boundaries) all('roadtripBoundary:changed', { boundaries: removal.boundaries });
    // The day count changed, and the end date when the last date went: the trip
    // header of every other open copy of the trip reads both.
    if (removal.trip) others('trip:updated', { trip: removal.trip });
  }

  /**
   * Cancel every stay that checks in or out on the day, the way deleting it by
   * hand does: the partner booking, its expense and the stop it wrote go too.
   * Left to the cascade, the stay row alone would go and the rest stay behind.
   * A stay that only runs across the day keeps standing.
   */
  private async cancelStays(tripId: number, dayId: number) {
    // DY41
    const stays = await this.dayAccommodationsRepo.listIdsCheckingInOrOutOn(tripId, dayId);
    const cancelled = { stayIds: [] as number[], reservationIds: [] as number[], budgetItemIds: [] as number[], mirrors: [] as AccommodationMirror[] };
    for (const stayId of stays) {
      const gone = await this.accommodations.deleteAccommodation(stayId);
      cancelled.stayIds.push(stayId);
      cancelled.reservationIds.push(...gone.linkedReservationIds);
      cancelled.budgetItemIds.push(...gone.deletedBudgetItemIds);
      cancelled.mirrors.push(withoutDay(gone.mirror, dayId));
    }
    return cancelled;
  }

  private async boundaries(tripId: number): Promise<RoadtripDayBoundary[]> {
    // RB1
    return await this.boundariesRepo.listForTrip(tripId);
  }

  /**
   * Boundaries are keyed by day number, not by day, so each one follows its day
   * to the position that day takes in the closed-up numbering. Not simply one
   * less: a trip can still carry a hole in its numbering from the old delete,
   * which the renumbering closes too, and a flat step of one would leave every
   * boundary behind the hole a day off. A boundary on a number no day holds
   * applies to no day: inside the list it has no slot left and goes, past the
   * last day it keeps its distance to the end, the way the flat step kept it.
   *
   * One at a time and in ascending order: the key is the primary key, and a
   * CHECK keeps it at 1 or above, so the negative two-step the days use is not
   * available here. Ascending is safe, since no number moves up and the order
   * between them stays.
   */
  private async shiftBoundaries(tripId: number, rows: DayOrderRow[], remaining: DayOrderRow[]): Promise<void> {
    const position = new Map(remaining.map((r, i) => [r.day_number, i + 1]));
    const lastNumber = rows[rows.length - 1].day_number;
    const pastEnd = lastNumber - remaining.length;
    // RB6
    const boundaries = await this.boundariesRepo.listDayNumbers(tripId);
    for (const from of boundaries) {
      const to = position.get(from) ?? (from > lastNumber ? from - pastEnd : null);
      // RB4
      if (to === null) await this.boundariesRepo.deleteForDay(tripId, from);
      // RB7
      else if (to !== from) await this.boundariesRepo.moveDayNumber(tripId, from, to);
    }
  }

  /**
   * Close the gap and keep the dates on their positions: position i takes the
   * i-th date of the trip as it was, the deleted day's date included. Bookings on
   * a day that changed date are re-stamped onto it. When there are fewer days left
   * than dates, the last date is gone, and a dated trip ends on the new last one.
   * Returns that new end date, or null when the range stayed.
   */
  private async renumber(tripId: number, rows: DayOrderRow[], remaining: DayOrderRow[]): Promise<string | null> {
    // ISO dates sort as plain strings.
    const sortedDates = rows.map(r => r.date).filter((d): d is string => !!d).sort((a, b) => a.localeCompare(b));

    // Two phases, to get past UNIQUE(trip_id, day_number) on the way.
    // DY27
    for (const [i, r] of remaining.entries()) await this.daysRepo.setDayNumber(r.id, -(i + 1));
    const oldDateById = new Map(remaining.map(r => [r.id, r.date]));
    const newDateById = new Map<number, string | null>();
    for (const [i, r] of remaining.entries()) {
      const date = sortedDates[i] ?? null;
      // DY28
      await this.daysRepo.setDayNumberAndDate(r.id, i + 1, date);
      newDateById.set(r.id, date);
    }
    if (sortedDates.length > 0) await this.days.restampReservationDates(tripId, oldDateById, newDateById);

    if (remaining.length >= sortedDates.length) return null;
    const range = await this.tripsRepo.findDatesById(tripId);
    if (!range?.start_date || !range.end_date) return null;
    const endDate = sortedDates[remaining.length - 1];
    // DY42
    await this.tripsRepo.setEndDateTouched(tripId, endDate);
    return endDate;
  }
}

/**
 * A cancelled stay's mirror without the deleted day. Its stop there went with the
 * day, and the collaborators drop the whole day on day:deleted, so announcing that
 * stop, the day's order or its roads on top would name a day nobody holds anymore.
 */
function withoutDay(mirror: AccommodationMirror, dayId: number): AccommodationMirror {
  return {
    ...mirror,
    removed: mirror.removed.filter(stop => stop.dayId !== dayId),
    ...(mirror.vias ? { vias: mirror.vias.filter(day => day.dayId !== dayId) } : {}),
  };
}
