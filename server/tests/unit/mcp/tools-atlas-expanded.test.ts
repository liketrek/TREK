/**
 * Unit tests for MCP atlas expanded tools (atlas addon-gated):
 * get_atlas_stats, list_visited_regions, locate_atlas_region, mark_region_visited,
 * unmark_region_visited, get_country_atlas_places, update_bucket_list_item.
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
import { createUser, createBucketListItem, createVisitedCountry, createTrip, createReservation } from '../../helpers/factories';
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

// A place carrying an address and coordinates, which createPlace does not write.
function insertPlace(tripId: number, name: string, address: string | null, lat: number, lng: number): number {
  const r = testDb
    .prepare('INSERT INTO places (trip_id, name, address, lat, lng) VALUES (?, ?, ?, ?, ?)')
    .run(tripId, name, address, lat, lng);
  return r.lastInsertRowid as number;
}

// The geocoder's answer for a place, pre-seeded so visitedRegions() reads the cache
// and never reaches for Nominatim (same trick as ATLAS-UNIT-020).
function cacheRegion(placeId: number, countryCode: string, regionCode: string, regionName: string): void {
  testDb
    .prepare('INSERT OR REPLACE INTO place_regions (place_id, country_code, region_code, region_name) VALUES (?, ?, ?, ?)')
    .run(placeId, countryCode, regionCode, regionName);
}

function insertEndpoint(reservationId: number, role: 'from' | 'to', sequence: number, lat: number, lng: number): void {
  testDb
    .prepare('INSERT INTO reservation_endpoints (reservation_id, role, sequence, name, lat, lng) VALUES (?, ?, ?, ?, ?, ?)')
    .run(reservationId, role, sequence, `Endpoint ${sequence}`, lat, lng);
}

// Trips have to sit in the past for their countries and regions to count as
// visited rather than planned (#1048).
const PAST_START = '2023-05-01';
const PAST_END = '2023-05-10';

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
      expect(data.travel).toEqual({
        countries: [],
        cities: [],
        totalTrips: 0,
        totalDays: 0,
        totalPlaces: 0,
        totalDistanceKm: 0,
      });
    });
  });

  it('carries the passport figures REST answers with: the cities by name and the distance flown', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rome', start_date: PAST_START, end_date: PAST_END });
    insertPlace(trip.id, 'Colosseum', 'Colosseum, Rome, Italy', 41.8902, 12.4922);
    const flight = createReservation(testDb, trip.id, { type: 'flight', title: 'FCO-JFK' });
    insertEndpoint(flight.id, 'from', 0, 41.8003, 12.2389);
    insertEndpoint(flight.id, 'to', 1, 40.6413, -73.7781);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_atlas_stats', arguments: {} });
      const data = parseToolResult(result) as any;
      // The count was always there; the names behind it were not.
      expect(data.stats.stats.totalCities).toBe(1);
      expect(data.travel.cities).toEqual(['Rome']);
      expect(data.travel.countries).toContain('IT');
      expect(data.travel.countries).toContain('US');
      // Rome to New York, so a four-figure number rather than a rounding artefact.
      expect(data.travel.totalDistanceKm).toBeGreaterThan(6000);
      const places = testDb.prepare('SELECT COUNT(*) AS c FROM places WHERE trip_id = ?').get(trip.id) as { c: number };
      expect(data.travel.totalPlaces).toBe(places.c);
      // Rendering data stays out unless asked for.
      expect(data.travel.coords).toBeUndefined();
    });
  });

  it('include_coords adds the per-place coordinates the dashboard map plots', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rome', start_date: PAST_START, end_date: PAST_END });
    insertPlace(trip.id, 'Colosseum', 'Colosseum, Rome, Italy', 41.8902, 12.4922);
    insertPlace(trip.id, 'Pantheon', 'Pantheon, Rome, Italy', 41.8986, 12.4769);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_atlas_stats', arguments: { include_coords: true } });
      const data = parseToolResult(result) as any;
      const withCoords = testDb
        .prepare('SELECT COUNT(*) AS c FROM places WHERE trip_id = ? AND lat IS NOT NULL AND lng IS NOT NULL')
        .get(trip.id) as { c: number };
      expect(data.travel.coords).toHaveLength(withCoords.c);
      expect(data.travel.coords[0]).toEqual({ lat: 41.8902, lng: 12.4922 });
    });
  });

  it('refuses a non-boolean include_coords', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_atlas_stats', arguments: { include_coords: 'yes' } });
      expect(result.isError).toBe(true);
      expect((result.content[0] as any).text).toContain('include_coords');
    });
  });
});

// ---------------------------------------------------------------------------
// list_visited_regions
// ---------------------------------------------------------------------------

describe('Tool: list_visited_regions', () => {
  it('returns an empty grouping initially', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_visited_regions', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.regions).toEqual({});
    });
  });

  it('groups a manual mark under its country, in the shape the map reads', async () => {
    const { user } = createUser(testDb);
    testDb.prepare(
      'INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)'
    ).run(user.id, 'FR-75', 'Paris', 'FR');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_visited_regions', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.regions.FR).toEqual([
        { code: 'FR-75', name: 'Paris', placeCount: 0, status: 'visited', manuallyMarked: true },
      ]);
    });
  });

  it('reports regions derived from trip places, which the manual table never held', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rome', start_date: PAST_START, end_date: PAST_END });
    cacheRegion(insertPlace(trip.id, 'Colosseum', null, 41.8902, 12.4922), 'IT', 'IT-62', 'Lazio');
    cacheRegion(insertPlace(trip.id, 'Pantheon', null, 41.8986, 12.4769), 'IT', 'IT-62', 'Lazio');

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_visited_regions', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.regions.IT).toEqual([{ code: 'IT-62', name: 'Lazio', placeCount: 2, status: 'visited' }]);
      // Nothing was ever marked by hand, so the old manual-only read had no row
      // to answer with at all.
      const marked = testDb.prepare('SELECT COUNT(*) AS c FROM visited_regions WHERE user_id = ?').get(user.id) as { c: number };
      expect(marked.c).toBe(0);
    });
  });

  it('drops a region the user dismissed, matching the map', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Rome', start_date: PAST_START, end_date: PAST_END });
    cacheRegion(insertPlace(trip.id, 'Colosseum', null, 41.8902, 12.4922), 'IT', 'IT-62', 'Lazio');

    await withHarness(user.id, async (h) => {
      const unmark = await h.client.callTool({ name: 'unmark_region_visited', arguments: { regionCode: 'IT-62' } });
      expect(parseToolResult(unmark)).toEqual({ success: true });
      const tombstone = testDb
        .prepare('SELECT region_code FROM hidden_regions WHERE user_id = ? AND region_code = ?')
        .get(user.id, 'IT-62');
      expect(tombstone).toBeTruthy();

      const result = await h.client.callTool({ name: 'list_visited_regions', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.regions.IT).toBeUndefined();
    });
  });
});

// ---------------------------------------------------------------------------
// locate_atlas_region
// ---------------------------------------------------------------------------

describe('Tool: locate_atlas_region', () => {
  it('resolves a coordinate to the country and the region the map can highlight', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'locate_atlas_region',
        arguments: { lat: 41.9028, lng: 12.4964 },
      });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      // Rome. Italy has admin1 coverage in the bundle, so the region resolves too,
      // and the code comes back in the form mark_region_visited takes.
      expect(data.country_code).toBe('IT');
      expect(typeof data.region_code).toBe('string');
      expect(typeof data.region_name).toBe('string');
    });
  });

  it('feeds mark_region_visited without the caller knowing any codes', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const located = parseToolResult(
        await h.client.callTool({ name: 'locate_atlas_region', arguments: { lat: 41.9028, lng: 12.4964 } }),
      ) as any;
      expect(typeof located.region_code).toBe('string');

      await h.client.callTool({
        name: 'mark_region_visited',
        arguments: {
          regionCode: located.region_code,
          regionName: located.region_name,
          countryCode: located.country_code,
        },
      });
      const row = testDb
        .prepare('SELECT region_code, country_code FROM visited_regions WHERE user_id = ?')
        .get(user.id) as { region_code: string; country_code: string };
      expect(row).toEqual({ region_code: located.region_code, country_code: 'IT' });
    });
  });

  it('answers with nulls out at sea rather than failing', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'locate_atlas_region', arguments: { lat: 0, lng: -140 } });
      expect(result.isError).toBeFalsy();
      expect(parseToolResult(result)).toEqual({ country_code: null, region_code: null, region_name: null });
    });
  });

  it('refuses an out-of-range coordinate, like the REST route does', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const badLat = await h.client.callTool({ name: 'locate_atlas_region', arguments: { lat: 91, lng: 12.5 } });
      expect(badLat.isError).toBe(true);
      expect((badLat.content[0] as any).text).toContain('lat');

      const badLng = await h.client.callTool({ name: 'locate_atlas_region', arguments: { lat: 41.9, lng: 181 } });
      expect(badLng.isError).toBe(true);
      expect((badLng.content[0] as any).text).toContain('lng');
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
  it('returns the country grouping', async () => {
    const { user } = createUser(testDb);
    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://atlas/regions' });
      const data = parseResourceResult(result) as any;
      expect(data).toEqual({});
    });
  });

  it('returns marked and derived regions together, as the tool does', async () => {
    const { user } = createUser(testDb);
    testDb.prepare(
      'INSERT INTO visited_regions (user_id, region_code, region_name, country_code) VALUES (?, ?, ?, ?)'
    ).run(user.id, 'ES-CT', 'Catalonia', 'ES');
    const trip = createTrip(testDb, user.id, { title: 'Rome', start_date: PAST_START, end_date: PAST_END });
    cacheRegion(insertPlace(trip.id, 'Colosseum', null, 41.8902, 12.4922), 'IT', 'IT-62', 'Lazio');

    await withResourceHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://atlas/regions' });
      const data = parseResourceResult(result) as any;
      expect(data.ES).toEqual([
        { code: 'ES-CT', name: 'Catalonia', placeCount: 0, status: 'visited', manuallyMarked: true },
      ]);
      expect(data.IT).toEqual([{ code: 'IT-62', name: 'Lazio', placeCount: 1, status: 'visited' }]);
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
