import { PluginController, PluginMethod } from '../../nest-rpc/rpc-kit/decorators';
import { PluginGuards } from '../../nest-rpc/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../../nest-rpc/rpc-errors';
import { asPayload, num } from '../../nest-rpc/rpc-params';
import type { PluginRpcContext } from '../../nest-rpc/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { DayNotesService } from './day-notes.service';

/** Day notes ride on the day permission, like the rest of the day surface. */
const DAY_NOTE_EDIT_ACTION = 'day_edit';

type DayNoteInput = { text?: string; time?: string; icon?: string; sort_order?: number };

/**
 * The day-note surface a plugin may reach (#plugins). Core data with no addon
 * behind it, trip-scoped, so the standard membership gate applies.
 *
 * Every write re-checks that the day (or the note) really belongs to the trip it
 * was addressed with, so a plugin cannot write a note onto another trip's day by
 * naming its id. The dayNote:* broadcasts match what the REST controller emits.
 */
@PluginController()
export class DayNotesRpc {
  constructor(
    private readonly dayNotes: DayNotesService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('daynotes.list', { permission: 'db:read:daynotes' })
  async list(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    return await this.guards.tripRead(params, ctx, async () =>
      await this.dayNotes.list(num(params.dayId, 'dayId'), num(params.tripId, 'tripId')),
    );
  }

  @PluginMethod('daynotes.create', { permission: 'db:write:daynotes' })
  async create(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const dayId = num(params.dayId, 'dayId');
    const actor = this.guards.requireActor(ctx, 'day note');
    const input = asPayload(params.input);
    if (typeof input.text !== 'string' || input.text.trim() === '') throw new BadParams('note text is required');
    await this.guards.requireTripEdit(tripId, actor, DAY_NOTE_EDIT_ACTION);
    if (!(await this.dayNotes.dayExists(dayId, tripId))) throw new ForbiddenResource(`no day ${dayId} on trip ${tripId}`);
    const i = input as DayNoteInput;
    const note = await this.dayNotes.create(dayId, tripId, i.text ?? '', i.time, i.icon, i.sort_order);
    this.realtime.broadcast(tripId, 'dayNote:created', { dayId, note }, undefined);
    return note;
  }

  @PluginMethod('daynotes.update', { permission: 'db:write:daynotes' })
  async update(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const dayId = num(params.dayId, 'dayId');
    const noteId = num(params.noteId, 'noteId');
    const actor = this.guards.requireActor(ctx, 'day note');
    await this.guards.requireTripEdit(tripId, actor, DAY_NOTE_EDIT_ACTION);
    const current = await this.dayNotes.getNote(noteId, dayId, tripId);
    if (!current) throw new ForbiddenResource(`no note ${noteId} on day ${dayId}`);
    const note = await this.dayNotes.update(noteId, current as never, asPayload(params.input) as DayNoteInput);
    this.realtime.broadcast(tripId, 'dayNote:updated', { dayId, note }, undefined);
    return note;
  }

  @PluginMethod('daynotes.delete', { permission: 'db:write:daynotes' })
  async delete(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const dayId = num(params.dayId, 'dayId');
    const noteId = num(params.noteId, 'noteId');
    const actor = this.guards.requireActor(ctx, 'day note');
    await this.guards.requireTripEdit(tripId, actor, DAY_NOTE_EDIT_ACTION);
    const current = await this.dayNotes.getNote(noteId, dayId, tripId);
    if (!current) throw new ForbiddenResource(`no note ${noteId} on day ${dayId}`);
    await this.dayNotes.remove(noteId);
    this.realtime.broadcast(tripId, 'dayNote:deleted', { noteId, dayId }, undefined);
    return { deleted: true };
  }
}
