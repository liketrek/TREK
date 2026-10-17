import { z } from 'zod';

/**
 * PAD-05A, the admin side: the regions TREK reads paddle data for. Each is
 * one of Geofabrik's regional OpenStreetMap extracts, chosen by its id there
 * (`oberpfalz`, `us/california`); TREK downloads it, reads the paddle objects
 * out and keeps nothing else of it. A region is read again every month.
 */

export const paddleRegionStatusSchema = z.enum(['queued', 'importing', 'ready', 'failed']);
export type PaddleRegionStatus = z.infer<typeof paddleRegionStatusSchema>;

export const paddleRegionSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: paddleRegionStatusSchema,
  /** The date the region's data is current to, ISO 8601; null before the first read. */
  source_timestamp: z.string().nullable(),
  /** When TREK last read it, ISO 8601. */
  imported_at: z.string().nullable(),
  feature_count: z.number().int(),
  /** Why the last read failed, as plain text; null otherwise. */
  error: z.string().nullable(),
  /**
   * How far the read under way has come: the download, then the reading of
   * the file, each with the share done (null while the size is unknown).
   * Null unless the region is being read.
   */
  progress: z
    .object({
      phase: z.enum(['download', 'read']),
      fraction: z.number().min(0).max(1).nullable(),
    })
    .nullable(),
});
export type PaddleRegion = z.infer<typeof paddleRegionSchema>;

export const paddleRegionListResponseSchema = z.object({ regions: z.array(paddleRegionSchema) });
export type PaddleRegionListResponse = z.infer<typeof paddleRegionListResponseSchema>;

export const paddleRegionCatalogEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** The regions it lies in, outermost first, for telling "Limburg" from "Limburg". */
  path: z.array(z.string()),
});
export type PaddleRegionCatalogEntry = z.infer<typeof paddleRegionCatalogEntrySchema>;

export const paddleRegionCatalogQuerySchema = z.object({ q: z.string().trim().min(2).max(80) });
export const paddleRegionCatalogResponseSchema = z.object({ regions: z.array(paddleRegionCatalogEntrySchema) });
export type PaddleRegionCatalogResponse = z.infer<typeof paddleRegionCatalogResponseSchema>;

/** Geofabrik's region ids: lower case words, digits and dashes, a few of them nested with a slash (`us/texas`). */
export const paddleRegionIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9-]+(\/[a-z0-9-]+)*$/);

/** A region's boundary as Geofabrik draws it: a polygon or several, rings of [lng, lat]. */
const boundaryRing = z.array(z.tuple([z.number(), z.number()]));
export const paddleRegionBoundarySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Polygon'), coordinates: z.array(boundaryRing) }),
  z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(z.array(boundaryRing)) }),
]);
export type PaddleRegionBoundary = z.infer<typeof paddleRegionBoundarySchema>;

export const paddleRegionRequestSchema = z.object({ id: paddleRegionIdSchema });
export type PaddleRegionRequest = z.infer<typeof paddleRegionRequestSchema>;
