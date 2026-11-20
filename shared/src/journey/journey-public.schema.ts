import { idSchema } from '../common/primitives.schema';

import { z } from 'zod';

/**
 * What GET /api/public/journey/:token answers: a journey as a reader without an
 * account sees it.
 *
 * Unlike the other response schemas, every object here is strict on purpose. The payload used to spread whole
 * rows, so storage keys (`journey/<uuid>.jpg`), provider asset ids, the author
 * and columns nothing on the page reads all went out with it. A key that is not
 * named below now fails the route's response contract in every test that
 * reaches it, rather than quietly reaching the public.
 */

/**
 * A photo on the public page, inline in an entry or in the gallery. Bytes are
 * fetched by `photo_id` through the share token, so no path or asset id is
 * needed. The capture coordinates are null unless the owner shared the map.
 */
export const journeyPublicPhotoSchema = z.strictObject({
  /** The gallery row: the page's key for the photo. */
  id: idSchema,
  /** The TREK photo, what /api/public/journey/:token/photos/:photoId/:kind serves. */
  photo_id: idSchema,
  caption: z.string().nullable(),
  media_type: z.string().nullable(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  duration_ms: z.number().nullable(),
  taken_at: z.string().nullable(),
  lat: z.number().nullable(),
  lng: z.number().nullable(),
  /** A clip without a poster frame: its thumbnail route 404s, so the page draws a plain tile (#2341). */
  posterless: z.boolean(),
  /**
   * Clips only, deprecated: 'local' or the provider's name. App builds and
   * cached pages from before `posterless` read it to decide on the poster; it
   * names no file. Drop it once those have aged out.
   */
  provider: z.string().nullable().optional(),
});
export type JourneyPublicPhoto = z.infer<typeof journeyPublicPhotoSchema>;

/**
 * An entry on the public page. A map-only share carries just what plots a
 * marker, so the narrative fields are optional; the coordinates are null
 * unless the map is shared.
 */
export const journeyPublicEntrySchema = z.strictObject({
  id: idSchema,
  type: z.string(),
  entry_date: z.string(),
  entry_time: z.string().nullable().optional(),
  sort_order: z.number().nullable(),
  title: z.string().nullable(),
  story: z.string().nullable().optional(),
  location_name: z.string().nullable(),
  location_lat: z.number().nullable(),
  location_lng: z.number().nullable(),
  country_code: z.string().nullable().optional(),
  mood: z.string().nullable().optional(),
  weather: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  pros_cons: z.record(z.string(), z.unknown()).nullable().optional(),
  photos: z.array(journeyPublicPhotoSchema).optional(),
});
export type JourneyPublicEntry = z.infer<typeof journeyPublicEntrySchema>;

export const journeyPublicResponseSchema = z.strictObject({
  journey: z.strictObject({
    title: z.string(),
    subtitle: z.string().nullable(),
    /** The cover's upload name, rendered through /uploads. */
    cover_image: z.string().nullable(),
    status: z.string().nullable(),
    show_verdict: z.number(),
    show_mood: z.number(),
    show_weather: z.number(),
  }),
  entries: z.array(journeyPublicEntrySchema),
  gallery: z.array(journeyPublicPhotoSchema),
  stats: z.strictObject({ entries: z.number(), photos: z.number(), places: z.number() }),
  cartoApiKey: z.string(),
  permissions: z.strictObject({
    share_timeline: z.boolean(),
    share_gallery: z.boolean(),
    share_map: z.boolean(),
    newest_first: z.boolean(),
  }),
});
export type JourneyPublicResponse = z.infer<typeof journeyPublicResponseSchema>;
