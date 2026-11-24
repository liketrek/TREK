import { ADDON_IDS } from '../../addons';
import { PluginGuards } from '../../nest-rpc/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../../nest-rpc/rpc-errors';
import { PluginController, PluginMethod } from '../../nest-rpc/rpc-kit/decorators';
import type { PluginRpcContext } from '../../nest-rpc/rpc-kit/types';
import { rowIdParam, schemaMessage, str } from '../../nest-rpc/rpc-params';
import { DomainError } from '../common/domain-error';
import { RealtimeService } from '../realtime/realtime.service';
import { TripAccessService } from '../trip-membership/trip-access.service';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import { BudgetService } from './budget.service';
import { ExchangeRatesService } from './exchange-rates.service';
import {
  budgetCreateItemRequestSchema,
  budgetUpdateItemRequestSchema,
  budgetCreateSettlementRequestSchema,
  budgetUpdateSettlementRequestSchema,
  setTripExchangeRateRequestSchema,
} from '@trek/shared';

/** Costs are budget items, and the app edits them under 'budget_edit'. */
const BUDGET_EDIT_ACTION = 'budget_edit';

/**
 * The cost surface a plugin may reach (#plugins). "Costs" are budget items, so every
 * method additionally requires the Costs addon to be enabled, matching the app, where
 * a disabled addon means there is simply nothing to read or write.
 *
 * Note where the addon check sits in each method. costs.getByTrip runs it INSIDE the
 * membership callback, so a caller without trip access is told about the trip and not
 * about the addon; costs.listMine runs it first, because there is no trip to check.
 * The two orderings are deliberate and were preserved on the move.
 *
 * The writes keep their own refusal messages ("no permission to edit costs on trip N")
 * rather than going through requireTripEdit, which says "no permission to edit trip N".
 */
@PluginController()
export class CostsRpc {
  constructor(
    private readonly budget: BudgetService,
    // Plan 4 Task 2 — canAccessTrip's own DatabaseService delegation is gone:
    // this injects TripAccessService (trip-membership) and calls findAccessible.
    private readonly trips: TripAccessService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
    private readonly membership: TripMembershipService,
    private readonly exchangeRates: ExchangeRatesService,
  ) {}

  @PluginMethod('costs.getByTrip', { permission: 'db:read:costs' })
  async getByTrip(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    return await this.guards.tripRead(params, ctx, async (userId) => {
      const tripId = rowIdParam(params.tripId, 'tripId');
      await this.requireBudgetAddon(tripId, userId);
      return await this.budget.listBudgetItems(tripId);
    });
  }

  @PluginMethod('costs.listMine', { permission: 'db:read:costs' })
  async listMine(_params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    // Cross-trip aggregate. The acting user is host-bound; a job or onLoad is refused
    // the same way tripRead refuses one.
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('cost reads require an authenticated user context');
    // The leaf membership read, not TripsService.list: TripsModule imports this
    // one, so injecting TripsService here would close a cycle. Same id set,
    // same newest-first order. A trip that has Costs off for itself is left out.
    const tripIds = await this.guards.tripsWithAddon(
      ADDON_IDS.BUDGET,
      'costs',
      await this.membership.listAccessibleTripIds(ctx.actingUserId),
    );
    // Sequential, not Promise.all: the legacy flatMap read each trip's items one
    // after the other, in id order, and the output order is the contract here.
    const items: unknown[] = [];
    for (const id of tripIds) items.push(...(await this.budget.listBudgetItems(id)));
    return items;
  }

  @PluginMethod('costs.create', { permission: 'db:write:costs' })
  async create(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = rowIdParam(params.tripId, 'tripId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon(tripId, actor);
    const parsed = budgetCreateItemRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid cost: ${schemaMessage(parsed.error)}`);
    await this.requireCostEdit(tripId, actor);
    await this.refuseForeignLinks(tripId, parsed.data);
    // BudgetService.create freezes the FX rate and resolves members/payers, so the
    // plugin path produces the same row the web app would.
    const item = await this.costWrite(() => this.budget.create(String(tripId), parsed.data, actor));
    if (item.reservation_id) await this.budget.resyncReservationPrice(tripId, item.reservation_id);
    this.realtime.broadcast(tripId, 'budget:created', { item });
    return item;
  }

  @PluginMethod('costs.update', { permission: 'db:write:costs' })
  async update(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = rowIdParam(params.tripId, 'tripId');
    const itemId = rowIdParam(params.itemId, 'itemId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon(tripId, actor);
    const parsed = budgetUpdateItemRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid cost: ${schemaMessage(parsed.error)}`);
    await this.requireCostEdit(tripId, actor);
    await this.refuseForeignLinks(tripId, parsed.data);
    const before = parsed.data.reservation_id !== undefined ? await this.budget.getBudgetItem(itemId, tripId) : null;
    // update re-freezes the FX rate on a currency change, exactly like create.
    // Plan 4 Task 8b (U6) — itemId is already a real row id (rowIdParam() above);
    // BudgetService.update's id param no longer needs the String() wrapper.
    const item = await this.costWrite(() => this.budget.update(itemId, tripId, parsed.data, actor));
    if (item == null) throw new ForbiddenResource(`no cost ${itemId} on trip ${tripId}`);
    await this.budget.resyncLinkedPrices(tripId, before?.reservation_id, item, parsed.data);
    this.realtime.broadcast(tripId, 'budget:updated', { item });
    return item;
  }

  /** A booking or place the cost links to has to be on the same trip, as over REST and MCP. */
  private async refuseForeignLinks(
    tripId: number,
    data: { reservation_id?: number | null; place_id?: number | null },
  ): Promise<void> {
    const refusal = await this.budget.linkRefusal(tripId, data);
    if (refusal) throw new ForbiddenResource(refusal);
  }

  @PluginMethod('costs.delete', { permission: 'db:write:costs' })
  async delete(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = rowIdParam(params.tripId, 'tripId');
    const itemId = rowIdParam(params.itemId, 'itemId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon(tripId, actor);
    await this.requireCostEdit(tripId, actor);
    // Plan 4 Task 8b (U6) — same drop of itemId's String() wrapper as update above.
    if (!(await this.budget.remove(itemId, String(tripId)))) {
      throw new ForbiddenResource(`no cost ${itemId} on trip ${tripId}`);
    }
    this.realtime.broadcast(tripId, 'budget:deleted', { itemId });
    return { deleted: true };
  }

  @PluginMethod('costs.listRates', { permission: 'db:read:costs' })
  async listRates(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    return this.guards.tripRead(params, ctx, async (actor) => {
      const tripId = rowIdParam(params.tripId, 'tripId');
      await this.requireBudgetAddon(tripId, actor);
      return this.exchangeRates.listTripExchangeRates(tripId);
    });
  }

  @PluginMethod('costs.resolveRate', { permission: 'db:read:costs' })
  async resolveRate(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    return this.guards.tripRead(params, ctx, async (actor) => {
      const tripId = rowIdParam(params.tripId, 'tripId');
      await this.requireBudgetAddon(tripId, actor);
      return this.costWrite(() =>
        this.exchangeRates.resolveExchangeRate(tripId, str(params.currency, 'currency')),
      );
    });
  }

  @PluginMethod('costs.listSettlements', { permission: 'db:read:costs' })
  async listSettlements(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    return this.guards.tripRead(params, ctx, async (actor) => {
      const tripId = rowIdParam(params.tripId, 'tripId');
      await this.requireBudgetAddon(tripId, actor);
      return this.budget.listSettlements(tripId);
    });
  }

  @PluginMethod('costs.setRate', { permission: 'db:write:costs' })
  async setRate(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = rowIdParam(params.tripId, 'tripId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon(tripId, actor);
    await this.requireCostEdit(tripId, actor);
    const parsed = setTripExchangeRateRequestSchema.safeParse({
      exchange_rate: params.exchangeRate,
      note: params.note,
    });
    if (!parsed.success) throw new BadParams(schemaMessage(parsed.error));
    const currency = str(params.currency, 'currency');
    const rate = await this.costWrite(() =>
      this.exchangeRates.setTripExchangeRate(tripId, currency, parsed.data.exchange_rate, actor, parsed.data.note),
    );
    this.realtime.broadcast(tripId, 'budget:exchange-rates-updated', { rate });
    return rate;
  }

  @PluginMethod('costs.deleteRate', { permission: 'db:write:costs' })
  async deleteRate(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = rowIdParam(params.tripId, 'tripId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon(tripId, actor);
    await this.requireCostEdit(tripId, actor);
    const currency = str(params.currency, 'currency').toUpperCase();
    if (!(await this.costWrite(() => this.exchangeRates.deleteTripExchangeRate(tripId, currency)))) {
      throw new ForbiddenResource(`no trip exchange rate for ${currency}`);
    }
    this.realtime.broadcast(tripId, 'budget:exchange-rates-updated', { currency, deleted: true });
    return { deleted: true };
  }

  @PluginMethod('costs.createSettlement', { permission: 'db:write:costs' })
  async createSettlement(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = rowIdParam(params.tripId, 'tripId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon(tripId, actor);
    await this.requireCostEdit(tripId, actor);
    const parsed = budgetCreateSettlementRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid settlement: ${schemaMessage(parsed.error)}`);
    const settlement = await this.costWrite(() => this.budget.createSettlement(tripId, parsed.data, actor));
    if (!settlement) throw new ForbiddenResource(`no settlement on trip ${tripId}`);
    this.realtime.broadcast(tripId, 'budget:settlement-created', { settlement });
    return settlement;
  }

  @PluginMethod('costs.updateSettlement', { permission: 'db:write:costs' })
  async updateSettlement(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = rowIdParam(params.tripId, 'tripId');
    const settlementId = rowIdParam(params.settlementId, 'settlementId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon(tripId, actor);
    await this.requireCostEdit(tripId, actor);
    const parsed = budgetUpdateSettlementRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid settlement: ${schemaMessage(parsed.error)}`);
    const settlement = await this.costWrite(() =>
      this.budget.updateSettlement(settlementId, tripId, parsed.data, actor),
    );
    if (!settlement) throw new ForbiddenResource(`no settlement ${settlementId} on trip ${tripId}`);
    this.realtime.broadcast(tripId, 'budget:settlement-updated', { settlement });
    return settlement;
  }

  @PluginMethod('costs.deleteSettlement', { permission: 'db:write:costs' })
  async deleteSettlement(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = rowIdParam(params.tripId, 'tripId');
    const settlementId = rowIdParam(params.settlementId, 'settlementId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon(tripId, actor);
    await this.requireCostEdit(tripId, actor);
    if (!(await this.budget.deleteSettlement(settlementId, tripId))) {
      throw new ForbiddenResource(`no settlement ${settlementId} on trip ${tripId}`);
    }
    this.realtime.broadcast(tripId, 'budget:settlement-deleted', { settlementId });
    return { deleted: true };
  }

  private async costWrite<T>(write: () => Promise<T>): Promise<T> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof DomainError) throw new BadParams(error.publicMessage);
      throw error;
    }
  }

  /** The writes say "cost writes", not the "<noun> writes" requireActor produces. */
  private requireCostActor(ctx: PluginRpcContext): number {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource('cost writes require an authenticated user context');
    }
    return ctx.actingUserId;
  }

  private async requireBudgetAddon(tripId: number, userId: number): Promise<void> {
    await this.guards.requireAddon(ADDON_IDS.BUDGET, 'costs', { tripId, userId });
  }

  /** Trip access plus budget_edit, with the cost-specific refusal message. */
  private async requireCostEdit(tripId: number, userId: number): Promise<void> {
    if (!(await this.trips.findAccessible(tripId, userId))) throw new ForbiddenResource(`no access to trip ${tripId}`);
    if (!(await this.guards.canEditAs(BUDGET_EDIT_ACTION, tripId, userId))) {
      throw new ForbiddenResource(`no permission to edit costs on trip ${tripId}`);
    }
  }
}
