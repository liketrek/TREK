/**
 * Unit tests for the trip MCP surface (TripsMcp, DI-discovered): create_trip,
 * update_trip, delete_trip, list_trips, get_trip_summary tools, the
 * trek://trips / trek://trips/{tripId} resources (moved here from
 * resources.test.ts with the DI port — the withTools harness attaches the
 * nest-mcp registry that now registers them), the fire-once deprecation
 * notice riding the attach ctx, and the scope gating (declarative
 * trips:write markers + the canReadTrips/canDeleteTrips predicates).
 */
import { db as testDb } from '../../../src/db/database';
import { Days } from '../../../src/db/entities/Days.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { VacayEntries } from '../../../src/db/entities/VacayEntries.entity';
import { VacayUserYears } from '../../../src/db/entities/VacayUserYears.entity';
import { VacayYears } from '../../../src/db/entities/VacayYears.entity';
import {
  createUser,
  createTrip,
  createDay,
  createPlace,
  addTripMember,
  createBudgetItem,
  createPackingItem,
  createReservation,
  createDayNote,
  createCollabNote,
  createDayAssignment,
  createDayAccommodation,
} from '../../helpers/factories';
import { makePackingItem } from '../../helpers/factories/packing';
import { countRows, findRow, findRows, insertRow, insertRows, updateRows } from '../../helpers/factories/rows';
import { setUserSetting } from '../../helpers/factories/settings';
import { makeVacayEntry, makeVacayPlan, addVacayPlanMember } from '../../helpers/factories/vacay';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';
import { MAX_TRIP_DAYS } from '@trek/shared';

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

vi.mock('../../../src/db/database', async () => {
  const { createSnapshotTestDb, buildDbMock } = await import('../../helpers/db-mock');
  return buildDbMock(createSnapshotTestDb());
});

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

// Only search_cover_images stubs fetch, and it stubs a different response per case.
afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(async () => {
  await orm.close();
  testDb.close();
});

async function tripRow(id: number) {
  return (await findRow(orm, Trips, { id }))!;
}

/** The vacay entry dates of the user in the plan between `from` and `to`, both included, in date order. */
async function vacayDatesBetween(planId: number, userId: number, from: string, to: string): Promise<string[]> {
  const rows = await findRows(
    orm,
    VacayEntries,
    { plan: planId, user: userId, date: { $gte: from, $lte: to } },
    { date: 'asc' },
  );
  return rows.map((r) => r.date);
}

/** A vacay plan for the user with the year 2026 open and 30 days in it. */
async function vacayPlanWithYear(userId: number): Promise<number> {
  const { id: planId } = await makeVacayPlan(orm, userId);
  await insertRow(orm, VacayYears, { plan: planId, year: 2026 });
  await insertRow(orm, VacayUserYears, { user: userId, plan: planId, year: 2026, vacation_days: 30, carried_over: 0 });
  return planId;
}

async function withHarness(userId: number, fn: (h: McpHarness) => Promise<void>) {
  const h = await createMcpHarness({ realtime, userId, withResources: false });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
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
      const days = await countRows(orm, Days, { trip: data.trip.id });
      expect(days).toBe(7);
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
      const days = await countRows(orm, Days, { trip: data.trip.id });
      expect(days).toBe(5);
    });
  });

  it('generates every day of a trip longer than a year (#2403)', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_trip',
        arguments: { title: 'Long Trip', start_date: '2025-01-26', end_date: '2026-01-28' },
      });
      const data = parseToolResult(result) as any;
      const days = await countRows(orm, Days, { trip: data.trip.id });
      expect(days).toBe(368);
    });
  });

  it('refuses a date range longer than MAX_TRIP_DAYS instead of cutting the days short', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_trip',
        arguments: { title: 'Decade', start_date: '2026-01-01', end_date: '2036-01-01' },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(`at most ${MAX_TRIP_DAYS} days`);
      expect(await countRows(orm, Trips)).toBe(0);
    });
  });

  it('returns error for invalid start_date format', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_trip',
        arguments: { title: 'Trip', start_date: 'not-a-date' },
      });
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

  it('gives a dateless trip the requested day_count instead of the default 7', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_trip',
        arguments: { title: 'Open Ended', day_count: 12 },
      });
      const data = parseToolResult(result) as any;
      const days = await countRows(orm, Days, { trip: data.trip.id });
      expect(days).toBe(12);
      const row = await tripRow(data.trip.id);
      expect(row.start_date).toBeNull();
      expect(row.end_date).toBeNull();
    });
  });

  it('refuses a day_count outside 1..MAX_TRIP_DAYS', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      expect(
        (await h.client.callTool({ name: 'create_trip', arguments: { title: 'Zero', day_count: 0 } })).isError,
      ).toBe(true);
      expect(
        (await h.client.callTool({ name: 'create_trip', arguments: { title: 'Huge', day_count: MAX_TRIP_DAYS + 1 } }))
          .isError,
      ).toBe(true);
      expect(await countRows(orm, Trips)).toBe(0);
    });
  });

  it('stores the requested reminder_days', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_trip',
        arguments: { title: 'Reminded', reminder_days: 14 },
      });
      const data = parseToolResult(result) as any;
      const row = await tripRow(data.trip.id);
      expect(row.reminder_days).toBe(14);
    });
  });

  it('turns the reminder off with reminder_days 0 rather than falling back to 3', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_trip', arguments: { title: 'Quiet', reminder_days: 0 } });
      const data = parseToolResult(result) as any;
      const row = await tripRow(data.trip.id);
      expect(row.reminder_days).toBe(0);
    });
  });

  it('refuses a reminder_days outside 0..30', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      expect(
        (await h.client.callTool({ name: 'create_trip', arguments: { title: 'Early', reminder_days: 31 } })).isError,
      ).toBe(true);
      expect(
        (await h.client.callTool({ name: 'create_trip', arguments: { title: 'Negative', reminder_days: -1 } })).isError,
      ).toBe(true);
      expect(await countRows(orm, Trips)).toBe(0);
    });
  });

  it('gives a trip without a currency the display currency from the settings, not EUR', async () => {
    const { user } = createUser(testDb);
    await setUserSetting(orm, user.id, 'default_currency', JSON.stringify('USD'));
    await withHarness(user.id, async (h) => {
      const fromSettings = parseToolResult(
        await h.client.callTool({ name: 'create_trip', arguments: { title: 'Road trip' } }),
      ) as any;
      expect(fromSettings.trip.currency).toBe('USD');
      const explicit = parseToolResult(
        await h.client.callTool({ name: 'create_trip', arguments: { title: 'Tokyo', currency: 'JPY' } }),
      ) as any;
      expect(explicit.trip.currency).toBe('JPY');
    });
  });

  it('falls back to EUR when neither the user nor the admin set a display currency', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({ name: 'create_trip', arguments: { title: 'Plain' } }),
      ) as any;
      expect(data.trip.currency).toBe('EUR');
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
      const result = await h.client.callTool({
        name: 'update_trip',
        arguments: { tripId: trip.id, title: 'New Title' },
      });
      const data = parseToolResult(result) as any;
      expect(data.trip.title).toBe('New Title');
    });
  });

  it('partial update preserves unspecified fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'My Trip', description: 'A great trip' });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, title: 'Renamed' } });
      const updated = await tripRow(trip.id);
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
    const planId = await vacayPlanWithYear(user.id);
    for (const d of ['2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07']) {
      await makeVacayEntry(orm, planId, user.id, d, { note: '' });
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

    const oldWindow = await vacayDatesBetween(planId, user.id, '2026-08-01', '2026-08-09');
    expect(oldWindow).toHaveLength(0);

    const shifted = await vacayDatesBetween(planId, user.id, '2026-08-08', '2026-08-16');
    expect(shifted).toEqual(['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14']);
  });

  it('shifts entries from the owners own plan even if another vacay plan is active', async () => {
    const { user } = createUser(testDb);
    const { user: otherOwner } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-09-01', end_date: '2026-09-07' });

    // Own plan with entries that should be shifted.
    const ownPlanId = await vacayPlanWithYear(user.id);
    for (const d of ['2026-09-02', '2026-09-03']) {
      await makeVacayEntry(orm, ownPlanId, user.id, d, { note: '' });
    }

    // Different accepted plan becomes "active" for the owner.
    const { id: foreignPlanId } = await makeVacayPlan(orm, otherOwner.id);
    await addVacayPlanMember(orm, foreignPlanId, user.id, 'accepted');

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip',
        arguments: { tripId: trip.id, start_date: '2026-09-08', end_date: '2026-09-14' },
      });
      expect(result.isError).toBeFalsy();
    });

    const oldWindow = await vacayDatesBetween(ownPlanId, user.id, '2026-09-01', '2026-09-07');
    expect(oldWindow).toHaveLength(0);

    const shifted = await vacayDatesBetween(ownPlanId, user.id, '2026-09-08', '2026-09-14');
    expect(shifted).toEqual(['2026-09-09', '2026-09-10']);
  });

  it('clear_dates turns a dated trip back into a dateless one and un-dates its days', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-07-01', end_date: '2026-07-05' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip',
        arguments: { tripId: trip.id, clear_dates: true },
      });
      expect(result.isError).toBeFalsy();
      const row = await tripRow(trip.id);
      expect(row.start_date).toBeNull();
      expect(row.end_date).toBeNull();
      const dated = await countRows(orm, Days, { trip: trip.id, date: { $ne: null } });
      expect(dated).toBe(0);
    });
  });

  it('clear_dates with a day_count resizes the now dateless trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-07-01', end_date: '2026-07-05' });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, clear_dates: true, day_count: 3 } });
      const days = await countRows(orm, Days, { trip: trip.id });
      expect(days).toBe(3);
    });
  });

  it('refuses clear_dates alongside a start_date and leaves the trip untouched', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-07-01', end_date: '2026-07-05' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip',
        arguments: { tripId: trip.id, clear_dates: true, start_date: '2026-08-01' },
      });
      expect(result.isError).toBe(true);
      const row = await tripRow(trip.id);
      expect(row.start_date).toBe('2026-07-01');
    });
  });

  it('resizes a dateless trip with day_count', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await insertRows(orm, Days, [
      { trip: trip.id, day_number: 1, date: null },
      { trip: trip.id, day_number: 2, date: null },
    ]);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, day_count: 6 } });
      const days = await countRows(orm, Days, { trip: trip.id });
      expect(days).toBe(6);
    });
  });

  it('refuses a day_count outside 1..MAX_TRIP_DAYS', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Untouched' });
    await withHarness(user.id, async (h) => {
      expect(
        (await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, day_count: 0 } })).isError,
      ).toBe(true);
      expect(
        (await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, day_count: MAX_TRIP_DAYS + 1 } }))
          .isError,
      ).toBe(true);
      expect(await countRows(orm, Days, { trip: trip.id })).toBe(0);
    });
  });

  it('says in its description what shortening a dated trip takes, and where the result lists it', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const tool = (await h.client.listTools()).tools.find((t) => t.name === 'update_trip');
      expect(tool?.description).toContain('Shortening a dated trip deletes its last days by position');
      expect(tool?.description).toContain('removed_days');
    });
  });

  it('lists the days an earlier end removed, as they stood before, and none for a rename', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-07-01', end_date: '2026-07-05' });
    const days = await findRows(orm, Days, { trip: trip.id }, { day_number: 'asc' });
    await withHarness(user.id, async (h) => {
      type Answer = { trip: { end_date: string; title: string }; removed_days?: unknown[] };
      const shortened = parseToolResult(
        await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, end_date: '2026-07-03' } }),
      ) as Answer;
      expect(shortened.trip.end_date).toBe('2026-07-03');
      expect(shortened.removed_days).toEqual([
        { id: days[3].id, day_number: 4, date: '2026-07-04', reason: 'overflow' },
        { id: days[4].id, day_number: 5, date: '2026-07-05', reason: 'overflow' },
      ]);
      const renamed = parseToolResult(
        await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, title: 'Shorter' } }),
      ) as Answer;
      expect(renamed.trip.title).toBe('Shorter');
      expect(renamed).not.toHaveProperty('removed_days');
    });
  });

  it('refuses a date range longer than MAX_TRIP_DAYS and leaves the trip untouched', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Untouched', start_date: '2026-07-01', end_date: '2026-07-07' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip',
        arguments: { tripId: trip.id, end_date: '2036-07-01' },
      });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain(`at most ${MAX_TRIP_DAYS} days`);
      const row = await tripRow(trip.id);
      expect(row.end_date).toBe('2026-07-07');
    });
  });

  it('changes reminder_days and can turn the reminder off', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, reminder_days: 10 } });
      expect((await tripRow(trip.id)).reminder_days).toBe(10);
      await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, reminder_days: 0 } });
      expect((await tripRow(trip.id)).reminder_days).toBe(0);
    });
  });

  it('refuses a reminder_days outside 0..30 and keeps the stored value', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_trip',
        arguments: { tripId: trip.id, reminder_days: 31 },
      });
      expect(result.isError).toBe(true);
      expect((await tripRow(trip.id)).reminder_days).toBe(3);
    });
  });

  it('clears the description with an explicit null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { description: 'A great trip' });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, description: null } });
      const row = await tripRow(trip.id);
      expect(row.description).toBeNull();
    });
  });

  it('clears the cover image with an explicit null', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await updateRows(orm, Trips, { id: trip.id }, { cover_image: '/uploads/covers/old.jpg' });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_trip', arguments: { tripId: trip.id, cover_image: null } });
      const row = await tripRow(trip.id);
      expect(row.cover_image).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------
// search_cover_images
// ---------------------------------------------------------------------------

describe('Tool: search_cover_images', () => {
  function stubUnsplash(body: unknown, init: { ok?: boolean; status?: number } = {}) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: init.ok ?? true,
        status: init.status ?? 200,
        json: async () => body,
      })),
    );
  }

  it('returns the photo candidates for a query', async () => {
    const { user } = createUser(testDb);
    stubUnsplash({
      results: [
        {
          id: 'p1',
          urls: {
            regular: 'https://images.unsplash.com/photo-1.jpg',
            small: 'https://images.unsplash.com/thumb-1.jpg',
          },
          alt_description: 'Rooftops at sunset',
          user: { name: 'Ada L.' },
          links: { html: 'https://unsplash.com/photos/p1' },
        },
      ],
    });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'search_cover_images', arguments: { query: 'Lisbon rooftops' } });
      const data = parseToolResult(result) as any;
      expect(data.photos).toHaveLength(1);
      expect(data.photos[0].url).toBe('https://images.unsplash.com/photo-1.jpg');
      expect(data.photos[0].photographer).toBe('Ada L.');
    });
  });

  it('reports an upstream failure as a tool error', async () => {
    const { user } = createUser(testDb);
    stubUnsplash({ errors: ['Rate Limit Exceeded'] }, { ok: false, status: 429 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'search_cover_images', arguments: { query: 'Lisbon' } });
      expect(result.isError).toBe(true);
      expect((result.content as { text: string }[])[0].text).toBe('Rate Limit Exceeded');
    });
  });

  it('refuses an empty query without reaching Unsplash', async () => {
    const { user } = createUser(testDb);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'search_cover_images', arguments: { query: '' } });
      expect(result.isError).toBe(true);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it('saves nothing on the trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    stubUnsplash({ results: [] });
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'search_cover_images', arguments: { query: 'Lisbon' } });
      const row = await tripRow(trip.id);
      expect(row.cover_image).toBeNull();
    });
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
      const gone = await findRow(orm, Trips, { id: trip.id });
      expect(gone).toBeNull();
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
      const stillExists = await findRow(orm, Trips, { id: trip.id });
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
    await updateRows(orm, Trips, { id: archived.id }, { is_archived: 1 });

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
    await updateRows(orm, Trips, { id: archived.id }, { is_archived: 1 });

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

  // Regression — GHSA-qvw8-w937-vcmq: a token WITHOUT trips:read must not receive
  // member emails, the itinerary, or accommodations. The tool stays registered for
  // navigation but only surfaces the trip id + title.
  it('withholds members, days and accommodations from a token without trips:read', async () => {
    const { user } = createUser(testDb, { email: 'owner@test.example.com' });
    const { user: member } = createUser(testDb, { email: 'member@test.example.com' });
    const trip = createTrip(testDb, user.id, { title: 'Confidential Trip' });
    addTripMember(testDb, trip.id, member.id);
    const day = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Colosseum', lat: 41.89, lng: 12.49 });
    createDayAssignment(testDb, day.id, place.id);
    createDayAccommodation(testDb, trip.id, place.id, day.id, day.id);

    const h = await createMcpHarness({ realtime, userId: user.id, withResources: false, scopes: ['weather:read'] });
    try {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      // Navigation still works…
      expect(data.trip.id).toBe(trip.id);
      expect(data.trip.title).toBe('Confidential Trip');
      // …but the confidential core bucket is withheld.
      expect(data.members).toBeUndefined();
      expect(data.days).toBeUndefined();
      expect(data.accommodations).toBeUndefined();
      // No member email must leak anywhere in the payload.
      expect(JSON.stringify(data)).not.toContain('owner@test.example.com');
      expect(JSON.stringify(data)).not.toContain('member@test.example.com');
    } finally {
      await h.cleanup();
    }
  });

  it('returns the full core bucket for a token that has trips:read', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Scoped Trip' });
    addTripMember(testDb, trip.id, member.id);
    createDay(testDb, trip.id);

    const h = await createMcpHarness({ realtime, userId: user.id, withResources: false, scopes: ['trips:read'] });
    try {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      expect(data.trip.title).toBe('Scoped Trip');
      expect(data.members.owner.id).toBe(user.id);
      expect(data.members.collaborators).toHaveLength(1);
      expect(data.days).toHaveLength(1);
    } finally {
      await h.cleanup();
    }
  });

  // Regression: get_trip_summary must hide another member's private packing items (#858).
  it("hides another member's private packing item from the summary", async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id, { title: 'Shared Trip' });
    addTripMember(testDb, trip.id, member.id);
    await makePackingItem(orm, trip.id, {
      name: 'Secret gift',
      category: 'Misc',
      checked: 0,
      is_private: 1,
      owner: owner.id,
    });
    await makePackingItem(orm, trip.id, {
      name: 'Sunscreen',
      category: 'Misc',
      checked: 0,
      is_private: 0,
      owner: owner.id,
    });

    await withHarness(member.id, async (h) => {
      const result = await h.client.callTool({ name: 'get_trip_summary', arguments: { tripId: trip.id } });
      const data = parseToolResult(result) as any;
      const names = (data.packing?.items || []).map((i: any) => i.name);
      expect(names).toContain('Sunscreen'); // common item visible
      expect(names).not.toContain('Secret gift'); // owner's private item hidden from the member
    });
  });
});

// ---------------------------------------------------------------------------
// Resources (moved from resources.test.ts with the DI port — the registry the
// withTools harness attaches now registers them)
// ---------------------------------------------------------------------------

describe('Resource: trek://trips', () => {
  it('returns all trips the user owns or is a member of', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'My Trip' });
    const sharedTrip = createTrip(testDb, other.id, { title: 'Shared Trip' });
    addTripMember(testDb, sharedTrip.id, user.id);
    // Trip from another user (not accessible)
    createTrip(testDb, other.id, { title: 'Other Trip' });

    await withHarness(user.id, async (harness) => {
      const result = await harness.client.readResource({ uri: 'trek://trips' });
      const trips = parseResourceResult(result) as any[];
      expect(trips).toHaveLength(2);
      const titles = trips.map((t) => t.title);
      expect(titles).toContain('My Trip');
      expect(titles).toContain('Shared Trip');
      expect(titles).not.toContain('Other Trip');
    });
  });

  it('excludes archived trips', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Active Trip' });
    const archived = createTrip(testDb, user.id, { title: 'Archived Trip' });
    await updateRows(orm, Trips, { id: archived.id }, { is_archived: 1 });

    await withHarness(user.id, async (harness) => {
      const result = await harness.client.readResource({ uri: 'trek://trips' });
      const trips = parseResourceResult(result) as any[];
      expect(trips).toHaveLength(1);
      expect(trips[0].title).toBe('Active Trip');
    });
  });

  it('returns empty array when user has no trips', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (harness) => {
      const result = await harness.client.readResource({ uri: 'trek://trips' });
      const trips = parseResourceResult(result) as any[];
      expect(trips).toEqual([]);
    });
  });
});

describe('Resource: trek://trips/{tripId}', () => {
  it('returns trip data for an accessible trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { title: 'Paris Trip' });

    await withHarness(user.id, async (harness) => {
      const result = await harness.client.readResource({ uri: `trek://trips/${trip.id}` });
      const data = parseResourceResult(result) as any;
      expect(data.title).toBe('Paris Trip');
      expect(data.id).toBe(trip.id);
    });
  });

  it('returns access denied for inaccessible trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const otherTrip = createTrip(testDb, other.id, { title: 'Private' });

    await withHarness(user.id, async (harness) => {
      const result = await harness.client.readResource({ uri: `trek://trips/${otherTrip.id}` });
      const data = parseResourceResult(result) as any;
      expect(data.error).toBeTruthy();
    });
  });

  it('returns access denied for non-existent ID', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (harness) => {
      const result = await harness.client.readResource({ uri: 'trek://trips/99999' });
      const data = parseResourceResult(result) as any;
      expect(data.error).toBeTruthy();
    });
  });
});

describe('Resource: trek://trips/{tripId}/members', () => {
  it('returns owner and collaborators', async () => {
    const { user } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    addTripMember(testDb, trip.id, member.id);

    await withHarness(user.id, async (harness) => {
      const result = await harness.client.readResource({ uri: `trek://trips/${trip.id}/members` });
      const data = parseResourceResult(result) as any;
      expect(data.owner).toBeTruthy();
      expect(data.owner.id).toBe(user.id);
      expect(data.members).toHaveLength(1);
      expect(data.members[0].id).toBe(member.id);
    });
  });

  it('returns access denied for unauthorized trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);

    await withHarness(user.id, async (harness) => {
      const result = await harness.client.readResource({ uri: `trek://trips/${trip.id}/members` });
      const data = parseResourceResult(result) as any;
      expect(data.error).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// Deprecation notice (fire-once closure riding the registry attach ctx)
// ---------------------------------------------------------------------------

describe('static-token deprecation notice', () => {
  it('list_trips surfaces the notice exactly once and still carries the payload', async () => {
    const { user } = createUser(testDb);
    createTrip(testDb, user.id, { title: 'Noticed' });
    // Mirror the fire-once closure built per session in src/mcp/index.ts.
    let emitted = false;
    const getDeprecationNotice = () => {
      if (emitted) return null;
      emitted = true;
      return 'static tokens are deprecated';
    };
    const h = await createMcpHarness({
      realtime,
      userId: user.id,
      withResources: false,
      isStaticToken: true,
      getDeprecationNotice,
    });
    try {
      const first = await h.client.callTool({ name: 'list_trips', arguments: {} });
      expect(first.isError).toBe(true);
      const texts = (first.content as { type: string; text: string }[]).map((c) => c.text);
      expect(texts[0]).toContain('deprecated');
      expect(JSON.parse(texts[1]).trips[0].title).toBe('Noticed');
      // Second call: the closure already fired — plain payload, no error.
      const second = await h.client.callTool({ name: 'list_trips', arguments: {} });
      expect(second.isError).toBeFalsy();
      expect((parseToolResult(second) as any).trips).toHaveLength(1);
    } finally {
      await h.cleanup();
    }
  });
});

// ---------------------------------------------------------------------------
// Scope gating — declarative trips:write markers plus the predicate escape
// hatches (canReadTrips accepts trips:delete / trips:share; delete_trip rides
// trips:delete, the share tools trips:share)
// ---------------------------------------------------------------------------

describe('scope gating', () => {
  async function toolNames(scopes: string[] | null): Promise<string[]> {
    const h = await createMcpHarness({ realtime, userId: 1, withResources: false, scopes });
    try {
      const { tools } = await h.client.listTools();
      return tools.map((t) => t.name);
    } finally {
      await h.cleanup();
    }
  }

  const WRITE_TOOLS = [
    'create_trip',
    'update_trip',
    'add_trip_member',
    'remove_trip_member',
    'leave_trip',
    'copy_trip',
  ];
  const READ_TOOLS = ['list_trip_members', 'export_trip_ics', 'search_cover_images'];
  const NAV_TOOLS = ['list_trips', 'get_trip_summary'];
  const SHARE_TOOLS = ['get_share_link', 'create_share_link', 'delete_share_link'];

  it('null scopes (trek_ PAT) exposes the full surface', async () => {
    const names = await toolNames(null);
    for (const t of [...WRITE_TOOLS, ...READ_TOOLS, ...NAV_TOOLS, 'delete_trip', ...SHARE_TOOLS]) {
      expect(names).toContain(t);
    }
  });

  it('trips:read exposes reads + navigation but no writes/delete/share', async () => {
    const names = await toolNames(['trips:read']);
    for (const t of [...READ_TOOLS, ...NAV_TOOLS]) expect(names).toContain(t);
    for (const t of [...WRITE_TOOLS, 'delete_trip', ...SHARE_TOOLS]) expect(names).not.toContain(t);
  });

  it('trips:delete alone still grants the trip reads (canReadTrips parity) plus delete_trip', async () => {
    const names = await toolNames(['trips:delete']);
    expect(names).toContain('delete_trip');
    for (const t of [...READ_TOOLS, ...NAV_TOOLS]) expect(names).toContain(t);
    for (const t of WRITE_TOOLS) expect(names).not.toContain(t);
  });

  it('trips:share alone grants the share tools and the trip reads, nothing else', async () => {
    const names = await toolNames(['trips:share']);
    for (const t of [...SHARE_TOOLS, ...READ_TOOLS, ...NAV_TOOLS]) expect(names).toContain(t);
    for (const t of [...WRITE_TOOLS, 'delete_trip']) expect(names).not.toContain(t);
  });

  it('an unrelated scope keeps only the navigation tools', async () => {
    const names = await toolNames(['weather:read']);
    for (const t of NAV_TOOLS) expect(names).toContain(t);
    for (const t of [...WRITE_TOOLS, ...READ_TOOLS, 'delete_trip', ...SHARE_TOOLS]) expect(names).not.toContain(t);
  });
});
