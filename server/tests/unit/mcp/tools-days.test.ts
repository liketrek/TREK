/**
 * Unit tests for the DI-discovered DaysMcp: the update_day and reorder_days
 * tools, create_day's mid-trip insert, and the trek://trips/{tripId}/days
 * resource (moved from resources.test.ts when the legacy registrar was ported).
 * create_day's plain append is covered in tools-days-accommodations.test.ts.
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
import {
  createUser, createTrip, createDay, createPlace, createDayAssignment, createDayAccommodation,
} from '../../helpers/factories';
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

/** The stored day row, which is what a tool's echo can disagree with. */
function dayRow(dayId: number) {
  return testDb.prepare('SELECT title, notes, day_number, date FROM days WHERE id = ?').get(dayId) as
    { title: string | null; notes: string | null; day_number: number; date: string | null };
}

/** Day ids of a trip in stored order, so a reorder can be read back positionally. */
function dayIdsInOrder(tripId: number): number[] {
  return (testDb.prepare('SELECT id FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number }[])
    .map(r => r.id);
}

function dayDatesInOrder(tripId: number): (string | null)[] {
  return (testDb.prepare('SELECT date FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { date: string | null }[])
    .map(r => r.date);
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

  it('writes notes without being sent a title, and keeps the title', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { title: 'Arrival in Paris' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_day',
        arguments: { tripId: trip.id, dayId: day.id, notes: 'Ferry leaves at 08:00' },
      });
      const data = parseToolResult(result) as { day: { notes: string } };
      expect(data.day.notes).toBe('Ferry leaves at 08:00');
    });

    expect(dayRow(day.id)).toMatchObject({ title: 'Arrival in Paris', notes: 'Ferry leaves at 08:00' });
  });

  it('sets a title and notes in one call', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_day',
        arguments: { tripId: trip.id, dayId: day.id, title: 'Free day', notes: 'Nothing booked' },
      });
    });

    expect(dayRow(day.id)).toMatchObject({ title: 'Free day', notes: 'Nothing booked' });
  });

  it('clears the notes with an empty string', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { title: 'Arrival' });
    testDb.prepare('UPDATE days SET notes = ? WHERE id = ?').run('Ferry leaves at 08:00', day.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_day',
        arguments: { tripId: trip.id, dayId: day.id, notes: '' },
      });
    });

    expect(dayRow(day.id)).toMatchObject({ title: 'Arrival', notes: null });
  });

  it('refuses a non-string notes value', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_day',
        arguments: { tripId: trip.id, dayId: day.id, notes: 42 },
      });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toContain('Invalid arguments');
    });

    expect(dayRow(day.id).notes).toBeNull();
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
// create_day with a position (the mid-trip insert behind POST /days)
// ---------------------------------------------------------------------------

describe('Tool: create_day (position)', () => {
  it('inserts an empty day into the middle of a dateless trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);
    const d3 = createDay(testDb, trip.id);

    let insertedId = 0;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day',
        arguments: { tripId: trip.id, position: 2 },
      });
      insertedId = (parseToolResult(result) as { day: { id: number } }).day.id;
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d1.id, insertedId, d2.id, d3.id]);
    expect(dayRow(insertedId)).toMatchObject({ day_number: 2, date: null });
  });

  it('re-pins the dates and extends the trip when inserting into a dated trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-03' });
    const [d1, d2, d3] = dayIdsInOrder(trip.id);

    let insertedId = 0;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day',
        // date and notes are ignored next to a position, exactly as on REST.
        arguments: { tripId: trip.id, position: 2, date: '2030-01-01', notes: 'ignored' },
      });
      insertedId = (parseToolResult(result) as { day: { id: number } }).day.id;
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d1, insertedId, d2, d3]);
    expect(dayDatesInOrder(trip.id)).toEqual(['2025-06-01', '2025-06-02', '2025-06-03', '2025-06-04']);
    expect(dayRow(insertedId)).toMatchObject({ date: '2025-06-02', notes: null });
    expect(testDb.prepare('SELECT end_date FROM trips WHERE id = ?').get(trip.id)).toEqual({ end_date: '2025-06-04' });
  });

  it('appends when position is omitted and still honours date and notes', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id);

    let appendedId = 0;
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day',
        arguments: { tripId: trip.id, date: '2025-06-15', notes: 'Arrival day' },
      });
      appendedId = (parseToolResult(result) as { day: { id: number } }).day.id;
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d1.id, appendedId]);
    expect(dayRow(appendedId)).toMatchObject({ date: '2025-06-15', notes: 'Arrival day' });
  });

  it('broadcasts day:reordered for an insert and day:created for an append', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_day', arguments: { tripId: trip.id, position: 1 } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'day:reordered', expect.any(Object));
      expect(broadcastMock).not.toHaveBeenCalledWith(trip.id, 'day:created', expect.any(Object));

      broadcastMock.mockClear();
      await h.client.callTool({ name: 'create_day', arguments: { tripId: trip.id } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'day:created', expect.any(Object));
    });
  });

  it('refuses a position below 1', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day',
        arguments: { tripId: trip.id, position: 0 },
      });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toContain('Invalid arguments');
    });

    expect(dayIdsInOrder(trip.id)).toHaveLength(1);
  });

  it('refuses an insert that would invert a stay, leaving the trip untouched', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-03' });
    const [d1, d2, d3] = dayIdsInOrder(trip.id);
    const place = createPlace(testDb, trip.id);
    // The stay ends on the last day, so pushing a day in front of its start
    // cannot invert it; anchoring it the other way round is what does.
    createDayAccommodation(testDb, trip.id, place.id, d3, d1);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day',
        arguments: { tripId: trip.id, position: 2 },
      });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toContain('accommodation');
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d1, d2, d3]);
    expect(dayDatesInOrder(trip.id)).toEqual(['2025-06-01', '2025-06-02', '2025-06-03']);
  });

  it('blocks demo user on an insert', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_day', arguments: { tripId: trip.id, position: 1 } });
      expect(result.isError).toBe(true);
    });
    expect(dayIdsInOrder(trip.id)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// reorder_days
// ---------------------------------------------------------------------------

describe('Tool: reorder_days', () => {
  it('renumbers the days and carries each day content along', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id, { title: 'First' });
    const d2 = createDay(testDb, trip.id, { title: 'Second' });
    const d3 = createDay(testDb, trip.id, { title: 'Third' });
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, d3.id, place.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_days',
        arguments: { tripId: trip.id, orderedIds: [d3.id, d1.id, d2.id] },
      });
      expect(parseToolResult(result)).toEqual({ success: true });
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d3.id, d1.id, d2.id]);
    expect(dayRow(d3.id)).toMatchObject({ day_number: 1, title: 'Third' });
    expect(testDb.prepare('SELECT day_id FROM day_assignments WHERE id = ?').get(assignment.id))
      .toEqual({ day_id: d3.id });
  });

  it('keeps the dates pinned to their slots so the content moves across them', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-03' });
    const [d1, d2, d3] = dayIdsInOrder(trip.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'reorder_days',
        arguments: { tripId: trip.id, orderedIds: [d3, d1, d2] },
      });
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d3, d1, d2]);
    expect(dayDatesInOrder(trip.id)).toEqual(['2025-06-01', '2025-06-02', '2025-06-03']);
    expect(dayRow(d3).date).toBe('2025-06-01');
  });

  it('broadcasts day:reordered with the ordered ids', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'reorder_days', arguments: { tripId: trip.id, orderedIds: [d2.id, d1.id] } });
    });

    expect(broadcastMock).toHaveBeenCalledWith(
      trip.id,
      'day:reordered',
      expect.objectContaining({ orderedIds: [d2.id, d1.id] }),
    );
  });

  it('refuses a list that is not a permutation of the trip days', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);
    const d3 = createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_days',
        arguments: { tripId: trip.id, orderedIds: [d2.id, d1.id] },
      });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toContain('permutation');
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d1.id, d2.id, d3.id]);
    expect(broadcastMock).not.toHaveBeenCalled();
  });

  it('refuses a day id from another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);
    const foreign = createDay(testDb, other.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_days',
        arguments: { tripId: trip.id, orderedIds: [d1.id, foreign.id] },
      });
      expect(result.isError).toBe(true);
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d1.id, d2.id]);
    expect(dayRow(foreign.id).day_number).toBe(1);
  });

  it('refuses a move that would make a stay end before it starts, and rolls back', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2025-06-01', end_date: '2025-06-03' });
    const [d1, d2, d3] = dayIdsInOrder(trip.id);
    const place = createPlace(testDb, trip.id);
    createDayAccommodation(testDb, trip.id, place.id, d1, d2);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_days',
        arguments: { tripId: trip.id, orderedIds: [d2, d1, d3] },
      });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toContain('accommodation');
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d1, d2, d3]);
    expect(broadcastMock).not.toHaveBeenCalled();
  });

  it('refuses an empty list', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_days',
        arguments: { tripId: trip.id, orderedIds: [] },
      });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toContain('Invalid arguments');
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_days',
        arguments: { tripId: trip.id, orderedIds: [d2.id, d1.id] },
      });
      expect(result.isError).toBe(true);
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d1.id, d2.id]);
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_days',
        arguments: { tripId: trip.id, orderedIds: [d2.id, d1.id] },
      });
      expect(result.isError).toBe(true);
    });

    expect(dayIdsInOrder(trip.id)).toEqual([d1.id, d2.id]);
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
