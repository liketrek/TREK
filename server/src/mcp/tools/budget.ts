import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip, db } from '../../db/database';
import { isDemoUser } from '../../services/authService';
import {
  createBudgetItem, updateBudgetItem, deleteBudgetItem,
  updateMembers as updateBudgetMembers,
  toggleMemberPaid,
} from '../../services/budgetService';
import {
  safeBroadcast, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, noAccess, ok, hasTripPermission, permissionDenied,
} from './_shared';
import { canWrite } from '../scopes';
import { isAddonEnabled } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';

export function registerBudgetTools(server: McpServer, userId: number, scopes: string[] | null): void {
  const W = canWrite(scopes, 'budget');

  if (isAddonEnabled(ADDON_IDS.BUDGET)) {
  // --- BUDGET ---

  if (W) server.registerTool(
    'create_budget_item',
    {
      description: 'Add a budget/expense item to a trip.',
      inputSchema: {
        tripId: z.number().int().positive(),
        name: z.string().min(1).max(200),
        category: z.string().max(100).optional().describe('Budget category (e.g. Accommodation, Food, Transport)'),
        total_price: z.number().nonnegative(),
        note: z.string().max(500).optional(),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, name, category, total_price, note }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const item = createBudgetItem(tripId, { category, name, total_price, note });
      safeBroadcast(tripId, 'budget:created', { item });
      return ok({ item });
    }
  );

  if (W) server.registerTool(
    'delete_budget_item',
    {
      description: 'Delete a budget item from a trip.',
      inputSchema: {
        tripId: z.number().int().positive(),
        itemId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ tripId, itemId }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const deleted = deleteBudgetItem(itemId, tripId);
      if (!deleted) return { content: [{ type: 'text' as const, text: 'Budget item not found.' }], isError: true };
      safeBroadcast(tripId, 'budget:deleted', { itemId });
      return ok({ success: true });
    }
  );

  // --- BUDGET (update) ---

  if (W) server.registerTool(
    'update_budget_item',
    {
      description: 'Update an existing budget/expense item in a trip.',
      inputSchema: {
        tripId: z.number().int().positive(),
        itemId: z.number().int().positive(),
        name: z.string().min(1).max(200).optional(),
        category: z.string().max(100).optional(),
        total_price: z.number().nonnegative().optional(),
        persons: z.number().int().positive().nullable().optional(),
        days: z.number().int().positive().nullable().optional(),
        note: z.string().max(500).nullable().optional(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, itemId, name, category, total_price, persons, days, note }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const item = updateBudgetItem(itemId, tripId, { name, category, total_price, persons, days, note });
      if (!item) return { content: [{ type: 'text' as const, text: 'Budget item not found.' }], isError: true };
      safeBroadcast(tripId, 'budget:updated', { item });
      return ok({ item });
    }
  );

  // --- BUDGET ADVANCED ---

  if (W) server.registerTool(
    'create_budget_item_with_members',
    {
      description: 'Create a budget/expense item and optionally set the trip members splitting it in one atomic operation. If userIds is omitted or empty, behaves like create_budget_item. Only use when the place does not yet exist — if it already exists, use set_budget_item_members directly.',
      inputSchema: {
        tripId: z.number().int().positive(),
        name: z.string().min(1).max(200),
        category: z.string().max(100).optional().describe('Budget category (e.g. Accommodation, Food, Transport)'),
        total_price: z.number().nonnegative(),
        note: z.string().max(500).optional(),
        userIds: z.array(z.number().int().positive()).optional().describe('User IDs splitting this item; omit or pass empty array to skip member assignment'),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, name, category, total_price, note, userIds }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const hasMembers = userIds && userIds.length > 0;
      try {
        const run = db.transaction(() => {
          const item = createBudgetItem(tripId, { category, name, total_price, note });
          if (hasMembers) {
            return updateBudgetMembers(item.id, tripId, userIds!);
          }
          return { item };
        });
        const result = run();
        safeBroadcast(tripId, 'budget:created', { item: (result as any).item ?? result });
        if (hasMembers) safeBroadcast(tripId, 'budget:members-updated', { item: result });
        return ok({ item: result });
      } catch {
        return { content: [{ type: 'text' as const, text: 'Failed to create budget item.' }], isError: true };
      }
    }
  );

  if (W) server.registerTool(
    'set_budget_item_members',
    {
      description: 'Set which trip members are splitting a budget item (replaces current member list).',
      inputSchema: {
        tripId: z.number().int().positive(),
        itemId: z.number().int().positive(),
        userIds: z.array(z.number().int().positive()).describe('User IDs splitting this item; empty array clears all'),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, itemId, userIds }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const item = updateBudgetMembers(itemId, tripId, userIds);
      safeBroadcast(tripId, 'budget:members-updated', { item });
      return ok({ item });
    }
  );

  if (W) server.registerTool(
    'toggle_budget_member_paid',
    {
      description: 'Mark or unmark a member as having paid their share of a budget item.',
      inputSchema: {
        tripId: z.number().int().positive(),
        itemId: z.number().int().positive(),
        memberId: z.number().int().positive().describe('User ID of the member'),
        paid: z.boolean(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, itemId, memberId, paid }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const member = toggleMemberPaid(itemId, tripId, memberId, paid);
      safeBroadcast(tripId, 'budget:member-paid-updated', { itemId, member });
      return ok({ member });
    }
  );
  } // isAddonEnabled(BUDGET)
}
