import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams } from '../plugins/host/rpc-errors';
import { asPayload, num } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { ADDON_IDS } from '../../addons';
import { CollabService } from './collab.service';

const COLLAB_EDIT_ACTION = 'collab_edit';

/**
 * The collab surface a plugin may reach (#plugins): notes, polls and messages.
 *
 * Every method is addon-gated. That gate used to live in the deps factory's closure
 * rather than in the router, which is exactly how it could have been lost in this
 * move: a handler calling CollabService directly would still work, just without the
 * addon check, and nothing in the type system or the router tests would notice.
 * Hence requireCollabAddon on every single method, and an addon-off case per method
 * in the suite.
 *
 * Reads need membership only. The write side carries collab_edit on top.
 */
@PluginController()
export class CollabRpc {
  constructor(
    private readonly collab: CollabService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('collab.listNotes', { permission: 'db:read:collab' })
  listNotes(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(params, ctx, () => {
      this.requireCollabAddon();
      return this.collab.listNotes(num(params.tripId, 'tripId')) as unknown[];
    });
  }

  @PluginMethod('collab.listPolls', { permission: 'db:read:collab' })
  listPolls(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(params, ctx, () => {
      this.requireCollabAddon();
      return this.collab.listPolls(num(params.tripId, 'tripId')) as unknown[];
    });
  }

  @PluginMethod('collab.listMessages', { permission: 'db:read:collab' })
  listMessages(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    return this.guards.tripRead(params, ctx, () => {
      this.requireCollabAddon();
      const before = params.before != null ? num(params.before, 'before') : undefined;
      return this.collab.listMessages(num(params.tripId, 'tripId'), before) as unknown[];
    });
  }

  @PluginMethod('collab.createNote', { permission: 'db:write:collab' })
  createNote(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'collab note');
    const input = asPayload(params.input);
    if (typeof input.title !== 'string' || input.title.trim() === '') throw new BadParams('note title is required');
    this.guards.requireTripEdit(tripId, actor, COLLAB_EDIT_ACTION);
    this.requireCollabAddon();
    const note = this.collab.createNote(String(tripId), actor, input as never);
    this.realtime.broadcast(tripId, 'collab:note:created', { note }, undefined);
    return note;
  }

  @PluginMethod('collab.createPoll', { permission: 'db:write:collab' })
  createPoll(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'collab poll');
    const input = asPayload(params.input);
    if (typeof input.question !== 'string' || input.question.trim() === '') throw new BadParams('poll question is required');
    if (!Array.isArray(input.options) || input.options.length < 2) throw new BadParams('a poll needs at least two options');
    this.guards.requireTripEdit(tripId, actor, COLLAB_EDIT_ACTION);
    this.requireCollabAddon();
    const poll = this.collab.createPoll(String(tripId), actor, input as never);
    this.realtime.broadcast(tripId, 'collab:poll:created', { poll }, undefined);
    return poll;
  }

  @PluginMethod('collab.votePoll', { permission: 'db:write:collab' })
  votePoll(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'collab poll');
    this.guards.requireTripEdit(tripId, actor, COLLAB_EDIT_ACTION);
    this.requireCollabAddon();
    const result = this.collab.votePoll(String(tripId), String(num(params.pollId, 'pollId')), actor, num(params.optionIndex, 'optionIndex'));
    // The service reports its own validation failures rather than throwing.
    if (result.error) throw new BadParams(result.error);
    this.realtime.broadcast(tripId, 'collab:poll:voted', { poll: result.poll }, undefined);
    return result.poll;
  }

  @PluginMethod('collab.createMessage', { permission: 'db:write:collab' })
  createMessage(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'collab message');
    if (typeof params.text !== 'string' || params.text.trim() === '' || params.text.length > 4000) {
      throw new BadParams('message text is required (max 4000 chars)');
    }
    this.guards.requireTripEdit(tripId, actor, COLLAB_EDIT_ACTION);
    this.requireCollabAddon();
    const replyTo = typeof params.replyTo === 'number' ? params.replyTo : null;
    const result = this.collab.createMessage(String(tripId), actor, params.text, replyTo);
    if (result.error) throw new BadParams(result.error);
    this.realtime.broadcast(tripId, 'collab:message:created', { message: result.message }, undefined);
    return result.message;
  }

  private requireCollabAddon(): void {
    this.guards.requireAddon(ADDON_IDS.COLLAB, 'collab');
  }
}
