import { z } from 'zod';

/**
 * Road trip contracts (#1797).
 *
 * A **via** is a point the day's drive is made to pass through without being a stop.
 * The distinction is the whole feature: a stop is somewhere you go, and it earns a number
 * in the chain, an arrival time and a line in the itinerary; a via only bends the route,
 * which is what "take the coast road instead" means. Storing one as a place would put a
 * numbered stop in the middle of the day for a spot nobody stops at.
 */

/** Latitude, in the range the routing engines accept. */
const latSchema = z.number().min(-90).max(90);
/** Longitude, same. */
const lngSchema = z.number().min(-180).max(180);

export const roadtripViaSchema = z.object({
  id: z.number(),
  day_id: z.number(),
  /**
   * Which stop this via follows, counted the way the routing request is built.
   *
   * Deliberately an index and not an assignment id: a stop added mid-day is written
   * optimistically with a temporary negative id and swapped for the real one moments
   * later, so a reference to it would dangle exactly when the user is dragging.
   */
  after_order_index: z.number().int().min(0),
  /** Order among the vias that follow the same stop. */
  sequence: z.number().int().min(0),
  lat: latSchema,
  lng: lngSchema,
  created_at: z.string().optional(),
});
export type RoadtripVia = z.infer<typeof roadtripViaSchema>;

export const roadtripViaCreateRequestSchema = z.object({
  after_order_index: z.number().int().min(0),
  lat: latSchema,
  lng: lngSchema,
  /** Where among the vias after that stop; appended when absent. */
  sequence: z.number().int().min(0).optional(),
});
export type RoadtripViaCreateRequest = z.infer<typeof roadtripViaCreateRequestSchema>;

/** Moving a via is the whole edit — dragging it somewhere else on the map. */
export const roadtripViaUpdateRequestSchema = z.object({
  lat: latSchema,
  lng: lngSchema,
});
export type RoadtripViaUpdateRequest = z.infer<typeof roadtripViaUpdateRequestSchema>;

/**
 * Re-pinning a day's vias after the shape of its stops changed.
 *
 * `after_order_index` is a position, so inserting, removing or reordering a stop moves
 * the ground under every via that follows it: the anchors keep their old numbers and the
 * route silently reverts to the road the user had steered it away from. Whoever changes
 * the stops sends the corrected anchoring here, and it is applied in one transaction —
 * a half-applied re-anchoring is worse than none, because it mixes two numbering schemes
 * in the same day.
 *
 * `remove` carries the vias whose leg stopped existing at all: delete the last stop and
 * the leg into it is gone, and a via pinned to it has nowhere left to sit.
 */
export const roadtripViaReanchorRequestSchema = z.object({
  vias: z.array(z.object({
    id: z.number().int().positive(),
    after_order_index: z.number().int().min(0),
  })).max(500),
  remove: z.array(z.number().int().positive()).max(500).optional(),
});
export type RoadtripViaReanchorRequest = z.infer<typeof roadtripViaReanchorRequestSchema>;

/**
 * Laying a whole chain of vias on one day at once.
 *
 * The single-via route is right for a hand-dragged detour and wrong for everything that
 * derives its anchors from a line: pinning a day onto a recorded track or a signed scenic
 * road means a couple of dozen points, and one request each would re-route the entire trip
 * once per point, at better than a second apart.
 *
 * `replace_legs` clears the vias on the named legs before inserting, and names legs rather
 * than taking a boolean for the day: a traveller who already bent two legs by hand and
 * then adopts a scenic road for a third has not asked to lose the two.
 */
export const roadtripViaBatchRequestSchema = z.object({
  vias: z.array(z.object({
    after_order_index: z.number().int().min(0),
    lat: latSchema,
    lng: lngSchema,
  })).max(100),
  /** Legs to clear first, by `after_order_index`. Absent means add to what is there. */
  replace_legs: z.array(z.number().int().min(0)).max(100).optional(),
  /**
   * The imported track this chain was fitted to, if it came from one.
   *
   * Three states rather than two, which is why it is an object and not an id: absent
   * leaves whatever the day already followed alone, `null` says the day follows nothing
   * any more, and an object records the road it now takes. A bare nullable id could not
   * tell "do not touch this" apart from "forget it".
   */
  track: z.object({
    place_id: z.number().int().positive(),
    /** How far the fitted route still ran from the track at its worst point. */
    stray_km: z.number().min(0).max(40_000).nullable().optional(),
  }).nullable().optional(),
});
export type RoadtripViaBatchRequest = z.infer<typeof roadtripViaBatchRequestSchema>;

/** Which track a day was fitted to, and how closely. */
export const roadtripDayTrackSchema = z.object({
  day_id: z.number(),
  place_id: z.number(),
  stray_km: z.number().nullable(),
});
export type RoadtripDayTrack = z.infer<typeof roadtripDayTrackSchema>;

export const roadtripViaListResponseSchema = z.object({
  vias: z.array(roadtripViaSchema),
  /**
   * The tracks the trip's days follow, one row per day that follows one.
   *
   * Alongside the vias rather than behind a route of its own: they are read together on
   * every load of road-trip mode, and a second request for a handful of rows would be a
   * second round trip for something the first one could carry.
   */
  tracks: z.array(roadtripDayTrackSchema),
});
export type RoadtripViaListResponse = z.infer<typeof roadtripViaListResponseSchema>;
