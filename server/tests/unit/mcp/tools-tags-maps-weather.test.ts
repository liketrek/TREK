/**
 * Unit tests for MCP tag, maps extras, and weather tools:
 * list_tags, create_tag, update_tag, delete_tag,
 * get_place_details, reverse_geocode, resolve_maps_url,
 * get_weather, get_detailed_weather.
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

vi.mock('../../../src/services/weatherService', () => ({
  getWeather: vi.fn().mockResolvedValue({ temp: 20, condition: 'sunny' }),
  getDetailedWeather: vi.fn().mockResolvedValue({ hourly: [] }),
}));

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { MapsService } from '../../../src/nest/maps/maps.service';

// The geo tools live on the DI-discovered maps.mcp.ts since the maps fold; the
// test registry builds a real MapsService over the mocked db proxy, so stub the
// provider methods on the prototype (no auto-restore in the vitest config —
// these survive across tests, exactly like the old module mock did).
vi.spyOn(MapsService.prototype, 'getPlaceDetails').mockResolvedValue({
  name: 'Eiffel Tower',
  address: 'Paris',
} as never);
vi.spyOn(MapsService.prototype, 'reverseGeocode').mockResolvedValue({ name: 'Paris', address: 'France' });
vi.spyOn(MapsService.prototype, 'resolveGoogleMapsUrl').mockResolvedValue({
  lat: 48.8566,
  lng: 2.3522,
  name: 'Paris',
} as never);

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
// list_tags
// ---------------------------------------------------------------------------

describe('Tool: list_tags', () => {
  it('returns empty array initially', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_tags', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.tags).toEqual([]);
    });
  });

  it('returns only tags belonging to the current user', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    testDb.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(user.id, 'My Tag', '#ff0000');
    testDb.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(other.id, 'Other Tag', '#00ff00');
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_tags', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.tags).toHaveLength(1);
      expect(data.tags[0].name).toBe('My Tag');
    });
  });
});

// ---------------------------------------------------------------------------
// create_tag
// ---------------------------------------------------------------------------

describe('Tool: create_tag', () => {
  it('creates a tag and returns the tag object', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_tag',
        arguments: { name: 'Adventure', color: '#ff5500' },
      });
      const data = parseToolResult(result) as any;
      expect(data.tag).toBeDefined();
      expect(data.tag.name).toBe('Adventure');
      expect(data.tag.color).toBe('#ff5500');
      expect(data.tag.user_id).toBe(user.id);
    });
  });

  it('creates a tag with only a name', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_tag',
        arguments: { name: 'Food' },
      });
      const data = parseToolResult(result) as any;
      expect(data.tag.name).toBe('Food');
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_tag',
        arguments: { name: 'Blocked' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_tag
// ---------------------------------------------------------------------------

describe('Tool: update_tag', () => {
  it('updates tag name and color', async () => {
    const { user } = createUser(testDb);
    const r = testDb.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(user.id, 'Old Name', '#aaaaaa');
    const tagId = r.lastInsertRowid as number;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_tag',
        arguments: { tagId, name: 'New Name', color: '#bbbbbb' },
      });
      const data = parseToolResult(result) as any;
      expect(data.tag).toBeDefined();
      expect(data.tag.name).toBe('New Name');
      expect(data.tag.color).toBe('#bbbbbb');
    });
  });

  it('returns isError for non-existent tagId', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_tag',
        arguments: { tagId: 99999, name: 'X' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const r = testDb.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(user.id, 'Demo Tag', '#aaaaaa');
    const tagId = r.lastInsertRowid as number;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_tag',
        arguments: { tagId, name: 'Blocked' },
      });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT name FROM tags WHERE id = ?').get(tagId)).toEqual({ name: 'Demo Tag' });
    });
  });
});

// ---------------------------------------------------------------------------
// delete_tag
// ---------------------------------------------------------------------------

describe('Tool: delete_tag', () => {
  it('removes the tag row', async () => {
    const { user } = createUser(testDb);
    const r = testDb.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(user.id, 'To Delete', '#cccccc');
    const tagId = r.lastInsertRowid as number;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_tag',
        arguments: { tagId },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(testDb.prepare('SELECT id FROM tags WHERE id = ?').get(tagId)).toBeUndefined();
    });
  });

  it('returns isError for non-existent tagId', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_tag',
        arguments: { tagId: 99999 },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const r = testDb.prepare('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)').run(user.id, 'Demo Tag', '#aaaaaa');
    const tagId = r.lastInsertRowid as number;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_tag',
        arguments: { tagId },
      });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT id FROM tags WHERE id = ?').get(tagId)).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// tags scope gating (places:read / places:write, registration-time)
// ---------------------------------------------------------------------------

describe('Tags tools: scope gating', () => {
  const TAG_TOOLS = ['list_tags', 'create_tag', 'update_tag', 'delete_tag'];

  async function listToolNames(userId: number, scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ userId, withResources: false, scopes });
    try {
      return (await h.client.listTools()).tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('registers all four tag tools with null scopes (full access)', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, null);
    for (const tool of TAG_TOOLS) expect(names).toContain(tool);
  });

  it('registers only list_tags with places:read', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['places:read']);
    expect(names).toContain('list_tags');
    expect(names).not.toContain('create_tag');
    expect(names).not.toContain('update_tag');
    expect(names).not.toContain('delete_tag');
  });

  it('registers all four tag tools with places:write (write implies read)', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['places:write']);
    for (const tool of TAG_TOOLS) expect(names).toContain(tool);
  });

  it('registers no tag tools for an unrelated scope', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['budget:read']);
    for (const tool of TAG_TOOLS) expect(names).not.toContain(tool);
  });
});

// ---------------------------------------------------------------------------
// get_place_details
// ---------------------------------------------------------------------------

describe('Tool: get_place_details', () => {
  it('returns details from mocked service', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_place_details',
        arguments: { placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ' },
      });
      const data = parseToolResult(result) as any;
      expect(data.details).toBeDefined();
      expect(data.details.name).toBe('Eiffel Tower');
    });
  });

  // The former "isError when service returns null" case pinned a dead branch —
  // MapsService.getPlaceDetails throws or returns an object, never null — and
  // died with the guard in the fix(maps) quirk pass.
});

// ---------------------------------------------------------------------------
// reverse_geocode
// ---------------------------------------------------------------------------

describe('Tool: reverse_geocode', () => {
  it('returns result from mocked service', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reverse_geocode',
        arguments: { lat: 48.8566, lng: 2.3522 },
      });
      const data = parseToolResult(result) as any;
      expect(data.name).toBe('Paris');
      expect(data.address).toBe('France');
    });
  });
});

// ---------------------------------------------------------------------------
// resolve_maps_url
// ---------------------------------------------------------------------------

describe('Tool: resolve_maps_url', () => {
  it('returns result from mocked service', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'resolve_maps_url',
        arguments: { url: 'https://maps.app.goo.gl/example' },
      });
      const data = parseToolResult(result) as any;
      expect(data.lat).toBe(48.8566);
      expect(data.lng).toBe(2.3522);
      expect(data.name).toBe('Paris');
    });
  });
});

// ---------------------------------------------------------------------------
// get_weather
// ---------------------------------------------------------------------------

describe('Tool: get_weather', () => {
  it('returns weather from mocked service', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_weather',
        arguments: { lat: 48.8566, lng: 2.3522, date: '2025-07-01' },
      });
      const data = parseToolResult(result) as any;
      expect(data.weather).toBeDefined();
      expect(data.weather.temp).toBe(20);
      expect(data.weather.condition).toBe('sunny');
    });
  });
});

// ---------------------------------------------------------------------------
// get_detailed_weather
// ---------------------------------------------------------------------------

describe('Tool: get_detailed_weather', () => {
  it('returns detailed weather from mocked service', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_detailed_weather',
        arguments: { lat: 48.8566, lng: 2.3522, date: '2025-07-01' },
      });
      const data = parseToolResult(result) as any;
      expect(data.weather).toBeDefined();
      expect(Array.isArray(data.weather.hourly)).toBe(true);
    });
  });
});
