import { idSchema } from '../common/primitives.schema';
import { tourOriginSchema } from './tour-provenance.schema';
import { tourListItemSchema, tourNameSchema, tourWaypointRoleSchema } from './tours.schema';

import { z } from 'zod';

/**
 * LIB-03: a whole tour kept in a collection, apart from any trip. Saving one
 * makes an independent snapshot of a saved tour: its line, type, measures,
 * settings and control points as they are at that moment, and the trip and
 * tour it was saved from as they were called then. Taking it into a trip makes
 * a new tour of its own there. Nothing keeps the tour it came from, the
 * snapshot and a tour made from it in step with one another.
 */

/** The most points a preview's line carries, thinned evenly along it. */
export const COLLECTION_TOUR_PREVIEW_POINTS = 400;

/** Which tour of which trip to keep in the collection, and the name it gets there (the tour's own when left out). */
export const collectionTourSaveRequestSchema = z
  .object({
    source_trip_id: idSchema,
    source_place_id: idSchema,
    name: tourNameSchema.optional(),
  })
  .strict();
export type CollectionTourSaveRequest = z.infer<typeof collectionTourSaveRequestSchema>;

/**
 * Which tour of which collection to take into the trip, whether its control
 * points come along, and the name the new tour gets (the kept one's when left
 * out). The choice about the points is never assumed: it has to be said.
 */
export const collectionTourTakeOverRequestSchema = z
  .object({
    collection_id: idSchema,
    collection_tour_id: idSchema,
    include_waypoints: z.boolean(),
    name: tourNameSchema.optional(),
  })
  .strict();
export type CollectionTourTakeOverRequest = z.infer<typeof collectionTourTakeOverRequestSchema>;

/**
 * A tour kept in a collection as the collection lists it: its measures as
 * they were saved, null staying null, and what the trip's list shows of its
 * type (ski discipline and technique, run profile and pace,
 * bike profile, stage count).
 */
export const collectionTourItemSchema = tourListItemSchema
  .pick({
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
    wanderer_ref: true,
    station_count: true,
    station_stay_minutes: true,
    station_stays_unknown: true,
    bike_profile: true,
    run_profile: true,
    run_pace_seconds_per_km: true,
    ski_discipline: true,
    ski_technique: true,
    stage_count: true,
  })
  .extend({
    id: idSchema,
    collection_id: idSchema,
    origin: tourOriginSchema,
    /** False for a city walk kept with its stations only, its way not planned yet. */
    has_line: z.boolean(),
    /** The control points kept with it; shaping points count too. */
    waypoint_count: z.number().int().nonnegative(),
    /** The trip and tour it was saved from, as they were called when it was saved. */
    source: z.object({ tripTitle: z.string(), tourName: z.string() }),
    /** Who saved it; null once that account is gone. */
    saved_by: z.string().nullable(),
    saved_at: z.string(),
  });
export type CollectionTourItem = z.infer<typeof collectionTourItemSchema>;

export const collectionTourListResponseSchema = z.object({
  tours: z.array(collectionTourItemSchema),
});
export type CollectionTourListResponse = z.infer<typeof collectionTourListResponseSchema>;

export const collectionTourSaveResponseSchema = z.object({
  tour: collectionTourItemSchema,
});
export type CollectionTourSaveResponse = z.infer<typeof collectionTourSaveResponseSchema>;

/** One kept control point as the preview shows it, in route order. */
export const collectionTourPointSchema = z.object({
  role: tourWaypointRoleSchema,
  name: z.string().nullable(),
  /** A point there only to steer the route, not a stop. */
  shaping: z.boolean(),
});
export type CollectionTourPoint = z.infer<typeof collectionTourPointSchema>;

/** A trip the user can open, and whether they may add a tour to it. */
export const collectionTourTargetSchema = z.object({
  id: idSchema,
  title: z.string(),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  can_add: z.boolean(),
});
export type CollectionTourTarget = z.infer<typeof collectionTourTargetSchema>;

/**
 * Everything the take-over asks about, read anew when it opens: the kept tour,
 * its line thinned for drawing, its points in order, and the trips it could go
 * into, newest first.
 */
export const collectionTourDetailResponseSchema = z.object({
  tour: collectionTourItemSchema,
  line: z.array(z.tuple([z.number(), z.number()])),
  points: z.array(collectionTourPointSchema),
  trips: z.array(collectionTourTargetSchema),
});
export type CollectionTourDetailResponse = z.infer<typeof collectionTourDetailResponseSchema>;
