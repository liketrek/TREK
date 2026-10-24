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
import { TourChangeUndoService } from './tour-change-undo.service';
import { NotFoundException } from '@nestjs/common';
import { idSchema, tourChangeUndoRequestSchema, type TourChangeUndoRequest } from '@trek/shared';

const undo = tourChangeUndoRequestSchema.shape;
const placeId = idSchema.describe('The place id of the tour, as list_tours gives it');

/** A refusal for a tour this trip does not have, the same text every tool of the tours answers. */
function tourNotFound(err: unknown) {
  if (err instanceof NotFoundException) return errorResult('Tour not found.');
  throw err;
}

/**
 * MCP-T04: a step saved with save_tour_change (MCP-T03) taken back, the way a
 * change is saved: listed, previewed without writing anything, then taken
 * back once the traveller confirmed exactly that step. The preview and the
 * listing read with trip access, as prepare_tour_change does; taking back
 * writes with 'place_edit' on the trip, as save_tour_change and the planner's
 * save over REST ask, and is checked again inside the write. None of it
 * touches a draft in the planner: the planner's own undo stays in the browser.
 */
@McpController()
export class TourChangeUndoMcp {
  constructor(
    private readonly undoer: TourChangeUndoService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'list_tour_change_steps',
    description:
      "List the changes saved to a tour with save_tour_change, the latest first (at most listed_at_most): each step with its id, saved_at, base_revision (the revision it was prepared on), revision (the one it raised the tour to) and the changes as the traveller confirmed them. standing says whether it can be taken back: latest (it is the tour's latest change; prepare_tour_undo checks the rest), undone (taken back already, undone names the revision that raised the tour to and when), later_change (something was saved on top of it since, in the planner or by another step, so taking it back would lose that) or no_earlier_state (the record of the tour before it cannot be read). Edits saved in the planner are no steps and are not listed; a draft in the planner is never seen here. Reads only.",
    inputSchema: { tripId: idSchema, placeId },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async listTourChangeSteps({ tripId, placeId }: { tripId: number; placeId: number }, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    try {
      return ok(await this.undoer.steps(tripId, placeId));
    } catch (err: unknown) {
      return tourNotFound(err);
    }
  }

  @Tool({
    name: 'prepare_tour_undo',
    description:
      "Show what taking back a saved step of a tour (from list_tour_change_steps) would do, without changing anything. Only the tour's latest change can be taken back: a step something was saved on top of since is refused as a conflict, so no later edit is lost, and so is a step taken back already or one whose record of the tour before it cannot be read. Taking back is refused as well, with every reason, when it would remove a station visited or skipped since, or bring back a station whose place of the trip is gone. The answer: prepared_only (always true), step (its id, when it was saved, its revisions and the changes it made), now (the tour as it is: distance_km, walking_minutes and route_pending as stored, each station with done when it was visited or skipped on a day), restored (the tour exactly as it was before the step: its distance and walking time as stored then, route_pending, and each station kept or back, with where it stands now), removed (the stations taking back removes) and undo (step_id and expected_revision for undo_tour_change). Visits of stations that stay are kept, the days and the tour's name and notes are not touched. This is not the planner's undo: a draft in the planner is never seen here, and discarding one never changes a saved tour. Show it to the traveller and take nothing back without their yes. can_undo says whether they may change the trip's places.",
    inputSchema: { tripId: idSchema, placeId, stepId: undo.step_id },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async prepareTourUndo(
    { tripId, placeId, stepId }: { tripId: number; placeId: number; stepId: number },
    ctx: McpContext,
  ) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    try {
      const preview = await this.undoer.prepare(tripId, placeId, stepId);
      const canUndo = await this.guards.hasTripPermission('place_edit', tripId, ctx.userId);
      return ok({ ...preview, can_undo: canUndo });
    } catch (err: unknown) {
      return tourNotFound(err);
    }
  }

  @Tool({
    name: 'undo_tour_change',
    description:
      "Take back a saved step of a tour that prepare_tour_undo showed and the traveller confirmed: the tour is restored exactly as it was before the step, its line, its stations with their keys, and the distance and walking time stored then, whole or not at all. Call it only after the traveller said yes to taking back exactly that step, with step_id and expected_revision as undo of the preview gave them and confirmed true. Everything is checked again before anything is written: a tour changed since the preview is refused as a conflict (prepare it again), and a step that is no longer the latest change, was taken back already, or would now remove a station visited or skipped meanwhile is refused with the reason; the tour then stays as it is. A step is taken back once, and taking back raises the tour's revision like any other save. The answer: undone, step (its id, its revision and undone_revision, the revision taking it back raised the tour to), the tour as now saved (revision, distance_km, walking_minutes, route_pending) and the stations in order with their keys. Read the result with get_tour_plan. It never touches a draft in the planner. Needs place editing permission on the trip.",
    inputSchema: {
      tripId: idSchema,
      placeId,
      step_id: undo.step_id,
      expected_revision: undo.expected_revision,
      confirmed: undo.confirmed,
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async undoTourChange(
    { tripId, placeId, ...request }: { tripId: number; placeId: number } & TourChangeUndoRequest,
    ctx: McpContext,
  ) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    try {
      return ok(await this.undoer.undo(tripId, placeId, ctx.userId, request));
    } catch (err: unknown) {
      return tourNotFound(err);
    }
  }
}
