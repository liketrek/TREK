import { z } from 'zod';

/**
 * Packing API contract — single source of truth for the
 * /api/trips/:tripId/packing endpoints (items, bags, templates, assignees).
 *
 * Trip-scoped: every endpoint verifies trip access (404 "Trip not found") and
 * mutations additionally check the 'packing_edit' permission (403 "No
 * permission"). The legacy route (server/src/routes/packing.ts) wraps
 * services/packingService.ts; rows are DB-shaped and kept as open records here.
 * Mutations broadcast over WebSocket using the forwarded X-Socket-Id.
 */

const open = z.record(z.string(), z.unknown());

export const packingCreateItemRequestSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  checked: z.boolean().optional(),
});
export type PackingCreateItemRequest = z.infer<typeof packingCreateItemRequestSchema>;

export const packingUpdateItemRequestSchema = z.object({
  name: z.string().optional(),
  checked: z.boolean().optional(),
  category: z.string().optional(),
  weight_grams: z.number().nullable().optional(),
  bag_id: z.number().nullable().optional(),
  quantity: z.number().optional(),
});
export type PackingUpdateItemRequest = z.infer<typeof packingUpdateItemRequestSchema>;

export const packingImportRequestSchema = z.object({
  items: z.array(open),
});
export type PackingImportRequest = z.infer<typeof packingImportRequestSchema>;

export const packingReorderRequestSchema = z.object({
  orderedIds: z.array(z.number()),
});
export type PackingReorderRequest = z.infer<typeof packingReorderRequestSchema>;

export const packingCreateBagRequestSchema = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
});
export type PackingCreateBagRequest = z.infer<typeof packingCreateBagRequestSchema>;

export const packingUpdateBagRequestSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  weight_limit_grams: z.number().nullable().optional(),
  user_id: z.number().nullable().optional(),
});
export type PackingUpdateBagRequest = z.infer<typeof packingUpdateBagRequestSchema>;

export const packingBagMembersRequestSchema = z.object({
  user_ids: z.array(z.number()),
});
export type PackingBagMembersRequest = z.infer<typeof packingBagMembersRequestSchema>;

export const packingSaveTemplateRequestSchema = z.object({
  name: z.string().min(1),
});
export type PackingSaveTemplateRequest = z.infer<typeof packingSaveTemplateRequestSchema>;

export const packingCategoryAssigneesRequestSchema = z.object({
  user_ids: z.array(z.number()),
});
export type PackingCategoryAssigneesRequest = z.infer<typeof packingCategoryAssigneesRequestSchema>;
