/**
 * Unit tests for MCP journey write tools focused on response hydration:
 * create_journey returns the full journey (entries/contributors/trips/stats/my_role),
 * and create_journey_entry returns the enriched entry (parsed tags, photos array).
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
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock, broadcastToUser: broadcastMock }));

vi.mock('../../../src/services/adminService', async (importOriginal) => {
  const original = await importOriginal() as Record<string, unknown>;
  return { ...original, isAddonEnabled: vi.fn().mockReturnValue(true) };
});

import { createTables } from '../../../src/db/schema';
import { runMigrations } from '../../../src/db/migrations';
import { resetTestDb } from '../../helpers/test-db';
import { createUser } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';

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

describe('Tool: create_journey', () => {
  it('returns the fully-hydrated journey, not a bare row', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_journey',
        arguments: { title: 'Eurotrip', subtitle: '2026' },
      });
      const data = parseToolResult(result) as any;
      expect(data.journey.title).toBe('Eurotrip');
      // hydrated shape from getJourneyFull
      expect(Array.isArray(data.journey.entries)).toBe(true);
      expect(Array.isArray(data.journey.contributors)).toBe(true);
      expect(Array.isArray(data.journey.trips)).toBe(true);
      expect(data.journey.stats).toBeDefined();
      expect(data.journey.my_role).toBeDefined();
    });
  });
});

describe('Tool: create_journey_entry', () => {
  it('returns the enriched entry with parsed tags and a photos array', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = (parseToolResult(await h.client.callTool({
        name: 'create_journey', arguments: { title: 'J' },
      })) as any).journey;
      const result = await h.client.callTool({
        name: 'create_journey_entry',
        arguments: { journeyId: journey.id, entry_date: '2026-07-01', title: 'Day 1', story: 'Arrived' },
      });
      const data = parseToolResult(result) as any;
      expect(data.entry.title).toBe('Day 1');
      // listEntries enrichment: tags parsed to an array, photos present
      expect(Array.isArray(data.entry.tags)).toBe(true);
      expect(Array.isArray(data.entry.photos)).toBe(true);
      expect(data.entry).toHaveProperty('source_trip_name');
    });
  });
});

describe('Tool: update_journey_entry', () => {
  it('returns the enriched entry (parsed tags, photos array)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = (parseToolResult(await h.client.callTool({
        name: 'create_journey', arguments: { title: 'J' },
      })) as any).journey;
      const entry = (parseToolResult(await h.client.callTool({
        name: 'create_journey_entry', arguments: { journeyId: journey.id, entry_date: '2026-07-01', title: 'Day 1' },
      })) as any).entry;
      const result = await h.client.callTool({
        name: 'update_journey_entry',
        arguments: { entryId: entry.id, title: 'Day 1 (edited)' },
      });
      const data = parseToolResult(result) as any;
      expect(data.entry.title).toBe('Day 1 (edited)');
      expect(Array.isArray(data.entry.tags)).toBe(true);
      expect(Array.isArray(data.entry.photos)).toBe(true);
    });
  });
});

describe('Tool: update_journey_preferences', () => {
  it('returns the updated preference, not { success }', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const journey = (parseToolResult(await h.client.callTool({
        name: 'create_journey', arguments: { title: 'J' },
      })) as any).journey;
      const result = await h.client.callTool({
        name: 'update_journey_preferences',
        arguments: { journeyId: journey.id, hide_skeletons: true },
      });
      const data = parseToolResult(result) as any;
      expect(data.hide_skeletons).toBe(true);
    });
  });
});
