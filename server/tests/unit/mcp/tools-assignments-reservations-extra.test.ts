/**
 * Unit tests for MCP extra assignment/reservation tools:
 * move_assignment, get_assignment_participants, set_assignment_participants, reorder_reservations.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { db as testDb } from '../../../src/db/database';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createDay, createPlace, createDayAssignment, createReservation } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { findRow, insertRow } from '../../helpers/factories/rows';
import { AssignmentParticipants } from '../../../src/db/entities/AssignmentParticipants.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { FakeRealtimeService } from '../../helpers/fake-realtime';

const realtime = new FakeRealtimeService();
const broadcastMock = realtime.broadcastMock;

let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
});

afterAll(async () => {
  await orm.close();
  testDb.close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ realtime, userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// move_assignment
// ---------------------------------------------------------------------------

describe('Tool: move_assignment', () => {
  it('moves assignment to a different day and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day1.id, place.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'move_assignment',
        arguments: { tripId: trip.id, assignmentId: assignment.id, newDayId: day2.id, oldDayId: day1.id, orderIndex: 0 },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignment).toBeDefined();
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'assignment:moved',
        expect.objectContaining({ oldDayId: day1.id, newDayId: day2.id }),
      );
      // Verify the assignment was moved
      const updated = (await findRow(orm, DayAssignments, { id: assignment.id }))!;
      expect(updated.day_id).toBe(day2.id);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'move_assignment',
        arguments: { tripId: trip.id, assignmentId: 1, newDayId: day.id, oldDayId: day.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'move_assignment',
        arguments: { tripId: trip.id, assignmentId: 1, newDayId: day.id, oldDayId: day.id },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// get_assignment_participants
// ---------------------------------------------------------------------------

describe('Tool: get_assignment_participants', () => {
  it('returns empty participants array initially', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_assignment_participants',
        arguments: { tripId: trip.id, assignmentId: assignment.id },
      });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.participants)).toBe(true);
      expect(data.participants).toHaveLength(0);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_assignment_participants', arguments: { tripId: trip.id, assignmentId: 1 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// set_assignment_participants
// ---------------------------------------------------------------------------

describe('Tool: set_assignment_participants', () => {
  it('sets participants and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_assignment_participants',
        arguments: { tripId: trip.id, assignmentId: assignment.id, userIds: [user.id] },
      });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.participants)).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:participants', expect.any(Object));
    });
  });

  it('empty array clears participants', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    // First set
    await insertRow(orm, AssignmentParticipants, { assignment: assignment.id, user: user.id });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_assignment_participants',
        arguments: { tripId: trip.id, assignmentId: assignment.id, userIds: [] },
      });
      const data = parseToolResult(result) as any;
      expect(data.participants).toEqual([]);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_assignment_participants',
        arguments: { tripId: trip.id, assignmentId: 1, userIds: [] },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// reorder_reservations
// ---------------------------------------------------------------------------

describe('Tool: reorder_reservations', () => {
  it('returns success and broadcasts reservation:positions', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const res1 = createReservation(testDb, trip.id, { title: 'Flight', type: 'flight' });
    const res2 = createReservation(testDb, trip.id, { title: 'Hotel', type: 'hotel' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_reservations',
        arguments: {
          tripId: trip.id,
          positions: [
            { id: res1.id, day_plan_position: 1 },
            { id: res2.id, day_plan_position: 0 },
          ],
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'reservation:positions', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_reservations',
        arguments: { tripId: trip.id, positions: [{ id: 1, day_plan_position: 0 }] },
      });
      expect(result.isError).toBe(true);
    });
  });
});
