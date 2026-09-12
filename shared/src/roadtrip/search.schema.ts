import { roadtripCorridorRequestSchema } from './planning.schema';

import { z } from 'zod';

export const roadtripSearchAreaSchema = z.object({
  categories: z.array(roadtripCorridorRequestSchema.shape.category).min(1).max(7),
  bbox: z
    .object({
      south: z.number().min(-90).max(90),
      north: z.number().min(-90).max(90),
      west: z.number().min(-180).max(180),
      east: z.number().min(-180).max(180),
    })
    .refine((b) => b.south < b.north && b.west < b.east, 'Invalid search area'),
  lang: z.string().max(20).optional(),
});
export type RoadtripSearchArea = z.infer<typeof roadtripSearchAreaSchema>;

export const roadtripSearchPoiSchema = z.object({
  osm_id: z.string(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  category: z.string(),
  poi_type: z.string(),
  source: z.string(),
  address: z.string().nullable(),
  website: z.string().nullable(),
  phone: z.string().nullable(),
  opening_hours: z.string().nullable(),
  cuisine: z.string().nullable(),
  brand: z.string().nullable().optional(),
  brand_wikidata: z.string().nullable().optional(),
  charging: z
    .object({
      sockets: z.array(z.object({ type: z.string(), count: z.number().nullable(), kw: z.number().nullable() })),
      capacity: z.number().nullable(),
      fee: z.boolean().nullable(),
    })
    .nullable()
    .optional(),
  rating: z.number().nullable().optional(),
  pluginId: z.string().optional(),
});
export const roadtripSearchAreaResponseSchema = z.object({
  pois: z.array(roadtripSearchPoiSchema),
  sources: z.array(z.string()),
  failedSources: z.array(z.string()),
  truncated: z.boolean(),
  clamped: z.boolean(),
});
export type RoadtripSearchAreaResponse = z.infer<typeof roadtripSearchAreaResponseSchema>;
