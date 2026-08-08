/**
 * Unit tests for the categories MCP surface (CategoriesMcp, DI-discovered):
 * the list_categories tool and the trek://categories resource.
 *
 * Both attach via the nest-mcp registry inside registerTools, so every harness
 * here keeps withTools on (the resource is NOT registered by the legacy
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

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';

beforeAll(() => {
  createTables(testDb);
  runMigrations(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
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
// list_categories scope gating (places:read, registration-time)
// ---------------------------------------------------------------------------

describe('Tool: list_categories — scope gating', () => {
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
    expect(await listToolNames(user.id, null)).toContain('list_categories');
  });

  it('registers with places:read', async () => {
    const { user } = createUser(testDb);
    expect(await listToolNames(user.id, ['places:read'])).toContain('list_categories');
  });

  it('does not register for an unrelated scope', async () => {
    const { user } = createUser(testDb);
    expect(await listToolNames(user.id, ['budget:read'])).not.toContain('list_categories');
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
