import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { db } from '../../db/database';
import { isDemoUser } from '../../services/authService';
import * as collections from '../../services/collectionsService';
import {
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT, demoDenied, ok,
} from './_shared';
import { canRead, canWrite } from '../scopes';
import {
  collectionCreateRequestSchema, collectionUpdateRequestSchema,
  collectionSavePlaceRequestSchema, collectionPlaceUpdateRequestSchema,
  collectionCopyToTripRequestSchema, collectionLabelCreateRequestSchema,
  collectionLabelUpdateRequestSchema, collectionLabelAssignRequestSchema,
  collectionInviteRequestSchema, COLLECTION_STATUSES, COLLECTION_ROLES,
} from '@trek/shared';

/** Convert a thrown service error (httpError carries `.message`) into MCP error text. */
function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Operation failed';
}
function fail(err: unknown) {
  return { content: [{ type: 'text' as const, text: errText(err) }], isError: true };
}

/**
 * Collections MCP surface (#1435) — the full set of actions a member can take on
 * a saved-places list: browse, CRUD lists + places, status, collaborative star
 * ratings, per-list labels, sharing, and copy-into-a-trip. Every service call
 * enforces the caller's membership/role, so the tools stay thin wrappers. Place
 * outputs carry the `ratings`/`rating_avg`/`rating_count` aggregate.
 */
export function registerCollectionTools(server: McpServer, userId: number, scopes: string[] | null): void {
  const R = canRead(scopes, 'collections');
  const W = canWrite(scopes, 'collections');

  const denyDemo = () => (isDemoUser(userId) ? demoDenied() : null);

  // ── Read ──────────────────────────────────────────────────────────────

  if (R) server.registerTool(
    'list_collections',
    {
      description: 'List all saved-place collections (lists) the user owns or has accepted a share for, plus any pending incoming invites. Use get_collection for a list\'s places.',
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async () => {
      try { return ok(collections.listCollections(userId)); } catch (err) { return fail(err); }
    }
  );

  if (R) server.registerTool(
    'get_collection',
    {
      description: 'Get one collection with its members, labels, and all saved places. Each place includes rating_avg / rating_count and the per-member ratings (#1435) so you can plan around highly-rated spots.',
      inputSchema: { collectionId: z.number().int().positive() },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ collectionId }) => {
      try { return ok(collections.getCollection(userId, collectionId)); } catch (err) { return fail(err); }
    }
  );

  if (R) server.registerTool(
    'available_collection_users',
    {
      description: 'List users who can still be invited to a collection (excludes current members and guests). Use the returned ids with invite_to_collection.',
      inputSchema: { collectionId: z.number().int().positive() },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ collectionId }) => {
      try {
        // Owner-only, mirroring the REST gate — availableUsers() itself does no
        // access check, so without this any token could enumerate the user list.
        collections.assertAccess(userId, collectionId);
        if (!collections.isOwner(userId, collectionId)) {
          return { content: [{ type: 'text' as const, text: 'Only the collection owner can view invitable users.' }], isError: true };
        }
        return ok({ users: collections.availableUsers(userId, collectionId) });
      } catch (err) { return fail(err); }
    }
  );

  // ── Collections CRUD ─────────────────────────────────────────────────

  if (W) server.registerTool(
    'create_collection',
    {
      description: 'Create a new saved-place collection (list) owned by the user.',
      inputSchema: collectionCreateRequestSchema.shape,
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async (body) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok({ collection: collections.createCollection(userId, body) }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'update_collection',
    {
      description: 'Update a collection\'s name, description, colour, icon, cover, links, or sort order. Owner/admin only.',
      inputSchema: { collectionId: z.number().int().positive(), ...collectionUpdateRequestSchema.shape },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ collectionId, ...body }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok({ collection: collections.updateCollection(userId, collectionId, body) }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'delete_collection',
    {
      description: 'Permanently delete a collection and all its saved places. Owner only. This cannot be undone.',
      inputSchema: { collectionId: z.number().int().positive() },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ collectionId }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { collections.deleteCollection(userId, collectionId); return ok({ success: true }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'reorder_collections',
    {
      description: 'Reorder the user\'s collections. Pass every collection id in the desired order.',
      inputSchema: { orderedIds: z.array(z.number().int().positive()).min(1) },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ orderedIds }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { collections.reorderCollections(userId, orderedIds); return ok({ success: true }); } catch (err) { return fail(err); }
    }
  );

  // ── Places ────────────────────────────────────────────────────────────

  if (W) server.registerTool(
    'save_place_to_collection',
    {
      description: 'Save a place into a collection from a raw payload (name required; set google_place_id/osm_id from search_place for rich details). Returns a duplicate marker instead of saving when a similar place already exists, unless force is true.',
      inputSchema: collectionSavePlaceRequestSchema.shape,
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async (body) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok(collections.savePlace(userId, body)); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'save_trip_places_to_collection',
    {
      description: 'Copy one or more existing trip places into a collection (the server reads each place). Their star ratings (#1435) travel along for members shared on both. Duplicates are skipped unless force is true.',
      inputSchema: {
        collectionId: z.number().int().positive(),
        tripId: z.number().int().positive(),
        placeIds: z.array(z.number().int().positive()).min(1).max(1000),
        force: z.boolean().optional(),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ collectionId, tripId, placeIds, force }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok(collections.saveFromTripPlaces(userId, collectionId, tripId, placeIds, force)); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'update_collection_place',
    {
      description: 'Update a saved place\'s name, description, notes, status, category, links, tags, labels, image, or move it to another collection (set collection_id).',
      inputSchema: { placeId: z.number().int().positive(), ...collectionPlaceUpdateRequestSchema.shape },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ placeId, ...body }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok({ place: collections.updatePlace(userId, placeId, body) }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'set_collection_place_status',
    {
      description: 'Set a saved place\'s status: idea, want, or visited.',
      inputSchema: { placeId: z.number().int().positive(), status: z.enum(COLLECTION_STATUSES) },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ placeId, status }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok({ place: collections.setStatus(userId, placeId, status) }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'rate_collection_place',
    {
      description: "Set or clear the current user's 1-5 star rating on a saved collection place (#1435). Every member rates independently; the place shows the average. Pass null (or omit rating) to remove the user's vote. Ratings a member casts here follow the place into any trip it is later copied to. Use the ratings to capture the user's preferences.",
      inputSchema: {
        placeId: z.number().int().positive(),
        rating: z.number().int().min(1).max(5).nullable().optional().describe('1-5 stars; null/omitted clears the vote'),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ placeId, rating }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok({ place: collections.setRating(userId, placeId, rating ?? null) }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'delete_collection_place',
    {
      description: 'Remove a saved place from its collection. Requires delete permission on the list.',
      inputSchema: { placeId: z.number().int().positive() },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ placeId }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { collections.deletePlace(userId, placeId); return ok({ success: true }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'copy_collection_places_to_trip',
    {
      description: 'Copy one or more saved collection places into a trip (dedup precheck on the server). Ratings (#1435) travel into the trip; trip members keep voting there. Requires edit access to the target trip.',
      inputSchema: collectionCopyToTripRequestSchema.shape,
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async (body) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok(collections.copyToTrip(userId, body)); } catch (err) { return fail(err); }
    }
  );

  // ── Labels ────────────────────────────────────────────────────────────

  if (W) server.registerTool(
    'create_collection_label',
    {
      description: 'Create a custom per-collection label (name + optional hex colour) for grouping/filtering places.',
      inputSchema: collectionLabelCreateRequestSchema.shape,
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ collection_id, name, color }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok({ label: collections.createLabel(userId, collection_id, name, color) }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'update_collection_label',
    {
      description: 'Rename or recolour a collection label, or change its sort order.',
      inputSchema: { labelId: z.number().int().positive(), ...collectionLabelUpdateRequestSchema.shape },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ labelId, ...body }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok({ label: collections.updateLabel(userId, labelId, body) }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'delete_collection_label',
    {
      description: 'Delete a collection label; its assignments on places are cleared.',
      inputSchema: { labelId: z.number().int().positive() },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ labelId }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { collections.deleteLabel(userId, labelId); return ok({ success: true }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'assign_collection_labels',
    {
      description: 'Add (or with remove=true, take away) one or more labels across a set of saved places. Only labels belonging to each place\'s own list are applied.',
      inputSchema: { ...collectionLabelAssignRequestSchema.shape, remove: z.boolean().optional() },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ label_ids, place_ids, remove }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { return ok(collections.assignLabels(userId, label_ids, place_ids, remove ?? false)); } catch (err) { return fail(err); }
    }
  );

  // ── Sharing ───────────────────────────────────────────────────────────

  if (W) server.registerTool(
    'invite_to_collection',
    {
      description: 'Invite a user (by id, from available_collection_users) to collaborate on a collection, with a role of viewer, editor, or admin (default editor). Owner only.',
      inputSchema: collectionInviteRequestSchema.shape,
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ collection_id, user_id, role }) => {
      const demo = denyDemo(); if (demo) return demo;
      const me = db.prepare('SELECT username, email FROM users WHERE id = ?').get(userId) as { username: string; email: string } | undefined;
      const res = collections.sendInvite(collection_id, userId, me?.username ?? '', me?.email ?? '', user_id, role);
      if (res.error) return { content: [{ type: 'text' as const, text: res.error }], isError: true };
      return ok({ success: true });
    }
  );

  if (W) server.registerTool(
    'set_collection_member_role',
    {
      description: 'Change an accepted member\'s permission role (viewer, editor, or admin). Owner only.',
      inputSchema: {
        collectionId: z.number().int().positive(),
        userId: z.number().int().positive(),
        role: z.enum(COLLECTION_ROLES),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ collectionId, userId: targetUserId, role }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { collections.setMemberRole(userId, collectionId, targetUserId, role); return ok({ success: true }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'remove_collection_member',
    {
      description: 'Remove an accepted member from a shared collection (a kick). Owner only.',
      inputSchema: { collectionId: z.number().int().positive(), userId: z.number().int().positive() },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ collectionId, userId: targetUserId }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { collections.removeMember(userId, collectionId, targetUserId); return ok({ success: true }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'cancel_collection_invite',
    {
      description: 'Cancel a pending invite you sent to a user for a collection. Owner only.',
      inputSchema: { collectionId: z.number().int().positive(), userId: z.number().int().positive() },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ collectionId, userId: targetUserId }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { collections.cancelInvite(collectionId, userId, targetUserId); return ok({ success: true }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'accept_collection_invite',
    {
      description: 'Accept a pending invite to join a shared collection.',
      inputSchema: { collectionId: z.number().int().positive() },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ collectionId }) => {
      const demo = denyDemo(); if (demo) return demo;
      const res = collections.acceptInvite(userId, collectionId, undefined);
      if (res.error) return { content: [{ type: 'text' as const, text: res.error }], isError: true };
      return ok({ success: true });
    }
  );

  if (W) server.registerTool(
    'decline_collection_invite',
    {
      description: 'Decline a pending invite to a shared collection.',
      inputSchema: { collectionId: z.number().int().positive() },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ collectionId }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { collections.declineInvite(userId, collectionId, undefined); return ok({ success: true }); } catch (err) { return fail(err); }
    }
  );

  if (W) server.registerTool(
    'leave_collection',
    {
      description: 'Leave a shared collection you are a member of. The owner cannot leave (delete the list instead).',
      inputSchema: { collectionId: z.number().int().positive() },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ collectionId }) => {
      const demo = denyDemo(); if (demo) return demo;
      try { collections.leaveCollection(userId, collectionId, undefined); return ok({ success: true }); } catch (err) { return fail(err); }
    }
  );
}
