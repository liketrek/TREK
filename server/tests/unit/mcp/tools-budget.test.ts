/**
 * Unit tests for MCP budget tools: create_budget_item, update_budget_item,
 * delete_budget_item, plus the settlement cases that turn on the currency the
 * payment was made in (the rest of the settlement surface lives in
 * tools-budget-advanced.test.ts).
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
import { createUser, createTrip, createBudgetItem, createPlace, addTripMember } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
  // Freezing the FX rate of a foreign currency is a real fetch to
  // api.frankfurter.dev with a 10 s abort. Fail closed by default; the cases
  // that assert a frozen rate install their own rate stub.
  vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
});

afterAll(() => {
  vi.unstubAllGlobals();
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

function errorText(result: Awaited<ReturnType<McpHarness['client']['callTool']>>): string {
  const text = (result.content as { type: string; text?: string }[]).find((c) => c.type === 'text');
  return text?.text ?? '';
}

function tripWithTwo() {
  const { user } = createUser(testDb);
  const { user: other } = createUser(testDb);
  const trip = createTrip(testDb, user.id);
  addTripMember(testDb, trip.id, other.id);
  return { user, other, trip };
}

function memberRows(itemId: number) {
  return testDb.prepare('SELECT user_id, amount FROM budget_item_members WHERE budget_item_id = ? ORDER BY user_id')
    .all(itemId) as { user_id: number; amount: number | null }[];
}

function itemRow(itemId: number) {
  return testDb.prepare('SELECT total_price, currency, exchange_rate, persons, expense_date, place_id FROM budget_items WHERE id = ?')
    .get(itemId) as {
      total_price: number; currency: string | null; exchange_rate: number | null;
      persons: number | null; expense_date: string | null; place_id: number | null;
    };
}

function itemCount(tripId: number): number {
  return (testDb.prepare('SELECT COUNT(*) AS count FROM budget_items WHERE trip_id = ?').get(tripId) as { count: number }).count;
}

function settlementRow(id: number) {
  return testDb.prepare('SELECT amount, currency, exchange_rate FROM budget_settlements WHERE id = ?')
    .get(id) as { amount: number; currency: string | null; exchange_rate: number | null };
}

// budget_settlements is not one of the tables the reset clears, and trip ids are
// reused, so a count is only ever compared against the count taken in the same test.
function settlementCount(tripId: number): number {
  return (testDb.prepare('SELECT COUNT(*) AS count FROM budget_settlements WHERE trip_id = ?').get(tripId) as { count: number }).count;
}

/** Frankfurter's shape: one entry per quote, the base's own rate omitted. */
function stubRates(rates: Record<string, number>): void {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    text: async () => JSON.stringify(
      Object.entries(rates).map(([quote, rate]) => ({ date: '2026-08-28', base: 'EUR', quote, rate })),
    ),
  })));
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

// ---------------------------------------------------------------------------
// Resource: trek://trips/{tripId}/budget (moved from the legacy resources.ts
// registrar to the DI-discovered BudgetMcp — attached via the nest-mcp registry)
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/budget', () => {
  it('returns budget items for a trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createBudgetItem(testDb, trip.id, { name: 'Hotel', category: 'Accommodation', total_price: 200 });

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/budget` });
      const items = parseResourceResult(result) as { name: string }[];
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Hotel');
    });
  });

  it('returns access denied for unauthorized trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/budget` });
      const data = parseResourceResult(result) as { error?: string };
      expect(data.error).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Uneven splits: members carries what each participant owes, the way the REST
// body has since the Costs rework. member_ids alone always meant an equal share.
// ---------------------------------------------------------------------------

describe('Tool: create_budget_item (uneven split)', () => {
  it('persists what each member owes', async () => {
    const { user, other, trip } = tripWithTwo();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: {
          tripId: trip.id, name: 'Dinner', total_price: 100,
          members: [{ user_id: user.id, amount: 70 }, { user_id: other.id, amount: 30 }],
        },
      });
      const data = parseToolResult(result) as any;
      expect(memberRows(data.item.id)).toEqual([
        { user_id: user.id, amount: 70 },
        { user_id: other.id, amount: 30 },
      ]);
      expect(itemRow(data.item.id).persons).toBe(2);
    });
  });

  it('refuses a split that does not add up to the total', async () => {
    const { user, other, trip } = tripWithTwo();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: {
          tripId: trip.id, name: 'Dinner', total_price: 100,
          members: [{ user_id: user.id, amount: 60 }, { user_id: other.id, amount: 30 }],
        },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('does not add up');
      expect(itemCount(trip.id)).toBe(0);
    });
  });

  it('measures the split against the payer sum, not the stated total', async () => {
    const { user, other, trip } = tripWithTwo();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: {
          tripId: trip.id, name: 'Groceries', total_price: 100,
          payers: [{ user_id: user.id, amount: 90 }],
          members: [{ user_id: user.id, amount: 60 }, { user_id: other.id, amount: 30 }],
        },
      });
      const data = parseToolResult(result) as any;
      expect(itemRow(data.item.id).total_price).toBe(90);
      expect(memberRows(data.item.id).map(m => m.amount)).toEqual([60, 30]);
    });
  });

  it('refuses a split that matches the stated total but not what the payers paid', async () => {
    const { user, other, trip } = tripWithTwo();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: {
          tripId: trip.id, name: 'Groceries', total_price: 100,
          payers: [{ user_id: user.id, amount: 90 }],
          members: [{ user_id: user.id, amount: 70 }, { user_id: other.id, amount: 30 }],
        },
      });
      expect(result.isError).toBe(true);
      expect(itemCount(trip.id)).toBe(0);
    });
  });

  it('refuses a member who is not on the trip', async () => {
    const { user, trip } = tripWithTwo();
    const { user: stranger } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: {
          tripId: trip.id, name: 'Dinner', total_price: 100,
          members: [{ user_id: user.id, amount: 50 }, { user_id: stranger.id, amount: 50 }],
        },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('not on this trip');
      expect(itemCount(trip.id)).toBe(0);
    });
  });

  it('refuses members alongside member_ids', async () => {
    const { user, other, trip } = tripWithTwo();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: {
          tripId: trip.id, name: 'Dinner', total_price: 100,
          member_ids: [user.id, other.id],
          members: [{ user_id: user.id, amount: 50 }, { user_id: other.id, amount: 50 }],
        },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('not both');
      expect(itemCount(trip.id)).toBe(0);
    });
  });
});

describe('Tool: update_budget_item (uneven split)', () => {
  function itemWithEqualSplit(tripId: number, userIds: number[]) {
    const item = createBudgetItem(testDb, tripId, { name: 'Dinner', total_price: 100 });
    const insert = testDb.prepare('INSERT INTO budget_item_members (budget_item_id, user_id, paid, amount) VALUES (?, ?, 0, NULL)');
    for (const id of userIds) insert.run(item.id, id);
    testDb.prepare('UPDATE budget_items SET persons = ? WHERE id = ?').run(userIds.length, item.id);
    return item;
  }

  it('replaces the equal split with per-member amounts', async () => {
    const { user, other, trip } = tripWithTwo();
    const item = itemWithEqualSplit(trip.id, [user.id, other.id]);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: {
          tripId: trip.id, itemId: item.id,
          members: [{ user_id: user.id, amount: 40 }, { user_id: other.id, amount: 60 }],
        },
      });
      expect(result.isError).toBeFalsy();
      expect(memberRows(item.id)).toEqual([
        { user_id: user.id, amount: 40 },
        { user_id: other.id, amount: 60 },
      ]);
      expect(itemRow(item.id).persons).toBe(2);
    });
  });

  it('measures the split against the stored total when the call does not restate it', async () => {
    const { user, other, trip } = tripWithTwo();
    const item = itemWithEqualSplit(trip.id, [user.id, other.id]);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: {
          tripId: trip.id, itemId: item.id,
          members: [{ user_id: user.id, amount: 40 }, { user_id: other.id, amount: 50 }],
        },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('100.00');
      expect(memberRows(item.id)).toEqual([
        { user_id: user.id, amount: null },
        { user_id: other.id, amount: null },
      ]);
    });
  });

  it('refuses the same member twice', async () => {
    const { user, other, trip } = tripWithTwo();
    const item = itemWithEqualSplit(trip.id, [user.id, other.id]);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: {
          tripId: trip.id, itemId: item.id,
          members: [{ user_id: user.id, amount: 50 }, { user_id: user.id, amount: 50 }],
        },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('twice');
      expect(memberRows(item.id).map(m => m.amount)).toEqual([null, null]);
    });
  });

  it('refuses members alongside member_ids', async () => {
    const { user, other, trip } = tripWithTwo();
    const item = itemWithEqualSplit(trip.id, [user.id, other.id]);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: {
          tripId: trip.id, itemId: item.id,
          member_ids: [user.id],
          members: [{ user_id: user.id, amount: 100 }],
        },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('not both');
      expect(memberRows(item.id)).toHaveLength(2);
    });
  });

  it('reports a missing item before it looks at the split', async () => {
    const { user, trip } = tripWithTwo();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: { tripId: trip.id, itemId: 99999, members: [{ user_id: user.id, amount: 10 }] },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toBe('Budget item not found.');
    });
  });
});

// ---------------------------------------------------------------------------
// Currency and date on an existing expense
// ---------------------------------------------------------------------------

describe('Tool: update_budget_item (currency)', () => {
  it('changes the currency and freezes the rate at entry time', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createBudgetItem(testDb, trip.id, { total_price: 100 });
    stubRates({ USD: 1.1 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: { tripId: trip.id, itemId: item.id, currency: 'USD' },
      });
      expect(result.isError).toBeFalsy();
      const row = itemRow(item.id);
      expect(row.currency).toBe('USD');
      expect(row.exchange_rate).toBe(1.1);
    });
  });

  it('clears the currency back to the trip currency', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createBudgetItem(testDb, trip.id, { total_price: 100 });
    testDb.prepare('UPDATE budget_items SET currency = ?, exchange_rate = ? WHERE id = ?').run('USD', 1.1, item.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: { tripId: trip.id, itemId: item.id, currency: null },
      });
      expect(result.isError).toBeFalsy();
      expect(itemRow(item.id).currency).toBeNull();
    });
  });

  it('refuses a currency that is not a code', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createBudgetItem(testDb, trip.id, { total_price: 100 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: { tripId: trip.id, itemId: item.id, currency: 'United States Dollars' },
      });
      expect(result.isError).toBe(true);
      expect(itemRow(item.id).currency).toBeNull();
    });
  });
});

describe('Tool: update_budget_item (expense date)', () => {
  it('moves the expense to another date', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createBudgetItem(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: { tripId: trip.id, itemId: item.id, expense_date: '2026-09-14' },
      });
      expect(result.isError).toBeFalsy();
      expect(itemRow(item.id).expense_date).toBe('2026-09-14');
    });
  });

  it('clears the expense date', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createBudgetItem(testDb, trip.id);
    testDb.prepare('UPDATE budget_items SET expense_date = ? WHERE id = ?').run('2026-09-14', item.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: { tripId: trip.id, itemId: item.id, expense_date: null },
      });
      expect(result.isError).toBeFalsy();
      expect(itemRow(item.id).expense_date).toBeNull();
    });
  });

  it('refuses a date that is not a string', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const item = createBudgetItem(testDb, trip.id);
    testDb.prepare('UPDATE budget_items SET expense_date = ? WHERE id = ?').run('2026-09-14', item.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: { tripId: trip.id, itemId: item.id, expense_date: 20260915 },
      });
      expect(result.isError).toBe(true);
      expect(itemRow(item.id).expense_date).toBe('2026-09-14');
    });
  });
});

// ---------------------------------------------------------------------------
// Expenses linked to a place (#1298), the place-side twin of reservation_id
// ---------------------------------------------------------------------------

describe('Budget tools: place link', () => {
  it('create_budget_item links the expense to a place on the trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'Louvre tickets', total_price: 34, place_id: place.id },
      });
      const data = parseToolResult(result) as any;
      expect(itemRow(data.item.id).place_id).toBe(place.id);
    });
  });

  it('create_budget_item refuses a place from another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const elsewhere = createTrip(testDb, user.id);
    const place = createPlace(testDb, elsewhere.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'Tickets', total_price: 34, place_id: place.id },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toBe('place_id does not belong to this trip.');
      expect(itemCount(trip.id)).toBe(0);
    });
  });

  it('create_budget_item_with_members links the expense to a place on the trip', async () => {
    const { user, other, trip } = tripWithTwo();
    const place = createPlace(testDb, trip.id, { name: 'Louvre' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item_with_members',
        arguments: { tripId: trip.id, name: 'Louvre tickets', total_price: 68, userIds: [user.id, other.id], place_id: place.id },
      });
      const data = parseToolResult(result) as any;
      expect(itemRow(data.item.id).place_id).toBe(place.id);
    });
  });

  it('create_budget_item_with_members refuses a place from another trip', async () => {
    const { user, trip } = tripWithTwo();
    const elsewhere = createTrip(testDb, user.id);
    const place = createPlace(testDb, elsewhere.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item_with_members',
        arguments: { tripId: trip.id, name: 'Tickets', total_price: 68, place_id: place.id },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toBe('place_id does not belong to this trip.');
      expect(itemCount(trip.id)).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Settle-up payments made in another currency (the #1445 freeze)
// ---------------------------------------------------------------------------

describe('Tool: create_settlement (currency)', () => {
  it('records the payment in the currency it was made in and freezes its rate', async () => {
    const { user, other, trip } = tripWithTwo();
    stubRates({ USD: 1.1 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_settlement',
        arguments: { tripId: trip.id, from_user_id: other.id, to_user_id: user.id, amount: 20, currency: 'USD' },
      });
      const data = parseToolResult(result) as any;
      const row = settlementRow(data.settlement.id);
      expect(row.currency).toBe('USD');
      expect(row.exchange_rate).toBe(1.1);
      expect(row.amount).toBe(20);
    });
  });

  it('books the payment in the trip currency when none is given', async () => {
    const { user, other, trip } = tripWithTwo();
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_settlement',
        arguments: { tripId: trip.id, from_user_id: other.id, to_user_id: user.id, amount: 20 },
      });
      const data = parseToolResult(result) as any;
      const row = settlementRow(data.settlement.id);
      expect(row.currency).toBeNull();
      expect(row.exchange_rate).toBe(1);
    });
  });

  it('refuses a currency that is not a code', async () => {
    const { user, other, trip } = tripWithTwo();
    const before = settlementCount(trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_settlement',
        arguments: { tripId: trip.id, from_user_id: other.id, to_user_id: user.id, amount: 20, currency: 'United States Dollars' },
      });
      expect(result.isError).toBe(true);
      expect(settlementCount(trip.id)).toBe(before);
    });
  });
});

describe('Tool: update_settlement (currency)', () => {
  it('changes the currency the payment was made in and freezes its rate', async () => {
    const { user, other, trip } = tripWithTwo();
    await withHarness(user.id, async (h) => {
      const created = parseToolResult(await h.client.callTool({
        name: 'create_settlement',
        arguments: { tripId: trip.id, from_user_id: other.id, to_user_id: user.id, amount: 20 },
      })) as any;
      stubRates({ USD: 1.1 });
      const result = await h.client.callTool({
        name: 'update_settlement',
        arguments: { tripId: trip.id, settlementId: created.settlement.id, from_user_id: other.id, to_user_id: user.id, amount: 20, currency: 'USD' },
      });
      expect(result.isError).toBeFalsy();
      const row = settlementRow(created.settlement.id);
      expect(row.currency).toBe('USD');
      expect(row.exchange_rate).toBe(1.1);
    });
  });

  it('clears the currency back to the trip currency', async () => {
    const { user, other, trip } = tripWithTwo();
    stubRates({ USD: 1.1 });
    await withHarness(user.id, async (h) => {
      const created = parseToolResult(await h.client.callTool({
        name: 'create_settlement',
        arguments: { tripId: trip.id, from_user_id: other.id, to_user_id: user.id, amount: 20, currency: 'USD' },
      })) as any;
      const result = await h.client.callTool({
        name: 'update_settlement',
        arguments: { tripId: trip.id, settlementId: created.settlement.id, from_user_id: other.id, to_user_id: user.id, amount: 20, currency: null },
      });
      expect(result.isError).toBeFalsy();
      expect(settlementRow(created.settlement.id).currency).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// The split has to reconcile against the total that is actually stored
//
// writeItemPayers drops a payer who is not on the trip and then derives
// total_price from what survived, so certifying a split against the payers as
// GIVEN would pass a check the stored row fails. An empty payer list is the
// same trap from the other side: it means "no payers", so the derived total is
// zero, not the previous one.
// ---------------------------------------------------------------------------

describe('Budget tools: a custom split cannot be certified against a total the row will not get', () => {
  it('refuses a payer who is not on the trip rather than storing an unbalanced split', async () => {
    const { user: owner } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await withHarness(owner.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: {
          tripId: trip.id, name: 'Dinner', total_price: 100,
          members: [{ user_id: owner.id, amount: 100 }],
          payers: [{ user_id: stranger.id, amount: 50 }, { user_id: owner.id, amount: 50 }],
        },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('not on this trip');
      expect(testDb.prepare('SELECT COUNT(*) AS n FROM budget_items WHERE trip_id = ?').get(trip.id)).toEqual({ n: 0 });
    });
  });

  it('refuses an empty payer list under a non-zero split, because the stored total becomes zero', async () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, friend.id);
    await withHarness(owner.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'Taxi', total_price: 100, member_ids: [owner.id, friend.id] },
      });
      const { item } = parseToolResult(created) as { item: { id: number } };

      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: {
          tripId: trip.id, itemId: item.id,
          payers: [],
          members: [{ user_id: owner.id, amount: 60 }, { user_id: friend.id, amount: 40 }],
        },
      });
      expect(result.isError).toBe(true);
      expect(errorText(result)).toContain('does not add up');
      // The item is untouched: the refusal happens before the write.
      const row = testDb.prepare('SELECT total_price FROM budget_items WHERE id = ?').get(item.id) as any;
      expect(row.total_price).toBe(100);
    });
  });

  it('accepts an empty payer list when the split is empty too', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await withHarness(owner.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'Placeholder', total_price: 50, member_ids: [] },
      });
      const { item } = parseToolResult(created) as { item: { id: number } };

      const result = await h.client.callTool({
        name: 'update_budget_item',
        arguments: { tripId: trip.id, itemId: item.id, payers: [], members: [] },
      });
      expect(result.isError).toBeFalsy();
      const row = testDb.prepare('SELECT total_price FROM budget_items WHERE id = ?').get(item.id) as any;
      expect(row.total_price).toBe(0);
    });
  });

  it('still certifies a split against the payer sum when every payer is on the trip', async () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, friend.id);
    await withHarness(owner.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: {
          tripId: trip.id, name: 'Hotel', total_price: 999,
          payers: [{ user_id: owner.id, amount: 70 }, { user_id: friend.id, amount: 30 }],
          members: [{ user_id: owner.id, amount: 60 }, { user_id: friend.id, amount: 40 }],
        },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      // total_price came from the payers, not from the stated 999.
      const row = testDb.prepare('SELECT total_price FROM budget_items WHERE id = ?').get(data.item.id) as any;
      expect(row.total_price).toBe(100);
      const shares = testDb.prepare('SELECT user_id, amount FROM budget_item_members WHERE budget_item_id = ? ORDER BY user_id').all(data.item.id) as any[];
      expect(shares.map(s => s.amount)).toEqual([60, 40]);
    });
  });
});
