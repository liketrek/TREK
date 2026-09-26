/**
 * The MCP half of the plugin POI categories (#1781): list_plugin_poi_categories and
 * search_plugin_pois (src/nest/plugins/contributions/plugin-pois.mcp.ts), the
 * counterparts of the GET /api/plugins feed and GET /api/plugin-pois. Both go through
 * PluginPoisService, so the gate, the window and the normalization are the REST ones.
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
    canAccessTrip: () => undefined,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

const { pluginsEnabled } = vi.hoisted(() => ({ pluginsEnabled: vi.fn(() => true) }));

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/websocket', () => ({ broadcast: vi.fn() }));
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));
vi.mock('../../../src/nest/plugins/kill-switch', () => ({ pluginsEnabled }));

import { runMigrations } from '../../../src/db/migrations';
import { createTables } from '../../../src/db/schema';
import { createUser } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb } from '../../helpers/test-db';
import { PluginHooks } from '../../../src/nest/plugins/plugin-hooks.service';

const providersOfMock = vi.spyOn(PluginHooks.prototype, 'providersOf');
const categoryPoisMock = vi.spyOn(PluginHooks.prototype, 'categoryPois');

const trailheads = { id: 'trailheads', label: 'Trailheads', labels: { de: 'Wanderparkplätze' }, icon: 'Signpost', color: '#2f855a' };
const bbox = { south: 47, west: 11, north: 47.5, east: 11.5 };

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  testDb.prepare('DELETE FROM plugins').run();
  testDb
    .prepare("INSERT INTO plugins (id, name, status, capabilities, granted_permissions) VALUES (?, ?, 'active', ?, ?)")
    .run('trail-finder', 'Trail Finder', JSON.stringify({ poiCategories: [trailheads] }), JSON.stringify(['hook:poi-category-provider']));
  pluginsEnabled.mockReturnValue(true);
  providersOfMock.mockReset().mockReturnValue(['trail-finder']);
  categoryPoisMock.mockReset().mockResolvedValue([]);
});

afterAll(() => {
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ userId, withResources: false, scopes: null });
  try { await fn(h); } finally { await h.cleanup(); }
}

const search = (h: McpHarness, args: Record<string, unknown>) =>
  h.client.callTool({ name: 'search_plugin_pois', arguments: args });

describe('Tool: list_plugin_poi_categories', () => {
  it('names the categories a provider answers, labelled in the requested language', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const res = await h.client.callTool({ name: 'list_plugin_poi_categories', arguments: { lang: 'de' } });
      expect(parseToolResult(res)).toEqual({
        categories: [{
          key: 'plugin:trail-finder/trailheads', pluginId: 'trail-finder', pluginName: 'Trail Finder',
          id: 'trailheads', label: 'Wanderparkplätze', icon: 'Signpost', color: '#2f855a',
        }],
      });
      expect(providersOfMock).toHaveBeenCalledWith('poiCategoryProvider');
    });
  });

  it('is empty while the plugin runtime is switched off', async () => {
    const { user } = createUser(testDb);
    pluginsEnabled.mockReturnValue(false);
    await withHarness(user.id, async (h) => {
      const res = await h.client.callTool({ name: 'list_plugin_poi_categories', arguments: {} });
      expect(parseToolResult(res)).toEqual({ categories: [] });
    });
  });
});

describe('Tool: search_plugin_pois', () => {
  it('returns the plugin answer in the search_pois row shape, asked as the requesting user', async () => {
    const { user } = createUser(testDb);
    categoryPoisMock.mockResolvedValue([
      { id: 'th-1', name: 'Trailhead', lat: 47.2, lng: 11.2, rating: 4.5, details: [{ label: 'Length', value: '12 km' }] },
      { id: 'far', name: 'Elsewhere', lat: 50, lng: 11.2 },
    ]);
    await withHarness(user.id, async (h) => {
      const payload = parseToolResult(await search(h, { pluginId: 'trail-finder', category: 'trailheads', bbox, lang: 'de' })) as {
        pois: Array<Record<string, unknown>>; source: string; truncated: boolean; clamped: boolean;
      };
      expect(payload.source).toBe('plugin:trail-finder');
      expect(payload.clamped).toBe(false);
      expect(payload.pois).toHaveLength(1);
      expect(payload.pois[0]).toMatchObject({
        osm_id: 'plugin:trail-finder:th-1',
        category: 'plugin:trail-finder/trailheads',
        pluginId: 'trail-finder',
        rating: 4.5,
        details: [{ label: 'Length', value: '12 km' }],
        icon: 'Signpost',
        color: '#2f855a',
      });
      expect(categoryPoisMock).toHaveBeenCalledWith('trail-finder', { category: 'trailheads', bounds: bbox, lang: 'de', limit: 60 }, user.id);
    });
  });

  it('refuses an undeclared category and an inverted box without asking the plugin', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const unknown = await search(h, { pluginId: 'trail-finder', category: 'huts', bbox });
      expect(unknown.isError).toBe(true);
      expect(JSON.stringify(unknown.content)).toContain('list_plugin_poi_categories');
      const inverted = await search(h, { pluginId: 'trail-finder', category: 'trailheads', bbox: { ...bbox, south: 48 } });
      expect(inverted.isError).toBe(true);
      expect(categoryPoisMock).not.toHaveBeenCalled();
    });
  });

  it('takes the box search_pois takes and refuses an edge off the globe without asking the plugin', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const { tools } = await h.client.listTools();
      const bboxOf = (name: string) => tools.find((t) => t.name === name)?.inputSchema.properties?.bbox;
      expect(bboxOf('search_plugin_pois')).toBeDefined();
      expect(bboxOf('search_plugin_pois')).toEqual(bboxOf('search_pois'));
      const offGlobe = await search(h, { pluginId: 'trail-finder', category: 'trailheads', bbox: { ...bbox, north: 118 } });
      expect(offGlobe.isError).toBe(true);
      expect(categoryPoisMock).not.toHaveBeenCalled();
    });
  });

  it('turns a failing plugin into an error result', async () => {
    const { user } = createUser(testDb);
    categoryPoisMock.mockRejectedValue(new Error('timed out'));
    await withHarness(user.id, async (h) => {
      const res = await search(h, { pluginId: 'trail-finder', category: 'trailheads', bbox });
      expect(res.isError).toBe(true);
      expect(JSON.stringify(res.content)).toContain('Plugin POI search failed.');
    });
  });
});
