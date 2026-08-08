/**
 * Unit tests for the DI-discovered DaysMcp: the update_day tool and the
 * trek://trips/{tripId}/days resource (moved from resources.test.ts when the
 * legacy registrar was ported).
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
import { createUser, createTrip, createDay, createPlace, createDayAssignment } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';

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
// update_day
// ---------------------------------------------------------------------------

describe('Tool: update_day', () => {
  it('sets a day title', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_day',
        arguments: { tripId: trip.id, dayId: day.id, title: 'Arrival in Paris' },
      });
      const data = parseToolResult(result) as any;
      expect(data.day.title).toBe('Arrival in Paris');
    });
  });

  it('clears a day title with null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { title: 'Old Title' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_day',
        arguments: { tripId: trip.id, dayId: day.id, title: null },
      });
      const data = parseToolResult(result) as any;
      expect(data.day.title).toBeNull();
    });
  });

  it('setting a title preserves the day notes (post-port defect fix)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    testDb.prepare('UPDATE days SET notes = ? WHERE id = ?').run('Walking day', day.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_day',
        arguments: { tripId: trip.id, dayId: day.id, title: 'Arrival' },
      });
      const data = parseToolResult(result) as { day: { title: string; notes: string } };
      expect(data.day).toMatchObject({ title: 'Arrival', notes: 'Walking day' });
    });
  });

  it('broadcasts day:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_day', arguments: { tripId: trip.id, dayId: day.id, title: 'Day 1' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'day:updated', expect.any(Object));
    });
  });

  it('returns error when day does not belong to trip', async () => {
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const dayFromTrip2 = createDay(testDb, trip2.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_day',
        arguments: { tripId: trip1.id, dayId: dayFromTrip2.id, title: 'X' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_day', arguments: { tripId: trip.id, dayId: day.id, title: 'X' } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_day', arguments: { tripId: trip.id, dayId: day.id, title: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// trek://trips/{tripId}/days resource (moved from resources.test.ts)
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/days', () => {
  it('returns days with assignments in order', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id, { day_number: 1 });
    const day2 = createDay(testDb, trip.id, { day_number: 2 });
    const place = createPlace(testDb, trip.id);
    createDayAssignment(testDb, day1.id, place.id);
    void day2;

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/days` });
      const days = parseResourceResult(result) as any[];
      expect(days).toHaveLength(2);
      expect(days[0].day_number).toBe(1);
      expect(days[0].assignments).toHaveLength(1);
      expect(days[1].day_number).toBe(2);
      expect(days[1].assignments).toHaveLength(0);
    });
  });

  it('returns access denied for unauthorized trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/days` });
      const data = parseResourceResult(result) as any;
      expect(data.error).toBeTruthy();
    });
  });
});
