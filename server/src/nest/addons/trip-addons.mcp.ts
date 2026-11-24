import { noAccess } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { TripAddonsService } from './trip-addons.service';
import { idSchema, tripAddonIdSchema, tripAddonUpdateRequestSchema } from '@trek/shared';

/**
 * The MCP side of GET and PUT /api/trips/:tripId/addons, over the same
 * TripAddonsService. The REST owner check is TripOwnerGuard; here the service
 * makes the same literal check, so a member or an admin who does not own the
 * trip is refused with the REST text.
 *
 * Neither tool has an addon gate: they are how a trip turns an addon on that
 * the instance has off, so they must be there whatever the instance says.
 */
@McpController()
export class TripAddonsMcp {
  constructor(
    private readonly tripAddons: TripAddonsService,
    private readonly trips: TripAccessService,
  ) {}

  @Tool({
    name: 'get_trip_addons',
    description:
      'List the trip addons of one trip (lists, costs, files, collab, road trip, tours) and whether each applies to this trip. enabled is what applies here; instanceEnabled is the instance-wide setting; overridden is true when the trip owner chose enabled for this trip instead of following the instance. An addon that is off here has its tools refused for this trip, and its data is kept. Every member can read this.',
    inputSchema: { tripId: idSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' },
  })
  async list({ tripId }: { tripId: number }, ctx: McpContext) {
    const trip = await this.trips.findAccessible(tripId, ctx.userId);
    if (!trip) return noAccess();
    return ok({ tripId: trip.id, addons: await this.tripAddons.effectiveTripAddons(trip.id) });
  }

  @Tool({
    name: 'set_trip_addon',
    description:
      'Switch one trip addon on or off for this trip only, whatever the instance-wide setting is, or pass enabled null to follow the instance setting again. Only the trip owner may do this. Turning an addon off hides it for every member of this trip and keeps its data; turning it on again brings everything back. addonId is an id from get_trip_addons, such as packing, budget, documents, collab, roadtrip or tours. Answers the trip addons as they stand afterwards.',
    inputSchema: {
      tripId: idSchema,
      addonId: tripAddonIdSchema,
      enabled: tripAddonUpdateRequestSchema.shape.enabled,
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'write' },
  })
  async set(
    { tripId, addonId, enabled }: { tripId: number; addonId: string; enabled: boolean | null },
    ctx: McpContext,
  ) {
    const trip = await this.trips.findAccessible(tripId, ctx.userId);
    if (!trip) return noAccess();
    // The owner check and the addon check are the service's, so they read the same as on REST.
    const addons = await this.tripAddons.setTripOverride(trip.id, ctx.userId, addonId, enabled);
    return ok({ tripId: trip.id, addons });
  }
}
