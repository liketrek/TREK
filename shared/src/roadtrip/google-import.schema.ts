import { idSchema } from '../common/primitives.schema';

import { z } from 'zod';

export const googleRoutePreviewRequestSchema = z.object({ url: z.string().url().max(12000) });
export const googleRouteStopSchema = z.object({
  name: z.string().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export const googleRoutePreviewSchema = z.object({
  stops: z
    .array(
      z.object({
        name: z.string(),
        lat: z.number().nullable(),
        lng: z.number().nullable(),
      }),
    )
    .max(30),
});
export const googleRouteImportSchema = z.object({
  dayId: idSchema,
  stops: z.array(googleRouteStopSchema).min(2).max(30),
});
export type GoogleRouteImport = z.infer<typeof googleRouteImportSchema>;
export type GoogleRoutePreview = z.infer<typeof googleRoutePreviewSchema>;
