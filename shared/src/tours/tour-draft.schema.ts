import { z } from 'zod';

/**
 * The Tours planner's unsaved draft, kept on the account per user and trip so
 * a draft started on one device opens on the next. The draft is the planner's
 * own state (its fields change with the planner's versions), so the contract
 * carries it as JSON text the server stores and hands back whole: the server
 * checks that it is a JSON object within the size cap, and the planner checks
 * its fields when it takes the draft back.
 */

/**
 * The longest a draft may be, in characters of its JSON text. A draft holds
 * the control points and their fixed legs, never the routed line, so even a
 * ride along a long horse route section stays far below this; the JSON body
 * that carries it escaped stays under the tour write ceiling.
 */
export const TOUR_DRAFT_MAX_CHARS = 512 * 1024;

function isJsonObject(text: string): boolean {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  } catch {
    return false;
  }
}

/** A draft as JSON text: an object, within TOUR_DRAFT_MAX_CHARS. */
export const tourDraftPayloadSchema = z
  .string()
  .min(2)
  .max(TOUR_DRAFT_MAX_CHARS)
  .refine(isJsonObject, { message: 'The draft must be a JSON object' });

/** PUT /api/trips/:tripId/tour-draft: the draft that replaces the one kept before. */
export const tourDraftPutRequestSchema = z.object({
  payload: tourDraftPayloadSchema,
});
export type TourDraftPutRequest = z.infer<typeof tourDraftPutRequestSchema>;

/** A kept draft and when it was last written. */
export const tourDraftSchema = z.object({
  payload: z.string(),
  updated_at: z.string(),
});
export type TourDraft = z.infer<typeof tourDraftSchema>;

/** GET and PUT /api/trips/:tripId/tour-draft: the user's draft in the trip, null while there is none. */
export const tourDraftResponseSchema = z.object({
  draft: tourDraftSchema.nullable(),
});
export type TourDraftResponse = z.infer<typeof tourDraftResponseSchema>;
