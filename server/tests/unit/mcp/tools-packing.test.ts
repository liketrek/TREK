/**
 * Unit tests for the packing MCP surface (PackingMcp, DI-discovered):
 * create_packing_item, update_packing_item, toggle_packing_item,
 * delete_packing_item, set_packing_item_sharing, plus the two bag fields that
 * drive the fill bar, the registration-time scope/addon gating and the
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
import { createUser, createTrip, createPackingItem, addTripMember } from '../../helpers/factories';
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

/** The text of a failed call, including the SDK's own schema-validation refusals
 *  (which come back as an error result, not a rejection). */
const errorText = (result: unknown) =>
  ((result as { content?: { text?: string }[] }).content ?? []).map((c) => c.text ?? '').join(' ');

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
// create_packing_item: the sharing tiers and the pre-checked flag (#858)
//
// A tool-made item used to land on the Common list whatever was asked for:
// there was no way to say "this is mine" or "I'm bringing it for these two",
// which is the whole three-tier model the REST route has taken since #858.
// ---------------------------------------------------------------------------

const itemRow = (id: number) =>
  testDb.prepare('SELECT * FROM packing_items WHERE id = ?').get(id) as
    { id: number; checked: number; is_private: number; owner_id: number | null; bag_id: number | null; quantity: number; weight_grams: number | null };

/** The id of the item a create call just made, typed rather than cast wide open. */
const createdItemId = (result: Parameters<typeof parseToolResult>[0]) =>
  (parseToolResult(result) as { item: { id: number } }).item.id;

const recipientIds = (itemId: number) =>
  (testDb.prepare('SELECT user_id FROM packing_item_recipients WHERE item_id = ? ORDER BY user_id').all(itemId) as { user_id: number }[])
    .map((r) => r.user_id);

describe('Tool: create_packing_item sharing', () => {
  it('puts a personal item on the caller\'s own list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_packing_item',
        arguments: { tripId: trip.id, name: 'Insulin pens', visibility: 'personal' },
      });
      const row = itemRow(createdItemId(result));
      expect(row.is_private).toBe(1);
      expect(row.owner_id).toBe(user.id);
    });
  });

  it('records the recipients of a shared item and drops ids off the trip roster', async () => {
    const { user } = createUser(testDb);
    const { user: mate } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, mate.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_packing_item',
        arguments: { tripId: trip.id, name: 'Sunscreen', visibility: 'shared', recipient_ids: [mate.id, stranger.id] },
      });
      const itemId = createdItemId(result);
      expect(itemRow(itemId).is_private).toBe(1);
      expect(recipientIds(itemId)).toEqual([mate.id]);
    });
  });

  it('honours the legacy is_private flag', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_packing_item',
        arguments: { tripId: trip.id, name: 'Gift', is_private: true },
      });
      expect(itemRow(createdItemId(result)).is_private).toBe(1);
    });
  });

  it('creates an already-checked item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_packing_item',
        arguments: { tripId: trip.id, name: 'Charger', checked: true },
      });
      expect(itemRow(createdItemId(result)).checked).toBe(1);
    });
  });

  it('keeps a personal item off the rest of the room', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'create_packing_item',
        arguments: { tripId: trip.id, name: 'Insulin pens', visibility: 'personal' },
      });
    });
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:created', expect.any(Object), undefined, user.id);
    expect(broadcastMock).not.toHaveBeenCalledWith(trip.id, 'packing:created', expect.any(Object));
  });

  it('refuses a visibility tier that does not exist', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_packing_item',
        arguments: { tripId: trip.id, name: 'X', visibility: 'secret' },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('visibility');
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
// update_packing_item: bag, quantity, weight and privacy
//
// The tool could only rename and recategorise, so an assistant could not put an
// item in a bag at all once it existed: bag assignment was reachable only at
// bulk_import_packing time, by bag name.
// ---------------------------------------------------------------------------

describe('Tool: update_packing_item bag, quantity, weight, privacy', () => {
  const makeBag = (tripId: number, name = 'Carry-On') =>
    Number(testDb.prepare('INSERT INTO packing_bags (trip_id, name) VALUES (?, ?)').run(tripId, name).lastInsertRowid);

  it('moves an item into a bag', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    const bagId = makeBag(trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, bag_id: bagId },
      });
      expect(result.isError).toBeFalsy();
      expect(itemRow(item.id).bag_id).toBe(bagId);
    });
  });

  it('takes an item out of its bag with an explicit null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    const bagId = makeBag(trip.id);
    testDb.prepare('UPDATE packing_items SET bag_id = ? WHERE id = ?').run(bagId, item.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, bag_id: null },
      });
      expect(itemRow(item.id).bag_id).toBeNull();
    });
  });

  it('sets the quantity', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, quantity: 3 },
      });
      expect(itemRow(item.id).quantity).toBe(3);
    });
  });

  it('sets and clears the weight', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, weight_grams: 850 },
      });
      expect(itemRow(item.id).weight_grams).toBe(850);

      await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, weight_grams: null },
      });
      expect(itemRow(item.id).weight_grams).toBeNull();
    });
  });

  it('leaves the bag alone when the key is omitted', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    const bagId = makeBag(trip.id);
    testDb.prepare('UPDATE packing_items SET bag_id = ? WHERE id = ?').run(bagId, item.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, name: 'Renamed' },
      });
      expect(itemRow(item.id).bag_id).toBe(bagId);
    });
  });

  it('takes a common item onto the caller\'s own list, and off everyone else\'s screen', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, is_private: true },
      });
    });
    const row = itemRow(item.id);
    expect(row.is_private).toBe(1);
    // An unowned item is claimed by whoever privatizes it, or the visibility
    // filter would have nobody to match.
    expect(row.owner_id).toBe(user.id);
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:deleted', expect.any(Object));
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:created', expect.any(Object), undefined, user.id);
  });

  it('hands a private item back to the room when it goes common again', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    testDb.prepare('UPDATE packing_items SET is_private = 1, owner_id = ? WHERE id = ?').run(user.id, item.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, is_private: false },
      });
    });
    expect(itemRow(item.id).is_private).toBe(0);
    // Created first: the members who never had the row cannot apply an update to it.
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:created', expect.any(Object));
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:updated', expect.any(Object));
  });

  it('refuses a bag id that is not a number', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_packing_item',
        arguments: { tripId: trip.id, itemId: item.id, bag_id: 'carry-on' },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('bag_id');
      expect(itemRow(item.id).bag_id).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// set_packing_item_sharing (#858): the tool the surface never had
// ---------------------------------------------------------------------------

describe('Tool: set_packing_item_sharing', () => {
  it('moves a common item onto the caller\'s own list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_packing_item_sharing',
        arguments: { tripId: trip.id, itemId: item.id, visibility: 'personal' },
      });
      expect(result.isError).toBeFalsy();
    });
    const row = itemRow(item.id);
    expect(row.is_private).toBe(1);
    expect(row.owner_id).toBe(user.id);
  });

  it('shares an item with named members and drops ids off the trip roster', async () => {
    const { user } = createUser(testDb);
    const { user: mate } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, mate.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'set_packing_item_sharing',
        arguments: { tripId: trip.id, itemId: item.id, visibility: 'shared', recipient_ids: [mate.id, stranger.id] },
      });
    });
    expect(itemRow(item.id).is_private).toBe(1);
    expect(recipientIds(item.id)).toEqual([mate.id]);
  });

  it('returns an item to the common list and forgets its recipients', async () => {
    const { user } = createUser(testDb);
    const { user: mate } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, mate.id);
    const item = createPackingItem(testDb, trip.id);
    testDb.prepare('UPDATE packing_items SET is_private = 1, owner_id = ? WHERE id = ?').run(user.id, item.id);
    testDb.prepare('INSERT INTO packing_item_recipients (item_id, user_id) VALUES (?, ?)').run(item.id, mate.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'set_packing_item_sharing',
        arguments: { tripId: trip.id, itemId: item.id, visibility: 'common' },
      });
    });
    expect(itemRow(item.id).is_private).toBe(0);
    expect(recipientIds(item.id)).toEqual([]);
  });

  it('rebuilds the room\'s view: gone for everyone, back for the people who may see it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'set_packing_item_sharing',
        arguments: { tripId: trip.id, itemId: item.id, visibility: 'personal' },
      });
    });
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:deleted', expect.any(Object));
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'packing:created', expect.any(Object), undefined, user.id);
  });

  it('lets only the owner change sharing', async () => {
    const { user } = createUser(testDb);
    const { user: mate } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, mate.id);
    const item = createPackingItem(testDb, trip.id);
    testDb.prepare('UPDATE packing_items SET owner_id = ? WHERE id = ?').run(mate.id, item.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_packing_item_sharing',
        arguments: { tripId: trip.id, itemId: item.id, visibility: 'personal' },
      });
      expect(result.isError).toBe(true);
    });
    expect(itemRow(item.id).is_private).toBe(0);
  });

  it('returns error for item not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_packing_item_sharing',
        arguments: { tripId: trip.id, itemId: 99999, visibility: 'personal' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_packing_item_sharing',
        arguments: { tripId: trip.id, itemId: item.id, visibility: 'personal' },
      });
      expect(result.isError).toBe(true);
    });
    expect(itemRow(item.id).is_private).toBe(0);
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_packing_item_sharing',
        arguments: { tripId: trip.id, itemId: item.id, visibility: 'personal' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('refuses a visibility tier that does not exist', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createPackingItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_packing_item_sharing',
        arguments: { tripId: trip.id, itemId: item.id, visibility: 'nobody' },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('visibility');
      expect(itemRow(item.id).is_private).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// update_packing_bag: weight limit and owner (the values behind the fill bar)
// ---------------------------------------------------------------------------

describe('Tool: update_packing_bag limit and owner', () => {
  const bagRow = (id: number) =>
    testDb.prepare('SELECT * FROM packing_bags WHERE id = ?').get(id) as
      { id: number; name: string; weight_limit_grams: number | null; user_id: number | null };

  const makeBag = (tripId: number) =>
    Number(testDb.prepare('INSERT INTO packing_bags (trip_id, name) VALUES (?, ?)').run(tripId, 'Carry-On').lastInsertRowid);

  it('sets a weight limit', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bagId = makeBag(trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_packing_bag',
        arguments: { tripId: trip.id, bagId, weight_limit_grams: 8000 },
      });
      expect(result.isError).toBeFalsy();
      expect(bagRow(bagId).weight_limit_grams).toBe(8000);
    });
  });

  it('lifts the limit with an explicit null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bagId = makeBag(trip.id);
    testDb.prepare('UPDATE packing_bags SET weight_limit_grams = 8000 WHERE id = ?').run(bagId);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_packing_bag',
        arguments: { tripId: trip.id, bagId, weight_limit_grams: null },
      });
      expect(bagRow(bagId).weight_limit_grams).toBeNull();
    });
  });

  it('leaves the limit alone when the key is omitted', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bagId = makeBag(trip.id);
    testDb.prepare('UPDATE packing_bags SET weight_limit_grams = 8000 WHERE id = ?').run(bagId);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_packing_bag', arguments: { tripId: trip.id, bagId, name: 'Backpack' } });
      const row = bagRow(bagId);
      expect(row.name).toBe('Backpack');
      expect(row.weight_limit_grams).toBe(8000);
    });
  });

  it('assigns the bag to a trip member', async () => {
    const { user } = createUser(testDb);
    const { user: mate } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, mate.id);
    const bagId = makeBag(trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_packing_bag', arguments: { tripId: trip.id, bagId, user_id: mate.id } });
      expect(bagRow(bagId).user_id).toBe(mate.id);
    });
  });

  it('leaves the bag unassigned for an id off the trip roster', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bagId = makeBag(trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_packing_bag', arguments: { tripId: trip.id, bagId, user_id: stranger.id } });
      expect(bagRow(bagId).user_id).toBeNull();
    });
  });

  it('refuses a weight limit that is not a number', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const bagId = makeBag(trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_packing_bag',
        arguments: { tripId: trip.id, bagId, weight_limit_grams: '8kg' },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('weight_limit_grams');
      expect(bagRow(bagId).weight_limit_grams).toBeNull();
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
    'set_packing_item_sharing',
  ];

  async function listToolNames(userId: number, scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ userId, withResources: false, scopes });
    try {
      return (await h.client.listTools()).tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('registers all eighteen tools with null scopes (full access)', async () => {
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
