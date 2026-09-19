import { z } from 'zod';
import { googleRouteImportSchema, googleRoutePreviewRequestSchema, type GoogleRouteImport } from '@trek/shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_NON_IDEMPOTENT, ok, type McpContext } from '../../nest-mcp';
import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { addonGate } from '../addons/addon-gate';
import { GoogleRouteService } from './google-route.service';
import { AuthService } from '../auth/auth.service';
import { demoDenied } from '../../mcp/tools/_shared';

@McpController()
export class GoogleRouteMcp {
  constructor(private readonly routes: GoogleRouteService, private readonly auth: AuthService, readonly addons: AddonsService) {}
  @Tool({ name: 'preview_google_maps_route', description: 'Read ordered stops from a Google Maps directions link. No changes are saved. Review geocoded positions and unresolved stops before importing. The exact Google road geometry is not imported.',
    inputSchema: googleRoutePreviewRequestSchema.shape, annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' }, when: addonGate(ADDON_IDS.ROADTRIP) })
  async preview({ url }: { url: string }) { return ok(await this.routes.preview(url)); }

  @Tool({ name: 'import_google_maps_route', description: 'Append reviewed Google Maps stops to an existing trip day in supplied order. Creates places and visits atomically. Requires place and day editing permissions. Existing visits remain. TREK calculates the road geometry; no Google route geometry is preserved.',
    inputSchema: { tripId: z.number().int().positive(), ...googleRouteImportSchema.shape },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    // What the tool writes, not where the link came from: this inserts up to
    // thirty places and their day assignments, which is exactly what create_place
    // and create_and_assign_place are gated on. trips:write does not imply it, and
    // a client that withheld places:write was getting an itinerary written anyway.
    access: { group: 'places', mode: 'write' }, when: addonGate(ADDON_IDS.ROADTRIP) })
  import(input: GoogleRouteImport & { tripId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    return ok(this.routes.import(input.tripId, ctx.userId, input));
  }
}
