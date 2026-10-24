import { ADDON_IDS } from '../../addons';
import { noAccess } from '../../mcp/tools/_shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, errorResult, ok, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { HikeWaysService } from './hike-ways.service';
import {
  hikeLegWayRequestSchema,
  hikeRoundProposeRequestSchema,
  idSchema,
  type HikeLegWayRequest,
  type HikeRoundProposeRequest,
} from '@trek/shared';

/**
 * RTE-02 and RTE-03 over MCP: the planner's round hikes of a wished length
 * and its other ways for one leg of a hike. Both read only, as propose_hike
 * does (the planner offers them to anyone who can see the trip), and answer a
 * hike proposal of one way per call; the hike is created with create_hike, or
 * a saved one changed with update_tour, once the traveller chose.
 */
@McpController()
export class HikeWaysMcp {
  constructor(
    private readonly ways: HikeWaysService,
    private readonly access: TripAccessService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'propose_round_hike',
    description:
      "Find round hikes of about distance_km out of one start point and back (start: a car park, a station, a hut) and propose one of them, without saving anything, as the Tours planner's round search does: the router plans loops on foot in several directions under max_hiking_difficulty and hiking_preferences, keeps those within a fifth of the length that do not walk the same ground twice, and offers up to three different rounds, a, b and c. One search answers all three, so call it up to three times in one step with round a, b and c, each with along left out, to show them as ways to choose from (a search takes up to about a quarter of a minute). Each answer is the hike proposal propose_hike gives for the round (distance, climb, walking time, SAC grades, schedule and warnings with day_id or date and start_time), with round (key, target_m, deviation_pct, how far it lies off the length, and rounds_found) and create_with, the points to create it through: create_hike with name, create_with.waypoints, round_trip true and the same max_hiking_difficulty and hiking_preferences, only after the traveller chose one. A round that is not there answers found false with ways_found and why (none_found where no round fits, router_unavailable, no_valhalla). The chat shows each round as a card: never list coordinates or figures, say in a sentence what sets the rounds apart.",
    inputSchema: { tripId: idSchema, ...hikeRoundProposeRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async proposeRoundHike({ tripId, ...request }: { tripId: number } & HikeRoundProposeRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    return ok(await this.ways.proposeRound(ctx.userId, tripId, request));
  }

  @Tool({
    name: 'propose_hike_leg_way',
    description:
      "Propose another way for one leg of a hike, as the Tours planner's other ways of a section: the router's other ways on foot between the two points of leg (counted from 1; on a round trip the last leg is the way back) under the hike's max_hiking_difficulty and hiking_preferences, each held by the fewest points on it the router keeps to, at most three, a, b and c. Give the hike as it stands: name, waypoints and round_trip of a proposal, or of a saved hike from get_tour_plan with tour_id (its place id). One search answers all three, so call it up to three times in one step with way a, b and c to show them as ways to choose from. Each answer is the hike proposal propose_hike gives for the whole hike with the leg taken that way, with leg_way (key, leg, ways_found), current (the hike as it runs now: distance_m, ascent_m, duration_minutes) to compare against, and create_with, the hike's points with the way's points set on the leg. Only after the traveller chose one: for a hike not yet saved create_hike with name, create_with.waypoints and create_with.round_trip; for a saved hike update_tour with those waypoints (a round trip ending on its start) and its expected_revision. A way that is not there answers found false with ways_found and why (none_found where the router knows no other way it keeps to). The chat shows each way as a card beside the way it runs now: never list coordinates or figures, say in a sentence how the ways differ.",
    inputSchema: { tripId: idSchema, ...hikeLegWayRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async proposeHikeLegWay({ tripId, ...request }: { tripId: number } & HikeLegWayRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    // The tool's fields are checked one by one; the leg against the hike's points only here.
    const checked = hikeLegWayRequestSchema.safeParse(request);
    if (!checked.success) return errorResult(checked.error.issues.map((issue) => issue.message).join('; '));
    return ok(await this.ways.proposeLegWay(ctx.userId, tripId, checked.data));
  }
}
