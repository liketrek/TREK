import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_WRITE,
  errorResult,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { withoutLine } from './tour-activities.helpers';
import { TourActivitiesService } from './tour-activities.service';
import { NotFoundException } from '@nestjs/common';
import {
  idSchema,
  tourActivityAssignRequestSchema,
  type TourActivityAssignRequest,
  type TourDetailResponse,
} from '@trek/shared';

const assign = tourActivityAssignRequestSchema.shape;

/** The tour after the change, its recordings without their lines. */
function answer(detail: TourDetailResponse) {
  return { ...detail, activities: (detail.activities ?? []).map(withoutLine) };
}

/**
 * ACT-01: assigning a recorded track to a tour and taking it off, over the
 * same service and the same checks as REST: access to the trip, then
 * 'place_edit' on it. What a tour's recordings measure is read with
 * get_tour_plan.
 */
@McpController()
export class TourActivitiesMcp {
  constructor(
    private readonly activities: TourActivitiesService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  /** The checks every tool here runs first: the trip is the user's to see, and theirs to change tours in. */
  private async refusal(tripId: number, userId: number) {
    if (!(await this.access.findAccessible(tripId, userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, userId))) return permissionDenied();
    return null;
  }

  @Tool({
    name: 'assign_tour_track',
    description:
      'Assign a recorded track to a saved tour, as the way the tour was actually done, once the user has chosen the track and confirmed it. The track is another tour of the same trip that came in through the GPX import or from wanderer and was not planned over (list_tours: origin gpx or wanderer, has_waypoints false); it keeps its own name and source. assignment_id is the execution, one of the day assignments of the tour (find_tours_for_day and get_tour_plan show its days), or null for none; an execution that already has a track gets this one instead (null replaces every track without a day, of which there can be several once their days are gone), and the track moves there if it was on another execution of the same tour. A track documents one tour only. The planned line, measures and times of the tour stay exactly as they are; what the recording measures (distance, ascent, descent, and the time from its first to its last point, only where the file carried times) is answered under activities and read again with get_tour_plan. Never assign a track the user did not pick.',
    inputSchema: {
      tripId: idSchema,
      placeId: idSchema.describe('The place id of the planned tour, as list_tours gives it'),
      track_place_id: assign.track_place_id.describe('The place id of the recorded track, a tour of the same trip'),
      assignment_id: assign.assignment_id.describe('The day assignment of the tour it was done on, or null'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async assignTourTrack(
    { tripId, placeId, ...body }: { tripId: number; placeId: number } & TourActivityAssignRequest,
    ctx: McpContext,
  ) {
    const refusal = await this.refusal(tripId, ctx.userId);
    if (refusal) return refusal;
    try {
      return ok(answer(await this.activities.assign(String(tripId), String(placeId), body, ctx.userId)));
    } catch (err: unknown) {
      if (err instanceof NotFoundException) return errorResult('Tour or recorded track not found.');
      throw err;
    }
  }

  @Tool({
    name: 'unassign_tour_track',
    description:
      'Take a recorded track off a saved tour again, by the id get_tour_plan lists it under activities. The track stays in the trip as the import it is, and nothing of the tour changes.',
    inputSchema: {
      tripId: idSchema,
      placeId: idSchema.describe('The place id of the planned tour, as list_tours gives it'),
      activityId: idSchema.describe('The id of the assignment, from get_tour_plan activities'),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async unassignTourTrack(
    { tripId, placeId, activityId }: { tripId: number; placeId: number; activityId: number },
    ctx: McpContext,
  ) {
    const refusal = await this.refusal(tripId, ctx.userId);
    if (refusal) return refusal;
    try {
      return ok(answer(await this.activities.unassign(String(tripId), String(placeId), activityId)));
    } catch (err: unknown) {
      if (err instanceof NotFoundException) return errorResult('Recorded track not found.');
      throw err;
    }
  }
}
