/**
 * The day-note plugin surface after it moved onto @PluginMethod. The dispatch-level
 * cases come from rpc-host.test.ts unchanged except for the construction line and
 * the stub identity; the rest cover the per-handler paths the router-level test had
 * no room for.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expectRegisteredProvider } from '../../helpers/module-providers';
import { PluginRpcHost } from '../../../src/nest/plugins/host/rpc-host';
import { createTestPluginRegistry } from '../../../src/nest/plugins/host/rpc-kit/testing';
import { PluginGuards } from '../../../src/nest/plugins/host/plugin-guards.service';
import { DayNotesRpc } from '../../../src/nest/day-notes/day-notes.rpc';
import { DayNotesModule } from '../../../src/nest/day-notes/day-notes.module';
import type { DayNotesService } from '../../../src/nest/day-notes/day-notes.service';
import type { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import type { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { AddonsService } from '../../../src/nest/addons/addons.service';
import type { RpcRequest, RpcError } from '../../../src/nest/plugins/protocol/envelope';
import { makeDeps } from '../../helpers/rpc-host-deps';

const req = (method: string, params: Record<string, unknown> = {}): RpcRequest => ({ k: 'req', id: 'x', method, params });

/** Trip 1 belongs to user 42; day 5 and note 50 sit on it. Nothing else does. */
function build(canEdit = true) {
  const notes = {
    list: vi.fn((dayId: number, tripId: number) => [{ id: 50, day_id: dayId, trip_id: tripId, text: 'note' }]),
    dayExists: vi.fn((dayId: number, tripId: number) => dayId === 5 && tripId === 1),
    getNote: vi.fn((id: number, dayId: number, tripId: number) =>
      id === 50 && dayId === 5 && tripId === 1 ? { id: 50, text: 'note' } : undefined,
    ),
    create: vi.fn((dayId: number, tripId: number, text: string) => ({ id: 51, day_id: dayId, trip_id: tripId, text })),
    update: vi.fn((id: number) => ({ id, text: 'updated' })),
    remove: vi.fn(),
  } as unknown as DayNotesService & Record<string, ReturnType<typeof vi.fn>>;
  const realtime = { broadcast: vi.fn() } as unknown as RealtimeService & { broadcast: ReturnType<typeof vi.fn> };
  const db = {
    canAccessTrip: vi.fn((tripId: number, userId: number) => (tripId === 1 && userId === 42 ? { id: 1, user_id: 42 } : undefined)),
    prepare: vi.fn(() => ({ get: () => ({ role: 'user' }) })),
  } as unknown as DatabaseService;
  const guards = new PluginGuards(
    db,
    { checkPermission: vi.fn(() => canEdit) } as unknown as PermissionsService,
    { isAddonEnabled: vi.fn(() => true) } as unknown as AddonsService,
  );
  const rpc = new DayNotesRpc(notes, realtime, guards);
  const host = (...grants: string[]) =>
    new PluginRpcHost('p', new Set(grants), makeDeps(), createTestPluginRegistry([rpc]));
  return { notes, realtime, rpc, host };
}

describe('DayNotesRpc through the router', () => {
  let f: ReturnType<typeof build>;
  beforeEach(() => {
    f = build();
  });

  it('DAYNOTES-RPC-001 daynotes.list is membership-checked (trip-scoped)', async () => {
    const host = f.host('db:read:daynotes');
    expect((await host.dispatch(req('daynotes.list', { tripId: 1, dayId: 5 }), 42)).ok).toBe(true);
    expect(f.notes.list).toHaveBeenCalledWith(5, 1);
    const forbidden = await host.dispatch(req('daynotes.list', { tripId: 999, dayId: 5 }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('DAYNOTES-RPC-002 create needs db:write:daynotes + day_edit, membership-checked, text required', async () => {
    const host = f.host('db:write:daynotes');
    expect((await host.dispatch(req('daynotes.create', { tripId: 1, dayId: 5, input: { text: 'Pack sunscreen' } }), 42)).ok).toBe(true);
    expect(f.notes.create).toHaveBeenCalledWith(5, 1, 'Pack sunscreen', undefined, undefined, undefined);
    const bad = await host.dispatch(req('daynotes.create', { tripId: 1, dayId: 5, input: { text: '  ' } }), 42);
    expect((bad as RpcError).error.code).toBe('BAD_PARAMS');
    const forbidden = await host.dispatch(req('daynotes.create', { tripId: 2, dayId: 5, input: { text: 'x' } }), 42);
    expect((forbidden as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('DAYNOTES-RPC-003 delete is gated the same way (edit + membership + bound user)', async () => {
    const host = f.host('db:write:daynotes');
    expect((await host.dispatch(req('daynotes.delete', { tripId: 1, dayId: 5, noteId: 50 }), 42)).ok).toBe(true);
    expect(f.notes.remove).toHaveBeenCalledWith(50);
    const noUser = await host.dispatch(req('daynotes.delete', { tripId: 1, dayId: 5, noteId: 50 }), undefined);
    expect((noUser as RpcError).error.code).toBe('RESOURCE_FORBIDDEN');
  });

  it('DAYNOTES-RPC-004 the read grant does not unlock a write', async () => {
    const host = f.host('db:read:daynotes');
    const res = (await host.dispatch(req('daynotes.create', { tripId: 1, dayId: 5, input: { text: 'x' } }), 42)) as RpcError;
    expect(res.error.code).toBe('PERMISSION_DENIED');
  });

  it('DAYNOTES-RPC-005 update broadcasts and returns the updated note', async () => {
    const host = f.host('db:write:daynotes');
    expect((await host.dispatch(req('daynotes.update', { tripId: 1, dayId: 5, noteId: 50, input: { text: 'new' } }), 42)).ok).toBe(true);
    expect(f.realtime.broadcast).toHaveBeenCalledWith(1, 'dayNote:updated', expect.objectContaining({ dayId: 5 }), undefined);
  });

  it('DAYNOTES-RPC-006 a note on another day is refused, naming it', async () => {
    const host = f.host('db:write:daynotes');
    const res = (await host.dispatch(req('daynotes.update', { tripId: 1, dayId: 5, noteId: 404, input: {} }), 42)) as RpcError;
    expect(res.error.code).toBe('RESOURCE_FORBIDDEN');
    expect(res.error.message).toBe('no note 404 on day 5');
  });

  it('DAYNOTES-RPC-007 without the edit permission the write is refused before it touches the service', async () => {
    const noEdit = build(false);
    const host = noEdit.host('db:write:daynotes');
    const res = (await host.dispatch(req('daynotes.create', { tripId: 1, dayId: 5, input: { text: 'x' } }), 42)) as RpcError;
    expect(res.error.message).toBe('no permission to edit trip 1');
    expect(noEdit.notes.create).not.toHaveBeenCalled();
  });

  it('DAYNOTES-RPC-008 a day outside the trip is refused, naming it', async () => {
    const host = f.host('db:write:daynotes');
    const res = (await host.dispatch(req('daynotes.create', { tripId: 1, dayId: 99, input: { text: 'x' } }), 42)) as RpcError;
    expect(res.error.message).toBe('no day 99 on trip 1');
  });

  it('DAYNOTES-RPC-009 the class is listed in its module providers', () => {
    expectRegisteredProvider(DayNotesModule, DayNotesRpc);
  });
});
