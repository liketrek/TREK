import { ADDON_IDS } from '../../addons';
import { noAccess } from '../../mcp/tools/_shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import { thinLine } from '../../utils/polyline';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { PaddleRoutingService } from './paddle-routing.service';
import {
  cumulativeMetres,
  idSchema,
  includeGeometryFlagSchema,
  paddleRouteRequestSchema,
  pointsPerLeg,
  TOUR_DISPLAY_LINE_POINTS,
  type PaddleRouteInput,
  type PaddleRouteLeg,
} from '@trek/shared';

/**
 * A planned leg as a client reads it: its length and its stretches, each
 * placed in metres along the leg, not its thousands of points. With a share
 * of the points for drawing (`points`), its line thinned to that many.
 */
function summary(leg: PaddleRouteLeg, points: number | null) {
  if (leg.status === 'failed') return leg;
  const along = cumulativeMetres(leg.geometry.map(([lat, lng]) => [lat, lng] as const));
  return {
    status: leg.status,
    distance_m: leg.distance_m,
    snapped_m: leg.snapped_m,
    points: leg.geometry.length,
    segments: leg.segments.map(({ kind, name, source, osm_ref, from, to }) => ({
      kind,
      name,
      source,
      osm_ref,
      // Both indexes point into the leg's own geometry, so each has its place along it.
      from_m: Math.round(along[from]),
      to_m: Math.round(along[to]),
    })),
    ...(points === null ? {} : { line_geometry: thinLine(leg.geometry, points) }),
  };
}

/** The points each planned leg draws with, all of them together at most TOUR_DISPLAY_LINE_POINTS, by length. */
function linePoints(legs: readonly PaddleRouteLeg[]): Array<number | null> {
  return pointsPerLeg(
    legs.map((leg) => (leg.status === 'ok' ? { lengthM: leg.distance_m, points: leg.geometry.length } : null)),
    TOUR_DISPLAY_LINE_POINTS,
  );
}

/**
 * PAD-11: the paddle router for a client, read only and with the REST
 * route's rules: the caller must see the trip, Tours must be on, and the
 * request is the same contract. It plans and answers; nothing is saved. With
 * include_geometry each planned leg adds its line for drawing, thinned so all
 * legs together hold at most TOUR_DISPLAY_LINE_POINTS points.
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
      'Plan the legs of a paddle tour on the water, on the water network TREK builds from the OpenStreetMap data of the paddle regions an admin added. Each leg (from, to) is planned along rivers and canals and across lakes, with short portages where a weir, dam or waterfall bars the way and through or around locks (lock_policy). lake_style direct crosses lakes straight, shore keeps near the shore (for wind). Answers per leg its length, how far its ends were moved onto the water, and its stretches (water, lake, portage with its source, lock, gap) with where each starts and ends in metres along the leg (from_m, to_m); a leg that cannot be planned says why (not_on_water, no_region, no_water_path, cross_region). A planning aid, never a safety or legal clearance; nothing is saved.',
    inputSchema: { tripId: idSchema, ...paddleRouteRequestSchema.shape, include_geometry: includeGeometryFlagSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async planPaddleRoute(
    { tripId, include_geometry, ...request }: PaddleRouteInput & { tripId: number; include_geometry?: boolean },
    ctx: McpContext,
  ) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    const planned = await this.routing.route(paddleRouteRequestSchema.parse(request));
    const points = include_geometry === true ? linePoints(planned.legs) : planned.legs.map(() => null);
    return ok({
      legs: planned.legs.map((leg, index) => summary(leg, points[index] ?? null)),
      graph_rev: planned.graph_rev,
    });
  }
}
