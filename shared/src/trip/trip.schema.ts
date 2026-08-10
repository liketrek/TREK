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
  // Guest members (#1362): accountless participant, assignable but never able to log in.
  is_guest: z.boolean().optional(),
});
export type TripMember = z.infer<typeof tripMemberSchema>;

// Guest CRUD (#1362) — owner-only management of accountless participants.
export const tripCreateGuestRequestSchema = z.object({
  name: z.string().min(1).max(50),
});
export type TripCreateGuestRequest = z.infer<typeof tripCreateGuestRequestSchema>;

export const tripRenameGuestRequestSchema = z.object({
  name: z.string().min(1).max(50),
});
export type TripRenameGuestRequest = z.infer<typeof tripRenameGuestRequestSchema>;

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
  /**
   * How day-attached content follows a date-range change (#1288):
   * 'keep_bookings' (default) — day plans move with the days; dated reservations and
   * accommodations stay on their absolute dates while those remain inside the trip.
   * 'shift_all' — the whole itinerary, bookings included, moves with the range.
   */
  date_shift_mode: z.enum(['keep_bookings', 'shift_all']).optional(),
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

// Hand the trip over to an existing member (#973).
export const tripTransferOwnershipRequestSchema = z.object({
  newOwnerId: z.number().int().positive(),
});
export type TripTransferOwnershipRequest = z.infer<typeof tripTransferOwnershipRequestSchema>;

/**
 * The one trip TREK opens on for a user who wants to land in their trip instead
 * of on the dashboard (GET /api/trips/active). Deliberately narrow: it is read
 * on the very first paint to decide where to navigate, so it carries the id plus
 * enough to label the destination — nothing that would make it as wide (or as
 * slow) as the trip list it replaces there.
 *
 * Relevance order matches the dashboard hero (client sortTrips): the trip
 * running today, else the next one starting, else the most recently started.
 */
export const activeTripSchema = z.object({
  id: z.number(),
  title: z.string(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
});
export type ActiveTrip = z.infer<typeof activeTripSchema>;

// null when the user has no unarchived trip at all — the caller falls back to
// the dashboard rather than navigating into nothing.
export const activeTripResponseSchema = z.object({
  trip: activeTripSchema.nullable(),
});
export type ActiveTripResponse = z.infer<typeof activeTripResponseSchema>;
