import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import {
  McpController,
  Tool,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  TOOL_ANNOTATIONS_READONLY,
  ok,
  type McpContext,
} from '../../nest-mcp';
import type { HasAddons } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { ToursWandererService } from './tours-wanderer.service';
import {
  idSchema,
  wandererMcpImportRequestSchema,
  wandererMcpPreviewRequestSchema,
  wandererMcpSearchRequestSchema,
  wandererMcpSourceRequestSchema,
  type WandererMcpImportRequest,
  type WandererMcpPreviewRequest,
  type WandererMcpSearchRequest,
  type WandererMcpSourceRequest,
} from '@trek/shared';

/** Offered only while the admin allows wanderer under Tours, as WandererEnabledGuard lets its routes through. */
const wandererOn = (_ctx: McpContext, self: HasAddons): Promise<boolean> => self.addons.isWandererAvailable();

/**
 * The trip-side wanderer routes over MCP (ToursWandererController): the
 * caller's own wanderer trails searched, one previewed, imported as a tour
 * of the trip, and a tour imported from it checked against its source. Each
 * runs on the caller's own connection with 'place_edit' on the trip, as REST
 * asks it of every route there (looking is the first step of importing). The
 * import writes the snapshot through the same service, which tells the trip
 * about it (tours:changed and place:created) without leaving out any socket.
 * A refusal of the service is a DomainError, which the registry answers as an
 * error result with the text REST sends.
 */
@McpController()
export class ToursWandererMcp {
  constructor(
    private readonly wanderer: ToursWandererService,
    private readonly access: TripAccessService,
    private readonly guards: McpToolGuardsService,
    // Read by the wanderer gate of every tool here.
    readonly addons: AddonsService,
  ) {}

  /** Trip access and 'place_edit', as the REST routes' guards ask them; the refusal to answer, or null. */
  private async refusal(tripId: number, userId: number) {
    if (!(await this.access.findAccessible(tripId, userId))) return noAccess();
    if (!(await this.guards.hasTripPermission('place_edit', tripId, userId))) return permissionDenied();
    return null;
  }

  @Tool({
    name: 'search_wanderer_trails',
    description:
      "Search the traveller's own wanderer trails (their connected wanderer instance, a trail database) by words (q: a place, summit or region), page and part of the map (bbox), for a trip. The answer lists trails with id, name, description, location, distanceM, durationS, elevationGainM, elevationLossM, difficulty (easy, moderate, difficult), public, author, externalUrl and importedAs (the tours of this trip already imported from the trail), with total, page and pageSize. A traveller without a wanderer connection gets an error saying so. Preview a trail with preview_wanderer_trail before importing it. Needs place editing permission on the trip.",
    inputSchema: { tripId: idSchema, ...wandererMcpSearchRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: wandererOn,
    access: { group: 'trips', mode: 'read' },
  })
  async searchTrails({ tripId, q, page, bbox }: { tripId: number } & WandererMcpSearchRequest, ctx: McpContext) {
    const refused = await this.refusal(tripId, ctx.userId);
    if (refused) return refused;
    const found = await this.wanderer.search(String(tripId), ctx.userId, { q: q ?? '', page: page ?? 1, bbox });
    // The instance's simplified lines are for a map; the model plans with the facts.
    return ok({ ...found, trails: found.trails.map(({ line: _line, ...trail }) => trail) });
  }

  @Tool({
    name: 'preview_wanderer_trail',
    description:
      'Preview one wanderer trail before it is imported into the trip, without writing anything: its facts, distanceKm, elevationGainM and elevationLossM measured from its full GPX, points, contentHash (what import_wanderer_trail takes), state (new: not in the trip yet; unchanged: already imported as it is; changed: imported, and the trail changed since), snapshot (the tour imported last: placeId, name, importedAt, editedLocally) and changes (name, description, route). The chat shows the trail as a card: never list its figures, say in a sentence what matters. Import it only after the traveller said yes. Needs place editing permission on the trip.',
    inputSchema: { tripId: idSchema, ...wandererMcpPreviewRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: wandererOn,
    access: { group: 'trips', mode: 'read' },
  })
  async previewTrail(
    { tripId, trailId, include_geometry }: { tripId: number } & WandererMcpPreviewRequest,
    ctx: McpContext,
  ) {
    const refused = await this.refusal(tripId, ctx.userId);
    if (refused) return refused;
    const { line, trail, ...preview } = await this.wanderer.preview(String(tripId), ctx.userId, trailId);
    const { line: _simplified, ...facts } = trail;
    return ok({ ...preview, trail: facts, ...(include_geometry === true ? { line_geometry: line } : {}) });
  }

  @Tool({
    name: 'import_wanderer_trail',
    description:
      "Import a wanderer trail into the trip as a tour (a hike with the trail's full line, its source noted), as the Tours tab's wanderer import does: trailId and the contentHash preview_wanderer_trail gave. Refused when the trail changed since the preview (preview it again) or when the trip already holds this very content (the error names its placeId). An earlier import of the trail stays as it is: a changed trail comes in as a new tour beside it. The answer is the tour as list_tours reads it (tour.place_id is its id). Needs place editing permission on the trip. Import only after the traveller said yes.",
    inputSchema: { tripId: idSchema, ...wandererMcpImportRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: wandererOn,
    access: { group: 'trips', mode: 'write' },
  })
  async importTrail({ tripId, ...request }: { tripId: number } & WandererMcpImportRequest, ctx: McpContext) {
    const refused = await this.refusal(tripId, ctx.userId);
    if (refused) return refused;
    return ok(await this.wanderer.import(String(tripId), ctx.userId, request));
  }

  @Tool({
    name: 'check_tour_source',
    description:
      "Ask wanderer whether the trail a tour of the trip was imported from (origin wanderer) changed since, without changing the tour. state: unchanged, changed (changes names name, description or route; reimport has the trailId and contentHash to import the trail again as a new tour, which import_wanderer_trail does once the traveller said yes), unknown (imported before TREK kept a fingerprint; reimport is given), unavailable (the trail is gone or no longer the traveller's to read), not_connected (no wanderer connection) or other_instance (the connection is to another instance). editedLocally says whether the tour was changed in TREK since the import. A tour that did not come from wanderer is refused. Needs place editing permission on the trip.",
    inputSchema: { tripId: idSchema, ...wandererMcpSourceRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: wandererOn,
    access: { group: 'trips', mode: 'read' },
  })
  async checkSource({ tripId, placeId }: { tripId: number } & WandererMcpSourceRequest, ctx: McpContext) {
    const refused = await this.refusal(tripId, ctx.userId);
    if (refused) return refused;
    return ok(await this.wanderer.checkSource(String(tripId), ctx.userId, String(placeId)));
  }
}
