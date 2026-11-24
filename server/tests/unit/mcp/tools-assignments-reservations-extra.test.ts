/**
 * Unit tests for MCP extra assignment/reservation tools:
 * move_assignment, get_assignment_participants, set_assignment_participants, reorder_reservations.
 */
import { AssignmentParticipants } from '../../../src/db/entities/AssignmentParticipants.entity';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { makeReservation } from '../../helpers/factories/reservations';
import { findRow, insertRow } from '../../helpers/factories/rows';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetDatabase } from '../../helpers/reset-database';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

const realtime = new FakeRealtimeService();
const broadcastMock = realtime.broadcastMock;

// The booted container's own ORM, the one the tools write through.
let orm: MikroORM;

beforeAll(async () => {
  orm = (await bootTestApp(realtime)).get(MikroORM);
});

beforeEach(async () => {
  await resetDatabase(orm);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
});

afterAll(async () => {
  await (await bootTestApp(realtime)).close();
});

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ realtime, userId, withResources: false });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

// ---------------------------------------------------------------------------
// move_assignment
// ---------------------------------------------------------------------------

describe('Tool: move_assignment', () => {
  it('moves assignment to a different day and broadcasts', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day1 = await makeDay(orm, trip.id);
    const day2 = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day1.id, place.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'move_assignment',
        arguments: {
          tripId: trip.id,
          assignmentId: assignment.id,
          newDayId: day2.id,
          oldDayId: day1.id,
          orderIndex: 0,
        },
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
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const day = await makeDay(orm, trip.id);
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
    const { user } = await makeUser(orm, { email: 'demo@nomad.app' });
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
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
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'get_assignment_participants',
        arguments: { tripId: trip.id, assignmentId: 1 },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// set_assignment_participants
// ---------------------------------------------------------------------------

describe('Tool: set_assignment_participants', () => {
  it('sets participants and broadcasts', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
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
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const res1 = await makeReservation(orm, trip.id, { title: 'Flight', type: 'flight' });
    const res2 = await makeReservation(orm, trip.id, { title: 'Hotel', type: 'hotel' });
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

  it("names the day under REST's day_id and keeps the dayId the tool always sent", async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const res = await makeReservation(orm, trip.id, { title: 'Train', type: 'train', day: day.id });
    const positions = [{ id: res.id, day_plan_position: 3 }];
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'reorder_reservations',
        arguments: { tripId: trip.id, positions, dayId: day.id },
      });
    });
    expect(broadcastMock.mock.calls.filter((c) => c[1] === 'reservation:positions')).toEqual([
      [trip.id, 'reservation:positions', { positions, day_id: day.id, dayId: day.id, _source: 'mcp' }],
    ]);
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_reservations',
        arguments: { tripId: trip.id, positions: [{ id: 1, day_plan_position: 0 }] },
      });
      expect(result.isError).toBe(true);
    });
  });
});
