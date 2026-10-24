import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { McpController, Tool, TOOL_ANNOTATIONS_WRITE, errorResult, ok, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { TourStopsService } from './tour-stops.service';
import { NotFoundException } from '@nestjs/common';
import {
  idSchema,
  tourStopInsertRequestSchema,
  tourStopRemoveRequestSchema,
  type TourStopInsertRequest,
  type TourStopRemoveRequest,
} from '@trek/shared';

/** A refusal for a tour this trip does not have, the same text every tool of the tours answers. */
function tourNotFound(err: unknown) {
  if (err instanceof NotFoundException) return errorResult('Tour not found.');
  throw err;
}

/**
 * P6: a place taken into a saved hike or city walk as one stop, and taken out
 * again. Both write with 'place_edit' on the trip, as the planner's save over
 * REST asks (ToursController's update) and as update_tour and
 * save_tour_change ask, whose paths they save through; the trip hears of the
 * change as from those (tours:changed and place:updated).
 */
@McpController()
export class TourStopsMcp {
  constructor(
    private readonly stops: TourStopsService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'insert_tour_stop',
    description:
      'Take a place into a saved hike or city walk as one stop, against the revision it was read at (expected_revision is tour.revision from get_tour_plan or list_tours): a hut, a café, a viewpoint the traveller found along it, from search_tour_pois or any search. stop is where it is, its name and on a hike its poi_category, on a city walk its opening_hours. With after_key (the key of a point from get_tour_plan) the stop comes after that point; left out, after the last point before it along the route, as the planner puts a found place. A leg drawn by hand or a fixed line (a via ferrata, a ferry, a portage) is never cut, and nothing goes after the way back of a loop: such a place is refused with the reason, name another point. A hike plans its way anew through the points, as update_tour does (where it cannot be planned nothing is saved and the error says why), and keeps its stages and the links of its points; a city walk saves the stop as a new station as save_tour_change does, the visits of its other stations kept. Any other type, and a recorded track without points of its own, is refused: change those in the planner. A tour changed since that revision is refused as a conflict: read it again. The answer: tour (place_id, name, tour_type, the new revision, distance_km and minutes as now stored, route_pending), stop (its key, where it is, after_key and after_name, the point it follows) and before (distance_km and minutes as stored before). Take it out again with remove_tour_stop. Needs place editing permission on the trip. Take a place in only after the traveller said yes.',
    inputSchema: { tripId: idSchema, ...tourStopInsertRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async insertTourStop({ tripId, ...request }: { tripId: number } & TourStopInsertRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    try {
      return ok(await this.stops.insert(ctx.userId, tripId, request));
    } catch (err: unknown) {
      return tourNotFound(err);
    }
  }

  @Tool({
    name: 'remove_tour_stop',
    description:
      'Take one stop out of a saved hike or city walk by its key (from get_tour_plan or insert_tour_stop), against the revision it was read at (expected_revision). A hike plans its way anew through the points left, as update_tour does; a city walk removes the station as save_tour_change does, and refuses a station protected, or visited or skipped on a day. The start of a tour, the way back of a loop and a tour of two points keep their points: those are refused. Any other type is refused: change it in the planner. A tour changed since that revision is refused as a conflict: read it again. The answer: tour (place_id, name, tour_type, the new revision, distance_km and minutes as now stored, route_pending) and removed (the stop with its key, where it was, its name and after_key, the point it followed). Needs place editing permission on the trip. Take a stop out only after the traveller said yes.',
    inputSchema: { tripId: idSchema, ...tourStopRemoveRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async removeTourStop({ tripId, ...request }: { tripId: number } & TourStopRemoveRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    try {
      return ok(await this.stops.remove(ctx.userId, tripId, request));
    } catch (err: unknown) {
      return tourNotFound(err);
    }
  }
}
