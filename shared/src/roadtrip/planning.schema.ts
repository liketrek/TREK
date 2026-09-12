import { idSchema } from '../common/primitives.schema';
import { roadtripPreferencesSchema } from './preferences.schema';

import { z } from 'zod';

export const roadtripPlanRequestSchema = z.object({
  tripId: idSchema,
  includeGeometry: z.boolean().optional().default(false),
  settings: roadtripPreferencesSchema.optional().describe('Preview these trip preferences without saving them'),
});
export const roadtripCorridorRequestSchema = z.object({
  tripId: idSchema,
  dayNumber: z.number().int().positive().max(366),
  category: z.enum(['fuel', 'charging', 'rest_area', 'campsite', 'restaurant', 'sights', 'hotel']),
  widthKm: z.number().positive().max(10).default(5),
  offset: z.number().int().min(0).max(1000).default(0),
  name: z.string().max(100).optional(),
  socket: z.string().max(50).optional(),
  minKw: z.number().nonnegative().max(10000).optional(),
  fromKm: z
    .number()
    .nonnegative()
    .max(40000)
    .optional()
    .describe('Only matches at or after this distance along the day route'),
  toKm: z
    .number()
    .nonnegative()
    .max(40000)
    .optional()
    .describe('Only matches at or before this distance along the day route'),
});
export type RoadtripPlanRequest = z.infer<typeof roadtripPlanRequestSchema>;
export type RoadtripCorridorRequest = z.infer<typeof roadtripCorridorRequestSchema>;

export const roadtripGpxImportSchema = z.object({
  tripId: idSchema,
  gpx: z.string().min(1).max(1000000).describe('GPX XML text, up to one million characters'),
  name: z.string().min(1).max(200).default('Imported track'),
  importWaypoints: z.boolean().default(true),
  importRoutes: z.boolean().default(true),
  importTracks: z.boolean().default(true),
});
export type RoadtripGpxImport = z.infer<typeof roadtripGpxImportSchema>;
