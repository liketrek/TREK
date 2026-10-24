import { skiRouteBuildSchema } from '../tours/ski.schema';

import { z } from 'zod';

/**
 * What the Places host's winter layer answers before any graph is fetched:
 * which build it serves (`/v1/winter/meta`) and every ski area with its box,
 * size and checksum (`/v1/winter/index`). Neither takes a coordinate. A new
 * build is told by `indexSha`, the SHA-256 of the unpacked index JSON, never
 * by the build's name, which repeats when a build is redone the same day.
 */

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/);

/**
 * A build is read to the same rule a ski tour stores it by, so a build TREK
 * could not save with a tour is refused when the layer is read, not on the
 * tour's next save.
 */
const winterBuildSchema = skiRouteBuildSchema;

/** The attribution block the winter layer carries; only the two lines TREK prints are required. */
export const winterAttributionSchema = z.object({
  data: z.string(),
  terrain: z.string(),
});
export type WinterAttribution = z.infer<typeof winterAttributionSchema>;

export const winterMetaSchema = z.object({
  build: winterBuildSchema,
  format: z.number().int(),
  areas: z.number().int().nonnegative(),
  indexSha: sha256Schema,
  sourceTimestamp: z.string().nullable().optional(),
  attribution: winterAttributionSchema,
});
export type WinterMeta = z.infer<typeof winterMetaSchema>;

/** The km of each kind of way an area holds, and its lift count. */
export const winterAreaCountsSchema = z.object({
  runsKm: z.number().nonnegative(),
  nordicKm: z.number().nonnegative(),
  lifts: z.number().int().nonnegative(),
  skitourKm: z.number().nonnegative(),
  hikeKm: z.number().nonnegative(),
});
export type WinterAreaCounts = z.infer<typeof winterAreaCountsSchema>;

export const winterIndexRowSchema = z.object({
  id: z
    .string()
    .max(64)
    .regex(/^[a-z]:[0-9]+(-[0-9a-z]+)?$/),
  name: z.string().nullable(),
  kind: z.string(),
  country: z.string().nullable(),
  colourScheme: z.enum(['europe', 'north_america']),
  /** [minLng, minLat, maxLng, maxLat] */
  bbox: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
  counts: winterAreaCountsSchema,
  /** The size of the area's gzip-packed graph, and its SHA-256, exactly as sent. */
  bytes: z.number().int().nonnegative(),
  sha256: sha256Schema,
});
export type WinterIndexRow = z.infer<typeof winterIndexRowSchema>;

export const winterIndexSchema = z.object({
  build: winterBuildSchema,
  format: z.number().int(),
  areas: z.array(winterIndexRowSchema),
});
export type WinterIndex = z.infer<typeof winterIndexSchema>;
