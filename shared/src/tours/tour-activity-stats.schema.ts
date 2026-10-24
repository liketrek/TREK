import { idSchema } from '../common/primitives.schema';
import { tourTypeKeySchema } from './tours.schema';

import { z } from 'zod';

/**
 * STA-02: the user's own tour activities, as the Atlas sums them. One entry is
 * one tour the user did on one day of a trip, read from what the trip holds:
 *
 * - The plan's values stand in for the tour while nothing was recorded
 *   (`basis: 'plan'`), and say so. A tour on several days still counts once
 *   (`day_count` says on how many), on the last of them, so a tour still under
 *   way is not done yet.
 * - A recorded track linked to an execution of the tour (ACT-01) takes the
 *   plan's place (`basis: 'track'`), one entry per recording; the plan of that
 *   tour is then not counted besides it, and the recording is never counted as
 *   a tour of its own.
 * - An import some other tour of the trip was planned from (the whole route a
 *   multi-day tour's stages were cut from) is named by those tours in
 *   `derived_from_place_id`, and the summary leaves it out while one of them
 *   counts, so the route and its stages are never added up together. A stage
 *   still ahead or left out does not hide the route.
 * - Only the user's own part counts: an execution names the user as one of its
 *   participants, or names nobody, which in the planner means everyone of the
 *   trip. A day that names participants without the user is not theirs.
 *
 * Whether an entry is done is the reader's question (`date` before today, in
 * the reader's own time zone): the server answers every entry it found, the
 * upcoming ones too, so the app can say how many are still ahead.
 */

/** Where an entry's values come from: the trip's planning, or a track recorded while doing it. */
export const TOUR_ACTIVITY_BASES = ['plan', 'track'] as const;
export const tourActivityBasisSchema = z.enum(TOUR_ACTIVITY_BASES);
export type TourActivityBasis = z.infer<typeof tourActivityBasisSchema>;

/** A calendar day, YYYY-MM-DD, as a trip's days carry it. */
export const tourActivityDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const tourActivityStatsEntrySchema = z.object({
  place_id: idSchema,
  name: z.string(),
  tour_type: tourTypeKeySchema,
  trip: z.object({ id: idSchema, title: z.string() }),
  /** The whole route this tour was planned from, a stage of it; null for any other tour. */
  derived_from_place_id: idSchema.nullable(),
  /** The day it was done on: the recording's day, else the last of the user's dated days the tour is on. */
  date: tourActivityDateSchema,
  basis: tourActivityBasisSchema,
  /** The recording whose values these are; null for the plan. */
  track: z.object({ place_id: idSchema, name: z.string() }).nullable(),
  /** On how many of the user's dated days the tour is planned; it counts once however many. */
  day_count: z.number().int().positive(),
  /** Null where the source does not know the value; a paddle tour never has heights. */
  distance_km: z.number().nonnegative().nullable(),
  ascent_m: z.number().nonnegative().nullable(),
  descent_m: z.number().nonnegative().nullable(),
  /** Left out of the user's sums on purpose (a tour that fell through); the plan stays as it is. */
  excluded: z.boolean(),
});
export type TourActivityStatsEntry = z.infer<typeof tourActivityStatsEntrySchema>;

export const tourActivityStatsResponseSchema = z.object({
  /** The newest first. */
  entries: z.array(tourActivityStatsEntrySchema),
  /**
   * Tours of the user's trips that cannot count as done: on no day at all, or
   * only on the user's days without a date. A whole route whose stages are on
   * the user's days is not among them. Said, so a missing tour is not a mystery.
   */
  uncounted: z.object({
    unassigned: z.number().int().nonnegative(),
    undated: z.number().int().nonnegative(),
  }),
});
export type TourActivityStatsResponse = z.infer<typeof tourActivityStatsResponseSchema>;

/** Leaving a tour out of the user's own sums, or counting it again. Nothing of the tour changes. */
export const tourActivityExclusionRequestSchema = z
  .object({
    place_id: idSchema,
    excluded: z.boolean(),
  })
  .strict();
export type TourActivityExclusionRequest = z.infer<typeof tourActivityExclusionRequestSchema>;

/** What a reader narrows the sums by: a period (both days included) and one type. */
export const tourActivityStatsQuerySchema = z
  .object({
    from: tourActivityDateSchema.optional(),
    to: tourActivityDateSchema.optional(),
    type: tourTypeKeySchema.optional(),
  })
  .strict();
export type TourActivityStatsQuery = z.infer<typeof tourActivityStatsQuerySchema>;
