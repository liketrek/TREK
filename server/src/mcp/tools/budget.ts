import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip, db } from '../../db/database';
import { isDemoUser } from '../../services/authService';
import {
  createBudgetItem, updateBudgetItem, deleteBudgetItem,
  updateMembers as updateBudgetMembers,
  toggleMemberPaid, getBudgetItem, freezeForeignRate,
  calculateSettlement, listSettlements, createSettlement, updateSettlement, deleteSettlement,
} from '../../services/budgetService';
import { getRates } from '../../services/exchangeRateService';
import { getTripOwner, listMembers } from '../../services/tripService';
import {
  safeBroadcast, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_READONLY,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, noAccess, ok, hasTripPermission, permissionDenied,
} from './_shared';
import { canRead, canWrite } from '../scopes';

/** Reusable Zod shape for the per-payer amounts on a budget item. */
const payersSchema = z.array(z.object({
  user_id: z.number().int().positive(),
  amount: z.number().nonnegative(),
})).describe('Who actually paid, and how much each paid, in the expense currency. Ask the user; do not guess.');
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
  const R = canRead(scopes, 'budget');
  const W = canWrite(scopes, 'budget');

  if (isAddonEnabled(ADDON_IDS.BUDGET)) {
  // --- BUDGET ---

  if (W) server.registerTool(
    'create_budget_item',
    {
      description: 'Add a budget/expense item to a trip. The cost is split equally among member_ids (omit to split across all trip members, or pass [] for a planning-only entry with no split). Use `payers` to record who actually paid and how much. Ask the user which trip members share this expense and who paid — resolve user IDs with list_trip_members — rather than guessing.',
      inputSchema: {
        tripId: z.number().int().positive(),
        name: z.string().min(1).max(200),
        category: z.string().max(100).optional().describe('Budget category (e.g. Accommodation, Food, Transport)'),
        total_price: z.number().nonnegative(),
        currency: z.string().max(10).nullable().optional().describe('ISO currency code (e.g. "EUR"); defaults to the trip currency'),
        member_ids: z.array(z.number().int().positive()).optional().describe('Trip member user IDs splitting this expense. Omit to split across all trip members (owner + members); pass [] for no split.'),
        payers: payersSchema.optional().describe('Who paid how much, in the expense currency. When given, total_price is derived from the sum. Ask the user; do not guess.'),
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
      const itemData = { category, name, total_price, currency, member_ids: members, payers, expense_date, note };
      // Freeze the live FX rate at entry time so a settled position isn't re-opened
      // when live rates drift (#1445) — same as the REST create path.
      await freezeForeignRate(tripId, itemData);
      const item = createBudgetItem(tripId, itemData);
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
      description: 'Update an existing budget/expense item in a trip. You can also re-split it via member_ids and record who actually paid via payers (amounts in the expense currency). When changing who shares an expense or who paid, ask the user rather than guessing; resolve user IDs with list_trip_members.',
      inputSchema: {
        tripId: z.number().int().positive(),
        itemId: z.number().int().positive(),
        name: z.string().min(1).max(200).optional(),
        category: z.string().max(100).optional(),
        total_price: z.number().nonnegative().optional(),
        member_ids: z.array(z.number().int().positive()).optional().describe('Trip member user IDs splitting this expense; replaces the current split. Omit to leave unchanged, pass [] for no split.'),
        payers: payersSchema.optional().describe('Replaces who paid how much, in the expense currency. Omit to leave unchanged. Ask the user; do not guess.'),
        persons: z.number().int().positive().nullable().optional(),
        days: z.number().int().positive().nullable().optional(),
        note: z.string().max(500).nullable().optional(),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, itemId, name, category, total_price, member_ids, payers, persons, days, note }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const item = updateBudgetItem(itemId, tripId, { name, category, total_price, member_ids, payers, persons, days, note });
      if (!item) return { content: [{ type: 'text' as const, text: 'Budget item not found.' }], isError: true };
      safeBroadcast(tripId, 'budget:updated', { item });
      return ok({ item });
    }
  );

  // --- BUDGET ADVANCED ---

  if (W) server.registerTool(
    'create_budget_item_with_members',
    {
      description: 'Create a budget/expense item and set the trip members splitting it in one atomic operation. If userIds is omitted, the cost is split across all trip members; pass an explicit list to split among a subset, or an empty array for a planning-only entry with no split. Ask the user which members share this expense rather than guessing; resolve user IDs with list_trip_members. Only use when the item does not yet exist — if it already exists, use set_budget_item_members directly.',
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
      description: 'Set which trip members are splitting a budget item (replaces current member list). Ask the user which members share the expense; resolve user IDs with list_trip_members.',
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

  // --- SETTLEMENTS (settle-up payments between members) ---

  if (R) server.registerTool(
    'get_settlement_summary',
    {
      description: "See each member's net balance and the suggested payments to settle shared expenses. Amounts are in the trip's base currency. Call this before recording a settlement so you know who should pay whom and how much.",
      inputSchema: {
        tripId: z.number().int().positive(),
        base: z.string().max(10).optional().describe('ISO currency code to compute balances in; defaults to the trip currency'),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ tripId, base }) => {
      if (!canAccessTrip(tripId, userId)) return noAccess();
      const trip = db.prepare('SELECT currency FROM trips WHERE id = ?').get(tripId) as { currency?: string } | undefined;
      const tripCurrency = trip?.currency || 'EUR';
      const effectiveBase = (base || tripCurrency).toUpperCase();
      const rates = await getRates(effectiveBase);
      const summary = calculateSettlement(tripId, { base: effectiveBase, rates, tripCurrency });
      return ok({ summary });
    }
  );

  if (R) server.registerTool(
    'list_settlements',
    {
      description: 'List the recorded settle-up payments for a trip (who paid whom, how much, when).',
      inputSchema: {
        tripId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_READONLY,
    },
    async ({ tripId }) => {
      if (!canAccessTrip(tripId, userId)) return noAccess();
      return ok({ settlements: listSettlements(tripId) });
    }
  );

  if (W) server.registerTool(
    'create_settlement',
    {
      description: "Record a settle-up payment: from_user_id paid to_user_id the given amount (in the trip's base currency) to settle shared expenses. Use get_settlement_summary first to find who owes whom and how much.",
      inputSchema: {
        tripId: z.number().int().positive(),
        from_user_id: z.number().int().positive().describe('User ID of the member who paid'),
        to_user_id: z.number().int().positive().describe('User ID of the member who received the payment'),
        amount: z.number().positive().describe("Amount paid, in the trip's base currency"),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, from_user_id, to_user_id, amount }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const settlement = createSettlement(tripId, { from_user_id, to_user_id, amount }, userId);
      safeBroadcast(tripId, 'budget:settlement-created', { settlement });
      return ok({ settlement });
    }
  );

  if (W) server.registerTool(
    'update_settlement',
    {
      description: 'Update a recorded settle-up payment (who paid, who received, and the amount).',
      inputSchema: {
        tripId: z.number().int().positive(),
        settlementId: z.number().int().positive(),
        from_user_id: z.number().int().positive().describe('User ID of the member who paid'),
        to_user_id: z.number().int().positive().describe('User ID of the member who received the payment'),
        amount: z.number().positive().describe("Amount paid, in the trip's base currency"),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, settlementId, from_user_id, to_user_id, amount }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const settlement = updateSettlement(settlementId, tripId, { from_user_id, to_user_id, amount });
      if (!settlement) return { content: [{ type: 'text' as const, text: 'Settlement not found.' }], isError: true };
      safeBroadcast(tripId, 'budget:settlement-updated', { settlement });
      return ok({ settlement });
    }
  );

  if (W) server.registerTool(
    'delete_settlement',
    {
      description: 'Delete a recorded settle-up payment. This is the undo for create_settlement and restores the affected balances.',
      inputSchema: {
        tripId: z.number().int().positive(),
        settlementId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ tripId, settlementId }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('budget_edit', tripId, userId)) return permissionDenied();
      const deleted = deleteSettlement(settlementId, tripId);
      if (!deleted) return { content: [{ type: 'text' as const, text: 'Settlement not found.' }], isError: true };
      safeBroadcast(tripId, 'budget:settlement-deleted', { settlementId });
      return ok({ success: true });
    }
  );
  } // isAddonEnabled(BUDGET)
}
