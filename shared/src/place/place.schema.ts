import { tagSchema } from '../tag/tag.schema';

import { z } from 'zod';

/**
 * Place API contract — single source of truth for the /api/trips/:tripId/places
 * endpoints (place pool CRUD, GPX/map/list imports, image search, bulk delete).
 *
 * Trip-scoped; mutations use the 'place_edit' permission.
 * server/src/nest/places/places.controller.ts fires the journey
 * place-created/updated/deleted hooks. Place rows are wide and provider-derived,
 * so create/update payloads stay mostly open with `name` pinned; string fields
 * are capped (name 200, description 2000, address 500, notes 2000) in the
 * controller.
 */

const open = z.record(z.string(), z.unknown());

/** `#rgb` / `#rrggbb`, the form both map renderers and CSS accept. */
export const hexColorSchema = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);

/**
 * The four shapes a place thumbnail is ever allowed to take: a file we stored, a
 * photo-proxy path, an inline thumbnail, or a remote https image.
 *
 * The map markers build their HTML as a string, so what lands here is one input
 * away from a renderer that forgets to escape. Pinning the scheme on the way in
 * means a stored value cannot carry anything a future consumer has to defend
 * against — the escaping in the marker builders stops being the only thing
 * standing between the database and the DOM.
 */
export const placeImageUrlSchema = z.string().max(2048).refine(
  v =>
    v.startsWith('/uploads/')
    || v.startsWith('/api/maps/place-photo/')
    || /^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(v)
    || /^https:\/\//i.test(v),
  { message: 'must be an uploaded path, a photo-proxy path, an inline image or an https URL' },
);

/**
 * A place's homepage. It reaches window.open() on the client, where a
 * javascript: value would run in this origin rather than opening a page.
 */
export const placeWebsiteSchema = z.string().max(500).refine(
  v => /^https?:\/\//i.test(v),
  { message: 'must be an http or https URL' },
);

/**
 * Embedded category as returned on a place — a trimmed projection of the
 * categories row (id/name/color/icon), built inline by placeService and
 * getPlaceWithTags. `null` when the place has no category_id.
 */
export const placeCategorySchema = z
  .object({
    id: z.number(),
    name: z.string().nullable(),
    color: z.string().nullable(),
    icon: z.string().nullable(),
  })
  .nullable();
export type PlaceCategory = z.infer<typeof placeCategorySchema>;

/**
 * Full place entity as returned by the place list / get / create / update
 * endpoints (server/src/nest/places/places.service.ts -> getPlaceWithTags). All
 * columns of the `places` table (see server/data DB) plus the joined `category`
 * projection and `tags` array. Numbers (lat/lng/price) are SQLite REAL, ids are
 * INTEGER; provider-derived columns are nullable.
 */
// One member's star vote on a place (#1435), with display info for the tooltip.
export const placeRatingVoteSchema = z.object({
  user_id: z.number(),
  username: z.string(),
  avatar: z.string().nullable().optional(),
  rating: z.number(),
});
export type PlaceRatingVote = z.infer<typeof placeRatingVoteSchema>;

export const placeSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  reservation_status: z.string().nullable().optional(),
  reservation_notes: z.string().nullable().optional(),
  reservation_datetime: z.string().nullable().optional(),
  place_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  google_place_id: z.string().nullable().optional(),
  google_ftid: z.string().nullable().optional(),
  osm_id: z.string().nullable().optional(),
  route_geometry: z.string().nullable().optional(),
  // Manual track colour (#776). null = inherit the category colour like before.
  route_color: hexColorSchema.nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  transport_mode: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  category: placeCategorySchema.optional(),
  tags: z.array(tagSchema.partial()).optional(),
  // Collaborative ratings (#1435): every member's vote (for the who-voted
  // tooltip) plus the aggregate the UI displays.
  ratings: z.array(placeRatingVoteSchema).optional(),
  rating_avg: z.number().nullable().optional(),
  rating_count: z.number().optional(),
});
export type Place = z.infer<typeof placeSchema>;

/**
 * Trimmed place projection embedded inside a day-assignment response
 * (server/src/services/queryHelpers.ts -> formatAssignmentWithPlace). This is a
 * SUBSET of the full place: no trip_id / osm_id / route_geometry / created_at /
 * reservation_* — only the fields the planner needs to render the itinerary card.
 */
export const assignmentPlaceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  address: z.string().nullable().optional(),
  category_id: z.number().nullable().optional(),
  price: z.number().nullable().optional(),
  currency: z.string().nullable().optional(),
  place_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  duration_minutes: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  transport_mode: z.string().nullable().optional(),
  google_place_id: z.string().nullable().optional(),
  google_ftid: z.string().nullable().optional(),
  // Carried on the embedded place so the day-plan thumbnail can auto-fetch an
  // OSM photo the same way the sidebar/inspector do (#1136 follow-up).
  osm_id: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  category: placeCategorySchema.optional(),
  tags: z.array(tagSchema.partial()).optional(),
});
export type AssignmentPlace = z.infer<typeof assignmentPlaceSchema>;

export const placeCreateRequestSchema = open.and(z.object({ name: z.string().min(1) }));
export type PlaceCreateRequest = z.infer<typeof placeCreateRequestSchema>;

export const placeUpdateRequestSchema = open;
export type PlaceUpdateRequest = z.infer<typeof placeUpdateRequestSchema>;

// Collaborative ratings (#1435): one 1-5 star vote per user and place.
export const placeRatingRequestSchema = z.object({
  rating: z.number().int().min(1).max(5),
});
export type PlaceRatingRequest = z.infer<typeof placeRatingRequestSchema>;

export const placeBulkDeleteRequestSchema = z.object({
  ids: z.array(z.number()),
});
export type PlaceBulkDeleteRequest = z.infer<typeof placeBulkDeleteRequestSchema>;

export const placeBulkUpdateRequestSchema = z.object({
  // Deliberately unbounded: the endpoint answers an empty list with
  // `{ updated: [], count: 0 }` rather than a 400, so a `.min(1)` here would
  // change that contract once the body validates through the Zod pipe.
  ids: z.array(z.number()),
  // null clears the category ("No category"); a number sets it. Optional so the
  // field can be omitted, but the endpoint requires it to be present to act.
  category_id: z.number().nullable().optional(),
});
export type PlaceBulkUpdateRequest = z.infer<typeof placeBulkUpdateRequestSchema>;

export const placeImportListRequestSchema = z.object({
  url: z.string().min(1),
  // Opt-in: enrich imported places via the Places API (#886). Requires a Google
  // Maps key; runs as a background pass after the import returns.
  enrich: z.boolean().optional(),
});
export type PlaceImportListRequest = z.infer<typeof placeImportListRequestSchema>;

/**
 * GPX import (multipart/form-data alongside the `file` part). Form fields arrive
 * as strings — the client sends `String(boolean)` — so they stay `z.string()`
 * and the route keeps its own `'true'`-comparison coercion (same shape as
 * fileUploadRequestSchema). Every field optional: an omitted flag defaults to
 * true server-side.
 */
export const placeImportGpxRequestSchema = z.object({
  importWaypoints: z.string().optional(),
  importRoutes: z.string().optional(),
  importTracks: z.string().optional(),
});
export type PlaceImportGpxRequest = z.infer<typeof placeImportGpxRequestSchema>;

/**
 * GPX export (query string), the mirror of the import flags. Every field optional
 * and string-typed because these arrive as query parameters; an omitted flag
 * defaults to true server-side, so a bare `export.gpx` returns everything.
 */
export const placeExportGpxRequestSchema = z.object({
  waypoints: z.string().optional(),
  tracks: z.string().optional(),
  dayRoutes: z.string().optional(),
});
export type PlaceExportGpxRequest = z.infer<typeof placeExportGpxRequestSchema>;

/** KML/KMZ import (multipart/form-data); same string-field contract as GPX. */
export const placeImportMapRequestSchema = z.object({
  importPoints: z.string().optional(),
  importPaths: z.string().optional(),
});
export type PlaceImportMapRequest = z.infer<typeof placeImportMapRequestSchema>;

/** Query filters for the place list. */
export const placeListQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
});
export type PlaceListQuery = z.infer<typeof placeListQuerySchema>;
