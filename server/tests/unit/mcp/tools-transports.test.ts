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
import { createUser, createTrip } from '../../helpers/factories';
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
