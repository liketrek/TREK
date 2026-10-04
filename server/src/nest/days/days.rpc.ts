import { dayCreateRequestSchema, dayUpdateRequestSchema } from '@trek/shared';
import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { num, schemaMessage } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { DaysService, DayAppendError, type DatedDayAppend, type DaySender } from './days.service';
import { DayRemovalService, DayDeleteError, type DayRemoval } from './day-removal.service';
import type { MirrorSender } from '../accommodations/accommodations.service';

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
    private readonly removal: DayRemovalService,
  ) {}

  @PluginMethod('days.create', { permission: 'db:write:days' })
  async create(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'day');
    const parsed = dayCreateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid day: ${schemaMessage(parsed.error)}`);
    await this.guards.requireTripEdit(tripId, actor, DAY_EDIT_ACTION);
    const input = parsed.data;
    if (input.dated) return await this.appendDated(tripId, actor, input.notes);
    const day = await this.days.create(tripId, input.date, input.notes);
    this.realtime.broadcast(tripId, 'day:created', { day });
    return day;
  }

  /** days.create with `dated`: the calendar day after the trip's last date, as on REST and MCP. */
  private async appendDated(tripId: number, actor: number, notes: string | undefined): Promise<unknown> {
    let append: DatedDayAppend;
    try {
      append = await this.days.appendDated(tripId, actor, notes);
    } catch (err) {
      if (err instanceof DayAppendError) throw new BadParams(err.message);
      throw err;
    }
    const send: DaySender = (event, payload) => this.realtime.broadcast(tripId, event, payload);
    this.days.announceDatedAppend(append, { all: send, others: send });
    return append.day;
  }

  @PluginMethod('days.update', { permission: 'db:write:days' })
  async update(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const dayId = num(params.dayId, 'dayId');
    const actor = this.guards.requireActor(ctx, 'day');
    const parsed = dayUpdateRequestSchema.safeParse(params.input);
    if (!parsed.success) throw new BadParams(`invalid day: ${schemaMessage(parsed.error)}`);
    await this.guards.requireTripEdit(tripId, actor, DAY_EDIT_ACTION);
    // getDay scopes the row to the trip before the write touches it.
    const current = await this.days.getDay(dayId, tripId);
    if (!current) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
    const day = await this.days.update(dayId, current, parsed.data as { notes?: string; title?: string | null });
    this.realtime.broadcast(tripId, 'day:updated', { day });
    return day;
  }

  @PluginMethod('days.delete', { permission: 'db:write:days' })
  async delete(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const dayId = num(params.dayId, 'dayId');
    const actor = this.guards.requireActor(ctx, 'day');
    await this.guards.requireTripEdit(tripId, actor, DAY_EDIT_ACTION);
    if (!(await this.days.getDay(dayId, tripId))) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
    let removal: DayRemoval;
    try {
      removal = await this.removal.remove(tripId, dayId, { userId: actor });
    } catch (err) {
      if (err instanceof DayDeleteError) throw new BadParams(err.message);
      throw err;
    }
    const send: MirrorSender = (event, payload) => this.realtime.broadcast(tripId, event, payload);
    await this.removal.announce(tripId, removal, { all: send, others: send });
    return { deleted: true };
  }
}
