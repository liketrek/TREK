import { z } from 'zod';

/**
 * Journey API contract — cross-trip travel narrative (journeys, dated entries,
 * a photo gallery with provider mirroring, contributors, per-user preferences
 * and public share links).
 *
 * Authenticated routes live under /api/journeys (gated by the Journey addon);
 * the public read/photo-proxy routes live under /api/public/journey and are
 * share-token validated. Access control lives inside journeyService (it returns
 * null/false → the controller maps to 403/404), so these schemas pin the
 * well-defined request bodies; entry create/update stay open-ended (forwarded
 * to the service) and the bespoke 400/403/404 messages pin the rest.
 */

export const journeyCreateRequestSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  trip_ids: z.array(z.union([z.string(), z.number()])).optional(),
});
export type JourneyCreateRequest = z.infer<typeof journeyCreateRequestSchema>;

export const journeyAddTripRequestSchema = z.object({
  trip_id: z.union([z.string(), z.number()]),
});
export type JourneyAddTripRequest = z.infer<typeof journeyAddTripRequestSchema>;

export const journeyReorderEntriesRequestSchema = z.object({
  orderedIds: z.array(z.union([z.string(), z.number()])).min(1),
});
export type JourneyReorderEntriesRequest = z.infer<typeof journeyReorderEntriesRequestSchema>;

export const journeyContributorRequestSchema = z.object({
  user_id: z.union([z.string(), z.number()]),
  role: z.enum(['editor', 'viewer']).optional(),
});
export type JourneyContributorRequest = z.infer<typeof journeyContributorRequestSchema>;

export const journeyProviderPhotosRequestSchema = z.object({
  provider: z.string().min(1),
  asset_id: z.string().optional(),
  asset_ids: z.array(z.union([z.string(), z.number()])).optional(),
  caption: z.string().optional(),
  passphrase: z.string().optional(),
});
export type JourneyProviderPhotosRequest = z.infer<typeof journeyProviderPhotosRequestSchema>;

export const journeyShareLinkRequestSchema = z.object({
  share_timeline: z.boolean().optional(),
  share_gallery: z.boolean().optional(),
  share_map: z.boolean().optional(),
});
export type JourneyShareLinkRequest = z.infer<typeof journeyShareLinkRequestSchema>;
