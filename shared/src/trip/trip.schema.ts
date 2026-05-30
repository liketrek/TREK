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
