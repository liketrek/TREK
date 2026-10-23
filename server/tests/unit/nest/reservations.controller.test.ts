import type { AirtrailLinkService } from '../../../src/nest/integrations/airtrail-link.service';
import { ReservationWritesService } from '../../../src/nest/reservations/reservation-writes.service';
import { ReservationsController } from '../../../src/nest/reservations/reservations.controller';
import type { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import type { User } from '../../../src/types';
import { HttpException } from '@nestjs/common';

import { describe, it, expect, vi } from 'vitest';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const trip = { id: 5, user_id: 1 };

// Fire-and-forget write-back trigger, injected since airtrail.bridge died.
const pushReservationToAirtrail = vi.fn().mockResolvedValue(undefined);
const airtrailLink = { pushReservationToAirtrail } as unknown as AirtrailLinkService;

function makeService(overrides: Partial<ReservationsService> = {}): ReservationsService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue(trip),
    canEdit: vi.fn().mockReturnValue(true),
    referencesOutsideTrip: vi.fn().mockReturnValue([]),
    unresolvedReferences: vi.fn().mockReturnValue([]),
    broadcast: vi.fn(),
    announceCost: vi.fn(),
    notifyBookingChange: vi.fn(),
    // Hands the entry back as it came: what freezing does to it is the service's test.
    withFrozenRate: vi.fn(async (_tripId: string, entry: unknown) => entry),
    ...overrides,
  } as unknown as ReservationsService;
}

/**
 * The route over the real booking use cases (ReservationWritesService) with the
 * service stubbed, so these cases pin what the route writes and sends, not how
 * it calls into the use case. The realtime transport is the stub's `broadcast`.
 */
function controllerOver(svc: ReservationsService): ReservationsController {
  const writes = Object.assign(Object.create(ReservationWritesService.prototype) as ReservationWritesService, {
    reservations: svc,
    airtrailLink,
    realtime: { broadcast: (svc as unknown as { broadcast: unknown }).broadcast },
  });
  return new ReservationsController(svc, writes);
}

async function thrown(fn: () => unknown): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

describe('ReservationsController (parity with the legacy /api/trips/:tripId/reservations route)', () => {
  it('GET / returns reservations', async () => {
    const svc = makeService({ list: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<ReservationsService>);
    expect(await controllerOver(svc).list(user, '5')).toEqual({ reservations: [{ id: 1 }] });
  });

  describe('POST /', () => {
    // The bespoke 'Title is required' 400 moved to the global ZodValidationPipe
    // (ReservationCreateDto) — covered by the e2e suite.

    it('creates the booking and its cost in one write, broadcasts accommodation, cost and reservation in order, notifies', async () => {
      const costEvents = [{ event: 'budget:created', payload: { item: { id: 3 } } }];
      const createWithCost = vi
        .fn()
        .mockReturnValue({ reservation: { id: 9 }, accommodationCreated: true, costEvents });
      const broadcast = vi.fn();
      const notifyBookingChange = vi.fn();
      const svc = makeService({
        createWithCost,
        broadcast,
        notifyBookingChange,
      } as Partial<ReservationsService>);
      const body = { title: 'Hotel', type: 'lodging', create_budget_entry: { total_price: 200 } };
      expect(await controllerOver(svc).create(user, '5', body, 'sock')).toEqual({
        reservation: { id: 9 },
      });
      expect(createWithCost).toHaveBeenCalledWith('5', body, { total_price: 200 });
      // Every event skips the socket that sent the request, the cost between the stay and the booking.
      expect(broadcast.mock.calls).toEqual([
        ['5', 'accommodation:created', {}, 'sock'],
        ['5', 'budget:created', { item: { id: 3 } }, 'sock'],
        ['5', 'reservation:created', { reservation: { id: 9 } }, 'sock'],
      ]);
      expect(notifyBookingChange).toHaveBeenCalledWith('5', user.id, 'Hotel', 'lodging');
    });

    it('400s on a body id belonging to another trip, without writing', async () => {
      const createWithCost = vi.fn();
      const svc = makeService({
        createWithCost,
        referencesOutsideTrip: vi.fn().mockReturnValue(['accommodation_id']),
      } as Partial<ReservationsService>);
      const body = { title: 'Hotel', accommodation_id: 4711 };
      expect(await thrown(() => controllerOver(svc).create(user, '5', body))).toEqual({
        status: 400,
        body: { error: 'Not part of this trip: accommodation_id' },
      });
      expect(createWithCost).not.toHaveBeenCalled();
    });

    it('400s on a body id that exists nowhere, in its own words, without writing', async () => {
      const createWithCost = vi.fn();
      const svc = makeService({
        createWithCost,
        unresolvedReferences: vi.fn().mockReturnValue(['place_id']),
      } as Partial<ReservationsService>);
      const body = { title: 'Hotel', place_id: 4711 };
      // Not 'Not part of this trip': an id that is part of nothing would send
      // the caller looking for it on another trip.
      expect(await thrown(() => controllerOver(svc).create(user, '5', body))).toEqual({
        status: 400,
        body: { error: 'Unknown reference: place_id' },
      });
      expect(createWithCost).not.toHaveBeenCalled();
    });

    it('answers a foreign id with the older message when it is both', async () => {
      const svc = makeService({
        createWithCost: vi.fn(),
        referencesOutsideTrip: vi.fn().mockReturnValue(['place_id']),
        unresolvedReferences: vi.fn().mockReturnValue(['place_id']),
      } as Partial<ReservationsService>);
      expect(await thrown(() => controllerOver(svc).create(user, '5', { title: 'Hotel', place_id: 4711 }))).toEqual({
        status: 400,
        body: { error: 'Not part of this trip: place_id' },
      });
    });

    // #2525: an imported booking quoted in dollars. The price has to reach the linked
    // cost in dollars, at a rate frozen before anything is written.
    it('hands the write the entry with its currency and frozen rate', async () => {
      const createWithCost = vi
        .fn()
        .mockReturnValue({ reservation: { id: 9 }, accommodationCreated: false, costEvents: [] });
      const withFrozenRate = vi.fn(async () => {
        expect(createWithCost).not.toHaveBeenCalled();
        return { total_price: 801.76, currency: 'USD', exchange_rate: 1.17 };
      });
      const svc = makeService({ createWithCost, withFrozenRate } as Partial<ReservationsService>);
      const body = {
        title: 'Aparthotel Silver',
        type: 'hotel',
        create_budget_entry: { total_price: 801.76, currency: 'usd' },
      };
      await controllerOver(svc).create(user, '5', body, 'sock');
      expect(withFrozenRate).toHaveBeenCalledWith('5', { total_price: 801.76, currency: 'usd' });
      expect(createWithCost).toHaveBeenCalledWith('5', body, {
        total_price: 801.76,
        currency: 'USD',
        exchange_rate: 1.17,
      });
    });
  });

  describe('PUT /positions', () => {
    // The 'positions must be an array' 400 moved to the global
    // ZodValidationPipe (ReservationPositionsDto).

    it('updates positions and broadcasts', async () => {
      const updatePositions = vi.fn();
      const broadcast = vi.fn();
      const svc = makeService({ updatePositions, broadcast } as Partial<ReservationsService>);
      const positions = [{ id: 1, day_plan_position: 0 }];
      expect(await controllerOver(svc).updatePositions(user, '5', { positions, day_id: 3 }, 'sock')).toEqual({
        success: true,
      });
      expect(updatePositions).toHaveBeenCalledWith('5', positions, 3);
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:positions', { positions, day_id: 3 }, 'sock');
    });
  });

  describe('PUT /:id', () => {
    it('404 when the reservation is missing', async () => {
      const svc = makeService({ getReservation: vi.fn().mockReturnValue(undefined) } as Partial<ReservationsService>);
      expect(await thrown(() => controllerOver(svc).update(user, '5', '9', { title: 'X' }))).toEqual({
        status: 404,
        body: { error: 'Reservation not found' },
      });
    });

    it('updates the booking and its cost in one write, broadcasts + notifies with current fallbacks', async () => {
      const current = { title: 'Old', type: 'lodging' };
      const getReservation = vi.fn().mockReturnValue(current);
      const costEvents = [{ event: 'budget:updated', payload: { item: { id: 3 } } }];
      const updateWithCost = vi.fn().mockReturnValue({
        reservation: { id: 9 },
        accommodationChanged: true,
        accommodationCreated: false,
        costEvents,
      });
      const broadcast = vi.fn();
      const notifyBookingChange = vi.fn();
      const svc = makeService({
        getReservation,
        updateWithCost,
        broadcast,
        notifyBookingChange,
      } as Partial<ReservationsService>);
      const body = { create_budget_entry: { total_price: 50 } };
      expect(await controllerOver(svc).update(user, '5', '9', body, 'sock')).toEqual({ reservation: { id: 9 } });
      expect(updateWithCost).toHaveBeenCalledWith('9', '5', body, current, { total_price: 50 });
      expect(broadcast.mock.calls).toEqual([
        ['5', 'accommodation:updated', {}, 'sock'],
        ['5', 'budget:updated', { item: { id: 3 } }, 'sock'],
        ['5', 'reservation:updated', { reservation: { id: 9 } }, 'sock'],
      ]);
      expect(notifyBookingChange).toHaveBeenCalledWith('5', user.id, 'Old', 'lodging');
    });

    // G6: the hotel link tool makes this same edit, and both name a stay written for the first time created.
    it('announces a stay the edit wrote for the first time as created, not as updated', async () => {
      const broadcast = vi.fn();
      const svc = makeService({
        getReservation: vi.fn().mockReturnValue({ title: 'Hotel', type: 'hotel' }),
        updateWithCost: vi.fn().mockReturnValue({
          reservation: { id: 9 },
          accommodationChanged: true,
          accommodationCreated: true,
          costEvents: [],
        }),
        broadcast,
      } as Partial<ReservationsService>);
      await controllerOver(svc).update(user, '5', '9', { type: 'hotel' }, 'sock');
      expect(broadcast.mock.calls.map((c) => c[1])).toEqual(['accommodation:created', 'reservation:updated']);
    });

    it('pushes a linked AirTrail flight back after the write, and leaves an unlinked one alone', async () => {
      pushReservationToAirtrail.mockClear();
      const linked = { id: 9, external_source: 'airtrail', sync_enabled: 1 };
      const updateWithCost = vi
        .fn()
        .mockReturnValueOnce({ reservation: linked, accommodationChanged: false, costEvents: [] })
        .mockReturnValueOnce({
          reservation: { ...linked, sync_enabled: 0 },
          accommodationChanged: false,
          costEvents: [],
        });
      const svc = makeService({
        getReservation: vi.fn().mockReturnValue({ title: 'AY1502', type: 'flight' }),
        updateWithCost,
      } as Partial<ReservationsService>);
      await controllerOver(svc).update(user, '5', '9', { notes: 'Gate B' }, 'sock');
      await controllerOver(svc).update(user, '5', '9', { notes: 'Gate C' }, 'sock');
      expect(pushReservationToAirtrail.mock.calls).toEqual([[9, 5]]);
    });

    it('400s on a body id belonging to another trip, without writing', async () => {
      const update = vi.fn();
      const svc = makeService({
        getReservation: vi.fn().mockReturnValue({ title: 'Old', type: 'lodging' }),
        updateWithCost: update,
        referencesOutsideTrip: vi.fn().mockReturnValue(['day_id', 'place_id']),
      } as Partial<ReservationsService>);
      expect(await thrown(() => controllerOver(svc).update(user, '5', '9', { day_id: 1, place_id: 2 }))).toEqual({
        status: 400,
        body: { error: 'Not part of this trip: day_id, place_id' },
      });
      expect(update).not.toHaveBeenCalled();
    });

    it('400s on a body id that exists nowhere, without writing', async () => {
      const update = vi.fn();
      const svc = makeService({
        getReservation: vi.fn().mockReturnValue({ title: 'Old', type: 'lodging' }),
        updateWithCost: update,
        unresolvedReferences: vi.fn().mockReturnValue(['day_id', 'place_id']),
      } as Partial<ReservationsService>);
      // The reporter's request: a foreign-key error used to reach the caller as
      // a bare 500 here.
      expect(await thrown(() => controllerOver(svc).update(user, '5', '9', { day_id: 1, place_id: 2 }))).toEqual({
        status: 400,
        body: { error: 'Unknown reference: day_id, place_id' },
      });
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('PUT /:id/travelers', () => {
    // The 'user_ids must be an array' 400 moved to the global
    // ZodValidationPipe (ReservationTravelersDto).

    it('404 when the reservation is off-trip / missing', async () => {
      const svc = makeService({ setTravelers: vi.fn().mockReturnValue(null) } as Partial<ReservationsService>);
      expect(await thrown(() => controllerOver(svc).updateTravelers(user, '5', '9', { user_ids: [1] }))).toEqual({
        status: 404,
        body: { error: 'Reservation not found' },
      });
    });

    it('assigns travelers, broadcasts, and returns { travelers, reservation }', async () => {
      const travelers = [{ user_id: 2, username: 'Sam', avatar: null, is_guest: 0 }];
      const reservation = { id: 9, travelers };
      const setTravelers = vi.fn().mockReturnValue({ travelers, reservation });
      const broadcast = vi.fn();
      const svc = makeService({ setTravelers, broadcast } as Partial<ReservationsService>);
      expect(await controllerOver(svc).updateTravelers(user, '5', '9', { user_ids: [2] }, 'sock')).toEqual({
        travelers,
        reservation,
      });
      expect(setTravelers).toHaveBeenCalledWith('9', '5', [2]);
      expect(broadcast).toHaveBeenCalledWith(
        '5',
        'reservation:travelers-updated',
        { reservationId: 9, travelers },
        'sock',
      );
    });
  });

  describe('DELETE /:id', () => {
    it('404 when nothing deleted', async () => {
      const broadcast = vi.fn();
      const svc = makeService({
        remove: vi.fn().mockReturnValue({
          deleted: undefined,
          accommodationDeleted: false,
          deletedBudgetItemId: null,
          deletedBudgetItemIds: [],
        }),
        broadcast,
      } as Partial<ReservationsService>);
      expect(await thrown(() => controllerOver(svc).remove(user, '5', '9'))).toEqual({
        status: 404,
        body: { error: 'Reservation not found' },
      });
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('broadcasts the accommodation + budget cascade then reservation:deleted', async () => {
      const remove = vi.fn().mockReturnValue({
        deleted: { id: 9, title: 'Hotel', type: 'lodging', accommodation_id: 3 },
        accommodationDeleted: true,
        deletedBudgetItemId: 7,
        deletedBudgetItemIds: [7],
      });
      const broadcast = vi.fn();
      const notifyBookingChange = vi.fn();
      const svc = makeService({ remove, broadcast, notifyBookingChange } as Partial<ReservationsService>);
      expect(await controllerOver(svc).remove(user, '5', '9', 'sock')).toEqual({
        success: true,
      });
      expect(broadcast.mock.calls).toEqual([
        ['5', 'accommodation:deleted', { accommodationId: 3 }, 'sock'],
        ['5', 'budget:deleted', { itemId: 7 }, 'sock'],
        ['5', 'reservation:deleted', { reservationId: 9 }, 'sock'],
      ]);
      expect(notifyBookingChange).toHaveBeenCalledWith('5', user.id, 'Hotel', 'lodging');
    });

    it('announces every expense the booking took with it, before the booking itself (#2084)', async () => {
      const remove = vi.fn().mockReturnValue({
        deleted: { id: 9, title: 'Flight', type: 'flight', accommodation_id: null },
        accommodationDeleted: false,
        deletedBudgetItemId: 7,
        deletedBudgetItemIds: [7, 8],
      });
      const broadcast = vi.fn();
      const svc = makeService({ remove, broadcast } as Partial<ReservationsService>);
      await controllerOver(svc).remove(user, '5', '9', 'sock');
      expect(broadcast.mock.calls).toEqual([
        ['5', 'budget:deleted', { itemId: 7 }, 'sock'],
        ['5', 'budget:deleted', { itemId: 8 }, 'sock'],
        ['5', 'reservation:deleted', { reservationId: 9 }, 'sock'],
      ]);
    });

    it('announces no expense when the booking carried none', async () => {
      const remove = vi.fn().mockReturnValue({
        deleted: { id: 9, title: 'Museum', type: 'activity', accommodation_id: null },
        accommodationDeleted: false,
        deletedBudgetItemId: null,
        deletedBudgetItemIds: [],
      });
      const broadcast = vi.fn();
      const svc = makeService({ remove, broadcast } as Partial<ReservationsService>);
      await controllerOver(svc).remove(user, '5', '9', 'sock');
      expect(broadcast.mock.calls).toEqual([['5', 'reservation:deleted', { reservationId: 9 }, 'sock']]);
    });
  });
});
