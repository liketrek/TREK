import { ADDON_IDS } from '../../addons';
import { canRead, canReadTrips, canWrite } from '../../mcp/scopes';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_WRITE,
  ok,
  type McpContext,
} from '../../nest-mcp';
import { addonGate, type HasAddons } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { TourPackingLinkService } from './tour-packing-link.service';
import { idSchema, tourPackingLinkRequestSchema, type TourPackingLinkRequest } from '@trek/shared';

const toursOn = addonGate(ADDON_IDS.TOURS);
const packingOn = addonGate(ADDON_IDS.PACKING);

/** A tour's packing link reaches into Packing, so both addons have to be on. */
async function tourPackingOn(ctx: McpContext, self: HasAddons): Promise<boolean> {
  return (await toursOn(ctx, self)) && (await packingOn(ctx, self));
}

const tourIds = {
  tripId: idSchema,
  placeId: idSchema.describe('The place id of the tour, as list_tours gives it'),
};

/**
 * P2D-XD-01: the packing list a tour points at, over the same service and the
 * same checks as REST: reading needs the trip, pointing the tour somewhere and
 * letting go need 'place_edit'. Packing keeps its items; nothing here adds,
 * ticks off or removes one.
 */
@McpController()
export class TourPackingMcp {
  constructor(
    private readonly packingLinks: TourPackingLinkService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  /** The trip open to the user and, for a write, 'place_edit' on it; the refusal to answer, or null. */
  private async refusal(tripId: number, userId: number, write: boolean) {
    if (!(await this.access.findAccessible(tripId, userId))) return noAccess();
    if (write && !(await this.guards.hasTripPermission('place_edit', tripId, userId))) return permissionDenied();
    return null;
  }

  @Tool({
    name: 'get_tour_packing',
    description:
      'Read the packing list a saved tour points at: packing_link names it (category null for the whole packing list of the trip, otherwise one category of it; null while the tour points at nothing), state says how it reads (ready, empty while it holds no item yet, or missing when its category has no item the user can see any more, renamed, cleared or kept to other travellers), and items lists what the user may see of it with quantity and whether each is packed. tour carries the tour’s own facts (type, distance in km, ascent and descent in metres, walking and planned minutes, difficulty, the SAC limit of a hike), unknown ones null, as context for suggesting what to pack. Suggestions stay suggestions: add an item only through the packing tools and only when the user asks for it.',
    inputSchema: tourIds,
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: tourPackingOn,
    access: (ctx) => canReadTrips(ctx.scopes) && canRead(ctx.scopes, 'packing'),
  })
  async getTourPacking({ tripId, placeId }: { tripId: number; placeId: number }, ctx: McpContext) {
    const refused = await this.refusal(tripId, ctx.userId, false);
    if (refused) return refused;
    return ok(await this.packingLinks.view(tripId, placeId, ctx.userId));
  }

  @Tool({
    name: 'link_tour_packing',
    description:
      'Point a saved tour at the packing list of its trip: category null for the whole list, or the name of one of its categories exactly as its items carry it (one the user can see an item of). It replaces what the tour pointed at before. Nothing is copied or changed in the packing list. Needs place_edit on the trip and the Packing addon.',
    inputSchema: { ...tourIds, category: tourPackingLinkRequestSchema.shape.category },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: tourPackingOn,
    access: (ctx) => canWrite(ctx.scopes, 'trips') && canRead(ctx.scopes, 'packing'),
  })
  async linkTourPacking(
    { tripId, placeId, category }: { tripId: number; placeId: number } & TourPackingLinkRequest,
    ctx: McpContext,
  ) {
    const refused = await this.refusal(tripId, ctx.userId, true);
    if (refused) return refused;
    const before = await this.packingLinks.read(tripId, placeId);
    const detail = await this.packingLinks.link(String(tripId), String(placeId), { category }, ctx.userId);
    return ok({ packing_link: detail.packing_link ?? null, previous_link: before.packing_link });
  }

  @Tool({
    name: 'unlink_tour_packing',
    description:
      'Let a saved tour stop pointing at its packing list. The packing list, its categories and its items stay exactly as they are. Needs place_edit on the trip.',
    inputSchema: tourIds,
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: tourPackingOn,
    access: { group: 'trips', mode: 'write' },
  })
  async unlinkTourPacking({ tripId, placeId }: { tripId: number; placeId: number }, ctx: McpContext) {
    const refused = await this.refusal(tripId, ctx.userId, true);
    if (refused) return refused;
    const before = await this.packingLinks.read(tripId, placeId);
    const detail = await this.packingLinks.unlink(String(tripId), String(placeId));
    return ok({ packing_link: detail.packing_link ?? null, previous_link: before.packing_link });
  }
}
