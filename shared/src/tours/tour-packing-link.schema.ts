import { z } from 'zod';

/**
 * P2D-XD-01: a tour points at the packing list of its trip, as a whole or at
 * one of its categories (a sub-list such as "Hiking gear"). The link only
 * names what it points at; the items stay in Packing, which owns their
 * content, editing and lifecycle, and decides who sees which of them.
 */

/** A category of the trip's packing list, exactly as its items carry it. */
export const tourPackingCategorySchema = z.string().min(1).max(200);

/** What a tour points at: null for the whole packing list, otherwise one of its categories. */
export const tourPackingLinkRequestSchema = z.object({
  category: tourPackingCategorySchema.nullable(),
});
export type TourPackingLinkRequest = z.infer<typeof tourPackingLinkRequestSchema>;

/** The link a tour's detail carries: what it points at and when it was made. */
export const tourPackingLinkSchema = z.object({
  category: z.string().nullable(),
  linked_at: z.string(),
});
export type TourPackingLink = z.infer<typeof tourPackingLinkSchema>;

/** GET .../tours/:placeId/packing-link: what the tour points at, null while it points at nothing. */
export const tourPackingLinkResponseSchema = z.object({
  packing_link: tourPackingLinkSchema.nullable(),
});
export type TourPackingLinkResponse = z.infer<typeof tourPackingLinkResponseSchema>;
