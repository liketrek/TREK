import { tourListItemSchema, tourTypeKeySchema } from './tours.schema';

import { z } from 'zod';

/**
 * LIB-02: taking a tour over from another trip the user can open. The list
 * and the preview read across those trips without changing anything; the
 * take-over writes one independent copy into the trip it is asked in.
 */

/** The most tours one list answer carries; the answer says when there were more. */
export const TOUR_LIBRARY_LIMIT = 100;
/** The most points a preview's line carries, thinned evenly along it. */
export const TOUR_LIBRARY_PREVIEW_POINTS = 400;

/** What the list is narrowed by: a part of the name, a type, one trip; the trip asked from is left out. */
export const tourLibraryQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    type: tourTypeKeySchema.optional(),
    trip_id: z.coerce.number().int().positive().optional(),
    exclude_trip_id: z.coerce.number().int().positive().optional(),
  })
  .strict();
export type TourLibraryQuery = z.infer<typeof tourLibraryQuerySchema>;

const tourLibraryTripSchema = z.object({ id: z.number().int().positive(), title: z.string() });

/** A tour of another trip as the list shows it: its measures as they are, and the trip it is in. */
export const tourLibraryItemSchema = tourListItemSchema
  .pick({
    place_id: true,
    name: true,
    description: true,
    tour_type: true,
    distance: true,
    elevation_gain: true,
    elevation_loss: true,
    duration: true,
    planned_duration_minutes: true,
    break_additional_minutes: true,
    max_hiking_difficulty: true,
    has_waypoints: true,
    origin: true,
    station_count: true,
    station_stay_minutes: true,
    station_stays_unknown: true,
  })
  .extend({ trip: tourLibraryTripSchema });
export type TourLibraryItem = z.infer<typeof tourLibraryItemSchema>;

export const tourLibraryResponseSchema = z.object({
  tours: z.array(tourLibraryItemSchema),
  /** Every trip with a tour the user could take over, for the trip filter, the asking trip left out. */
  trips: z.array(tourLibraryTripSchema.extend({ tour_count: z.number().int().nonnegative() })),
  /** More tours matched than the answer carries. */
  truncated: z.boolean(),
});
export type TourLibraryResponse = z.infer<typeof tourLibraryResponseSchema>;

/** One tour's preview: the list's facts, its line thinned for drawing, and how many control points it has. */
export const tourLibraryDetailResponseSchema = z.object({
  tour: tourLibraryItemSchema,
  line: z.array(z.tuple([z.number(), z.number()])),
  waypoint_count: z.number().int().nonnegative(),
});
export type TourLibraryDetailResponse = z.infer<typeof tourLibraryDetailResponseSchema>;

/** Which tour of which trip to take over, and the name the copy gets (the tour's own when left out). */
export const tourTakeOverRequestSchema = z
  .object({
    source_trip_id: z.number().int().positive(),
    source_place_id: z.number().int().positive(),
    name: z.string().trim().min(1).max(255).optional(),
  })
  .strict();
export type TourTakeOverRequest = z.infer<typeof tourTakeOverRequestSchema>;
