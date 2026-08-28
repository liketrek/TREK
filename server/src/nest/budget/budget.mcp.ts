import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { z } from 'zod';
import { RuntimeEnvService } from '../app-config/runtime-env.service';
import { isDemoUserId } from '../common/demo-write';
import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import { DatabaseService } from '../database/database.service';
import { BudgetService } from './budget.service';
import { ExchangeRatesService } from './exchange-rates.service';
import { addonGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';

/** Legacy registrar gate: the whole budget surface rides the budget addon. */
const budgetAddonOn = addonGate(ADDON_IDS.BUDGET);

/** Reusable Zod shape for the per-payer amounts on a budget item. */
const payersSchema = z.array(z.object({
  user_id: z.number().int().positive(),
  amount: z.number().nonnegative(),
})).describe('Who actually paid, and how much each paid, in the expense currency. Ask the user; do not guess.');

/** Reusable Zod shape for an unequal split: what each participant owes. */
const splitMembersSchema = z.array(z.object({
  user_id: z.number().int().positive(),
  amount: z.number().nonnegative(),
})).describe('Unequal split: what each participant owes, in the expense currency. The amounts must add up to the expense total. Ask the user; do not guess.');

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Money is compared in whole cents, never in floats (the budget money rule). */
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function sumCents(amounts: number[]): number {
  return amounts.reduce((sum, a) => sum + toCents(a), 0);
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Budget MCP surface — ported from the legacy registrars: the eleven tools
 * from src/mcp/tools/budget.ts and the trek://trips/{tripId}/budget,
 * …/budget/per-person and …/budget/settlement resources from
 * src/mcp/resources.ts (identical names, descriptions, schemas, annotations
 * and error shapes). The registration-time gates map to `when` (the
 * whole-registrar budget-addon check) plus the declarative budget read/write
 * access markers (the legacy `if (R)` / `if (W)` checks, resolved by
 * trekMcpAccessPolicy).
 *
 * Quirk fixes on top of the ported legacy behavior: broadcasts use the REST
 * payload shapes ('budget:members-updated' { itemId, members, persons } and
 * 'budget:member-paid-updated' { itemId, userId, paid } — the legacy
 * MCP-specific { item } / { itemId, member } shapes were silent no-ops in the
 * client's remoteEventHandler), the mutating settlement/item paths route
 * through the freeze-then-write composites so REST and MCP can't diverge on
 * the #1445 FX freeze, and the settlement resource resolves the trip currency
 * and live rates like get_settlement_summary instead of silently defaulting
 * to an unconverted EUR base.
 */
@McpController()
export class BudgetMcp {
  constructor(
    private readonly budget: BudgetService,
    private readonly exchangeRates: ExchangeRatesService,
    private readonly db: DatabaseService,
    private readonly env: RuntimeEnvService,
    private readonly membership: TripMembershipService,
    readonly addons: AddonsService,
    private readonly guards: McpToolGuardsService,
  ) {}

  /** The AuthService.isDemoUser check without the auth graph (demo-write.ts). */
  private isDemoUser(userId: number): boolean {
    return isDemoUserId(this.env, this.db, userId);
  }

  /**
   * Resolve the equal-split participants for a new budget item. When member_ids
   * is omitted, default to the whole trip (owner + all members), deduped —
   * reproducing the client's own create flow (CostsPanel seeds participants
   * from all members). An explicit empty array means "planning-only, no split"
   * and is passed through. Reads ride the leaf TripMembershipService — the
   * hydrated member services all live in modules that import this one.
   */
  private resolveMemberIds(tripId: number, member_ids?: number[]): number[] | undefined {
    if (member_ids !== undefined) return member_ids;
    const ownerId = this.membership.getOwnerId(tripId);
    if (ownerId === null) return undefined;
    return Array.from(new Set([ownerId, ...this.membership.listMemberUserIds(tripId)]));
  }

  /**
   * The total a custom split has to reconcile against: explicit payers derive it
   * (the write path overwrites total_price with their sum), so the stated total
   * is not necessarily the figure that ends up in the row.
   */
  private settledTotalCents(
    tripId: number,
    payers: { user_id: number; amount: number }[] | undefined,
    total_price: number | undefined,
    fallbackCents: number,
  ): number {
    // Once payers are sent at all, the write path derives the total from them and
    // an empty list therefore means zero, not "no opinion". Reading total_price
    // here instead would certify a split against a figure the row never receives.
    if (payers !== undefined) {
      const roster = this.db.rosterUserIds(tripId);
      return sumCents(payers.filter(p => p.amount > 0 && roster.has(p.user_id)).map(p => p.amount));
    }
    if (total_price !== undefined) return toCents(total_price);
    return fallbackCents;
  }

  /**
   * Reasons to refuse a custom split, or null when it is safe to persist.
   *
   * A split whose shares do not add up to the total hands the settlement a
   * difference no payment can ever clear, so it is refused here rather than
   * stored and discovered on the balances screen. An off-roster or repeated
   * user_id is refused for the same reason: the write path drops both silently,
   * which would unbalance a split that had just been checked.
   */
  private splitRefusal(
    tripId: number,
    members: { user_id: number; amount: number }[],
    totalCents: number,
    payers?: { user_id: number; amount: number }[],
  ): string | null {
    const roster = this.db.rosterUserIds(tripId);
    const strangers = members.filter(m => !roster.has(m.user_id)).map(m => m.user_id);
    if (strangers.length > 0) {
      return `members contains user IDs that are not on this trip: ${strangers.join(', ')}. Resolve them with list_trip_members.`;
    }
    if (new Set(members.map(m => m.user_id)).size !== members.length) {
      return 'members lists the same user twice. Give each participant one amount.';
    }
    // A payer the write path will drop takes the total down with it, so the split
    // certified here would not be the split stored. Refuse rather than let the
    // difference surface on the balances screen.
    if (payers) {
      const payerStrangers = payers.filter(p => p.amount > 0 && !roster.has(p.user_id)).map(p => p.user_id);
      if (payerStrangers.length > 0) {
        return `payers contains user IDs that are not on this trip: ${payerStrangers.join(', ')}. Resolve them with list_trip_members.`;
      }
    }
    const splitCents = sumCents(members.map(m => m.amount));
    if (splitCents !== totalCents) {
      return `The split does not add up: the member amounts total ${formatCents(splitCents)} but the expense total is ${formatCents(totalCents)}. Adjust the amounts so they sum to the expense total.`;
    }
    return null;
  }

  /** The sibling tools' foreign-id rule: a linked id must live on the same trip. */
  private placeOnTrip(tripId: number, placeId: number): boolean {
    return !!this.db.get('SELECT id FROM places WHERE id = ? AND trip_id = ?', placeId, tripId);
  }

  // --- BUDGET ---

  @Tool({
    name: 'create_budget_item',
    description: 'Add a budget/expense item to a trip. The cost is split equally among member_ids (omit to split across all trip members, or pass [] for a planning-only entry with no split); for an uneven split, give `members` the amount each participant owes instead. Use `payers` to record who actually paid and how much. Ask the user which trip members share this expense and who paid (resolve user IDs with list_trip_members) rather than guessing.',
    inputSchema: {
      tripId: z.number().int().positive(),
      name: z.string().min(1).max(200),
      category: z.string().max(100).optional().describe('Budget category (e.g. Accommodation, Food, Transport)'),
      total_price: z.number().nonnegative(),
      currency: z.string().max(10).nullable().optional().describe('ISO currency code (e.g. "EUR"); defaults to the trip currency'),
      member_ids: z.array(z.number().int().positive()).optional().describe('Trip member user IDs splitting this expense equally. Omit to split across all trip members (owner + members); pass [] for no split.'),
      members: splitMembersSchema.optional().describe('Uneven split: what each participant owes, in the expense currency. The amounts must add up to the expense total. Use this instead of member_ids, never alongside it.'),
      payers: payersSchema.optional().describe('Who paid how much, in the expense currency. When given, total_price is derived from the sum. Ask the user; do not guess.'),
      expense_date: z.string().max(40).nullable().optional().describe('Date the expense occurred, YYYY-MM-DD'),
      place_id: z.number().int().positive().optional().describe('Place on this trip the expense belongs to (the museum ticket for that museum), linking it in the planner'),
      note: z.string().max(500).optional(),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'write' },
  })
  async createBudgetItem(
    { tripId, name, category, total_price, currency, member_ids, members, payers, expense_date, place_id, note }: {
      tripId: number; name: string; category?: string; total_price: number; currency?: string | null;
      member_ids?: number[]; members?: { user_id: number; amount: number }[];
      payers?: { user_id: number; amount: number }[]; expense_date?: string | null; place_id?: number; note?: string;
    },
    ctx: McpContext,
  ) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('budget_edit', tripId, ctx.userId)) return permissionDenied();
    if (members !== undefined && member_ids !== undefined) return errorResult('Pass either members (uneven split) or member_ids (equal split), not both.');
    if (place_id != null && !this.placeOnTrip(tripId, place_id)) return errorResult('place_id does not belong to this trip.');
    if (members !== undefined) {
      const refusal = this.splitRefusal(tripId, members, this.settledTotalCents(tripId, payers, total_price, toCents(total_price)), payers);
      if (refusal) return errorResult(refusal);
    }
    // The split participants are the members of an uneven split; the equal-split
    // list still carries them so the row's `persons` count comes out the same.
    const splitIds = members ? members.map(m => m.user_id) : this.resolveMemberIds(tripId, member_ids);
    const itemData = { category, name, total_price, currency, member_ids: splitIds, members, payers, expense_date, place_id, note };
    // Freeze the live FX rate at entry time so a settled position isn't re-opened
    // when live rates drift (#1445) — same as the REST create path.
    await this.budget.freezeForeignRate(tripId, itemData);
    const item = this.budget.createBudgetItem(tripId, itemData);
    this.guards.safeBroadcast(tripId, 'budget:created', { item });
    return ok({ item });
  }

  @Tool({
    name: 'delete_budget_item',
    description: 'Delete a budget item from a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'write' },
  })
  async deleteBudgetItem({ tripId, itemId }: { tripId: number; itemId: number }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('budget_edit', tripId, ctx.userId)) return permissionDenied();
    const deleted = this.budget.deleteBudgetItem(itemId, tripId);
    if (!deleted) return errorResult('Budget item not found.');
    this.guards.safeBroadcast(tripId, 'budget:deleted', { itemId });
    return ok({ success: true });
  }

  // --- BUDGET (update) ---

  @Tool({
    name: 'update_budget_item',
    description: 'Update an existing budget/expense item in a trip. You can also re-split it (equally via member_ids, unevenly via members), change the currency it was entered in, move it to another date, and record who actually paid via payers (amounts in the expense currency). When changing who shares an expense or who paid, ask the user rather than guessing; resolve user IDs with list_trip_members.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      name: z.string().min(1).max(200).optional(),
      category: z.string().max(100).optional(),
      total_price: z.number().nonnegative().optional(),
      currency: z.string().max(10).nullable().optional().describe('ISO currency code the expense is in (e.g. "USD"); null puts it back in the trip currency. Changing it re-freezes the FX rate at today\'s rate.'),
      member_ids: z.array(z.number().int().positive()).optional().describe('Trip member user IDs splitting this expense equally; replaces the current split. Omit to leave unchanged, pass [] for no split.'),
      members: splitMembersSchema.optional().describe('Uneven split: what each participant owes, in the expense currency; replaces the current split. The amounts must add up to the expense total. Use this instead of member_ids, never alongside it.'),
      payers: payersSchema.optional().describe('Replaces who paid how much, in the expense currency. Omit to leave unchanged. Ask the user; do not guess.'),
      persons: z.number().int().positive().nullable().optional(),
      days: z.number().int().positive().nullable().optional(),
      expense_date: z.string().max(40).nullable().optional().describe('Date the expense occurred, YYYY-MM-DD; null clears it. Omit to leave unchanged.'),
      note: z.string().max(500).nullable().optional(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'write' },
  })
  async updateBudgetItem(
    { tripId, itemId, name, category, total_price, currency, member_ids, members, payers, persons, days, expense_date, note }: {
      tripId: number; itemId: number; name?: string; category?: string; total_price?: number; currency?: string | null;
      member_ids?: number[]; members?: { user_id: number; amount: number }[];
      payers?: { user_id: number; amount: number }[]; persons?: number | null; days?: number | null;
      expense_date?: string | null; note?: string | null;
    },
    ctx: McpContext,
  ) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('budget_edit', tripId, ctx.userId)) return permissionDenied();
    if (members !== undefined && member_ids !== undefined) return errorResult('Pass either members (uneven split) or member_ids (equal split), not both.');
    if (members !== undefined) {
      // An edit that leaves the total alone still has to reconcile against it, so
      // the stored figure stands in when the call does not restate one.
      const existing = this.budget.getBudgetItem(itemId, tripId);
      if (!existing) return errorResult('Budget item not found.');
      const refusal = this.splitRefusal(tripId, members, this.settledTotalCents(tripId, payers, total_price, toCents(existing.total_price)), payers);
      if (refusal) return errorResult(refusal);
    }
    // Freeze-then-write composite: a currency change re-freezes the rate at entry
    // time (#1445) on the same code path the REST update uses.
    const item = await this.budget.update(itemId, tripId, { name, category, total_price, currency, member_ids, members, payers, persons, days, expense_date, note });
    if (!item) return errorResult('Budget item not found.');
    this.guards.safeBroadcast(tripId, 'budget:updated', { item });
    return ok({ item });
  }

  // --- BUDGET ADVANCED ---

  @Tool({
    name: 'create_budget_item_with_members',
    description: 'Create a budget/expense item and set the trip members splitting it equally in one atomic operation. If userIds is omitted, the cost is split across all trip members; pass an explicit list to split among a subset, or an empty array for a planning-only entry with no split. Ask the user which members share this expense rather than guessing; resolve user IDs with list_trip_members. Only use when the item does not yet exist; if it already exists, use set_budget_item_members directly. For an uneven split, a foreign currency or a date, use create_budget_item instead.',
    inputSchema: {
      tripId: z.number().int().positive(),
      name: z.string().min(1).max(200),
      category: z.string().max(100).optional().describe('Budget category (e.g. Accommodation, Food, Transport)'),
      total_price: z.number().nonnegative(),
      note: z.string().max(500).optional(),
      userIds: z.array(z.number().int().positive()).optional().describe('User IDs splitting this item; omit to split across all trip members, or pass an empty array for no split'),
      place_id: z.number().int().positive().optional().describe('Place on this trip the expense belongs to (the museum ticket for that museum), linking it in the planner'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'write' },
  })
  async createBudgetItemWithMembers(
    { tripId, name, category, total_price, note, userIds, place_id }: {
      tripId: number; name: string; category?: string; total_price: number; note?: string; userIds?: number[]; place_id?: number;
    },
    ctx: McpContext,
  ) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('budget_edit', tripId, ctx.userId)) return permissionDenied();
    if (place_id != null && !this.placeOnTrip(tripId, place_id)) return errorResult('place_id does not belong to this trip.');
    // Omitted userIds → default to the whole trip, matching create_budget_item.
    const members = (userIds && userIds.length > 0) ? userIds : this.resolveMemberIds(tripId, undefined);
    try {
      const item = this.db.transaction(() => {
        const created = this.budget.createBudgetItem(tripId, { category, name, total_price, note, member_ids: members, place_id });
        return this.budget.getBudgetItem(created.id, tripId)!;
      });
      this.guards.safeBroadcast(tripId, 'budget:created', { item });
      if (members && members.length > 0) this.guards.safeBroadcast(tripId, 'budget:members-updated', { itemId: item.id, members: item.members, persons: item.persons });
      return ok({ item });
    } catch {
      return errorResult('Failed to create budget item.');
    }
  }

  @Tool({
    name: 'set_budget_item_members',
    description: 'Set which trip members are splitting a budget item (replaces current member list). Ask the user which members share the expense; resolve user IDs with list_trip_members.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      userIds: z.array(z.number().int().positive()).describe('User IDs splitting this item; empty array clears all'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'write' },
  })
  async setBudgetItemMembers({ tripId, itemId, userIds }: { tripId: number; itemId: number; userIds: number[] }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('budget_edit', tripId, ctx.userId)) return permissionDenied();
    const result = this.budget.updateMembers(itemId, tripId, userIds);
    if (!result) return errorResult('Budget item not found.');
    const item = this.budget.getBudgetItem(itemId, tripId);
    this.guards.safeBroadcast(tripId, 'budget:members-updated', { itemId, members: result.members, persons: result.item.persons });
    return ok({ item });
  }

  @Tool({
    name: 'toggle_budget_member_paid',
    description: 'Mark or unmark a member as having paid their share of a budget item.',
    inputSchema: {
      tripId: z.number().int().positive(),
      itemId: z.number().int().positive(),
      memberId: z.number().int().positive().describe('User ID of the member'),
      paid: z.boolean(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'write' },
  })
  async toggleBudgetMemberPaid({ tripId, itemId, memberId, paid }: { tripId: number; itemId: number; memberId: number; paid: boolean }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('budget_edit', tripId, ctx.userId)) return permissionDenied();
    const member = this.budget.toggleMemberPaid(itemId, tripId, memberId, paid);
    this.guards.safeBroadcast(tripId, 'budget:member-paid-updated', { itemId, userId: memberId, paid: paid ? 1 : 0 });
    return ok({ member });
  }

  // --- SETTLEMENTS (settle-up payments between members) ---

  @Tool({
    name: 'get_settlement_summary',
    description: "See each member's net balance and the suggested payments to settle shared expenses. Amounts are in the trip's base currency. Call this before recording a settlement so you know who should pay whom and how much.",
    inputSchema: {
      tripId: z.number().int().positive(),
      base: z.string().max(10).optional().describe('ISO currency code to compute balances in; defaults to the trip currency'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async getSettlementSummary({ tripId, base }: { tripId: number; base?: string }, ctx: McpContext) {
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    const trip = this.db.get<{ currency?: string }>('SELECT currency FROM trips WHERE id = ?', tripId);
    const tripCurrency = trip?.currency || 'EUR';
    const effectiveBase = (base || tripCurrency).toUpperCase();
    const rates = await this.exchangeRates.getRates(effectiveBase);
    const summary = this.budget.calculateSettlement(tripId, { base: effectiveBase, rates, tripCurrency });
    return ok({ summary });
  }

  @Tool({
    name: 'list_settlements',
    description: 'List the recorded settle-up payments for a trip (who paid whom, how much, when).',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async listSettlements({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    return ok({ settlements: this.budget.listSettlements(tripId) });
  }

  @Tool({
    name: 'create_settlement',
    description: "Record a settle-up payment: from_user_id paid to_user_id the given amount to settle shared expenses. The amount is in the trip's base currency unless `currency` says otherwise. Use get_settlement_summary first to find who owes whom and how much.",
    inputSchema: {
      tripId: z.number().int().positive(),
      from_user_id: z.number().int().positive().describe('User ID of the member who paid'),
      to_user_id: z.number().int().positive().describe('User ID of the member who received the payment'),
      amount: z.number().positive().describe('Amount paid, in `currency`'),
      currency: z.string().max(10).nullable().optional().describe("ISO currency code the payment was made in (e.g. \"USD\"); defaults to the trip currency. Its FX rate is frozen now, so the transfer keeps cancelling its expense when live rates drift."),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'write' },
  })
  async createSettlement(
    { tripId, from_user_id, to_user_id, amount, currency }: { tripId: number; from_user_id: number; to_user_id: number; amount: number; currency?: string | null },
    ctx: McpContext,
  ) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('budget_edit', tripId, ctx.userId)) return permissionDenied();
    // Freeze-then-write composite, same as the REST path: the rate for the display
    // currency is frozen at entry time (#1445).
    const settlement = await this.budget.createSettlement(tripId, { from_user_id, to_user_id, amount, currency }, ctx.userId);
    if (!settlement) return errorResult('Settlement not found.');
    this.guards.safeBroadcast(tripId, 'budget:settlement-created', { settlement });
    return ok({ settlement });
  }

  @Tool({
    name: 'update_settlement',
    description: 'Update a recorded settle-up payment (who paid, who received, the amount and the currency it was made in). Every field is a full replace, so restate the ones that stay the same.',
    inputSchema: {
      tripId: z.number().int().positive(),
      settlementId: z.number().int().positive(),
      from_user_id: z.number().int().positive().describe('User ID of the member who paid'),
      to_user_id: z.number().int().positive().describe('User ID of the member who received the payment'),
      amount: z.number().positive().describe('Amount paid, in `currency`'),
      currency: z.string().max(10).nullable().optional().describe('ISO currency code the payment was made in (e.g. "USD"); null puts it back in the trip currency. Omit to leave it as recorded, which also keeps the rate frozen at settle time.'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'write' },
  })
  async updateSettlement(
    { tripId, settlementId, from_user_id, to_user_id, amount, currency }: { tripId: number; settlementId: number; from_user_id: number; to_user_id: number; amount: number; currency?: string | null },
    ctx: McpContext,
  ) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('budget_edit', tripId, ctx.userId)) return permissionDenied();
    // Freeze-then-write composite, same as the REST path: an edit that leaves the
    // currency alone keeps the rate frozen at settle time.
    const settlement = await this.budget.updateSettlement(settlementId, tripId, { from_user_id, to_user_id, amount, currency });
    if (!settlement) return errorResult('Settlement not found.');
    this.guards.safeBroadcast(tripId, 'budget:settlement-updated', { settlement });
    return ok({ settlement });
  }

  @Tool({
    name: 'delete_settlement',
    description: 'Delete a recorded settle-up payment. This is the undo for create_settlement and restores the affected balances.',
    inputSchema: {
      tripId: z.number().int().positive(),
      settlementId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'write' },
  })
  async deleteSettlement({ tripId, settlementId }: { tripId: number; settlementId: number }, ctx: McpContext) {
    if (this.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.budget.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('budget_edit', tripId, ctx.userId)) return permissionDenied();
    const deleted = this.budget.deleteSettlement(settlementId, tripId);
    if (!deleted) return errorResult('Settlement not found.');
    this.guards.safeBroadcast(tripId, 'budget:settlement-deleted', { settlementId });
    return ok({ success: true });
  }

  // --- RESOURCES ---

  @ResourceTemplate({
    name: 'trip-budget',
    uriTemplate: 'trek://trips/{tripId}/budget',
    description: 'Budget and expense items for a trip',
    mimeType: 'application/json',
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async tripBudgetResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.budget.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    const items = this.budget.listBudgetItems(id);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(items, null, 2),
      }],
    };
  }

  @ResourceTemplate({
    name: 'trip-budget-per-person',
    uriTemplate: 'trek://trips/{tripId}/budget/per-person',
    description: 'Per-person budget summary for a trip (total spent per member, split breakdown)',
    mimeType: 'application/json',
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async tripBudgetPerPersonResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.budget.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    const summary = this.budget.getPerPersonSummary(id);
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(summary, null, 2),
      }],
    };
  }

  @ResourceTemplate({
    name: 'trip-budget-settlement',
    uriTemplate: 'trek://trips/{tripId}/budget/settlement',
    description: 'Suggested settlement transactions to balance who owes whom',
    mimeType: 'application/json',
    when: budgetAddonOn,
    access: { group: 'budget', mode: 'read' },
  })
  async tripBudgetSettlementResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.budget.verifyTripAccess(id, ctx.userId)) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ error: 'Trip not found or access denied' }),
        }],
      };
    }
    // Resolve the trip currency + live rates like get_settlement_summary — the
    // legacy resource called calculateSettlement(id) bare, silently netting a
    // non-EUR trip in EUR with no FX conversion.
    const trip = this.db.get<{ currency?: string }>('SELECT currency FROM trips WHERE id = ?', id);
    const tripCurrency = trip?.currency || 'EUR';
    const effectiveBase = tripCurrency.toUpperCase();
    const rates = await this.exchangeRates.getRates(effectiveBase);
    const settlement = this.budget.calculateSettlement(id, { base: effectiveBase, rates, tripCurrency });
    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify(settlement, null, 2),
      }],
    };
  }

  // The budget-overview prompt moved to trips/trip-prompts.mcp.ts: it reads the
  // whole-trip summary, and the read model lives above this module (the fold
  // that deleted trips.bridge).
}
