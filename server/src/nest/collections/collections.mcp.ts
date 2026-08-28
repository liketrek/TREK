import {
  McpController, Tool, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, ok,
} from '../../nest-mcp';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { ADDON_IDS } from '../../addons';
import { DatabaseService } from '../database/database.service';
import { CollectionsService } from './collections.service';
import {
  collectionCreateRequestSchema, collectionUpdateRequestSchema,
  collectionSavePlaceRequestSchema, collectionPlaceUpdateRequestSchema,
  collectionCopyToTripRequestSchema, collectionLabelCreateRequestSchema,
  collectionLabelUpdateRequestSchema, collectionLabelAssignRequestSchema,
  collectionInviteRequestSchema, collectionSetStatusFromTripRequestSchema,
  COLLECTION_STATUSES, COLLECTION_ROLES,
} from '@trek/shared';
import type {
  CollectionCreateRequest, CollectionUpdateRequest, CollectionSavePlaceRequest,
  CollectionPlaceUpdateRequest, CollectionCopyToTripRequest, CollectionInviteRequest,
  CollectionLabelCreateRequest, CollectionLabelUpdateRequest, CollectionLabelAssignRequest,
  CollectionSetStatusFromTripRequest, CollectionStatus, CollectionRole,
} from '@trek/shared';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';

/** Convert a thrown service error (httpError carries `.message`) into MCP error text. */
function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Operation failed';
}
function fail(err: unknown) {
  return { content: [{ type: 'text' as const, text: errText(err) }], isError: true };
}

/** Post-fold quirk fix: the legacy registrar registered unconditionally while
 *  REST (CollectionsAddonGuard) and the plugin host (requireAddon) gate on the
 *  collections addon — the decorator port now gates too. */
const collectionsAddonOn = addonGate(ADDON_IDS.COLLECTIONS);

/**
 * Collections MCP surface (#1435) — ported 1:1 from the legacy registrar
 * src/mcp/tools/collections.ts: the full set of actions a member can take on
 * a saved-places list (browse, CRUD lists + places, status, collaborative star
 * ratings, per-list labels, sharing, and copy-into-a-trip) with identical
 * names, descriptions, schemas, annotations and error/payload shapes. Every
 * service call enforces the caller's membership/role, so the tools stay thin
 * wrappers. The legacy `if (R)` / `if (W)` scope checks map to the declarative
 * collections read/write access markers (resolved by trekMcpAccessPolicy),
 * plus the `when:` collections-addon gate the legacy registrar lacked (fixed
 * in the trailing quirk commit — REST and the plugin host always gated).
 */
@McpController()
export class CollectionsMcp {
  constructor(
    private readonly collections: CollectionsService,
    private readonly db: DatabaseService,
    private readonly auth: AuthService,
    readonly addons: AddonsService,
  ) {}

  private denyDemo(userId: number) {
    return this.auth.isDemoUser(userId) ? demoDenied() : null;
  }

  // ── Read ──────────────────────────────────────────────────────────────

  @Tool({
    name: 'list_collections',
    description: 'List all saved-place collections (lists) the user owns or has accepted a share for, plus any pending incoming invites. Use get_collection for a list\'s places.',
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'read' },
  })
  async listCollections(_args: Record<string, never>, ctx: McpContext) {
    try { return ok(this.collections.listCollections(ctx.userId)); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'get_collection',
    description: 'Get one collection with its members, labels, and all saved places. Each place includes rating_avg / rating_count and the per-member ratings (#1435) so you can plan around highly-rated spots.',
    inputSchema: { collectionId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'read' },
  })
  async getCollection({ collectionId }: { collectionId: number }, ctx: McpContext) {
    try { return ok(this.collections.getCollection(ctx.userId, collectionId)); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'available_collection_users',
    description: 'List users who can still be invited to a collection (excludes current members and guests). Use the returned ids with invite_to_collection.',
    inputSchema: { collectionId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'read' },
  })
  async availableCollectionUsers({ collectionId }: { collectionId: number }, ctx: McpContext) {
    try {
      // Owner-only, mirroring the REST gate — availableUsers() itself does no
      // access check, so without this any token could enumerate the user list.
      this.collections.assertAccess(ctx.userId, collectionId);
      if (!this.collections.isOwner(ctx.userId, collectionId)) {
        return { content: [{ type: 'text' as const, text: 'Only the collection owner can view invitable users.' }], isError: true };
      }
      return ok({ users: this.collections.availableUsers(ctx.userId, collectionId) });
    } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'find_place_in_collections',
    description: 'Answer "is this place already on one of my lists?" across the whole library in one call, and name the lists it is on with its status in each. Prefer this over walking get_collection list by list: it applies the same provider-id and coordinate-proximity match the app\'s own saved indicator uses, which a name comparison over the returned places cannot reproduce. Identify the place by google_place_id / google_ftid (from search_place) or by lat+lng; without one of those there is no signal strong enough to claim it is the same place and nothing is reported as saved.',
    inputSchema: {
      google_place_id: z.string().max(200).optional().describe('Google Places id of the place to look up'),
      google_ftid: z.string().max(200).optional().describe('Google feature id (ftid) of the place to look up'),
      name: z.string().max(200).optional().describe('Place name. Carried for parity with the REST lookup and never matched on alone, since every repeated name (any "Starbucks") would answer to it.'),
      lat: z.number().min(-90).max(90).optional().describe('Latitude; pass together with lng to match by location'),
      lng: z.number().min(-180).max(180).optional().describe('Longitude; pass together with lat to match by location'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'read' },
  })
  async findPlaceInCollections(
    query: { google_place_id?: string; google_ftid?: string; name?: string; lat?: number; lng?: number },
    ctx: McpContext,
  ) {
    try { return ok(this.collections.findMembership(ctx.userId, query)); } catch (err) { return fail(err); }
  }

  // ── Collections CRUD ─────────────────────────────────────────────────

  @Tool({
    name: 'create_collection',
    description: 'Create a new saved-place collection (list) owned by the user.',
    inputSchema: collectionCreateRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async createCollection(body: CollectionCreateRequest, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok({ collection: this.collections.createCollection(ctx.userId, body) }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'update_collection',
    description: 'Update a collection\'s name, description, colour, icon, cover, links, or sort order. Owner/admin only.',
    inputSchema: { collectionId: z.number().int().positive(), ...collectionUpdateRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async updateCollection({ collectionId, ...body }: { collectionId: number } & CollectionUpdateRequest, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok({ collection: this.collections.updateCollection(ctx.userId, collectionId, body) }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'delete_collection',
    description: 'Permanently delete a collection and all its saved places. Owner only. This cannot be undone.',
    inputSchema: { collectionId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async deleteCollection({ collectionId }: { collectionId: number }, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { this.collections.deleteCollection(ctx.userId, collectionId); return ok({ success: true }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'reorder_collections',
    description: 'Reorder the user\'s collections. Pass every collection id in the desired order.',
    inputSchema: { orderedIds: z.array(z.number().int().positive()).min(1) },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async reorderCollections({ orderedIds }: { orderedIds: number[] }, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { this.collections.reorderCollections(ctx.userId, orderedIds); return ok({ success: true }); } catch (err) { return fail(err); }
  }

  // ── Places ────────────────────────────────────────────────────────────

  @Tool({
    name: 'save_place_to_collection',
    description: 'Save a place into a collection from a raw payload (name required; set google_place_id/osm_id from search_place for rich details). Returns a duplicate marker instead of saving when a similar place already exists, unless force is true.',
    inputSchema: collectionSavePlaceRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async savePlaceToCollection(body: CollectionSavePlaceRequest, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok(this.collections.savePlace(ctx.userId, body)); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'save_trip_places_to_collection',
    description: 'Copy one or more existing trip places into a collection (the server reads each place). Their star ratings (#1435) travel along for members shared on both. Duplicates are skipped unless force is true.',
    inputSchema: {
      collectionId: z.number().int().positive(),
      tripId: z.number().int().positive(),
      placeIds: z.array(z.number().int().positive()).min(1).max(1000),
      force: z.boolean().optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async saveTripPlacesToCollection(
    { collectionId, tripId, placeIds, force }: { collectionId: number; tripId: number; placeIds: number[]; force?: boolean },
    ctx: McpContext,
  ) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok(this.collections.saveFromTripPlaces(ctx.userId, collectionId, tripId, placeIds, force)); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'update_collection_place',
    description: 'Update a saved place\'s name, address, coordinates (lat/lng), description, notes, status, category, links, tags, labels, image, or move it to another collection (set collection_id).',
    inputSchema: { placeId: z.number().int().positive(), ...collectionPlaceUpdateRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async updateCollectionPlace({ placeId, ...body }: { placeId: number } & CollectionPlaceUpdateRequest, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok({ place: await this.collections.updatePlace(ctx.userId, placeId, body) }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'set_collection_place_status',
    description: 'Set a saved place\'s status: idea, want, or visited.',
    inputSchema: { placeId: z.number().int().positive(), status: z.enum(COLLECTION_STATUSES) },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async setCollectionPlaceStatus({ placeId, status }: { placeId: number; status: CollectionStatus }, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok({ place: this.collections.setStatus(ctx.userId, placeId, status) }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'set_collection_place_status_from_trip',
    description: 'Set a status on every saved copy of the given TRIP places, in every list they are on. Use this after a day out to mark places visited: set_collection_place_status takes one collection_places id, so the same trip place saved to three lists would need three calls and a lookup to find them. Ids here are trip place ids. Lists the user may only read are skipped rather than refused. Returns how many saved places changed and how many of the trip places were found in at least one list.',
    inputSchema: collectionSetStatusFromTripRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async setCollectionPlaceStatusFromTrip(
    { trip_id, place_ids, status }: CollectionSetStatusFromTripRequest,
    ctx: McpContext,
  ) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok(this.collections.setStatusFromTrip(ctx.userId, trip_id, place_ids, status)); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'rate_collection_place',
    description: "Set or clear the current user's 1-5 star rating on a saved collection place (#1435). Every member rates independently; the place shows the average. Pass null (or omit rating) to remove the user's vote. Ratings a member casts here follow the place into any trip it is later copied to. Use the ratings to capture the user's preferences.",
    inputSchema: {
      placeId: z.number().int().positive(),
      rating: z.number().int().min(1).max(5).nullable().optional().describe('1-5 stars; null/omitted clears the vote'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async rateCollectionPlace({ placeId, rating }: { placeId: number; rating?: number | null }, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok({ place: this.collections.setRating(ctx.userId, placeId, rating ?? null) }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'delete_collection_place',
    description: 'Remove a saved place from its collection. Requires delete permission on the list.',
    inputSchema: { placeId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async deleteCollectionPlace({ placeId }: { placeId: number }, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { await this.collections.deletePlace(ctx.userId, placeId); return ok({ success: true }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'copy_collection_places_to_trip',
    description: 'Copy one or more saved collection places into a trip (dedup precheck on the server). Ratings (#1435) travel into the trip; trip members keep voting there. Requires edit access to the target trip.',
    inputSchema: collectionCopyToTripRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async copyCollectionPlacesToTrip(body: CollectionCopyToTripRequest, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok(this.collections.copyToTrip(ctx.userId, body)); } catch (err) { return fail(err); }
  }

  // ── Labels ────────────────────────────────────────────────────────────

  @Tool({
    name: 'create_collection_label',
    description: 'Create a custom per-collection label (name + optional hex colour) for grouping/filtering places.',
    inputSchema: collectionLabelCreateRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async createCollectionLabel({ collection_id, name, color }: CollectionLabelCreateRequest, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok({ label: this.collections.createLabel(ctx.userId, collection_id, name, color) }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'update_collection_label',
    description: 'Rename or recolour a collection label, or change its sort order.',
    inputSchema: { labelId: z.number().int().positive(), ...collectionLabelUpdateRequestSchema.shape },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async updateCollectionLabel({ labelId, ...body }: { labelId: number } & CollectionLabelUpdateRequest, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok({ label: this.collections.updateLabel(ctx.userId, labelId, body) }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'delete_collection_label',
    description: 'Delete a collection label; its assignments on places are cleared.',
    inputSchema: { labelId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async deleteCollectionLabel({ labelId }: { labelId: number }, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { this.collections.deleteLabel(ctx.userId, labelId); return ok({ success: true }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'assign_collection_labels',
    description: 'Add (or with remove=true, take away) one or more labels across a set of saved places. Only labels belonging to each place\'s own list are applied.',
    inputSchema: { ...collectionLabelAssignRequestSchema.shape, remove: z.boolean().optional() },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async assignCollectionLabels(
    { label_ids, place_ids, remove }: CollectionLabelAssignRequest & { remove?: boolean },
    ctx: McpContext,
  ) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { return ok(this.collections.assignLabels(ctx.userId, label_ids, place_ids, remove ?? false)); } catch (err) { return fail(err); }
  }

  // ── Sharing ───────────────────────────────────────────────────────────

  @Tool({
    name: 'invite_to_collection',
    description: 'Invite a user (by id, from available_collection_users) to collaborate on a collection, with a role of viewer, editor, or admin (default editor). Owner only.',
    inputSchema: collectionInviteRequestSchema.shape,
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async inviteToCollection({ collection_id, user_id, role }: CollectionInviteRequest, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    // try/catch added with the post-fold quirk pass — the legacy handler was one
    // of two where an unexpected throw escaped to the SDK instead of isError.
    try {
      const me = this.db.get<{ username: string; email: string }>('SELECT username, email FROM users WHERE id = ?', ctx.userId);
      const res = this.collections.sendInvite(collection_id, ctx.userId, me?.username ?? '', me?.email ?? '', user_id, role);
      if (res.error) return { content: [{ type: 'text' as const, text: res.error }], isError: true };
      return ok({ success: true });
    } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'set_collection_member_role',
    description: 'Change an accepted member\'s permission role (viewer, editor, or admin). Owner only.',
    inputSchema: {
      collectionId: z.number().int().positive(),
      userId: z.number().int().positive(),
      role: z.enum(COLLECTION_ROLES),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async setCollectionMemberRole(
    { collectionId, userId: targetUserId, role }: { collectionId: number; userId: number; role: CollectionRole },
    ctx: McpContext,
  ) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { this.collections.setMemberRole(ctx.userId, collectionId, targetUserId, role); return ok({ success: true }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'remove_collection_member',
    description: 'Remove an accepted member from a shared collection (a kick). Owner only.',
    inputSchema: { collectionId: z.number().int().positive(), userId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async removeCollectionMember(
    { collectionId, userId: targetUserId }: { collectionId: number; userId: number },
    ctx: McpContext,
  ) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { this.collections.removeMember(ctx.userId, collectionId, targetUserId); return ok({ success: true }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'cancel_collection_invite',
    description: 'Cancel a pending invite you sent to a user for a collection. Owner only.',
    inputSchema: { collectionId: z.number().int().positive(), userId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async cancelCollectionInvite(
    { collectionId, userId: targetUserId }: { collectionId: number; userId: number },
    ctx: McpContext,
  ) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { this.collections.cancelInvite(collectionId, ctx.userId, targetUserId); return ok({ success: true }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'accept_collection_invite',
    description: 'Accept a pending invite to join a shared collection.',
    inputSchema: { collectionId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async acceptCollectionInvite({ collectionId }: { collectionId: number }, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    // try/catch added with the post-fold quirk pass (see inviteToCollection).
    try {
      const res = this.collections.acceptInvite(ctx.userId, collectionId, undefined);
      if (res.error) return { content: [{ type: 'text' as const, text: res.error }], isError: true };
      return ok({ success: true });
    } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'decline_collection_invite',
    description: 'Decline a pending invite to a shared collection.',
    inputSchema: { collectionId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async declineCollectionInvite({ collectionId }: { collectionId: number }, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { this.collections.declineInvite(ctx.userId, collectionId, undefined); return ok({ success: true }); } catch (err) { return fail(err); }
  }

  @Tool({
    name: 'leave_collection',
    description: 'Leave a shared collection you are a member of. The owner cannot leave (delete the list instead).',
    inputSchema: { collectionId: z.number().int().positive() },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collectionsAddonOn,
    access: { group: 'collections', mode: 'write' },
  })
  async leaveCollection({ collectionId }: { collectionId: number }, ctx: McpContext) {
    const demo = this.denyDemo(ctx.userId); if (demo) return demo;
    try { this.collections.leaveCollection(ctx.userId, collectionId, undefined); return ok({ success: true }); } catch (err) { return fail(err); }
  }
}
