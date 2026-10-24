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
import { CityWalkBriefingService } from './city-walk-briefing.service';
import {
  cityWalkBriefingRequestSchema,
  cityWalkCreateRequestSchema,
  idSchema,
  type CityWalkBriefingRequest,
  type CityWalkCreateRequest,
} from '@trek/shared';

const create = cityWalkCreateRequestSchema.shape;

/**
 * CW-11: a city walk prepared from a traveller's briefing. The proposal reads
 * only, so turning it down changes nothing; the walk is created once the
 * traveller confirmed it, through the creation the planner's save uses (one
 * write, a key for every station, the links to the trip's places checked, the
 * trip told), with 'place_edit' on the trip, as REST asks. Both plan the way on
 * foot with the router the road trip uses. A refusal of the service is a
 * DomainError, which the registry answers as an error result with the text
 * REST sends.
 */
@McpController()
export class CityWalkMcp {
  constructor(
    private readonly briefing: CityWalkBriefingService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'propose_city_walk',
    description:
      "Propose a city walk for a trip from the traveller's briefing, without saving anything: where it starts (and ends), the time frame (start_time to end_time, on day_id for its date), their interests (themes: culture for museums and sights, parks for parks and viewpoints, food for cafes, places to eat and markets, mixed for a bit of each; mixed when left out), the stations they asked for (wished), the places of the trip it may use (trip_places) and their fixed appointments with their times. Places for the themes come from the same search as search_tour_pois, around the start, the wishes and the appointments, up to theme_places_max (8 when left out); nothing is made up. Answers the stations in order, each with its source and why it is in (found names the theme, the category and where it was found), the walking distance and time from the one before (walk_from_previous: metres, minutes), the arrival and leave times, the stay where the traveller gave it (stay_source given; null when not known: then every later arrival is only the earliest, arrival_is_earliest; the start and the end are passed, stay_source frame), and its opening hours checked against the arrival on that day where they can be read (hours; an earliest arrival only ever shows a conflict that is certain). The order is chosen on estimates; the walk in that order is then planned on foot by TREK's router (the traveller's own routing server where they set one), whose legs give the distances and times (estimate kind routed). Where the router gives no way, they are estimates over the straight distance with an allowance for streets (estimate kind straight_line with street_factor and pace_kmh, and why: router_unavailable, station_off_the_way with the position of the station no way on foot reaches, or ferry_only with the position of the station after which the only way runs by boat, a ferry that is no walking); tell the traveller so. totals keeps walking and stays apart, total_complete only when every stay is known, and minutes_left_for_unknown_stays is what the frame leaves for the stays not known. gaps lists free time before an appointment and at the end, wishes_not_met the wishes and appointments that cannot be kept as asked (closed that day, closed or closing at the arrival, late, after the frame), left_out what was not taken and why, searched what was searched. Wished stations and appointments are always in; an appointment is a must and protected. Show the proposal to the traveller; once they confirm, pass stations_for_create to create_city_walk.",
    inputSchema: { tripId: idSchema, ...cityWalkBriefingRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async proposeCityWalk({ tripId, ...briefing }: { tripId: number } & CityWalkBriefingRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    return ok(await this.briefing.propose(tripId, ctx.userId, briefing));
  }

  @Tool({
    name: 'create_city_walk',
    description:
      'Create a city walk in a trip from stations the traveller confirmed (for instance stations_for_create of propose_city_walk), the way the planner saves a new walk: a new tour of type walk with its stations in their order, each with its name, stay_minutes (0 for a point passed through, null when not known), importance (optional, must, or null for normal), protected (a station any later proposal has to keep where it is), opening_hours as OpenStreetMap writes them and the place of the trip it stands for (linked_place_id; a place that is not of this trip leaves the station unlinked, a tour is refused). The way between the stations is planned on foot by the router the proposal uses, and the walk is saved with it, its distance and its walking time (foot_way planned true). Where the router gives no way (foot_way planned false, with why and position as in the estimate of the proposal), the walk is saved with its stations only (route_pending true, distance and walking time null), and TREK plans the way on foot when someone opens it in the planner and saves it (for ferry_only it shows the crossing there, and the travellers take it as a ferry leg or move a station before it saves); no straight line is stored as a route. Put it on a day with assign_place_to_day and give it a start time with update_assignment_time. Needs place editing permission on the trip. Create it only after the traveller said yes. A change to a walk already saved is prepared with prepare_tour_change and saved with save_tour_change instead.',
    inputSchema: {
      tripId: idSchema.describe('The trip to create the walk in'),
      name: create.name,
      description: create.description,
      stations: create.stations,
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'write' },
  })
  async createCityWalk({ tripId, ...body }: { tripId: number } & CityWalkCreateRequest, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    return ok(await this.briefing.create(tripId, ctx.userId, body));
  }
}
