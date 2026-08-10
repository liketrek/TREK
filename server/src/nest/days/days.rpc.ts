import { dayCreateRequestSchema, dayUpdateRequestSchema } from '@trek/shared';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { num, schemaMessage } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { DaysService } from './days.service';

const DAY_EDIT_ACTION = 'day_edit';

/**
 * The day surface a plugin may reach (#plugins). Every write scopes the day to the
 * trip before touching it, so a plugin cannot edit another trip's day by naming its
 * id. The itinerary half lives in assignments/itinerary.rpc.ts, because
 * AssignmentsModule already imports DaysModule and the reverse would be a cycle.
 */
@PluginController()
export class DaysRpc {
  constructor(
    private readonly days: DaysService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('days.create', { permission: 'db:write:days' })
  create(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'day');
    const parsed = dayCreateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid day: ${schemaMessage(parsed.error)}`);
    this.guards.requireTripEdit(tripId, actor, DAY_EDIT_ACTION);
    const input = parsed.data as { date?: string; notes?: string };
    const day = this.days.create(tripId, input.date, input.notes);
    this.realtime.broadcast(tripId, 'day:created', { day });
    return day;
  }

  @PluginMethod('days.update', { permission: 'db:write:days' })
  update(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const dayId = num(params.dayId, 'dayId');
    const actor = this.guards.requireActor(ctx, 'day');
    const parsed = dayUpdateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid day: ${schemaMessage(parsed.error)}`);
    this.guards.requireTripEdit(tripId, actor, DAY_EDIT_ACTION);
    // getDay scopes the row to the trip before the write touches it.
    const current = this.days.getDay(dayId, tripId);
    if (!current) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
    const day = this.days.update(dayId, current, parsed.data as { notes?: string; title?: string | null });
    this.realtime.broadcast(tripId, 'day:updated', { day });
    return day;
  }

  @PluginMethod('days.delete', { permission: 'db:write:days' })
  delete(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const dayId = num(params.dayId, 'dayId');
    const actor = this.guards.requireActor(ctx, 'day');
    this.guards.requireTripEdit(tripId, actor, DAY_EDIT_ACTION);
    if (!this.days.getDay(dayId, tripId)) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
    this.days.remove(dayId);
    this.realtime.broadcast(tripId, 'day:deleted', { dayId });
    return { deleted: true };
  }
}
