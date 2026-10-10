/**
 * Unit tests for MCP leg-mode tools: set_leg_transport_mode,
 * set_day_default_transport_mode.
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
import { createUser, createTrip, createDay, createPlace, createDayAssignment } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { findRow, updateRows } from '../../helpers/factories/rows';
import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Days } from '../../../src/db/entities/Days.entity';

beforeEach(() => {
  resetTestDb(testDb);
  broadcastMock.mockClear();
  delete process.env.DEMO_MODE;
});

let orm: TestOrm;

beforeAll(async () => {
  orm = await createTestOrm(testDb);
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
// set_leg_transport_mode
// ---------------------------------------------------------------------------

describe('Tool: set_assignment_route_excluded (#2532)', () => {
  it('takes a stop out of the route and puts it back, broadcasting each change', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const out = parseToolResult(await h.client.callTool({ name: 'set_assignment_route_excluded', arguments: { tripId: trip.id, assignmentId: assignment.id, excluded: true } })) as any;
      expect(out.assignment.route_excluded).toBe(true);
      expect((await findRow(orm, DayAssignments, { id: assignment.id }))?.route_excluded).toBe(1);
      const back = parseToolResult(await h.client.callTool({ name: 'set_assignment_route_excluded', arguments: { tripId: trip.id, assignmentId: assignment.id, excluded: false } })) as any;
      expect(back.assignment.route_excluded).toBe(false);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:updated', expect.any(Object));
    });
  });

  it('rejects an assignment of another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const other = createTrip(testDb, user.id);
    const day = createDay(testDb, other.id);
    const place = createPlace(testDb, other.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'set_assignment_route_excluded', arguments: { tripId: trip.id, assignmentId: assignment.id, excluded: true } });
      expect(result.isError).toBe(true);
    });
  });
});

describe('Tool: set_leg_transport_mode', () => {
  it('sets the outgoing leg mode (default direction)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    // Seed the incoming column so the assertion below proves it survives; the factory
    // leaves it NULL, so without this it would pass whether or not the tool touched it.
    await updateRows(orm, DayAssignments, { id: assignment.id }, { incoming_leg_transport_mode: 'walking' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_leg_transport_mode',
        arguments: { tripId: trip.id, assignmentId: assignment.id, transport_mode: 'cycling' },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignment.leg_transport_mode).toBe('cycling');
      expect(data.assignment.incoming_leg_transport_mode).toBe('walking'); // outgoing must not touch incoming (panel item 4)
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'assignment:updated', expect.any(Object));
    });
  });

  it('sets the incoming leg mode without clobbering the outgoing column (column independence)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    // Seed the outgoing column so we prove incoming does NOT touch it (panel item 4).
    await updateRows(orm, DayAssignments, { id: assignment.id }, { leg_transport_mode: 'driving' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_leg_transport_mode',
        arguments: { tripId: trip.id, assignmentId: assignment.id, transport_mode: 'walking', direction: 'incoming' },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignment.incoming_leg_transport_mode).toBe('walking');
      expect(data.assignment.leg_transport_mode).toBe('driving'); // outgoing untouched
    });
  });

  it('rejects an assignment belonging to another trip (cross-trip join)', async () => {
    // Proves the `AND d.trip_id = ?` join in getAssignmentForTrip; a 99999 id cannot.
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const day2 = createDay(testDb, trip2.id);
    const place2 = createPlace(testDb, trip2.id);
    const assignment2 = createDayAssignment(testDb, day2.id, place2.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_leg_transport_mode',
        arguments: { tripId: trip1.id, assignmentId: assignment2.id, transport_mode: 'walking' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('clears the leg mode with null (inherit day default)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await updateRows(orm, DayAssignments, { id: assignment.id }, { leg_transport_mode: 'cycling' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_leg_transport_mode',
        arguments: { tripId: trip.id, assignmentId: assignment.id, transport_mode: null },
      });
      const data = parseToolResult(result) as any;
      expect(data.assignment.leg_transport_mode).toBeNull();
    });
  });

  it('returns error when assignment not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_leg_transport_mode',
        arguments: { tripId: trip.id, assignmentId: 99999, transport_mode: 'walking' },
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
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_leg_transport_mode',
        arguments: { tripId: trip.id, assignmentId: assignment.id, transport_mode: 'walking' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_leg_transport_mode',
        arguments: { tripId: trip.id, assignmentId: assignment.id, transport_mode: 'walking' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// set_day_default_transport_mode
// ---------------------------------------------------------------------------

describe('Tool: set_day_default_transport_mode', () => {
  it('sets the day default transport mode', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_day_default_transport_mode',
        arguments: { tripId: trip.id, dayId: day.id, transport_mode: 'driving' },
      });
      const data = parseToolResult(result) as any;
      expect(data.day.default_transport_mode).toBe('driving');
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'day:updated', expect.any(Object));
    });
  });

  it('clears the day default with null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await updateRows(orm, Days, { id: day.id }, { default_transport_mode: 'driving' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_day_default_transport_mode',
        arguments: { tripId: trip.id, dayId: day.id, transport_mode: null },
      });
      const data = parseToolResult(result) as any;
      expect(data.day.default_transport_mode).toBeNull();
    });
  });

  it('returns the day with its populated assignments array', async () => {
    // setDefaultTransportMode returns { ...day, assignments }; exercise the non-empty case (panel item 4).
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id);
    const assignment = createDayAssignment(testDb, day.id, place.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_day_default_transport_mode',
        arguments: { tripId: trip.id, dayId: day.id, transport_mode: 'driving' },
      });
      const data = parseToolResult(result) as any;
      expect(Array.isArray(data.day.assignments)).toBe(true);
      expect(data.day.assignments).toHaveLength(1);
      expect(data.day.assignments[0].id).toBe(assignment.id);
    });
  });

  it('rejects a day belonging to another trip (cross-trip join)', async () => {
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const day2 = createDay(testDb, trip2.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_day_default_transport_mode',
        arguments: { tripId: trip1.id, dayId: day2.id, transport_mode: 'walking' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns error when day not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_day_default_transport_mode',
        arguments: { tripId: trip.id, dayId: 99999, transport_mode: 'walking' },
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
      const result = await h.client.callTool({
        name: 'set_day_default_transport_mode',
        arguments: { tripId: trip.id, dayId: day.id, transport_mode: 'walking' },
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
        name: 'set_day_default_transport_mode',
        arguments: { tripId: trip.id, dayId: day.id, transport_mode: 'walking' },
      });
      expect(result.isError).toBe(true);
    });
  });
});
