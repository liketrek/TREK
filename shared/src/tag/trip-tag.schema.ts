import { hexColorSchema } from '../place/place.schema';
import { tagSchema } from './tag.schema';

import { z } from 'zod';

/**
 * Trip tag API contract, the single source of truth for /api/trips/:tripId/tags.
 *
 * A trip tag is a row of `tags` with `trip_id` set. It belongs to the trip rather
 * than to one person, so every member reads the same list and anyone who may edit
 * the trip's places (`place_edit`) may add to it, rename and delete. `user_id` keeps
 * who created it. A name is unique within its trip, whatever its case.
 */

/** The longest name a trip tag takes. */
export const TRIP_TAG_NAME_MAX = 50;

/** A trip tag's name as it is stored: trimmed, never empty. */
export const tripTagNameSchema = z.string().trim().min(1).max(TRIP_TAG_NAME_MAX);

export const tripTagCreateRequestSchema = z.object({
  name: tripTagNameSchema,
  color: hexColorSchema.optional(),
});
export type TripTagCreateRequest = z.infer<typeof tripTagCreateRequestSchema>;

/** Both fields optional: one that is left out keeps its stored value. */
export const tripTagUpdateRequestSchema = z.object({
  name: tripTagNameSchema.optional(),
  color: hexColorSchema.optional(),
});
export type TripTagUpdateRequest = z.infer<typeof tripTagUpdateRequestSchema>;

export const tripTagResponseSchema = z.object({ tag: tagSchema });
export type TripTagResponse = z.infer<typeof tripTagResponseSchema>;

export const tripTagListResponseSchema = z.object({ tags: z.array(tagSchema) });
export type TripTagListResponse = z.infer<typeof tripTagListResponseSchema>;
