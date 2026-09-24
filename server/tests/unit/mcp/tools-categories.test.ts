/**
 * Unit tests for the categories MCP surface (CategoriesMcp, DI-discovered):
 * the list_categories tool, the create/update/delete_category admin tools and
 * the trek://categories resource.
 *
 * They all attach via the nest-mcp registry inside registerTools, so every
 * harness here keeps withTools on (the resource is NOT registered by the legacy
 * registerResources fan-out anymore).
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
    canAccessTrip: () => null,
    isOwner: () => false,
  };
  return { testDb: db, dbMock: mock };
});

vi.mock('../../../src/db/database', () => dbMock);
vi.mock('../../../src/config', () => ({
  JWT_SECRET: 'test-jwt-secret-for-trek-testing-only',
  ENCRYPTION_KEY: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2a3b4c5d6a7b8c9d0e1f2',
  updateJwtSecret: () => {},
}));

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { createTestRegistry } from '../../../src/nest-mcp';
import { trekMcpAccessPolicy, trekMcpValidateAccess } from '../../../src/mcp/nest-mcp-policy';
import { CategoriesMcp } from '../../../src/nest/categories/categories.mcp';
import { CategoriesService } from '../../../src/nest/categories/categories.service';
import { DatabaseService } from '../../../src/nest/database/database.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';

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

async function withHarness(
  userId: number,
  fn: (h: McpHarness) => Promise<void>,
  scopes: string[] | null = null,
) {
  const h = await createMcpHarness({ userId, withResources: false, scopes });
  try { await fn(h); } finally { await h.cleanup(); }
}

// The write tools reach the guard collaborator, so they run against a controller
// wired here rather than through the shared harness. Everything points at this
// file's DB, which is what lets the admin gate and the demo gate be driven from
// the users table instead of from a stub.
const categoriesDb = new DatabaseService(testDb);
const categoriesMcp = new CategoriesMcp(
  new CategoriesService(categoriesDb),
  categoriesDb,
  new RuntimeEnvService(),
  new McpToolGuardsService(categoriesDb, new PermissionsService(categoriesDb), new RealtimeService()),
);

async function withWriteHarness(userId: number, fn: (client: Client) => Promise<void>) {
  const server = new McpServer({ name: 'trek-test', version: '1.0.0' });
  createTestRegistry([categoriesMcp], { accessPolicy: trekMcpAccessPolicy, validateAccess: trekMcpValidateAccess })
    .attach(server, { userId, scopes: null, isStaticToken: false });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    await fn(client);
  } finally {
    try { await client.close(); } catch { /* ignore */ }
    try { await server.close(); } catch { /* ignore */ }
  }
}

function insertCategory(name: string, color = '#111111', icon = '🅰️'): number {
  return Number(testDb.prepare('INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)').run(name, color, icon).lastInsertRowid);
}

// ---------------------------------------------------------------------------
// list_categories
// ---------------------------------------------------------------------------

describe('Tool: list_categories', () => {
  it('returns all categories with id, name, color, icon', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_categories', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.categories).toBeDefined();
      expect(data.categories.length).toBeGreaterThan(0);
      const cat = data.categories[0];
      expect(cat).toHaveProperty('id');
      expect(cat).toHaveProperty('name');
      expect(cat).toHaveProperty('color');
      expect(cat).toHaveProperty('icon');
    });
  });

  it('returns categories from all users, ordered by name', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    testDb.prepare('INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?)').run('Zzz Mine', '#111111', '🅰️', user.id);
    testDb.prepare('INSERT INTO categories (name, color, icon, user_id) VALUES (?, ?, ?, ?)').run('Zzz Other', '#222222', '🅱️', other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_categories', arguments: {} });
      const names = (parseToolResult(result) as any).categories.map((c: { name: string }) => c.name);
      expect(names).toContain('Zzz Mine');
      expect(names).toContain('Zzz Other');
      expect(names).toEqual([...names].sort());
    });
  });
});

// ---------------------------------------------------------------------------
// create_category (admin only, mirroring POST /api/categories)
// ---------------------------------------------------------------------------

describe('Tool: create_category', () => {
  it('persists the new category and credits the admin who minted it', async () => {
    const { user: admin } = createAdmin(testDb);
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({
        name: 'create_category',
        arguments: { name: 'Street food', color: '#16a34a', icon: '🍜' },
      });
      const data = parseToolResult(result) as any;
      const row = testDb.prepare('SELECT name, color, icon, user_id FROM categories WHERE id = ?').get(data.category.id) as any;
      expect(row).toEqual({ name: 'Street food', color: '#16a34a', icon: '🍜', user_id: admin.id });
    });
  });

  it('falls back to the palette defaults when color and icon are omitted', async () => {
    const { user: admin } = createAdmin(testDb);
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'create_category', arguments: { name: 'Bare minimum' } });
      const data = parseToolResult(result) as any;
      const row = testDb.prepare('SELECT color, icon FROM categories WHERE id = ?').get(data.category.id) as any;
      expect(row).toEqual({ color: '#6366f1', icon: '📍' });
    });
  });

  it('refuses a non-admin and writes nothing', async () => {
    const { user } = createUser(testDb);
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'create_category', arguments: { name: 'Sneaky' } });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT id FROM categories WHERE name = ?').get('Sneaky')).toBeUndefined();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createAdmin(testDb, { email: 'demo@trek.app' });
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'create_category', arguments: { name: 'Demo made this' } });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT id FROM categories WHERE name = ?').get('Demo made this')).toBeUndefined();
    });
  });

  it('refuses a color that is not a hex value', async () => {
    const { user: admin } = createAdmin(testDb);
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'create_category', arguments: { name: 'Bad colour', color: 'rebeccapurple' } });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT id FROM categories WHERE name = ?').get('Bad colour')).toBeUndefined();
    });
  });

  it('refuses an empty name', async () => {
    const { user: admin } = createAdmin(testDb);
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'create_category', arguments: { name: '' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_category (admin only, mirroring PUT /api/categories/:id)
// ---------------------------------------------------------------------------

describe('Tool: update_category', () => {
  it('renames and recolours an existing category', async () => {
    const { user: admin } = createAdmin(testDb);
    const id = insertCategory('Old name', '#111111', '🅰️');
    await withWriteHarness(admin.id, async (client) => {
      await client.callTool({ name: 'update_category', arguments: { categoryId: id, name: 'New name', color: '#dc2626' } });
      const row = testDb.prepare('SELECT name, color, icon FROM categories WHERE id = ?').get(id) as any;
      expect(row).toEqual({ name: 'New name', color: '#dc2626', icon: '🅰️' });
    });
  });

  it('leaves the fields it was not given alone', async () => {
    const { user: admin } = createAdmin(testDb);
    const id = insertCategory('Keep me', '#0891b2', '🚕');
    await withWriteHarness(admin.id, async (client) => {
      await client.callTool({ name: 'update_category', arguments: { categoryId: id, icon: '🚗' } });
      const row = testDb.prepare('SELECT name, color, icon FROM categories WHERE id = ?').get(id) as any;
      expect(row).toEqual({ name: 'Keep me', color: '#0891b2', icon: '🚗' });
    });
  });

  it('reports an unknown category', async () => {
    const { user: admin } = createAdmin(testDb);
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'update_category', arguments: { categoryId: 999999, name: 'Nope' } });
      expect(result.isError).toBe(true);
    });
  });

  it('refuses a non-admin and leaves the row untouched', async () => {
    const { user } = createUser(testDb);
    const id = insertCategory('Not yours', '#9333ea', '🔒');
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'update_category', arguments: { categoryId: id, name: 'Hijacked' } });
      expect(result.isError).toBe(true);
      expect((testDb.prepare('SELECT name FROM categories WHERE id = ?').get(id) as any).name).toBe('Not yours');
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createAdmin(testDb, { email: 'demo@trek.app' });
    const id = insertCategory('Demo untouchable', '#ea580c', '🙅');
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'update_category', arguments: { categoryId: id, name: 'Changed' } });
      expect(result.isError).toBe(true);
      expect((testDb.prepare('SELECT name FROM categories WHERE id = ?').get(id) as any).name).toBe('Demo untouchable');
    });
  });

  it('refuses a color that is not a hex value', async () => {
    const { user: admin } = createAdmin(testDb);
    const id = insertCategory('Colour guard', '#2563eb', '🎨');
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'update_category', arguments: { categoryId: id, color: 'goldenrod' } });
      expect(result.isError).toBe(true);
      expect((testDb.prepare('SELECT color FROM categories WHERE id = ?').get(id) as any).color).toBe('#2563eb');
    });
  });
});

// ---------------------------------------------------------------------------
// delete_category (admin only, mirroring DELETE /api/categories/:id)
// ---------------------------------------------------------------------------

describe('Tool: delete_category', () => {
  it('removes the category and unassigns the places that carried it', async () => {
    const { user: admin } = createAdmin(testDb);
    const id = insertCategory('Doomed', '#d97706', '💀');
    const trip = Number(testDb.prepare('INSERT INTO trips (user_id, title) VALUES (?, ?)').run(admin.id, 'Trip').lastInsertRowid);
    const place = Number(testDb.prepare('INSERT INTO places (trip_id, name, category_id) VALUES (?, ?, ?)').run(trip, 'Somewhere', id).lastInsertRowid);
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'delete_category', arguments: { categoryId: id } });
      expect((parseToolResult(result) as any).success).toBe(true);
      expect(testDb.prepare('SELECT id FROM categories WHERE id = ?').get(id)).toBeUndefined();
      expect((testDb.prepare('SELECT category_id FROM places WHERE id = ?').get(place) as any).category_id).toBeNull();
    });
  });

  it('reports an unknown category', async () => {
    const { user: admin } = createAdmin(testDb);
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'delete_category', arguments: { categoryId: 999999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('refuses a non-admin and keeps the row', async () => {
    const { user } = createUser(testDb);
    const id = insertCategory('Survivor', '#16a34a', '🌿');
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'delete_category', arguments: { categoryId: id } });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT id FROM categories WHERE id = ?').get(id)).toBeDefined();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createAdmin(testDb, { email: 'demo@trek.app' });
    const id = insertCategory('Demo survivor', '#0891b2', '🛟');
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'delete_category', arguments: { categoryId: id } });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT id FROM categories WHERE id = ?').get(id)).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// Scope gating (places:read for the listing, places:write for the palette
// writes, both registration-time via the declarative access markers)
// ---------------------------------------------------------------------------

describe('Category tools: scope gating', () => {
  const WRITE_TOOLS = ['create_category', 'update_category', 'delete_category'];

  async function listToolNames(userId: number, scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ userId, withResources: false, scopes });
    try {
      return (await h.client.listTools()).tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  it('registers with null scopes (full access)', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, null);
    expect(names).toContain('list_categories');
    for (const tool of WRITE_TOOLS) expect(names).toContain(tool);
  });

  it('registers with places:read', async () => {
    const { user } = createUser(testDb);
    expect(await listToolNames(user.id, ['places:read'])).toContain('list_categories');
  });

  it('registers no palette writes with places:read only', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['places:read']);
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool);
  });

  it('registers the palette writes with places:write', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['places:write']);
    for (const tool of WRITE_TOOLS) expect(names).toContain(tool);
  });

  it('does not register for an unrelated scope', async () => {
    const { user } = createUser(testDb);
    const names = await listToolNames(user.id, ['budget:read']);
    expect(names).not.toContain('list_categories');
    for (const tool of WRITE_TOOLS) expect(names).not.toContain(tool);
  });
});

// ---------------------------------------------------------------------------
// trek://categories resource (first production @Resource)
// ---------------------------------------------------------------------------

describe('Resource: trek://categories', () => {
  it('returns all categories', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://categories' });
      const categories = parseResourceResult(result) as any[];
      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('color');
      expect(categories[0]).toHaveProperty('icon');
    });
  });

  it('stays readable under restricted non-places scopes (legacy ungated behavior)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: 'trek://categories' });
      const categories = parseResourceResult(result) as any[];
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    }, ['trips:read']);
  });
});
