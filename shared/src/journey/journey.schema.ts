import { journeyRecordingDateSchema } from './journey-recordings.schema';

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

/** Free-form: forwarded to the service as-is, apart from the fields typed here. */
export const journeyUpdateRequestSchema = z.looseObject({
  auto_prepare_recordings: z
    .boolean()
    .optional()
    .describe(
      "Whether the Dawarich sync prepares the recorded days of the linked trips' periods for the owner and every editor with a connection of their own (JRN-03). Off by default; switching it off stops it, and nothing taken over is touched",
    ),
});
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

/**
 * The photos of one entry in their new order (#824): every journey photo id the
 * entry holds, each once. Strict, unlike the legacy reorder above: nothing older
 * relies on a looser shape here.
 */
export const journeyReorderEntryPhotosRequestSchema = z.object({
  orderedIds: z.array(z.number().int().positive()).min(1).max(500),
});
export type JourneyReorderEntryPhotosRequest = z.infer<typeof journeyReorderEntryPhotosRequestSchema>;

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
  content_base64: z
    .string()
    .min(1)
    .max(14 * 1024 * 1024),
  caption: z.string().max(2000).optional(),
});
export type JournalPluginPhotoInput = z.infer<typeof journalPluginPhotoInputSchema>;

/*
 * The three entry fields with a fixed set of values. `journey_entries.type` and
 * `.visibility` are plain TEXT columns and the REST route forwards whatever the
 * client sent, but the row type (JourneyEntry on the server) only ever models
 * these, so the MCP tools and the assistant's cards name them rather than take
 * a free string: a model that invents "friends-only" would write a value
 * nothing reads.
 */
export const journeyEntryTypeSchema = z.enum(['entry', 'checkin', 'skeleton']);
export type JourneyEntryType = z.infer<typeof journeyEntryTypeSchema>;
export const journeyEntryVisibilitySchema = z.enum(['private', 'shared', 'public']);
export type JourneyEntryVisibility = z.infer<typeof journeyEntryVisibilitySchema>;

/**
 * The verdict on a place. Either side defaults to empty so a caller can send
 * only the half it has, which is what the entry editor does when a place was
 * all good or all bad. The service stores nothing when both come back empty.
 */
export const journeyEntryProsConsSchema = z.strictObject({
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
});
export type JourneyEntryProsCons = z.infer<typeof journeyEntryProsConsSchema>;

/**
 * The days a read of a journal's entries keeps, both ends included; either end
 * left out is open. What the assistant asks for when it shows the entries of
 * one day ("what did I write yesterday"), so it reads that day and no more.
 */
export const journeyEntriesRangeSchema = z.object({
  from: journeyRecordingDateSchema.optional().describe('First day to include (YYYY-MM-DD); open when left out'),
  to: journeyRecordingDateSchema.optional().describe('Last day to include (YYYY-MM-DD); open when left out'),
});
export type JourneyEntriesRange = z.infer<typeof journeyEntriesRangeSchema>;

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
export const journeyEntryPhotoUploadRequestSchema = z
  .looseObject({
    caption: z.unknown().optional(),
  })
  .optional();
export type JourneyEntryPhotoUploadRequest = z.infer<typeof journeyEntryPhotoUploadRequestSchema>;

/** Multipart field alongside the uploaded video — absent body for the same reason. */
export const journeyGalleryVideoRequestSchema = z
  .looseObject({
    duration_ms: z.unknown().optional(),
  })
  .optional();
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
  /** Put the linked trips' plan on the shared map (JRN-04). Nothing without `share_map`. */
  share_plan: z.boolean().optional(),
  /** Put the recorded days on the shared map, on days with a published entry (JRN-04). */
  share_recordings: z.boolean().optional(),
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
  /**
   * What the line is (JRN-01): a GPX track of a trip, planned; a day recording
   * the journey keeps; or the live Dawarich trail. Absent means a trip's GPX,
   * which is all GET `:id/tracks` has ever answered.
   */
  kind: z.enum(['trip_gpx', 'day_recording', 'dawarich_live']).optional(),
});
export type JourneyTrack = z.infer<typeof journeyTrackSchema>;

export const journeyTracksResponseSchema = z.object({
  tracks: z.array(journeyTrackSchema),
});
export type JourneyTracksResponse = z.infer<typeof journeyTracksResponseSchema>;

// ── Responses ───────────────────────────────────────────────────────────────

/**
 * A journeys row as the routes return it. Unlike most tables its times are epoch
 * milliseconds, and its flags SQLite 0/1, as stored.
 */
export const journeySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  subtitle: z.string().nullable(),
  cover_gradient: z.string().nullable(),
  status: z.string().nullable(),
  created_at: z.number(),
  updated_at: z.number(),
  cover_image: z.string().nullable(),
  show_trip_tracks: z.number(),
  show_verdict: z.number(),
  show_mood: z.number(),
  show_weather: z.number(),
  status_override: z.string().nullable(),
  photo_location: z.number(),
  /** JRN-03, 0/1. Optional so a row built without it still answers inside the contract. */
  auto_prepare_recordings: z.number().optional(),
});
export type JourneyRecord = z.infer<typeof journeySchema>;

/** A journey on the dashboard, with its stat pills. */
export const journeyListItemSchema = journeySchema.extend({
  entry_count: z.number(),
  photo_count: z.number(),
  place_count: z.number(),
  trip_date_min: z.string().nullable(),
  trip_date_max: z.string().nullable(),
});
export type JourneyListItem = z.infer<typeof journeyListItemSchema>;

/** GET /api/journeys */
export const journeyListResponseSchema = z.object({ journeys: z.array(journeyListItemSchema) });
export type JourneyListResponse = z.infer<typeof journeyListResponseSchema>;

/** A journey's public share link and what it shows. */
export const journeyShareLinkSchema = z.object({
  token: z.string(),
  created_at: z.string().nullable(),
  share_timeline: z.boolean(),
  share_gallery: z.boolean(),
  share_map: z.boolean(),
  newest_first: z.boolean(),
  share_plan: z.boolean(),
  share_recordings: z.boolean(),
});
export type JourneyShareLink = z.infer<typeof journeyShareLinkSchema>;

/** GET :id/share-link: the link, or null while the journey is not published. */
export const journeyShareLinkResponseSchema = z.object({ link: journeyShareLinkSchema.nullable() });
export type JourneyShareLinkResponse = z.infer<typeof journeyShareLinkResponseSchema>;

/** POST :id/share-link: the token, and whether this call minted it. */
export const journeyShareLinkSetResponseSchema = z.object({ token: z.string(), created: z.boolean() });
export type JourneyShareLinkSetResponse = z.infer<typeof journeyShareLinkSetResponseSchema>;
