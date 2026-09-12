import { z } from 'zod';

const position = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);
const ring = z.array(position).min(4).max(50000);
export const hazardGeometrySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('Point'), coordinates: position }),
  z.object({ type: z.literal('Polygon'), coordinates: z.array(ring).min(1).max(500) }),
  z.object({ type: z.literal('MultiPolygon'), coordinates: z.array(z.array(ring).min(1).max(500)).max(500) }),
]);
export const roadtripHazardSchema = z.object({
  id: z.string(),
  source: z.enum(['DWD', 'GDACS']),
  title: z.string().max(2000),
  description: z.string().max(20000),
  updatedAt: z.string().datetime(),
  validUntil: z.string().datetime().nullable(),
  url: z.string().url(),
  geometry: hazardGeometrySchema,
  alertScore: z.number().finite().nonnegative().optional(),
});
export const roadtripHazardsSchema = z.object({
  fetchedAt: z.string().datetime(),
  hazards: z.array(roadtripHazardSchema).max(1000),
  sources: z.array(z.object({ source: z.enum(['DWD', 'GDACS']), status: z.enum(['ok', 'partial', 'unavailable']) })),
});
export type RoadtripHazard = z.infer<typeof roadtripHazardSchema>;
export type RoadtripHazards = z.infer<typeof roadtripHazardsSchema>;
