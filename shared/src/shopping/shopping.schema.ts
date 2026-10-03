import { z } from 'zod';

/**
 * Shopping item entity as returned by /api/trips/:tripId/shopping.
 * checked is the SQLite INTEGER (0/1).
 */
export const shoppingItemSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  name: z.string(),
  checked: z.number(),
  quantity: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  assigned_user_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  sort_order: z.number(),
  budget_item_id: z.number().nullable().optional(),
  created_at: z.string().optional(),
});
export type ShoppingItem = z.infer<typeof shoppingItemSchema>;

export const shoppingCreateItemRequestSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  assigned_user_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});
export type ShoppingCreateItemRequest = z.infer<typeof shoppingCreateItemRequestSchema>;

export const shoppingUpdateItemRequestSchema = z.object({
  name: z.string().optional(),
  checked: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional(),
  quantity: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  assigned_user_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  budget_item_id: z.number().nullable().optional(),
});
export type ShoppingUpdateItemRequest = z.infer<typeof shoppingUpdateItemRequestSchema>;

export const shoppingReorderRequestSchema = z.object({
  orderedIds: z.array(z.number()),
});
export type ShoppingReorderRequest = z.infer<typeof shoppingReorderRequestSchema>;
