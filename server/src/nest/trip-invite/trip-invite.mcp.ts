import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import { getAppUrl } from '../../app-config';
import { AuditService } from '../audit/audit.service';
import { DatabaseService } from '../database/database.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { isDemoUserId } from '../common/demo-write';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { canShareTrips, canWrite } from '../../mcp/scopes';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { tripInviteLinkCreateRequestSchema } from '@trek/shared';
import type { TripInviteLinkCreateRequest } from '@trek/shared';
import { TripInviteService, type TripInviteInfo } from './trip-invite.service';

/**
 * Invite-link MCP surface, mirroring TripInviteLinkController. The join half of
 * the domain (GET /api/trip-invites/:token and its accept route) stays out:
 * following an invite is a person deciding to join somebody else's trip, and
 * putting the accept route on a tool would let an assistant walk its user into
 * a trip on the strength of a token it found somewhere.
 *
 * Both scopes, not either: the invite link is managed like the public share
 * link (share_manage on every verb, GET included, because the payload is the
 * credential) but it hands out trip MEMBERSHIP, which is what `trips:write`
 * covers. Requiring both keeps a share-scoped token from adding members and a
 * write-scoped token from minting an anonymous link, and it can only ever be
 * narrower than the route.
 */
@McpController()
export class TripInviteMcp {
  constructor(
    private readonly invites: TripInviteService,
    private readonly db: DatabaseService,
    private readonly env: RuntimeEnvService,
    private readonly guards: McpToolGuardsService,
    private readonly audit: AuditService,
  ) {}

  /** The AuthService.isDemoUser check without the auth graph (demo-write.ts). */
  private isDemoUser(userId: number): boolean {
    return isDemoUserId(this.env, this.db, userId);
  }

  /** Trip access first (404-equivalent), then share_manage, which is requireManage() in the controller. */
  private denyManage(tripId: number, userId: number) {
    if (!this.invites.verifyTripAccess(String(tripId), userId)) return noAccess();
    if (!this.guards.hasTripPermission('share_manage', tripId, userId)) return permissionDenied();
    return null;
  }

  /** The link the client builds around the raw token (client/src/App.tsx: /join/:token). */
  private describe(info: TripInviteInfo) {
    return { ...info, url: `${getAppUrl()}/join/${info.token}` };
  }

  @Tool({
    name: 'get_trip_invite_link',
    description: 'Get the trip\'s current invite link, the one that adds whoever opens it to the trip as a member. Returns null when the trip has none. This is not the read-only public view link: get_share_link is that one.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: (ctx) => canShareTrips(ctx.scopes) && canWrite(ctx.scopes, 'trips'),
  })
  async getTripInviteLink({ tripId }: { tripId: number }, ctx: McpContext) {
    const denied = this.denyManage(tripId, ctx.userId);
    if (denied) return denied;
    const info = this.invites.get(tripId);
    return ok({ invite_link: info ? this.describe(info) : null });
  }

  @Tool({
    name: 'create_trip_invite_link',
    description: 'Create the trip\'s invite link, or rotate it: a trip has exactly one, so calling this again issues a fresh token and the previous link stops working immediately. Anyone with a TREK account who opens the link and signs in becomes a member of the trip, which makes it a different and far stronger thing than create_share_link, whose link only shows a read-only public view. Use add_trip_member instead when the person already has an account and is known by name or email.',
    inputSchema: {
      tripId: z.number().int().positive(),
      expires_in_days: tripInviteLinkCreateRequestSchema.shape.expires_in_days
        .describe('Days until the link stops working; omit, null or 0 leaves it valid until it is rotated or deleted'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: (ctx) => canShareTrips(ctx.scopes) && canWrite(ctx.scopes, 'trips'),
  })
  async createTripInviteLink(
    { tripId, expires_in_days }: { tripId: number } & TripInviteLinkCreateRequest,
    ctx: McpContext,
  ) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    const denied = this.denyManage(tripId, ctx.userId);
    if (denied) return denied;
    // The route's own coercion, kept verbatim: the shared contract admits a
    // digits-only string as well as a number, and anything that does not parse
    // to a finite value means no expiry rather than an error.
    const parsed = expires_in_days != null && String(expires_in_days).trim() !== ''
      ? Number.parseInt(String(expires_in_days))
      : null;
    const days = Number.isFinite(parsed as number) ? parsed : null;
    const info = this.invites.createOrRotate(tripId, ctx.userId, days);
    // Minting a membership credential is audited wherever it happens, so an
    // admin reading the log sees the same row for a link made through an
    // assistant as for one made in the planner. No request here, hence no ip.
    this.audit.writeAudit({
      userId: ctx.userId,
      action: 'trip.invite_link_create',
      resource: String(tripId),
      ip: null,
      details: { expires_in_days: days },
    });
    return ok({ invite_link: this.describe(info) });
  }

  @Tool({
    name: 'delete_trip_invite_link',
    description: 'Revoke the trip\'s invite link. The URL stops working at once, so nobody else can join through it. Members who already joined stay on the trip: remove_trip_member is what takes somebody off it.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: (ctx) => canShareTrips(ctx.scopes) && canWrite(ctx.scopes, 'trips'),
  })
  async deleteTripInviteLink({ tripId }: { tripId: number }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    const denied = this.denyManage(tripId, ctx.userId);
    if (denied) return denied;
    this.invites.remove(tripId);
    this.audit.writeAudit({
      userId: ctx.userId,
      action: 'trip.invite_link_delete',
      resource: String(tripId),
      ip: null,
    });
    return ok({ success: true });
  }
}
