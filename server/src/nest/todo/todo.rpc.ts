import { PluginController, PluginMethod } from '../plugins/host/rpc-kit/decorators';
import { PluginGuards } from '../plugins/host/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../plugins/host/rpc-errors';
import { asPayload, num } from '../plugins/host/rpc-params';
import type { PluginRpcContext } from '../plugins/host/rpc-kit/types';
import { RealtimeService } from '../realtime/realtime.service';
import { TodoService } from './todo.service';

/** The app edits todos under 'packing_edit', not under a todo-specific action. */
const TODO_EDIT_ACTION = 'packing_edit';

/**
 * The todo surface a plugin may reach (#plugins). Trip-scoped core data, so reads
 * go through the membership gate and writes additionally need the edit permission.
 *
 * The broadcasts are part of the contract, not decoration: they are the same
 * todo:* events the REST controller emits, and without them an open session shows
 * stale data after a plugin write. They came across from the deps factory with the
 * handlers.
 */
@PluginController()
export class TodoRpc {
  constructor(
    private readonly todos: TodoService,
    private readonly realtime: RealtimeService,
    private readonly guards: PluginGuards,
  ) {}

  @PluginMethod('todos.list', { permission: 'db:read:todos' })
  list(params: Record<string, unknown>, ctx: PluginRpcContext): unknown[] {
    return this.guards.tripRead(params, ctx, () => this.todos.listItems(String(num(params.tripId, 'tripId'))) as unknown[]);
  }

  @PluginMethod('todos.create', { permission: 'db:write:todos' })
  create(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'todo');
    const input = asPayload(params.input);
    if (typeof input.name !== 'string' || input.name.trim() === '') throw new BadParams('todo name is required');
    this.guards.requireTripEdit(tripId, actor, TODO_EDIT_ACTION);
    const item = this.todos.createItem(String(tripId), input as never);
    this.realtime.broadcast(tripId, 'todo:created', { item }, undefined);
    return item;
  }

  @PluginMethod('todos.update', { permission: 'db:write:todos' })
  update(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const todoId = num(params.todoId, 'todoId');
    const actor = this.guards.requireActor(ctx, 'todo');
    this.guards.requireTripEdit(tripId, actor, TODO_EDIT_ACTION);
    const input = asPayload(params.input);
    const updated = this.todos.updateItem(String(tripId), String(todoId), input as never, Object.keys(input));
    if (!updated) throw new ForbiddenResource(`no todo ${todoId} on trip ${tripId}`);
    this.realtime.broadcast(tripId, 'todo:updated', { item: updated }, undefined);
    return updated;
  }

  @PluginMethod('todos.delete', { permission: 'db:write:todos' })
  delete(params: Record<string, unknown>, ctx: PluginRpcContext): unknown {
    const tripId = num(params.tripId, 'tripId');
    const todoId = num(params.todoId, 'todoId');
    const actor = this.guards.requireActor(ctx, 'todo');
    this.guards.requireTripEdit(tripId, actor, TODO_EDIT_ACTION);
    if (!this.todos.deleteItem(String(tripId), String(todoId))) {
      throw new ForbiddenResource(`no todo ${todoId} on trip ${tripId}`);
    }
    this.realtime.broadcast(tripId, 'todo:deleted', { itemId: todoId }, undefined);
    return { deleted: true };
  }
}
