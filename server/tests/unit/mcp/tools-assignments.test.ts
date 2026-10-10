/**
 * Unit tests for MCP assignment tools: assign_place_to_day, unassign_place,
 * reorder_day_assignments, update_assignment_time, update_assignment_notes.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';
import { db as testDb } from '../../../src/db/database';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

const { broadcastMock } = vi.hoisted(() => ({ broadcastMock: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast: broadcastMock }));

import { resetTestDb } from '../../helpers/test-db';
import { createUser, createTrip, createDay, createPlace, createDayAssignment, createJourney } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { countRows, findRow, findRows, insertRow, updateRows } from '../../helpers/factories/rows';
import { linkTripToJourney } from '../../helpers/factories/journeys';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { JourneyEntries } from '../../../src/db/entities/JourneyEntries.entity';
import { RoadtripVias } from '../../../src/db/entities/RoadtripVias.entity';

let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
});

/** The day's assignment ids in order_index order. */
async function dayOrder(dayId: number): Promise<number[]> {
  return (await findRows(orm, DayAssignments, { day: dayId }, { order_index: 'asc' })).map(r => r.id);
}

async function viaAfterIndex(id: number) {
  const row = await findRow(orm, RoadtripVias, { id });
  return row ? { after_order_index: row.after_order_index } : undefined;
}

async function assignmentNotes(id: number) {
  const row = await findRow(orm, DayAssignments, { id });
  return row ? { notes: row.notes } : undefined;
}

/** Link a journey to a trip so reconcileTripSkeletons has a target. */
function linkJourney(journeyId: number, tripId: number) {
  return linkTripToJourney(orm, journeyId, tripId);
}
function skeletonFor(journeyId: number, placeId: number) {
  return findRow(orm, JourneyEntries, { journey: journeyId, sourcePlace: placeId });
}

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
  const h = await createMcpHarness({ userId, withResources: false });
  try { await fn(h); } finally { await h.cleanup(); }
}

// ---------------------------------------------------------------------------
// assign_place_to_day
// ---------------------------------------------------------------------------

describe('Tool: assign_place_to_day', () => {
  it('sets and clears a visit day end through the shared service', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const visit = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async h => {
      for (const end_day of [true, false]) {
        const changed = await h.client.callTool({ name: 'set_assignment_end_day', arguments: { tripId: trip.id, assignmentId: visit.id, end_day } });
        expect(parseToolResult(changed)).toMatchObject({ assignment: { end_day } });
      }
      const other = createTrip(testDb, user.id);
      const refused = await h.client.callTool({ name: 'set_assignment_end_day', arguments: { tripId: other.id, assignmentId: visit.id, end_day: true } });
      expect(refused.isError).toBe(true);
    });
  });

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
    await linkJourney(journey.id, trip.id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip.id, dayId: day.id, placeId: place.id },
      });
      const skeleton = await skeletonFor(journey.id, place.id);
      expect(skeleton).not.toBeNull();
      expect(skeleton!.type).toBe('skeleton');
      expect(skeleton!.title).toBe('Linked Place');
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
      expect(await findRow(orm, DayAssignments, { id: assignment.id })).toBeNull();
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
    await linkJourney(journey.id, trip.id);

    await withHarness(user.id, async (h) => {
      // Assign via MCP (materialises the skeleton), then unassign that same assignment.
      const assigned = parseToolResult(
        await h.client.callTool({ name: 'assign_place_to_day', arguments: { tripId: trip.id, dayId: day.id, placeId: place.id } }),
      ) as any;
      expect(await skeletonFor(journey.id, place.id)).not.toBeNull();

      await h.client.callTool({ name: 'unassign_place', arguments: { tripId: trip.id, dayId: day.id, assignmentId: assigned.assignment.id } });
      expect(await skeletonFor(journey.id, place.id)).toBeNull();
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

describe('Tool: clear_day_assignments (#2470)', () => {
  it('removes every place from the day and broadcasts each removal', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const a1 = createDayAssignment(testDb, day.id, place.id);
    const a2 = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({ name: 'clear_day_assignments', arguments: { tripId: trip.id, dayId: day.id } })) as any;
      expect(data.success).toBe(true);
      expect([...data.removedIds].sort()).toEqual([a1.id, a2.id].sort());
      expect(await countRows(orm, DayAssignments, { day: day.id })).toBe(0);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:deleted', expect.objectContaining({ assignmentId: a1.id, dayId: day.id }));
    });
  });

  it('returns an error for a day on another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreignDay = createDay(testDb, otherTrip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'clear_day_assignments', arguments: { tripId: trip.id, dayId: foreignDay.id } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'clear_day_assignments', arguments: { tripId: trip.id, dayId: day.id } });
      expect(result.isError).toBe(true);
    });
  });
});

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

      const a1Updated = (await findRow(orm, DayAssignments, { id: a1.id }))!;
      const a2Updated = (await findRow(orm, DayAssignments, { id: a2.id }))!;
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
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'assignment:reordered',
        expect.objectContaining({ dayId: day.id, orderedIds: [a.id] }),
      );
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
    await updateRows(orm, DayAssignments, { id: assignment.id }, { assignment_time: '09:00', assignment_end_time: '11:00' });

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

  // Same service method as PUT /assignments/:id/time, so the same order and the same
  // three events. A: untimed, B: 15:00, C: untimed, D gets 10:00.
  it('keeps untimed stops in place, sorts the timed ones and sends the day and its vias like REST', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const [a, b, c, d] = [0, 1, 2, 3].map(i => createDayAssignment(testDb, day.id, place.id, { order_index: i }).id);
    await updateRows(orm, DayAssignments, { id: b }, { assignment_time: '15:00' });
    const via = await insertRow(orm, RoadtripVias, { day: day.id, after_order_index: 1, sequence: 0, lat: 48.1, lng: 11.5 });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_assignment_time', arguments: { tripId: trip.id, assignmentId: d, place_time: '10:00' } });
      expect((parseToolResult(result) as { assignment: { assignment_time: string } }).assignment.assignment_time).toBe('10:00');
    });

    const order = await dayOrder(day.id);
    expect(order).toEqual([a, d, b, c]);
    expect(await viaAfterIndex(via)).toEqual({ after_order_index: 2 });
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:reordered', expect.objectContaining({ dayId: day.id, orderedIds: [a, d, b, c] }));
    expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'roadtripVia:changed', expect.objectContaining({
      dayId: day.id,
      vias: [expect.objectContaining({ id: via, after_order_index: 2 })],
    }));
  });

  it('sends only the row when the start leaves the day as it was', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const [a, b, c] = [0, 1, 2].map(i => createDayAssignment(testDb, day.id, place.id, { order_index: i }).id);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_assignment_time', arguments: { tripId: trip.id, assignmentId: c, place_time: '14:00' } });
    });

    const order = await dayOrder(day.id);
    expect(order).toEqual([a, b, c]);
    expect(broadcastMock.mock.calls.map(call => call[1])).toEqual(['assignment:updated']);
  });

  it('leaves a day out of time order as it is when the call names only the end', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    // B starts before A and was put behind it on purpose.
    const [a, b] = [0, 1].map(i => createDayAssignment(testDb, day.id, place.id, { order_index: i }).id);
    await updateRows(orm, DayAssignments, { id: a }, { assignment_time: '14:00' });
    await updateRows(orm, DayAssignments, { id: b }, { assignment_time: '10:00' });
    const via = await insertRow(orm, RoadtripVias, { day: day.id, after_order_index: 0, sequence: 0, lat: 48.1, lng: 11.5 });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_assignment_time', arguments: { tripId: trip.id, assignmentId: b, end_time: '11:30' } });
      expect((parseToolResult(result) as { assignment: { assignment_time: string; assignment_end_time: string } }).assignment)
        .toMatchObject({ assignment_time: '10:00', assignment_end_time: '11:30' });
    });

    const order = await dayOrder(day.id);
    expect(order).toEqual([a, b]);
    expect(await viaAfterIndex(via)).toEqual({ after_order_index: 0 });
    expect(broadcastMock.mock.calls.map(call => call[1])).toEqual(['assignment:updated']);
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

// ---------------------------------------------------------------------------
// update_assignment_notes (#2163)
// ---------------------------------------------------------------------------

describe('Tool: update_assignment_notes', () => {
  it('sets the day-specific note on an assignment', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_assignment_notes',
        arguments: { tripId: trip.id, assignmentId: assignment.id, notes: 'Book the 10:00 timed entry and arrive 15 minutes early' },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignment.notes).toBe('Book the 10:00 timed entry and arrive 15 minutes early');
      expect(await assignmentNotes(assignment.id)).toEqual({ notes: 'Book the 10:00 timed entry and arrive 15 minutes early' });
    });
  });

  it('clears the note with null and with an empty string', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await updateRows(orm, DayAssignments, { id: assignment.id }, { notes: 'old' });

    await withHarness(user.id, async (h) => {
      const cleared = parseToolResult(await h.client.callTool({
        name: 'update_assignment_notes',
        arguments: { tripId: trip.id, assignmentId: assignment.id, notes: null },
      })) as any;
      expect(cleared.assignment.notes).toBeNull();
      await updateRows(orm, DayAssignments, { id: assignment.id }, { notes: 'old' });
      const emptied = parseToolResult(await h.client.callTool({
        name: 'update_assignment_notes',
        arguments: { tripId: trip.id, assignmentId: assignment.id, notes: '' },
      })) as any;
      expect(emptied.assignment.notes).toBeNull();
    });
  });

  it('broadcasts assignment:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_assignment_notes', arguments: { tripId: trip.id, assignmentId: assignment.id, notes: 'n' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:updated', expect.any(Object));
    });
  });

  it('returns error when assignment not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_assignment_notes', arguments: { tripId: trip.id, assignmentId: 99999, notes: 'n' } });
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
      const result = await h.client.callTool({ name: 'update_assignment_notes', arguments: { tripId: trip.id, assignmentId: assignment.id, notes: 'n' } });
      expect(result.isError).toBe(true);
      expect(await assignmentNotes(assignment.id)).toEqual({ notes: null });
    });
  });
});
