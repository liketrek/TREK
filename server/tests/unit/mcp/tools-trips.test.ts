/**
 * Unit tests for MCP trip tools: create_trip, update_trip, delete_trip, list_trips, get_trip_summary.
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
import { createUser, createTrip, createDay, createPlace, addTripMember, createBudgetItem, createPackingItem, createReservation, createDayNote, createCollabNote, createDayAssignment, createDayAccommodation } from '../../helpers/factories';
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

// ---------------------------------------------------------------------------
// create_trip
// ---------------------------------------------------------------------------

describe('Tool: create_trip', () => {
  it('creates a trip with title only and generates 7 default days', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_trip', arguments: { title: 'Summer Escape' } });
      const data = parseToolResult(result) as any;
      expect(data.trip).toBeTruthy();
      expect(data.trip.title).toBe('Summer Escape');
      const days = testDb.prepare('SELECT COUNT(*) as c FROM days WHERE trip_id = ?').get(data.trip.id) as { c: number };
      expect(days.c).toBe(7);
    });
  });

  it('creates a trip with dates and auto-generates correct number of days', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_trip',
        arguments: { title: 'Paris Trip', start_date: '2026-07-01', end_date: '2026-07-05' },
      });
      const data = parseToolResult(result) as any;
      const days = testDb.prepare('SELECT COUNT(*) as c FROM days WHERE trip_id = ?').get(data.trip.id) as { c: number };
      expect(days.c).toBe(5);
    });
  });

  it('caps days at 90 for very long trips', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_trip',
        arguments: { title: 'Long Trip', start_date: '2026-01-01', end_date: '2027-12-31' },
      });
      const data = parseToolResult(result) as any;
      const days = testDb.prepare('SELECT COUNT(*) as c FROM days WHERE trip_id = ?').get(data.trip.id) as { c: number };
      expect(days.c).toBe(90);
    });
  });

  it('returns error for invalid start_date format', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_trip', arguments: { title: 'Trip', start_date: 'not-a-date' } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns error when end_date is before start_date', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_trip',
        arguments: { title: 'Trip', start_date: '2026-07-05', end_date: '2026-07-01' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_trip', arguments: { title: 'Demo Trip' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_trip
// ---------------------------------------------------------------------------

describe('Tool: update_trip', () => {
  it('updates trip title', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Old Title' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, title: 'New Title' } });
      const data = parseToolResult(result) as any;
      expect(data.trip.title).toBe('New Title');
    });
  });

  it('partial update preserves unspecified fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'My Trip', description: 'A great trip' });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, title: 'Renamed' } });
      const updated = testDb.prepare('SELECT * FROM trips WHERE id = ?').get(trip.id) as any;
      expect(updated.title).toBe('Renamed');
      expect(updated.description).toBe('A great trip');
    });
  });

  it('broadcasts trip:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, title: 'Updated' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'trip:updated', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, title: 'Hack' } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, title: 'New' } });
      expect(result.isError).toBe(true);
    });
  });

  it('shifts owner vacay entries when update_trip moves trip window by fixed offset', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-08-01', end_date: '2026-08-09' });

    // Materialize active vacay plan for owner and entries in old trip window.
    const planRes = testDb.prepare('INSERT INTO vacay_plans (owner_id) VALUES (?)').run(user.id);
    const planId = Number(planRes.lastInsertRowid);
    testDb.prepare('INSERT INTO vacay_years (plan_id, year) VALUES (?, ?)').run(planId, 2026);
    testDb.prepare(
        'INSERT INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, 30, 0)'
    ).run(user.id, planId, 2026);
    for (const d of ['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07']) {
      testDb.prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)').run(planId, user.id, d, '');
    }

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip',
        arguments: { tripId: trip.id, start_date: '2026-08-08', end_date: '2026-08-16' },
      });
      const data = parseToolResult(result) as any;
      expect(data.trip.start_date).toBe('2026-08-08');
      expect(data.trip.end_date).toBe('2026-08-16');
    });

    const oldWindow = testDb.prepare(
        "SELECT date FROM vacay_entries WHERE plan_id = ? AND user_id = ? AND date BETWEEN '2026-08-01' AND '2026-08-09'"
    ).all(planId, user.id) as { date: string }[];
    expect(oldWindow).toHaveLength(0);

    const shifted = testDb.prepare(
        "SELECT date FROM vacay_entries WHERE plan_id = ? AND user_id = ? AND date BETWEEN '2026-08-08' AND '2026-08-16' ORDER BY date"
    ).all(planId, user.id) as { date: string }[];
    expect(shifted.map(r => r.date)).toEqual([
      '2026-08-10',
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
      '2026-08-14',
    ]);
  });

  it('shifts entries from the owners own plan even if another vacay plan is active', async () => {
    const { user } = createUser(testDb);
    const { user: otherOwner } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-07' });

    // Own plan with entries that should be shifted.
    const ownPlanRes = testDb.prepare('INSERT INTO vacay_plans (owner_id) VALUES (?)').run(user.id);
    const ownPlanId = Number(ownPlanRes.lastInsertRowid);
    testDb.prepare('INSERT INTO vacay_years (plan_id, year) VALUES (?, ?)').run(ownPlanId, 2026);
    testDb.prepare(
        'INSERT INTO vacay_user_years (user_id, plan_id, year, vacation_days, carried_over) VALUES (?, ?, ?, 30, 0)'
    ).run(user.id, ownPlanId, 2026);
    for (const d of ['2026-09-02', '2026-09-03']) {
      testDb.prepare('INSERT INTO vacay_entries (plan_id, user_id, date, note) VALUES (?, ?, ?, ?)').run(ownPlanId, user.id, d, '');
    }

    // Different accepted plan becomes "active" for the owner.
    const foreignPlanRes = testDb.prepare('INSERT INTO vacay_plans (owner_id) VALUES (?)').run(otherOwner.id);
    const foreignPlanId = Number(foreignPlanRes.lastInsertRowid);
    testDb.prepare('INSERT INTO vacay_plan_members (plan_id, user_id, status) VALUES (?, ?, ?)').run(foreignPlanId, user.id, 'accepted');

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip',
        arguments: { tripId: trip.id, start_date: '2026-09-08', end_date: '2026-09-14' },
      });
      expect(result.isError).toBeFalsy();
    });

    const oldWindow = testDb.prepare(
        "SELECT date FROM vacay_entries WHERE plan_id = ? AND user_id = ? AND date BETWEEN '2026-09-01' AND '2026-09-07' ORDER BY date"
    ).all(ownPlanId, user.id) as { date: string }[];
    expect(oldWindow).toHaveLength(0);

    const shifted = testDb.prepare(
        "SELECT date FROM vacay_entries WHERE plan_id = ? AND user_id = ? AND date BETWEEN '2026-09-08' AND '2026-09-14' ORDER BY date"
    ).all(ownPlanId, user.id) as { date: string }[];
    expect(shifted.map(r => r.date)).toEqual(['2026-09-09', '2026-09-10']);
  });
});

// ---------------------------------------------------------------------------
// delete_trip
// ---------------------------------------------------------------------------

describe('Tool: delete_trip', () => {
  it('owner can delete trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_trip', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      const gone = testDb.prepare('SELECT id FROM trips WHERE id = ?').get(trip.id);
      expect(gone).toBeUndefined();
    });
  });

  it('non-owner member cannot delete trip', async () => {
    const { user } = createUser(testDb);
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_trip', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
      const stillExists = testDb.prepare('SELECT id FROM trips WHERE id = ?').get(trip.id);
      expect(stillExists).toBeTruthy();
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_trip', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// list_trips
// ---------------------------------------------------------------------------

describe('Tool: list_trips', () => {
  it('returns owned and member trips', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'My Trip' });
    const shared = createTrip(testDb, other.id, { title: 'Shared' });
    addTripMember(testDb, shared.id, user.id);
    createTrip(testDb, other.id, { title: 'Inaccessible' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_trips', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.trips).toHaveLength(2);
      const titles = data.trips.map((t: any) => t.title);
      expect(titles).toContain('My Trip');
      expect(titles).toContain('Shared');
    });
  });

  it('excludes archived trips by default', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Active' });
    const archived = createTrip(testDb, user.id, { title: 'Archived' });
    testDb.prepare('UPDATE trips SET is_archived = 1 WHERE id = ?').run(archived.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_trips', arguments: {} });
      const data = parseToolResult(result) as any;
      expect(data.trips).toHaveLength(1);
      expect(data.trips[0].title).toBe('Active');
    });
  });

  it('includes archived trips when include_archived is true', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Active' });
    const archived = createTrip(testDb, user.id, { title: 'Archived' });
    testDb.prepare('UPDATE trips SET is_archived = 1 WHERE id = ?').run(archived.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_trips', arguments: { include_archived: true } });
      const data = parseToolResult(result) as any;
      expect(data.trips).toHaveLength(2);
    });
  });
});

// ---------------------------------------------------------------------------
// get_trip_summary
// ---------------------------------------------------------------------------

describe('Tool: get_trip_summary', () => {
  it('returns full denormalized trip snapshot', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Full Trip' });
    addTripMember(testDb, trip.id, member.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Colosseum' });
    const assignment = createDayAssignment(testDb, day.id, place.id);
    createDayNote(testDb, day.id, trip.id, { text: 'Check in' });
    createBudgetItem(testDb, trip.id, { name: 'Hotel', total_price: 300 });
    createPackingItem(testDb, trip.id, { name: 'Passport' });
    createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
    createCollabNote(testDb, trip.id, user.id, { title: 'Plan' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      expect(data.trip.title).toBe('Full Trip');
      expect(data.members.owner.id).toBe(user.id);
      expect(data.members.collaborators).toHaveLength(1);
      expect(data.days).toHaveLength(1);
      expect(data.days[0].assignments).toHaveLength(1);
      expect(data.days[0].notes).toHaveLength(1);
      expect(data.budget.item_count).toBe(1);
      expect(data.budget.total).toBe(300);
      expect(data.packing.total).toBe(1);
      expect(data.reservations).toHaveLength(1);
      expect(data.collab_notes).toHaveLength(1);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });

  it('is not blocked for demo user (read-only tool)', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id, { title: 'Demo Trip' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      expect(result.isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.trip.title).toBe('Demo Trip');
    });
  });

  it('includes todos, files, pollCount, messageCount in response', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Summary Test' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.todos)).toBe(true);
      expect(typeof data.pollCount).toBe('number');
      expect(typeof data.messageCount).toBe('number');
    });
  });
});
