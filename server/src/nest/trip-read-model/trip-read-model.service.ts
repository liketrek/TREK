import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { AccommodationsService } from '../accommodations/accommodations.service';
import { BudgetService } from '../budget/budget.service';
import { CollabService } from '../collab/collab.service';
import { DaysService } from '../days/days.service';
import { FilesService } from '../files/files.service';
import { PackingService } from '../packing/packing.service';
import { PlacesService } from '../places/places.service';
import { ReservationsService } from '../reservations/reservations.service';
import { TodoService } from '../todo/todo.service';
import { TripMembersService } from '../trip-members/trip-members.service';
import { withoutFeedToken } from '../trips/trips.service';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { TRIP_OVERVIEW_DAY_LIMIT, type TripOverviewOutput } from '@trek/shared';

/**
 * The two read aggregates over a trip: the MCP summary and the offline bundle.
 *
 * They were the reason TripsService injected nine other domain services while
 * its write path needs a handful. Reading is the fan-out; the writing core is
 * not. Split apart, the aggregate root talks to database, permissions, realtime
 * and the four domains its own updates touch, and everything that only ever
 * appeared inside a summary lives here.
 */
/** The days an overview lists: from the first one dated today or later, else from the first, a week of them. */
export function nextDays<T extends { date?: string | null }>(days: T[], today: string): T[] {
  const upcoming = days.findIndex((day) => !!day.date && day.date >= today);
  const from = upcoming === -1 ? 0 : upcoming;
  return days.slice(from, from + TRIP_OVERVIEW_DAY_LIMIT);
}

@Injectable()
export class TripReadModelService {
  constructor(
    @InjectRepository(Trips) private readonly tripsRepo: TripsRepository,
    private readonly members: TripMembersService,
    private readonly days: DaysService,
    private readonly accommodations: AccommodationsService,
    private readonly budget: BudgetService,
    private readonly packing: PackingService,
    private readonly reservations: ReservationsService,
    private readonly collab: CollabService,
    private readonly places: PlacesService,
    private readonly todo: TodoService,
    private readonly files: FilesService,
  ) {}

  // ── Trip summary (used by MCP get_trip_summary tool) ──────────────────────

  async getTripSummary(tripId: number, viewerUserId?: number) {
    const trip = withoutFeedToken(await this.tripsRepo.findRaw(tripId));
    if (!trip) return null;

    const ownerId = await this.tripsRepo.getOwnerId(tripId);
    if (ownerId === null) return null;
    const { owner, members } = await this.members.listMembers(tripId, ownerId);

    const { days: rawDays } = await this.days.list(tripId);
    const days = rawDays.map(({ notes_items, ...day }) => ({ ...day, notes: notes_items }));

    const accommodations = await this.accommodations.list(tripId);

    const budgetItems = await this.budget.listBudgetItems(tripId);
    // In the trip currency, each row at the rate it was booked at (#2525). A raw sum of
    // total_price added a dollar bill to the euros and called the result euros.
    const tripCurrency = String(trip.currency || 'EUR');
    const totals = await this.budget.tripTotals(
      tripId,
      tripCurrency,
      await this.budget.ratesForTripTotals(tripId, tripCurrency),
    );
    const budget = {
      items: budgetItems,
      item_count: budgetItems.length,
      total: totals.total,
      by_category: totals.byCategory,
      currency: trip.currency,
      // Rows in a foreign currency with no rate to convert them: in no total above.
      unconverted_item_ids: totals.unconverted,
    };

    // Thread the viewer so another member's private/personal packing items (#858)
    // stay hidden — without it listItems returns the UNFILTERED list.
    const packingItems = await this.packing.listItems(tripId, viewerUserId);
    const packing = {
      items: packingItems,
      total: packingItems.length,
      checked: (packingItems as { checked: number }[]).filter((i) => i.checked).length,
    };

    const reservations = await this.reservations.list(tripId);
    const collab_notes = await this.collab.listNotes(tripId);

    return {
      trip,
      members: { owner, collaborators: members },
      days,
      accommodations,
      budget,
      packing,
      reservations,
      collab_notes,
    };
  }

  // ── Trip overview (MCP get_trip_overview and its view) ────────────────────

  /**
   * A trip in a few lines: the trip, how much it holds, and its next days with
   * their stop counts. The next days start at today while the trip is under way
   * or ahead, at its first day otherwise. Null when the trip is gone.
   */
  async getTripOverview(tripId: number): Promise<TripOverviewOutput | null> {
    const trip = await this.tripsRepo.findRaw(tripId);
    if (!trip) return null;
    const [roster, { days }, places, reservations] = await Promise.all([
      this.members.listMembers(tripId, trip.user_id),
      this.days.list(tripId),
      this.places.list(String(tripId), {}),
      this.reservations.list(tripId),
    ]);
    return {
      trip: {
        id: trip.id,
        title: trip.title,
        description: trip.description ?? null,
        start_date: trip.start_date,
        end_date: trip.end_date,
        currency: String(trip.currency || 'EUR'),
        is_archived: trip.is_archived ? 1 : 0,
      },
      counts: {
        days: days.length,
        places: places.length,
        reservations: reservations.length,
        members: [roster.owner, ...roster.members].length,
      },
      // An MCP session carries no time zone, so "today" is the UTC date: a day early or late
      // for a reader far from UTC around midnight, which only shifts where the week starts.
      days: nextDays(days, new Date().toISOString().slice(0, 10)).map((day) => ({
        id: day.id,
        day_number: day.day_number,
        date: day.date,
        title: day.title ?? null,
        stops: day.assignments.length,
      })),
    };
  }

  // ── Bundle / notifications (route helpers) ────────────────────────────────

  /** Aggregates every trip sub-collection for offline caching (legacy /:id/bundle). */
  async bundle(tripId: string, trip: { user_id: number }, viewerId: number) {
    const { days } = await this.days.list(tripId);
    const { owner, members } = await this.members.listMembers(tripId, trip.user_id);
    return {
      trip,
      days,
      places: await this.places.list(String(tripId), {}),
      // Scope to the requesting member so other members' private packing items
      // (#858) never land in this viewer's offline cache.
      packingItems: await this.packing.listItems(tripId, viewerId),
      todoItems: await this.todo.listItems(tripId),
      budgetItems: await this.budget.listBudgetItems(tripId),
      reservations: await this.reservations.list(tripId),
      files: await this.files.listFiles(tripId, false),
      accommodations: await this.accommodations.list(tripId),
      members: [owner, ...(members || [])].filter(Boolean),
    };
  }
}
