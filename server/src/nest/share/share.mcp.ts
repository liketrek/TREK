import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE,
  demoDenied, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { canShareTrips } from '../../mcp/scopes';
import { ShareService } from './share.service';

/**
 * Share-link MCP surface — ported 1:1 from the three share tools that lived in
 * the legacy src/mcp/tools/trips.ts registrar (identical names, descriptions,
 * schemas, annotations and error/payload shapes). They stayed behind when the
 * share domain migrated because the `trips:share` scope gate has no
 * declarative `access: { group, mode }` equivalent — all three use the
 * predicate escape hatch instead, preserving the legacy `if (S)` gate exactly.
 */
@McpController()
export class ShareMcp {
  constructor(
    private readonly share: ShareService,
    private readonly auth: AuthService,
    private readonly guards: McpToolGuardsService,
  ) {}

  @Tool({
    name: 'get_share_link',
    description: 'Get the current public share link for a trip, including its permission flags. Returns null if no share link exists.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: (ctx) => canShareTrips(ctx.scopes),
  })
  async getShareLink({ tripId }: { tripId: number }, ctx: McpContext) {
    // Read parity with the REST route GET /api/trips/:tripId/share-link, which
    // requires share_manage on every verb including this one: the payload is the
    // token itself, and a token is an anonymous copy of the trip. Leaving this
    // one on membership alone would just move the same hole to MCP.
    if (!this.share.verifyTripAccess(String(tripId), ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('share_manage', tripId, ctx.userId)) return permissionDenied();
    const link = this.share.get(String(tripId));
    return ok({ link });
  }

  @Tool({
    name: 'create_share_link',
    description: 'Create or update the public share link for a trip. Set permission flags to control what is visible to guests.',
    inputSchema: {
      tripId: z.number().int().positive(),
      share_map: z.boolean().optional().default(true).describe('Share the map and places'),
      share_bookings: z.boolean().optional().default(true).describe('Share reservations'),
      share_packing: z.boolean().optional().default(false).describe('Share packing list'),
      share_budget: z.boolean().optional().default(false).describe('Share budget'),
      share_collab: z.boolean().optional().default(false).describe('Share collab messages'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: (ctx) => canShareTrips(ctx.scopes),
  })
  async createShareLink(
    { tripId, share_map, share_bookings, share_packing, share_budget, share_collab }: {
      tripId: number; share_map?: boolean; share_bookings?: boolean; share_packing?: boolean; share_budget?: boolean; share_collab?: boolean;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.share.verifyTripAccess(String(tripId), ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('share_manage', tripId, ctx.userId)) return permissionDenied();
    // The zod .default()s above fill omitted flags, and ShareService applies
    // the same defaults again for undefined — no re-defaulting needed here.
    const { token, created } = this.share.createOrUpdate(String(tripId), ctx.userId, {
      share_map, share_bookings, share_packing, share_budget, share_collab,
    });
    return ok({ token, created });
  }

  @Tool({
    name: 'delete_share_link',
    description: 'Revoke the public share link for a trip. Guests will no longer be able to access the shared view.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: (ctx) => canShareTrips(ctx.scopes),
  })
  async deleteShareLink({ tripId }: { tripId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.share.verifyTripAccess(String(tripId), ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('share_manage', tripId, ctx.userId)) return permissionDenied();
    this.share.remove(String(tripId));
    return ok({ success: true });
  }
}
