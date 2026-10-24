import { idSchema } from '../common/primitives.schema';

import { z } from 'zod';

/**
 * A trip that shows one journal from the Journey addon as its own, reached at
 * `/api/trips/:tripId/journal`. The link belongs to the trip: any journal its
 * owner chooses, one journal on as many trips as they like. The trip members
 * chosen for it get into the journal as viewers or editors for as long as the
 * link holds them and they stay on the trip.
 */

/** What a link lets a member do in its journal. */
export const tripJournalLinkRoleSchema = z.enum(['viewer', 'editor']);
export type TripJournalLinkRole = z.infer<typeof tripJournalLinkRoleSchema>;

/** One trip member the link lets in. */
export const tripJournalLinkMemberRequestSchema = z.object({
  user_id: idSchema,
  role: tripJournalLinkRoleSchema,
});
export type TripJournalLinkMemberRequest = z.infer<typeof tripJournalLinkMemberRequestSchema>;

/** PUT: show this journal in the trip, to these members. Replaces a journal linked before. */
export const tripJournalLinkRequestSchema = z.object({
  journey_id: idSchema,
  members: z.array(tripJournalLinkMemberRequestSchema).max(500),
});
export type TripJournalLinkRequest = z.infer<typeof tripJournalLinkRequestSchema>;

/** PATCH …/members: who the linked journal is open to, replacing the list. */
export const tripJournalLinkMembersRequestSchema = z.object({
  members: z.array(tripJournalLinkMemberRequestSchema).max(500),
});
export type TripJournalLinkMembersRequest = z.infer<typeof tripJournalLinkMembersRequestSchema>;

/** GET …/candidates: whose access a journal would change, before it is linked. */
export const tripJournalCandidatesQuerySchema = z.object({
  journey_id: z.coerce.number().int().positive(),
});
export type TripJournalCandidatesQuery = z.infer<typeof tripJournalCandidatesQuerySchema>;

/** Access to a journal as it stands: as its owner, a contributor or through a link. */
export const tripJournalAccessRoleSchema = z.enum(['owner', 'editor', 'viewer']);
export type TripJournalAccessRole = z.infer<typeof tripJournalAccessRoleSchema>;

export const tripJournalLinkMemberSchema = z.object({
  user_id: idSchema,
  username: z.string(),
  avatar_url: z.string().nullable(),
  role: tripJournalLinkRoleSchema,
});
export type TripJournalLinkMember = z.infer<typeof tripJournalLinkMemberSchema>;

/** The linked journal as the trip shows it. `members` only for someone who may change them. */
export const tripJournalLinkSchema = z.object({
  journey_id: idSchema,
  title: z.string(),
  subtitle: z.string().nullable(),
  cover_image: z.string().nullable(),
  owner_id: idSchema,
  linked_by: idSchema.nullable(),
  created_at: z.number(),
  my_role: tripJournalAccessRoleSchema.nullable(),
  members: z.array(tripJournalLinkMemberSchema).nullable(),
});
export type TripJournalLink = z.infer<typeof tripJournalLinkSchema>;

/**
 * The trip's journal and what the caller may do with it. `link` is null without
 * one, and also for a caller the linked journal is closed to who may not manage
 * it: they see no journal in the trip at all.
 */
export const tripJournalLinkResponseSchema = z.object({
  link: tripJournalLinkSchema.nullable(),
  can_link: z.boolean(),
  can_unlink: z.boolean(),
  can_edit_members: z.boolean(),
});
export type TripJournalLinkResponse = z.infer<typeof tripJournalLinkResponseSchema>;

/** A trip member who could be let into a journal, with the access they hold there today. */
export const tripJournalCandidateSchema = z.object({
  user_id: idSchema,
  username: z.string(),
  avatar_url: z.string().nullable(),
  is_trip_owner: z.boolean(),
  access: tripJournalAccessRoleSchema.nullable(),
});
export type TripJournalCandidate = z.infer<typeof tripJournalCandidateSchema>;

export const tripJournalCandidatesResponseSchema = z.object({
  candidates: z.array(tripJournalCandidateSchema),
});
export type TripJournalCandidatesResponse = z.infer<typeof tripJournalCandidatesResponseSchema>;
