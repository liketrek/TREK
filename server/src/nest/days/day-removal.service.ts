import { Injectable } from '@nestjs/common';
import type { RoadtripDayBoundary } from '@trek/shared';
import { DatabaseService } from '../database/database.service';
import { AccommodationsService, type AccommodationMirror, type MirrorSender } from '../accommodations/accommodations.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { DaysService } from './days.service';

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

type DayRow = { id: number; day_number: number; date: string | null };

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
 */
@Injectable()
export class DayRemovalService {
  constructor(
    private readonly db: DatabaseService,
    private readonly days: DaysService,
    private readonly accommodations: AccommodationsService,
    private readonly assignments: AssignmentsService,
  ) {}

  /**
   * Delete the day in one transaction. Nothing is written when it throws, and it
   * throws a DayDeleteError for the last day of a trip. The journey catches up
   * afterwards, outside the transaction, and a failure there does not undo the delete.
   */
  remove(tripId: string | number, dayId: string | number, viewer: { userId: number; socketId?: string }): DayRemoval {
    const trip = Number(tripId);
    const id = Number(dayId);

    const removal = this.db.transaction(() => {
      const rows = this.db.all<DayRow>('SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number', trip);
      const target = rows.find(r => r.id === id);
      if (!target) throw new DayDeleteError('Day not found');
      if (rows.length <= 1) throw new DayDeleteError(LAST_DAY_MESSAGE);

      const cancelled = this.cancelStays(trip, id);
      const boundariesBefore = this.boundaries(trip);

      // The boundary drawn on this day goes with it; the day row takes its
      // assignments, notes, stops, roads and booking positions along by cascade.
      this.db.run('DELETE FROM roadtrip_day_boundaries WHERE trip_id = ? AND day_number = ?', trip, target.day_number);
      this.db.run('DELETE FROM days WHERE id = ?', id);

      const remaining = rows.filter(r => r.id !== id);
      this.shiftBoundaries(trip, rows, remaining);
      const endDate = this.renumber(trip, rows, remaining);

      const boundariesAfter = this.boundaries(trip);
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
    this.assignments.reconcile(trip, viewer.socketId);
    return { ...removal, trip: this.days.getTripForViewer(trip, viewer.userId) };
  }

  /**
   * The one place a removal is fanned out. The collaborators drop the day first
   * and then renumber off day:reordered, which also makes them pull the re-dated
   * days and re-stamped bookings. The cancelled stays follow with what they did to
   * the other days, then the rows they took with them.
   */
  announce(tripId: string | number, removal: DayRemoval, senders: DayRemovalSenders): void {
    const { all, others, socketId } = senders;
    others('day:deleted', { dayId: removal.dayId });
    others('day:reordered', { orderedIds: removal.orderedIds });
    for (const mirror of removal.mirrors) this.accommodations.announceMirror(tripId, mirror, all, socketId);
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
  private cancelStays(tripId: number, dayId: number) {
    const stays = this.db.all<{ id: number }>(
      'SELECT id FROM day_accommodations WHERE trip_id = ? AND (start_day_id = ? OR end_day_id = ?) ORDER BY id',
      tripId, dayId, dayId,
    );
    const cancelled = { stayIds: [] as number[], reservationIds: [] as number[], budgetItemIds: [] as number[], mirrors: [] as AccommodationMirror[] };
    for (const stay of stays) {
      const gone = this.accommodations.deleteAccommodation(stay.id);
      cancelled.stayIds.push(stay.id);
      cancelled.reservationIds.push(...gone.linkedReservationIds);
      cancelled.budgetItemIds.push(...gone.deletedBudgetItemIds);
      cancelled.mirrors.push(withoutDay(gone.mirror, dayId));
    }
    return cancelled;
  }

  private boundaries(tripId: number): RoadtripDayBoundary[] {
    return this.db.all<RoadtripDayBoundary>(
      'SELECT day_number, from_assignment_id, to_assignment_id, fraction FROM roadtrip_day_boundaries WHERE trip_id = ? ORDER BY day_number',
      tripId,
    );
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
  private shiftBoundaries(tripId: number, rows: DayRow[], remaining: DayRow[]): void {
    const position = new Map(remaining.map((r, i) => [r.day_number, i + 1]));
    const lastNumber = rows[rows.length - 1].day_number;
    const pastEnd = lastNumber - remaining.length;
    const boundaries = this.db.all<{ day_number: number }>(
      'SELECT day_number FROM roadtrip_day_boundaries WHERE trip_id = ? ORDER BY day_number',
      tripId,
    );
    const drop = this.db.prepare('DELETE FROM roadtrip_day_boundaries WHERE trip_id = ? AND day_number = ?');
    const move = this.db.prepare('UPDATE roadtrip_day_boundaries SET day_number = ? WHERE trip_id = ? AND day_number = ?');
    for (const { day_number: from } of boundaries) {
      const to = position.get(from) ?? (from > lastNumber ? from - pastEnd : null);
      if (to === null) drop.run(tripId, from);
      else if (to !== from) move.run(to, tripId, from);
    }
  }

  /**
   * Close the gap and keep the dates on their positions: position i takes the
   * i-th date of the trip as it was, the deleted day's date included. Bookings on
   * a day that changed date are re-stamped onto it. When there are fewer days left
   * than dates, the last date is gone, and a dated trip ends on the new last one.
   * Returns that new end date, or null when the range stayed.
   */
  private renumber(tripId: number, rows: DayRow[], remaining: DayRow[]): string | null {
    // ISO dates sort as plain strings.
    const sortedDates = rows.map(r => r.date).filter((d): d is string => !!d).sort((a, b) => a.localeCompare(b));
    const setNumber = this.db.prepare('UPDATE days SET day_number = ? WHERE id = ?');
    const setNumberAndDate = this.db.prepare('UPDATE days SET day_number = ?, date = ? WHERE id = ?');

    // Two phases, to get past UNIQUE(trip_id, day_number) on the way.
    remaining.forEach((r, i) => setNumber.run(-(i + 1), r.id));
    const oldDateById = new Map(remaining.map(r => [r.id, r.date]));
    const newDateById = new Map<number, string | null>();
    remaining.forEach((r, i) => {
      const date = sortedDates[i] ?? null;
      setNumberAndDate.run(i + 1, date, r.id);
      newDateById.set(r.id, date);
    });
    if (sortedDates.length > 0) this.days.restampReservationDates(tripId, oldDateById, newDateById);

    if (remaining.length >= sortedDates.length) return null;
    const range = this.db.get<{ start_date: string | null; end_date: string | null }>(
      'SELECT start_date, end_date FROM trips WHERE id = ?', tripId,
    );
    if (!range?.start_date || !range.end_date) return null;
    const endDate = sortedDates[remaining.length - 1];
    this.db.run('UPDATE trips SET end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', endDate, tripId);
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
