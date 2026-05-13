import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip, db } from '../../db/database';
import { isDemoUser } from '../../services/authService';
import {
  createBudgetItem, updateBudgetItem, deleteBudgetItem,
  updateMembers as updateBudgetMembers,
  toggleMemberPaid,
  listBudgetTransfers,
  createBudgetTransfer,
  updateBudgetTransfer,
  deleteBudgetTransfer,
} from '../../services/budgetService';
import {
  safeBroadcast, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, noAccess, ok,
} from './_shared';
import { canRead, canWrite } from '../scopes';
import { isAddonEnabled } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';
import { checkPermission } from '../../services/permissions';

export function registerBudgetTools(server: McpServer, userId: number, scopes: string[] | null): void {
  const R = canRead(scopes, 'budget');
  const W = canWrite(scopes, 'budget');

  const canEditBudget = (tripId: number): boolean => {
    const trip = canAccessTrip(tripId, userId) as { user_id: number } | undefined;
    if (!trip) return false;
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined;
    return checkPermission('budget_edit', user?.role || 'user', trip.user_id, userId, trip.user_id !== userId);
  };

  if (isAddonEnabled(ADDON_IDS.BUDGET)) {
  // --- BUDGET ---

  if (R) server.registerTool(
    'list_budget_transfers',
    {
      description: 'List recorded settlement transfers for a trip budget.',
      inputSchema: {
        tripId: z.number().int().positive(),
      },
      annotations: {},
    },
    async ({ tripId }) => {
      if (!canAccessTrip(tripId, userId)) return noAccess();
      return ok({ transfers: listBudgetTransfers(tripId) });
    }
  );

  if (W) server.registerTool(
    'create_budget_transfer',
    {
      description: 'Record a settlement repayment between trip participants. from_user_id paid to_user_id.',
      inputSchema: {
        tripId: z.number().int().positive(),
        from_user_id: z.number().int().positive(),
        to_user_id: z.number().int().positive(),
        amount: z.union([z.number(), z.string()]),
        transfer_date: z.string().optional(),
        note: z.string().nullable().optional(),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, from_user_id, to_user_id, amount, transfer_date, note }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!canEditBudget(tripId)) return { content: [{ type: 'text' as const, text: 'No permission.' }], isError: true };
      const result = createBudgetTransfer(tripId, { from_user_id, to_user_id, amount, transfer_date, note });
      if ('error' in result) return { content: [{ type: 'text' as const, text: result.error }], isError: true };
      safeBroadcast(tripId, 'budget:transfer-created', { tripId, transferId: result.transfer.id });
      return ok(result);
    }
  );

  if (W) server.registerTool(
    'update_budget_transfer',
    {
      description: 'Fully replace a recorded settlement transfer.',
      inputSchema: {
        tripId: z.number().int().positive(),
        transferId: z.number().int().positive(),
        from_user_id: z.number().int().positive(),
        to_user_id: z.number().int().positive(),
        amount: z.union([z.number(), z.string()]),
        transfer_date: z.string(),
        note: z.string().nullable().optional(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, transferId, from_user_id, to_user_id, amount, transfer_date, note }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!canEditBudget(tripId)) return { content: [{ type: 'text' as const, text: 'No permission.' }], isError: true };
      const result = updateBudgetTransfer(transferId, tripId, { from_user_id, to_user_id, amount, transfer_date, note });
      if ('error' in result) return { content: [{ type: 'text' as const, text: result.error }], isError: true };
      safeBroadcast(tripId, 'budget:transfer-updated', { tripId, transferId });
      return ok(result);
    }
  );

  if (W) server.registerTool(
    'delete_budget_transfer',
    {
      description: 'Delete a recorded settlement transfer.',
      inputSchema: {
        tripId: z.number().int().positive(),
        transferId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ tripId, transferId }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!canEditBudget(tripId)) return { content: [{ type: 'text' as const, text: 'No permission.' }], isError: true };
      const result = deleteBudgetTransfer(transferId, tripId);
      if ('error' in result) return { content: [{ type: 'text' as const, text: result.error }], isError: true };
      safeBroadcast(tripId, 'budget:transfer-deleted', { tripId, transferId });
      return ok(result);
    }
  );

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
      const member = toggleMemberPaid(itemId, memberId, paid);
      safeBroadcast(tripId, 'budget:member-paid-updated', { itemId, member });
      return ok({ member });
    }
  );
  } // isAddonEnabled(BUDGET)
}
