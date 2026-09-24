import { z } from 'zod';

/**
 * Journey API contract — cross-trip travel narrative (journeys, dated entries,
 * a photo gallery with provider mirroring, contributors, per-user preferences
 * and public share links).
 *
 * Authenticated routes live under /api/journeys (gated by the Journey addon);
 * the public read/photo-proxy routes live under /api/public/journey and are
 * share-token validated. Access control lives inside the journey services (they
 * return null/false → the controller maps to 403/404).
 *
 * Deliberately permissive, the same doctrine as memories (#1842): eight of the
 * sixteen handlers validate their own body and answer with their own text —
 * 'Title is required', 'trip_id required', 'provider and asset_id required',
 * and so on — and those messages are pinned by e2e and integration cases. A
 * strict schema would have the global pipe answer first, with a different body,
 * which is a client-visible change wearing the costume of a refactor. So every
 * field the handler type-checks itself is `unknown` here: the schema describes
 * the shape that already works, and the boot-time contract gate gets something
 * to point at.
 *
 * They are LOOSE objects for the second memories reason: a strict object strips
 * unknown keys, and the update/entry/preferences bodies are forwarded to the
 * services whole. Stripping there would silently drop a field added later.
 */

export const journeyCreateRequestSchema = z.looseObject({
  // The handler does `!body.title || typeof body.title !== 'string' || !trim()`
  // and answers 'Title is required'. Typing it here would pre-empt that.
  title: z.unknown().optional(),
  subtitle: z.unknown().optional(),
  // `Array.isArray(body.trip_ids) ? body.trip_ids.map(Number) : []` — anything
  // that is not an array is silently treated as none.
  trip_ids: z.unknown().optional(),
});
export type JourneyCreateRequest = z.infer<typeof journeyCreateRequestSchema>;

/** Free-form: forwarded to the service as-is. */
export const journeyUpdateRequestSchema = z.looseObject({});
export type JourneyUpdateRequest = z.infer<typeof journeyUpdateRequestSchema>;

export const journeyAddTripRequestSchema = z.looseObject({
  // Handler answers 'trip_id required'.
  trip_id: z.unknown().optional(),
});
export type JourneyAddTripRequest = z.infer<typeof journeyAddTripRequestSchema>;

export const journeyReorderEntriesRequestSchema = z.looseObject({
  // No .min(1): an empty list is accepted today and short-circuits in the
  // handler, and the handler's own 'orderedIds must be...' check is the one
  // that answers for a malformed list.
  orderedIds: z.unknown().optional(),
});
export type JourneyReorderEntriesRequest = z.infer<typeof journeyReorderEntriesRequestSchema>;

export const journeyContributorRequestSchema = z.looseObject({
  // Handler answers 'user_id required'; role is cast, never validated.
  user_id: z.unknown().optional(),
  role: z.unknown().optional(),
});
export type JourneyContributorRequest = z.infer<typeof journeyContributorRequestSchema>;

export const journeyContributorUpdateRequestSchema = z.looseObject({
  role: z.unknown().optional(),
});
export type JourneyContributorUpdateRequest = z.infer<typeof journeyContributorUpdateRequestSchema>;

export const journeyProviderPhotosRequestSchema = z.looseObject({
  // Handler answers 'provider and asset_id required' when either is missing,
  // and branches on Array.isArray(asset_ids) before that.
  provider: z.unknown().optional(),
  asset_id: z.unknown().optional(),
  asset_ids: z.unknown().optional(),
  caption: z.unknown().optional(),
  passphrase: z.unknown().optional(),
  // Per-asset 'image' | 'video' discriminator, parallel to asset_ids (#823).
  media_type: z.unknown().optional(),
  media_types: z.unknown().optional(),
});
export type JourneyProviderPhotosRequest = z.infer<typeof journeyProviderPhotosRequestSchema>;

export const journeyLinkPhotoRequestSchema = z.looseObject({
  // Handler answers 'journey_photo_id required'.
  journey_photo_id: z.unknown().optional(),
  photo_id: z.unknown().optional(),
});
export type JourneyLinkPhotoRequest = z.infer<typeof journeyLinkPhotoRequestSchema>;

/** Free-form: forwarded to the service as-is. */
export const journeyPhotoUpdateRequestSchema = z.looseObject({});
export type JourneyPhotoUpdateRequest = z.infer<typeof journeyPhotoUpdateRequestSchema>;

/**
 * One photo handed to a journal entry over the plugin RPC (#1365).
 *
 * Strict, unlike the REST schemas above: those forward a free-form body to a
 * handler that picks what it needs, while this one is the whole contract with
 * third-party code, and an unknown key there is a mistake worth reporting rather
 * than ignoring.
 *
 * The encoded cap is the same 14MB the file surface uses. Base64 runs about a
 * third larger than the bytes, so it bounds the payload at roughly the 10MB the
 * handler enforces after decoding, and it does so before anything is decoded.
 */
export const journalPluginPhotoInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(255),
  content_base64: z.string().min(1).max(14 * 1024 * 1024),
  caption: z.string().max(2000).optional(),
});
export type JournalPluginPhotoInput = z.infer<typeof journalPluginPhotoInputSchema>;

/** Free-form plus the entry_date the handler demands itself. */
export const journeyEntryCreateRequestSchema = z.looseObject({
  entry_date: z.unknown().optional(),
});
export type JourneyEntryCreateRequest = z.infer<typeof journeyEntryCreateRequestSchema>;

/** Free-form: forwarded to the service as-is. */
export const journeyEntryUpdateRequestSchema = z.looseObject({});
export type JourneyEntryUpdateRequest = z.infer<typeof journeyEntryUpdateRequestSchema>;

/**
 * Multipart field alongside the uploaded files.
 *
 * `.optional()` is not decoration: a multipart request with files and no text
 * fields arrives with NO body at all, and the handler answers 'No files
 * uploaded' for the empty case. Without this the pipe would answer
 * 'body: Invalid input: expected object' first and the message would change.
 */
export const journeyEntryPhotoUploadRequestSchema = z.looseObject({
  caption: z.unknown().optional(),
}).optional();
export type JourneyEntryPhotoUploadRequest = z.infer<typeof journeyEntryPhotoUploadRequestSchema>;

/** Multipart field alongside the uploaded video — absent body for the same reason. */
export const journeyGalleryVideoRequestSchema = z.looseObject({
  duration_ms: z.unknown().optional(),
}).optional();
export type JourneyGalleryVideoRequest = z.infer<typeof journeyGalleryVideoRequestSchema>;

/** Free-form: per-user display preferences, forwarded whole. */
export const journeyPreferencesRequestSchema = z.looseObject({});
export type JourneyPreferencesRequest = z.infer<typeof journeyPreferencesRequestSchema>;

export const journeyShareLinkRequestSchema = z.looseObject({
  share_timeline: z.unknown().optional(),
  share_gallery: z.unknown().optional(),
  share_map: z.unknown().optional(),
  /** Show the newest entry first, blog-style, rather than in trip order (#1614). */
  newest_first: z.unknown().optional(),
});
export type JourneyShareLinkRequest = z.infer<typeof journeyShareLinkRequestSchema>;

/**
 * GPX tracks a journey can draw (#1260). A journey has no trip of its own, but its
 * entries record the trip and place they came from, so the tracks are the routed
 * geometries of the places in those trips. Points are [lat, lng] pairs, matching the
 * order the GPX importer stored them in; elevation, where the import kept it, is
 * dropped here because nothing on the map reads it.
 */
export const journeyTrackSchema = z.object({
  place_id: z.number(),
  trip_id: z.number(),
  name: z.string(),
  color: z.string().nullable(),
  points: z.array(z.tuple([z.number(), z.number()])),
});
export type JourneyTrack = z.infer<typeof journeyTrackSchema>;

export const journeyTracksResponseSchema = z.object({
  tracks: z.array(journeyTrackSchema),
});
export type JourneyTracksResponse = z.infer<typeof journeyTracksResponseSchema>;
