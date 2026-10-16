import { paddleBoatTypeSchema, paddleWaterContextSchema, plannableTourTypeSchema } from './tours.schema';

import { z } from 'zod';

/**
 * PAD-02: a GPX file is read and shown before anything is stored. The preview
 * runs the file through the same parser the import uses and answers what it
 * found; nothing is written. The import that follows takes the type the user
 * chose for it.
 */

const previewPointSchema = z.union([z.tuple([z.number(), z.number()]), z.tuple([z.number(), z.number(), z.number()])]);

export const tourGpxPreviewTrackSchema = z.object({
  name: z.string(),
  /** The whole line as the file holds it, every point, so the preview shows the full course. */
  geometry: z.array(previewPointSchema),
  point_count: z.number().int().nonnegative(),
  distance_km: z.number(),
  /** Null when the file carries no heights: unknown, never zero. */
  elevation_gain_m: z.number().nullable(),
  elevation_loss_m: z.number().nullable(),
  /** Already in the trip under the same name and start: the import skips it, as it always has. */
  duplicate: z.boolean(),
});
export type TourGpxPreviewTrack = z.infer<typeof tourGpxPreviewTrackSchema>;

export const tourGpxPreviewResponseSchema = z.object({
  tracks: z.array(tourGpxPreviewTrackSchema),
});
export type TourGpxPreviewResponse = z.infer<typeof tourGpxPreviewResponseSchema>;

/**
 * The fields of the multipart import beside the file, as strings the way a
 * form sends them. Left out, the import is a hike, as it always was; a paddle
 * import names its boat and water like a planned paddle tour does.
 */
export const tourGpxImportFieldsSchema = z
  .object({
    tour_type: plannableTourTypeSchema.default('hike'),
    boat_type: paddleBoatTypeSchema.optional(),
    water_context: paddleWaterContextSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const paddle = value.tour_type === 'kayak';
    for (const field of ['boat_type', 'water_context'] as const) {
      if (paddle && value[field] === undefined)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `a paddle import needs ${field}` });
      if (!paddle && value[field] !== undefined)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: `${field} belongs to a paddle import` });
    }
  });
export type TourGpxImportFields = z.infer<typeof tourGpxImportFieldsSchema>;
