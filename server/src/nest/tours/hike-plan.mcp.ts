import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  errorResult,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { HikePlanService } from './hike-plan.service';
import { NotFoundException } from '@nestjs/common';
import {
  hikeCreateRequestSchema,
  hikeProposeRequestSchema,
  idSchema,
  tourGpxImportRequestSchema,
  tourUpdateRequestSchema,
  type HikeCreateRequest,
  type HikeProposeRequest,
  type TourGpxImportRequest,
  type TourUpdateRequest,
} from '@trek/shared';

/**
 * A hike planned with the traveller over MCP. The proposal reads only, so a
 * way turned down changes nothing and several can be compared; the hike is
 * created, changed or taken in from a GPX file once the traveller said yes,
 * through the writes the planner and the file import use, with 'place_edit'
 * on the trip as REST asks (ToursController for a create and an edit,
 * ToursImportController for the file), and 'day_edit' as well for a hike put
 * on a day (AssignmentsController). Those writes tell the trip about the
 * tour (tours:changed with place:created or place:updated, and
 * assignment:created for its day) without leaving out any socket, so the tab
 * that asked shows it too. A refusal of the
 * service is a DomainError, which the registry answers as an error result
 * with the text REST sends.
 */
@McpController()
export class HikePlanMcp {
  constructor(
    private readonly hikes: HikePlanService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'propose_hike',
    description:
      "Plan a hike for a trip and show it to the traveller, without saving anything; give it a name. The way on foot runs through waypoints in order (the start, the points on the way such as a hut or a summit, each with its poi_category where it is one, the end; with round_trip it comes back to the start) and takes no path harder than max_hiking_difficulty on the SAC scale (1 for T1 hiking to 6 for T6 difficult alpine hiking, 2 when left out), avoiding steep climbs, steps or ferries where there is a way round when hiking_preferences asks so. TREK's router plans it as the tour planner does. The answer gives distance_m, ascent_m and descent_m, the walking time without breaks (duration_minutes: by DIN 33466, the rule hiking signposts use, where the heights are known, duration_basis din33466; else the router's, duration_basis router), min_ele_m, max_ele_m and high_point, the SAC grades OpenStreetMap records along the way (sac: highest, the graded stretches in metres along the way, and unknown_share, the part with no grade, which is unknown and never easy), every point with at_m (where it lies along the way), snapped_m (how far it was moved onto a way), minutes from the start and, with start_time, its arrival, and along: summits, huts, water and viewpoints near the way (null with along false or where they could not be searched). With day_id (a day of the trip, whose date it takes) or date, schedule gives the day: the arrival (next_day past midnight), sunrise and sunset, the weather by the hour at the highest point (weather forecast, or climate further out: last year's day) and, without start_time, latest_start to be back half an hour before sunset; warnings name a start before sunrise (dark_start), an arrival after sunset (dark_end) or within the hour before it (dusk), and the first walking hour with thunderstorms (thunder) or likely rain (rain). Where no way was planned, route says why: no_valhalla (this TREK has no router that knows hiking grades), router_unavailable (try again later), no_way (nothing within the limit joins the points: a higher limit or other points may), point_off_the_way (unreachable names the point and how far it is from any way) or too_long (longer than one hike is planned for: split it into shorter hikes). To compare ways, propose each one with its own variant_label, such as 'short and steep' or 'by the lake', and along false. The chat shows the route, its profile, times, weather and warnings as a card: never list coordinates, the hours or the figures, sum the hike up in a sentence and say what matters. Propose first and create the hike with create_hike only after the traveller said yes.",
    inputSchema: { tripId: idSchema, ...hikeProposeRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async proposeHike({ tripId, ...request }: { tripId: number } & HikeProposeRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    return ok(await this.hikes.propose(ctx.userId, tripId, request));
  }

  @Tool({
    name: 'create_hike',
    description:
      "Create a hike in a trip from points the traveller confirmed, usually the name and waypoints of a proposal of propose_hike with its max_hiking_difficulty, hiking_preferences and round_trip. It is saved the way the planner saves a new hike: a tour of type hike with its points in order (start, points on the way, end, with their names and poi_category), the way on foot planned by the same router as the proposal and kept whole (the very line a proposal of the last minutes showed), with its heights where every point has one, its distance, ascent, descent and walking time, its hiking limit and preferences, and planned_duration_minutes (the time out, breaks included) where given. Where the router did not answer, for the way or its heights (route planned false, why router_unavailable), the hike is saved with its points only (route_pending true) and TREK plans the way when someone opens it in the planner; no straight line is stored. Any other reason the proposal names (no_valhalla, no_way, point_off_the_way, too_long) refuses the hike with why, and nothing is saved. With day_id the hike is put on that day of the trip in the same write, start_time kept as the start of that visit (which needs day editing permission too); assignment names the visit, null without a day. The answer is the tour as list_tours reads it (tour.place_id is the tour's id, its revision 1), route and assignment. Put it on a day later with assign_place_to_day, link it to the packing list with link_tour_packing, export it with export_tour_gpx, change it with update_tour. Needs place editing permission on the trip. Create it only after the traveller said yes.",
    inputSchema: { tripId: idSchema.describe('The trip to create the hike in'), ...hikeCreateRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async createHike({ tripId, ...request }: { tripId: number } & HikeCreateRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    // Putting it on a day is what REST's assignment route asks 'day_edit' for.
    if (request.day_id !== undefined && !(await this.guards.hasTripPermission('day_edit', tripId, ctx.userId))) {
      return permissionDenied();
    }
    return ok(await this.hikes.create(ctx.userId, tripId, request));
  }

  @Tool({
    name: 'update_tour',
    description:
      "Change a saved hike (tour_type hike) against the revision it was read at: expected_revision is tour.revision from get_tour_plan or list_tours. A new name, description or planned_duration_minutes keeps the hike's way. New waypoints (start to end; a round trip ends on its start), a new max_hiking_difficulty or new hiking_preferences plan the way anew as propose_hike plans it, and so does a hike still waiting for its way (route_pending); propose the new way to the traveller first. A hike changed since that revision is refused as a conflict: read it again and show the traveller what changed. Where the new way cannot be planned, or not with its heights, nothing is saved and the hike keeps its way; the error says why. A new point standing where a saved one stood (within 25 m) keeps that point's link to a place of the trip and its name. A hike with a section drawn by hand (a via ferrata, a free line, a ferry) or split into stages takes new points only in the planner, and the hand-drawn one no new limit or preferences either: those changes are refused here. A recorded track without points of its own (an import) takes only new waypoints, which plan it over and keep the recording. Any other type is refused: change a city walk with prepare_tour_change and save_tour_change. The hike stays on its days. The answer is the tour as saved, with its new revision, route and replanned. Needs place editing permission on the trip. Change it only after the traveller said yes.",
    inputSchema: { tripId: idSchema, ...tourUpdateRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async updateTour({ tripId, ...request }: { tripId: number } & TourUpdateRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    try {
      return ok(await this.hikes.update(ctx.userId, tripId, request));
    } catch (err: unknown) {
      if (err instanceof NotFoundException) return errorResult('Tour not found.');
      throw err;
    }
  }

  @Tool({
    name: 'import_tour_gpx',
    description:
      "Import the tracks and routes of a GPX file as tours of a trip, one tour each, as the planner's file import does: gpx is the file's text (its XML as it is, up to 1,000,000 characters) and file_name the name the travellers know it by. Without a type each one is a hike; a bike import names bike_profile, a run run_profile, a paddle import boat_type and water_context, a ski import ski_discipline (and for cross-country ski_technique). A track already in the trip under the same name and start is skipped and counted in skipped. The answer lists the tours created (each tour's place_id is its id), caution (a track without heights, its climb unknown) and skipped. A file without a single track or route is refused. Needs place editing permission on the trip. Import only a file the traveller gave and asked to import.",
    inputSchema: { tripId: idSchema, ...tourGpxImportRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async importTourGpx({ tripId, ...request }: { tripId: number } & TourGpxImportRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    return ok(await this.hikes.importGpx(tripId, request));
  }
}
