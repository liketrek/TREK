import { idSchema } from '../common/primitives.schema';
import { stationKeySchema, tourRevisionSchema, tourWaypointSchema } from './tours.schema';

import { z } from 'zod';

/**
 * P6: a place found along a saved tour (a search result, a place the
 * traveller names) taken in as one stop, and the same stop taken out again.
 * The server lays the stop in with the planner's own rule (poi-insertion.ts):
 * after the point named, or where it most likely belongs along the route, and
 * never into a leg drawn by hand or a fixed line. A hike plans its way anew
 * through the points, a city walk saves the stop as a station; both against
 * the revision the tour was read at.
 */

const { lat, lng, name, poi_category, opening_hours } = tourWaypointSchema.shape;

const placeId = idSchema.describe('The place id of the tour, as list_tours gives it');
const expectedRevision = tourRevisionSchema.describe(
  'The revision of the tour as last read (get_tour_plan or list_tours); a tour changed since is refused, not overwritten',
);

const tourStopSchema = z
  .object({
    lat,
    lng,
    name: name.describe('The name of the place the stop is, such as a hut, a café or a viewpoint'),
    poi_category: poi_category.describe(
      'What kind of place it is, where it is one: peak, shelter, drinking_water, viewpoint, restaurant, museum',
    ),
    opening_hours: opening_hours.describe(
      'On a city walk: the opening hours of the place as OpenStreetMap writes them, where known',
    ),
  })
  .strict();
export type TourStop = z.infer<typeof tourStopSchema>;

export const tourStopInsertRequestSchema = z
  .object({
    placeId,
    expected_revision: expectedRevision,
    stop: tourStopSchema.describe('The place taken in as a stop: where it is and what it is called'),
    after_key: stationKeySchema
      .optional()
      .describe(
        'The key of the point of the tour the stop comes after, as get_tour_plan gives it; left out, the stop goes after the last point before it along the route',
      ),
  })
  .strict();
export type TourStopInsertRequest = z.infer<typeof tourStopInsertRequestSchema>;

export const tourStopRemoveRequestSchema = z
  .object({
    placeId,
    expected_revision: expectedRevision,
    key: stationKeySchema.describe('The key of the stop to take out, as get_tour_plan or insert_tour_stop gives it'),
  })
  .strict();
export type TourStopRemoveRequest = z.infer<typeof tourStopRemoveRequestSchema>;

/** The tour types a stop is taken in or out of over the assistant; any other type in the planner. */
export const TOUR_STOP_TYPES = ['hike', 'walk'] as const;

/** The tour as an insert or a removal of a stop saved it. */
const tourStopTourSchema = z.object({
  place_id: idSchema,
  name: z.string(),
  tour_type: z.enum(TOUR_STOP_TYPES),
  revision: tourRevisionSchema,
  distance_km: z.number().nullable(),
  minutes: z.number().nullable(),
  route_pending: z.boolean(),
});

/** One stop as an answer names it: its key (null where the tour gave it none), its place and its name. */
const tourStopPointSchema = z.object({
  key: stationKeySchema.nullable(),
  lat: z.number(),
  lng: z.number(),
  name: z.string().nullable(),
  poi_category: z.string().nullable(),
});

/**
 * What insert_tour_stop answers: the tour as saved, the stop with its key and
 * the point it came after, and the distance and time before and after as the
 * tour stored them (null where not known).
 */
export const tourStopInsertResultSchema = z.object({
  tour: tourStopTourSchema,
  stop: tourStopPointSchema.extend({ after_key: stationKeySchema.nullable(), after_name: z.string().nullable() }),
  before: z.object({ distance_km: z.number().nullable(), minutes: z.number().nullable() }),
});
export type TourStopInsertResult = z.infer<typeof tourStopInsertResultSchema>;

/** What remove_tour_stop answers: the tour as saved and the stop it took out, with the point it came after. */
export const tourStopRemoveResultSchema = z.object({
  tour: tourStopTourSchema,
  removed: tourStopPointSchema.extend({ after_key: stationKeySchema.nullable() }),
});
export type TourStopRemoveResult = z.infer<typeof tourStopRemoveResultSchema>;
