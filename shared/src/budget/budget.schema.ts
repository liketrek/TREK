import { z } from 'zod';

/**
 * Budget API contract — single source of truth for the /api/trips/:tripId/budget
 * endpoints (expense items, per-member splits, paid toggles, settlement).
 *
 * Trip-scoped: every endpoint verifies trip access (404 "Trip not found") and
 * mutations check the 'budget_edit' permission (403 "No permission"). The legacy
 * route (server/src/routes/budget.ts) wraps services/budgetService.ts; rows are
 * DB-shaped and kept open. Mutations broadcast over WebSocket with the forwarded
 * X-Socket-Id. Updating a linked item's total_price also syncs the price into the
 * linked reservation's metadata (and broadcasts reservation:updated).
 */

/**
 * Budget item member as embedded on a budget item
 * (server/src/services/budgetService.ts -> loadItemMembers). `paid` is the raw
 * SQLite INTEGER (0/1); `avatar_url` is the resolved avatar (avatarUrl()).
 */
export const budgetItemMemberSchema = z.object({
  user_id: z.number(),
  paid: z.number(),
  username: z.string(),
  avatar_url: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
  budget_item_id: z.number().optional(),
});
export type BudgetItemMember = z.infer<typeof budgetItemMemberSchema>;

/**
 * Budget item entity as returned by the budget list/create/update endpoints
 * (server/src/services/budgetService.ts). Columns of the `budget_items` table
 * plus the embedded `members` array. total_price is SQLite REAL.
 */
export const budgetItemSchema = z.object({
  id: z.number(),
  trip_id: z.number(),
  category: z.string(),
  name: z.string(),
  total_price: z.number(),
  persons: z.number().nullable().optional(),
  days: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  reservation_id: z.number().nullable().optional(),
  paid_by_user_id: z.number().nullable().optional(),
  expense_date: z.string().nullable().optional(),
  sort_order: z.number().optional(),
  created_at: z.string().optional(),
  members: z.array(budgetItemMemberSchema).optional(),
});
export type BudgetItem = z.infer<typeof budgetItemSchema>;

export const budgetCreateItemRequestSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  total_price: z.number().optional(),
  persons: z.number().nullable().optional(),
  days: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  expense_date: z.string().nullable().optional(),
});
export type BudgetCreateItemRequest = z.infer<
  typeof budgetCreateItemRequestSchema
>;

/** Update accepts the same fields plus total_price changes; all optional. */
export const budgetUpdateItemRequestSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  total_price: z.number().optional(),
  persons: z.number().nullable().optional(),
  days: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  expense_date: z.string().nullable().optional(),
});
export type BudgetUpdateItemRequest = z.infer<
  typeof budgetUpdateItemRequestSchema
>;

export const budgetUpdateMembersRequestSchema = z.object({
  user_ids: z.array(z.number()),
});
export type BudgetUpdateMembersRequest = z.infer<
  typeof budgetUpdateMembersRequestSchema
>;

export const budgetToggleMemberPaidRequestSchema = z.object({
  paid: z.boolean(),
});
export type BudgetToggleMemberPaidRequest = z.infer<
  typeof budgetToggleMemberPaidRequestSchema
>;

export const budgetReorderItemsRequestSchema = z.object({
  orderedIds: z.array(z.number()),
});
export type BudgetReorderItemsRequest = z.infer<
  typeof budgetReorderItemsRequestSchema
>;

export const budgetReorderCategoriesRequestSchema = z.object({
  orderedCategories: z.array(z.string()),
});
export type BudgetReorderCategoriesRequest = z.infer<
  typeof budgetReorderCategoriesRequestSchema
>;
