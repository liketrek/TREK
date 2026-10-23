import { DomainError } from '../../../src/nest/common/domain-error';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import type { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { PackingWritesService } from '../../../src/nest/packing/packing-writes.service';
import type { PackingService } from '../../../src/nest/packing/packing.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import type { User } from '../../../src/types';

import { describe, it, expect, vi } from 'vitest';

/**
 * The packing item use cases, run through both surfaces' writers against one
 * stubbed PackingService: REST's sink goes through PackingService.broadcast /
 * broadcastToViewers, MCP's through McpToolGuardsService.safeBroadcast. Both end
 * at a realtime mock here, so the event names of one write can be compared.
 */

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const common = { id: 3, name: 'Socks', is_private: 0, owner_id: 1 };
const restricted = { id: 3, name: 'Socks', is_private: 1, owner_id: 1, recipients: [{ user_id: 2 }] };

function viewersOf(
  item: { is_private?: number; owner_id?: number | null; recipients?: { user_id: number }[] } | null | undefined,
) {
  if (!item || !item.is_private) return null;
  return [item.owner_id, ...(item.recipients ?? []).map((r) => r.user_id)].filter((x): x is number => x != null);
}

function setup(overrides: Record<string, unknown> = {}, opts: { allowed?: boolean; trip?: unknown } = {}) {
  const realtime = { broadcast: vi.fn() };
  const packing = {
    verifyTripAccess: vi.fn().mockResolvedValue('trip' in opts ? opts.trip : { user_id: 1 }),
    getItemPrivacy: vi.fn().mockResolvedValue({ is_private: 0 }),
    createItem: vi.fn().mockResolvedValue(common),
    updateItem: vi.fn().mockResolvedValue(common),
    deleteItem: vi.fn().mockResolvedValue(common),
    viewersOf,
    broadcast: (t: string, e: string, p: unknown, sid?: string) => realtime.broadcast(t, e, p, sid),
    broadcastToViewers: (t: string, e: string, p: unknown, ids: number[], sid?: string) => {
      for (const uid of ids) realtime.broadcast(t, e, p, sid, uid);
    },
    broadcastBagTotals: (t: string) => realtime.broadcast(t, 'packing:bag-totals', {}, undefined),
    broadcastUpdate: vi.fn(
      (
        t: string,
        id: number,
        item: { is_private?: number; owner_id?: number | null },
        wasPrivate: boolean,
        sid?: string,
      ) => {
        // PackingService.broadcastUpdate's routing: a restricted item reaches its owner only.
        const only = item.is_private && item.owner_id != null ? item.owner_id : undefined;
        if (item.is_private) {
          if (!wasPrivate) realtime.broadcast(t, 'packing:deleted', { itemId: id }, sid);
          realtime.broadcast(t, wasPrivate ? 'packing:updated' : 'packing:created', { item }, sid, only);
          return;
        }
        if (wasPrivate) realtime.broadcast(t, 'packing:created', { item }, sid);
        realtime.broadcast(t, 'packing:updated', { item }, sid);
      },
    ),
    ...overrides,
  } as unknown as PackingService;
  const permissions = {
    checkPermission: vi.fn().mockResolvedValue(opts.allowed ?? true),
  } as unknown as PermissionsService;
  const notifications = { actorName: vi.fn().mockResolvedValue('u') } as unknown as NotificationsService;
  const writes = new PackingWritesService(packing, permissions, notifications);
  const guards = new McpToolGuardsService(
    { getOwnerId: vi.fn().mockResolvedValue(1) } as never,
    { getRole: vi.fn().mockResolvedValue('user') } as never,
    permissions,
    realtime as never,
  );
  const names = () => realtime.broadcast.mock.calls.map((c) => c[1] as string);
  const run = async (
    surface: 'rest' | 'mcp',
    fn: (w: Awaited<ReturnType<typeof guards.tripWriter>>) => Promise<unknown>,
  ) => {
    realtime.broadcast.mockClear();
    const writer = surface === 'rest' ? writes.restWriter('5', user, 'sock') : await guards.tripWriter(5, 1);
    await fn(writer);
    return { names: names(), calls: [...realtime.broadcast.mock.calls] };
  };
  return { writes, packing, permissions, notifications, realtime, run };
}

describe('packing item events: REST == MCP', () => {
  it('PACK-PARITY-001: a create sends the same events on both surfaces', async () => {
    const s = setup();
    const rest = await s.run('rest', (w) => s.writes.createItem('5', { name: 'Socks' }, w));
    const mcp = await s.run('mcp', (w) => s.writes.createItem(5, { name: 'Socks' }, w));
    expect(mcp.names).toEqual(rest.names);
    expect(rest.names).toEqual(['packing:created', 'packing:bag-totals']);
  });

  it('PACK-PARITY-002: a delete sends the same events on both surfaces', async () => {
    const s = setup();
    const rest = await s.run('rest', (w) => s.writes.deleteItem('5', 3, w));
    const mcp = await s.run('mcp', (w) => s.writes.deleteItem(5, 3, w));
    expect(mcp.names).toEqual(rest.names);
    expect(rest.names).toEqual(['packing:deleted', 'packing:bag-totals']);
  });

  it('PACK-PARITY-003: an update of a common item sends the same events, bag totals only when a weight can move', async () => {
    const s = setup();
    const restRename = await s.run('rest', (w) => s.writes.updateItem('5', 3, { name: 'Wool socks' }, ['name'], w));
    const mcpRename = await s.run('mcp', (w) => s.writes.updateItem(5, 3, { name: 'Wool socks' }, ['name'], w));
    expect(mcpRename.names).toEqual(restRename.names);
    expect(restRename.names).toEqual(['packing:updated']);

    const restWeigh = await s.run('rest', (w) =>
      s.writes.updateItem('5', 3, { weight_grams: 80 }, ['weight_grams'], w),
    );
    const mcpWeigh = await s.run('mcp', (w) => s.writes.updateItem(5, 3, { weight_grams: 80 }, ['weight_grams'], w));
    expect(mcpWeigh.names).toEqual(restWeigh.names);
    expect(restWeigh.names).toEqual(['packing:updated', 'packing:bag-totals']);
  });

  it('PACK-PARITY-004: privatizing an item sends the same events; who receives the re-add still differs by surface', async () => {
    const s = setup({ updateItem: vi.fn().mockResolvedValue(restricted) });
    const rest = await s.run('rest', (w) => s.writes.updateItem('5', 3, { is_private: true }, ['is_private'], w));
    const mcp = await s.run('mcp', (w) => s.writes.updateItem(5, 3, { is_private: true }, ['is_private'], w));
    // One event per recipient on a scoped delivery, so compare the events, not the sends.
    const events = (names: string[]) => names.filter((n, i) => n !== names[i - 1]);
    expect(events(mcp.names)).toEqual(events(rest.names));
    expect(events(rest.names)).toEqual(['packing:deleted', 'packing:created']);
    // Pinned on purpose (see PackingWritesService): REST re-adds for the owner only,
    // MCP for the owner and the recipients.
    expect(rest.calls[1][4]).toBe(1);
    expect(mcp.calls.slice(1).map((c) => c[4])).toEqual([1, 2]);
  });
});

describe("REST writer: PackingService's broadcasts", () => {
  it('PACK-REST-001: carries the user and the socket, and emit skips the sender for the room or names each viewer', () => {
    const s = setup();
    const writer = s.writes.restWriter('5', user, 'sock');
    expect(writer).toMatchObject({ userId: 1, role: 'user', socketId: 'sock', surface: 'rest' });

    writer.events.emit('packing:deleted', { itemId: 3 });
    writer.events.emit('packing:deleted', { itemId: 4 }, [1, 2]);
    expect(s.realtime.broadcast.mock.calls).toEqual([
      ['5', 'packing:deleted', { itemId: 3 }, 'sock'],
      ['5', 'packing:deleted', { itemId: 4 }, 'sock', 1],
      ['5', 'packing:deleted', { itemId: 4 }, 'sock', 2],
    ]);
  });

  it('PACK-REST-002: emitAll reaches every socket in the room, the sender included', () => {
    const s = setup();
    s.writes.restWriter('5', user, 'sock').events.emitAll('packing:bag-totals', {});
    expect(s.realtime.broadcast.mock.calls).toEqual([['5', 'packing:bag-totals', {}, undefined]]);
  });
});

describe('packing item use cases: refusals', () => {
  const mcpText = (err: unknown) => (err as DomainError).mcpMessage ?? (err as DomainError).publicMessage;

  it('PACK-UC-001: a trip the writer cannot see, or one it may not edit, is refused before any write', async () => {
    const hidden = setup({}, { trip: undefined });
    const err = await hidden.run('mcp', (w) => hidden.writes.createItem(5, { name: 'x' }, w)).catch((e: unknown) => e);
    expect((err as DomainError).getStatus()).toBe(404);
    expect(mcpText(err)).toBe('Trip not found or access denied.');
    expect(hidden.packing.createItem).not.toHaveBeenCalled();

    const denied = setup({}, { allowed: false });
    const err2 = await denied.run('mcp', (w) => denied.writes.deleteItem(5, 3, w)).catch((e: unknown) => e);
    expect((err2 as DomainError).getStatus()).toBe(403);
    expect(mcpText(err2)).toBe('You do not have permission to perform this action on this trip.');
    expect(denied.packing.deleteItem).not.toHaveBeenCalled();
  });

  it("PACK-UC-002: a missing item is REST's 404 and MCP's own sentence, for update and delete", async () => {
    const s = setup({ updateItem: vi.fn().mockResolvedValue(null), deleteItem: vi.fn().mockResolvedValue(null) });
    const calls = [
      (w: never) => s.writes.updateItem(5, 3, { name: 'x' }, ['name'], w),
      (w: never) => s.writes.deleteItem(5, 3, w),
    ];
    const errors = (await Promise.all(
      calls.map((call) => s.run('mcp', call as never).catch((e: unknown) => e)),
    )) as DomainError[];
    for (const err of errors) {
      expect(err.toBody()).toEqual({ error: 'Item not found' });
      expect(mcpText(err)).toBe('Packing item not found.');
    }
  });

  it('PACK-UC-003: a bag off the trip is a 400 on both create and update (#2154), broadcasting nothing', async () => {
    const s = setup({
      createItem: vi.fn().mockResolvedValue({ invalidBag: true }),
      updateItem: vi.fn().mockResolvedValue({ invalidBag: true }),
    });
    const calls = [
      (w: never) => s.writes.createItem(5, { name: 'x', bag_id: 99 }, w),
      (w: never) => s.writes.updateItem(5, 3, { bag_id: 99 }, ['bag_id'], w),
    ];
    const errors = (await Promise.all(
      calls.map((call) => s.run('mcp', call as never).catch((e: unknown) => e)),
    )) as DomainError[];
    for (const err of errors) {
      expect(err.getStatus()).toBe(400);
      expect(err.toBody()).toEqual({ error: 'Bag not found' });
      expect(mcpText(err)).toBe('Bag not found.');
    }
    expect(s.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('PACK-UC-004: a stale offline write answers the 409 conflict body with the server row (#1135)', async () => {
    const server = { id: 3, updated_at: '2026-01-01 00:00:00' };
    const s = setup({ updateItem: vi.fn().mockResolvedValue({ conflict: true, server }) });
    const err = (await s
      .run('rest', (w) => s.writes.updateItem('5', 3, { name: 'x' }, ['name'], w, 'stale'))
      .catch((e: unknown) => e)) as DomainError;
    expect(err.getStatus()).toBe(409);
    expect(err.toBody()).toEqual({ error: 'conflict', server });
    expect(Object.keys(err.toBody())).toEqual(['error', 'server']);
    expect(s.packing.updateItem).toHaveBeenCalledWith('5', 3, { name: 'x' }, ['name'], 'stale', 1);
  });
});

describe('packing list use cases: REST == MCP', () => {
  const shared = { id: 3, is_private: 1, owner_id: 1, recipients: [{ user_id: 2 }] };
  const mcpText = (err: unknown) => (err as DomainError).mcpMessage ?? (err as DomainError).publicMessage;

  it('PACK-LIST-001: a sharing change drops the item from the room, re-adds it for its viewers, and pings no bag totals', async () => {
    const s = setup({ setItemSharing: vi.fn().mockResolvedValue(shared) });
    const rest = await s.run('rest', (w) => s.writes.setSharing('5', 3, 'shared', [2], w));
    const mcp = await s.run('mcp', (w) => s.writes.setSharing(5, 3, 'shared', [2], w));
    // The MCP tool used to add a bag-totals ping the route never sent.
    expect(mcp.names).toEqual(rest.names);
    expect(rest.names).toEqual(['packing:deleted', 'packing:created', 'packing:created']);
    expect(rest.calls.slice(1).map((c) => c[4])).toEqual([1, 2]);
    expect(mcp.calls.slice(1).map((c) => c[4])).toEqual([1, 2]);
    expect(s.packing.setItemSharing).toHaveBeenCalledWith(5, 3, 1, 'shared', [2]);
  });

  it("PACK-LIST-002: only the owner changes the sharing: REST's 403 and MCP's sentence, nothing sent", async () => {
    const s = setup({ setItemSharing: vi.fn().mockResolvedValue({ forbidden: true }) });
    const err = await s.run('mcp', (w) => s.writes.setSharing(5, 3, 'personal', [], w)).catch((e: unknown) => e);
    expect((err as DomainError).getStatus()).toBe(403);
    expect((err as DomainError).toBody()).toEqual({ error: 'Only the owner can change sharing' });
    expect(mcpText(err)).toBe('Only the owner can change sharing.');
    expect(s.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('PACK-LIST-003: a reorder tells the other tabs on both surfaces, REST skipping the sender', async () => {
    const s = setup({ reorderItems: vi.fn().mockResolvedValue(undefined) });
    const rest = await s.run('rest', (w) => s.writes.reorder('5', [3, 1], w));
    const mcp = await s.run('mcp', (w) => s.writes.reorder(5, [3, 1], w));
    expect(rest.calls).toEqual([['5', 'packing:reordered', { orderedIds: [3, 1] }, 'sock']]);
    expect(mcp.calls).toEqual([[5, 'packing:reordered', { orderedIds: [3, 1], _source: 'mcp' }]]);
  });

  it('PACK-LIST-004: a bag delete sends the delete and the totals ping; a bag off the trip is a 404 and sends nothing', async () => {
    const s = setup({ deleteBag: vi.fn().mockResolvedValue(true) });
    const rest = await s.run('rest', (w) => s.writes.deleteBag('5', 7, w));
    const mcp = await s.run('mcp', (w) => s.writes.deleteBag(5, 7, w));
    expect(mcp.names).toEqual(rest.names);
    expect(rest.names).toEqual(['packing:bag-deleted', 'packing:bag-totals']);

    const gone = setup({ deleteBag: vi.fn().mockResolvedValue(false) });
    const err = await gone.run('mcp', (w) => gone.writes.deleteBag(5, 7, w)).catch((e: unknown) => e);
    expect((err as DomainError).getStatus()).toBe(404);
    expect((err as DomainError).toBody()).toEqual({ error: 'Bag not found' });
    expect(mcpText(err)).toBe('Bag not found.');
    expect(gone.realtime.broadcast).not.toHaveBeenCalled();
  });

  it('PACK-LIST-005: category assignees go to the room and notify the tagged travellers on both surfaces', async () => {
    const assignees = [{ user_id: 2 }];
    const s = setup({ updateCategoryAssignees: vi.fn().mockResolvedValue(assignees), notifyTagged: vi.fn() });
    const rest = await s.run('rest', (w) => s.writes.setCategoryAssignees('5', 'Clothes', [2], w));
    const mcp = await s.run('mcp', (w) => s.writes.setCategoryAssignees(5, 'Clothes', [2], w));
    expect(mcp.names).toEqual(rest.names);
    expect(rest.calls).toEqual([['5', 'packing:assignees', { category: 'Clothes', assignees }, 'sock']]);
    // The MCP tool used to tell none of them; both name the actor by name.
    const actor = { id: 1, username: 'u' };
    expect(s.packing.notifyTagged).toHaveBeenNthCalledWith(1, '5', actor, 'Clothes', [2]);
    expect(s.packing.notifyTagged).toHaveBeenNthCalledWith(2, '5', actor, 'Clothes', [2]);
    expect(s.notifications.actorName).toHaveBeenCalledWith(1);
  });

  it('PACK-LIST-006: clearing a category notifies nobody, and an actor without a name is not named', async () => {
    const s = setup({ updateCategoryAssignees: vi.fn().mockResolvedValue([]), notifyTagged: vi.fn() });
    await s.run('mcp', (w) => s.writes.setCategoryAssignees(5, 'Clothes', [], w));
    expect(s.notifications.actorName).not.toHaveBeenCalled();

    vi.mocked(s.notifications.actorName).mockResolvedValueOnce('');
    await s.run('mcp', (w) => s.writes.setCategoryAssignees(5, 'Clothes', [2], w));
    expect(s.packing.notifyTagged).not.toHaveBeenCalled();
  });

  it('PACK-LIST-007: a template applied as personal items reaches its owner alone, on both surfaces', async () => {
    const items = [{ id: 8, is_private: 1, owner_id: 1 }];
    const s = setup({ applyTemplate: vi.fn().mockResolvedValue(items) });
    const rest = await s.run('rest', (w) => s.writes.applyTemplate('5', 4, 'personal', w));
    const mcp = await s.run('mcp', (w) => s.writes.applyTemplate(5, 4, 'personal', w));
    expect(rest.calls).toEqual([
      ['5', 'packing:template-applied', { items }, 'sock', 1],
      ['5', 'packing:bag-totals', {}, undefined],
    ]);
    expect(mcp.calls).toEqual([
      [5, 'packing:template-applied', { items, _source: 'mcp' }, undefined, 1],
      ['5', 'packing:bag-totals', {}, undefined],
    ]);
    // The owner rides along on both, so a personal apply is the writer's own list.
    expect(s.packing.applyTemplate).toHaveBeenNthCalledWith(1, '5', 4, 'personal', 1);
    expect(s.packing.applyTemplate).toHaveBeenNthCalledWith(2, 5, 4, 'personal', 1);
  });

  it("PACK-LIST-008: a missing or empty template is REST's 404 and MCP's own sentence, nothing sent", async () => {
    const s = setup({ applyTemplate: vi.fn().mockResolvedValue(null) });
    const err = await s.run('mcp', (w) => s.writes.applyTemplate(5, 4, 'common', w)).catch((e: unknown) => e);
    expect((err as DomainError).getStatus()).toBe(404);
    expect((err as DomainError).toBody()).toEqual({ error: 'Template not found or empty' });
    expect(mcpText(err)).toBe('Template not found.');
    expect(s.realtime.broadcast).not.toHaveBeenCalled();
  });
});
