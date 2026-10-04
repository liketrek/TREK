import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { DaysService } from '../days/days.service';
import { AccommodationsService } from '../accommodations/accommodations.service';
import { BudgetService } from '../budget/budget.service';
import { PackingService } from '../packing/packing.service';
import { ReservationsService } from '../reservations/reservations.service';
import { CollabService } from '../collab/collab.service';
import { PlacesService } from '../places/places.service';
import { TodoService } from '../todo/todo.service';
import { FilesService } from '../files/files.service';
import { TripMembersService } from '../trip-members/trip-members.service';
import { withoutFeedToken } from '../trips/trips.service';

/**
 * The two read aggregates over a trip: the MCP summary and the offline bundle.
 *
 * They were the reason TripsService injected nine other domain services while
 * its write path needs a handful. Reading is the fan-out; the writing core is
 * not. Split apart, the aggregate root talks to database, permissions, realtime
 * and the four domains its own updates touch, and everything that only ever
 * appeared inside a summary lives here.
 */
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
    const totals = await this.budget.tripTotals(tripId, tripCurrency, await this.budget.ratesForTripTotals(tripId, tripCurrency));
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
      checked: (packingItems as { checked: number }[]).filter(i => i.checked).length,
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
