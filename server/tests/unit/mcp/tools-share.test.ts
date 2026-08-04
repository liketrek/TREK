/**
 * Unit tests for the share-link MCP surface (ShareMcp, DI-discovered):
 * get_share_link, create_share_link, delete_share_link — moved here from the
 * legacy src/mcp/tools/trips.ts registrar with the trip DI port. All three
 * ride the canShareTrips predicate (no declarative trips:share mode exists).
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
import { createUser, createTrip } from '../../helpers/factories';
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

describe('Tool: get_share_link', () => {
  it('returns null when the trip has no share link, then the token after creation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const empty = parseToolResult(await h.client.callTool({ name: 'get_share_link', arguments: { tripId: trip.id } })) as any;
      expect(empty.link).toBeNull();
      const created = parseToolResult(await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id } })) as any;
      const link = parseToolResult(await h.client.callTool({ name: 'get_share_link', arguments: { tripId: trip.id } })) as any;
      expect(link.link.token).toBe(created.token);
    });
  });

  it('returns access denied for a non-member trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_share_link', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

describe('Tool: create_share_link', () => {
  it('creates with the legacy defaults, then updates in place (created=false)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const first = parseToolResult(await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id } })) as any;
      expect(first.created).toBe(true);
      const row = testDb.prepare('SELECT share_map, share_bookings, share_packing, share_budget, share_collab FROM share_tokens WHERE trip_id = ?').get(trip.id) as any;
      expect(row).toEqual({ share_map: 1, share_bookings: 1, share_packing: 0, share_budget: 0, share_collab: 0 });
      const second = parseToolResult(await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id, share_budget: true } })) as any;
      expect(second.created).toBe(false);
      expect(second.token).toBe(first.token);
    });
  });

  it('denies without trip access; blocks demo users', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const foreign = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      expect((await h.client.callTool({ name: 'create_share_link', arguments: { tripId: foreign.id } })).isError).toBe(true);
    });
    process.env.DEMO_MODE = 'true';
    const { user: demo } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, demo.id);
    await withHarness(demo.id, async (h) => {
      expect((await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id } })).isError).toBe(true);
    });
  });
});

describe('Tool: delete_share_link', () => {
  it('revokes the link; denies without access', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_share_link', arguments: { tripId: trip.id } });
      const result = parseToolResult(await h.client.callTool({ name: 'delete_share_link', arguments: { tripId: trip.id } })) as any;
      expect(result.success).toBe(true);
      expect(testDb.prepare('SELECT id FROM share_tokens WHERE trip_id = ?').get(trip.id)).toBeUndefined();
    });
    const { user: stranger } = createUser(testDb);
    await withHarness(stranger.id, async (h) => {
      expect((await h.client.callTool({ name: 'delete_share_link', arguments: { tripId: trip.id } })).isError).toBe(true);
    });
  });
});
