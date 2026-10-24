import { journeyTrackSchema } from './journey.schema';

import { z } from 'zod';

/**
 * JRN-04: what the journey map can show besides the entries and the photos
 * the journey answers itself: the plan of its trips, the days of route it
 * keeps and the stays its entries were taken over from.
 *
 * Every source answers on its own. One that failed says `unavailable` and the
 * others still draw; one a share link does not show says `withheld`, so a
 * reader is never offered a layer that is not theirs to switch on. Nothing
 * here stands for a visit: a planned place is what the trip meant to do.
 */

/** A place of a linked trip on the day(s) the plan puts it on. */
export const journeyMapPlaceSchema = z.object({
  place_id: z.number(),
  trip_id: z.number(),
  trip_title: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  /** The days of the plan it is on, `YYYY-MM-DD`, earliest first. */
  days: z.array(z.string()),
  /** The time the plan gives it on its first day, `HH:MM`, or null. */
  time: z.string().nullable(),
  category_color: z.string().nullable(),
  category_icon: z.string().nullable(),
  /** The journal entry written about it, when there is one; a planned place is no visit by itself. */
  entry_id: z.number().nullable(),
});
export type JourneyMapPlace = z.infer<typeof journeyMapPlaceSchema>;

/** One stay a journal entry was taken over from (JRN-02), at the place it was recorded. */
export const journeyMapStaySchema = z.object({
  id: z.number(),
  entry_id: z.number(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  started_at: z.string(),
  ended_at: z.string(),
});
export type JourneyMapStay = z.infer<typeof journeyMapStaySchema>;

/** A day of route the journey keeps (JRN-01), its pieces apart: a gap stays a gap. */
export const journeyMapRecordingSchema = z.object({
  date: z.string(),
  pieces: z.array(z.array(z.tuple([z.number(), z.number()]))),
  distance_m: z.number().nullable(),
});
export type JourneyMapRecording = z.infer<typeof journeyMapRecordingSchema>;

/** How one source of the map answered. */
function layerResult<T extends z.ZodType>(item: T) {
  return z.discriminatedUnion('status', [
    z.object({ status: z.literal('ok'), items: z.array(item) }),
    z.object({ status: z.literal('unavailable') }),
    z.object({ status: z.literal('withheld') }),
  ]);
}

export const journeyMapPlacesLayerSchema = layerResult(journeyMapPlaceSchema);
export const journeyMapRoutesLayerSchema = layerResult(journeyTrackSchema);
export const journeyMapStaysLayerSchema = layerResult(journeyMapStaySchema);
export const journeyMapRecordingsLayerSchema = layerResult(journeyMapRecordingSchema);
export type JourneyMapLayerResult<T> =
  { status: 'ok'; items: T[] } | { status: 'unavailable' } | { status: 'withheld' };

/**
 * GET /api/journeys/:id/map-layers. The trips' GPX tracks are the plan's
 * routes, drawn while the journey's track switch is on. The recorded days are
 * not here: the journey answers them with their details at `/recordings`.
 */
export const journeyMapLayersResponseSchema = z.object({
  places: journeyMapPlacesLayerSchema,
  routes: journeyMapRoutesLayerSchema,
  stays: journeyMapStaysLayerSchema,
});
export type JourneyMapLayersResponse = z.infer<typeof journeyMapLayersResponseSchema>;

/**
 * GET /api/public/journey/:token/map-layers: the same, cut to what the link
 * shares. Nothing while the map is not shared; the plan and its routes only
 * with `share_plan`; the recorded days only with `share_recordings` and only
 * on a day with a published entry; the stays, taken from a recording, also
 * only with `share_recordings` and only of published entries.
 */
export const journeyPublicMapLayersResponseSchema = journeyMapLayersResponseSchema.extend({
  recordings: journeyMapRecordingsLayerSchema,
});
export type JourneyPublicMapLayersResponse = z.infer<typeof journeyPublicMapLayersResponseSchema>;
