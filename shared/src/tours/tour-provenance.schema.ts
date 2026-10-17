import { z } from 'zod';

/**
 * Which way a tour came into TREK. Recorded when it is created, never read off
 * its shape: an import planned over in place keeps its origin.
 */
export const tourOriginSchema = z.enum(['trek', 'gpx', 'wanderer']);
export type TourOrigin = z.infer<typeof tourOriginSchema>;

/** What the import itself carried, one shape per kind of source. */
export const tourProvenanceSourceSchema = z.discriminatedUnion('kind', [
  /** Planned in TREK: no outside source to name. */
  z.object({ kind: z.literal('trek') }),
  z.object({
    kind: z.literal('gpx'),
    /** The file the track was read from; null for an import from before TREK kept it. */
    fileName: z.string().nullable(),
  }),
  z.object({
    kind: z.literal('wanderer'),
    /** The instance's origin, `https://host`. */
    instance: z.string(),
    /** The trail's id there. */
    externalId: z.string(),
    /** The trail's page there; null when the import's record is missing. */
    externalUrl: z.string().nullable(),
    /** wanderer's own change time of the trail at the import, as it said it; not a version. */
    externalUpdated: z.string().nullable(),
    /** When this snapshot came in; null when the import's record is missing. */
    importedAt: z.string().nullable(),
  }),
]);
export type TourProvenanceSource = z.infer<typeof tourProvenanceSourceSchema>;

/**
 * Where a tour came from, kept apart from what was done to it since. The
 * general part holds for every tour; `source` holds what only its kind of
 * source carries. The tour's `website` is a link its people keep, not part of
 * this.
 */
export const tourProvenanceSchema = z.object({
  origin: tourOriginSchema,
  /** When the tour was first saved in this trip: the import, or the first save of a planned tour. */
  createdAt: z.string().nullable(),
  source: tourProvenanceSourceSchema,
  /** The import this tour was planned from, while that import is still in the trip. */
  derivedFrom: z
    .object({
      placeId: z.number().int().positive(),
      name: z.string(),
    })
    .nullable(),
  /** The import was planned over in place and still keeps the track it was recorded with. */
  plannedOver: z.boolean(),
  /**
   * Whether the tour's name or line differs from how the import saved it.
   * Null where TREK has nothing to compare against: a planned tour, a GPX
   * import, a snapshot whose import record is missing.
   */
  editedLocally: z.boolean().nullable(),
});
export type TourProvenance = z.infer<typeof tourProvenanceSchema>;

/**
 * What asking a wanderer snapshot's source for changes found. The check reads
 * only, it changes nothing in the trip.
 *
 * - `unchanged` / `changed`: the trail was read and compared with this snapshot.
 * - `unavailable`: the trail is gone or not readable with the user's connection
 *   any more; the snapshot stays as it is.
 * - `not_connected`: the user has no wanderer connection to ask with.
 * - `other_instance`: the user's connection points at another instance than
 *   the one the snapshot came from.
 * - `unknown`: the snapshot carries nothing to compare against.
 */
export const tourSourceCheckStateSchema = z.enum([
  'unchanged',
  'changed',
  'unavailable',
  'not_connected',
  'other_instance',
  'unknown',
]);
export type TourSourceCheckState = z.infer<typeof tourSourceCheckStateSchema>;

export const tourSourceCheckResponseSchema = z.object({
  state: tourSourceCheckStateSchema,
  /** What differs between the trail now and this snapshot. */
  changes: z.array(z.enum(['name', 'description', 'route'])),
  /** wanderer's change time of the trail now, as it says it; only a hint, never the proof. */
  externalUpdated: z.string().nullable(),
  /** The change time it said at the import. */
  importedUpdated: z.string().nullable(),
  /** The tour was changed in TREK since the import; null when there is nothing to compare. */
  editedLocally: z.boolean().nullable(),
  /** What a confirmed reimport sends to the import route; null unless the trail was read. */
  reimport: z
    .object({
      trailId: z.string(),
      contentHash: z.string(),
    })
    .nullable(),
});
export type TourSourceCheckResponse = z.infer<typeof tourSourceCheckResponseSchema>;
