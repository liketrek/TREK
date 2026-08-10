import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { ADDON_IDS } from '../../addons';
import { VacayService } from './vacay.service';

/**
 * The vacay surface a plugin may reach (#plugins).
 *
 * The plan is always resolved host-side from the acting user's ACTIVE plan, so a
 * plugin can never name someone else's plan, and toggleEntry only ever moves the
 * acting user's own PTO day. The service broadcasts to the plan's users itself.
 */
@PluginController()
export class VacayRpc {
  constructor(
    private readonly vacay: VacayService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('vacay.mine', { permission: 'db:read:vacay' })
  mine(_params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireVacayUser(ctx, 'reads');
    this.requireVacayAddon();
    return this.vacay.getPlanData(userId);
  }

  @PluginMethod('vacay.toggleEntry', { permission: 'db:write:vacay' })
  toggleEntry(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireVacayUser(ctx, 'writes');
    const date = this.dateStr(params.date);
    this.requireVacayAddon();
    return this.vacay.toggleEntry(userId, this.vacay.getActivePlanId(userId), date, 1, 'vacation', undefined);
  }

  @PluginMethod('vacay.toggleCompanyHoliday', { permission: 'db:write:vacay' })
  toggleCompanyHoliday(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const userId = this.requireVacayUser(ctx, 'writes');
    const date = this.dateStr(params.date);
    const note = typeof params.note === 'string' ? params.note.slice(0, 256) : undefined;
    this.requireVacayAddon();
    return this.vacay.toggleCompanyHoliday(this.vacay.getActivePlanId(userId), date, note, undefined);
  }

  private requireVacayUser(ctx: PluginRpcContext, kind: 'reads' | 'writes'): number {
    if (ctx.actingUserId === undefined) {
      throw new ForbiddenResource(`vacay ${kind} require an authenticated user context`);
    }
    return ctx.actingUserId;
  }

  private requireVacayAddon(): void {
    this.guards.requireAddon(ADDON_IDS.VACAY, 'vacay');
  }

  private dateStr(value: unknown): string {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadParams('date must be YYYY-MM-DD');
    return value;
  }
}
