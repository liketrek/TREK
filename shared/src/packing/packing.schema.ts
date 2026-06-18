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

/**
 * Packing item entity as returned by the packing endpoints
 * (server/src/services/packingService.ts -> SELECT * FROM packing_items).
 * `checked` is the raw SQLite INTEGER (0/1). Columns match the packing_items
 * table (see server DB): weight_grams/bag_id are nullable, quantity defaults 1.
 */
export const packingItemSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  name: z.string(),
  checked: z.number(),
  category: z.string().nullable().optional(),
  sort_order: z.number(),
  weight_grams: z.number().nullable().optional(),
  bag_id: z.number().nullable().optional(),
  quantity: z.number().optional(),
  created_at: z.string().optional(),
});
export type PackingItem = z.infer<typeof packingItemSchema>;

/**
 * Packing bag member embedded on a bag (server packingService -> listBags).
 * `avatar` is the resolved avatar URL.
 */
export const packingBagMemberSchema = z.object({
  user_id: z.number(),
  username: z.string(),
  avatar: z.string().nullable().optional(),
});
export type PackingBagMember = z.infer<typeof packingBagMemberSchema>;

/**
 * Packing bag entity (server packingService -> listBags). Columns of the
 * packing_bags table plus the embedded `members` array (and the optional
 * `assigned_username` join present on updateBag).
 */
export const packingBagSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  name: z.string(),
  color: z.string(),
  weight_limit_grams: z.number().nullable().optional(),
  sort_order: z.number(),
  user_id: z.number().nullable().optional(),
  assigned_username: z.string().nullable().optional(),
  created_at: z.string().optional(),
  members: z.array(packingBagMemberSchema).optional(),
});
export type PackingBag = z.infer<typeof packingBagSchema>;

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

export const packingTemplateSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  item_count: z.number(),
});
export type PackingTemplateSummary = z.infer<typeof packingTemplateSummarySchema>;

export const packingTemplatesResponseSchema = z.object({
  templates: z.array(packingTemplateSummarySchema),
});
export type PackingTemplatesResponse = z.infer<typeof packingTemplatesResponseSchema>;

export const packingCategoryAssigneesRequestSchema = z.object({
  user_ids: z.array(z.number()),
});
export type PackingCategoryAssigneesRequest = z.infer<typeof packingCategoryAssigneesRequestSchema>;
