import { idSchema } from '../../common/primitives.schema';
import { tourMaxHikingDifficultySchema, tourTypeKeySchema } from '../../tours/tours.schema';
import { cardText } from './card-parts';

import { z } from 'zod';

/**
 * The saved tours of a trip, or of one of its days, as rows like the Tours
 * sidebar shows them: the activity, the name, time, distance and climb, the
 * stages of a tour over several days, and the days it is on.
 */

/** The most rows one card lists; `more` counts the rest. */
export const TOUR_LIST_ROWS = 12;

export const tourListRowSchema = z.object({
  placeId: idSchema,
  name: cardText(120),
  activity: tourTypeKeySchema,
  limit: tourMaxHikingDifficultySchema.nullable(),
  distanceM: z.number().int().min(0).max(5_000_000).nullable(),
  ascentM: z.number().int().min(0).max(100_000).nullable(),
  minutes: z.number().int().min(0).max(86_400).nullable(),
  stages: z.number().int().min(2).max(60).nullable(),
  /** The numbers of the trip days it is on, in day order. */
  days: z.array(z.number().int().min(1).max(999)).max(10),
});
export type TourListRow = z.infer<typeof tourListRowSchema>;

export const tourListCardSchema = z.object({
  kind: z.literal('tourList'),
  /** The day the list was asked for; null for the whole trip. */
  dayId: idSchema.nullable(),
  more: z.number().int().min(0).max(10_000),
  rows: z.array(tourListRowSchema).min(1).max(TOUR_LIST_ROWS),
});
export type TourListCard = z.infer<typeof tourListCardSchema>;
