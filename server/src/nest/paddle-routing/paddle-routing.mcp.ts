import { ADDON_IDS } from '../../addons';
import { noAccess } from '../../mcp/tools/_shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { PaddleRoutingService } from './paddle-routing.service';
import { idSchema, paddleRouteRequestSchema, type PaddleRouteInput, type PaddleRouteLeg } from '@trek/shared';

/** A planned leg as a client reads it: its length and its stretches, not its thousands of points. */
function summary(leg: PaddleRouteLeg) {
  if (leg.status === 'failed') return leg;
  return {
    status: leg.status,
    distance_m: leg.distance_m,
    snapped_m: leg.snapped_m,
    points: leg.geometry.length,
    segments: leg.segments.map(({ kind, name, source, osm_ref }) => ({ kind, name, source, osm_ref })),
  };
}

/**
 * PAD-11: the paddle router for a client, read only and with the REST
 * route's rules: the caller must see the trip, Tours must be on, and the
 * request is the same contract. It plans and answers; nothing is saved.
 */
@McpController()
export class PaddleRoutingMcp {
  constructor(
    private readonly routing: PaddleRoutingService,
    private readonly access: TripAccessService,
    // Read by the addon gate.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'plan_paddle_route',
    description:
      'Plan the legs of a paddle tour on the water, on the water network TREK builds from the OpenStreetMap data of the paddle regions an admin added. Each leg (from, to) is planned along rivers and canals and across lakes, with short portages where a weir, dam or waterfall bars the way and through or around locks (lock_policy). lake_style direct crosses lakes straight, shore keeps near the shore (for wind). Answers per leg its length, how far its ends were moved onto the water, and its stretches (water, lake, portage with its source, lock, gap); a leg that cannot be planned says why (not_on_water, no_region, no_water_path, cross_region). A planning aid, never a safety or legal clearance; nothing is saved.',
    inputSchema: { tripId: idSchema, ...paddleRouteRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async planPaddleRoute({ tripId, ...request }: PaddleRouteInput & { tripId: number }, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    const planned = await this.routing.route(paddleRouteRequestSchema.parse(request));
    return ok({ legs: planned.legs.map(summary), graph_rev: planned.graph_rev });
  }
}
