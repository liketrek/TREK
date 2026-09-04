import { McpController, Tool, TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_NON_IDEMPOTENT, ok, type McpContext } from '../../nest-mcp';
import { z } from 'zod';
import { RoadtripService } from './roadtrip.service';
import { DatabaseService } from '../database/database.service';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { demoDenied, noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { AuthService } from '../auth/auth.service';
import { ADDON_IDS } from '../../addons';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';

/**
 * The whole surface rides the road trip addon, the same way the controller does
 * (`@RequireAddon`). Without the gate the REST route answers 404 on an instance that
 * left the addon off while these four tools kept reading and writing vias, which is
 * exactly the parity the repo forbids breaking.
 */
const roadtripAddonOn = addonGate(ADDON_IDS.ROADTRIP);

/**
 * Road-trip via points over MCP, the same surface the REST routes expose (#1797).
 *
 * Parity is the point: the permission checked here is `day_edit`, the same action string
 * the controller demands, so an assistant can never do through a tool what a person
 * cannot do through the UI. Reads go through the same day-belongs-to-trip check, so a
 * valid day id from another trip is not reachable by way of one the caller can see.
 */
@McpController()
export class RoadtripMcp {
  constructor(
    private readonly roadtrip: RoadtripService,
    private readonly db: DatabaseService,
    private readonly guards: McpToolGuardsService,
    private readonly auth: AuthService,
    readonly addons: AddonsService,
  ) {}

  @Tool({
    name: 'list_route_vias',
    description: 'List the points a day\'s drive is routed through without stopping at them. These bend the route (a scenic road, a pass, avoiding a motorway) and are not stops on the itinerary.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive().optional().describe('Omit to list the vias of every day of the trip'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'read' },
    when: roadtripAddonOn,
  })
  async listVias({ tripId, dayId }: { tripId: number; dayId?: number }, ctx: McpContext) {
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (dayId != null) {
      if (!this.roadtrip.dayExists(dayId, tripId)) return noAccess();
      return ok({ vias: this.roadtrip.listForDay(dayId) });
    }
    return ok({ vias: this.roadtrip.listForTrip(tripId) });
  }

  @Tool({
    name: 'add_route_via',
    description: 'Make a day\'s drive pass through a point without stopping there — use it to send the route over a particular road or away from one. For somewhere the traveller actually stops, add a place and assign it to the day instead.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      after_order_index: z.number().int().min(0).describe('Which stop of the day the via follows, counting from 0'),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
    when: roadtripAddonOn,
  })
  async addVia(
    { tripId, dayId, after_order_index, lat, lng }: { tripId: number; dayId: number; after_order_index: number; lat: number; lng: number },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.roadtrip.dayExists(dayId, tripId)) return noAccess();
    return ok({ via: this.roadtrip.create(dayId, { after_order_index, lat, lng }) });
  }

  @Tool({
    name: 'reanchor_route_vias',
    description: 'Re-pin a day\'s via points after its stops changed. A via records which stop it follows by position, so adding, removing or reordering a stop leaves every later via pointing at the wrong leg and the drive silently reverts to the road it was steered away from. Send the corrected positions for the whole day at once; ids left out keep the position they have.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      vias: z.array(z.object({
        id: z.number().int().positive(),
        after_order_index: z.number().int().min(0).describe('Which stop of the day the via now follows, counting from 0'),
      })).max(500),
      remove: z.array(z.number().int().positive()).max(500).optional()
        .describe('Vias whose leg no longer exists at all — deleting the last stop of a day leaves the leg into it with nothing to sit on'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
    when: roadtripAddonOn,
  })
  async reanchorVias(
    { tripId, dayId, vias, remove }: { tripId: number; dayId: number; vias: { id: number; after_order_index: number }[]; remove?: number[] },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.roadtrip.dayExists(dayId, tripId)) return noAccess();
    return ok({ vias: this.roadtrip.reanchor(dayId, { vias, remove }) });
  }

  @Tool({
    name: 'remove_route_via',
    description: 'Remove a via point, letting the drive take the direct route again.',
    inputSchema: {
      tripId: z.number().int().positive(),
      dayId: z.number().int().positive(),
      viaId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'write' },
    when: roadtripAddonOn,
  })
  async removeVia({ tripId, dayId, viaId }: { tripId: number; dayId: number; viaId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.db.canAccessTrip(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('day_edit', tripId, ctx.userId)) return permissionDenied();
    if (!this.roadtrip.dayExists(dayId, tripId)) return noAccess();
    if (!this.roadtrip.remove(viaId, dayId)) return noAccess();
    return ok({ success: true });
  }
}
