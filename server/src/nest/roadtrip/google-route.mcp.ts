import { z } from 'zod';
import { googleRouteImportSchema, googleRoutePreviewRequestSchema, type GoogleRouteImport } from '@trek/shared';
import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, ok, type McpContext } from '../../nest-mcp';
import { ADDON_IDS } from '../../addons';
import { AddonsService } from '../addons/addons.service';
import { addonGate } from '../addons/addon-gate';
import { GoogleRouteService } from './google-route.service';

@McpController()
export class GoogleRouteMcp {
  constructor(private readonly routes: GoogleRouteService, readonly addons: AddonsService) {}
  @Tool({ name: 'preview_google_maps_route', description: 'Read ordered stops from a Google Maps directions link. No changes are saved. Review geocoded positions and unresolved stops before importing. The exact Google road geometry is not imported.',
    inputSchema: googleRoutePreviewRequestSchema.shape, annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' }, when: addonGate(ADDON_IDS.ROADTRIP) })
  async preview({ url }: { url: string }) { return ok(await this.routes.preview(url)); }

  @Tool({ name: 'import_google_maps_route', description: 'Append reviewed Google Maps stops to an existing trip day in supplied order. Creates places and visits atomically. Requires place and day editing permissions. Existing visits remain. TREK calculates the road geometry; no Google route geometry is preserved.',
    inputSchema: { tripId: z.number().int().positive(), ...googleRouteImportSchema.shape },
    access: { group: 'trips', mode: 'write' }, when: addonGate(ADDON_IDS.ROADTRIP) })
  import(input: GoogleRouteImport & { tripId: number }, ctx: McpContext) { return ok(this.routes.import(input.tripId, ctx.userId, input)); }
}
