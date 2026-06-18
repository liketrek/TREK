import { z } from 'zod';

/**
 * To-do API contract — single source of truth for the /api/trips/:tripId/todo
 * endpoints (trip task list with categories + assignees).
 *
 * Trip-scoped like packing: every endpoint verifies trip access (404 "Trip not
 * found") and mutations check the same 'packing_edit' permission the legacy route
 * uses (403 "No permission"). Rows are DB-shaped and kept open. Mutations
 * broadcast over WebSocket with the forwarded X-Socket-Id.
 */

export const todoCreateItemRequestSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  due_date: z.string().optional(),
  description: z.string().optional(),
  assigned_user_id: z.number().optional(),
  priority: z.number().optional(),
});
export type TodoCreateItemRequest = z.infer<typeof todoCreateItemRequestSchema>;

export const todoUpdateItemRequestSchema = z.object({
  name: z.string().optional(),
  checked: z.boolean().optional(),
  category: z.string().optional(),
  due_date: z.string().optional(),
  description: z.string().optional(),
  assigned_user_id: z.number().optional(),
  priority: z.number().optional(),
});
export type TodoUpdateItemRequest = z.infer<typeof todoUpdateItemRequestSchema>;

export const todoReorderRequestSchema = z.object({
  orderedIds: z.array(z.number()),
});
export type TodoReorderRequest = z.infer<typeof todoReorderRequestSchema>;

export const todoCategoryAssigneesRequestSchema = z.object({
  user_ids: z.array(z.number()),
});
export type TodoCategoryAssigneesRequest = z.infer<typeof todoCategoryAssigneesRequestSchema>;
