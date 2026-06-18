/**
 * Unit tests for MCP budget tools: create_budget_item, update_budget_item, delete_budget_item.
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
import { createUser, createTrip, createBudgetItem, addTripMember } from '../../helpers/factories';
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
// create_budget_item
// ---------------------------------------------------------------------------

describe('Tool: create_budget_item', () => {
  it('creates a budget item with all fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'Hotel Paris', category: 'Accommodation', total_price: 500, note: 'Prepaid' },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('Hotel Paris');
      expect(data.item.category).toBe('Accommodation');
      expect(data.item.total_price).toBe(500);
      expect(data.item.note).toBe('Prepaid');
    });
  });

  it('defaults category to "Other" when not specified', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'Misc', total_price: 10 },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.category).toBe('other');
    });
  });

  it('broadcasts budget:created event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_budget_item', arguments: { tripId: trip.id, name: 'Taxi', total_price: 25 } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'budget:created', expect.any(Object));
    });
  });

  // Regression for #1244: a naive create must seed members so the client save-gate
  // (participants.size > 0) passes — the entry must be saveable, not member-less.
  it('defaults members to the trip owner when member_ids omitted (solo trip)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'Dinner', total_price: 40 },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.members.map((m: any) => m.user_id)).toEqual([user.id]);
      expect(data.item.persons).toBe(1);
      // saveable invariant: client requires participants.size > 0
      expect(data.item.members.length).toBeGreaterThan(0);
    });
  });

  it('defaults members to all trip members when member_ids omitted (multi-member)', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, member.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'Group taxi', total_price: 60 },
      });
      const data = parseToolResult(result) as any;
      const ids = data.item.members.map((m: any) => m.user_id).sort();
      expect(ids).toEqual([user.id, member.id].sort());
      expect(data.item.persons).toBe(2);
    });
  });

  it('respects an explicit member_ids subset', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, member.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'My snack', total_price: 5, member_ids: [user.id] },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.members.map((m: any) => m.user_id)).toEqual([user.id]);
    });
  });

  it('treats an explicit empty member_ids as a planning-only entry (no split)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'Estimate', total_price: 100, member_ids: [] },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.members).toEqual([]);
    });
  });

  it('round-trips currency, expense_date, and payers', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: {
          tripId: trip.id, name: 'Museum', total_price: 30, currency: 'EUR',
          expense_date: '2026-07-01', payers: [{ user_id: user.id, amount: 30 }],
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.currency).toBe('EUR');
      expect(data.item.expense_date).toBe('2026-07-01');
      expect(data.item.payers.map((p: any) => p.user_id)).toEqual([user.id]);
      // total_price derives from payer sum
      expect(data.item.total_price).toBe(30);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_budget_item', arguments: { tripId: trip.id, name: 'Hack', total_price: 0 } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_budget_item', arguments: { tripId: trip.id, name: 'X', total_price: 0 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_budget_item
// ---------------------------------------------------------------------------

describe('Tool: update_budget_item', () => {
  it('updates budget item fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createBudgetItem(testDb, trip.id, { name: 'Old', category: 'Food', total_price: 50 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: { tripId: trip.id, itemId: item.id, name: 'New Name', total_price: 75 },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('New Name');
      expect(data.item.total_price).toBe(75);
      expect(data.item.category).toBe('Food'); // preserved
    });
  });

  it('broadcasts budget:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createBudgetItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_budget_item', arguments: { tripId: trip.id, itemId: item.id, name: 'Updated' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'budget:updated', expect.any(Object));
    });
  });

  it('returns error for item not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_budget_item', arguments: { tripId: trip.id, itemId: 99999, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const item = createBudgetItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_budget_item', arguments: { tripId: trip.id, itemId: item.id, name: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_budget_item
// ---------------------------------------------------------------------------

describe('Tool: delete_budget_item', () => {
  it('deletes an existing budget item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createBudgetItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_budget_item', arguments: { tripId: trip.id, itemId: item.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(testDb.prepare('SELECT id FROM budget_items WHERE id = ?').get(item.id)).toBeUndefined();
    });
  });

  it('broadcasts budget:deleted event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createBudgetItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_budget_item', arguments: { tripId: trip.id, itemId: item.id } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'budget:deleted', expect.any(Object));
    });
  });

  it('returns error for item not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_budget_item', arguments: { tripId: trip.id, itemId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const item = createBudgetItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_budget_item', arguments: { tripId: trip.id, itemId: item.id } });
      expect(result.isError).toBe(true);
    });
  });
});
