/**
 * Unit tests for MCP addon gating and scope enforcement in tools.
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
import { createUser, createTrip } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { setAddonEnabled } from '../../helpers/test-db';
import { ADDON_IDS } from '../../../src/addons';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  // The summary reads these three off the injected AddonsService, so the case
  // that wants one off writes the row the admin panel writes. resetTestDb
  // leaves the addons table alone, so each case restates what it needs.
  for (const id of [ADDON_IDS.BUDGET, ADDON_IDS.PACKING, ADDON_IDS.COLLAB]) {
    setAddonEnabled(testDb, id, true);
  }
});

afterAll(() => {
  testDb.close();
});

async function withHarness(
  userId: number,
  fn: (h: McpHarness) => Promise<void>,
  scopes?: string[] | null
) {
  const h = await createMcpHarness({ userId, withResources: false, scopes: scopes ?? null });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// get_trip_summary — addon gating
// ---------------------------------------------------------------------------

describe('get_trip_summary — addon gating', () => {
  it('when all addons enabled: packing, budget, collab_notes, todos are present', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Full Trip' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.packing).toBeDefined();
      expect(data.budget).toBeDefined();
      expect(Array.isArray(data.collab_notes)).toBe(true);
      expect(Array.isArray(data.todos)).toBe(true);
    });
  });

  it('when budget disabled: budget is undefined in response', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'No Budget Trip' });

    setAddonEnabled(testDb, ADDON_IDS.BUDGET, false);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.budget).toBeUndefined();
      // packing and collab still present
      expect(data.packing).toBeDefined();
      expect(Array.isArray(data.collab_notes)).toBe(true);
    });
  });

  it('when packing disabled: packing is undefined and todos is empty array', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'No Packing Trip' });

    setAddonEnabled(testDb, ADDON_IDS.PACKING, false);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.packing).toBeUndefined();
      expect(Array.isArray(data.todos)).toBe(true);
      expect(data.todos).toHaveLength(0);
    });
  });

  it('when collab disabled: collab_notes is empty array, pollCount is 0, messageCount is 0', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'No Collab Trip' });

    setAddonEnabled(testDb, ADDON_IDS.COLLAB, false);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.collab_notes)).toBe(true);
      expect(data.collab_notes).toHaveLength(0);
      expect(data.pollCount).toBe(0);
      expect(data.messageCount).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// Budget tools — addon gating
// ---------------------------------------------------------------------------

describe('Budget tools — addon gating', () => {
  it('when budget addon disabled, create_budget_item is not registered', async () => {
    const { user } = createUser(testDb);

    setAddonEnabled(testDb, ADDON_IDS.BUDGET, false);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_budget_item', arguments: { tripId: 1, name: 'Test', total_price: 100 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Packing tools — addon gating
// ---------------------------------------------------------------------------

describe('Packing tools — addon gating', () => {
  it('when packing addon disabled, create_packing_item is not registered', async () => {
    const { user } = createUser(testDb);

    setAddonEnabled(testDb, ADDON_IDS.PACKING, false);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_packing_item', arguments: { tripId: 1, name: 'Sunscreen' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Collab tools — addon gating
// ---------------------------------------------------------------------------

describe('Collab tools — addon gating', () => {
  it('when collab addon disabled, create_collab_note is not registered', async () => {
    const { user } = createUser(testDb);

    setAddonEnabled(testDb, ADDON_IDS.COLLAB, false);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_collab_note', arguments: { tripId: 1, title: 'Test Note' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Atlas tools — addon gating
// ---------------------------------------------------------------------------

describe('Atlas tools — addon gating', () => {
  it('when atlas addon disabled, mark_country_visited is not registered', async () => {
    const { user } = createUser(testDb);

    setAddonEnabled(testDb, ADDON_IDS.ATLAS, false);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'mark_country_visited', arguments: { country_code: 'FR' } });
      expect(result.isError).toBe(true);
    });
  });

  it('when atlas addon disabled, create_bucket_list_item is not registered', async () => {
    const { user } = createUser(testDb);

    setAddonEnabled(testDb, ADDON_IDS.ATLAS, false);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_bucket_list_item', arguments: { name: 'Paris' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Scope enforcement in tools
// ---------------------------------------------------------------------------

describe('Scope enforcement in tools', () => {
  it('with scopes trips:read, create_trip is not registered (write not in scopes)', async () => {
    const { user } = createUser(testDb);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_trip', arguments: { title: 'Should Fail' } });
      expect(result.isError).toBe(true);
    }, ['trips:read']);
  });

  it('with scopes trips:write, create_trip is registered and works', async () => {
    const { user } = createUser(testDb);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_trip', arguments: { title: 'My Trip' } });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.trip.title).toBe('My Trip');
    }, ['trips:write']);
  });

  it('with scopes null (full access), create_trip is registered', async () => {
    const { user } = createUser(testDb);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_trip', arguments: { title: 'Full Access Trip' } });
      expect(result.isError).toBeFalsy();
    }, null);
  });

  it('with scopes trips:read, create_budget_item is not registered (budget:write not in scopes)', async () => {
    const { user } = createUser(testDb);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_budget_item', arguments: { tripId: 1, name: 'Hotel', total_price: 200 } });
      expect(result.isError).toBe(true);
    }, ['trips:read']);
  });

  it('with scopes budget:write and trips:read, create_budget_item is registered (budget addon enabled)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Budget Trip' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_budget_item',
        arguments: { tripId: trip.id, name: 'Hotel', total_price: 200 },
      });
      expect(result.isError).toBeFalsy();
    }, ['budget:write', 'trips:read']);
  });
});
