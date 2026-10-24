import { z } from 'zod';

/**
 * Trip share-link API contract.
 *
 * Owner/members create a public read-only token for a trip under
 * /api/trips/:tripId/share-link (gated by 'share_manage'); anyone can read the
 * shared snapshot at /api/shared/:token (no auth). The per-section toggles
 * default server-side (map/bookings on, packing/budget/collab off), so every
 * field is optional here.
 */
export const shareLinkRequestSchema = z.object({
  share_map: z.boolean().optional(),
  share_bookings: z.boolean().optional(),
  share_packing: z.boolean().optional(),
  share_budget: z.boolean().optional(),
  share_collab: z.boolean().optional(),
  // Narrow the itinerary to transport and stays (#1712): no activities, no day notes.
  share_travel_only: z.boolean().optional(),
  // Leave the place photos out of the shared page (#1712).
  share_hide_images: z.boolean().optional(),
});
export type ShareLinkRequest = z.infer<typeof shareLinkRequestSchema>;
