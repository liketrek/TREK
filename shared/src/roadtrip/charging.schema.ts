import { z } from 'zod';

export const chargingInfoSchema = z.object({
  checkedAt: z.string(),
  status: z.enum(['ok', 'unknown', 'ambiguous', 'unavailable']),
  station: z.string().nullable(),
  source: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  license: z.string().nullable(),
  updatedAt: z.string().nullable(),
  stale: z.boolean(),
  available: z.number().int().nonnegative().nullable(),
  total: z.number().int().nonnegative(),
  unknown: z.number().int().nonnegative(),
  tariffs: z.array(
    z.object({
      currency: z.string(),
      updatedAt: z.string(),
      components: z.array(
        z.object({
          kind: z.string(),
          price: z.number().nonnegative(),
          taxIncluded: z.boolean(),
          conditional: z.boolean(),
          afterSeconds: z.number().nullable(),
        }),
      ),
    }),
  ),
  pricesUnavailable: z.boolean(),
});
export type ChargingInfo = z.infer<typeof chargingInfoSchema>;

/**
 * A charging station addressed by where it is, rather than by a row in `places`.
 *
 * The saved-stop route answers for a place id, which a hit found along the route does
 * not have yet, and "is anything free here, and what does it cost" is the question
 * people want answered before adding the charger, not after. The match needs nothing
 * more than this: a coordinate, and whatever the search called the place.
 *
 * One station per request, deliberately. A cache miss costs the upstream registry
 * several requests, nothing rate-limits the route, and the caches on both sides of it
 * are sized for the handful of stops a trip has. A batch would turn one click into a
 * burst against shared public infrastructure.
 */
export const chargingLookupSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  /**
   * An empty name is allowed. OSM charging nodes are frequently nameless, and the
   * matcher already treats "nothing to go on" as its own case: it then insists the
   * station be within 30 m instead of accepting the nearest one inside 100 m.
   */
  name: z.string().max(200),
});
export type ChargingLookup = z.infer<typeof chargingLookupSchema>;
