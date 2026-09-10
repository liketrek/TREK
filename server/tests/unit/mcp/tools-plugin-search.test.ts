/**
 * Unit tests for the search_places_via_plugins MCP tool (src/nest/plugins/
 * contributions/plugin-search.mcp.ts), the MCP counterpart of GET /api/plugin-search.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { testDb, dbMock } = vi.hoisted(() => {
  const Database = require('better-sqlite3');
  const db = new Database(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const mock = {
    db,
    closeDb: () => {},
    reinitialize: () => {},
    getPlaceWithTags: () => null,
    canAccessTrip: (tripId: number, userId: number) =>
      db
        .prepare(
          'SELECT t.id FROM trips t LEFT JOIN trip_members m ON m.trip_id = t.id AND m.user_id = ? WHERE t.id = ? AND (t.user_id = ? OR m.user_id IS NOT NULL)',
        )
        .get(userId, tripId, userId),
    isOwner: (tripId: number, userId: number) =>
      !!db.prepare('SELECT id FROM trips WHERE id = ? AND user_id = ?').get(tripId, userId),
  };
  return { testDb: db, dbMock: mock };
});

const { broadcastMock, pluginsEnabled } = vi.hoisted(() => ({
  broadcastMock: vi.fn(),
  pluginsEnabled: vi.fn(() => true),
}));

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
// The admin kill switch reads live env; drive it from the test instead of the process.
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { createUser } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb } from '../../helpers/test-db';
import { PluginHooks } from '../../../src/nest/plugins/plugin-hooks.service';

const providersOfMock = vi.spyOn(PluginHooks.prototype, 'providersOf');
const searchPlacesMock = vi.spyOn(PluginHooks.prototype, 'searchPlaces');

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  pluginsEnabled.mockReturnValue(true);
  providersOfMock.mockReset().mockReturnValue([]);
  searchPlacesMock.mockReset().mockResolvedValue([]);
});

afterAll(() => {
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false, scopes: null });
  try { await fn(h); } finally { await h.cleanup(); }
}

interface PlacesPayload {
  places: { osm_id: string; name: string; rating: number | null; pluginId: string; source: string }[];
}

const call = async (h: McpHarness, args: Record<string, unknown>) =>
  h.client.callTool({ name: 'search_places_via_plugins', arguments: args });

describe('Tool: search_places_via_plugins', () => {
  it('returns what the providers found, with the rating open data cannot carry', async () => {
    const { user } = createUser(testDb);
    providersOfMock.mockReturnValue(['guide']);
    searchPlacesMock.mockResolvedValue([
      { id: 'h1', name: 'Hotel Bellevue', lat: 46.5, lng: 6.6, rating: 4.6, address: 'Lakeside 1' },
    ]);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, { query: 'hotel lausanne' })) as PlacesPayload;
      expect(payload.places).toHaveLength(1);
      expect(payload.places[0]).toMatchObject({
        osm_id: 'plugin:guide:h1',
        name: 'Hotel Bellevue',
        rating: 4.6,
        pluginId: 'guide',
        source: 'plugin:guide',
      });
      expect(providersOfMock).toHaveBeenCalledWith('searchProvider');
      expect(searchPlacesMock).toHaveBeenCalledWith(
        'guide',
        { query: 'hotel lausanne', limit: 10, lang: undefined, near: undefined },
        user.id,
      );
    });
  });

  it('passes the bias and the limit through, and refuses a coordinate off the globe', async () => {
    const { user } = createUser(testDb);
    providersOfMock.mockReturnValue(['guide']);

    await withHarness(user.id, async (h) => {
      await call(h, { query: 'hotel', near: { lat: 46.5, lng: 6.6 }, lang: 'fr', limit: 3 });
      expect(searchPlacesMock).toHaveBeenLastCalledWith(
        'guide',
        { query: 'hotel', limit: 3, lang: 'fr', near: { lat: 46.5, lng: 6.6 } },
        user.id,
      );

      // The schema accepts any number, so the range check still has to happen here.
      await call(h, { query: 'hotel', near: { lat: 91, lng: 6.6 } });
      expect(searchPlacesMock).toHaveBeenLastCalledWith(
        'guide',
        { query: 'hotel', limit: 10, lang: undefined, near: undefined },
        user.id,
      );
    });
  });

  it('answers with an empty list when no plugin provides an index, without asking one', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, { query: 'hotel' })) as PlacesPayload;
      expect(payload.places).toEqual([]);
      expect(searchPlacesMock).not.toHaveBeenCalled();
    });
  });

  it('answers with an empty list while the plugin runtime is switched off', async () => {
    const { user } = createUser(testDb);
    pluginsEnabled.mockReturnValue(false);
    providersOfMock.mockReturnValue(['guide']);

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, { query: 'hotel' })) as PlacesPayload;
      expect(payload.places).toEqual([]);
      expect(providersOfMock).not.toHaveBeenCalled();
    });
  });

  it('skips a provider that fails and still returns the other one', async () => {
    const { user } = createUser(testDb);
    providersOfMock.mockReturnValue(['broken', 'guide']);
    searchPlacesMock.mockImplementation(async (pluginId: string) => {
      if (pluginId === 'broken') throw new Error('timed out');
      return [{ id: 'h1', name: 'Hotel Bellevue', lat: 46.5, lng: 6.6 }];
    });

    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await call(h, { query: 'hotel' })) as PlacesPayload;
      expect(payload.places.map(p => p.pluginId)).toEqual(['guide']);
    });
  });
});
