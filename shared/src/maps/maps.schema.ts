import { z } from 'zod';

/**
 * Maps / geo API contract — single source of truth for the /api/maps endpoints.
 *
 * The legacy Express route (server/src/routes/maps.ts) is a thin layer over
 * services/mapsService.ts, which talks to Nominatim/Overpass (and optionally
 * Google Places when a key is configured) and applies the SSRF guard on every
 * outbound URL. The place objects these return are provider-shaped and vary by
 * source, so the response schemas keep them as open records — the contract pins
 * down the request shapes and the stable envelope fields, not the provider blobs.
 *
 * The bespoke 400 validation messages and the per-endpoint kill-switch responses
 * are reproduced in the controller, not derived from these schemas, so the bodies
 * stay byte-identical to Express.
 */

const latLng = z.object({ lat: z.number(), lng: z.number() });

export const mapsSearchRequestSchema = z.object({
  query: z.string().min(1),
});
export type MapsSearchRequest = z.infer<typeof mapsSearchRequestSchema>;

export const mapsAutocompleteRequestSchema = z.object({
  input: z.string().min(1).max(200),
  lang: z.string().optional(),
  locationBias: z.object({ low: latLng, high: latLng }).optional(),
});
export type MapsAutocompleteRequest = z.infer<typeof mapsAutocompleteRequestSchema>;

export const mapsReverseQuerySchema = z.object({
  lat: z.string().min(1),
  lng: z.string().min(1),
  lang: z.string().optional(),
});
export type MapsReverseQuery = z.infer<typeof mapsReverseQuerySchema>;

export const mapsResolveUrlRequestSchema = z.object({
  url: z.string().min(1),
});
export type MapsResolveUrlRequest = z.infer<typeof mapsResolveUrlRequestSchema>;

/** Provider-shaped place blob (Google/OSM fields differ); kept open by design. */
const placeRecord = z.record(z.string(), z.unknown());

export const mapsSearchResultSchema = z.object({
  places: z.array(placeRecord),
  source: z.string(),
});
export type MapsSearchResult = z.infer<typeof mapsSearchResultSchema>;

export const mapsAutocompleteSuggestionSchema = z.object({
  placeId: z.string(),
  mainText: z.string(),
  secondaryText: z.string(),
});
export const mapsAutocompleteResultSchema = z.object({
  suggestions: z.array(mapsAutocompleteSuggestionSchema),
  source: z.string(),
});
export type MapsAutocompleteResult = z.infer<typeof mapsAutocompleteResultSchema>;

export const mapsPlaceDetailsResultSchema = z.object({
  place: placeRecord.nullable(),
  disabled: z.boolean().optional(),
});
export type MapsPlaceDetailsResult = z.infer<typeof mapsPlaceDetailsResultSchema>;

export const mapsPlacePhotoResultSchema = z.object({
  photoUrl: z.string().nullable(),
  attribution: z.string().nullable().optional(),
});
export type MapsPlacePhotoResult = z.infer<typeof mapsPlacePhotoResultSchema>;

export const mapsReverseResultSchema = z.object({
  name: z.string().nullable(),
  address: z.string().nullable(),
});
export type MapsReverseResult = z.infer<typeof mapsReverseResultSchema>;

export const mapsResolveUrlResultSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  name: z.string().nullable(),
  address: z.string().nullable(),
  google_ftid: z.string().nullable().optional(),
});
export type MapsResolveUrlResult = z.infer<typeof mapsResolveUrlResultSchema>;
