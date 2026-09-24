/**
 * Unit tests for MCP day and accommodation tools:
 * create_day, delete_day,
 * create_accommodation, create_place_accommodation, update_accommodation,
 * delete_accommodation — plus the trek://trips/{tripId}/accommodations
 * resource (moved from resources.test.ts when the legacy registrar was
 * ported to the DI-discovered DaysMcp).
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
    // Real-SQL implementation: create_place_accommodation's createPlace
    // returns getPlaceWithTags(placeId) — a null stub would make the tool's
    // atomic branch throw before the accommodation insert.
    getPlaceWithTags: (placeId: number | string) => {
      const place = db.prepare(`
        SELECT p.*, c.name as category_name, c.color as category_color, c.icon as category_icon
        FROM places p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?
      `).get(placeId) as { category_id: number | null; category_name: string; category_color: string; category_icon: string } | undefined;
      if (!place) return null;
      const tags = db.prepare(`SELECT t.* FROM tags t JOIN place_tags pt ON t.id = pt.tag_id WHERE pt.place_id = ?`).all(placeId);
      return { ...place, category: place.category_id ? { id: place.category_id, name: place.category_name, color: place.category_color, icon: place.category_icon } : null, tags };
    },
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
import { createUser, createTrip, createDay, createPlace, createDayAccommodation, addTripMember } from '../../helpers/factories';
import { invalidatePermissionsCache } from '../../../src/nest/permissions/permissions-cache';
import { DayRemovalService } from '../../../src/nest/days/day-removal.service';
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

// ---------------------------------------------------------------------------
// create_day
// ---------------------------------------------------------------------------

describe('Tool: create_day', () => {
  it('creates a day with a date', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day',
        arguments: { tripId: trip.id, date: '2025-06-15', notes: 'Arrival day' },
      });
      const data = parseToolResult(result) as any;
      expect(data.day).toBeDefined();
      expect(data.day.date).toBe('2025-06-15');
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'day:created', expect.any(Object));
    });
  });

  it('creates a dateless day', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_day',
        arguments: { tripId: trip.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.day).toBeDefined();
      expect(data.day.date).toBeNull();
    });
  });

  it('reports every bad reference in one message rather than the first', async () => {
    // The validator returns a list and the tool joins it. Without a case that
    // produces more than zero errors, that join is never executed, and a tool
    // that silently created a stay against a foreign place would look fine.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { date: '2025-06-15' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_accommodation',
        arguments: { tripId: trip.id, place_id: 999999, start_day_id: 999998, end_day_id: day.id },
      });
      expect(result.isError).toBe(true);
      const text = (result.content as { text: string }[])[0].text;
      expect(text).toContain('Place not found');
      expect(text).toContain('Start day not found');
      expect(text).toContain(', ');
    });
    expect(testDb.prepare('SELECT COUNT(*) AS n FROM day_accommodations').get()).toEqual({ n: 0 });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_day', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_day', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_day
// ---------------------------------------------------------------------------

describe('Tool: delete_day', () => {
  const dayRows = (tripId: number) =>
    testDb.prepare('SELECT id, day_number, date FROM days WHERE trip_id = ? ORDER BY day_number').all(tripId) as { id: number; day_number: number; date: string | null }[];

  it('deletes a day the way REST does: the gap closes, the dates stay on their slots, and every screen hears it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id, { start_date: '2026-01-01', end_date: '2026-01-03' });
    const [d1, d2, d3] = dayRows(trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_day',
        arguments: { tripId: trip.id, dayId: d2.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(testDb.prepare('SELECT id FROM days WHERE id = ?').get(d2.id)).toBeUndefined();
      expect(dayRows(trip.id)).toEqual([
        { id: d1.id, day_number: 1, date: '2026-01-01' },
        { id: d3.id, day_number: 2, date: '2026-01-02' },
      ]);
      expect(testDb.prepare('SELECT end_date FROM trips WHERE id = ?').get(trip.id)).toEqual({ end_date: '2026-01-02' });
      const events = broadcastMock.mock.calls.map(c => c[1]);
      expect(events).toEqual(['day:deleted', 'day:reordered', 'trip:updated']);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'day:deleted', expect.objectContaining({ dayId: d2.id }));
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'day:reordered', expect.objectContaining({ orderedIds: [d1.id, d3.id] }));
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'trip:updated', expect.objectContaining({ trip: expect.objectContaining({ id: trip.id, end_date: '2026-01-02' }) }));
    });
  });

  it('cancels a stay checking in on the day with its booking, and says so', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const d1 = createDay(testDb, trip.id);
    const d2 = createDay(testDb, trip.id);
    const place = createPlace(testDb, trip.id, { name: 'Harbour Hotel' });
    const stay = createDayAccommodation(testDb, trip.id, place.id, d2.id, d2.id);
    const reservationId = Number(testDb.prepare(
      "INSERT INTO reservations (trip_id, day_id, title, type, accommodation_id) VALUES (?, ?, 'Harbour Hotel', 'hotel', ?)",
    ).run(trip.id, d2.id, stay.id).lastInsertRowid);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_day', arguments: { tripId: trip.id, dayId: d2.id } });
      expect(result.isError).toBeFalsy();
      expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(stay.id)).toBeUndefined();
      expect(testDb.prepare('SELECT id FROM reservations WHERE id = ?').get(reservationId)).toBeUndefined();
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'reservation:deleted', expect.objectContaining({ reservationId }));
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:deleted', expect.objectContaining({ accommodationId: stay.id }));
      expect(dayRows(trip.id).map(r => r.id)).toEqual([d1.id]);
    });
  });

  it('refuses the last day of a trip with the REST sentence and leaves it in place', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_day', arguments: { tripId: trip.id, dayId: day.id } });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('A trip needs at least one day.');
      expect(testDb.prepare('SELECT id FROM days WHERE id = ?').get(day.id)).toBeDefined();
      expect(broadcastMock).not.toHaveBeenCalled();
    });
  });

  it('lets an unexpected failure surface as one, not as the last-day refusal', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    createDay(testDb, trip.id);
    const boom = vi.spyOn(DayRemovalService.prototype, 'remove').mockImplementation(() => { throw new Error('disk full'); });
    try {
      await withHarness(user.id, async (h) => {
        const result = await h.client.callTool({ name: 'delete_day', arguments: { tripId: trip.id, dayId: day.id } });
        expect(result.isError).toBe(true);
        expect(JSON.stringify(result.content)).not.toContain('A trip needs at least one day.');
        expect(broadcastMock).not.toHaveBeenCalled();
      });
    } finally {
      boom.mockRestore();
    }
  });

  it('reports a day that is not on the trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_day', arguments: { tripId: trip.id, dayId: 999999 } });
      expect(result.isError).toBe(true);
      expect(JSON.stringify(result.content)).toContain('Day not found.');
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_day', arguments: { tripId: trip.id, dayId: day.id } });
      expect(result.isError).toBe(true);
    });
  });

  it('refuses a member without day_edit, the same right the REST route asks for', async () => {
    const { user: owner } = createUser(testDb);
    const { user: member } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, member.id);
    const day = createDay(testDb, trip.id);
    createDay(testDb, trip.id);
    testDb.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('perm_day_edit', 'trip_owner')").run();
    invalidatePermissionsCache();
    try {
      await withHarness(member.id, async (h) => {
        const result = await h.client.callTool({ name: 'delete_day', arguments: { tripId: trip.id, dayId: day.id } });
        expect(result.isError).toBe(true);
        expect(testDb.prepare('SELECT id FROM days WHERE id = ?').get(day.id)).toBeDefined();
      });
    } finally {
      testDb.prepare("DELETE FROM app_settings WHERE key = 'perm_day_edit'").run();
      invalidatePermissionsCache();
    }
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_day', arguments: { tripId: trip.id, dayId: day.id } });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT id FROM days WHERE id = ?').get(day.id)).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// create_accommodation
// ---------------------------------------------------------------------------

describe('Tool: create_accommodation', () => {
  it('creates an accommodation and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id, { name: 'Hotel du Louvre' });
    const day1 = createDay(testDb, trip.id, { date: '2025-06-15' });
    const day2 = createDay(testDb, trip.id, { date: '2025-06-17' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_accommodation',
        arguments: {
          tripId: trip.id,
          place_id: place.id,
          start_day_id: day1.id,
          end_day_id: day2.id,
          check_in: '15:00',
          check_in_end: '20:00',
          check_out: '11:00',
          confirmation: 'CONF123',
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.accommodation).toBeDefined();
      expect(data.accommodation.check_in_end).toBe('20:00');
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:created', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const place = createPlace(testDb, trip.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_accommodation',
        arguments: { tripId: trip.id, place_id: place.id, start_day_id: day.id, end_day_id: day.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_accommodation',
        arguments: { tripId: trip.id, place_id: place.id, start_day_id: day.id, end_day_id: day.id },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_accommodation
// ---------------------------------------------------------------------------

describe('Tool: update_accommodation', () => {
  it('updates accommodation fields and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const acc = createDayAccommodation(testDb, trip.id, place.id, day1.id, day2.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_accommodation',
        arguments: { tripId: trip.id, accommodationId: acc.id, confirmation: 'NEW-CONF', check_in: '14:00' },
      });
      const data = parseToolResult(result) as any;
      expect(data.accommodation).toBeDefined();
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:updated', expect.any(Object));
    });
  });

  it('returns error for non-existent accommodation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_accommodation',
        arguments: { tripId: trip.id, accommodationId: 99999, confirmation: 'X' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_accommodation',
        arguments: { tripId: trip.id, accommodationId: 1, confirmation: 'X' },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_accommodation
// ---------------------------------------------------------------------------

describe('Tool: delete_accommodation', () => {
  it('deletes accommodation and broadcasts', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const place = createPlace(testDb, trip.id);
    const day1 = createDay(testDb, trip.id);
    const day2 = createDay(testDb, trip.id);
    const acc = createDayAccommodation(testDb, trip.id, place.id, day1.id, day2.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_accommodation',
        arguments: { tripId: trip.id, accommodationId: acc.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:deleted', expect.objectContaining({ id: acc.id }));
      expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(acc.id)).toBeUndefined();
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_accommodation', arguments: { tripId: trip.id, accommodationId: 1 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// create_place_accommodation
// ---------------------------------------------------------------------------

describe('Tool: create_place_accommodation', () => {
  // #2483: the place it creates takes its website through the same contract as
  // create_place, so a bare host from search_place lands as https.
  it('MCP-ACCOM-2483-01: a website without a scheme is stored with https', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'create_place_accommodation',
        arguments: { tripId: trip.id, name: 'Hôtel du Faouët', start_day_id: day.id, end_day_id: day.id, website: 'www.hotel-faouet.example' },
      })) as { place: { id: number } };
      expect(testDb.prepare('SELECT website FROM places WHERE id = ?').get(data.place.id)).toEqual({ website: 'https://www.hotel-faouet.example' });
    });
  });

  // The tool always took any text as the website. It still does, so no call that
  // went through before fails now; a value the place contract refuses is left
  // off rather than stored, and '' stays "no website" as it is on REST.
  it('MCP-ACCOM-2483-02: a website that is empty, free text or a script link books the stay without one', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      for (const [name, website] of [['Empty', ''], ['Words', 'ask at the front desk'], ['Hostile', 'javascript:alert(1)']]) {
        const result = await h.client.callTool({
          name: 'create_place_accommodation',
          arguments: { tripId: trip.id, name, start_day_id: day.id, end_day_id: day.id, website },
        });
        expect(result.isError, name).toBeFalsy();
        const data = parseToolResult(result) as { place: { id: number; website: unknown }; accommodation: { id: number } };
        expect(data.place.website, name).toBeNull();
        expect(data.accommodation.id, name).toBeGreaterThan(0);
        expect(testDb.prepare('SELECT website FROM places WHERE id = ?').get(data.place.id), name).toEqual({ website: null });
      }
    });
  });

  it('creates the place and the accommodation atomically and broadcasts both', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_place_accommodation',
        arguments: {
          tripId: trip.id, name: 'Ryokan Sakura', start_day_id: day.id, end_day_id: day.id,
          check_in: '15:00', accommodation_notes: 'Tatami room',
        },
      });
      const data = parseToolResult(result) as { place: { id: number; name: string }; accommodation: { id: number } };
      expect(data.place.name).toBe('Ryokan Sakura');
      expect(data.accommodation).toMatchObject({ place_id: data.place.id, start_day_id: day.id, end_day_id: day.id, notes: 'Tatami room' });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'place:created', expect.objectContaining({ place: expect.anything() }));
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:created', expect.objectContaining({ accommodation: expect.anything() }));
      // The partner hotel reservation rides along.
      const linked = testDb.prepare('SELECT type FROM reservations WHERE accommodation_id = ?').get(data.accommodation.id) as { type: string };
      expect(linked.type).toBe('hotel');
    });
  });

  it('reports the day-validation errors without creating anything', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_place_accommodation',
        arguments: { tripId: trip.id, name: 'Nowhere Inn', start_day_id: 99999, end_day_id: 99999 },
      });
      expect(result.isError).toBe(true);
      expect(testDb.prepare('SELECT COUNT(*) as n FROM places WHERE trip_id = ?').get(trip.id)).toMatchObject({ n: 0 });
    });
  });

  it('a write that fails inside the transaction rolls both halves back and says so', async () => {
    // The place, the stay and the day stop the stay implies go in together or not at
    // all. A category that is not there is the cheapest way to make the first insert
    // fail on a foreign key; what matters is that the tool answers with an error
    // instead of a half-written trip.
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_place_accommodation',
        arguments: { tripId: trip.id, name: 'Hotel Nirgendwo', category_id: 99999, start_day_id: day.id, end_day_id: day.id },
      });
      expect(result.isError).toBe(true);
      const { content } = result as { content: { type: string; text?: string }[] };
      expect(content[0].text).toContain('Failed to create place and accommodation');
      expect(testDb.prepare('SELECT COUNT(*) as n FROM places WHERE trip_id = ?').get(trip.id)).toMatchObject({ n: 0 });
      expect(testDb.prepare('SELECT COUNT(*) as n FROM day_accommodations WHERE trip_id = ?').get(trip.id)).toMatchObject({ n: 0 });
      expect(testDb.prepare('SELECT COUNT(*) as n FROM day_assignments WHERE day_id = ?').get(day.id)).toMatchObject({ n: 0 });
    });
  });
});

// ---------------------------------------------------------------------------
// trek://trips/{tripId}/accommodations resource (moved from resources.test.ts)
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/accommodations', () => {
  it('returns accommodations for a trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id, { day_number: 1 });
    const day2 = createDay(testDb, trip.id, { day_number: 2 });
    const place = createPlace(testDb, trip.id, { name: 'Grand Hotel' });
    createDayAccommodation(testDb, trip.id, place.id, day1.id, day2.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/accommodations` });
      const items = parseResourceResult(result) as any[];
      expect(items).toHaveLength(1);
      expect(items[0].place_name).toBe('Grand Hotel');
    });
  });

  it('returns access denied for unauthorized trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/accommodations` });
      const data = parseResourceResult(result) as any;
      expect(data.error).toBeTruthy();
    });
  });
});
