import { ADDON_IDS } from '../../addons';
import type { TourDayRow } from '../../db/repositories/Tours.repository';
import { noAccess } from '../../mcp/tools/_shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, errorResult, ok, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { ToursService } from './tours.service';
import { NotFoundException } from '@nestjs/common';
import { idSchema, type TourListItem } from '@trek/shared';

type TourDay = Pick<TourDayRow, 'day_id' | 'day_number' | 'date' | 'title'>;

/** A tour as a client reads it: its list facts and the days of the trip it is on. */
function withDays(tour: TourListItem, days: ReadonlyMap<number, TourDay[]>) {
  return { ...tour, days: days.get(tour.place_id) ?? [] };
}

/**
 * P2D-MCP-01: the saved tours of a trip, read only. A tool reads what the
 * tours list and the tour detail answer over REST, through the same service,
 * so a client sees the same facts the app shows: the tours of a trip, one
 * tour's plan (its control points, measures and provenance; the full line
 * stays out, it runs to thousands of points), and the tours of one day.
 * Nothing here writes. Drafts in a browser are never visible here: only
 * saved tours exist on the server.
 */
@McpController()
export class ToursMcp {
  constructor(
    private readonly tours: ToursService,
    private readonly access: TripAccessService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  /** Each tour of the trip with the days it is on, each day once, in day order. */
  private async daysByTour(tripId: number): Promise<Map<number, TourDay[]>> {
    const byTour = new Map<number, TourDay[]>();
    for (const { place_id, ...day } of await this.tours.listTourDays(tripId)) {
      byTour.set(place_id, [...(byTour.get(place_id) ?? []), day]);
    }
    return byTour;
  }

  @Tool({
    name: 'list_tours',
    description:
      'List the saved tours of a trip (hikes and paddle tours planned or imported in the Tours addon): name, type (hike, or kayak for a paddle tour), where it came from (origin: trek, gpx or wanderer), distance in km, ascent and descent in metres, the stored routing limit of a hike (max_hiking_difficulty, SAC T1 to T6), the boat, water and chosen speed of a paddle tour (boat_type, water_context, paddle_speed_kmh in km/h, null while the suggested speed of the boat applies), and the days of the trip each tour is on.',
    inputSchema: { tripId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async listTours({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    const [tours, days] = await Promise.all([this.tours.listTours(String(tripId)), this.daysByTour(tripId)]);
    return ok({ tours: tours.map((tour) => withDays(tour, days)) });
  }

  @Tool({
    name: 'get_tour_plan',
    description:
      'Read one saved tour of a trip: its facts, its ordered control points (start, via and end; an import without its own shows the two ends of its track), where it came from (provenance) and the days it is on. A control point whose fixed_leg is set leads to the next one along a line the router did not plan: kind ferrata follows a via ferrata, kind free is drawn by hand and was checked by nothing. The full track geometry is not included.',
    inputSchema: { tripId: idSchema, placeId: idSchema.describe('The place id of the tour, as list_tours gives it') },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async getTourPlan({ tripId, placeId }: { tripId: number; placeId: number }, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    try {
      const [detail, days] = await Promise.all([
        this.tours.getTour(String(tripId), String(placeId)),
        this.daysByTour(tripId),
      ]);
      return ok({ ...detail, tour: withDays(detail.tour, days) });
    } catch (err: unknown) {
      if (err instanceof NotFoundException) return errorResult('Tour not found.');
      throw err;
    }
  }

  @Tool({
    name: 'find_tours_for_day',
    description: 'List the saved tours put on one day of a trip, with the same facts as list_tours.',
    inputSchema: { tripId: idSchema, dayId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async findToursForDay({ tripId, dayId }: { tripId: number; dayId: number }, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    const [tours, days] = await Promise.all([this.tours.listTours(String(tripId)), this.daysByTour(tripId)]);
    const onDay = tours.filter((tour) => (days.get(tour.place_id) ?? []).some((day) => day.day_id === dayId));
    return ok({ tours: onDay.map((tour) => withDays(tour, days)) });
  }
}
