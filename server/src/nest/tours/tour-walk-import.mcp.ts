import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { McpController, Tool, TOOL_ANNOTATIONS_OPEN_WORLD_READONLY, ok, type McpContext } from '../../nest-mcp';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { TourWalkImportService } from './tour-walk-import.service';
import { idSchema, walkImportPreviewRequestSchema } from '@trek/shared';

const preview = walkImportPreviewRequestSchema.shape;

/**
 * CW-07: the stops of a Google Maps walking route read from its link, over
 * the same service and the same checks as REST: access to the trip, and
 * 'place_edit' on it, since what comes next creates a tour. A refusal of the
 * link (a car route, a link that does not say, a short link leading elsewhere)
 * is the service's DomainError, which the registry answers as an error result
 * with the same English text REST sends.
 */
@McpController()
export class TourWalkImportMcp {
  constructor(
    private readonly walkImport: TourWalkImportService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the addon gate of the tool here.
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'preview_google_maps_walk',
    description:
      'Read the stops of a Google Maps walking route shared as a link (a maps.app.goo.gl short link or a google.com/maps/dir link), in order, for a city walk (tour_type walk): each stop with the name the link gives it and its position, or null coordinates when the link gives none (such a stop is not looked up or guessed), and resolved_url, the long link that was read. Only a route Google Maps marks as on foot is read; a car, bike or transit route, or one that does not say, is refused. Nothing is saved, and the line drawn in Google Maps is not taken over: TREK plans the way on foot between the stops again when the walk is created. Needs place editing permission on the trip.',
    inputSchema: {
      tripId: idSchema.describe('The trip the walk is meant for'),
      url: preview.url,
    },
    // Open world: a short link is followed to Google on every call.
    annotations: TOOL_ANNOTATIONS_OPEN_WORLD_READONLY,
    when: addonGate(ADDON_IDS.TOURS),
    access: { group: 'trips', mode: 'read' },
  })
  async previewGoogleMapsWalk({ tripId, url }: { tripId: number; url: string }, ctx: McpContext) {
    if (!(await this.access.findAccessible(tripId, ctx.userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, ctx.userId))) return permissionDenied();
    return ok(await this.walkImport.preview(url));
  }
}
