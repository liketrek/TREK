/**
 * update_assignment: one call for any of an assignment's own fields (times,
 * note, end of the travel day, route exclusion, participants), and the
 * single-field tools it replaced, kept for one release and run through it.
 */
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { findRow } from '../../helpers/factories/rows';
import { addTripMember, makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

const realtime = new FakeRealtimeService();
let orm: MikroORM;

beforeAll(async () => {
  orm = (await bootTestApp(realtime)).get(MikroORM);
});

beforeEach(() => {
  realtime.broadcastMock.mockClear();
});

async function seed() {
  const { user } = await makeUser(orm);
  const { user: friend } = await makeUser(orm);
  const trip = await makeTrip(orm, user.id);
  await addTripMember(orm, trip.id, friend.id);
  const day = await makeDay(orm, trip.id);
  const place = await makePlace(orm, trip.id);
  const assignment = await makeDayAssignment(orm, day.id, place.id);
  return { user, friend, trip, assignment };
}

async function call(userId: number, name: string, args: Record<string, unknown>) {
  const harness: McpHarness = await createMcpHarness({ userId, realtime });
  try {
    return (await harness.client.callTool({ name, arguments: args })) as {
      isError?: boolean;
      content: Array<{ text: string }>;
    };
  } finally {
    await harness.cleanup();
  }
}

const events = () => realtime.broadcastMock.mock.calls.map((c) => c[1]);

describe('Tool: update_assignment', () => {
  it('UPDASSIGN-001: changes several fields in one call and broadcasts each change once', async () => {
    const { user, friend, trip, assignment } = await seed();
    const result = await call(user.id, 'update_assignment', {
      tripId: trip.id,
      assignmentId: assignment.id,
      place_time: '09:00',
      notes: 'Bring cash',
      route_excluded: true,
      participant_ids: [friend.id],
    });
    expect(result.isError).toBeFalsy();
    const data = parseToolResult(result) as { assignment: unknown; participants: Array<{ user_id: number }> };
    expect(data.participants.map((p) => p.user_id)).toEqual([friend.id]);
    const row = await findRow(orm, DayAssignments, { id: assignment.id });
    expect(row?.notes).toBe('Bring cash');
    expect(row?.assignment_time).toBe('09:00');
    expect(row?.route_excluded).toBeTruthy();
    expect(events().filter((e) => e === 'assignment:updated')).toHaveLength(1);
    expect(events()).toContain('assignment:participants');
  });

  it('UPDASSIGN-002: keeps an unset time and clears one passed as null', async () => {
    const { user, trip, assignment } = await seed();
    await call(user.id, 'update_assignment', {
      tripId: trip.id,
      assignmentId: assignment.id,
      place_time: '10:00',
      end_time: '11:00',
    });
    await call(user.id, 'update_assignment', { tripId: trip.id, assignmentId: assignment.id, end_time: null });
    const row = await findRow(orm, DayAssignments, { id: assignment.id });
    expect(row?.assignment_time).toBe('10:00');
    expect(row?.assignment_end_time).toBeNull();
  });

  it('UPDASSIGN-003: refuses a call with nothing to change, an assignment of another trip, and an outsider', async () => {
    const { user, trip, assignment } = await seed();
    const other = await seed();
    const { user: outsider } = await makeUser(orm);
    const empty = await call(user.id, 'update_assignment', { tripId: trip.id, assignmentId: assignment.id });
    expect(empty.isError).toBe(true);
    expect(empty.content[0].text).toContain('Nothing to update');
    const foreign = await call(user.id, 'update_assignment', {
      tripId: trip.id,
      assignmentId: other.assignment.id,
      notes: 'x',
    });
    expect(foreign.content[0].text).toContain('Assignment not found');
    const denied = await call(outsider.id, 'update_assignment', {
      tripId: trip.id,
      assignmentId: assignment.id,
      notes: 'x',
    });
    expect(denied.isError).toBe(true);
    expect((await findRow(orm, DayAssignments, { id: assignment.id }))?.notes).toBeNull();
  });
});

describe('the single-field tools update_assignment replaced', () => {
  it('UPDASSIGN-004: still work, and say which tool to use instead', async () => {
    const { user, trip, assignment } = await seed();
    const harness = await createMcpHarness({ userId: user.id, realtime });
    try {
      const tools = (await harness.client.listTools()).tools;
      for (const name of [
        'set_assignment_end_day',
        'update_assignment_time',
        'update_assignment_notes',
        'set_assignment_route_excluded',
        'set_assignment_participants',
      ]) {
        expect(tools.find((t) => t.name === name)?.description).toBe('Deprecated: use update_assignment.');
      }
    } finally {
      await harness.cleanup();
    }
    const notes = await call(user.id, 'update_assignment_notes', {
      tripId: trip.id,
      assignmentId: assignment.id,
      notes: 'Old tool',
    });
    expect(notes.isError).toBeFalsy();
    expect((await findRow(orm, DayAssignments, { id: assignment.id }))?.notes).toBe('Old tool');
  });

  it('UPDASSIGN-005: move_assignment no longer takes the ignored oldDayId', async () => {
    const { user } = await makeUser(orm);
    const harness = await createMcpHarness({ userId: user.id, realtime });
    try {
      const move = (await harness.client.listTools()).tools.find((t) => t.name === 'move_assignment');
      expect(Object.keys((move?.inputSchema.properties as object) ?? {})).not.toContain('oldDayId');
    } finally {
      await harness.cleanup();
    }
  });
});
