/**
 * Unit tests for MCP atlas and bucket list tools:
 * mark_country_visited, unmark_country_visited, create_bucket_list_item, delete_bucket_list_item.
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

vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createBucketListItem, createVisitedCountry } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
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
// mark_country_visited
// ---------------------------------------------------------------------------

describe('Tool: mark_country_visited', () => {
  it('marks a country as visited', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'mark_country_visited', arguments: { country_code: 'FR' } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(data.country_code).toBe('FR');
      const row = testDb.prepare('SELECT country_code FROM visited_countries WHERE user_id = ? AND country_code = ?').get(user.id, 'FR');
      expect(row).toBeTruthy();
    });
  });

  it('is idempotent — marking twice does not error', async () => {
    const { user } = createUser(testDb);
    createVisitedCountry(testDb, user.id, 'JP');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'mark_country_visited', arguments: { country_code: 'JP' } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      const count = (testDb.prepare('SELECT COUNT(*) as c FROM visited_countries WHERE user_id = ? AND country_code = ?').get(user.id, 'JP') as { c: number }).c;
      expect(count).toBe(1);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'mark_country_visited', arguments: { country_code: 'DE' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// unmark_country_visited
// ---------------------------------------------------------------------------

describe('Tool: unmark_country_visited', () => {
  it('removes a visited country', async () => {
    const { user } = createUser(testDb);
    createVisitedCountry(testDb, user.id, 'ES');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'unmark_country_visited', arguments: { country_code: 'ES' } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      const row = testDb.prepare('SELECT country_code FROM visited_countries WHERE user_id = ? AND country_code = ?').get(user.id, 'ES');
      expect(row).toBeUndefined();
    });
  });

  it('succeeds even when country was not marked (no-op)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'unmark_country_visited', arguments: { country_code: 'AU' } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    createVisitedCountry(testDb, user.id, 'IT');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'unmark_country_visited', arguments: { country_code: 'IT' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// create_bucket_list_item
// ---------------------------------------------------------------------------

describe('Tool: create_bucket_list_item', () => {
  it('creates a bucket list item with all fields', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_bucket_list_item',
        arguments: { name: 'Kyoto', lat: 35.0116, lng: 135.7681, country_code: 'JP', notes: 'Cherry blossom season' },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('Kyoto');
      expect(data.item.country_code).toBe('JP');
      expect(data.item.notes).toBe('Cherry blossom season');
    });
  });

  it('creates a minimal item (name only)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_bucket_list_item', arguments: { name: 'Antarctica' } });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('Antarctica');
      expect(data.item.user_id).toBe(user.id);
    });
  });

  it('takes a target date, so the same place can be planned for several dates (#1898)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const first = await h.client.callTool({
        name: 'create_bucket_list_item',
        arguments: { name: 'Japan', country_code: 'JP', target_date: '2027-05' },
      });
      expect((parseToolResult(first) as any).item.target_date).toBe('2027-05');

      const second = await h.client.callTool({
        name: 'create_bucket_list_item',
        arguments: { name: 'Japan', country_code: 'JP', target_date: '2028-09' },
      });
      expect((parseToolResult(second) as any).item.target_date).toBe('2028-09');
    });
  });

  it('reports the duplicate instead of appending a second row (#1898)', async () => {
    const { user } = createUser(testDb);
    createBucketListItem(testDb, user.id, { name: 'Japan', country_code: 'JP' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_bucket_list_item',
        arguments: { name: 'Japan', country_code: 'JP' },
      });
      expect(result.isError).toBe(true);
      expect((testDb.prepare('SELECT COUNT(*) AS n FROM bucket_list WHERE user_id = ?').get(user.id) as { n: number }).n).toBe(1);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_bucket_list_item', arguments: { name: 'Nowhere' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_bucket_list_item
// ---------------------------------------------------------------------------

describe('Tool: delete_bucket_list_item', () => {
  it('deletes a bucket list item owned by the user', async () => {
    const { user } = createUser(testDb);
    const item = createBucketListItem(testDb, user.id, { name: 'Machu Picchu' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_bucket_list_item', arguments: { itemId: item.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(testDb.prepare('SELECT id FROM bucket_list WHERE id = ?').get(item.id)).toBeUndefined();
    });
  });

  it('returns error for item not found (wrong user)', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const item = createBucketListItem(testDb, other.id, { name: "Other's Wish" });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_bucket_list_item', arguments: { itemId: item.id } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns error for non-existent item', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_bucket_list_item', arguments: { itemId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const item = createBucketListItem(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_bucket_list_item', arguments: { itemId: item.id } });
      expect(result.isError).toBe(true);
    });
  });
});
