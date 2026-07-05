import { placeCategorySchema } from '../place/place.schema';
import { tagSchema } from '../tag/tag.schema';

import { z } from 'zod';

export const COLLECTION_STATUSES = ['idea', 'want', 'visited'] as const;
export const collectionStatusSchema = z.enum(COLLECTION_STATUSES).catch('idea').default('idea');
export type CollectionStatus = (typeof COLLECTION_STATUSES)[number];

/** Per-member permission on a shared list. viewer = read + copy-to-trip only;
 *  editor (default) = add + edit places; admin = full incl. delete. The owner
 *  is always full and is not a member row. */
export const COLLECTION_ROLES = ['viewer', 'editor', 'admin'] as const;
export const collectionRoleSchema = z.enum(COLLECTION_ROLES).catch('editor').default('editor');
export type CollectionRole = (typeof COLLECTION_ROLES)[number];

/** A user-added link on a list or a saved place (stored as a JSON array). */
export const collectionLinkSchema = z.object({
  label: z.string().max(120).optional(),
  // http/https only — blocks javascript:/data: hrefs and forces an absolute link.
  url: z
    .string()
    .trim()
    .max(2000)
    .regex(/^https?:\/\/.+/i),
});
export type CollectionLink = z.infer<typeof collectionLinkSchema>;
export const collectionLinksSchema = z.array(collectionLinkSchema).max(30);

/** A custom label defined per-collection (distinct from the instance-wide tags).
 *  Members group and filter a list's places by these. */
export const collectionLabelSchema = z.object({
  id: z.number(),
  collection_id: z.number(),
  name: z.string(),
  color: z.string().nullable().optional(),
  sort_order: z.number().optional(),
});
export type CollectionLabel = z.infer<typeof collectionLabelSchema>;

/** A saved place — assignmentPlace minus itinerary, plus status + provenance. */
export const collectionPlaceSchema = z.object({
  id: z.number(),
  collection_id: z.number(),
  owner_id: z.number().optional(),
  saved_by: z.number().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  google_place_id: z.string().nullable().optional(),
  google_ftid: z.string().nullable().optional(),
  osm_id: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: collectionStatusSchema,
  source_trip_id: z.number().nullable().optional(),
  source_place_id: z.number().nullable().optional(),
  sort_order: z.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  links: collectionLinksSchema.optional(),
  category: placeCategorySchema.optional(),
  tags: z.array(tagSchema.partial()).optional(),
  /** Ids of the per-collection labels assigned to this place. */
  label_ids: z.array(z.number()).optional(),
});
export type CollectionPlace = z.infer<typeof collectionPlaceSchema>;

/** Member of a shared list (mirrors vacay person rows). */
export const collectionMemberSchema = z.object({
  user_id: z.number(),
  username: z.string(),
  email: z.string().optional(),
  avatar: z.string().nullable().optional(),
  status: z.enum(['pending', 'accepted']),
  role: collectionRoleSchema.optional(),
  is_owner: z.boolean().optional(),
});
export type CollectionMember = z.infer<typeof collectionMemberSchema>;

/** A list, with computed counts + membership for the current viewer. */
export const collectionSchema = z.object({
  id: z.number(),
  owner_id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  cover_image: z.string().nullable().optional(),
  links: collectionLinksSchema.optional(),
  sort_order: z.number().optional(),
  place_count: z.number().optional(),
  is_owner: z.boolean().optional(),
  members: z.array(collectionMemberSchema).optional(),
  labels: z.array(collectionLabelSchema).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Collection = z.infer<typeof collectionSchema>;

// ── Requests ──────────────────────────────────────────────────────────────
export const collectionCreateRequestSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    .optional(),
  icon: z.string().max(40).optional(),
  cover_image: z.string().max(500).nullable().optional(),
  links: collectionLinksSchema.optional(),
});
export type CollectionCreateRequest = z.infer<typeof collectionCreateRequestSchema>;

export const collectionUpdateRequestSchema = collectionCreateRequestSchema.partial().extend({
  sort_order: z.number().optional(),
});
export type CollectionUpdateRequest = z.infer<typeof collectionUpdateRequestSchema>;

/** Save a place into a list from a raw maps/manual payload (or carrying provenance). */
export const collectionSavePlaceRequestSchema = z.object({
  collection_id: z.number(),
  source_place_id: z.number().nullable().optional(),
  source_trip_id: z.number().nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  google_place_id: z.string().nullable().optional(),
  google_ftid: z.string().nullable().optional(),
  osm_id: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  status: collectionStatusSchema.optional(),
  links: collectionLinksSchema.optional(),
  tag_ids: z.array(z.number()).optional(),
  force: z.boolean().optional(), // "add anyway" over a dedup match
});
export type CollectionSavePlaceRequest = z.infer<typeof collectionSavePlaceRequestSchema>;

/** DEDICATED DTO for POST /places/from-trip — the server reads the place, so no place payload. */
export const collectionSaveFromTripRequestSchema = z.object({
  collection_id: z.number(),
  source_trip_id: z.number(),
  source_place_id: z.number(),
  force: z.boolean().optional(),
});
export type CollectionSaveFromTripRequest = z.infer<typeof collectionSaveFromTripRequestSchema>;

/** Bulk: copy several selected trip places into a list at once. */
export const collectionSaveFromTripManyRequestSchema = z.object({
  collection_id: z.number(),
  source_trip_id: z.number(),
  source_place_ids: z.array(z.number()).min(1).max(1000),
  force: z.boolean().optional(),
});
export type CollectionSaveFromTripManyRequest = z.infer<typeof collectionSaveFromTripManyRequestSchema>;

export const collectionPlaceUpdateRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  // .removeDefault() strips the inner .default('idea') so an ABSENT status parses to
  // undefined (left unchanged) instead of being injected as 'idea' (see #1437). The
  // .catch('idea') guard against invalid values is preserved.
  status: collectionStatusSchema.removeDefault().optional(),
  category_id: z.number().nullable().optional(),
  collection_id: z.number().optional(), // move to another list
  links: collectionLinksSchema.optional(),
  tag_ids: z.array(z.number()).optional(),
  // Replace the place's per-collection label assignments (omit to leave unchanged).
  label_ids: z.array(z.number()).optional(),
});
export type CollectionPlaceUpdateRequest = z.infer<typeof collectionPlaceUpdateRequestSchema>;

export const collectionSetStatusRequestSchema = z.object({ status: collectionStatusSchema });
export type CollectionSetStatusRequest = z.infer<typeof collectionSetStatusRequestSchema>;

/** Copy one or many saved places INTO a trip (dedup precheck on server). */
export const collectionCopyToTripRequestSchema = z.object({
  trip_id: z.number(),
  place_ids: z.array(z.number()).min(1),
  force: z.boolean().optional(),
});
export type CollectionCopyToTripRequest = z.infer<typeof collectionCopyToTripRequestSchema>;

// Fusion invitations. user_id is NUMERIC ONLY — the UI always sends an id from availableUsers.
export const collectionInviteRequestSchema = z.object({
  collection_id: z.number(),
  user_id: z.number(),
  role: collectionRoleSchema.optional(),
});
export type CollectionInviteRequest = z.infer<typeof collectionInviteRequestSchema>;

export const collectionInviteActionRequestSchema = z.object({ collection_id: z.number() });
export type CollectionInviteActionRequest = z.infer<typeof collectionInviteActionRequestSchema>;

export const collectionInviteCancelRequestSchema = z.object({
  collection_id: z.number(),
  user_id: z.number(),
});
export type CollectionInviteCancelRequest = z.infer<typeof collectionInviteCancelRequestSchema>;

/** Owner removes an ALREADY-ACCEPTED member (kick). */
export const collectionRemoveMemberRequestSchema = z.object({
  collection_id: z.number(),
  user_id: z.number(),
});
export type CollectionRemoveMemberRequest = z.infer<typeof collectionRemoveMemberRequestSchema>;

/** Owner changes an accepted member's permission role. */
export const collectionSetMemberRoleRequestSchema = z.object({
  collection_id: z.number(),
  user_id: z.number(),
  role: collectionRoleSchema,
});
export type CollectionSetMemberRoleRequest = z.infer<typeof collectionSetMemberRoleRequestSchema>;

// ── Labels ──────────────────────────────────────────────────────────────────
const labelColorSchema = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

/** Create a custom label in a list. */
export const collectionLabelCreateRequestSchema = z.object({
  collection_id: z.number(),
  name: z.string().trim().min(1).max(60),
  color: labelColorSchema.optional(),
});
export type CollectionLabelCreateRequest = z.infer<typeof collectionLabelCreateRequestSchema>;

/** Rename / recolor a label (all fields optional). */
export const collectionLabelUpdateRequestSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  color: labelColorSchema.optional(),
  sort_order: z.number().optional(),
});
export type CollectionLabelUpdateRequest = z.infer<typeof collectionLabelUpdateRequestSchema>;

/** Bulk add or remove one/several labels across many selected places. */
export const collectionLabelAssignRequestSchema = z.object({
  label_ids: z.array(z.number()).min(1).max(50),
  place_ids: z.array(z.number()).min(1).max(1000),
});
export type CollectionLabelAssignRequest = z.infer<typeof collectionLabelAssignRequestSchema>;

// ── Responses ─────────────────────────────────────────────────────────────
export const collectionListResponseSchema = z.object({
  collections: z.array(collectionSchema),
  // `from` is DERIVED from collections.owner_id JOIN users (sendInvite is owner-only, so the
  // inviter is always the list owner — collection_members has no invited_by column).
  incomingInvites: z.array(
    z.object({
      collection_id: z.number(),
      name: z.string(),
      from: z.object({ id: z.number(), username: z.string() }),
    }),
  ),
});
export type CollectionListResponse = z.infer<typeof collectionListResponseSchema>;

export const collectionDetailResponseSchema = z.object({
  collection: collectionSchema,
  places: z.array(collectionPlaceSchema),
});
export type CollectionDetailResponse = z.infer<typeof collectionDetailResponseSchema>;

/** Dedup outcome envelope reused by save + copy (matches placeService dedup UX). */
export const collectionSaveResultSchema = z.object({
  place: collectionPlaceSchema.optional(),
  duplicate: z.boolean().optional(),
  duplicateOf: z.object({ id: z.number(), name: z.string() }).nullable().optional(),
});
export type CollectionSaveResult = z.infer<typeof collectionSaveResultSchema>;

/** Library-wide "is this place already saved anywhere I can see?" lookup (inspector indicator). */
export const collectionMembershipSchema = z.object({
  saved: z.boolean(),
  lists: z.array(z.object({ collection_id: z.number(), name: z.string(), place_id: z.number() })),
});
export type CollectionMembership = z.infer<typeof collectionMembershipSchema>;
