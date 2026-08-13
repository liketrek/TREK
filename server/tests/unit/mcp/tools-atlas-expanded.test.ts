/**
 * Unit tests for MCP atlas expanded tools (atlas addon-gated):
 * get_atlas_stats, list_visited_regions, mark_region_visited, unmark_region_visited,
 * get_country_atlas_places, update_bucket_list_item.
 * Also covers resources trek://atlas/stats and trek://atlas/regions.
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
import { createUser, createBucketListItem, createVisitedCountry } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { setAddonEnabled } from '../../helpers/test-db';
import { ADDON_IDS } from '../../../src/addons';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  setAddonEnabled(testDb, ADDON_IDS.ATLAS, true);
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

// The atlas resources register via the nest-mcp registry inside registerTools
// (AtlasMcp @Resource), so the harness must keep tools on for them to attach
// (same shape as tools-vacay.test.ts's withResourceHarness).
async function withResourceHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: true });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// get_atlas_stats
// ---------------------------------------------------------------------------

describe('Tool: get_atlas_stats', () => {
  it('returns stats object without error for empty data', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_atlas_stats', arguments: {} });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.stats).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// list_visited_regions
// ---------------------------------------------------------------------------

describe('Tool: list_visited_regions', () => {
  it('returns empty array initially', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_visited_regions', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.regions).toEqual([]);
    });
  });

  it('returns regions after they have been inserted', async () => {
    const { user } = createUser(testDb);
    testDb.prepare(
      'INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)'
    ).run(user.id, 'FR-75', 'Paris', 'FR');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_visited_regions', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.regions).toHaveLength(1);
      expect(data.regions[0].region_code).toBe('FR-75');
    });
  });
});

// ---------------------------------------------------------------------------
// mark_region_visited
// ---------------------------------------------------------------------------

describe('Tool: mark_region_visited', () => {
  it('uppercases both codes like REST does (post-fold quirk fix)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'mark_region_visited',
        arguments: { regionCode: 'jp-13', regionName: 'Tokyo', countryCode: 'jp' },
      });
      const data = parseToolResult(result) as any;
      // Legacy stored 'jp-13'/'jp' verbatim, creating rows REST's uppercased
      // unmark could never hit; both codes now normalize.
      expect(data.region.code).toBe('JP-13');
      expect(data.region.country_code).toBe('JP');
      const unmark = await h.client.callTool({
        name: 'unmark_region_visited',
        arguments: { regionCode: 'jp-13' },
      });
      expect(parseToolResult(unmark)).toEqual({ success: true });
      const row = testDb.prepare('SELECT 1 FROM visited_regions WHERE user_id = ?').get(user.id);
      expect(row).toBeUndefined();
    });
  });

  it('inserts region and returns region object', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'mark_region_visited',
        arguments: { regionCode: 'US-CA', regionName: 'California', countryCode: 'US' },
      });
      const data = parseToolResult(result) as any;
      // Echoed in the client-facing shape ({ code, name, ... }), not raw DB columns.
      expect(data.region).toBeDefined();
      expect(data.region.code).toBe('US-CA');
      expect(data.region.name).toBe('California');
      expect(data.region.country_code).toBe('US');
      expect(data.region.manuallyMarked).toBe(true);
      const row = testDb.prepare('SELECT * FROM visited_regions WHERE user_id = ? AND region_code = ?').get(user.id, 'US-CA');
      expect(row).toBeTruthy();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'mark_region_visited',
        arguments: { regionCode: 'DE-BY', regionName: 'Bavaria', countryCode: 'DE' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// unmark_region_visited
// ---------------------------------------------------------------------------

describe('Tool: unmark_region_visited', () => {
  it('removes region and returns success', async () => {
    const { user } = createUser(testDb);
    testDb.prepare(
      'INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)'
    ).run(user.id, 'IT-LO', 'Lombardy', 'IT');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'unmark_region_visited',
        arguments: { regionCode: 'IT-LO' },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      const row = testDb.prepare('SELECT * FROM visited_regions WHERE user_id = ? AND region_code = ?').get(user.id, 'IT-LO');
      expect(row).toBeUndefined();
    });
  });

  it('succeeds even when region was not marked (no-op)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'unmark_region_visited',
        arguments: { regionCode: 'XX-YY' },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// get_country_atlas_places
// ---------------------------------------------------------------------------

describe('Tool: get_country_atlas_places', () => {
  it('returns empty places array for a new user', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_country_atlas_places',
        arguments: { countryCode: 'JP' },
      });
      const data = parseToolResult(result) as any;
      expect(data.places).toBeDefined();
      expect(Array.isArray(data.places)).toBe(true);
    });
  });

  it('uppercases the country code like REST does (post-fold quirk fix)', async () => {
    const { user } = createUser(testDb);
    testDb.prepare('INSERT INTO visited_countries (user_id, country_code) VALUES (?, ?)').run(user.id, 'JP');
    // A trip so countryPlaces reaches the visited_countries lookup pre-quirk-fix too.
    testDb.prepare('INSERT INTO trips (user_id, title) VALUES (?, ?)').run(user.id, 'Japan');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_country_atlas_places',
        arguments: { countryCode: 'jp' },
      });
      const data = parseToolResult(result) as any;
      // Legacy passed 'jp' through verbatim and the lookup matched nothing.
      expect(data.manually_marked).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_bucket_list_item
// ---------------------------------------------------------------------------

describe('Tool: update_bucket_list_item', () => {
  it('updates notes and returns item', async () => {
    const { user } = createUser(testDb);
    const r = testDb.prepare(
      'INSERT INTO bucket_list (user_id, name, lat, lng) VALUES (?, ?, NULL, NULL)'
    ).run(user.id, 'Visit Tokyo');
    const itemId = r.lastInsertRowid as number;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_bucket_list_item',
        arguments: { itemId, notes: 'Cherry blossom season preferred' },
      });
      const data = parseToolResult(result) as any;
      expect(data.item).toBeDefined();
      expect(data.item.notes).toBe('Cherry blossom season preferred');
    });
  });

  it('updates name of existing item', async () => {
    const { user } = createUser(testDb);
    const r = testDb.prepare(
      'INSERT INTO bucket_list (user_id, name, lat, lng) VALUES (?, ?, NULL, NULL)'
    ).run(user.id, 'Old Name');
    const itemId = r.lastInsertRowid as number;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_bucket_list_item',
        arguments: { itemId, name: 'New Name' },
      });
      const data = parseToolResult(result) as any;
      expect(data.item.name).toBe('New Name');
    });
  });

  it('returns isError for non-existent item', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_bucket_list_item',
        arguments: { itemId: 99999, notes: 'Will not work' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns isError when the edit would land on another wish (#1898)', async () => {
    const { user } = createUser(testDb);
    const insert = testDb.prepare('INSERT INTO bucket_list (user_id, name, target_date) VALUES (?, ?, ?)');
    insert.run(user.id, 'Japan', '2027-05');
    const itemId = insert.run(user.id, 'Japan', '2028-09').lastInsertRowid as number;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_bucket_list_item',
        arguments: { itemId, target_date: '2027-05' },
      });
      expect(result.isError).toBe(true);
      const row = testDb.prepare('SELECT target_date FROM bucket_list WHERE id = ?').get(itemId) as { target_date: string };
      expect(row.target_date).toBe('2028-09');
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const r = testDb.prepare(
      'INSERT INTO bucket_list (user_id, name, lat, lng) VALUES (?, ?, NULL, NULL)'
    ).run(user.id, 'Bucket Item');
    const itemId = r.lastInsertRowid as number;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_bucket_list_item',
        arguments: { itemId, notes: 'blocked' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// Resource: trek://atlas/stats
// ---------------------------------------------------------------------------

describe('Resource: trek://atlas/stats', () => {
  it('returns stats object', async () => {
    const { user } = createUser(testDb);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://atlas/stats' });
      const data = parseResourceResult(result) as any;
      expect(data).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Resource: trek://atlas/regions
// ---------------------------------------------------------------------------

describe('Resource: trek://atlas/regions', () => {
  it('returns regions array', async () => {
    const { user } = createUser(testDb);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://atlas/regions' });
      const data = parseResourceResult(result) as any;
      expect(Array.isArray(data)).toBe(true);
    });
  });

  it('returns inserted regions', async () => {
    const { user } = createUser(testDb);
    testDb.prepare(
      'INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)'
    ).run(user.id, 'ES-CT', 'Catalonia', 'ES');
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://atlas/regions' });
      const data = parseResourceResult(result) as any;
      expect(data).toHaveLength(1);
      expect(data[0].region_code).toBe('ES-CT');
    });
  });
});

// ---------------------------------------------------------------------------
// Resource: trek://bucket-list (moved from resources.test.ts with the fold —
// that suite's withTools:false harness never attaches registry resources)
// ---------------------------------------------------------------------------

describe('Resource: trek://bucket-list', () => {
  it('returns only the current user\'s bucket list items', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    createBucketListItem(testDb, user.id, { name: 'Tokyo' });
    createBucketListItem(testDb, other.id, { name: 'Rome' });

    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://bucket-list' });
      const items = parseResourceResult(result) as any[];
      expect(items).toHaveLength(1);
      expect(items[0].name).toBe('Tokyo');
    });
  });

  it('returns empty array for user with no items', async () => {
    const { user } = createUser(testDb);

    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://bucket-list' });
      const items = parseResourceResult(result) as any[];
      expect(items).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// Resource: trek://visited-countries (moved from resources.test.ts, same reason)
// ---------------------------------------------------------------------------

describe('Resource: trek://visited-countries', () => {
  it('returns only the current user\'s visited countries', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    createVisitedCountry(testDb, user.id, 'FR');
    createVisitedCountry(testDb, user.id, 'JP');
    createVisitedCountry(testDb, other.id, 'DE');

    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://visited-countries' });
      const countries = parseResourceResult(result) as any[];
      expect(countries).toHaveLength(2);
      const codes = countries.map((c) => c.country_code);
      expect(codes).toContain('FR');
      expect(codes).toContain('JP');
      expect(codes).not.toContain('DE');
    });
  });

  it('returns empty array for user with no visited countries', async () => {
    const { user } = createUser(testDb);

    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://visited-countries' });
      const countries = parseResourceResult(result) as any[];
      expect(countries).toEqual([]);
    });
  });
});
