/**
 * Unit tests for MCP packing advanced tools:
 * reorder_packing_items, list_packing_bags, create_packing_bag, update_packing_bag,
 * delete_packing_bag, set_bag_members, get_packing_category_assignees,
 * set_packing_category_assignees, apply_packing_template, save_packing_template,
 * bulk_import_packing.
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
import { createUser, createAdmin, createTrip, createPackingItem } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';

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
// reorder_packing_items
// ---------------------------------------------------------------------------

describe('Tool: reorder_packing_items', () => {
  it('reorders packing items and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item1 = createPackingItem(testDb, trip.id, { name: 'Shirt' });
    const item2 = createPackingItem(testDb, trip.id, { name: 'Pants' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_packing_items',
        arguments: { tripId: trip.id, orderedIds: [item2.id, item1.id] },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:reordered', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_packing_items',
        arguments: { tripId: trip.id, orderedIds: [item.id] },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// list_packing_bags
// ---------------------------------------------------------------------------

describe('Tool: list_packing_bags', () => {
  it('returns empty array initially', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_packing_bags',
        arguments: { tripId: trip.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.bags).toEqual([]);
    });
  });

  it('returns bags that exist', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare('INSERT INTO packing_bags (trip_id, name, color) VALUES (?, ?, ?)').run(trip.id, 'Carry-on', '#ff0000');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_packing_bags',
        arguments: { tripId: trip.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.bags).toHaveLength(1);
      expect(data.bags[0].name).toBe('Carry-on');
    });
  });
});

// ---------------------------------------------------------------------------
// create_packing_bag
// ---------------------------------------------------------------------------

describe('Tool: create_packing_bag', () => {
  it('creates a bag and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_packing_bag',
        arguments: { tripId: trip.id, name: 'Checked bag', color: '#3b82f6' },
      });
      const data = parseToolResult(result) as any;
      expect(data.bag).toBeDefined();
      expect(data.bag.name).toBe('Checked bag');
      // hydrated to match listBags/schema, which always carry a members array
      expect(data.bag.members).toEqual([]);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:bag-created', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_packing_bag',
        arguments: { tripId: trip.id, name: 'Bag' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_packing_bag',
        arguments: { tripId: trip.id, name: 'Bag' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_packing_bag
// ---------------------------------------------------------------------------

describe('Tool: update_packing_bag', () => {
  it('updates bag name and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const r = testDb.prepare('INSERT INTO packing_bags (trip_id, name, color) VALUES (?, ?, ?)').run(trip.id, 'Old Name', '#aabbcc');
    const bag = testDb.prepare('SELECT * FROM packing_bags WHERE id = ?').get(r.lastInsertRowid) as any;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_packing_bag',
        arguments: { tripId: trip.id, bagId: bag.id, name: 'New Name' },
      });
      const data = parseToolResult(result) as any;
      expect(data.bag).toBeDefined();
      expect(data.bag.name).toBe('New Name');
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:bag-updated', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_packing_bag',
        arguments: { tripId: trip.id, bagId: 1, name: 'X' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_packing_bag
// ---------------------------------------------------------------------------

describe('Tool: delete_packing_bag', () => {
  it('deletes a bag and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const r = testDb.prepare('INSERT INTO packing_bags (trip_id, name, color) VALUES (?, ?, ?)').run(trip.id, 'Delete Me', '#000000');
    const bagId = r.lastInsertRowid as number;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_packing_bag',
        arguments: { tripId: trip.id, bagId },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:bag-deleted', expect.any(Object));
      expect(testDb.prepare('SELECT id FROM packing_bags WHERE id = ?').get(bagId)).toBeUndefined();
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_packing_bag',
        arguments: { tripId: trip.id, bagId: 1 },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// set_bag_members
// ---------------------------------------------------------------------------

describe('Tool: set_bag_members', () => {
  it('sets bag members and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const r = testDb.prepare('INSERT INTO packing_bags (trip_id, name, color) VALUES (?, ?, ?)').run(trip.id, 'My Bag', '#123456');
    const bagId = r.lastInsertRowid as number;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_bag_members',
        arguments: { tripId: trip.id, bagId, userIds: [user.id] },
      });
      const data = parseToolResult(result) as any;
      // Returns the hydrated members list (REST parity), not { success }.
      expect(data.members.map((m: any) => m.user_id)).toEqual([user.id]);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:bag-members-updated', expect.objectContaining({ members: expect.any(Array) }));
    });
  });

  it('clears bag members when passed empty array', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const r = testDb.prepare('INSERT INTO packing_bags (trip_id, name, color) VALUES (?, ?, ?)').run(trip.id, 'My Bag', '#123456');
    const bagId = r.lastInsertRowid as number;
    testDb.prepare('INSERT OR IGNORE INTO packing_bag_members (bag_id, user_id) VALUES (?, ?)').run(bagId, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_bag_members',
        arguments: { tripId: trip.id, bagId, userIds: [] },
      });
      const data = parseToolResult(result) as any;
      expect(data.members).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// get_packing_category_assignees
// ---------------------------------------------------------------------------

describe('Tool: get_packing_category_assignees', () => {
  it('returns empty object initially', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_packing_category_assignees',
        arguments: { tripId: trip.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignees).toEqual({});
    });
  });
});

// ---------------------------------------------------------------------------
// set_packing_category_assignees
// ---------------------------------------------------------------------------

describe('Tool: set_packing_category_assignees', () => {
  it('sets category assignees and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_packing_category_assignees',
        arguments: { tripId: trip.id, categoryName: 'Clothing', userIds: [user.id] },
      });
      const data = parseToolResult(result) as any;
      // Returns the hydrated assignees list (REST parity), not { success }.
      expect(data.assignees.map((a: any) => a.user_id)).toEqual([user.id]);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:assignees', expect.objectContaining({ category: 'Clothing', assignees: expect.any(Array) }));
    });
  });

  it('clears assignees when passed empty array', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    testDb.prepare('INSERT INTO packing_category_assignees (trip_id, category_name, user_id) VALUES (?, ?, ?)').run(trip.id, 'Clothing', user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_packing_category_assignees',
        arguments: { tripId: trip.id, categoryName: 'Clothing', userIds: [] },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignees).toEqual([]);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_packing_category_assignees',
        arguments: { tripId: trip.id, categoryName: 'Electronics', userIds: [] },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// apply_packing_template
// ---------------------------------------------------------------------------

describe('Tool: apply_packing_template', () => {
  it('returns error for non-existent template', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'apply_packing_template',
        arguments: { tripId: trip.id, templateId: 99999 },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// save_packing_template
// ---------------------------------------------------------------------------

describe('Tool: save_packing_template', () => {
  it('saves the current packing list as a template for an admin', async () => {
    const { user } = createAdmin(testDb);
    const trip = createTrip(testDb, user.id);
    createPackingItem(testDb, trip.id, { name: 'Toothbrush', category: 'Toiletries' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'save_packing_template',
        arguments: { tripId: trip.id, templateName: 'Weekend Trip' },
      });
      const data = parseToolResult(result) as any;
      // Save now returns the new template (with its id) instead of a bare success flag.
      expect(data.template).toBeDefined();
      expect(Number.isInteger(data.template.id)).toBe(true);
      expect(data.template.name).toBe('Weekend Trip');
    });
  });

  it('returns an error when the packing list is empty', async () => {
    const { user } = createAdmin(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'save_packing_template',
        arguments: { tripId: trip.id, templateName: 'Empty' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('denies a non-admin editor (parity with the REST admin gate)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createPackingItem(testDb, trip.id, { name: 'Toothbrush', category: 'Toiletries' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'save_packing_template',
        arguments: { tripId: trip.id, templateName: 'Weekend Trip' },
      });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toBe('Admin access required');
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'save_packing_template',
        arguments: { tripId: trip.id, templateName: 'X' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// list_packing_templates / delete_packing_template
// ---------------------------------------------------------------------------

describe('Tool: list_packing_templates', () => {
  it('lists saved templates with their ids and item counts', async () => {
    const { user } = createAdmin(testDb);
    const trip = createTrip(testDb, user.id);
    createPackingItem(testDb, trip.id, { name: 'Toothbrush', category: 'Toiletries' });
    await withHarness(user.id, async (h) => {
      const saved = parseToolResult(await h.client.callTool({
        name: 'save_packing_template',
        arguments: { tripId: trip.id, templateName: 'Beach' },
      })) as any;

      const listed = parseToolResult(await h.client.callTool({
        name: 'list_packing_templates',
        arguments: { tripId: trip.id },
      })) as any;
      expect(listed.templates.some((t: any) => t.id === saved.template.id && t.name === 'Beach')).toBe(true);
    });
  });

  it('is available to a non-admin trip member (read-only)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'list_packing_templates',
        arguments: { tripId: trip.id },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.templates)).toBe(true);
    });
  });
});

describe('Tool: delete_packing_template', () => {
  it('removes a template for an admin', async () => {
    const { user } = createAdmin(testDb);
    const trip = createTrip(testDb, user.id);
    createPackingItem(testDb, trip.id, { name: 'Toothbrush', category: 'Toiletries' });
    await withHarness(user.id, async (h) => {
      const saved = parseToolResult(await h.client.callTool({
        name: 'save_packing_template',
        arguments: { tripId: trip.id, templateName: 'Ski' },
      })) as any;
      const id = saved.template.id;

      const deleted = parseToolResult(await h.client.callTool({
        name: 'delete_packing_template',
        arguments: { templateId: id },
      })) as any;
      expect(deleted.success).toBe(true);
      const remaining = testDb.prepare('SELECT count(*) as cnt FROM packing_templates WHERE id = ?').get(id) as any;
      expect(remaining.cnt).toBe(0);
    });
  });

  it('denies a non-admin (parity with the REST admin gate)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_packing_template',
        arguments: { templateId: 1 },
      });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toBe('Admin access required');
    });
  });

  it('returns an error for a missing template', async () => {
    const { user } = createAdmin(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_packing_template',
        arguments: { templateId: 99999 },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// bulk_import_packing
// ---------------------------------------------------------------------------

describe('Tool: bulk_import_packing', () => {
  it('imports multiple packing items, returns them, and broadcasts per item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const items = [
      { name: 'Passport', category: 'Documents' },
      { name: 'Charger', category: 'Electronics' },
      { name: 'Sunscreen', category: 'Toiletries' },
    ];
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'bulk_import_packing',
        arguments: { tripId: trip.id, items },
      });
      const data = parseToolResult(result) as any;
      // New contract: returns the created items (REST parity), broadcasts packing:created per item.
      expect(data.count).toBe(items.length);
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items).toHaveLength(items.length);
      expect(data.items[0].name).toBe('Passport');
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:created', expect.objectContaining({ item: expect.any(Object) }));
      expect(broadcastMock).toHaveBeenCalledTimes(items.length);
    });
  });

  it('honors the widened fields (bag, weight_grams, checked)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'bulk_import_packing',
        arguments: {
          tripId: trip.id,
          items: [{ name: 'Tent', category: 'Camping', bag: 'Backpack', weight_grams: 2500, checked: true }],
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.count).toBe(1);
      const item = data.items[0];
      expect(item.weight_grams).toBe(2500);
      expect(item.checked).toBe(1);
      expect(item.bag_id).toBeTruthy(); // "Backpack" bag was created and assigned
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'bulk_import_packing',
        arguments: { tripId: trip.id, items: [{ name: 'Item' }] },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'bulk_import_packing',
        arguments: { tripId: trip.id, items: [{ name: 'Item' }] },
      });
      expect(result.isError).toBe(true);
    });
  });
});
