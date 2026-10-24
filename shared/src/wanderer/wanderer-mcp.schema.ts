import { idSchema } from '../common/primitives.schema';
import { includeGeometryFlagSchema } from '../tours/tour-display.schema';
import { wandererBboxSchema, wandererImportRequestSchema, WANDERER_SEARCH_MAX_PAGE } from './wanderer.schema';

import { z } from 'zod';

/**
 * The trip-side wanderer routes as the assistant asks them over MCP: the same
 * search, preview, import and source check, with each field described for a
 * model. The REST bodies stay as they are (`wandererSearchRequestSchema`,
 * `wandererImportRequestSchema`); these take the same values.
 */

const trailIdSchema = wandererImportRequestSchema.shape.trailId.describe(
  'The trail on the wanderer instance, as search_wanderer_trails gives it (id)',
);

export const wandererMcpSearchRequestSchema = z
  .object({
    q: z
      .string()
      .trim()
      .max(200)
      .optional()
      .describe('Words to look for in the trails, such as a place, a summit or a region; every trail when left out'),
    page: z
      .number()
      .int()
      .min(1)
      .max(WANDERER_SEARCH_MAX_PAGE)
      .optional()
      .describe('The page of results, from 1; 1 when left out'),
    bbox: wandererBboxSchema
      .optional()
      .describe('Only trails that run through this part of the map: south, west, north and east in degrees'),
  })
  .strict();
export type WandererMcpSearchRequest = z.infer<typeof wandererMcpSearchRequestSchema>;

export const wandererMcpPreviewRequestSchema = z
  .object({ trailId: trailIdSchema, include_geometry: includeGeometryFlagSchema })
  .strict();
export type WandererMcpPreviewRequest = z.infer<typeof wandererMcpPreviewRequestSchema>;

export const wandererMcpImportRequestSchema = z
  .object({
    trailId: trailIdSchema,
    contentHash: wandererImportRequestSchema.shape.contentHash.describe(
      'The contentHash preview_wanderer_trail gave for the trail: what the travellers saw is what is imported, or nothing',
    ),
  })
  .strict();
export type WandererMcpImportRequest = z.infer<typeof wandererMcpImportRequestSchema>;

export const wandererMcpSourceRequestSchema = z
  .object({ placeId: idSchema.describe('The tour imported from wanderer (origin wanderer), as list_tours gives it') })
  .strict();
export type WandererMcpSourceRequest = z.infer<typeof wandererMcpSourceRequestSchema>;
