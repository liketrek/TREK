/**
 * Unit tests for MCP transport tools: create_transport, update_transport, delete_transport.
 * Focus: flight endpoints supplied with only an IATA `code` are backfilled with
 * lat/lng/timezone from the airport database (the columns are NOT NULL), and
 * endpoints that can't be resolved produce a clean error instead of a SQL crash.
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
import { createUser, createTrip, createDay } from '../../helpers/factories';
import { createMcpHarness, parseToolResult, type McpHarness } from '../../helpers/mcp-harness';

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

const flightEndpoints = [
  { role: 'from', sequence: 0, name: 'Zurich', code: 'ZRH' },
  { role: 'to', sequence: 1, name: 'Paris CDG', code: 'CDG' },
];

// The booking from the report (#1914): AMS → CDG → FCO with a stop in Paris.
const stopoverEndpoints = [
  { role: 'from', sequence: 0, name: 'Amsterdam (AMS)', code: 'AMS' },
  { role: 'stop', sequence: 1, name: 'Paris (CDG)', code: 'CDG' },
  { role: 'to', sequence: 2, name: 'Rome (FCO)', code: 'FCO' },
];

const errorText = (result: unknown) => (result as { content: { text: string }[] }).content[0].text;
const storedMetadata = (reservationId: number) => JSON.parse(
  (testDb.prepare('SELECT metadata FROM reservations WHERE id = ?').get(reservationId) as { metadata: string }).metadata
);

describe('Tool: create_transport', () => {
  it('backfills lat/lng/timezone for code-only flight endpoints', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'ZRH → CDG', endpoints: flightEndpoints },
      });
      const data = parseToolResult(result) as any;
      const eps = data.reservation.endpoints;
      expect(eps).toHaveLength(2);
      const from = eps.find((e: any) => e.role === 'from');
      expect(typeof from.lat).toBe('number');
      expect(typeof from.lng).toBe('number');
      expect(from.timezone).toBe('Europe/Zurich');
      // persisted NOT NULL columns are populated
      const rows = testDb.prepare('SELECT lat, lng FROM reservation_endpoints WHERE reservation_id = ?').all(data.reservation.id) as any[];
      expect(rows.every(r => r.lat != null && r.lng != null)).toBe(true);
    });
  });

  it('keeps manually-supplied coordinates and the caller timezone', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'train', title: 'Scenic train',
          endpoints: [
            { role: 'from', sequence: 0, name: 'Station A', lat: 46.0, lng: 7.0, timezone: 'Europe/Zurich' },
            { role: 'to', sequence: 1, name: 'Station B', lat: 46.5, lng: 7.5 },
          ],
        },
      });
      const data = parseToolResult(result) as any;
      const from = data.reservation.endpoints.find((e: any) => e.role === 'from');
      expect(from.lat).toBe(46.0);
      expect(from.timezone).toBe('Europe/Zurich');
    });
  });

  it('errors on an unresolvable airport code instead of crashing', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'Bad flight',
          endpoints: [{ role: 'from', sequence: 0, name: 'Nowhere', code: 'ZZZ' }],
        },
      });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('ZZZ');
    });
  });

  it('errors on an endpoint missing both coordinates and a code', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'car', title: 'Road trip',
          endpoints: [{ role: 'from', sequence: 0, name: 'My house' }],
        },
      });
      expect(result.isError).toBe(true);
      expect((result.content as any)[0].text).toContain('missing coordinates');
    });
  });

  it('creates a transport with no endpoints', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'TBD flight' },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.title).toBe('TBD flight');
    });
  });
});

describe('Tool: update_transport', () => {
  it('backfills coords when replacing endpoints', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = parseToolResult(await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'F', endpoints: flightEndpoints },
      })) as any;
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          endpoints: [
            { role: 'from', sequence: 0, name: 'JFK', code: 'JFK' },
            { role: 'to', sequence: 1, name: 'Zurich', code: 'ZRH' },
          ],
        },
      });
      const data = parseToolResult(result) as any;
      const from = data.reservation.endpoints.find((e: any) => e.role === 'from');
      expect(from.code).toBe('JFK');
      expect(typeof from.lat).toBe('number');
    });
  });

  it('leaves endpoints untouched when not provided', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = parseToolResult(await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'F', endpoints: flightEndpoints },
      })) as any;
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: { tripId: trip.id, reservationId: created.reservation.id, status: 'confirmed' },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.status).toBe('confirmed');
      expect(data.reservation.endpoints).toHaveLength(2);
    });
  });
});

// ---------------------------------------------------------------------------
// Guards, the budget link and delete
//
// These paths were never covered: the tools lived in src/mcp/, which the
// coverage gate does not measure. Moving them into reservations.mcp.ts put them
// inside src/nest/** and made the gap visible.
// ---------------------------------------------------------------------------

describe('Transport tools: access and validation', () => {
  it('create_transport refuses a trip the caller cannot see', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb, { username: 'stranger' });
    const trip = createTrip(testDb, stranger.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'ZRH → CDG' },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect((result as { content: { text: string }[] }).content[0].text).toContain('Trip not found');
    });
  });

  it('create_transport rejects a start_day_id from another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreignDay = Number(testDb.prepare("INSERT INTO days (trip_id, date, day_number) VALUES (?, '2026-07-01', 1)").run(otherTrip.id).lastInsertRowid);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'train', title: 'ICE', start_day_id: foreignDay },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect((result as { content: { text: string }[] }).content[0].text).toBe('start_day_id does not belong to this trip.');
    });
  });

  it('create_transport rejects an end_day_id from another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreignDay = Number(testDb.prepare("INSERT INTO days (trip_id, date, day_number) VALUES (?, '2026-07-02', 1)").run(otherTrip.id).lastInsertRowid);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'train', title: 'ICE', end_day_id: foreignDay },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect((result as { content: { text: string }[] }).content[0].text).toBe('end_day_id does not belong to this trip.');
    });
  });
});

describe('Transport tools: the price link', () => {
  it('create_transport with a price creates the budget item and broadcasts it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'ZRH → CDG', price: 240, budget_category: 'Flights' },
      });
      const data = parseToolResult(result) as { reservation: { id: number } };

      const item = testDb.prepare('SELECT name, category, total_price FROM budget_items WHERE reservation_id = ?').get(data.reservation.id) as { name: string; category: string; total_price: number };
      expect(item).toMatchObject({ name: 'ZRH → CDG', category: 'Flights', total_price: 240 });
      // The price also rides along in the reservation metadata, as the REST path does.
      expect(broadcastMock.mock.calls.some(c => c[1] === 'budget:created')).toBe(true);
    });
  });

  it('create_transport falls back to the transport type as the budget category', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'train', title: 'ICE 599', price: 89 },
      });
      const data = parseToolResult(result) as { reservation: { id: number } };
      const item = testDb.prepare('SELECT category FROM budget_items WHERE reservation_id = ?').get(data.reservation.id) as { category: string };
      expect(item.category).toBe('train');
    });
  });

  it('create_transport with price 0 records no budget item', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'car', title: 'Rental', price: 0 },
      });
      const data = parseToolResult(result) as { reservation: { id: number } };
      expect(testDb.prepare('SELECT id FROM budget_items WHERE reservation_id = ?').get(data.reservation.id)).toBeUndefined();
    });
  });
});

describe('Tool: update_transport (guards)', () => {
  it('404s an unknown reservation id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: { tripId: trip.id, reservationId: 999999, title: 'nope' },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect((result as { content: { text: string }[] }).content[0].text).toBe('Transport not found.');
    });
  });

  it('refuses a reservation that is not a transport type', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip.id, type: 'restaurant', title: 'Dinner' },
      });
      const { reservation } = parseToolResult(created) as { reservation: { id: number } };

      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: { tripId: trip.id, reservationId: reservation.id, title: 'still dinner' },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect((result as { content: { text: string }[] }).content[0].text).toBe('Reservation is not a transport type. Use update_reservation instead.');
    });
  });

  it('rejects a start_day_id from another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreignDay = Number(testDb.prepare("INSERT INTO days (trip_id, date, day_number) VALUES (?, '2026-08-01', 1)").run(otherTrip.id).lastInsertRowid);
    await withHarness(user.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'ZRH → CDG', endpoints: flightEndpoints },
      });
      const { reservation } = parseToolResult(created) as { reservation: { id: number } };

      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: { tripId: trip.id, reservationId: reservation.id, start_day_id: foreignDay },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect((result as { content: { text: string }[] }).content[0].text).toBe('start_day_id does not belong to this trip.');
    });
  });

  it('errors on an unresolvable airport code when replacing endpoints', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'ZRH → CDG', endpoints: flightEndpoints },
      });
      const { reservation } = parseToolResult(created) as { reservation: { id: number } };

      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id,
          reservationId: reservation.id,
          endpoints: [{ role: 'from', sequence: 0, name: 'Nowhere', code: 'QQQ' }],
        },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect((result as { content: { text: string }[] }).content[0].text).toContain('Could not resolve airport code');
    });
  });
});

describe('Tool: delete_transport', () => {
  it('deletes the booking and broadcasts it', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'ZRH → CDG', endpoints: flightEndpoints },
      });
      const { reservation } = parseToolResult(created) as { reservation: { id: number } };
      broadcastMock.mockClear();

      const result = await h.client.callTool({
        name: 'delete_transport',
        arguments: { tripId: trip.id, reservationId: reservation.id },
      });
      expect(parseToolResult(result)).toEqual({ success: true });
      expect(testDb.prepare('SELECT id FROM reservations WHERE id = ?').get(reservation.id)).toBeUndefined();
      expect(broadcastMock.mock.calls.some(c => c[1] === 'reservation:deleted')).toBe(true);
    });
  });

  it('404s an unknown reservation id', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_transport',
        arguments: { tripId: trip.id, reservationId: 999999 },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect((result as { content: { text: string }[] }).content[0].text).toBe('Transport not found.');
    });
  });

  it('refuses a trip the caller cannot see', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb, { username: 'stranger2' });
    const trip = createTrip(testDb, stranger.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_transport',
        arguments: { tripId: trip.id, reservationId: 1 },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect((result as { content: { text: string }[] }).content[0].text).toContain('Trip not found');
    });
  });
});

// ---------------------------------------------------------------------------
// Multi-leg bookings (#1914)
//
// The per-segment times of a stopover live in metadata.legs; the endpoints only
// carry the onward departure. Before this the tools pinned metadata to string
// values and had no legs parameter, so a stopover created over MCP showed the
// stop's departure as its arrival too.
// ---------------------------------------------------------------------------

describe('Tool: create_transport (multi-leg)', () => {
  it('stores the per-leg times of the reported AMS to CDG to FCO stopover', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { date: '2026-02-04' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO',
          endpoints: stopoverEndpoints,
          legs: [
            { from: 'AMS', to: 'CDG', dep_day_id: day.id, dep_time: '09:00', arr_time: '10:00' },
            { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00' },
          ],
        },
      });
      const data = parseToolResult(result) as any;
      expect(storedMetadata(data.reservation.id).legs).toEqual([
        { from: 'AMS', to: 'CDG', dep_day_id: day.id, dep_time: '09:00', arr_day_id: null, arr_time: '10:00' },
        { from: 'CDG', to: 'FCO', dep_day_id: null, dep_time: '11:00', arr_day_id: null, arr_time: '12:00' },
      ]);
      // Blank endpoint times are filled the way the form writes them: the onward
      // departure on every waypoint but the last, the arrival on the last.
      expect(data.reservation.endpoints.map((e: any) => e.local_time)).toEqual(['09:00', '11:00', '12:00']);
      expect(data.reservation.endpoints[0].local_date).toBe('2026-02-04');
      // The span follows the first and last leg.
      expect(data.reservation.day_id).toBe(day.id);
      expect(data.reservation.reservation_time).toBe('2026-02-04T09:00');
      expect(data.reservation.reservation_end_time).toBe('12:00');
    });
  });

  it('mirrors the flat metadata keys off the first and last leg', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO',
          endpoints: stopoverEndpoints,
          legs: [
            { from: 'AMS', to: 'CDG', airline: 'KLM', flight_number: 'KL1233', seat: '14A' },
            { from: 'CDG', to: 'FCO', airline: 'Air France', flight_number: 'AF1204' },
          ],
        },
      })) as any;
      const meta = storedMetadata(data.reservation.id);
      expect(meta.departure_airport).toBe('AMS');
      expect(meta.arrival_airport).toBe('FCO');
      expect(meta.airline).toBe('KLM');
      expect(meta.flight_number).toBe('KL1233');
      expect(meta.seat).toBe('14A');
    });
  });

  it('stores a per-segment booking reference and leaves the booking-level one alone (#1943)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO',
          endpoints: stopoverEndpoints,
          legs: [
            { from: 'AMS', to: 'CDG', confirmation_number: 'ABC123' },
            { from: 'CDG', to: 'FCO' },
          ],
        },
      })) as any;
      const meta = storedMetadata(data.reservation.id);
      expect(meta.legs[0].confirmation_number).toBe('ABC123');
      // A leg without one gets no key at all, rather than an undefined that
      // serialises away and back as null.
      expect(Object.keys(meta.legs[1])).not.toContain('confirmation_number');
      // The reference of a single segment must never become the booking's: that
      // is a column of its own, fed only by the tool's own parameter.
      expect(meta.confirmation_number).toBeUndefined();
      expect(data.reservation.confirmation_number).toBeNull();
    });
  });

  it('never overwrites a flat key the caller set itself', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO',
          metadata: { airline: 'KLM Cityhopper' },
          endpoints: stopoverEndpoints,
          legs: [
            { from: 'AMS', to: 'CDG', airline: 'KLM' },
            { from: 'CDG', to: 'FCO', airline: 'Air France' },
          ],
        },
      })) as any;
      const meta = storedMetadata(data.reservation.id);
      expect(meta.airline).toBe('KLM Cityhopper');
      expect(meta.legs[0].airline).toBe('KLM');
    });
  });

  it('fills from/to from the endpoint codes when the leg omits them', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO',
          endpoints: stopoverEndpoints,
          legs: [{ dep_time: '09:00', arr_time: '10:00' }, { dep_time: '11:00', arr_time: '12:00' }],
        },
      })) as any;
      const meta = storedMetadata(data.reservation.id);
      expect(meta.legs.map((l: any) => [l.from, l.to])).toEqual([['AMS', 'CDG'], ['CDG', 'FCO']]);
    });
  });

  it('accepts a multi-leg train and mirrors its flat keys', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const data = parseToolResult(await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'train', title: 'Basel to Milano',
          endpoints: [
            { role: 'from', sequence: 0, name: 'Basel SBB', lat: 47.5, lng: 7.6 },
            { role: 'stop', sequence: 1, name: 'Lugano', lat: 46.0, lng: 8.9 },
            { role: 'to', sequence: 2, name: 'Milano Centrale', lat: 45.5, lng: 9.2 },
          ],
          legs: [
            { train_number: 'EC 57', platform: '8', dep_time: '08:33', arr_time: '11:20' },
            { train_number: 'EC 317', platform: '3', dep_time: '11:40', arr_time: '12:55' },
          ],
        },
      })) as any;
      const meta = storedMetadata(data.reservation.id);
      // Station endpoints carry no code, so the labels come from their names.
      expect(meta.legs.map((l: any) => [l.from, l.to])).toEqual([
        ['Basel SBB', 'Lugano'], ['Lugano', 'Milano Centrale'],
      ]);
      expect(meta.train_number).toBe('EC 57');
      expect(meta.platform).toBe('8');
      expect(data.reservation.endpoints.map((e: any) => e.local_time)).toEqual(['08:33', '11:40', '12:55']);
    });
  });

  it('rejects a leg count that does not match the endpoints', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'ZRH to CDG',
          endpoints: flightEndpoints,
          legs: [{ from: 'ZRH', to: 'CDG' }, { from: 'CDG', to: 'FCO' }],
        },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect(errorText(result)).toBe('legs must contain exactly one entry fewer than endpoints (got 2 legs for 2 endpoints).');
    });
  });

  it('rejects a single leg, which no reader would treat as multi-segment', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'ZRH to CDG',
          endpoints: flightEndpoints,
          legs: [{ from: 'ZRH', to: 'CDG', dep_time: '09:00', arr_time: '10:00' }],
        },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect(errorText(result)).toContain('at least 2 entries');
    });
  });

  it('rejects legs on a transport type that has none', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'car', title: 'Rental',
          legs: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
        },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect(errorText(result)).toBe('legs are only supported for flight and train bookings.');
    });
  });

  it('rejects a leg day that belongs to another trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const otherTrip = createTrip(testDb, user.id);
    const foreignDay = createDay(testDb, otherTrip.id, { date: '2026-02-04' });
    await withHarness(user.id, async (h) => {
      const depResult = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO',
          endpoints: stopoverEndpoints,
          legs: [{ from: 'AMS', to: 'CDG', dep_day_id: foreignDay.id }, { from: 'CDG', to: 'FCO' }],
        },
      });
      expect(errorText(depResult)).toBe('legs[0].dep_day_id does not belong to this trip.');

      const arrResult = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO',
          endpoints: stopoverEndpoints,
          legs: [{ from: 'AMS', to: 'CDG' }, { from: 'CDG', to: 'FCO', arr_day_id: foreignDay.id }],
        },
      });
      expect(errorText(arrResult)).toBe('legs[1].arr_day_id does not belong to this trip.');
    });
  });

  it('rejects a leg airport that contradicts its endpoint', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const wrongTo = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO',
          endpoints: stopoverEndpoints,
          legs: [{ from: 'AMS', to: 'FCO' }, { from: 'CDG', to: 'FCO' }],
        },
      });
      expect(errorText(wrongTo)).toBe('legs[0].to (FCO) does not match endpoints[1] (CDG).');

      const wrongFrom = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO',
          endpoints: stopoverEndpoints,
          legs: [{ from: 'AMS', to: 'CDG' }, { from: 'ORY', to: 'FCO' }],
        },
      });
      expect(errorText(wrongFrom)).toBe('legs[1].from (ORY) does not match endpoints[1] (CDG).');
    });
  });

  it('rejects a leg time that contradicts an endpoint time already set', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const withTimes = [
      { ...stopoverEndpoints[0], local_time: '09:00' },
      { ...stopoverEndpoints[1], local_time: '11:30' },
      { ...stopoverEndpoints[2], local_time: '12:30' },
    ];
    await withHarness(user.id, async (h) => {
      const depClash = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO', endpoints: withTimes,
          legs: [
            { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:00' },
            { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:30' },
          ],
        },
      });
      expect(errorText(depClash)).toContain('legs[1].dep_time (11:00) does not match endpoints[1].local_time (11:30)');

      const arrClash = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO', endpoints: withTimes,
          legs: [
            { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:00' },
            { from: 'CDG', to: 'FCO', dep_time: '11:30', arr_time: '12:00' },
          ],
        },
      });
      expect(errorText(arrClash)).toContain('legs[1].arr_time (12:00) does not match endpoints[2].local_time (12:30)');
    });
  });

  it('rejects a span that contradicts the first or last leg', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const dayOne = createDay(testDb, trip.id, { date: '2026-02-04' });
    const dayTwo = createDay(testDb, trip.id, { date: '2026-02-05' });
    await withHarness(user.id, async (h) => {
      const startClash = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO', start_day_id: dayOne.id,
          endpoints: stopoverEndpoints,
          legs: [{ from: 'AMS', to: 'CDG', dep_day_id: dayTwo.id }, { from: 'CDG', to: 'FCO' }],
        },
      });
      expect(errorText(startClash)).toBe(`start_day_id (${dayOne.id}) does not match legs[0].dep_day_id (${dayTwo.id}).`);

      const endClash = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO', end_day_id: dayOne.id,
          endpoints: stopoverEndpoints,
          legs: [{ from: 'AMS', to: 'CDG' }, { from: 'CDG', to: 'FCO', arr_day_id: dayTwo.id }],
        },
      });
      expect(errorText(endClash)).toBe(`end_day_id (${dayOne.id}) does not match legs[1].arr_day_id (${dayTwo.id}).`);
    });
  });

  it('refuses segments smuggled through metadata.legs and names the legs parameter', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'flight', title: 'AMS to FCO',
          endpoints: stopoverEndpoints,
          metadata: { legs: '[{"from":"AMS","to":"CDG"}]' },
        },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect(errorText(result)).toContain('in the legs parameter, not in metadata.legs');
    });
  });
});

describe('Tool: update_transport (multi-leg)', () => {
  const seedStopover = async (h: McpHarness, tripId: number) => parseToolResult(await h.client.callTool({
    name: 'create_transport',
    arguments: {
      tripId, type: 'flight', title: 'AMS to FCO',
      endpoints: stopoverEndpoints,
      legs: [
        { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:00' },
        { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00' },
      ],
    },
  })) as any;

  it('keeps the stored metadata and the day-plan positions when only legs are sent', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await seedStopover(h, trip.id);
      // What an AirTrail import leaves behind: sync ids plus per-leg planner positions.
      testDb.prepare('UPDATE reservations SET metadata = ? WHERE id = ?').run(JSON.stringify({
        departure_airport: 'AMS', arrival_airport: 'FCO', airtrail_ids: ['17', '18'],
        legs: [
          { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:00', day_positions: { 5: 2 } },
          { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00' },
        ],
      }), created.reservation.id);

      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          legs: [
            { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:15' },
            { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00' },
          ],
        },
      });
      const meta = storedMetadata((parseToolResult(result) as any).reservation.id);
      expect(meta.airtrail_ids).toEqual(['17', '18']);
      expect(meta.departure_airport).toBe('AMS');
      expect(meta.legs[0].arr_time).toBe('10:15');
      expect(meta.legs[0].day_positions).toEqual({ 5: 2 });
      expect(meta.legs[1].day_positions).toBeUndefined();
    });
  });

  it('keeps a per-segment booking reference through a legs-only update (#1943)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await seedStopover(h, trip.id);
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          legs: [
            { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:00', confirmation_number: 'ABC123' },
            { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00', confirmation_number: 'XYZ789' },
          ],
        },
      });
      const meta = storedMetadata((parseToolResult(result) as any).reservation.id);
      // The copy-through list in applyLegs is what carries the field: a field
      // missing from it is accepted by the schema and then silently dropped.
      expect(meta.legs.map((l: any) => l.confirmation_number)).toEqual(['ABC123', 'XYZ789']);
      expect(meta.confirmation_number).toBeUndefined();
    });
  });

  it('uses the supplied metadata as the base when both are sent', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await seedStopover(h, trip.id);
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          metadata: { confirmation_source: 'email' },
          legs: [
            { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:00' },
            { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00' },
          ],
        },
      });
      const meta = storedMetadata((parseToolResult(result) as any).reservation.id);
      expect(meta.confirmation_source).toBe('email');
      expect(meta.legs).toHaveLength(2);
      // departure_airport is mirrored back in because the supplied metadata dropped it.
      expect(meta.departure_airport).toBe('AMS');
    });
  });

  it('leaves the metadata alone when neither legs nor metadata are sent', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await seedStopover(h, trip.id);
      const before = storedMetadata(created.reservation.id);
      await h.client.callTool({
        name: 'update_transport',
        arguments: { tripId: trip.id, reservationId: created.reservation.id, status: 'confirmed' },
      });
      expect(storedMetadata(created.reservation.id)).toEqual(before);
    });
  });

  it('counts the stored endpoints when the caller does not replace them', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = parseToolResult(await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'ZRH to CDG', endpoints: flightEndpoints },
      })) as any;
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          legs: [{ from: 'ZRH', to: 'CDG' }, { from: 'CDG', to: 'FCO' }],
        },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect(errorText(result)).toBe('legs must contain exactly one entry fewer than endpoints (got 2 legs for 2 endpoints).');
    });
  });

  it('leaves the endpoint rows untouched when the legs change nothing about them', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await seedStopover(h, trip.id);
      const idsBefore = (testDb.prepare('SELECT id FROM reservation_endpoints WHERE reservation_id = ? ORDER BY sequence')
        .all(created.reservation.id) as any[]).map(r => r.id);
      await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          legs: [
            { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:30' },
            { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00' },
          ],
        },
      });
      const idsAfter = (testDb.prepare('SELECT id FROM reservation_endpoints WHERE reservation_id = ? ORDER BY sequence')
        .all(created.reservation.id) as any[]).map(r => r.id);
      expect(idsAfter).toEqual(idsBefore);
    });
  });

  it('fills the endpoint times when the stored endpoints have none', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = parseToolResult(await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'flight', title: 'AMS to FCO', endpoints: stopoverEndpoints },
      })) as any;
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          legs: [
            { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:00' },
            { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00' },
          ],
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.endpoints.map((e: any) => e.local_time)).toEqual(['09:00', '11:00', '12:00']);
    });
  });

  it('survives a booking whose stored metadata is not valid JSON', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await seedStopover(h, trip.id);
      testDb.prepare('UPDATE reservations SET metadata = ? WHERE id = ?').run('not json at all', created.reservation.id);
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          legs: [
            { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:00' },
            { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00' },
          ],
        },
      });
      expect((result as { isError?: boolean }).isError).toBeFalsy();
      expect(storedMetadata((parseToolResult(result) as any).reservation.id).legs).toHaveLength(2);
    });
  });

  it('recovers legs from double-encoded metadata instead of losing the positions', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await seedStopover(h, trip.id);
      testDb.prepare('UPDATE reservations SET metadata = ? WHERE id = ?').run(JSON.stringify(JSON.stringify({
        legs: [{ from: 'AMS', to: 'CDG', day_positions: { 9: 1 } }, { from: 'CDG', to: 'FCO' }],
      })), created.reservation.id);
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          legs: [
            { from: 'AMS', to: 'CDG', dep_time: '09:00', arr_time: '10:00' },
            { from: 'CDG', to: 'FCO', dep_time: '11:00', arr_time: '12:00' },
          ],
        },
      });
      expect(storedMetadata((parseToolResult(result) as any).reservation.id).legs[0].day_positions).toEqual({ 9: 1 });
    });
  });

  it('rejects legs on a booking that is not a flight or train', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = parseToolResult(await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'car', title: 'Rental' },
      })) as any;
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          legs: [{ from: 'A', to: 'B' }, { from: 'B', to: 'C' }],
        },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect(errorText(result)).toBe('legs are only supported for flight and train bookings.');
    });
  });

  it('refuses segments smuggled through metadata.legs', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await seedStopover(h, trip.id);
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: {
          tripId: trip.id, reservationId: created.reservation.id,
          metadata: { legs: '[{"from":"AMS","to":"CDG"}]' },
        },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect(errorText(result)).toContain('in the legs parameter, not in metadata.legs');
    });
  });
});

// ---------------------------------------------------------------------------
// The full type list
//
// The planner's transport picker offers ten modes; these tools accepted four, so
// a bus or a ferry could be planned in the UI and not through an assistant. The
// cases below pin the whole picker list, and pin that widening it did not also
// hand legs[] to a mode whose form never writes them.
// ---------------------------------------------------------------------------

/** client/src/components/Planner/TransportModal.tsx, in the picker's order. */
const PICKER_TRANSPORT_TYPES = [
  'flight', 'train', 'bus', 'car', 'taxi', 'bicycle', 'cruise', 'ferry', 'transport_other',
] as const;

/** The five the tools used to reject outright. */
const NEWLY_ACCEPTED = ['bus', 'taxi', 'bicycle', 'ferry', 'transport_other'] as const;

describe('Transport tools: the full type list', () => {
  it.each(PICKER_TRANSPORT_TYPES)('create_transport accepts %s', async (type) => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type, title: `A ${type} booking` },
      });
      expect((result as { isError?: boolean }).isError).toBeFalsy();
      const data = parseToolResult(result) as any;
      expect(data.reservation.type).toBe(type);
      const row = testDb.prepare('SELECT type FROM reservations WHERE id = ?').get(data.reservation.id) as any;
      expect(row.type).toBe(type);
    });
  });

  it('stores a bus booking with its stops, times and booking reference', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const depDay = createDay(testDb, trip.id, { day_number: 1 });
    const arrDay = createDay(testDb, trip.id, { day_number: 2 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'bus', title: 'Zurich → Milan',
          start_day_id: depDay.id, end_day_id: arrDay.id,
          reservation_time: '22:30', reservation_end_time: '06:15',
          confirmation_number: 'FLIX-8891',
          endpoints: [
            { role: 'from', sequence: 0, name: 'Zurich Sihlquai', lat: 47.3846, lng: 8.5324 },
            { role: 'to', sequence: 1, name: 'Milano Lampugnano', lat: 45.4936, lng: 9.1177 },
          ],
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.type).toBe('bus');
      expect(data.reservation.confirmation_number).toBe('FLIX-8891');
      expect(data.reservation.endpoints).toHaveLength(2);
      const row = testDb.prepare('SELECT day_id, end_day_id FROM reservations WHERE id = ?').get(data.reservation.id) as any;
      expect(row.day_id).toBe(depDay.id);
      expect(row.end_day_id).toBe(arrDay.id);
    });
  });

  it('reports a missing coordinate on a non-flight endpoint rather than failing the insert', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'ferry', title: 'Piraeus → Santorini',
          endpoints: [{ role: 'from', sequence: 0, name: 'Piraeus' }],
        },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect(errorText(result)).toContain('missing coordinates');
    });
  });

  it.each(NEWLY_ACCEPTED)('update_transport accepts %s as the new type', async (type) => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'car', title: 'Rental' },
      });
      const { reservation } = parseToolResult(created) as { reservation: { id: number } };

      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: { tripId: trip.id, reservationId: reservation.id, type },
      });
      expect((result as { isError?: boolean }).isError).toBeFalsy();
      const row = testDb.prepare('SELECT type FROM reservations WHERE id = ?').get(reservation.id) as any;
      expect(row.type).toBe(type);
    });
  });

  it('update_transport reaches a booking created as a bus', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'bus', title: 'Night bus' },
      });
      const { reservation } = parseToolResult(created) as { reservation: { id: number } };

      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: { tripId: trip.id, reservationId: reservation.id, status: 'confirmed' },
      });
      expect((result as { isError?: boolean }).isError).toBeFalsy();
      const row = testDb.prepare('SELECT status FROM reservations WHERE id = ?').get(reservation.id) as any;
      expect(row.status).toBe('confirmed');
    });
  });

  it('still refuses a type the picker does not offer', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'teleport', title: 'Nope' },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
    });
  });

  it('refuses to hand-make a transit booking, which create_transit_journey owns', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: { tripId: trip.id, type: 'transit', title: 'Tram 4' },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
    });
  });

  it('still lets update_transport reach a stored transit booking', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    // As create_transit_journey leaves it: a transport row carrying an itinerary.
    const reservationId = Number(testDb.prepare(
      "INSERT INTO reservations (trip_id, title, type, status) VALUES (?, 'Tram 4', 'transit', 'pending')"
    ).run(trip.id).lastInsertRowid);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_transport',
        arguments: { tripId: trip.id, reservationId, status: 'confirmed' },
      });
      expect((result as { isError?: boolean }).isError).toBeFalsy();
      const row = testDb.prepare('SELECT status, type FROM reservations WHERE id = ?').get(reservationId) as any;
      expect(row).toMatchObject({ status: 'confirmed', type: 'transit' });
    });
  });

  it('still refuses legs on a mode whose form never writes them', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id, { day_number: 1 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id, type: 'bus', title: 'Zurich → Milan via Lugano',
          endpoints: [
            { role: 'from', sequence: 0, name: 'Zurich', lat: 47.38, lng: 8.53 },
            { role: 'stop', sequence: 1, name: 'Lugano', lat: 46.01, lng: 8.96 },
            { role: 'to', sequence: 2, name: 'Milan', lat: 45.49, lng: 9.11 },
          ],
          legs: [
            { dep_day_id: day.id, dep_time: '22:30', arr_day_id: day.id, arr_time: '00:40' },
            { dep_day_id: day.id, dep_time: '00:50', arr_day_id: day.id, arr_time: '06:15' },
          ],
        },
      });
      expect((result as { isError?: boolean }).isError).toBe(true);
      expect(errorText(result)).toContain('only supported for flight and train');
    });
  });
});
