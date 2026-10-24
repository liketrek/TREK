import { ADDON_IDS } from '../../addons';
import { noAccess } from '../../mcp/tools/_shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import { thinLine } from '../../utils/polyline';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { SkiRoutingService } from './ski-routing.service';
import {
  cumulativeMetres,
  idSchema,
  includeGeometryFlagSchema,
  pointsPerLeg,
  skiRouteRequestSchema,
  TOUR_DISPLAY_LINE_POINTS,
  type SkiRouteInput,
  type SkiRouteLeg,
} from '@trek/shared';

/**
 * A planned leg as a client reads it: its measures and its stretches, each
 * placed in metres along the leg, not its thousands of points. With a share
 * of the points for drawing (`points`), its line thinned to that many, every
 * point keeping its height.
 */
function summary(leg: SkiRouteLeg, points: number | null) {
  if (leg.status === 'failed') return leg;
  const along = cumulativeMetres(leg.geometry.map(([lat, lng]) => [lat, lng] as const));
  return {
    status: leg.status,
    distance_m: leg.distance_m,
    climb_m: leg.climb_m,
    descent_m: leg.descent_m,
    seconds: leg.seconds,
    snapped_m: leg.snapped_m,
    points: leg.geometry.length,
    segments: leg.segments.map(({ from, to, grooming: _grooming, osm_way: _way, ...segment }) => ({
      ...segment,
      // Both indexes point into the leg's own geometry, so each has its place along it.
      from_m: Math.round(along[from]),
      to_m: Math.round(along[to]),
    })),
    why: leg.why,
    alternatives: leg.alternatives.length,
    ...(points === null ? {} : { line_geometry: thinLine(leg.geometry, points) }),
  };
}

/** The points each planned leg draws with, all of them together at most TOUR_DISPLAY_LINE_POINTS, by length. */
function linePoints(legs: readonly SkiRouteLeg[]): Array<number | null> {
  return pointsPerLeg(
    legs.map((leg) => (leg.status === 'ok' ? { lengthM: leg.distance_m, points: leg.geometry.length } : null)),
    TOUR_DISPLAY_LINE_POINTS,
  );
}

/**
 * The piste router for a client, read only and with the REST route's rules:
 * the caller must see the trip, Tours must be on, and the request is the same
 * contract, planned by the same service. It plans and answers; nothing is
 * saved, and no clicked point leaves the server. With include_geometry each
 * planned leg adds its line for drawing with its heights, thinned so all legs
 * together hold at most TOUR_DISPLAY_LINE_POINTS points.
 */
@McpController()
export class SkiRoutingMcp {
  constructor(
    private readonly routing: SkiRoutingService,
    private readonly access: TripAccessService,
    // Read by the addon gate.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'plan_ski_route',
    description:
      'Plan the legs of a ski and winter tour on the runs, lifts, cross-country trails, ski touring and winter paths of OpenStreetMap, for a discipline (alpine, snowboard, cross_country with a technique of classic, skating or unknown, touring, snowshoe, winter_hike) and its options (max_difficulty from novice to expert, allow_freeride, avoid_lifts by class, allow_lift_down, priority fastest, most_skiing or easiest, pace, groomed_only and lit_only for cross-country, touring_uphill_on_pistes, use_lifts, avoid_inferred_links). Each leg (from, to) answers its length, climb and descent, its time split into skiing, lifts, waiting at lifts and walking, how far its ends were moved onto the network, its stretches (run with difficulty, lift with type, link the map data does not hold, and so on, each with where it starts and ends in metres along the leg, from_m and to_m) and notes on what it rests on; a leg that cannot be planned says why (not_on_piste, no_area, cross_area, disconnected, blocked_by_difficulty with the level it needs, blocked_by_lift_avoid, blocked_by_technique, needs_ride_down, uphill_only, loading while an area downloads, places_unavailable, disabled). Times are estimates from the run difficulties and lift types, waits are guesses, and nothing says what is open, groomed or safe today; nothing is saved.',
    inputSchema: { tripId: idSchema, ...skiRouteRequestSchema.shape, include_geometry: includeGeometryFlagSchema },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async planSkiRoute(
    { tripId, include_geometry, ...request }: SkiRouteInput & { tripId: number; include_geometry?: boolean },
    ctx: McpContext,
  ) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    const planned = await this.routing.route(skiRouteRequestSchema.parse(request));
    const points = include_geometry === true ? linePoints(planned.legs) : planned.legs.map(() => null);
    return ok({
      legs: planned.legs.map((leg, index) => summary(leg, points[index] ?? null)),
      build: planned.build,
      stale: planned.stale,
      area_names: planned.area_names,
      colour_scheme: planned.colour_scheme,
      attribution: planned.attribution,
    });
  }
}
