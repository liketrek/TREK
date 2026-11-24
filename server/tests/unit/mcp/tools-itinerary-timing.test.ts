import { DayAssignments } from '../../../src/db/entities/DayAssignments.entity';
import { Days } from '../../../src/db/entities/Days.entity';
import { Places } from '../../../src/db/entities/Places.entity';
import { inOrder } from '../../../src/nest/common/in-order';
import { invalidatePermissionsCache } from '../../../src/nest/permissions/permissions-cache';
import { makeDayAssignment } from '../../helpers/factories/itinerary';
import { makePlace } from '../../helpers/factories/places';
import { findRow, findRows } from '../../helpers/factories/rows';
import { setAppSetting } from '../../helpers/factories/settings';
import { addTripMember, makeDay, makeTrip } from '../../helpers/factories/trips';
import { makeUser } from '../../helpers/factories/users';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetDatabase } from '../../helpers/reset-database';
import { bootTestApp } from '../../helpers/test-app';
import { MikroORM } from '@mikro-orm/core';

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

const realtime = new FakeRealtimeService();
const broadcastMock = realtime.broadcastMock;
let orm: MikroORM;
beforeAll(async () => {
  orm = (await bootTestApp(realtime)).get(MikroORM);
});
beforeEach(async () => {
  await resetDatabase(orm);
  broadcastMock.mockClear();
  await invalidatePermissionsCache();
  delete process.env.DEMO_MODE;
});
afterAll(async () => {
  delete process.env.DEMO_MODE;
  await invalidatePermissionsCache();
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
const timing = {
  enabled: true,
  start: '10:30',
  travel: [{ from: 'assignment:1', to: 'assignment:2', mode: 'walking', minutes: 25 }],
};

async function fixture(email?: string) {
  const { user } = await makeUser(orm, email ? { email } : {});
  const trip = await makeTrip(orm, user.id);
  const day = await makeDay(orm, trip.id);
  const place = await makePlace(orm, trip.id);
  const assignment = await makeDayAssignment(orm, day.id, place.id);
  return { user, trip, day, place, assignment };
}

async function stored() {
  return {
    days: await findRows(orm, Days, {}, { id: 'asc' }),
    visits: await findRows(orm, DayAssignments, {}, { id: 'asc' }),
  };
}

for (const kind of ['day', 'stay'] as const) {
  const name = kind === 'day' ? 'set_day_timing' : 'set_assignment_stay';
  const args = (f: Awaited<ReturnType<typeof fixture>>): Record<string, unknown> =>
    kind === 'day'
      ? { tripId: f.trip.id, dayId: f.day.id, ...timing }
      : { tripId: f.trip.id, assignmentId: f.assignment.id, stay_minutes: 90 };

  describe(`Tool: ${name}`, () => {
    it('persists an authorized write and broadcasts the saved entity', async () => {
      const f = await fixture();
      await withHarness(f.user.id, async (h) => {
        const result = await h.client.callTool({ name, arguments: args(f) });
        expect(result.isError).not.toBe(true);
        const saved =
          kind === 'day'
            ? { day: { id: f.day.id, timing } }
            : { assignment: { id: f.assignment.id, stay_minutes: 90 } };
        const data = parseToolResult(result) as Record<string, unknown>;
        expect(data).toMatchObject(saved);
        expect(broadcastMock).toHaveBeenCalledExactlyOnceWith(
          f.trip.id,
          kind === 'day' ? 'day:updated' : 'assignment:updated',
          { ...data, _source: 'mcp' },
        );
      });
      if (kind === 'day') {
        const row = await findRow(orm, Days, { id: f.day.id });
        if (!row) throw new Error('Saved day missing');
        expect(JSON.parse(row.timing_json)).toEqual(timing);
      } else {
        expect({ stay_minutes: (await findRow(orm, DayAssignments, { id: f.assignment.id }))?.stay_minutes }).toEqual({
          stay_minutes: 90,
        });
      }
    });

    it('rejects demo writes without mutation or broadcast', async () => {
      process.env.DEMO_MODE = 'true';
      const f = await fixture('demo@nomad.app');
      const before = await stored();
      await withHarness(f.user.id, async (h) => {
        const result = await h.client.callTool({ name, arguments: args(f) });
        expect(result.isError).toBe(true);
        expect(JSON.stringify(result.content)).toMatch(/demo/i);
      });
      expect(await stored()).toEqual(before);
      expect(broadcastMock).not.toHaveBeenCalled();
    });

    it('rejects a non-member even with a valid target id', async () => {
      const f = await fixture();
      const { user: outsider } = await makeUser(orm);
      const before = await stored();
      await withHarness(outsider.id, async (h) => {
        const result = await h.client.callTool({ name, arguments: args(f) });
        expect(result.isError).toBe(true);
        expect(JSON.stringify(result.content)).toContain('access denied');
      });
      expect(await stored()).toEqual(before);
      expect(broadcastMock).not.toHaveBeenCalled();
    });

    it('enforces day_edit independently of trip membership', async () => {
      const f = await fixture();
      const { user: member } = await makeUser(orm);
      await addTripMember(orm, f.trip.id, member.id);
      await setAppSetting(orm, 'perm_day_edit', 'trip_owner');
      await invalidatePermissionsCache();
      const before = await stored();
      await withHarness(member.id, async (h) => {
        const result = await h.client.callTool({ name, arguments: args(f) });
        expect(result.isError).toBe(true);
        expect(JSON.stringify(result.content)).toContain('do not have permission');
      });
      expect(await stored()).toEqual(before);
      expect(broadcastMock).not.toHaveBeenCalled();
    });

    it.each(['foreign', 'missing'] as const)('rejects a %s entity without mutation or broadcast', async (target) => {
      const f = await fixture();
      const otherTrip = await makeTrip(orm, f.user.id);
      const arguments_ = args(f);
      if (target === 'foreign') arguments_.tripId = otherTrip.id;
      else arguments_[kind === 'day' ? 'dayId' : 'assignmentId'] = 999999;
      const before = await stored();
      await withHarness(f.user.id, async (h) => {
        const result = await h.client.callTool({ name, arguments: arguments_ });
        expect(result.isError).toBe(true);
        expect(JSON.stringify(result.content)).toContain(kind === 'day' ? 'Day not found' : 'Assignment not found');
      });
      expect(await stored()).toEqual(before);
      expect(broadcastMock).not.toHaveBeenCalled();
    });

    const invalid: Record<string, unknown>[] =
      kind === 'day'
        ? [
            { start: '24:00' },
            { start: '09:60' },
            { enabled: 'true' },
            { travel: [{ from: 'a', to: 'b', mode: 'walking', minutes: -1 }] },
          ]
        : [{ stay_minutes: -1 }, { stay_minutes: 10_081 }, { stay_minutes: 1.5 }, { stay_minutes: '90' }];
    it.each(invalid)('validates MCP input %j before writing', async (invalidFields) => {
      const f = await fixture();
      const before = await stored();
      await withHarness(f.user.id, async (h) => {
        const result = await h.client.callTool({ name, arguments: { ...args(f), ...invalidFields } });
        expect(result.isError).toBe(true);
        expect(JSON.stringify(result.content)).toContain('Invalid arguments');
      });
      expect(await stored()).toEqual(before);
      expect(broadcastMock).not.toHaveBeenCalled();
    });
  });
}

it('accepts zero stay and null restores the place default without changing the place', async () => {
  const f = await fixture();
  const original = (await findRow(orm, Places, { id: f.place.id }))?.duration_minutes;
  await withHarness(f.user.id, async (h) => {
    await inOrder([0, null], async (stay_minutes) => {
      const result = await h.client.callTool({
        name: 'set_assignment_stay',
        arguments: { tripId: f.trip.id, assignmentId: f.assignment.id, stay_minutes },
      });
      expect(result.isError).not.toBe(true);
      expect(parseToolResult(result)).toMatchObject({ assignment: { stay_minutes } });
      expect({ stay_minutes: (await findRow(orm, DayAssignments, { id: f.assignment.id }))?.stay_minutes }).toEqual({
        stay_minutes,
      });
    });
  });
  expect((await findRow(orm, Places, { id: f.place.id }))?.duration_minutes).toEqual(original);
});
