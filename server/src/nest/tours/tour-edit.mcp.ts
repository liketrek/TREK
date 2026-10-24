import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_WRITE,
  errorResult,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { TourDetailsService } from './tour-details.service';
import { ToursService } from './tours.service';
import { NotFoundException } from '@nestjs/common';
import {
  idSchema,
  tourCopyToolRequestSchema,
  tourDetailsUpdateRequestSchema,
  tourRouteColorRequestSchema,
  type TourCopyToolRequest,
  type TourDetailsUpdateRequest,
  type TourRouteColorRequest,
} from '@trek/shared';

/** A tour the trip does not hold answers as not found, as REST answers its 404. */
async function orNotFound<T>(write: () => Promise<T>) {
  try {
    return ok(await write());
  } catch (err: unknown) {
    if (err instanceof NotFoundException) return errorResult('Tour not found.');
    throw err;
  }
}

/**
 * P8: the edits of a saved tour besides its route, for every type: its words
 * and planned times (the planner's editor fields, saved over REST with the
 * tour's PUT), the colour of its line (the tour detail's colour picker, the
 * places' PUT) and a copy of it as a new tour of the trip (POST .../copy).
 * Each asks 'place_edit' on the trip as those routes do, and a refusal of the
 * service (a time past the day's limit, a tour changed since it was read) is
 * a DomainError the registry answers with the text REST sends.
 */
@McpController()
export class TourEditMcp {
  constructor(
    private readonly details: TourDetailsService,
    private readonly tours: ToursService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  /** Trip access, then 'place_edit', as the REST routes check them; null when both hold. */
  private async refusal(tripId: number, userId: number) {
    if (!(await this.access.findAccessible(tripId, userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, userId))) return permissionDenied();
    return null;
  }

  @Tool({
    name: 'update_tour_details',
    description:
      'Change the words and planned times of a saved tour of any type (a hike, a city walk, a bike tour, a run, a paddle, ski or horse tour, a recorded track too) without touching its route, its points or its days: name, description, website (an https URL), break_additional_minutes (the breaks on top of the moving time) and planned_duration_minutes (the time out in all the travellers set themselves, breaks included); only the fields given change, null clears one. expected_revision is tour.revision from get_tour_plan or list_tours: a tour changed since is refused as a conflict, read it again. The moving time and the breaks stay within a day (a day a stage for a tour over several days) unless a planned total is set, as in the planner. The answer gives the tour as now saved with its new revision, and previous, the values before. Needs place editing permission on the trip. Change it only after the traveller said yes.',
    inputSchema: { tripId: idSchema, ...tourDetailsUpdateRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async updateTourDetails({ tripId, ...request }: { tripId: number } & TourDetailsUpdateRequest, ctx: McpContext) {
    const refused = await this.refusal(tripId, ctx.userId);
    if (refused) return refused;
    const checked = tourDetailsUpdateRequestSchema.safeParse(request);
    if (!checked.success) return errorResult(checked.error.issues.map((issue) => issue.message).join('; '));
    return await orNotFound(() => this.details.update(tripId, checked.data));
  }

  @Tool({
    name: 'set_tour_route_color',
    description:
      'Draw the line of a saved tour in another colour on the map, as the colour picker of the tour detail does: route_color is a hex colour such as "#e11d48", null draws it in the colour of its tour type again. Only the colour changes: the route, the revision and the days stay as they are. The answer gives route_color and previous_route_color. Needs place editing permission on the trip.',
    inputSchema: { tripId: idSchema, ...tourRouteColorRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async setTourRouteColor(
    { tripId, placeId, route_color }: { tripId: number } & TourRouteColorRequest,
    ctx: McpContext,
  ) {
    const refused = await this.refusal(tripId, ctx.userId);
    if (refused) return refused;
    return await orNotFound(() => this.details.setRouteColor(tripId, placeId, route_color));
  }

  @Tool({
    name: 'copy_tour',
    description:
      'Save a tour of the trip again as a new, independent tour of the same trip under its own name, as the planner\'s "save as new tour" does: the copy has its own id, line and control points, the same type, measures and settings, its stops keep their links to the trip\'s places, and it is on no day yet (put it on one with assign_place_to_day). Use it to try a variant without losing the original: copy first, then change the copy. The answer is the copy as list_tours reads it (tour.place_id is its id, revision 1). Needs place editing permission on the trip. Copy only when the traveller asked for it.',
    inputSchema: { tripId: idSchema, ...tourCopyToolRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async copyTour({ tripId, placeId, name }: { tripId: number } & TourCopyToolRequest, ctx: McpContext) {
    const refused = await this.refusal(tripId, ctx.userId);
    if (refused) return refused;
    return await orNotFound(() => this.tours.copyTour(String(tripId), String(placeId), name));
  }
}
