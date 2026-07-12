/**
 * Unit tests for MCP assignment tools: assign_place_to_day, unassign_place,
 * reorder_day_assignments, update_assignment_time.
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
import { createUser, createTrip, createDay, createPlace, createDayAssignment, createJourney } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';

/** Link a journey to a trip so reconcileTripSkeletons has a target. */
function linkJourney(journeyId: number, tripId: number) {
  testDb.prepare('INSERT INTO journey_trips (journey_id, trip_id, added_at) VALUES (?, ?, ?)').run(journeyId, tripId, Date.now());
}
function skeletonFor(journeyId: number, placeId: number) {
  return testDb.prepare('SELECT * FROM journey_entries WHERE journey_id = ? AND source_place_id = ?').get(journeyId, placeId) as any;
}

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
// assign_place_to_day
// ---------------------------------------------------------------------------

describe('Tool: assign_place_to_day', () => {
  it('assigns a place to a day', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip.id, dayId: day.id, placeId: place.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignment).toBeTruthy();
      expect(data.assignment.day_id).toBe(day.id);
      expect(data.assignment.place_id).toBe(place.id);
      expect(data.assignment.order_index).toBe(0);
    });
  });

  it('creates a skeleton suggestion in a linked journey', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Linked Place' });
    const journey = createJourney(testDb, user.id);
    linkJourney(journey.id, trip.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip.id, dayId: day.id, placeId: place.id },
      });
      const skeleton = skeletonFor(journey.id, place.id);
      expect(skeleton).toBeDefined();
      expect(skeleton.type).toBe('skeleton');
      expect(skeleton.title).toBe('Linked Place');
    });
  });

  it('auto-increments order_index for subsequent assignments', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place1 = createPlace(testDb, trip.id, { name: 'P1' });
    const place2 = createPlace(testDb, trip.id, { name: 'P2' });
    createDayAssignment(testDb, day.id, place1.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip.id, dayId: day.id, placeId: place2.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignment.order_index).toBe(1);
    });
  });

  it('broadcasts assignment:created event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'assign_place_to_day', arguments: { tripId: trip.id, dayId: day.id, placeId: place.id } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:created', expect.any(Object));
    });
  });

  it('returns error when day does not belong to trip', async () => {
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const dayFromTrip2 = createDay(testDb, trip2.id);
    const place = createPlace(testDb, trip1.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip1.id, dayId: dayFromTrip2.id, placeId: place.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns error when place does not belong to trip', async () => {
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const day = createDay(testDb, trip1.id);
    const placeFromTrip2 = createPlace(testDb, trip2.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip1.id, dayId: day.id, placeId: placeFromTrip2.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'assign_place_to_day', arguments: { tripId: trip.id, dayId: day.id, placeId: place.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// unassign_place
// ---------------------------------------------------------------------------

describe('Tool: unassign_place', () => {
  it('removes a place assignment from a day', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'unassign_place',
        arguments: { tripId: trip.id, dayId: day.id, assignmentId: assignment.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(testDb.prepare('SELECT id FROM day_assignments WHERE id = ?').get(assignment.id)).toBeUndefined();
    });
  });

  it('broadcasts assignment:deleted event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'unassign_place', arguments: { tripId: trip.id, dayId: day.id, assignmentId: assignment.id } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:deleted', expect.any(Object));
    });
  });

  it('removes the linked journey skeleton when the place is unassigned', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const journey = createJourney(testDb, user.id);
    linkJourney(journey.id, trip.id);

    await withHarness(user.id, async (h) => {
      // Assign via MCP (materialises the skeleton), then unassign that same assignment.
      const assigned = parseToolResult(
        await h.client.callTool({ name: 'assign_place_to_day', arguments: { tripId: trip.id, dayId: day.id, placeId: place.id } }),
      ) as any;
      expect(skeletonFor(journey.id, place.id)).toBeDefined();

      await h.client.callTool({ name: 'unassign_place', arguments: { tripId: trip.id, dayId: day.id, assignmentId: assigned.assignment.id } });
      expect(skeletonFor(journey.id, place.id)).toBeUndefined();
    });
  });

  it('returns error when assignment is not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'unassign_place', arguments: { tripId: trip.id, dayId: day.id, assignmentId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'unassign_place', arguments: { tripId: trip.id, dayId: day.id, assignmentId: assignment.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// reorder_day_assignments
// ---------------------------------------------------------------------------

describe('Tool: reorder_day_assignments', () => {
  it('reorders assignments by updating order_index', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place1 = createPlace(testDb, trip.id, { name: 'First' });
    const place2 = createPlace(testDb, trip.id, { name: 'Second' });
    const a1 = createDayAssignment(testDb, day.id, place1.id, { order_index: 0 });
    const a2 = createDayAssignment(testDb, day.id, place2.id, { order_index: 1 });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_day_assignments',
        arguments: { tripId: trip.id, dayId: day.id, assignmentIds: [a2.id, a1.id] },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);

      const a1Updated = testDb.prepare('SELECT order_index FROM day_assignments WHERE id = ?').get(a1.id) as { order_index: number };
      const a2Updated = testDb.prepare('SELECT order_index FROM day_assignments WHERE id = ?').get(a2.id) as { order_index: number };
      expect(a2Updated.order_index).toBe(0);
      expect(a1Updated.order_index).toBe(1);
    });
  });

  it('broadcasts assignment:reordered event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const a = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'reorder_day_assignments', arguments: { tripId: trip.id, dayId: day.id, assignmentIds: [a.id] } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:reordered', expect.any(Object));
    });
  });

  it('returns error when day does not belong to trip', async () => {
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const day = createDay(testDb, trip2.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'reorder_day_assignments', arguments: { tripId: trip1.id, dayId: day.id, assignmentIds: [1] } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'reorder_day_assignments', arguments: { tripId: trip.id, dayId: day.id, assignmentIds: [1] } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_assignment_time
// ---------------------------------------------------------------------------

describe('Tool: update_assignment_time', () => {
  it('sets start and end times for an assignment', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_assignment_time',
        arguments: { tripId: trip.id, assignmentId: assignment.id, place_time: '09:00', end_time: '11:30' },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignment.assignment_time).toBe('09:00');
      expect(data.assignment.assignment_end_time).toBe('11:30');
    });
  });

  it('clears times with null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    testDb.prepare('UPDATE day_assignments SET assignment_time = ?, assignment_end_time = ? WHERE id = ?').run('09:00', '11:00', assignment.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_assignment_time',
        arguments: { tripId: trip.id, assignmentId: assignment.id, place_time: null, end_time: null },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignment.assignment_time).toBeNull();
      expect(data.assignment.assignment_end_time).toBeNull();
    });
  });

  it('broadcasts assignment:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_assignment_time', arguments: { tripId: trip.id, assignmentId: assignment.id, place_time: '10:00' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:updated', expect.any(Object));
    });
  });

  it('returns error when assignment not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_assignment_time', arguments: { tripId: trip.id, assignmentId: 99999, place_time: '09:00' } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_assignment_time', arguments: { tripId: trip.id, assignmentId: assignment.id, place_time: '09:00' } });
      expect(result.isError).toBe(true);
    });
  });
});
