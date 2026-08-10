/**
 * The todo plugin surface after it moved onto @PluginMethod. Note the edit gate: the
 * app edits todos under 'packing_edit', not under a todo-specific action, which is
 * easy to lose in a move and is asserted here explicitly.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { TodoRpc } from '../../../src/nest/todo/todo.rpc';
import { TodoModule } from '../../../src/nest/todo/todo.module';
import type { TodoService } from '../../../src/nest/todo/todo.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });

/** Trip 1 belongs to user 42; todo 90 sits on it. */
function build(canEdit = true) {
  const todos = {
    listItems: vi.fn(() => [{ id: 90, name: 'Pack' }]),
    createItem: vi.fn((tripId: string, input: Record<string, unknown>) => ({ id: 91, trip_id: tripId, ...input })),
    updateItem: vi.fn((_t: string, id: string) => (id === '90' ? { id: 90, checked: 1 } : undefined)),
    deleteItem: vi.fn((_t: string, id: string) => id === '90'),
  } as unknown as TodoService & Record<string, ReturnType<typeof vi.fn>>;
  const realtime = { broadcast: vi.fn() } as unknown as RealtimeService & { broadcast: ReturnType<typeof vi.fn> };
  const permissions = { checkPermission: vi.fn(() => canEdit) } as unknown as PermissionsService;
  const guards = new PluginGuards(
    {
      canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined)),
      prepare: vi.fn(() => ({ get: () => ({ role: 'user' }) })),
    } as unknown as DatabaseService,
    permissions,
    { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
  );
  const rpc = new TodoRpc(todos, realtime, guards);
  const host = (...grants: string[]) =>
    new PluginRpcHost('p', new Set(grants), makeDeps(), createTestPluginRegistry([rpc]));
  return { todos, realtime, permissions, host };
}

describe('TodoRpc through the router', () => {
  let f: ReturnType<typeof build>;
  beforeEach(() => {
    f = build();
  });

  it('TODO-RPC-001 todos.list is trip-membership-gated', async () => {
    const host = f.host('db:read:todos');
    expect((await host.dispatch(req('todos.list', { tripId: 1 }), 42)).ok).toBe(true);
    expect(((await host.dispatch(req('todos.list', { tripId: 2 }), 42)) as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('TODO-RPC-002 writes need the grant, the edit right and a bound user', async () => {
    const host = f.host('db:write:todos');
    expect((await host.dispatch(req('todos.create', { tripId: 1, input: { name: 'Pack' } }), 42)).ok).toBe(true);
    expect((await host.dispatch(req('todos.update', { tripId: 1, todoId: 90, input: { checked: 1 } }), 42)).ok).toBe(true);
    expect((await host.dispatch(req('todos.delete', { tripId: 1, todoId: 90 }), 42)).ok).toBe(true);
    const noUser = (await host.dispatch(req('todos.create', { tripId: 1, input: { name: 'x' } }), undefined)) as RpcError;
    expect(noUser.error.message).toBe('todo writes require an authenticated user context');
  });

  it('TODO-RPC-003 the edit gate is packing_edit, not a todo-specific action', async () => {
    await f.host('db:write:todos').dispatch(req('todos.create', { tripId: 1, input: { name: 'Pack' } }), 42);
    expect(f.permissions.checkPermission).toHaveBeenCalledWith('packing_edit', 'user', 42, 42, false);
  });

  it('TODO-RPC-004 a blank name is BAD_PARAMS', async () => {
    const res = (await f.host('db:write:todos').dispatch(req('todos.create', { tripId: 1, input: { name: '  ' } }), 42)) as RpcError;
    expect(res.error.code).toBe('BAD_PARAMS');
    expect(res.error.message).toBe('todo name is required');
  });

  it('TODO-RPC-005 a missing todo is RESOURCE_FORBIDDEN, naming it', async () => {
    const host = f.host('db:write:todos');
    const upd = (await host.dispatch(req('todos.update', { tripId: 1, todoId: 404, input: {} }), 42)) as RpcError;
    expect(upd.error.message).toBe('no todo 404 on trip 1');
    const del = (await host.dispatch(req('todos.delete', { tripId: 1, todoId: 404 }), 42)) as RpcError;
    expect(del.error.message).toBe('no todo 404 on trip 1');
  });

  it('TODO-RPC-006 every write broadcasts the event the REST path emits', async () => {
    const host = f.host('db:write:todos');
    await host.dispatch(req('todos.create', { tripId: 1, input: { name: 'Pack' } }), 42);
    await host.dispatch(req('todos.update', { tripId: 1, todoId: 90, input: { checked: 1 } }), 42);
    await host.dispatch(req('todos.delete', { tripId: 1, todoId: 90 }), 42);
    expect(f.realtime.broadcast.mock.calls.map((c) => c[1])).toEqual(['todo:created', 'todo:updated', 'todo:deleted']);
  });

  it('TODO-RPC-007 a failed write never broadcasts', async () => {
    await f.host('db:write:todos').dispatch(req('todos.update', { tripId: 1, todoId: 404, input: {} }), 42);
    expect(f.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('TODO-RPC-008 the read grant does not unlock a write', async () => {
    const res = (await f.host('db:read:todos').dispatch(req('todos.create', { tripId: 1, input: { name: 'x' } }), 42)) as RpcError;
    expect(res.error.code).toBe('PERMISSION_DENIED');
  });

  it('TODO-RPC-009 without the edit right the write is refused before it touches the service', async () => {
    const noEdit = build(false);
    const res = (await noEdit.host('db:write:todos').dispatch(req('todos.create', { tripId: 1, input: { name: 'x' } }), 42)) as RpcError;
    expect(res.error.message).toBe('no permission to edit trip 1');
    expect(noEdit.todos.createItem).not.toHaveBeenCalled();
  });

  it('TODO-RPC-010 the class is listed in its module providers', () => {
    expectRegisteredProvider(TodoModule, TodoRpc);
  });
});
