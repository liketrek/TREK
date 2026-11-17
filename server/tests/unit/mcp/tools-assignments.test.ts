/**
 * Unit tests for MCP assignment tools: assign_place_to_day, unassign_place,
 * reorder_day_assignments, update_assignment_time, update_assignment_notes.
 */
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { JourneyEntries } from '../../../src/db/entities/JourneyEntries.entity';
import { RoadtripVias } from '../../../src/db/entities/RoadtripVias.entity';
import { TourWaypoints } from '../../../src/db/entities/TourWaypoints.entity';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makeJourney, linkTripToJourney } from '../../helpers/factories/journeys';
import { makePlace } from '../../helpers/factories/places';
import { countRows, findRow, findRows, insertRow, insertRows, updateRows } from '../../helpers/factories/rows';
import { makeTour } from '../../helpers/factories/tours';
import { makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { oneByOne } from '../../helpers/one-by-one';
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

/** The day's assignment ids in order_index order. */
async function dayOrder(dayId: number): Promise<number[]> {
  return (await findRows(orm, DayAssignments, { day: dayId }, { order_index: 'asc' })).map((r) => r.id);
}

/** `count` stops of the place on the day, order_index 0 upwards; their ids in that order. */
async function stops(dayId: number, placeId: number, count: number): Promise<number[]> {
  const indexes = Array.from({ length: count }, (_, i) => i);
  const rows = await oneByOne(indexes, (i) => makeDayAssignment(orm, dayId, placeId, { order_index: i }));
  return rows.map((row) => row.id);
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
// assign_place_to_day
// ---------------------------------------------------------------------------

describe('Tool: assign_place_to_day', () => {
  it('sets and clears a visit day end through the shared service', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const visit = await makeDayAssignment(orm, day.id, place.id);
    await withHarness(user.id, async (h) => {
      await oneByOne([true, false], async (end_day) => {
        const changed = await h.client.callTool({
          name: 'set_assignment_end_day',
          arguments: { tripId: trip.id, assignmentId: visit.id, end_day },
        });
        expect(parseToolResult(changed)).toMatchObject({ assignment: { end_day } });
      });
      const other = await makeTrip(orm, user.id);
      const refused = await h.client.callTool({
        name: 'set_assignment_end_day',
        arguments: { tripId: other.id, assignmentId: visit.id, end_day: true },
      });
      expect(refused.isError).toBe(true);
    });
  });

  it('set_assignment_stay: changes the stay of one visit and leaves the other visit of the place alone (#3092)', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const first = await makeDayAssignment(orm, day.id, place.id);
    const second = await makeDayAssignment(orm, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const changed = await h.client.callTool({
        name: 'set_assignment_stay',
        arguments: { tripId: trip.id, assignmentId: second.id, stay_minutes: 5 },
      });
      expect(parseToolResult(changed)).toMatchObject({ assignment: { id: second.id, stay_minutes: 5 } });
      const other = await makeTrip(orm, user.id);
      const refused = await h.client.callTool({
        name: 'set_assignment_stay',
        arguments: { tripId: other.id, assignmentId: second.id, stay_minutes: 5 },
      });
      expect(refused.isError).toBe(true);
    });
    const rows = await findRows(orm, DayAssignments, { id: { $in: [first.id, second.id] } }, { id: 'asc' });
    expect(rows.map((r) => r.stay_minutes)).toEqual([null, 5]);
  });

  it('MDT-MCP-001:puts one stage of a multi-day tour on a day, refusing as REST does', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const secondDay = await makeDay(orm, trip.id);
    const tour = await makePlace(orm, trip.id);
    await makeTour(orm, tour.id, { max_hiking_difficulty: 2 });
    await insertRows(
      orm,
      TourWaypoints,
      ['stop-start', 'stop-hut', 'stop-end'].map((station_key, sequence) => ({
        place: tour.id,
        lat: 47 + sequence / 10,
        lng: 11,
        role: sequence === 0 ? 'start' : sequence === 2 ? 'end' : 'via',
        sequence,
        station_key,
        stage_end: sequence === 1 ? 1 : 0,
      })),
    );

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip.id, dayId: day.id, placeId: tour.id, tourStageKey: 'stop-hut' },
      });
      expect(parseToolResult(result)).toMatchObject({ assignment: { day_id: day.id, tour_stage_key: 'stop-hut' } });
      const again = await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip.id, dayId: secondDay.id, placeId: tour.id, tourStageKey: 'stop-hut' },
      });
      expect(again.isError).toBe(true);
      expect(JSON.stringify(again.content)).toContain('Stage is already on a day');
      const unknown = await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip.id, dayId: secondDay.id, placeId: tour.id, tourStageKey: 'stop-end' },
      });
      expect(unknown.isError).toBe(true);
      expect(JSON.stringify(unknown.content)).toContain('Tour has no such stage');
    });
    expect(await countRows(orm, DayAssignments, { place: tour.id })).toBe(1);
  });

  it('assigns a place to a day', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);

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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id, { name: 'Linked Place' });
    const journey = await makeJourney(orm, user.id);
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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place1 = await makePlace(orm, trip.id, { name: 'P1' });
    const place2 = await makePlace(orm, trip.id, { name: 'P2' });
    await makeDayAssignment(orm, day.id, place1.id);

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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip.id, dayId: day.id, placeId: place.id },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:created', expect.any(Object));
    });
  });

  it('returns error when day does not belong to trip', async () => {
    const { user } = await makeUser(orm);
    const trip1 = await makeTrip(orm, user.id);
    const trip2 = await makeTrip(orm, user.id);
    const dayFromTrip2 = await makeDay(orm, trip2.id);
    const place = await makePlace(orm, trip1.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip1.id, dayId: dayFromTrip2.id, placeId: place.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns error when place does not belong to trip', async () => {
    const { user } = await makeUser(orm);
    const trip1 = await makeTrip(orm, user.id);
    const trip2 = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip1.id);
    const placeFromTrip2 = await makePlace(orm, trip2.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip1.id, dayId: day.id, placeId: placeFromTrip2.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'assign_place_to_day',
        arguments: { tripId: trip.id, dayId: day.id, placeId: place.id },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// unassign_place
// ---------------------------------------------------------------------------

describe('Tool: unassign_place', () => {
  it('removes a place assignment from a day', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);

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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'unassign_place',
        arguments: { tripId: trip.id, dayId: day.id, assignmentId: assignment.id },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:deleted', expect.any(Object));
    });
  });

  it('removes the linked journey skeleton when the place is unassigned', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const journey = await makeJourney(orm, user.id);
    await linkJourney(journey.id, trip.id);

    await withHarness(user.id, async (h) => {
      // Assign via MCP (materialises the skeleton), then unassign that same assignment.
      const assigned = parseToolResult(
        await h.client.callTool({
          name: 'assign_place_to_day',
          arguments: { tripId: trip.id, dayId: day.id, placeId: place.id },
        }),
      ) as any;
      expect(await skeletonFor(journey.id, place.id)).not.toBeNull();

      await h.client.callTool({
        name: 'unassign_place',
        arguments: { tripId: trip.id, dayId: day.id, assignmentId: assigned.assignment.id },
      });
      expect(await skeletonFor(journey.id, place.id)).toBeNull();
    });
  });

  it('returns error when assignment is not found', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'unassign_place',
        arguments: { tripId: trip.id, dayId: day.id, assignmentId: 99999 },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'unassign_place',
        arguments: { tripId: trip.id, dayId: day.id, assignmentId: assignment.id },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// reorder_day_assignments
// ---------------------------------------------------------------------------

describe('Tool: clear_day_assignments (#2470)', () => {
  it('removes every place from the day and broadcasts each removal', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const a1 = await makeDayAssignment(orm, day.id, place.id);
    const a2 = await makeDayAssignment(orm, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({ name: 'clear_day_assignments', arguments: { tripId: trip.id, dayId: day.id } }),
      ) as any;
      expect(data.success).toBe(true);
      expect([...data.removedIds].sort()).toEqual([a1.id, a2.id].sort());
      expect(await countRows(orm, DayAssignments, { day: day.id })).toBe(0);
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'assignment:deleted',
        expect.objectContaining({ assignmentId: a1.id, dayId: day.id }),
      );
    });
  });

  it('returns an error for a day on another trip', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const otherTrip = await makeTrip(orm, user.id);
    const foreignDay = await makeDay(orm, otherTrip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'clear_day_assignments',
        arguments: { tripId: trip.id, dayId: foreignDay.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const day = await makeDay(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'clear_day_assignments',
        arguments: { tripId: trip.id, dayId: day.id },
      });
      expect(result.isError).toBe(true);
    });
  });
});

describe('Tool: reorder_day_assignments', () => {
  it('reorders assignments by updating order_index', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place1 = await makePlace(orm, trip.id, { name: 'First' });
    const place2 = await makePlace(orm, trip.id, { name: 'Second' });
    const a1 = await makeDayAssignment(orm, day.id, place1.id, { order_index: 0 });
    const a2 = await makeDayAssignment(orm, day.id, place2.id, { order_index: 1 });

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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const a = await makeDayAssignment(orm, day.id, place.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'reorder_day_assignments',
        arguments: { tripId: trip.id, dayId: day.id, assignmentIds: [a.id] },
      });
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'assignment:reordered',
        expect.objectContaining({ dayId: day.id, orderedIds: [a.id] }),
      );
    });
  });

  it('returns error when day does not belong to trip', async () => {
    const { user } = await makeUser(orm);
    const trip1 = await makeTrip(orm, user.id);
    const trip2 = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip2.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_day_assignments',
        arguments: { tripId: trip1.id, dayId: day.id, assignmentIds: [1] },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const day = await makeDay(orm, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'reorder_day_assignments',
        arguments: { tripId: trip.id, dayId: day.id, assignmentIds: [1] },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_assignment_time
// ---------------------------------------------------------------------------

describe('Tool: update_assignment_time', () => {
  it('sets start and end times for an assignment', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);

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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
    await updateRows(
      orm,
      DayAssignments,
      { id: assignment.id },
      { assignment_time: '09:00', assignment_end_time: '11:00' },
    );

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
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_assignment_time',
        arguments: { tripId: trip.id, assignmentId: assignment.id, place_time: '10:00' },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:updated', expect.any(Object));
    });
  });

  // Same service method as PUT /assignments/:id/time, so the same order and the same
  // three events. A: untimed, B: 15:00, C: untimed, D gets 10:00.
  it('keeps untimed stops in place, sorts the timed ones and sends the day and its vias like REST', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const [a, b, c, d] = await stops(day.id, place.id, 4);
    await updateRows(orm, DayAssignments, { id: b }, { assignment_time: '15:00' });
    const via = await insertRow(orm, RoadtripVias, {
      day: day.id,
      after_order_index: 1,
      sequence: 0,
      lat: 48.1,
      lng: 11.5,
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_assignment_time',
        arguments: { tripId: trip.id, assignmentId: d, place_time: '10:00' },
      });
      expect((parseToolResult(result) as { assignment: { assignment_time: string } }).assignment.assignment_time).toBe(
        '10:00',
      );
    });

    const order = await dayOrder(day.id);
    expect(order).toEqual([a, d, b, c]);
    expect(await viaAfterIndex(via)).toEqual({ after_order_index: 2 });
    expect(broadcastMock).toHaveBeenCalledWith(
      trip.id,
      'assignment:reordered',
      expect.objectContaining({ dayId: day.id, orderedIds: [a, d, b, c] }),
    );
    expect(broadcastMock).toHaveBeenCalledWith(
      trip.id,
      'roadtripVia:changed',
      expect.objectContaining({
        dayId: day.id,
        vias: [expect.objectContaining({ id: via, after_order_index: 2 })],
      }),
    );
  });

  it('sends only the row when the start leaves the day as it was', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const [a, b, c] = await stops(day.id, place.id, 3);

    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_assignment_time',
        arguments: { tripId: trip.id, assignmentId: c, place_time: '14:00' },
      });
    });

    const order = await dayOrder(day.id);
    expect(order).toEqual([a, b, c]);
    expect(broadcastMock.mock.calls.map((call) => call[1])).toEqual(['assignment:updated']);
  });

  it('leaves a day out of time order as it is when the call names only the end', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    // B starts before A and was put behind it on purpose.
    const [a, b] = await stops(day.id, place.id, 2);
    await updateRows(orm, DayAssignments, { id: a }, { assignment_time: '14:00' });
    await updateRows(orm, DayAssignments, { id: b }, { assignment_time: '10:00' });
    const via = await insertRow(orm, RoadtripVias, {
      day: day.id,
      after_order_index: 0,
      sequence: 0,
      lat: 48.1,
      lng: 11.5,
    });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_assignment_time',
        arguments: { tripId: trip.id, assignmentId: b, end_time: '11:30' },
      });
      expect(
        (parseToolResult(result) as { assignment: { assignment_time: string; assignment_end_time: string } })
          .assignment,
      ).toMatchObject({ assignment_time: '10:00', assignment_end_time: '11:30' });
    });

    const order = await dayOrder(day.id);
    expect(order).toEqual([a, b]);
    expect(await viaAfterIndex(via)).toEqual({ after_order_index: 0 });
    expect(broadcastMock.mock.calls.map((call) => call[1])).toEqual(['assignment:updated']);
  });

  it('returns error when assignment not found', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_assignment_time',
        arguments: { tripId: trip.id, assignmentId: 99999, place_time: '09:00' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_assignment_time',
        arguments: { tripId: trip.id, assignmentId: assignment.id, place_time: '09:00' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_assignment_notes (#2163)
// ---------------------------------------------------------------------------

describe('Tool: update_assignment_notes', () => {
  it('sets the day-specific note on an assignment', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_assignment_notes',
        arguments: {
          tripId: trip.id,
          assignmentId: assignment.id,
          notes: 'Book the 10:00 timed entry and arrive 15 minutes early',
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignment.notes).toBe('Book the 10:00 timed entry and arrive 15 minutes early');
      expect(await assignmentNotes(assignment.id)).toEqual({
        notes: 'Book the 10:00 timed entry and arrive 15 minutes early',
      });
    });
  });

  it('clears the note with null and with an empty string', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
    await updateRows(orm, DayAssignments, { id: assignment.id }, { notes: 'old' });

    await withHarness(user.id, async (h) => {
      const cleared = parseToolResult(
        await h.client.callTool({
          name: 'update_assignment_notes',
          arguments: { tripId: trip.id, assignmentId: assignment.id, notes: null },
        }),
      ) as any;
      expect(cleared.assignment.notes).toBeNull();
      await updateRows(orm, DayAssignments, { id: assignment.id }, { notes: 'old' });
      const emptied = parseToolResult(
        await h.client.callTool({
          name: 'update_assignment_notes',
          arguments: { tripId: trip.id, assignmentId: assignment.id, notes: '' },
        }),
      ) as any;
      expect(emptied.assignment.notes).toBeNull();
    });
  });

  it('broadcasts assignment:updated event', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'update_assignment_notes',
        arguments: { tripId: trip.id, assignmentId: assignment.id, notes: 'n' },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:updated', expect.any(Object));
    });
  });

  it('returns error when assignment not found', async () => {
    const { user } = await makeUser(orm);
    const trip = await makeTrip(orm, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_assignment_notes',
        arguments: { tripId: trip.id, assignmentId: 99999, notes: 'n' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = await makeUser(orm);
    const { user: other } = await makeUser(orm);
    const trip = await makeTrip(orm, other.id);
    const day = await makeDay(orm, trip.id);
    const place = await makePlace(orm, trip.id);
    const assignment = await makeDayAssignment(orm, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_assignment_notes',
        arguments: { tripId: trip.id, assignmentId: assignment.id, notes: 'n' },
      });
      expect(result.isError).toBe(true);
      expect(await assignmentNotes(assignment.id)).toEqual({ notes: null });
    });
  });
});
