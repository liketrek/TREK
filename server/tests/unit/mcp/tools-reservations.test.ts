/**
 * Unit tests for MCP reservation tools: create_reservation, update_reservation,
 * delete_reservation, link_hotel_accommodation.
 */
import { db as testDb } from '../../../src/db/database';
import { BudgetItems } from '../../../src/db/entities/BudgetItems.entity';
import { DayAccommodations } from '../../../src/db/entities/DayAccommodations.entity';
import { ReservationDayPositions } from '../../../src/db/entities/ReservationDayPositions.entity';
import { ReservationTravelers } from '../../../src/db/entities/ReservationTravelers.entity';
import { Reservations } from '../../../src/db/entities/Reservations.entity';
import { Trips } from '../../../src/db/entities/Trips.entity';
import { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import {
  createUser,
  createTrip,
  createDay,
  createPlace,
  createReservation,
  createBudgetItem,
  createDayAssignment,
  createDayAccommodation,
  createCategory,
  addTripMember,
} from '../../helpers/factories';
import { countRows, findRow, findRows, insertRow, updateRows } from '../../helpers/factories/rows';
import { FakeRealtimeService } from '../../helpers/fake-realtime';
import { createMcpHarness, parseToolResult, parseResourceResult, type McpHarness } from '../../helpers/mcp-harness';
import { resetTestDb } from '../../helpers/test-db';
import { createTestOrm, type TestOrm } from '../../helpers/test-orm';

import { describe, it, expect, vi, beforeAll, beforeEach, afterAll } from 'vitest';

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

async function reservationRow(id: number) {
  return (await findRow(orm, Reservations, { id }))!;
}

async function reservationUrl(id: number) {
  const row = await findRow(orm, Reservations, { id });
  return row ? { url: row.url } : undefined;
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
  const h = await createMcpHarness({ realtime, userId, withResources: false });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
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

  it('creates a parking reservation (#1444)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip.id, title: 'Airport Parking P1', type: 'parking' },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.title).toBe('Airport Parking P1');
      expect(data.reservation.type).toBe('parking');
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
      const acc = (await findRow(orm, DayAccommodations, { id: Number(data.reservation.accommodation_id) }))!;
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
      await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip.id, title: 'Bus', type: 'other' },
      });
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
        arguments: {
          tripId: trip.id,
          title: 'Hotel',
          type: 'hotel',
          place_id: hotel.id,
          start_day_id: day1.id,
          end_day_id: day2.id,
        },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:created', expect.any(Object));
    });
  });

  it('returns access denied for non-member', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip.id, title: 'X', type: 'flight' },
      });
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
      await h.client.callTool({
        name: 'update_reservation',
        arguments: { tripId: trip.id, reservationId: reservation.id, title: 'Updated' },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'reservation:updated', expect.any(Object));
    });
  });

  it('re-files a linked expense on a type change in the same write, as REST and the plugin RPC do', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id, { title: 'Dinner', type: 'restaurant' });
    const auto = createBudgetItem(testDb, trip.id, { name: 'Dinner', category: 'food' });
    const picked = createBudgetItem(testDb, trip.id, { name: 'Taxi', category: 'transport' });
    await updateRows(orm, BudgetItems, { id: { $in: [auto.id, picked.id] } }, { reservation: reservation.id });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_reservation',
        arguments: { tripId: trip.id, reservationId: reservation.id, type: 'activity' },
      });
      expect((parseToolResult(result) as { reservation: { type: string } }).reservation.type).toBe('activity');
    });
    // restaurant -> activity moves the auto-derived category; the hand-picked one stays.
    expect(
      (await findRows(orm, BudgetItems, { trip: trip.id }, { id: 'asc' })).map((r) => ({
        id: r.id,
        category: r.category,
      })),
    ).toEqual([
      { id: auto.id, category: 'activities' },
      { id: picked.id, category: 'transport' },
    ]);
    const updated = broadcastMock.mock.calls
      .filter((c) => c[1] === 'budget:updated')
      .map((c) => (c[2] as { item: { id: number } }).item.id);
    expect(updated).toEqual([auto.id]);
    const events = broadcastMock.mock.calls.map((c) => c[1]);
    expect(events.indexOf('budget:updated')).toBeLessThan(events.indexOf('reservation:updated'));
  });

  // #2631: the day planner puts a booking moved on a day by its day slot, and the
  // edit's answer and broadcast replace the booking in every open list.
  it('keeps the day slots in the answer and the broadcast', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const day = createDay(testDb, trip.id);
    const reservation = createReservation(testDb, trip.id, { title: 'Bus', type: 'bus' });
    await insertRow(orm, ReservationDayPositions, { reservation: reservation.id, day: day.id, position: 2.5 });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_reservation',
        arguments: { tripId: trip.id, reservationId: reservation.id, notes: 'aisle' },
      });
      type Answer = { reservation: { day_positions: Record<string, number> | null } };
      expect((parseToolResult(result) as Answer).reservation.day_positions).toEqual({ [day.id]: 2.5 });
      const sent = broadcastMock.mock.calls.find((c) => c[1] === 'reservation:updated')?.[2] as Answer;
      expect(sent.reservation.day_positions).toEqual({ [day.id]: 2.5 });
    });
  });

  it('returns error for reservation not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'update_reservation',
        arguments: { tripId: trip.id, reservationId: 99999, title: 'X' },
      });
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
      const result = await h.client.callTool({
        name: 'update_reservation',
        arguments: { tripId: trip.id, reservationId: reservation.id, title: 'X' },
      });
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
      const result = await h.client.callTool({
        name: 'delete_reservation',
        arguments: { tripId: trip.id, reservationId: reservation.id },
      });
      const data = parseToolResult(result) as any;
      expect(data.success).toBe(true);
      expect(await findRow(orm, Reservations, { id: reservation.id })).toBeNull();
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
        arguments: {
          tripId: trip.id,
          title: 'Hotel',
          type: 'hotel',
          place_id: hotel.id,
          start_day_id: day1.id,
          end_day_id: day2.id,
        },
      });
      reservationId = (parseToolResult(r) as any).reservation.id;
    });

    const accId = (await reservationRow(reservationId!)).accommodation_id;
    expect(accId).not.toBeNull();

    await withHarness(user.id, async (h) => {
      await h.client.callTool({ name: 'delete_reservation', arguments: { tripId: trip.id, reservationId } });
    });

    expect(await findRow(orm, DayAccommodations, { id: Number(accId) })).toBeNull();
  });

  it('broadcasts reservation:deleted event', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'delete_reservation',
        arguments: { tripId: trip.id, reservationId: reservation.id },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'reservation:deleted', expect.any(Object));
      // Nothing was linked, so no expense is announced gone.
      expect(broadcastMock.mock.calls.some((c) => c[1] === 'budget:deleted')).toBe(false);
    });
  });

  it('takes every linked expense with it and announces each one, as the REST route does (#2084)', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const reservation = createReservation(testDb, trip.id);
    const fare = createBudgetItem(testDb, trip.id, { name: 'Fare' });
    const luggage = createBudgetItem(testDb, trip.id, { name: 'Luggage' });
    const unrelated = createBudgetItem(testDb, trip.id, { name: 'Coffee' });
    await updateRows(orm, BudgetItems, { id: { $in: [fare.id, luggage.id] } }, { reservation: reservation.id });
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_reservation',
        arguments: { tripId: trip.id, reservationId: reservation.id },
      });
      expect(parseToolResult(result)).toEqual({ success: true });
    });
    expect((await findRows(orm, BudgetItems, { trip: trip.id }, { id: 'asc' })).map((r) => ({ id: r.id }))).toEqual([
      { id: unrelated.id },
    ]);
    const deleted = broadcastMock.mock.calls
      .filter((c) => c[1] === 'budget:deleted')
      .map((c) => (c[2] as { itemId: number }).itemId);
    expect(deleted).toEqual([fare.id, luggage.id]);
    // The expenses go out before the booking, so no client is left holding a link to nothing.
    const events = broadcastMock.mock.calls.map((c) => c[1]);
    expect(events.lastIndexOf('budget:deleted')).toBeLessThan(events.indexOf('reservation:deleted'));
  });

  it('returns error for reservation not found', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'delete_reservation',
        arguments: { tripId: trip.id, reservationId: 99999 },
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
      const result = await h.client.callTool({
        name: 'delete_reservation',
        arguments: { tripId: trip.id, reservationId: reservation.id },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// The notice to fellow travellers
// ---------------------------------------------------------------------------

describe('Reservation tools: the booking notice', () => {
  // The booking routes always told the other travellers; the tools did not.
  it('create, update, the hotel link and delete each tell the fellow travellers, as REST does', async () => {
    const notify = vi.spyOn(ReservationsService.prototype, 'notifyBookingChange').mockResolvedValue(undefined);
    try {
      const { user } = createUser(testDb);
      const trip = createTrip(testDb, user.id);
      const day1 = createDay(testDb, trip.id, { day_number: 1 });
      const day2 = createDay(testDb, trip.id, { day_number: 2 });
      const hotel = createPlace(testDb, trip.id, { name: 'Ritz' });
      await withHarness(user.id, async (h) => {
        const created = parseToolResult(
          await h.client.callTool({
            name: 'create_reservation',
            arguments: { tripId: trip.id, title: 'Ritz', type: 'hotel' },
          }),
        ) as { reservation: { id: number } };
        const reservationId = created.reservation.id;
        await h.client.callTool({
          name: 'update_reservation',
          arguments: { tripId: trip.id, reservationId, title: 'Ritz Paris' },
        });
        await h.client.callTool({
          name: 'link_hotel_accommodation',
          arguments: { tripId: trip.id, reservationId, place_id: hotel.id, start_day_id: day1.id, end_day_id: day2.id },
        });
        await h.client.callTool({ name: 'delete_reservation', arguments: { tripId: trip.id, reservationId } });
      });
      // The trip id travels as text from some callers and as a number from others; the notice reads both alike.
      expect(notify.mock.calls.map(([tripId, ...rest]) => [Number(tripId), ...rest])).toEqual([
        [trip.id, user.id, 'Ritz', 'hotel'],
        [trip.id, user.id, 'Ritz Paris', 'hotel'],
        [trip.id, user.id, 'Ritz Paris', 'hotel'],
        [trip.id, user.id, 'Ritz Paris', 'hotel'],
      ]);
    } finally {
      notify.mockRestore();
    }
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
        arguments: {
          tripId: trip.id,
          reservationId: reservation.id,
          place_id: hotel.id,
          start_day_id: day1.id,
          end_day_id: day2.id,
          check_in: '14:00',
          check_out: '12:00',
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.accommodation_id).not.toBeNull();
      expect(data.accommodation_id).not.toBeNull();
      // accommodation_id must be a clean integer, not a stringified float ("14.0").
      expect(typeof data.reservation.accommodation_id).toBe('number');
      expect(Number.isInteger(data.reservation.accommodation_id)).toBe(true);
      expect(Number.isInteger(data.accommodation_id)).toBe(true);
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:created', expect.any(Object));
      // A new stay is created, not also updated: the booking form's PUT sends the same.
      expect(broadcastMock.mock.calls.some((c) => c[1] === 'accommodation:updated')).toBe(false);
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
        arguments: {
          tripId: trip.id,
          reservationId: reservation.id,
          place_id: hotel.id,
          start_day_id: day1.id,
          end_day_id: day2.id,
        },
      });
    });

    // Update link
    broadcastMock.mockClear();
    await withHarness(user.id, async (h) => {
      await h.client.callTool({
        name: 'link_hotel_accommodation',
        arguments: {
          tripId: trip.id,
          reservationId: reservation.id,
          place_id: hotel2.id,
          start_day_id: day2.id,
          end_day_id: day3.id,
        },
      });
      expect(broadcastMock).toHaveBeenCalledWith(trip.id, 'accommodation:updated', expect.any(Object));
      // The stay already existed, so it is not announced as a new one.
      expect(broadcastMock.mock.calls.some((c) => c[1] === 'accommodation:created')).toBe(false);
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
        arguments: {
          tripId: trip.id,
          reservationId: reservation.id,
          place_id: place.id,
          start_day_id: day1.id,
          end_day_id: day2.id,
        },
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
        arguments: {
          tripId: trip1.id,
          reservationId: reservation.id,
          place_id: placeFromTrip2.id,
          start_day_id: day1.id,
          end_day_id: day2.id,
        },
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
        arguments: {
          tripId: trip.id,
          reservationId: reservation.id,
          place_id: place.id,
          start_day_id: day1.id,
          end_day_id: day2.id,
        },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// trek://trips/{tripId}/reservations resource (moved from the legacy
// registerResources into the DI-discovered ReservationsMcp)
// ---------------------------------------------------------------------------

describe('Resource: trek://trips/{tripId}/reservations', () => {
  it('returns reservations for a trip', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    createReservation(testDb, trip.id, { title: 'Flight to Paris', type: 'flight' });

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/reservations` });
      const items = parseResourceResult(result) as { title: string }[];
      expect(items).toHaveLength(1);
      expect(items[0].title).toBe('Flight to Paris');
    });
  });

  it('returns access denied for unauthorized trip', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const trip = createTrip(testDb, other.id);

    await withHarness(user.id, async (h) => {
      const result = await h.client.readResource({ uri: `trek://trips/${trip.id}/reservations` });
      const data = parseResourceResult(result) as { error?: string };
      expect(data.error).toBeTruthy();
    });
  });
});

// ---------------------------------------------------------------------------
// set_reservation_travelers (#1517)
//
// Reads already hydrate a booking's travellers; there was no way to write them,
// so an imported booking could not record who was on it. The roster filter lives
// in the service, so the cases below pin that an off-trip id is dropped rather
// than attached, and that a guest, the only representation of a companion
// without an account, is assignable like any member.
// ---------------------------------------------------------------------------

describe('Tool: set_reservation_travelers', () => {
  async function makeBooking(h: McpHarness, tripId: number): Promise<number> {
    const created = await h.client.callTool({
      name: 'create_reservation',
      arguments: { tripId, type: 'event', title: 'Concert' },
    });
    return (parseToolResult(created) as any).reservation.id;
  }

  it('sets the travellers on a booking', async () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, friend.id);
    await withHarness(owner.id, async (h) => {
      const reservationId = await makeBooking(h, trip.id);
      const result = await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId, user_ids: [owner.id, friend.id] },
      });
      const data = parseToolResult(result) as any;
      expect(data.travelers.map((t: any) => t.user_id).sort()).toEqual([owner.id, friend.id].sort());
      const rows = await findRows(orm, ReservationTravelers, { reservation: reservationId });
      expect(rows).toHaveLength(2);
    });
  });

  it('assigns a guest, who has no account to look up', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await withHarness(owner.id, async (h) => {
      const guestResult = await h.client.callTool({
        name: 'create_trip_guest',
        arguments: { tripId: trip.id, name: 'Anna' },
      });
      const guestId = (parseToolResult(guestResult) as any).member.id;
      const reservationId = await makeBooking(h, trip.id);

      const result = await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId, user_ids: [guestId] },
      });
      const data = parseToolResult(result) as any;
      expect(data.travelers).toHaveLength(1);
      expect(data.travelers[0].username).toBe('Anna');
      expect(data.travelers[0].is_guest).toBeTruthy();
    });
  });

  it('replaces the previous list rather than adding to it', async () => {
    const { user: owner } = createUser(testDb);
    const { user: friend } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    addTripMember(testDb, trip.id, friend.id);
    await withHarness(owner.id, async (h) => {
      const reservationId = await makeBooking(h, trip.id);
      await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId, user_ids: [owner.id, friend.id] },
      });
      const result = await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId, user_ids: [friend.id] },
      });
      const data = parseToolResult(result) as any;
      expect(data.travelers.map((t: any) => t.user_id)).toEqual([friend.id]);
    });
  });

  it('clears the list on an empty array', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await withHarness(owner.id, async (h) => {
      const reservationId = await makeBooking(h, trip.id);
      await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId, user_ids: [owner.id] },
      });
      const result = await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId, user_ids: [] },
      });
      expect((parseToolResult(result) as any).travelers).toEqual([]);
      expect(await findRows(orm, ReservationTravelers, { reservation: reservationId })).toEqual([]);
    });
  });

  it('drops a user who is not on the trip instead of attaching them', async () => {
    const { user: owner } = createUser(testDb);
    const { user: outsider } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await withHarness(owner.id, async (h) => {
      const reservationId = await makeBooking(h, trip.id);
      const result = await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId, user_ids: [owner.id, outsider.id] },
      });
      const data = parseToolResult(result) as any;
      expect(data.travelers.map((t: any) => t.user_id)).toEqual([owner.id]);
      // A caller that guessed an id for a name it could not resolve is told so
      // rather than getting a plain success with a shorter list.
      expect(data.ignored_user_ids).toEqual([outsider.id]);
    });
  });

  it('says nothing about ignored ids when every id was on the trip', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await withHarness(owner.id, async (h) => {
      const reservationId = await makeBooking(h, trip.id);
      const result = await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId, user_ids: [owner.id] },
      });
      const data = parseToolResult(result) as any;
      expect(data.ignored_user_ids).toBeUndefined();
    });
  });

  it('broadcasts reservation:travelers-updated', async () => {
    const { user: owner } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    await withHarness(owner.id, async (h) => {
      const reservationId = await makeBooking(h, trip.id);
      broadcastMock.mockClear();
      await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId, user_ids: [owner.id] },
      });
      expect(broadcastMock).toHaveBeenCalledWith(
        trip.id,
        'reservation:travelers-updated',
        expect.objectContaining({ reservationId }),
      );
    });
  });

  it('404s a booking of another trip', async () => {
    const { user: owner } = createUser(testDb);
    const ownTrip = createTrip(testDb, owner.id);
    const otherTrip = createTrip(testDb, owner.id);
    await withHarness(owner.id, async (h) => {
      const reservationId = await makeBooking(h, otherTrip.id);
      const result = await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: ownTrip.id, reservationId, user_ids: [owner.id] },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('returns access denied for a non-member', async () => {
    const { user: owner } = createUser(testDb);
    const { user: outsider } = createUser(testDb);
    const trip = createTrip(testDb, owner.id);
    let reservationId = 0;
    await withHarness(owner.id, async (h) => {
      reservationId = await makeBooking(h, trip.id);
    });
    await withHarness(outsider.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId, user_ids: [outsider.id] },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('blocks demo user', async () => {
    process.env.DEMO_MODE = 'true';
    const { user } = createUser(testDb, { email: 'demo@nomad.app' });
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'set_reservation_travelers',
        arguments: { tripId: trip.id, reservationId: 1, user_ids: [] },
      });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// The booking link and the end time
//
// Both are persisted on create and update and rendered by the planner; neither
// was in any tool schema, so an imported booking arrived without its
// confirmation link and a dinner could only carry a start.
// ---------------------------------------------------------------------------

describe('Reservation tools: url and reservation_end_time', () => {
  it('stores the booking link on create', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_reservation',
        arguments: {
          tripId: trip.id,
          type: 'restaurant',
          title: 'Dinner',
          url: 'https://example.com/booking/abc123',
        },
      });
      const data = parseToolResult(result) as any;
      expect(data.reservation.url).toBe('https://example.com/booking/abc123');
      const row = await reservationRow(data.reservation.id);
      expect(row.url).toBe('https://example.com/booking/abc123');
    });
  });

  it('stores an end time on a non-transport booking', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_reservation',
        arguments: {
          tripId: trip.id,
          type: 'restaurant',
          title: 'Dinner',
          reservation_time: '2025-06-01T19:00:00',
          reservation_end_time: '2025-06-01T21:30:00',
        },
      });
      const data = parseToolResult(result) as any;
      const row = await reservationRow(data.reservation.id);
      expect(row.reservation_time).toBe('2025-06-01T19:00:00');
      expect(row.reservation_end_time).toBe('2025-06-01T21:30:00');
    });
  });

  it('updates the link and the end time on an existing booking', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip.id, type: 'tour', title: 'Walking tour' },
      });
      const { reservation } = parseToolResult(created) as { reservation: { id: number } };

      await h.client.callTool({
        name: 'update_reservation',
        arguments: {
          tripId: trip.id,
          reservationId: reservation.id,
          url: 'https://tours.example/booking/9',
          reservation_end_time: '2025-06-02T16:00:00',
        },
      });
      const row = await reservationRow(reservation.id);
      expect(row.url).toBe('https://tours.example/booking/9');
      expect(row.reservation_end_time).toBe('2025-06-02T16:00:00');
    });
  });

  it('refuses a javascript: link, like the REST contract does', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip.id, type: 'other', title: 'Nope', url: 'javascript:alert(1)' },
      });
      expect(result.isError).toBe(true);
      expect(await countRows(orm, Reservations)).toBe(0);
    });
  });

  it('refuses a javascript: link split by a control character', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({
        name: 'create_reservation',
        arguments: { tripId: trip.id, type: 'other', title: 'Nope', url: 'java\tscript:alert(1)' },
      });
      expect(result.isError).toBe(true);
    });
  });

  it('stores the booking link on a transport booking too', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await withHarness(user.id, async (h) => {
      const created = await h.client.callTool({
        name: 'create_transport',
        arguments: {
          tripId: trip.id,
          type: 'bus',
          title: 'Zurich → Milan',
          url: 'https://flix.example/booking/8891',
        },
      });
      const { reservation } = parseToolResult(created) as { reservation: { id: number } };
      expect(await reservationUrl(reservation.id)).toEqual({ url: 'https://flix.example/booking/8891' });

      await h.client.callTool({
        name: 'update_transport',
        arguments: { tripId: trip.id, reservationId: reservation.id, url: 'https://flix.example/booking/8892' },
      });
      expect(await reservationUrl(reservation.id)).toEqual({ url: 'https://flix.example/booking/8892' });
    });
  });
});

// ---------------------------------------------------------------------------
// list_upcoming_reservations
//
// The one cross-trip read here. GET /api/reservations/upcoming scopes itself in
// SQL (owned or joined, not archived) rather than through verifyTripAccess, so
// the visibility cases below are the access test for this tool. The hotel arm is
// the part no per-trip list can stand in for: a stay contributes a check-in and
// a check-out moment that exist in day_accommodations, not in reservations.
// ---------------------------------------------------------------------------

describe('Tool: list_upcoming_reservations', () => {
  function dateInDays(days: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function seedBooking(
    tripId: number,
    title: string,
    time: string | null,
    extra: Partial<{ type: string; status: string }> = {},
  ): Promise<number> {
    return insertRow(orm, Reservations, {
      trip: tripId,
      title,
      type: extra.type ?? 'restaurant',
      status: extra.status ?? 'pending',
      reservation_time: time,
    });
  }

  async function upcoming(userId: number, args: Record<string, unknown> = {}) {
    let out: { title: string; type: string; trip_id: number }[] = [];
    await withHarness(userId, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({ name: 'list_upcoming_reservations', arguments: args }),
      ) as {
        reservations: { title: string; type: string; trip_id: number }[];
      };
      out = data.reservations;
    });
    return out;
  }

  it('spans every trip the user can see, soonest first, and stops at the trips they cannot', async () => {
    const { user } = createUser(testDb);
    const { user: other } = createUser(testDb);
    const owned = createTrip(testDb, user.id);
    const joined = createTrip(testDb, other.id);
    const stranger = createTrip(testDb, other.id);
    addTripMember(testDb, joined.id, user.id);

    await seedBooking(owned.id, 'Flight to Paris', `${dateInDays(4)}T08:00:00`, { type: 'flight' });
    await seedBooking(joined.id, 'Group dinner', `${dateInDays(2)}T19:00:00`);
    await seedBooking(stranger.id, 'Not mine', `${dateInDays(1)}T07:00:00`);

    const rows = await upcoming(user.id);
    expect(rows.map((r) => r.title)).toEqual(['Group dinner', 'Flight to Paris']);
  });

  it('reports a hotel stay as its check-in and check-out moments', async () => {
    const { user } = createUser(testDb);
    createCategory(testDb);
    const trip = createTrip(testDb, user.id);
    const arrival = createDay(testDb, trip.id, { date: dateInDays(3) });
    const departure = createDay(testDb, trip.id, { date: dateInDays(6) });
    const hotel = createPlace(testDb, trip.id, { name: 'Hotel Astoria' });
    createDayAccommodation(testDb, trip.id, hotel.id, arrival.id, departure.id, {
      check_in: '15:00',
      check_out: '11:00',
    });

    const rows = await upcoming(user.id);
    expect(rows.map((r) => [r.type, r.title])).toEqual([
      ['checkin', 'Hotel Astoria'],
      ['checkout', 'Hotel Astoria'],
    ]);
  });

  it('leaves out cancelled bookings and archived trips', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    const archived = createTrip(testDb, user.id);
    await updateRows(orm, Trips, { id: archived.id }, { is_archived: 1 });

    await seedBooking(trip.id, 'Still on', `${dateInDays(2)}T12:00:00`);
    await seedBooking(trip.id, 'Called off', `${dateInDays(1)}T12:00:00`, { status: 'cancelled' });
    await seedBooking(archived.id, 'Last year', `${dateInDays(3)}T12:00:00`);

    const rows = await upcoming(user.id);
    expect(rows.map((r) => r.title)).toEqual(['Still on']);
  });

  it('leaves out planned public-transit journeys and keeps a booked train, as the dashboard does', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    await seedBooking(trip.id, 'Metro to the museum', `${dateInDays(1)}T09:00:00`, {
      type: 'transit',
      status: 'confirmed',
    });
    await seedBooking(trip.id, 'Night train', `${dateInDays(2)}T21:00:00`, { type: 'train', status: 'confirmed' });

    const rows = await upcoming(user.id);
    expect(rows.map((r) => r.title)).toEqual(['Night train']);
  });

  it('returns the dashboard six by default and honours a limit', async () => {
    const { user } = createUser(testDb);
    const trip = createTrip(testDb, user.id);
    for (let i = 1; i <= 8; i++) await seedBooking(trip.id, `Booking ${i}`, `${dateInDays(i)}T09:00:00`);

    expect((await upcoming(user.id)).map((r) => r.title)).toEqual([
      'Booking 1',
      'Booking 2',
      'Booking 3',
      'Booking 4',
      'Booking 5',
      'Booking 6',
    ]);
    expect((await upcoming(user.id, { limit: 2 })).map((r) => r.title)).toEqual(['Booking 1', 'Booking 2']);
  });

  it('refuses a limit outside the allowed range', async () => {
    const { user } = createUser(testDb);
    await withHarness(user.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_upcoming_reservations', arguments: { limit: 0 } });
      expect(result.isError).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// list_reservations / list_accommodations
//
// The assistant's booking reads: the bookings with their readable details,
// never the raw metadata (provider ids, a leg's own reference), and the stays
// with their place, each behind the trip's access check and its scope.
// ---------------------------------------------------------------------------

async function withScopedHarness(userId: number, fn: (h: McpHarness) => Promise<void>, scopes: string[] | null = null) {
  const h = await createMcpHarness({ realtime, userId, withResources: false, scopes });
  try {
    await fn(h);
  } finally {
    await h.cleanup();
  }
}

interface ListedBooking {
  id: number;
  title: string;
  type: string;
  metadata?: unknown;
  details: Record<string, unknown>;
}

async function listed(userId: number, args: Record<string, unknown>): Promise<ListedBooking[]> {
  let out: ListedBooking[] = [];
  await withScopedHarness(userId, async (h) => {
    const data = parseToolResult(await h.client.callTool({ name: 'list_reservations', arguments: args })) as {
      reservations: ListedBooking[];
    };
    out = data.reservations;
  });
  return out;
}

/** A trip with a flight with stopover legs on day 1, a dinner on day 2 and a hotel stay. */
async function seedTrip(userId: number) {
  const trip = createTrip(testDb, userId);
  const day1 = createDay(testDb, trip.id, { date: '2026-06-03' });
  const day2 = createDay(testDb, trip.id, { date: '2026-06-04' });
  const flight = await insertRow(orm, Reservations, {
    trip: trip.id,
    day: day1.id,
    title: 'Frankfurt to New York',
    type: 'flight',
    status: 'confirmed',
    confirmation_number: 'ABC123',
    metadata: JSON.stringify({
      airline: 'Lufthansa',
      flight_number: 'LH 400',
      seat: '12A',
      airtrail_ids: [4, 5],
      legs: [
        { from: 'FRA', to: 'MUC', flight_number: 'LH 101', confirmation_number: 'LEG-REF', dep_time: '08:15' },
        { from: 'MUC', to: 'JFK', flight_number: 'LH 410', arr_day_id: day2.id, arr_time: '13:05' },
      ],
    }),
  });
  const dinner = await insertRow(orm, Reservations, {
    trip: trip.id,
    day: day2.id,
    title: 'Dinner',
    type: 'restaurant',
    metadata: JSON.stringify({ price: '80' }),
  });
  return { trip, day1, day2, flight, dinner };
}

describe('Tool: list_reservations', () => {
  it('RESREAD-MCP-001: lists the bookings with their readable details and without the raw metadata', async () => {
    const { user } = createUser(testDb);
    const { trip } = await seedTrip(user.id);
    const bookings = await listed(user.id, { tripId: trip.id });
    expect(bookings.map((b) => b.title).sort()).toEqual(['Dinner', 'Frankfurt to New York']);
    const flight = bookings.find((b) => b.type === 'flight');
    expect(flight).not.toHaveProperty('metadata');
    expect(flight?.details).toMatchObject({ airline: 'Lufthansa', flight_number: 'LH 400', seat: '12A' });
    expect(flight?.details.legs).toEqual([
      { from: 'FRA', to: 'MUC', flight_number: 'LH 101', dep_time: '08:15' },
      expect.objectContaining({ from: 'MUC', to: 'JFK', flight_number: 'LH 410', arr_time: '13:05' }),
    ]);
    // A provider id and a leg's own reference stay with the booking.
    expect(JSON.stringify(flight?.details)).not.toContain('airtrail_ids');
    expect(JSON.stringify(flight?.details)).not.toContain('LEG-REF');
    expect(bookings.find((b) => b.type === 'restaurant')?.details).toEqual({ price: '80' });
  });

  it('RESREAD-MCP-005: says that a leg holds a reference, never the reference itself', async () => {
    const { user } = createUser(testDb);
    const { trip } = await seedTrip(user.id);
    const bookings = await listed(user.id, { tripId: trip.id });
    expect(bookings.find((b) => b.type === 'flight')?.details.has_leg_reference).toBe(true);
    expect(bookings.find((b) => b.type === 'restaurant')?.details).not.toHaveProperty('has_leg_reference');
  });

  it('RESREAD-MCP-002: keeps one kind, or the bookings on one day (a leg arriving on it counts)', async () => {
    const { user } = createUser(testDb);
    const { trip, day1, day2 } = await seedTrip(user.id);
    expect((await listed(user.id, { tripId: trip.id, kinds: ['transport'] })).map((b) => b.type)).toEqual(['flight']);
    expect((await listed(user.id, { tripId: trip.id, kinds: ['booking'] })).map((b) => b.type)).toEqual(['restaurant']);
    expect((await listed(user.id, { tripId: trip.id, dayId: day1.id })).map((b) => b.type)).toEqual(['flight']);
    expect((await listed(user.id, { tripId: trip.id, dayId: day2.id })).map((b) => b.type).sort()).toEqual([
      'flight',
      'restaurant',
    ]);
  });

  it('RESREAD-MCP-003: refuses a trip the user cannot see', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const { trip } = await seedTrip(user.id);
    await withScopedHarness(stranger.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_reservations', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
  });

  it('RESREAD-MCP-004: rides reservations:read and is hidden from a token without it', async () => {
    const { user } = createUser(testDb);
    await withScopedHarness(
      user.id,
      async (h) => {
        expect((await h.client.listTools()).tools.map((t) => t.name)).toContain('list_reservations');
      },
      ['reservations:read'],
    );
    await withScopedHarness(
      user.id,
      async (h) => {
        expect((await h.client.listTools()).tools.map((t) => t.name)).not.toContain('list_reservations');
      },
      ['places:read'],
    );
  });
});

describe('Tool: list_accommodations', () => {
  it('RESREAD-MCP-010: lists the stays with their place and check-in and check-out', async () => {
    const { user } = createUser(testDb);
    const { trip, day1, day2 } = await seedTrip(user.id);
    const hotel = createPlace(testDb, trip.id, { name: 'Mercure', lat: 52.53, lng: 13.38 });
    createDayAccommodation(testDb, trip.id, hotel.id, day1.id, day2.id, { check_in: '15:00', confirmation: 'H-1' });
    await withScopedHarness(user.id, async (h) => {
      const data = parseToolResult(
        await h.client.callTool({ name: 'list_accommodations', arguments: { tripId: trip.id } }),
      ) as { accommodations: Array<Record<string, unknown>> };
      expect(data.accommodations).toHaveLength(1);
      expect(data.accommodations[0]).toMatchObject({
        place_id: hotel.id,
        place_name: 'Mercure',
        start_day_id: day1.id,
        end_day_id: day2.id,
        check_in: '15:00',
      });
    });
  });

  it('RESREAD-MCP-011: refuses a trip the user cannot see, and is hidden from a token without trip reads', async () => {
    const { user } = createUser(testDb);
    const { user: stranger } = createUser(testDb);
    const { trip } = await seedTrip(user.id);
    await withScopedHarness(stranger.id, async (h) => {
      const result = await h.client.callTool({ name: 'list_accommodations', arguments: { tripId: trip.id } });
      expect(result.isError).toBe(true);
    });
    await withScopedHarness(
      user.id,
      async (h) => {
        expect((await h.client.listTools()).tools.map((t) => t.name)).not.toContain('list_accommodations');
      },
      ['places:read'],
    );
  });
});
