import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_READONLY,
  errorResult,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { TourLibraryService } from './tour-library.service';
import { NotFoundException } from '@nestjs/common';
import { idSchema, tourLibraryQuerySchema, tourTakeOverRequestSchema, type TourLibraryQuery } from '@trek/shared';

const query = tourLibraryQuerySchema.shape;
const takeOver = tourTakeOverRequestSchema.shape;

/**
 * LIB-02: the tours of the user's other trips, and taking one over into a
 * trip, over the same service and the same checks as REST: the list only ever
 * reaches the user's own trips, the take-over needs 'place_edit' on the trip
 * it writes into and access to the trip it reads from.
 */
@McpController()
export class TourLibraryMcp {
  constructor(
    private readonly library: TourLibraryService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'list_tour_library',
    description:
      'List the saved tours of every trip the user can open, to choose one to take over into another trip: name, type, distance in km, ascent and descent in metres, the planned times, and the trip each one is in. Narrow it with q (a part of the name), type, trip_id, or leave the trip being planned out with exclude_trip_id. Up to 100 tours; truncated says there were more. Values a tour does not have stay null.',
    inputSchema: {
      q: query.q,
      type: query.type,
      trip_id: query.trip_id,
      exclude_trip_id: query.exclude_trip_id,
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async listTourLibrary(input: TourLibraryQuery, ctx: McpContext) {
    return ok(await this.library.list(ctx.userId, input));
  }

  @Tool({
    name: 'take_over_tour',
    description:
      'Copy a saved tour of another trip (as list_tour_library gives it) into a trip, as an independent tour of that trip: its line, measures, settings and control points, without its days, its links to places of the other trip or the decisions taken there about obstacles. The copy remembers which trip and tour it was taken from. A city walk keeps its stations with their keys, names, stays, importance, protection and opening hours; what was checked off on the days of the other trip stays there, and a walk still waiting for its way (route_pending) is copied as it is. Nothing changes in the source trip.',
    inputSchema: {
      tripId: idSchema.describe('The trip to copy the tour into'),
      source_trip_id: takeOver.source_trip_id,
      source_place_id: takeOver.source_place_id,
      name: takeOver.name,
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async takeOverTour(
    input: { tripId: number; source_trip_id: number; source_place_id: number; name?: string },
    ctx: McpContext,
  ) {
    const { tripId, ...body } = input;
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    try {
      return ok(await this.library.takeOver(String(tripId), ctx.userId, body));
    } catch (err: unknown) {
      if (err instanceof NotFoundException) return errorResult('Tour not found.');
      throw err;
    }
  }
}
