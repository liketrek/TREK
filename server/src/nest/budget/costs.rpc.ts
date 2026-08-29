import { ADDON_IDS } from '../../addons';
import { DatabaseService } from '../database/database.service';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { num, schemaMessage } from '../plugins/host/rpc-params';
import { RealtimeService } from '../realtime/realtime.service';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import { BudgetService } from './budget.service';
import { budgetCreateItemRequestSchema, budgetUpdateItemRequestSchema } from '@trek/shared';

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
    private readonly db: DatabaseService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
    private readonly membership: TripMembershipService,
  ) {}

  @PluginMethod('costs.getByTrip', { permission: 'db:read:costs' })
  getByTrip(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(params, ctx, () => {
      this.requireBudgetAddon();
      return this.budget.listBudgetItems(num(params.tripId, 'tripId'));
    });
  }

  @PluginMethod('costs.listMine', { permission: 'db:read:costs' })
  listMine(_params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    // Cross-trip aggregate. The acting user is host-bound; a job or onLoad is refused
    // the same way tripRead refuses one.
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('cost reads require an authenticated user context');
    this.requireBudgetAddon();
    // The leaf membership read, not TripsService.list: TripsModule imports this
    // one, so injecting TripsService here would close a cycle. Same id set,
    // same newest-first order.
    const tripIds = this.membership.listAccessibleTripIds(ctx.actingUserId);
    return tripIds.flatMap((id) => this.budget.listBudgetItems(id));
  }

  @PluginMethod('costs.create', { permission: 'db:write:costs' })
  async create(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.requireCostActor(ctx);
    this.requireBudgetAddon();
    const parsed = budgetCreateItemRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid cost: ${schemaMessage(parsed.error)}`);
    this.requireCostEdit(tripId, actor);
    // BudgetService.create freezes the FX rate and resolves members/payers, so the
    // plugin path produces the same row the web app would.
    const item = await this.budget.create(String(tripId), parsed.data);
    this.realtime.broadcast(tripId, 'budget:created', { item });
    return item;
  }

  @PluginMethod('costs.update', { permission: 'db:write:costs' })
  async update(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const itemId = num(params.itemId, 'itemId');
    const actor = this.requireCostActor(ctx);
    this.requireBudgetAddon();
    const parsed = budgetUpdateItemRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid cost: ${schemaMessage(parsed.error)}`);
    this.requireCostEdit(tripId, actor);
    // update re-freezes the FX rate on a currency change, exactly like create.
    const item = await this.budget.update(String(itemId), String(tripId), parsed.data);
    if (item == null) throw new ForbiddenResource(`no cost ${itemId} on trip ${tripId}`);
    this.realtime.broadcast(tripId, 'budget:updated', { item });
    return item;
  }

  @PluginMethod('costs.delete', { permission: 'db:write:costs' })
  delete(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const itemId = num(params.itemId, 'itemId');
    const actor = this.requireCostActor(ctx);
    this.requireBudgetAddon();
    this.requireCostEdit(tripId, actor);
    if (!this.budget.remove(String(itemId), String(tripId))) {
      throw new ForbiddenResource(`no cost ${itemId} on trip ${tripId}`);
    }
    this.realtime.broadcast(tripId, 'budget:deleted', { itemId });
    return { deleted: true };
  }

  /** The writes say "cost writes", not the "<noun> writes" requireActor produces. */
  private requireCostActor(ctx: PluginRpcContext): number {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource('cost writes require an authenticated user context');
    }
    return ctx.actingUserId;
  }

  private requireBudgetAddon(): void {
    this.guards.requireAddon(ADDON_IDS.BUDGET, 'costs');
  }

  /** Trip access plus budget_edit, with the cost-specific refusal message. */
  private requireCostEdit(tripId: number, userId: number): void {
    if (!this.db.canAccessTrip(tripId, userId)) throw new ForbiddenResource(`no access to trip ${tripId}`);
    if (!this.guards.canEditAs(BUDGET_EDIT_ACTION, tripId, userId)) {
      throw new ForbiddenResource(`no permission to edit costs on trip ${tripId}`);
    }
  }
}
