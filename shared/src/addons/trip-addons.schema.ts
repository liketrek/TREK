import { z } from 'zod';

/**
 * Per-trip addons: the trip owner switches a trip addon (lists, costs, files,
 * collab, road trip, tours) on or off for one trip, whatever the instance says.
 *
 * Routes: `GET /api/trips/:tripId/addons` (every member) and
 * `PUT /api/trips/:tripId/addons/:addonId` (the owner only). The MCP tools
 * `get_trip_addons` and `set_trip_addon` answer with the same list.
 */

/** An addon id as the addons table spells it (`packing`, `budget`, ...). */
export const tripAddonIdSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/, 'Expected an addon id such as packing or budget');

/**
 * One trip addon as this trip sees it.
 *
 * `enabled` is what applies here, `instanceEnabled` the admin's switch for the
 * whole instance, and `overridden` says the trip owner chose `enabled`
 * themselves instead of following the instance.
 */
export const tripAddonSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
  enabled: z.boolean(),
  instanceEnabled: z.boolean(),
  overridden: z.boolean(),
});
export type TripAddon = z.infer<typeof tripAddonSchema>;

export const tripAddonListSchema = z.array(tripAddonSchema);

/** The body of `PUT /api/trips/:tripId/addons/:addonId`: on, off, or null for the instance setting. */
export const tripAddonUpdateRequestSchema = z.object({ enabled: z.boolean().nullable() }).strict();
export type TripAddonUpdateRequest = z.infer<typeof tripAddonUpdateRequestSchema>;

/** What both routes answer: every trip addon of the trip, in the admin's order. */
export const tripAddonsResponseSchema = z.object({
  tripId: z.number().int().positive(),
  addons: tripAddonListSchema,
});
export type TripAddonsResponse = z.infer<typeof tripAddonsResponseSchema>;
