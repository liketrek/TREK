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
import { TourChangePreviewService } from './tour-change-preview.service';
import { TourChangeSaveService } from './tour-change-save.service';
import { NotFoundException } from '@nestjs/common';
import {
  idSchema,
  tourChangeRequestSchema,
  tourChangeSaveRequestSchema,
  type TourChangeRequest,
  type TourChangeSaveRequest,
} from '@trek/shared';

const save = tourChangeSaveRequestSchema.shape;

/**
 * MCP-T02: a change to a saved tour prepared for the traveller to review,
 * read only like propose_city_walk: nothing is saved while it is prepared,
 * and turning it down leaves the plan as it was. A change the rules of the
 * tour refuse is the service's DomainError, which the registry answers as an
 * error result naming every refused change and why. can_save tells the
 * assistant whether this traveller may save changes to the trip's places at
 * all, so a proposal is never offered as something they could apply when
 * they cannot.
 *
 * MCP-T03: the proposal the traveller confirmed is saved with 'place_edit'
 * on the trip, as the planner's save over REST asks, whole or not at all and
 * never over a tour that moved on since it was prepared.
 */
@McpController()
export class TourChangeMcp {
  constructor(
    private readonly preview: TourChangePreviewService,
    private readonly saver: TourChangeSaveService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'prepare_tour_change',
    description:
      "Prepare a change to a saved tour for the traveller to review, without saving anything: no tour, station, visit or day plan changes, and turning it down keeps the plan as it is. Read the tour with get_tour_plan first. A city walk (tour_type walk) takes changes so far; every other type, and a walk that is a recorded track without stations of its own, is refused with the reason. changes apply in order, each naming saved stations by their key: add (a new station after after_key; a spontaneous stop is an add after the station the traveller is at), remove, replace (a new station in the place of key), move (key to after after_key) and edit (what station key says of itself: name, stay_minutes with 0 for a point passed through and null for not known, importance optional or must with null for normal, protected, opening_hours; only the fields given change, the station stays where it is, and a protected or already visited station takes an edit too). reverse turns the whole walk round (a loop stays a loop from the same start) and close_loop adds the way back from its last station to its start; each of them is the only change of its proposal besides edits, a walk under way (a station visited or skipped) is not reversed, nor one with a protected station off its start. Stops put after the same station keep the order given. Edits alone keep the walk's saved way and walking time. A station protected, or visited or skipped on any day of the walk, is never removed, replaced or moved, nothing is put before the last station already done, and a leg drawn by hand stays as drawn (the closing leg of a loop included); such a change is refused, and so is the whole proposal, with every reason in the error. The answer: prepared_only (always true), base (the tour and the revision it was prepared on: a save has to name it, and a tour changed since is refused rather than overwritten, so prepare again), stations_after (each with its key, null for a new one, change kept, added, replaced or moved, by_change, was_position and what it replaces), removed, effects (walking: the whole way on foot before and after planned by TREK's router and the change in metres and minutes, the distance and walking time stored with the walk apart; stays: known minutes and unknown stays before and after; legs: each leg after, new ones marked), data_gaps (what could not be worked out and why: no way from the router, stays not known, no arrival times, shaping points dropped because the leg they steered changed), warnings (a must station removed or replaced), for_later (each new station not yet a place of the trip as create_place takes it, to keep it as a place instead; a station with linked_place_id already is one and is left out) and waypoints_after. proposal_id names this very proposal for save_tour_change. Show every change and its effects to the traveller and save nothing without their yes. can_save says whether they may change the trip's places.",
    inputSchema: {
      tripId: idSchema,
      placeId: idSchema.describe('The place id of the tour, as list_tours gives it'),
      changes: tourChangeRequestSchema.shape.changes,
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async prepareTourChange(
    { tripId, placeId, changes }: { tripId: number; placeId: number } & TourChangeRequest,
    ctx: McpContext,
  ) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    try {
      const proposal = await this.preview.prepare(tripId, placeId, ctx.userId, { changes });
      const canSave = await this.guards.hasTripPermission('place_edit', tripId, ctx.userId);
      return ok({ ...proposal, can_save: canSave });
    } catch (err: unknown) {
      if (err instanceof NotFoundException) return errorResult('Tour not found.');
      throw err;
    }
  }

  @Tool({
    name: 'save_tour_change',
    description:
      "Save a change to a saved tour that prepare_tour_change prepared and the traveller confirmed, whole or not at all. Call it only after the traveller said yes to the proposal exactly as it was shown to them, with confirmed true, the same changes, expected_revision set to base.revision and the proposal_id of that proposal; anything else is refused and nothing is saved. Before anything is written the trip permission and the tour are checked again: a tour changed since the proposal was prepared is refused as a conflict (prepare the change again from get_tour_plan, never retry the old one), a proposal already saved, a save sent again after its answer was lost, writes nothing and answers already_saved with the step it was saved as (never prepare or save it again), and a change the rules no longer allow (a station visited or skipped meanwhile, a place of the trip gone) is refused with every reason. The save writes the stations, their keys and the way on foot as the planner's save does, planned by the same router as the proposal: where the router gives no way the walk keeps its stations only (route_pending true, distance and walking time null) until the planner plans it. Stations kept keep their keys and their visits. The answer: saved, step (its id, base_revision and the revision the save raised the tour to; the step keeps the changes and the tour as it was before, so it can be taken back with prepare_tour_undo and undo_tour_change while it is the latest change, and nothing of the conversation), the tour as now saved (revision, distance_km, walking_minutes, route_pending), foot_way (planned, or why not) and the stations in order with their keys. Read the result with get_tour_plan. A new walk has no revision yet: create it with create_city_walk instead. Needs place editing permission on the trip.",
    inputSchema: {
      tripId: idSchema,
      placeId: idSchema.describe('The place id of the tour, as list_tours gives it'),
      changes: save.changes,
      expected_revision: save.expected_revision,
      proposal_id: save.proposal_id,
      confirmed: save.confirmed,
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async saveTourChange(
    { tripId, placeId, ...request }: { tripId: number; placeId: number } & TourChangeSaveRequest,
    ctx: McpContext,
  ) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    try {
      return ok(await this.saver.save(tripId, placeId, ctx.userId, request));
    } catch (err: unknown) {
      if (err instanceof NotFoundException) return errorResult('Tour not found.');
      throw err;
    }
  }
}
