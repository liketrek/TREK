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
  // The client clears optional fields by sending explicit null (the service
  // coerces falsy to its defaults), so every optional metadata field is nullable.
  category: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  assigned_user_id: z.number().nullable().optional(),
  priority: z.number().optional(),
});
export type TodoCreateItemRequest = z.infer<typeof todoCreateItemRequestSchema>;

export const todoUpdateItemRequestSchema = z.object({
  name: z.string().optional(),
  // The legacy route accepted both boolean and 0/1 for checked — both stay valid.
  checked: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional(),
  // Nullable fields follow the bodyKeys protocol: a key present with null
  // clears the field, an omitted key leaves it unchanged.
  category: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  assigned_user_id: z.number().nullable().optional(),
  priority: z.number().nullable().optional(),
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

// ── Responses ───────────────────────────────────────────────────────────────

/** A todo_items row as the routes return it (`SELECT *`); flags and times stay as SQLite stores them. */
export const todoItemSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  name: z.string(),
  checked: z.number().nullable(),
  category: z.string().nullable(),
  sort_order: z.number().nullable(),
  due_date: z.string().nullable(),
  description: z.string().nullable(),
  assigned_user_id: z.number().nullable(),
  priority: z.number().nullable(),
  created_at: z.string().nullable(),
  reminded_at: z.string().nullable(),
});
export type TodoItem = z.infer<typeof todoItemSchema>;

/** GET /todo */
export const todoListResponseSchema = z.object({ items: z.array(todoItemSchema) });
export type TodoListResponse = z.infer<typeof todoListResponseSchema>;

/** POST /todo, PUT /todo/:id */
export const todoItemResponseSchema = z.object({ item: todoItemSchema });
export type TodoItemResponse = z.infer<typeof todoItemResponseSchema>;

/** A person assigned to a todo category. */
export const todoCategoryAssigneeSchema = z.object({
  user_id: z.number(),
  username: z.string(),
  avatar: z.string().nullable(),
});
export type TodoCategoryAssignee = z.infer<typeof todoCategoryAssigneeSchema>;

/** GET /todo/category-assignees: the assignees keyed by category name. */
export const todoCategoryAssigneesResponseSchema = z.object({
  assignees: z.record(z.string(), z.array(todoCategoryAssigneeSchema)),
});
export type TodoCategoryAssigneesResponse = z.infer<typeof todoCategoryAssigneesResponseSchema>;

/** PUT /todo/category-assignees/:categoryName: the category's assignees after the write. */
export const todoCategoryAssigneesUpdateResponseSchema = z.object({ assignees: z.array(todoCategoryAssigneeSchema) });
export type TodoCategoryAssigneesUpdateResponse = z.infer<typeof todoCategoryAssigneesUpdateResponseSchema>;
