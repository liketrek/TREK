import { budgetCreateItemRequestSchema, budgetUpdateItemRequestSchema } from '@trek/shared';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { num, schemaMessage } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { InjectRepository } from '@mikro-orm/nestjs';
import { RealtimeService } from '../realtime/realtime.service';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { TripMembershipService } from '../trip-membership/trip-membership.service';
import { ADDON_IDS } from '../../addons';
import { BudgetService } from './budget.service';

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
    // this injects TripsRepository directly and calls findAccessible.
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
    private readonly membership: TripMembershipService,
  ) {}

  @PluginMethod('costs.getByTrip', { permission: 'db:read:costs' })
  async getByTrip(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    return await this.guards.tripRead(params, ctx, async () => {
      await this.requireBudgetAddon();
      return await this.budget.listBudgetItems(num(params.tripId, 'tripId'));
    });
  }

  @PluginMethod('costs.listMine', { permission: 'db:read:costs' })
  async listMine(_params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    // Cross-trip aggregate. The acting user is host-bound; a job or onLoad is refused
    // the same way tripRead refuses one.
    if (ctx.actingUserId === undefined) throw new ForbiddenResource('cost reads require an authenticated user context');
    await this.requireBudgetAddon();
    // The leaf membership read, not TripsService.list: TripsModule imports this
    // one, so injecting TripsService here would close a cycle. Same id set,
    // same newest-first order.
    const tripIds = await this.membership.listAccessibleTripIds(ctx.actingUserId);
    // Sequential, not Promise.all: the legacy flatMap read each trip's items one
    // after the other, in id order, and the output order is the contract here.
    const items: unknown[] = [];
    for (const id of tripIds) items.push(...(await this.budget.listBudgetItems(id)));
    return items;
  }

  @PluginMethod('costs.create', { permission: 'db:write:costs' })
  async create(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon();
    const parsed = budgetCreateItemRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid cost: ${schemaMessage(parsed.error)}`);
    await this.requireCostEdit(tripId, actor);
    await this.refuseForeignLinks(tripId, parsed.data);
    // BudgetService.create freezes the FX rate and resolves members/payers, so the
    // plugin path produces the same row the web app would.
    const item = await this.budget.create(String(tripId), parsed.data);
    if (item.reservation_id) await this.budget.resyncReservationPrice(tripId, item.reservation_id);
    this.realtime.broadcast(tripId, 'budget:created', { item });
    return item;
  }

  @PluginMethod('costs.update', { permission: 'db:write:costs' })
  async update(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const itemId = num(params.itemId, 'itemId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon();
    const parsed = budgetUpdateItemRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid cost: ${schemaMessage(parsed.error)}`);
    await this.requireCostEdit(tripId, actor);
    await this.refuseForeignLinks(tripId, parsed.data);
    const before = parsed.data.reservation_id !== undefined ? await this.budget.getBudgetItem(itemId, tripId) : null;
    // update re-freezes the FX rate on a currency change, exactly like create.
    // Plan 4 Task 8b (U6) — itemId is already a real row id (num() above);
    // BudgetService.update's id param no longer needs the String() wrapper.
    const item = await this.budget.update(itemId, String(tripId), parsed.data);
    if (item == null) throw new ForbiddenResource(`no cost ${itemId} on trip ${tripId}`);
    await this.budget.resyncLinkedPrices(tripId, before?.reservation_id, item, parsed.data);
    this.realtime.broadcast(tripId, 'budget:updated', { item });
    return item;
  }

  /** A booking or place the cost links to has to be on the same trip, as over REST and MCP. */
  private async refuseForeignLinks(tripId: number, data: { reservation_id?: number | null; place_id?: number | null }): Promise<void> {
    const refusal = await this.budget.linkRefusal(tripId, data);
    if (refusal) throw new ForbiddenResource(refusal);
  }

  @PluginMethod('costs.delete', { permission: 'db:write:costs' })
  async delete(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const itemId = num(params.itemId, 'itemId');
    const actor = this.requireCostActor(ctx);
    await this.requireBudgetAddon();
    await this.requireCostEdit(tripId, actor);
    // Plan 4 Task 8b (U6) — same drop of itemId's String() wrapper as update above.
    if (!(await this.budget.remove(itemId, String(tripId)))) {
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

  private async requireBudgetAddon(): Promise<void> {
    await this.guards.requireAddon(ADDON_IDS.BUDGET, 'costs');
  }

  /** Trip access plus budget_edit, with the cost-specific refusal message. */
  private async requireCostEdit(tripId: number, userId: number): Promise<void> {
    if (!(await this.trips.findAccessible(tripId, userId))) throw new ForbiddenResource(`no access to trip ${tripId}`);
    if (!(await this.guards.canEditAs(BUDGET_EDIT_ACTION, tripId, userId))) {
      throw new ForbiddenResource(`no permission to edit costs on trip ${tripId}`);
    }
  }
}
