import { z } from 'zod';

/**
 * Trip API contract — single source of truth for the /api/trips aggregate-root
 * endpoints (list/create/get/update/delete a trip, cover upload, copy, members,
 * offline bundle, ICS export).
 *
 * The aggregate root shares its path with the trip sub-domains (days, places,
 * collab, files, ...), so in the strangler it uses EXACT prefixes (`/api/trips|`,
 * `/api/trips/:tripId|`) plus the specific sub-route prefixes — never a broad
 * `/api/trips`, which would swallow not-yet-migrated nested mounts. The legacy
 * route (server/src/routes/trips.ts) wraps tripService and does per-field
 * permission checks + audit logging. Trip rows are wide, so responses stay open.
 */

/**
 * Trip entity as returned by the trip list / get / create / update endpoints
 * (server/src/services/tripService.ts -> TRIP_SELECT). Columns of the `trips`
 * table plus the computed list fields (day_count, place_count, is_owner as 0/1,
 * owner_username, shared_count). `is_archived` is the raw SQLite INTEGER.
 */
export const tripSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  currency: z.string(),
  cover_image: z.string().nullable().optional(),
  is_archived: z.number(),
  reminder_days: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  // computed in TRIP_SELECT (list/get)
  day_count: z.number().optional(),
  place_count: z.number().optional(),
  is_owner: z.number().optional(),
  owner_username: z.string().optional(),
  shared_count: z.number().optional(),
});
export type Trip = z.infer<typeof tripSchema>;

/**
 * Trip member as returned by the members endpoint
 * (server/src/services/tripService.ts -> listMembers). Owner + collaborators
 * share this shape; `avatar_url` is resolved from the stored avatar.
 */
export const tripMemberSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().optional(),
  avatar: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  role: z.string().optional(),
  added_at: z.string().nullable().optional(),
  invited_by_username: z.string().nullable().optional(),
});
export type TripMember = z.infer<typeof tripMemberSchema>;

export const tripCreateRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  currency: z.string().optional(),
  reminder_days: z.number().optional(),
  day_count: z.number().optional(),
});
export type TripCreateRequest = z.infer<typeof tripCreateRequestSchema>;

/** Update is partial; the route runs per-field permission checks on what's present. */
export const tripUpdateRequestSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  currency: z.string().optional(),
  reminder_days: z.number().optional(),
  day_count: z.number().optional(),
  is_archived: z.union([z.boolean(), z.number()]).optional(),
  cover_image: z.string().nullable().optional(),
});
export type TripUpdateRequest = z.infer<typeof tripUpdateRequestSchema>;

export const tripCopyRequestSchema = z.object({
  title: z.string().optional(),
});
export type TripCopyRequest = z.infer<typeof tripCopyRequestSchema>;

export const tripAddMemberRequestSchema = z.object({
  identifier: z.string(),
});
export type TripAddMemberRequest = z.infer<typeof tripAddMemberRequestSchema>;
