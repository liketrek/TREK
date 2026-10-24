import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_READONLY,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { HikePlanService } from './hike-plan.service';
import { SportTourCreateService } from './sport-tour-create.service';
import {
  idSchema,
  paddleTourCreateRequestSchema,
  skiTourCreateRequestSchema,
  tourPlanCreateRequestSchema,
  tourProposeRequestSchema,
  type PaddleTourCreateRequest,
  type SkiTourCreateRequest,
  type TourPlanCreateRequest,
  type TourProposeRequest,
} from '@trek/shared';

/** What every create here says of the day it may be put on, and of where to go on from it. */
const ON_A_DAY =
  'With day_id the tour is put on that day of the trip in the same write, start_time kept as the start of that visit (which needs day editing permission too); assignment names the visit, null without a day. The answer is the tour as list_tours reads it (tour.place_id is the tour id, its revision 1), route and assignment. Put it on a day later with assign_place_to_day, link it to the packing list with link_tour_packing, export it with export_tour_gpx. Needs place editing permission on the trip. Create it only after the traveller said yes.';

/**
 * Every tour type besides a hike and a city walk planned and saved with the
 * traveller over MCP: a bike tour or a run proposed and created through the
 * hike's own plan and save (HikePlanService, one path for every activity on
 * land), a paddle or ski tour planned with plan_paddle_route or
 * plan_ski_route saved through SportTourCreateService. A proposal reads only;
 * a create writes through the creation the planner's save uses, with
 * 'place_edit' on the trip as REST asks (ToursController), and 'day_edit' as
 * well for a tour put on a day (AssignmentsController). A refusal of the
 * service is a DomainError, which the registry answers as an error result
 * with the text REST sends.
 */
@McpController()
export class TourPlanMcp {
  constructor(
    private readonly hikes: HikePlanService,
    private readonly sports: SportTourCreateService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  /** Whether the user may create a tour in the trip, and put it on a day where one is named. */
  private async mayCreate(tripId: number, userId: number, dayId: number | undefined): Promise<boolean> {
    if (!(await this.guards.hasTripPermission('place_edit', tripId, userId))) return false;
    // Putting it on a day is what REST's assignment route asks 'day_edit' for.
    return dayId === undefined || (await this.guards.hasTripPermission('day_edit', tripId, userId));
  }

  @Tool({
    name: 'propose_tour',
    description:
      "Plan a bike tour (activity bike) or a run (activity run) for a trip and show it to the traveller, without saving anything; give it a name. A hike is planned with propose_hike, a city walk with propose_city_walk, a paddle tour with plan_paddle_route, a ski or winter tour with plan_ski_route. The way runs through waypoints in order (the start, the points on the way, the end; with round_trip back to the start), planned by TREK's Valhalla router as the tour planner plans it for the profile: a bike tour's bike_profile touring (paved ways, cycle paths and quiet roads, for a city or trekking bike, the default), road (asphalt only, a road bike), gravel (gravel and farm tracks) or mtb (rough tracks and trails, a mountain bike); a run's run_profile running (runnable, mostly paved ways, the default) or trail (forest tracks and natural paths up to T2). Pick the profile from what the traveller rides or how they like to run, and ask when it is not clear. A bike tour's time (duration_minutes, duration_basis router) is the router's riding time for its profile; a run's is its distance at run_pace_seconds_per_km, the runner's own pace (duration_basis pace), and a run without a pace has no time: ask for the pace. The answer gives distance_m, ascent_m, descent_m, min_ele_m, max_ele_m, high_point, every point with at_m, snapped_m, minutes and, with start_time, its arrival, and along: water, food, toilets, viewpoints (a bike repair shop on a ride, a park on a run) near the way. With day_id or date, schedule gives the day with sunrise, sunset and the weather by the hour, and warnings name a start in the dark, an arrival after sunset, thunder or rain. Where no way was planned, route says why as propose_hike does (no_valhalla, router_unavailable, no_way, point_off_the_way, too_long). To compare ways, propose each with its own variant_label and along false, the one you recommend first. The chat shows the route, its profile, times and weather as a card: never list coordinates or the figures, sum it up in a sentence. Create it with create_tour only after the traveller said yes.",
    inputSchema: { tripId: idSchema, ...tourProposeRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async proposeTour({ tripId, ...request }: { tripId: number } & TourProposeRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    return ok(await this.hikes.proposeTour(ctx.userId, tripId, request));
  }

  @Tool({
    name: 'create_tour',
    description: `Create a bike tour or a run in a trip from points the traveller confirmed, usually the name, activity, profile and waypoints of a proposal of propose_tour with its round_trip. A run is created only with run_pace_seconds_per_km, the runner's pace. It is saved the way the planner saves one: a tour of type bike or run with its points in order, the way planned by the same router for the same profile and kept whole with its heights, its distance, ascent, descent and time (a bike tour the router's riding time, a run its distance at the pace), its bike_profile or run_profile and pace, and planned_duration_minutes (the time out, breaks included) where given. Where the router did not answer, for the way or its heights (route planned false, why router_unavailable), the tour is saved with its points only (route_pending true) and TREK plans the way when someone opens it in the planner. Any other reason refuses the tour with why, and nothing is saved. ${ON_A_DAY}`,
    inputSchema: { tripId: idSchema.describe('The trip to create the tour in'), ...tourPlanCreateRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async createTour({ tripId, ...request }: { tripId: number } & TourPlanCreateRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.mayCreate(tripId, ctx.userId, request.day_id))) return permissionDenied();
    return ok(await this.hikes.createTour(ctx.userId, tripId, request));
  }

  @Tool({
    name: 'create_paddle_tour',
    description: `Create a paddle tour in a trip from a plan of plan_paddle_route the traveller confirmed: waypoints are the put-in, the points on the way and the take-out (the from of the first leg and the to of every leg, in order), with the boat_type, lake_style and lock_policy the plan was asked with, and water_context (river or lake), which the tour needs. Each leg is planned again on the water by the same router and the tour is saved as the planner saves one: its points, the whole line with its heights, its distance and its time on the move by the planner's estimate (water at paddle_speed_kmh, the boat's starting speed when left out, each portage the router carries round at portage_speed_kmh, locks without a time of their own). A leg that cannot be planned on the water refuses the tour and nothing is saved. Where the heights could not be read the tour is saved with its points only (route_pending true). ${ON_A_DAY}`,
    inputSchema: {
      tripId: idSchema.describe('The trip to create the tour in'),
      ...paddleTourCreateRequestSchema.shape,
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async createPaddleTour({ tripId, ...request }: { tripId: number } & PaddleTourCreateRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.mayCreate(tripId, ctx.userId, request.day_id))) return permissionDenied();
    return ok(await this.sports.createPaddle(ctx.userId, tripId, request));
  }

  @Tool({
    name: 'create_ski_tour',
    description: `Create a ski or winter tour in a trip from a plan of plan_ski_route the traveller confirmed: waypoints are the start, the points on the way and the end (the from of the first leg and the to of every leg, in order), with the discipline, technique (cross_country only, and needed there) and options the plan was asked with. Each leg is planned again on the piste data by the same router and the tour is saved as the planner saves one: its points, the whole line with its heights, its distance, climb and descent, the piste router's time (skiing, lifts, waiting and walking), its discipline and options and the piste data build it was planned on. A leg that cannot be planned refuses the tour and nothing is saved (loading: the ski area is still being downloaded, try again in a moment). Where the heights could not be read the tour is saved with its points only (route_pending true). ${ON_A_DAY}`,
    inputSchema: { tripId: idSchema.describe('The trip to create the tour in'), ...skiTourCreateRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async createSkiTour({ tripId, ...request }: { tripId: number } & SkiTourCreateRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.mayCreate(tripId, ctx.userId, request.day_id))) return permissionDenied();
    return ok(await this.sports.createSki(ctx.userId, tripId, request));
  }
}
