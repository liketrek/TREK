/**
 * Unit tests for the packing MCP surface (PackingMcp, DI-discovered):
 * create_packing_item, update_packing_item, toggle_packing_item,
 * delete_packing_item, plus the registration-time scope/addon gating and the
 * trek://trips/{tripId}/packing + .../packing/bags resources (moved from the
 * legacy registerResources — see resources.test.ts). The advanced tools live
 * in tools-packing-advanced.test.ts.
 *
 * All of it attaches via the nest-mcp registry inside registerTools, so every
 * harness here keeps withTools on (the resources are NOT registered by the
 * legacy registerResources fan-out anymore).
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
    canAccessTrip: (tripId: any, userId: number) =>
      db.prepare(`SELECT t.id, t.user_id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)`).get(userId, tripId, userId),
    isOwner: (tripId: any, userId: number) =>
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
import { createUser, createTrip, createPackingItem } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { ADDON_IDS } from '../../../src/addons';

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

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// create_packing_item
// ---------------------------------------------------------------------------

describe('Tool: create_packing_item', () => {
  it('creates a packing item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_packing_item',
        arguments: { tripId: trip.id, name: 'Passport', category: 'Documents' },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('Passport');
      expect(data.item.category).toBe('Documents');
      expect(data.item.checked).toBe(0);
    });
  });

  it('defaults category to "General"', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_packing_item',
        arguments: { tripId: trip.id, name: 'Sunscreen' },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.category).toBe('General');
    });
  });

  it('broadcasts packing:created event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_packing_item', arguments: { tripId: trip.id, name: 'Hat' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:created', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_packing_item', arguments: { tripId: trip.id, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_packing_item', arguments: { tripId: trip.id, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_packing_item
// ---------------------------------------------------------------------------

describe('Tool: update_packing_item', () => {
  it('updates packing item name and category', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id, { name: 'Old', category: 'Clothes' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, name: 'New Name', category: 'Electronics' },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('New Name');
      expect(data.item.category).toBe('Electronics');
    });
  });

  it('broadcasts packing:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_packing_item', arguments: { tripId: trip.id, itemId: item.id, name: 'Updated' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:updated', expect.any(Object));
    });
  });

  it('returns error for item not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_packing_item', arguments: { tripId: trip.id, itemId: 99999, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_packing_item', arguments: { tripId: trip.id, itemId: item.id, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// toggle_packing_item
// ---------------------------------------------------------------------------

describe('Tool: toggle_packing_item', () => {
  it('checks a packing item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'toggle_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, checked: true },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.checked).toBe(1);
    });
  });

  it('unchecks a packing item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    testDb.prepare('UPDATE packing_items SET checked = 1 WHERE id = ?').run(item.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'toggle_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, checked: false },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.checked).toBe(0);
    });
  });

  it('broadcasts packing:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'toggle_packing_item', arguments: { tripId: trip.id, itemId: item.id, checked: true } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:updated', expect.any(Object));
    });
  });

  it('returns error for item not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'toggle_packing_item', arguments: { tripId: trip.id, itemId: 99999, checked: true } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'toggle_packing_item', arguments: { tripId: trip.id, itemId: item.id, checked: true } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_packing_item
// ---------------------------------------------------------------------------

describe('Tool: delete_packing_item', () => {
  it('deletes an existing packing item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_packing_item', arguments: { tripId: trip.id, itemId: item.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(testDb.prepare('SELECT id FROM packing_items WHERE id = ?').get(item.id)).toBeUndefined();
    });
  });

  it('broadcasts packing:deleted event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_packing_item', arguments: { tripId: trip.id, itemId: item.id } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:deleted', expect.any(Object));
    });
  });

  it('returns error for item not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_packing_item', arguments: { tripId: trip.id, itemId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_packing_item', arguments: { tripId: trip.id, itemId: item.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Scope gating (packing read/write, registration-time)
// ---------------------------------------------------------------------------

describe('Packing tools — scope gating', () => {
  const READ_TOOLS = ['list_packing_bags', 'get_packing_category_assignees', 'list_packing_templates'];
  const WRITE_TOOLS = [
    'create_packing_item', 'toggle_packing_item', 'delete_packing_item', 'update_packing_item',
    'reorder_packing_items', 'create_packing_bag', 'update_packing_bag', 'delete_packing_bag',
    'set_bag_members', 'set_packing_category_assignees', 'apply_packing_template',
    'save_packing_template', 'delete_packing_template', 'bulk_import_packing',
  ];

  async function listToolNames(userId: number, scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ userId, withResources: false, scopes });
    try {
      return (await h.client.listTools()).tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('registers all seventeen tools with null scopes (full access)', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, null);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).toContain(tool);
  });

  it('registers only the read tools with packing:read', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['packing:read']);
    for (const tool of READ_TOOLS) expect(names).toContain(tool);
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool);
  });

  it('registers no packing tools for an unrelated scope', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['budget:read']);
    for (const tool of [...READ_TOOLS, ...WRITE_TOOLS]) expect(names).not.toContain(tool);
  });
});

// ---------------------------------------------------------------------------
// Addon gating (packing addon, the legacy whole-registrar early return —
// now the `when` predicate on every PackingMcp entry)
// ---------------------------------------------------------------------------

describe('Packing tools — packing addon gating', () => {
  it('registers nothing (tools or resources) when the packing addon is disabled', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare('UPDATE addons SET enabled = 0 WHERE id = ?').run(ADDON_IDS.PACKING);
    try {
      await withHarness(user.id, async (h) => {
        const names = (await h.client.listTools()).tools.map((t) => t.name);
        expect(names).not.toContain('create_packing_item');
        expect(names).not.toContain('list_packing_bags');
        await expect(h.client.readResource({ uri: `trek://trips/${trip.id}/packing` })).rejects.toThrow();
        await expect(h.client.readResource({ uri: `trek://trips/${trip.id}/packing/bags` })).rejects.toThrow();
      });
    } finally {
      testDb.prepare('UPDATE addons SET enabled = 1 WHERE id = ?').run(ADDON_IDS.PACKING);
    }
  });
});

// ---------------------------------------------------------------------------
// trek://trips/{tripId}/packing resource (moved from the legacy registerResources)
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/packing', () => {
  it('returns packing items for a trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPackingItem(testDb, trip.id, { name: 'Passport' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/packing` });
      const items = parseResourceResult(result) as { name: string }[];
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Passport');
    });
  });

  it('hides another member\'s private items from the requesting user (#858)', async () => {
    const { user } = createUser(testDb);
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare('INSERT INTO packing_items (trip_id, name, checked, sort_order, is_private, owner_id) VALUES (?, ?, 0, 0, 1, ?)')
      .run(trip.id, 'Secret gift', owner.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/packing` });
      expect(parseResourceResult(result)).toEqual([]);
    });
  });

  it('returns the access-denied payload for a non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/packing` });
      expect(parseResourceResult(result)).toEqual({ error: 'Trip not found or access denied' });
    });
  });

  it('returns the access-denied payload for a malformed trip id', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://trips/not-a-number/packing' });
      expect(parseResourceResult(result)).toEqual({ error: 'Trip not found or access denied' });
    });
  });
});

// ---------------------------------------------------------------------------
// trek://trips/{tripId}/packing/bags resource (moved from the legacy registerResources)
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/packing/bags', () => {
  it('returns the bags with their members', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bagId = Number(testDb.prepare('INSERT INTO packing_bags (trip_id, name) VALUES (?, ?)').run(trip.id, 'Carry-On').lastInsertRowid);
    testDb.prepare('INSERT INTO packing_bag_members (bag_id, user_id) VALUES (?, ?)').run(bagId, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/packing/bags` });
      const bags = parseResourceResult(result) as { name: string; members: { user_id: number }[] }[];
      expect(bags).toHaveLength(1);
      expect(bags[0].name).toBe('Carry-On');
      expect(bags[0].members.map((m) => m.user_id)).toEqual([user.id]);
    });
  });

  it('returns the access-denied payload for a non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/packing/bags` });
      expect(parseResourceResult(result)).toEqual({ error: 'Trip not found or access denied' });
    });
  });
});

// ---------------------------------------------------------------------------
// Private items over MCP (#1976)
// ---------------------------------------------------------------------------

/**
 * A restricted packing item, changed through a tool, must reach only the people
 * who may see it.
 *
 * The REST and RPC surfaces have scoped this since #858 — they go through
 * emitToViewers, which hands the event to the owner and the recipients. The MCP
 * tools broadcast to the whole trip room instead, so asking an assistant to
 * tick off something on your own list pushed that row to every other member.
 *
 * It did not stop at the wire either: the client stores what arrives
 * (remoteEventHandler -> putPackingItem -> bulkPut) with no owner check, and the
 * offline read path returns every cached row for the trip. So the leaked item
 * stayed in the other member's IndexedDB and rendered whenever their next read
 * fell back to the cache.
 *
 * These cases pin the wire, which is where it has to be fixed: a room-wide call
 * still takes three arguments, so nothing about a shared item changes.
 */
describe('a restricted packing item over MCP', () => {
  const makePrivate = (itemId: number, ownerId: number) =>
    testDb.prepare('UPDATE packing_items SET is_private = 1, owner_id = ? WHERE id = ?').run(ownerId, itemId);

  it('is ticked off for its owner alone, not for the whole trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    makePrivate(item.id, user.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'toggle_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, checked: true },
      });
    });

    // The assertion that would have caught the leak: a fifth argument naming
    // the only user this may reach.
    expect(broadcastMock).toHaveBeenCalledWith(
      trip.id, 'packing:updated', expect.any(Object), undefined, user.id,
    );
    expect(broadcastMock).not.toHaveBeenCalledWith(trip.id, 'packing:updated', expect.any(Object));
  });

  it('is renamed for its owner alone', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    makePrivate(item.id, user.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, name: 'Insulin pens' },
      });
    });

    expect(broadcastMock).toHaveBeenCalledWith(
      trip.id, 'packing:updated', expect.any(Object), undefined, user.id,
    );
    expect(broadcastMock).not.toHaveBeenCalledWith(trip.id, 'packing:updated', expect.any(Object));
  });

  /*
   * The delete carries only an id, which looks harmless — but it names an id
   * the other members were never told about, and it removes a row from their
   * store that a leak had put there. Scoped the same way, from the row the
   * delete hands back.
   */
  it('is deleted for its owner alone', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    makePrivate(item.id, user.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'delete_packing_item',
        arguments: { tripId: trip.id, itemId: item.id },
      });
    });

    expect(broadcastMock).toHaveBeenCalledWith(
      trip.id, 'packing:deleted', expect.any(Object), undefined, user.id,
    );
    expect(broadcastMock).not.toHaveBeenCalledWith(trip.id, 'packing:deleted', expect.any(Object));
  });

  it('still tells the whole room about a shared one, unchanged', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'toggle_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, checked: true },
      });
    });

    // Three arguments exactly, which is what every other packing case asserts.
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:updated', expect.any(Object));
  });
});
