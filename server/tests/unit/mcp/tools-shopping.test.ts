/**
 * Unit tests for the shopping MCP surface (ShoppingMcp, DI-discovered):
 * list_shopping_items, create_shopping_item, update_shopping_item,
 * toggle_shopping_item, delete_shopping_item, clear_checked_shopping_items,
 * reorder_shopping_items, plus the trek://trips/{tripId}/shopping resource.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 5000');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: number | string, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: number | string, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, addTripMember } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { ADDON_IDS } from '../../../src/addons';
import { invalidatePermissionsCache } from '../../../src/nest/permissions/permissions-cache';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
});

afterAll(() => {
  testDb.close();
});

type ShoppingRow = { id: number; name: string; checked: number; quantity: string | null; category: string | null; assigned_user_id: number | null; notes: string | null };
type ItemPayload = { item: ShoppingRow };
type ItemsPayload = { items: ShoppingRow[] };

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

function createShoppingItem(tripId: number, overrides: Partial<{ name: string; checked: number; quantity: string }> = {}) {
  const { max } = testDb.prepare('SELECT MAX(sort_order) as max FROM shopping_items WHERE trip_id = ?').get(tripId) as { max: number | null };
  const result = testDb.prepare(
    'INSERT INTO shopping_items (trip_id, name, checked, quantity, sort_order) VALUES (?, ?, ?, ?, ?)',
  ).run(tripId, overrides.name ?? 'Milk', overrides.checked ?? 0, overrides.quantity ?? null, (max ?? -1) + 1);
  return testDb.prepare('SELECT * FROM shopping_items WHERE id = ?').get(result.lastInsertRowid) as { id: number; name: string };
}

function itemCount(tripId: number): number {
  return (testDb.prepare('SELECT COUNT(*) as n FROM shopping_items WHERE trip_id = ?').get(tripId) as { n: number }).n;
}

describe('Tool: list_shopping_items', () => {
  it('returns the items ordered by sort_order', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createShoppingItem(trip.id, { name: 'First' });
    createShoppingItem(trip.id, { name: 'Second' });
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({ name: 'list_shopping_items', arguments: { tripId: trip.id } })) as ItemsPayload;
      expect(data.items.map((i) => i.name)).toEqual(['First', 'Second']);
    });
  });

  it('returns access denied for a non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_shopping_items', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

describe('Tool: create_shopping_item', () => {
  it('creates an item with all fields and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_shopping_item',
        arguments: { tripId: trip.id, name: 'Sunscreen', quantity: '2', category: 'Pharmacy', assigned_user_id: user.id, notes: 'SPF 50' },
      });
      const data = parseToolResult(result) as ItemPayload;
      expect(data.item).toMatchObject({ name: 'Sunscreen', quantity: '2', category: 'Pharmacy', assigned_user_id: user.id, notes: 'SPF 50', checked: 0 });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'shopping:created', expect.any(Object));
    });
  });

  it('rejects an empty name the way the REST contract does', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_shopping_item', arguments: { tripId: trip.id, name: '' } });
      expect(result.isError).toBe(true);
    });
    expect(itemCount(trip.id)).toBe(0);
  });

  it('refuses a stranger, a member without packing_edit and a demo user', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    try {
      await withHarness(stranger.id, async (h) => {
        expect((await h.client.callTool({ name: 'create_shopping_item', arguments: { tripId: trip.id, name: 'X' } })).isError).toBe(true);
      });

      testDb.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run('perm_packing_edit', 'trip_owner');
      invalidatePermissionsCache();
      await withHarness(member.id, async (h) => {
        expect((await h.client.callTool({ name: 'create_shopping_item', arguments: { tripId: trip.id, name: 'X' } })).isError).toBe(true);
      });

      process.env.DEMO_MODE = 'true';
      const { user: demo } = createUser(testDb, { email: 'demo@nomad.app' });
      const demoTrip = createTrip(testDb, demo.id);
      await withHarness(demo.id, async (h) => {
        expect((await h.client.callTool({ name: 'create_shopping_item', arguments: { tripId: demoTrip.id, name: 'X' } })).isError).toBe(true);
      });
      expect(itemCount(demoTrip.id)).toBe(0);
    } finally {
      testDb.prepare("DELETE FROM app_settings WHERE key = 'perm_packing_edit'").run();
      invalidatePermissionsCache();
    }
    expect(itemCount(trip.id)).toBe(0);
  });
});

describe('Tool: update_shopping_item', () => {
  it('changes only the provided fields and clears a field passed as null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createShoppingItem(trip.id, { name: 'Bread', quantity: '1' });
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'update_shopping_item',
        arguments: { tripId: trip.id, itemId: item.id, category: 'Bakery', quantity: null },
      })) as ItemPayload;
      expect(data.item).toMatchObject({ name: 'Bread', category: 'Bakery', quantity: null });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'shopping:updated', expect.any(Object));
    });
  });

  it('reports an unknown item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_shopping_item', arguments: { tripId: trip.id, itemId: 9999, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

describe('Tool: toggle_shopping_item', () => {
  it('checks and unchecks an item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createShoppingItem(trip.id);
    await withHarness(user.id, async (h) => {
      const on = parseToolResult(await h.client.callTool({ name: 'toggle_shopping_item', arguments: { tripId: trip.id, itemId: item.id, checked: true } })) as ItemPayload;
      expect(on.item.checked).toBe(1);
      const off = parseToolResult(await h.client.callTool({ name: 'toggle_shopping_item', arguments: { tripId: trip.id, itemId: item.id, checked: false } })) as ItemPayload;
      expect(off.item.checked).toBe(0);
    });
  });

  it('reports an unknown item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'toggle_shopping_item', arguments: { tripId: trip.id, itemId: 9999, checked: true } });
      expect(result.isError).toBe(true);
    });
  });
});

describe('Tool: delete_shopping_item', () => {
  it('deletes the item and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createShoppingItem(trip.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({ name: 'delete_shopping_item', arguments: { tripId: trip.id, itemId: item.id } })) as { success: boolean };
      expect(data.success).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'shopping:deleted', expect.objectContaining({ itemId: item.id }));
    });
    expect(itemCount(trip.id)).toBe(0);
  });

  it('reports an unknown item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_shopping_item', arguments: { tripId: trip.id, itemId: 9999 } });
      expect(result.isError).toBe(true);
    });
  });
});

describe('Tool: clear_checked_shopping_items', () => {
  it('deletes only the checked items and broadcasts each deletion', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bought = createShoppingItem(trip.id, { name: 'Bought', checked: 1 });
    createShoppingItem(trip.id, { name: 'Open' });
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({ name: 'clear_checked_shopping_items', arguments: { tripId: trip.id } })) as { deletedIds: number[] };
      expect(data.deletedIds).toEqual([bought.id]);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'shopping:deleted', expect.objectContaining({ itemId: bought.id }));
    });
    expect(itemCount(trip.id)).toBe(1);
  });
});

describe('Tool: reorder_shopping_items', () => {
  it('stores the new order', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const a = createShoppingItem(trip.id, { name: 'A' });
    const b = createShoppingItem(trip.id, { name: 'B' });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'reorder_shopping_items', arguments: { tripId: trip.id, orderedIds: [b.id, a.id] } });
      const data = parseToolResult(await h.client.callTool({ name: 'list_shopping_items', arguments: { tripId: trip.id } })) as ItemsPayload;
      expect(data.items.map((i) => i.name)).toEqual(['B', 'A']);
    });
  });
});

describe('Shopping tools — scope gating (packing group)', () => {
  const READ_TOOLS = ['list_shopping_items'];
  const WRITE_TOOLS = [
    'create_shopping_item', 'update_shopping_item', 'toggle_shopping_item',
    'delete_shopping_item', 'clear_checked_shopping_items', 'reorder_shopping_items',
  ];

  async function listToolNames(userId: number, scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ userId, withResources: false, scopes });
    try {
      return (await h.client.listTools()).tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('registers every tool with null scopes (full access)', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, null);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).toContain(tool);
  });

  it('registers only the read tool with packing:read', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['packing:read']);
    for (const tool of READ_TOOLS) expect(names).toContain(tool);
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool);
  });

  it('registers no shopping tools for an unrelated scope', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['todos:write']);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).not.toContain(tool);
  });
});

describe('Shopping tools — packing addon gating', () => {
  it('registers nothing (tools or resource) when the packing addon is disabled', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare('UPDATE addons SET enabled = 0 WHERE id = ?').run(ADDON_IDS.PACKING);
    try {
      await withHarness(user.id, async (h) => {
        const names = (await h.client.listTools()).tools.map((t) => t.name);
        expect(names).not.toContain('list_shopping_items');
        expect(names).not.toContain('create_shopping_item');
        await expect(h.client.readResource({ uri: `trek://trips/${trip.id}/shopping` })).rejects.toThrow();
      });
    } finally {
      testDb.prepare('UPDATE addons SET enabled = 1 WHERE id = ?').run(ADDON_IDS.PACKING);
    }
  });
});

describe('Resource: trek://trips/{tripId}/shopping', () => {
  it('returns the trip shopping items ordered by position', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createShoppingItem(trip.id, { name: 'First' });
    createShoppingItem(trip.id, { name: 'Second' });
    await withHarness(user.id, async (h) => {
      const items = parseResourceResult(await h.client.readResource({ uri: `trek://trips/${trip.id}/shopping` })) as ShoppingRow[];
      expect(items.map((i) => i.name)).toEqual(['First', 'Second']);
    });
  });

  it('returns the access-denied payload for a non-member and for a malformed id', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      for (const uri of [`trek://trips/${trip.id}/shopping`, 'trek://trips/not-a-number/shopping']) {
        expect(parseResourceResult(await h.client.readResource({ uri }))).toEqual({ error: 'Trip not found or access denied' });
      }
    });
  });
});
