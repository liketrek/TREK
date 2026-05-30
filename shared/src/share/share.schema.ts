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
});
export type ShareLinkRequest = z.infer<typeof shareLinkRequestSchema>;
