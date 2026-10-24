import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
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
import { parseHorseRoutesQuery } from './tour-horse-routes.controller';
import { TourHorseRoutesService } from './tour-horse-routes.service';
import { TourObstacleReviewsService } from './tour-obstacle-reviews.service';
import { TourPaddlePlanService } from './tour-paddle-plan.service';
import { TourSkiService } from './tour-ski.service';
import { TourTrailDetailsService } from './tour-trail-details.service';
import { ToursService } from './tours.service';
import { NotFoundException } from '@nestjs/common';
import {
  horseRoutesToolRequestSchema,
  idSchema,
  obstacleDecisionsToolRequestSchema,
  skiClassifyToolRequestSchema,
  tourObstacleReviewsRequestSchema,
  tourPaddlePlanRequestSchema,
  tourRefToolRequestSchema,
  tourSkiClassificationRequestSchema,
  type HorseRoute,
  type HorseRoutesToolRequest,
  type ObstacleDecisionsToolRequest,
  type SkiClassifyToolRequest,
  type TourDetailResponse,
  type TourPaddlePlanRequest,
  type TourRefToolRequest,
} from '@trek/shared';

import type { ZodError } from 'zod';

const plan = tourPaddlePlanRequestSchema.shape;

/** A request the shared contract refuses, answered with every reason as REST's pipe gives them. */
function refusedBy(error: ZodError) {
  return errorResult(error.issues.map((issue) => issue.message).join('; '));
}

/** The tour of a write's answer without what only the planner draws: its line, its points, its checklist. */
function tourOf(detail: TourDetailResponse) {
  return detail.tour;
}

/** A horse route as the assistant reads it: each section's length, access and signposting, and where it starts and ends. */
function routeInBrief(route: HorseRoute) {
  return {
    id: route.id,
    name: route.name,
    ref: route.ref,
    osm_url: route.osmUrl,
    continues: route.continues,
    sections: route.sections.map(({ geometry, ...section }) => ({
      ...section,
      from: geometry[0] ?? null,
      to: geometry[geometry.length - 1] ?? null,
    })),
  };
}

/**
 * P9: the writes and reads of the Tours tab that are a type's own, over MCP
 * with the services and checks of their REST routes: a ski track classified
 * again (PUT .../ski), the paddle plan of a recorded paddle track (PUT
 * .../paddle-plan) and the decisions about a paddle tour's obstacles (PUT
 * .../obstacle-reviews), an import planned over taken back to its recording
 * (POST .../restore-recorded), each with 'place_edit' on the trip; and two
 * reads anyone who sees the trip may make, the trail details along a saved
 * tour (the planner's trail grades) and the signposted horse routes in a
 * map view (GET .../horse-routes). A refusal of a service is a DomainError
 * the registry answers with the text REST sends.
 */
@McpController()
export class TourSportWritesMcp {
  constructor(
    private readonly tours: ToursService,
    private readonly ski: TourSkiService,
    private readonly paddlePlans: TourPaddlePlanService,
    private readonly obstacleReviews: TourObstacleReviewsService,
    private readonly trailDetails: TourTrailDetailsService,
    private readonly horseRoutes: TourHorseRoutesService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  /** Trip access, then 'place_edit', as the REST routes check them; null when both hold. */
  private async editRefusal(tripId: number, userId: number) {
    if (!(await this.access.findAccessible(tripId, userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, userId))) return permissionDenied();
    return null;
  }

  /** The write, answered with a tour the trip does not hold as not found, as REST answers its 404. */
  private async orNotFound<T>(write: () => Promise<T>) {
    try {
      return ok(await write());
    } catch (err: unknown) {
      if (err instanceof NotFoundException) return errorResult('Tour not found.');
      throw err;
    }
  }

  @Tool({
    name: 'classify_ski_track',
    description:
      'Classify a ski and winter tour (tour_type ski, usually an imported track) again when its discipline is not the right one: ski_discipline alpine, snowboard, cross_country, touring for ski touring, snowshoe or winter_hike, and for cross_country only ski_technique (classic, skating, or unknown when the travellers do not know). Only the classification changes: the track, its measures, its days and where it came from stay as they are, and nothing is planned. Any other type is refused. expected_revision (tour.revision of get_tour_plan) refuses it once the tour changed since. The answer gives the tour as now saved and previous, the discipline and technique before. Needs place editing permission on the trip. Change it only after the traveller said yes.',
    inputSchema: { tripId: idSchema, ...skiClassifyToolRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async classifySkiTrack(
    { tripId, placeId, ...request }: { tripId: number } & SkiClassifyToolRequest,
    ctx: McpContext,
  ) {
    const refused = await this.editRefusal(tripId, ctx.userId);
    if (refused) return refused;
    const checked = tourSkiClassificationRequestSchema.safeParse(request);
    if (!checked.success) return refusedBy(checked.error);
    return await this.orNotFound(async () => {
      const before = await this.tours.getTour(String(tripId), String(placeId));
      const after = await this.ski.classify(String(tripId), String(placeId), checked.data);
      return {
        tour: tourOf(after),
        previous: {
          revision: before.tour.revision ?? null,
          ski_discipline: before.tour.ski_discipline ?? null,
          ski_technique: before.tour.ski_technique ?? null,
        },
      };
    });
  }

  @Tool({
    name: 'set_paddle_plan',
    description:
      "Lay the paddle plan onto a recorded paddle track (tour_type kayak without control points of its own, an import), as the track's plan card does: the portages (from_m and to_m, metres from the start of the track, and extra_minutes for getting out and back in, null for TREK's starting value) and locks (at_m with wait_minutes and transit_minutes, null where not known) in track_marks, the paddle_speed_kmh (null for the boat's suggested speed) and the portage_speed_kmh (null for the starting value). The track is never redrawn; its moving time is reckoned anew from the plan. The plan given replaces the whole plan: send every portage and lock to keep. A planned paddle tour saves its portages and locks with its route in the planner and is refused here, and so is a mark past the end of the track. The answer gives the tour as now saved and previous, the plan before. Needs place editing permission on the trip. Change it only after the traveller said yes.",
    inputSchema: {
      tripId: idSchema,
      placeId: tourRefToolRequestSchema.shape.placeId,
      paddle_speed_kmh: plan.paddle_speed_kmh,
      portage_speed_kmh: plan.portage_speed_kmh,
      track_marks: plan.track_marks,
      expected_revision: plan.expected_revision,
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async setPaddlePlan(
    { tripId, placeId, ...request }: { tripId: number; placeId: number } & TourPaddlePlanRequest,
    ctx: McpContext,
  ) {
    const refused = await this.editRefusal(tripId, ctx.userId);
    if (refused) return refused;
    const checked = tourPaddlePlanRequestSchema.safeParse(request);
    if (!checked.success) return refusedBy(checked.error);
    return await this.orNotFound(async () => {
      const before = await this.tours.getTour(String(tripId), String(placeId));
      const after = await this.paddlePlans.update(String(tripId), String(placeId), checked.data);
      return {
        tour: tourOf(after),
        previous: {
          revision: before.tour.revision ?? null,
          paddle_speed_kmh: before.tour.paddle_speed_kmh ?? null,
          portage_speed_kmh: before.tour.portage_speed_kmh ?? null,
          track_marks: before.tour.track_marks ?? { portages: [], locks: [] },
        },
      };
    });
  }

  @Tool({
    name: 'decide_paddle_obstacles',
    description:
      "Record what the paddlers decided about the obstacles of a paddle tour (tour_type kayak), as its obstacle checklist does: read get_tour_plan first and take each entry's key and basis from its obstacle_check, since a decision is bound to the route and the data the travellers saw. op decide stores decision pass, portage, reroute or not_affected with that basis (and a note), note changes the note only, clear takes the decision back, keep keeps a decision about an object the data no longer holds; each obstacle at most once. A decision is the paddlers' own planning, never a safety or legal clearance, and a ban in the data counts whatever was decided. The answer is the checklist as it now stands (obstacle_check) with the tour. Refused while the obstacle data cannot be read. Needs place editing permission on the trip. Decide only what the traveller decided.",
    inputSchema: { tripId: idSchema, ...obstacleDecisionsToolRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async decidePaddleObstacles(
    { tripId, placeId, ops }: { tripId: number } & ObstacleDecisionsToolRequest,
    ctx: McpContext,
  ) {
    const refused = await this.editRefusal(tripId, ctx.userId);
    if (refused) return refused;
    const checked = tourObstacleReviewsRequestSchema.safeParse({ ops });
    if (!checked.success) return refusedBy(checked.error);
    return await this.orNotFound(async () => {
      const after = await this.obstacleReviews.save(String(tripId), String(placeId), checked.data, ctx.userId);
      return { tour: tourOf(after), obstacle_check: after.obstacle_check ?? null };
    });
  }

  @Tool({
    name: 'restore_recorded_track',
    description:
      'Take an import that was planned over in place (tour.has_recorded_track true) back to the track it was recorded with: its line, the distance and heights read from it and the grade its source gave, without control points; the planning is dropped and cannot be brought back here (copy_tour it first to keep it). The tour keeps its id, days and notes; a split into stages ends, so a day that held a stage no longer does. A tour without a recorded track to go back to is refused. The answer is the tour as now saved. Needs place editing permission on the trip. Do it only after the traveller said yes.',
    inputSchema: { tripId: idSchema, ...tourRefToolRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async restoreRecordedTrack({ tripId, placeId }: { tripId: number } & TourRefToolRequest, ctx: McpContext) {
    const refused = await this.editRefusal(tripId, ctx.userId);
    if (refused) return refused;
    return await this.orNotFound(async () => ({
      tour: tourOf(await this.tours.restoreRecordedTrack(String(tripId), String(placeId))),
    }));
  }

  @Tool({
    name: 'get_tour_trail_details',
    description:
      "Read what OpenStreetMap records for the ways a saved tour runs on, along its saved line, as the planner's trail details show it: sac (the SAC hiking grades: highest from 1 for T1 to 6 for T6, the graded stretches in metres along the line, unknown_share), mtb (the mountain bike scale mtb:scale, its hardest value and the metres of each), surface and highway (the metres and share of each value as OpenStreetMap writes it, such as asphalt, gravel, path or track), unknown_share (the part whose way carries none of these or could not be asked about) and length_m. A way without a value is unknown, never easy, paved or rideable; ways_unanswered counts ways the data could not be asked about this time, truncated says a very long line was only read in part. A tour saved with its points only has no line yet and is refused. Reading changes nothing.",
    inputSchema: { tripId: idSchema, ...tourRefToolRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async getTourTrailDetails({ tripId, placeId }: { tripId: number } & TourRefToolRequest, ctx: McpContext) {
    // A read, like the REST route: seeing the trip is enough.
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    return await this.orNotFound(() => this.trailDetails.details(ctx.userId, tripId, placeId));
  }

  @Tool({
    name: 'find_horse_routes',
    description:
      'Find the signposted horse routes OpenStreetMap knows inside a map view, as the horse tour planner shows them: each route (id relation/<n>, name, ref, osm_url, continues when it runs on past the view) with its sections, the stretches a ride can take whole (number, length_m, from and to as [lat, lng], access: the metres of each horse=* value its ways carry, unknown where untagged, and signposted: with or against the direction it is listed in, null both ways). bbox is the view as south,west,north,east; a view too large is refused with the advice to zoom in. Being on a horse route is no permission to ride it. truncated says the view held more than one answer carries. Reading changes nothing; nothing about the trip goes out.',
    inputSchema: { tripId: idSchema, ...horseRoutesToolRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async findHorseRoutes({ tripId, bbox }: { tripId: number } & HorseRoutesToolRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    const found = await this.horseRoutes.list(parseHorseRoutesQuery({ bbox }).bbox);
    return ok({ ...found, routes: found.routes.map(routeInBrief) });
  }
}
