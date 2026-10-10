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
import { db as testDb } from '../../../src/db/database';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { Client } from '@modelcontextprotocol/sdk/client/index';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory';
import { resetTestDb } from '../../helpers/test-db';
import { createUser, createAdmin } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { createTestRegistry } from '../../../src/nest-mcp';
import { trekDemoToolGate, trekMcpAccessPolicy, trekMcpValidateAccess } from '../../../src/mcp/nest-mcp-policy';
import { CategoriesMcp } from '../../../src/nest/categories/categories.mcp';
import { CategoriesService } from '../../../src/nest/categories/categories.service';
import { RuntimeEnvService } from '../../../src/nest/app-config/runtime-env.service';
import { DemoService } from '../../../src/nest/common/demo.service';
import { PermissionsService } from '../../../src/nest/permissions/permissions.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';
import { McpToolGuardsService } from '../../../src/nest/mcp-shared/mcp-tool-guards.service';
import { createTestUnitOfWork, createTestAppSettingsRepo, createTestCategoriesRepo, createTestTripsRepo, createTestUsersRepo, sharedTestOrm } from '../../helpers/test-uow';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { findRow } from '../../helpers/factories/rows';
import { makeCategory, makePlace } from '../../helpers/factories/places';
import { makeTrip } from '../../helpers/factories/trips';
import { Categories } from '../../../src/db/entities/Categories.entity';
import { Places } from '../../../src/db/entities/Places.entity';

let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});

async function categoryRow(id: number) {
  return (await findRow(orm, Categories, { id }))!;
}

beforeEach(() => {
  resetTestDb(testDb);
  delete process.env.DEMO_MODE;
});

afterAll(async () => {
  await orm.close();
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
let categoriesMcp: CategoriesMcp;
let categoriesDemo: DemoService;
beforeAll(async () => {
  const categoriesEm = (await sharedTestOrm(testDb)).em;
  categoriesMcp = new CategoriesMcp(
  new CategoriesService(await createTestCategoriesRepo(testDb)),
  new RuntimeEnvService(),
  new McpToolGuardsService(await createTestTripsRepo(testDb), await createTestUsersRepo(testDb), new PermissionsService(await createTestAppSettingsRepo(testDb), await createTestUnitOfWork(testDb)), new RealtimeService()),
);
  categoriesDemo = new DemoService(new RuntimeEnvService(), categoriesEm);
});

async function withWriteHarness(userId: number, fn: (client: Client) => Promise<void>) {
  const server = new McpServer({ name: 'trek-test', version: '1.0.0' });
  await createTestRegistry([categoriesMcp], { accessPolicy: trekMcpAccessPolicy, validateAccess: trekMcpValidateAccess, toolGate: trekDemoToolGate((id) => categoriesDemo.isDemoUserId(id)) })
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

async function insertCategory(name: string, color = '#111111', icon = '🅰️'): Promise<number> {
  return (await makeCategory(orm, { name, color, icon })).id;
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
    await makeCategory(orm, { name: 'Zzz Mine', color: '#111111', icon: '🅰️', user: user.id });
    await makeCategory(orm, { name: 'Zzz Other', color: '#222222', icon: '🅱️', user: other.id });
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
      const { name, color, icon, user_id } = await categoryRow(data.category.id);
      expect({ name, color, icon, user_id }).toEqual({ name: 'Street food', color: '#16a34a', icon: '🍜', user_id: admin.id });
    });
  });

  it('falls back to the palette defaults when color and icon are omitted', async () => {
    const { user: admin } = createAdmin(testDb);
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'create_category', arguments: { name: 'Bare minimum' } });
      const data = parseToolResult(result) as any;
      const { color, icon } = await categoryRow(data.category.id);
      expect({ color, icon }).toEqual({ color: '#6366f1', icon: '📍' });
    });
  });

  it('refuses a non-admin and writes nothing', async () => {
    const { user } = createUser(testDb);
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'create_category', arguments: { name: 'Sneaky' } });
      expect(result.isError).toBe(true);
      expect(await findRow(orm, Categories, { name: 'Sneaky' })).toBeNull();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createAdmin(testDb, { email: 'demo@trek.app' });
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'create_category', arguments: { name: 'Demo made this' } });
      expect(result.isError).toBe(true);
      expect(await findRow(orm, Categories, { name: 'Demo made this' })).toBeNull();
    });
  });

  it('refuses a color that is not a hex value', async () => {
    const { user: admin } = createAdmin(testDb);
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'create_category', arguments: { name: 'Bad colour', color: 'rebeccapurple' } });
      expect(result.isError).toBe(true);
      expect(await findRow(orm, Categories, { name: 'Bad colour' })).toBeNull();
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
    const id = await insertCategory('Old name', '#111111', '🅰️');
    await withWriteHarness(admin.id, async (client) => {
      await client.callTool({ name: 'update_category', arguments: { categoryId: id, name: 'New name', color: '#dc2626' } });
      const { name, color, icon } = await categoryRow(id);
      const row = { name, color, icon };
      expect(row).toEqual({ name: 'New name', color: '#dc2626', icon: '🅰️' });
    });
  });

  it('leaves the fields it was not given alone', async () => {
    const { user: admin } = createAdmin(testDb);
    const id = await insertCategory('Keep me', '#0891b2', '🚕');
    await withWriteHarness(admin.id, async (client) => {
      await client.callTool({ name: 'update_category', arguments: { categoryId: id, icon: '🚗' } });
      const { name, color, icon } = await categoryRow(id);
      const row = { name, color, icon };
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
    const id = await insertCategory('Not yours', '#9333ea', '🔒');
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'update_category', arguments: { categoryId: id, name: 'Hijacked' } });
      expect(result.isError).toBe(true);
      expect((await categoryRow(id)).name).toBe('Not yours');
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createAdmin(testDb, { email: 'demo@trek.app' });
    const id = await insertCategory('Demo untouchable', '#ea580c', '🙅');
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'update_category', arguments: { categoryId: id, name: 'Changed' } });
      expect(result.isError).toBe(true);
      expect((await categoryRow(id)).name).toBe('Demo untouchable');
    });
  });

  it('refuses a color that is not a hex value', async () => {
    const { user: admin } = createAdmin(testDb);
    const id = await insertCategory('Colour guard', '#2563eb', '🎨');
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'update_category', arguments: { categoryId: id, color: 'goldenrod' } });
      expect(result.isError).toBe(true);
      expect((await categoryRow(id)).color).toBe('#2563eb');
    });
  });
});

// ---------------------------------------------------------------------------
// delete_category (admin only, mirroring DELETE /api/categories/:id)
// ---------------------------------------------------------------------------

describe('Tool: delete_category', () => {
  it('removes the category and unassigns the places that carried it', async () => {
    const { user: admin } = createAdmin(testDb);
    const id = await insertCategory('Doomed', '#d97706', '💀');
    const { id: trip } = await makeTrip(orm, admin.id, { title: 'Trip' });
    const { id: place } = await makePlace(orm, trip, { name: 'Somewhere', category: id });
    await withWriteHarness(admin.id, async (client) => {
      const result = await client.callTool({ name: 'delete_category', arguments: { categoryId: id } });
      expect((parseToolResult(result) as any).success).toBe(true);
      expect(await findRow(orm, Categories, { id })).toBeNull();
      expect((await findRow(orm, Places, { id: place }))!.category_id).toBeNull();
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
    const id = await insertCategory('Survivor', '#16a34a', '🌿');
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'delete_category', arguments: { categoryId: id } });
      expect(result.isError).toBe(true);
      expect(await findRow(orm, Categories, { id })).not.toBeNull();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createAdmin(testDb, { email: 'demo@trek.app' });
    const id = await insertCategory('Demo survivor', '#0891b2', '🛟');
    await withWriteHarness(user.id, async (client) => {
      const result = await client.callTool({ name: 'delete_category', arguments: { categoryId: id } });
      expect(result.isError).toBe(true);
      expect(await findRow(orm, Categories, { id })).not.toBeNull();
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
