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

export const mapsDirectionsPreviewModeSchema = z.enum(['driving', 'bicycling', 'walking', 'transit']);
export type MapsDirectionsPreviewMode = z.infer<typeof mapsDirectionsPreviewModeSchema>;

export const mapsDirectionsPreviewLocationSchema = latLng.extend({
  label: z.string().min(1).max(500).optional(),
  address: z.string().min(1).max(500).optional(),
  placeId: z.string().min(1).optional(),
  dataId: z.string().min(1).optional(),
  cid: z.string().min(1).optional(),
});
export type MapsDirectionsPreviewLocation = z.infer<typeof mapsDirectionsPreviewLocationSchema>;

export const mapsDirectionsPreviewTimeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('now'), timeZone: z.string().min(1).optional() }),
  z.object({ kind: z.literal('departAt'), epochSeconds: z.number(), timeZone: z.string().min(1).optional() }),
  z.object({
    kind: z.literal('departAtLocal'),
    localDateTime: z.string().min(1),
    timeZone: z.string().min(1).optional(),
  }),
  z.object({
    kind: z.literal('raw'),
    googleMapsEpochSeconds: z.number(),
    timeKindEnum: z.number().int().nonnegative().optional(),
    timeZone: z.string().min(1).optional(),
  }),
]);
export type MapsDirectionsPreviewTime = z.infer<typeof mapsDirectionsPreviewTimeSchema>;

export const mapsDirectionsPreviewRequestSchema = z.object({
  origin: mapsDirectionsPreviewLocationSchema,
  destination: mapsDirectionsPreviewLocationSchema,
  waypoints: z.array(mapsDirectionsPreviewLocationSchema).max(8).optional(),
  mode: mapsDirectionsPreviewModeSchema.optional(),
  language: z.string().min(1).optional(),
  region: z.string().min(1).optional(),
  time: mapsDirectionsPreviewTimeSchema.optional(),
  viewport: z
    .object({
      centerLat: z.number().optional(),
      centerLng: z.number().optional(),
      spanMeters: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      zoom: z.number().optional(),
    })
    .optional(),
  includeOverviewGeometry: z.boolean().optional(),
  includeSteps: z.boolean().optional(),
  includeRaw: z.boolean().optional(),
  includeDebug: z.boolean().optional(),
  featureProfile: z.enum(['compact', 'full']).optional(),
  timeoutMs: z.number().positive().optional(),
  internal: z
    .object({
      modeEnum: z.number().int().nonnegative().optional(),
      timeKindEnum: z.number().int().nonnegative().optional(),
      routePreferenceEnum: z.number().int().nonnegative().optional(),
    })
    .optional(),
});
export type MapsDirectionsPreviewRequest = z.infer<typeof mapsDirectionsPreviewRequestSchema>;

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
});
export type MapsResolveUrlResult = z.infer<typeof mapsResolveUrlResultSchema>;
