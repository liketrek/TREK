import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
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
    private readonly dbs: DatabaseService,
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

  private get db() {
    return this.dbs.connection;
  }

  private getOwner(tripId: string | number): { user_id: number } | undefined {
    return this.db.prepare('SELECT user_id FROM trips WHERE id = ?').get(tripId) as { user_id: number } | undefined;
  }

  // ── Trip summary (used by MCP get_trip_summary tool) ──────────────────────

  getTripSummary(tripId: number, viewerUserId?: number) {
    const trip = this.db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId) as Record<string, unknown> | undefined;
    if (!trip) return null;

    const ownerRow = this.getOwner(tripId);
    if (!ownerRow) return null;
    const { owner, members } = this.members.listMembers(tripId, ownerRow.user_id);

    const { days: rawDays } = this.days.list(tripId);
    const days = rawDays.map(({ notes_items, ...day }) => ({ ...day, notes: notes_items }));

    const accommodations = this.accommodations.list(tripId);

    const budgetItems = this.budget.listBudgetItems(tripId);
    const budget = {
      items: budgetItems,
      item_count: budgetItems.length,
      total: budgetItems.reduce((sum, i) => sum + (i.total_price || 0), 0),
      currency: trip.currency,
    };

    // Thread the viewer so another member's private/personal packing items (#858)
    // stay hidden — without it listItems returns the UNFILTERED list.
    const packingItems = this.packing.listItems(tripId, viewerUserId);
    const packing = {
      items: packingItems,
      total: packingItems.length,
      checked: (packingItems as { checked: number }[]).filter(i => i.checked).length,
    };

    const reservations = this.reservations.list(tripId);
    const collab_notes = this.collab.listNotes(tripId);

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
  bundle(tripId: string, trip: { user_id: number }, viewerId: number) {
    const { days } = this.days.list(tripId);
    const { owner, members } = this.members.listMembers(tripId, trip.user_id);
    return {
      trip,
      days,
      places: this.places.list(String(tripId), {}),
      // Scope to the requesting member so other members' private packing items
      // (#858) never land in this viewer's offline cache.
      packingItems: this.packing.listItems(tripId, viewerId),
      todoItems: this.todo.listItems(tripId),
      budgetItems: this.budget.listBudgetItems(tripId),
      reservations: this.reservations.list(tripId),
      files: this.files.listFiles(tripId, false),
      accommodations: this.accommodations.list(tripId),
      members: [owner, ...(members || [])].filter(Boolean),
    };
  }
}
