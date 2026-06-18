import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip, db } from '../../db/database';
import { isDemoUser } from '../../services/authService';
import {
  createBudgetItem, updateBudgetItem, deleteBudgetItem,
  updateMembers as updateBudgetMembers,
  toggleMemberPaid, getBudgetItem,
} from '../../services/budgetService';
import { getTripOwner, listMembers } from '../../services/tripService';
import {
  safeBroadcast, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, noAccess, ok, hasTripPermission, permissionDenied,
} from './_shared';
import { canWrite } from '../scopes';
import { isAddonEnabled } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';

/**
 * Resolve the equal-split participants for a new budget item. When member_ids is
 * omitted, default to the whole trip (owner + all members), deduped — reproducing
 * the client's own create flow (CostsPanel seeds participants from all members).
 * An explicit empty array means "planning-only, no split" and is passed through.
 */
function resolveMemberIds(tripId: number, member_ids?: number[]): number[] | undefined {
  if (member_ids !== undefined) return member_ids;
  const owner = getTripOwner(tripId);
  if (!owner) return undefined;
  const { members } = listMembers(tripId, owner.user_id);
  return Array.from(new Set([owner.user_id, ...members.map(m => m.id)]));
}

export function registerBudgetTools(server: McpServer, userId: number, scopes: string[] | null): void {
  const W = canWrite(scopes, 'budget');

  if (isAddonEnabled(ADDON_IDS.BUDGET)) {
  // --- BUDGET ---

  if (W) server.registerTool(
    'create_budget_item',
    {
      description: 'Add a budget/expense item to a trip. By default the cost is split across all trip members; pass member_ids to split among a subset, or an empty array for a planning-only entry with no split.',
      inputSchema: {
        tripId: z.number().int().positive(),
        name: z.string().min(1).max(200),
        category: z.string().max(100).optional().describe('Budget category (e.g. Accommodation, Food, Transport)'),
        total_price: z.number().nonnegative(),
        currency: z.string().max(10).nullable().optional().describe('ISO currency code (e.g. "EUR"); defaults to the trip currency'),
        member_ids: z.array(z.number().int().positive()).optional().describe('Trip member user IDs splitting this expense. Omit to split across all trip members (owner + members); pass [] for no split.'),
        payers: z.array(z.object({
          user_id: z.number().int().positive(),
          amount: z.number().nonnegative(),
        })).optional().describe('Who paid how much, in the expense currency. When given, total_price is derived from the sum.'),
        expense_date: z.string().max(40).nullable().optional().describe('Date the expense occurred, YYYY-MM-DD'),
        note: z.string().max(500).optional(),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, name, category, total_price, currency, member_ids, payers, expense_date, note }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const members = resolveMemberIds(tripId, member_ids);
      const item = createBudgetItem(tripId, { category, name, total_price, currency, member_ids: members, payers, expense_date, note });
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
      description: 'Create a budget/expense item and set the trip members splitting it in one atomic operation. If userIds is omitted, the cost is split across all trip members; pass an explicit list to split among a subset, or an empty array for a planning-only entry with no split. Only use when the item does not yet exist — if it already exists, use set_budget_item_members directly.',
      inputSchema: {
        tripId: z.number().int().positive(),
        name: z.string().min(1).max(200),
        category: z.string().max(100).optional().describe('Budget category (e.g. Accommodation, Food, Transport)'),
        total_price: z.number().nonnegative(),
        note: z.string().max(500).optional(),
        userIds: z.array(z.number().int().positive()).optional().describe('User IDs splitting this item; omit to split across all trip members, or pass an empty array for no split'),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, name, category, total_price, note, userIds }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      // Omitted userIds → default to the whole trip, matching create_budget_item.
      const members = (userIds && userIds.length > 0) ? userIds : resolveMemberIds(tripId, undefined);
      try {
        const item = db.transaction(() => {
          const created = createBudgetItem(tripId, { category, name, total_price, note, member_ids: members });
          return getBudgetItem(created.id, tripId)!;
        })();
        safeBroadcast(tripId, 'budget:created', { item });
        if (members && members.length > 0) safeBroadcast(tripId, 'budget:members-updated', { item });
        return ok({ item });
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
      const result = updateBudgetMembers(itemId, tripId, userIds);
      if (!result) return { content: [{ type: 'text' as const, text: 'Budget item not found.' }], isError: true };
      const item = getBudgetItem(itemId, tripId);
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
