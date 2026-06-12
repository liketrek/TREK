import { z } from 'zod';

/**
 * Atlas API contract — single source of truth for the /api/addons/atlas endpoints
 * (visited countries/regions, region GeoJSON, and the travel bucket list).
 *
 * Parity note: unlike the journey addon, the legacy atlas route is NOT gated by
 * an addon-enabled check (app.ts mounts it without one), so the migration does
 * not add a gate either — adding one would be a breaking 404.
 *
 * Stats, visited-regions and GeoJSON are wide, externally-derived shapes kept as
 * open records; the request schemas and the bespoke 400/404 controller messages
 * pin the parts the client depends on.
 */

const open = z.record(z.string(), z.unknown());

export const markRegionRequestSchema = z.object({
  name: z.string().min(1),
  country_code: z.string().min(1),
});
export type MarkRegionRequest = z.infer<typeof markRegionRequestSchema>;

export const createBucketItemRequestSchema = z.object({
  name: z.string().min(1),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  country_code: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  target_date: z.string().nullable().optional(),
});
export type CreateBucketItemRequest = z.infer<
  typeof createBucketItemRequestSchema
>;

export const updateBucketItemRequestSchema = z.object({
  name: z.string().optional(),
  notes: z.string().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  country_code: z.string().nullable().optional(),
  target_date: z.string().nullable().optional(),
});
export type UpdateBucketItemRequest = z.infer<
  typeof updateBucketItemRequestSchema
>;

/** A bucket-list item row (DB-shaped; kept open). */
export const bucketItemSchema = open;

export const bucketListResponseSchema = z.object({
  items: z.array(bucketItemSchema),
});
export type BucketListResponse = z.infer<typeof bucketListResponseSchema>;

/** GeoJSON FeatureCollection (kept open — provider-derived geometry). */
export const regionGeoSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(z.unknown()),
});
export type RegionGeo = z.infer<typeof regionGeoSchema>;
