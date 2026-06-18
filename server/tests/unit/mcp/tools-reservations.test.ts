/**
 * Unit tests for MCP reservation tools: create_reservation, update_reservation,
 * delete_reservation, link_hotel_accommodation.
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
import { createUser, createTrip, createDay, createPlace, createReservation, createDayAssignment } from '../../helpers/factories';
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

// ---------------------------------------------------------------------------
// create_reservation
// ---------------------------------------------------------------------------

describe('Tool: create_reservation', () => {
  it('creates a basic reservation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip.id, title: 'Eiffel Tower Tour', type: 'tour' },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.title).toBe('Eiffel Tower Tour');
      expect(data.reservation.type).toBe('tour');
      expect(data.reservation.status).toBe('pending');
    });
  });

  it('creates a hotel reservation and links accommodation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id, { day_number: 1 });
    const day2 = createDay(testDb, trip.id, { day_number: 2 });
    const hotel = createPlace(testDb, trip.id, { name: 'Grand Hotel' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_reservation',
        arguments: {
          tripId: trip.id,
          title: 'Grand Hotel Stay',
          type: 'hotel',
          place_id: hotel.id,
          start_day_id: day1.id,
          end_day_id: day2.id,
          check_in: '15:00',
          check_out: '11:00',
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.type).toBe('hotel');
      expect(data.reservation.accommodation_id).not.toBeNull();
      // accommodation was created
      const acc = testDb.prepare('SELECT * FROM day_accommodations WHERE id = ?').get(data.reservation.accommodation_id) as any;
      expect(acc.place_id).toBe(hotel.id);
      expect(acc.check_in).toBe('15:00');
    });
  });

  it('validates day_id belongs to trip', async () => {
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const dayFromTrip2 = createDay(testDb, trip2.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip1.id, title: 'Flight', type: 'flight', day_id: dayFromTrip2.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('validates assignment_id belongs to trip', async () => {
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const day2 = createDay(testDb, trip2.id);
    const place2 = createPlace(testDb, trip2.id);
    const assignment = createDayAssignment(testDb, day2.id, place2.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip1.id, title: 'Dinner', type: 'restaurant', assignment_id: assignment.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('broadcasts reservation:created event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'create_reservation', arguments: { tripId: trip.id, title: 'Bus', type: 'other' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'reservation:created', expect.any(Object));
    });
  });

  it('broadcasts accommodation:created for hotel type', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id, { day_number: 1 });
    const day2 = createDay(testDb, trip.id, { day_number: 2 });
    const hotel = createPlace(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip.id, title: 'Hotel', type: 'hotel', place_id: hotel.id, start_day_id: day1.id, end_day_id: day2.id },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:created', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'create_reservation', arguments: { tripId: trip.id, title: 'X', type: 'flight' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// update_reservation
// ---------------------------------------------------------------------------

describe('Tool: update_reservation', () => {
  it('updates reservation fields', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id, { title: 'Old Title', type: 'flight' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_reservation',
        arguments: { tripId: trip.id, reservationId: reservation.id, title: 'New Title' },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.title).toBe('New Title');
      expect(data.reservation.type).toBe('flight'); // preserved
    });
  });

  it('updates reservation status to confirmed', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_reservation',
        arguments: { tripId: trip.id, reservationId: reservation.id, status: 'confirmed' },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.status).toBe('confirmed');
    });
  });

  it('broadcasts reservation:updated event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'update_reservation', arguments: { tripId: trip.id, reservationId: reservation.id, title: 'Updated' } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'reservation:updated', expect.any(Object));
    });
  });

  it('returns error for reservation not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_reservation', arguments: { tripId: trip.id, reservationId: 99999, title: 'X' } });
      expect(result.isError).toBe(true);
    });
  });

  it('validates place_id belongs to trip', async () => {
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip1.id);
    const placeFromTrip2 = createPlace(testDb, trip2.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_reservation',
        arguments: { tripId: trip1.id, reservationId: reservation.id, place_id: placeFromTrip2.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const reservation = createReservation(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'update_reservation', arguments: { tripId: trip.id, reservationId: reservation.id, title: 'X' } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// delete_reservation
// ---------------------------------------------------------------------------

describe('Tool: delete_reservation', () => {
  it('deletes a reservation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_reservation', arguments: { tripId: trip.id, reservationId: reservation.id } });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(testDb.prepare('SELECT id FROM reservations WHERE id = ?').get(reservation.id)).toBeUndefined();
    });
  });

  it('cascades to accommodation when linked', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id, { day_number: 1 });
    const day2 = createDay(testDb, trip.id, { day_number: 2 });
    const hotel = createPlace(testDb, trip.id);
    // Create reservation via tool so accommodation is linked
    let reservationId: number;
    await withHarness(user.id, async (h) => {
      const r = await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip.id, title: 'Hotel', type: 'hotel', place_id: hotel.id, start_day_id: day1.id, end_day_id: day2.id },
      });
      reservationId = (parseToolResult(r) as any).reservation.id;
    });

    const accId = (testDb.prepare('SELECT accommodation_id FROM reservations WHERE id = ?').get(reservationId!) as any).accommodation_id;
    expect(accId).not.toBeNull();

    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_reservation', arguments: { tripId: trip.id, reservationId } });
    });

    expect(testDb.prepare('SELECT id FROM day_accommodations WHERE id = ?').get(accId)).toBeUndefined();
  });

  it('broadcasts reservation:deleted event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_reservation', arguments: { tripId: trip.id, reservationId: reservation.id } });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'reservation:deleted', expect.any(Object));
    });
  });

  it('returns error for reservation not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_reservation', arguments: { tripId: trip.id, reservationId: 99999 } });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const reservation = createReservation(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'delete_reservation', arguments: { tripId: trip.id, reservationId: reservation.id } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// link_hotel_accommodation
// ---------------------------------------------------------------------------

describe('Tool: link_hotel_accommodation', () => {
  it('creates new accommodation link for a hotel reservation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id, { day_number: 1 });
    const day2 = createDay(testDb, trip.id, { day_number: 2 });
    const hotel = createPlace(testDb, trip.id, { name: 'Ritz' });
    const reservation = createReservation(testDb, trip.id, { type: 'hotel' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'link_hotel_accommodation',
        arguments: { tripId: trip.id, reservationId: reservation.id, place_id: hotel.id, start_day_id: day1.id, end_day_id: day2.id, check_in: '14:00', check_out: '12:00' },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.accommodation_id).not.toBeNull();
      expect(data.accommodation_id).not.toBeNull();
      // accommodation_id must be a clean integer, not a stringified float ("14.0").
      expect(typeof data.reservation.accommodation_id).toBe('number');
      expect(Number.isInteger(data.reservation.accommodation_id)).toBe(true);
      expect(Number.isInteger(data.accommodation_id)).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:created', expect.any(Object));
    });
  });

  it('updates existing accommodation link', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id, { day_number: 1 });
    const day2 = createDay(testDb, trip.id, { day_number: 2 });
    const day3 = createDay(testDb, trip.id, { day_number: 3 });
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel A' });
    const hotel2 = createPlace(testDb, trip.id, { name: 'Hotel B' });
    const reservation = createReservation(testDb, trip.id, { type: 'hotel' });

    // First link
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'link_hotel_accommodation',
        arguments: { tripId: trip.id, reservationId: reservation.id, place_id: hotel.id, start_day_id: day1.id, end_day_id: day2.id },
      });
    });

    // Update link
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'link_hotel_accommodation',
        arguments: { tripId: trip.id, reservationId: reservation.id, place_id: hotel2.id, start_day_id: day2.id, end_day_id: day3.id },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:updated', expect.any(Object));
    });
  });

  it('returns error for non-hotel reservation', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip.id, { day_number: 1 });
    const day2 = createDay(testDb, trip.id, { day_number: 2 });
    const place = createPlace(testDb, trip.id);
    const reservation = createReservation(testDb, trip.id, { type: 'flight' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'link_hotel_accommodation',
        arguments: { tripId: trip.id, reservationId: reservation.id, place_id: place.id, start_day_id: day1.id, end_day_id: day2.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('validates place_id belongs to trip', async () => {
    const { user } = createUser(testDb);
    const trip1 = createTrip(testDb, user.id);
    const trip2 = createTrip(testDb, user.id);
    const day1 = createDay(testDb, trip1.id, { day_number: 1 });
    const day2 = createDay(testDb, trip1.id, { day_number: 2 });
    const placeFromTrip2 = createPlace(testDb, trip2.id);
    const reservation = createReservation(testDb, trip1.id, { type: 'hotel' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'link_hotel_accommodation',
        arguments: { tripId: trip1.id, reservationId: reservation.id, place_id: placeFromTrip2.id, start_day_id: day1.id, end_day_id: day2.id },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    const day1 = createDay(testDb, trip.id, { day_number: 1 });
    const day2 = createDay(testDb, trip.id, { day_number: 2 });
    const place = createPlace(testDb, trip.id);
    const reservation = createReservation(testDb, trip.id, { type: 'hotel' });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'link_hotel_accommodation',
        arguments: { tripId: trip.id, reservationId: reservation.id, place_id: place.id, start_day_id: day1.id, end_day_id: day2.id },
      });
      expect(result.isError).toBe(true);
    });
  });
});
