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

export const roadtripViaListResponseSchema = z.object({
  vias: z.array(roadtripViaSchema),
});
export type RoadtripViaListResponse = z.infer<typeof roadtripViaListResponseSchema>;
