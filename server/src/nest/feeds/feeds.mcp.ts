import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import { getAppUrl } from '../../app-config';
import { DatabaseService } from '../database/database.service';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { isDemoUserId } from '../common/demo-write';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { FeedsService } from './feeds.service';

/**
 * Calendar-feed MCP surface, mirroring the two authenticated token controllers
 * in feeds.controller.ts. Not a port of a legacy registrar: the feeds domain
 * never had MCP tools, so an assistant could produce a one-shot .ics snapshot
 * (export_trip_ics) but could not switch on the live subscription the web UI
 * offers, and the all-trips feed had no MCP counterpart at all.
 *
 * The two consumer routes (GET /api/feed/{trip,user}/:token.ics) stay out on
 * purpose: they are the anonymous endpoints a calendar app polls, not something
 * a model should call, and their only credential is the token in the URL.
 *
 * All eight ride `trips:share`. For the per-trip feed that follows the route,
 * which requires share_manage on every verb including GET; the payload is the
 * credential itself, and the credential is an anonymous read of the trip. The
 * all-trips feed has no trip to hold a permission on (its routes are
 * JwtAuthGuard only), but minting it publishes every trip the user can open
 * behind one unauthenticated URL, so it takes the share scope rather than a
 * read one.
 */
@McpController()
export class FeedsMcp {
  constructor(
    private readonly feeds: FeedsService,
    private readonly db: DatabaseService,
    private readonly env: RuntimeEnvService,
    private readonly guards: McpToolGuardsService,
  ) {}

  /** The AuthService.isDemoUser check without the auth graph (demo-write.ts). */
  private isDemoUser(userId: number): boolean {
    return isDemoUserId(this.env, this.db, userId);
  }

  /**
   * The REST routes take the base URL from APP_URL and fall back to the calling
   * request's own Host header. A tool call has no request to fall back to, so it
   * uses the instance's canonical base-URL resolution (APP_URL, then the first
   * allowed origin, then localhost) and always hands back an absolute,
   * subscribable URL instead of a bare path.
   */
  private base(): string {
    return getAppUrl();
  }

  /** Trip access first (404-equivalent), then share_manage, exactly as TripFeedTokenController is gated. */
  private denyTripFeed(tripId: number, userId: number) {
    if (!this.db.canAccessTrip(tripId, userId)) return noAccess();
    if (!this.guards.hasTripPermission('share_manage', tripId, userId)) return permissionDenied();
    return null;
  }

  // ── One trip's feed ──────────────────────────────────────────────────────

  @Tool({
    name: 'get_trip_calendar_feed',
    description: 'Get the subscribable calendar feed URL of one trip, or null when the feed is switched off. This is a live subscription a calendar app re-reads hourly, so it keeps up with the itinerary. Prefer export_trip_ics when the user wants a one-off .ics file to import once and be done.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'share' },
  })
  async getTripCalendarFeed({ tripId }: { tripId: number }, ctx: McpContext) {
    const denied = this.denyTripFeed(tripId, ctx.userId);
    if (denied) return denied;
    return ok(this.feeds.getTripToken(String(tripId), ctx.userId, this.base()));
  }

  @Tool({
    name: 'enable_trip_calendar_feed',
    description: 'Switch on the subscribable calendar feed of one trip and return its URL. Safe to repeat: a trip that already has a feed keeps the URL it has, so subscriptions somebody already set up survive. The URL carries a secret token and asks for no login, so whoever holds it can read the trip\'s dates.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'share' },
  })
  async enableTripCalendarFeed({ tripId }: { tripId: number }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    const denied = this.denyTripFeed(tripId, ctx.userId);
    if (denied) return denied;
    return ok(this.feeds.generateTripToken(String(tripId), ctx.userId, this.base()));
  }

  @Tool({
    name: 'rotate_trip_calendar_feed',
    description: 'Issue a fresh URL for one trip\'s calendar feed. Every calendar subscribed to the old URL silently stops updating, so use this when the old link leaked or the user asked to cut it off, not to switch the feed on: enable_trip_calendar_feed does that without breaking anything.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'share' },
  })
  async rotateTripCalendarFeed({ tripId }: { tripId: number }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    const denied = this.denyTripFeed(tripId, ctx.userId);
    if (denied) return denied;
    return ok(this.feeds.rotateTripToken(String(tripId), ctx.userId, this.base()));
  }

  @Tool({
    name: 'disable_trip_calendar_feed',
    description: 'Switch off one trip\'s calendar feed. The URL stops resolving and every subscription to it breaks. Calling enable_trip_calendar_feed afterwards hands out a different URL, so everybody has to subscribe again.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'trips', mode: 'share' },
  })
  async disableTripCalendarFeed({ tripId }: { tripId: number }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    const denied = this.denyTripFeed(tripId, ctx.userId);
    if (denied) return denied;
    this.feeds.disableTripToken(String(tripId), ctx.userId);
    // Matches the route, which answers the cleared token as a null URL.
    return ok({ feed_url: null });
  }

  // ── The all-trips feed ───────────────────────────────────────────────────
  // Per user, not per trip: one URL covering every unarchived trip the user
  // owns or is a member of. No trip id, so no trip permission to check either.

  @Tool({
    name: 'get_all_trips_calendar_feed',
    description: 'Get the subscribable calendar feed URL covering every trip the user can open, or null when it is switched off. One feed for the whole travel calendar; get_trip_calendar_feed is the per-trip one.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    access: { group: 'trips', mode: 'share' },
  })
  async getAllTripsCalendarFeed(_input: Record<string, never>, ctx: McpContext) {
    return ok(this.feeds.getUserToken(ctx.userId, this.base()));
  }

  @Tool({
    name: 'enable_all_trips_calendar_feed',
    description: 'Switch on the calendar feed covering every trip the user can open and return its URL. Safe to repeat: an existing feed keeps its URL. The URL needs no login and follows the user\'s trips as they change, so a trip added later shows up in it without anyone re-subscribing.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_WRITE,
    access: { group: 'trips', mode: 'share' },
  })
  async enableAllTripsCalendarFeed(_input: Record<string, never>, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    return ok(this.feeds.generateUserToken(ctx.userId, this.base()));
  }

  @Tool({
    name: 'rotate_all_trips_calendar_feed',
    description: 'Issue a fresh URL for the all-trips calendar feed. Every calendar subscribed to the old URL stops updating. Use it when that link leaked; enable_all_trips_calendar_feed is the way to switch the feed on without breaking existing subscriptions.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    access: { group: 'trips', mode: 'share' },
  })
  async rotateAllTripsCalendarFeed(_input: Record<string, never>, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    return ok(this.feeds.rotateUserToken(ctx.userId, this.base()));
  }

  @Tool({
    name: 'disable_all_trips_calendar_feed',
    description: 'Switch off the all-trips calendar feed. The URL stops resolving and every subscription to it breaks. Per-trip feeds are unaffected: disable_trip_calendar_feed switches those off one at a time.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_DELETE,
    access: { group: 'trips', mode: 'share' },
  })
  async disableAllTripsCalendarFeed(_input: Record<string, never>, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    this.feeds.disableUserToken(ctx.userId);
    return ok({ feed_url: null });
  }
}
