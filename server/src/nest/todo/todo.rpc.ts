import { PluginController, PluginMethod } from '../../nest-rpc/rpc-kit/decorators';
import { PluginGuards } from '../../nest-rpc/plugin-guards.service';
import { BadParams, ForbiddenResource } from '../../nest-rpc/rpc-errors';
import { asPayload, num } from '../../nest-rpc/rpc-params';
import type { PluginRpcContext } from '../../nest-rpc/rpc-kit/types';
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
  async list(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown[]> {
    return await this.guards.tripRead(
      params,
      ctx,
      async () => (await this.todos.listItems(String(num(params.tripId, 'tripId')))) as unknown[],
    );
  }

  @PluginMethod('todos.create', { permission: 'db:write:todos' })
  async create(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const actor = this.guards.requireActor(ctx, 'todo');
    const input = asPayload(params.input);
    if (typeof input.name !== 'string' || input.name.trim() === '') throw new BadParams('todo name is required');
    await this.guards.requireTripEdit(tripId, actor, TODO_EDIT_ACTION);
    const item = await this.todos.createItem(String(tripId), input as never);
    this.realtime.broadcast(tripId, 'todo:created', { item }, undefined);
    return item;
  }

  @PluginMethod('todos.update', { permission: 'db:write:todos' })
  async update(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const todoId = num(params.todoId, 'todoId');
    const actor = this.guards.requireActor(ctx, 'todo');
    await this.guards.requireTripEdit(tripId, actor, TODO_EDIT_ACTION);
    const input = asPayload(params.input);
    const updated = await this.todos.updateItem(String(tripId), todoId, input as never, Object.keys(input));
    if (!updated) throw new ForbiddenResource(`no todo ${todoId} on trip ${tripId}`);
    this.realtime.broadcast(tripId, 'todo:updated', { item: updated }, undefined);
    return updated;
  }

  @PluginMethod('todos.delete', { permission: 'db:write:todos' })
  async delete(params: Record<string, unknown>, ctx: PluginRpcContext): Promise<unknown> {
    const tripId = num(params.tripId, 'tripId');
    const todoId = num(params.todoId, 'todoId');
    const actor = this.guards.requireActor(ctx, 'todo');
    await this.guards.requireTripEdit(tripId, actor, TODO_EDIT_ACTION);
    if (!(await this.todos.deleteItem(String(tripId), todoId))) {
      throw new ForbiddenResource(`no todo ${todoId} on trip ${tripId}`);
    }
    this.realtime.broadcast(tripId, 'todo:deleted', { itemId: todoId }, undefined);
    return { deleted: true };
  }
}
