import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { ReservationsController } from '../../../src/nest/reservations/reservations.controller';
import type { ReservationsService } from '../../../src/nest/reservations/reservations.service';
import type { AirtrailLinkService } from '../../../src/nest/integrations/airtrail-link.service';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const trip = { id: 5, user_id: 1 };

// Fire-and-forget write-back trigger, injected since airtrail.bridge died.
const airtrailLink = { pushReservationToAirtrail: vi.fn().mockResolvedValue(undefined) } as unknown as AirtrailLinkService;

function makeService(overrides: Partial<ReservationsService> = {}): ReservationsService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue(trip),
    canEdit: vi.fn().mockReturnValue(true),
    referencesOutsideTrip: vi.fn().mockReturnValue([]),
    unresolvedReferences: vi.fn().mockReturnValue([]),
    broadcast: vi.fn(),
    syncBudgetOnCreate: vi.fn(),
    syncBudgetOnUpdate: vi.fn(),
    notifyBookingChange: vi.fn(),
    // Hands the entry back as it came: what freezing does to it is the service's test.
    withFrozenRate: vi.fn(async (_tripId: string, entry: unknown) => entry),
    ...overrides,
  } as unknown as ReservationsService;
}

/** The create route awaits the price's rate, so its 400s arrive as a rejection. */
async function rejected(promise: Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try { await promise; } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

describe('ReservationsController (parity with the legacy /api/trips/:tripId/reservations route)', () => {

  it('GET / returns reservations', () => {
    const svc = makeService({ list: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<ReservationsService>);
    expect(new ReservationsController(svc, airtrailLink).list(user, '5')).toEqual({ reservations: [{ id: 1 }] });
  });

  describe('POST /', () => {

    // The bespoke 'Title is required' 400 moved to the global ZodValidationPipe
    // (ReservationCreateDto) — covered by the e2e suite.

    it('creates, runs budget sync, broadcasts accommodation + reservation, notifies', async () => {
      const create = vi.fn().mockReturnValue({ reservation: { id: 9 }, accommodationCreated: true });
      const broadcast = vi.fn(); const syncBudgetOnCreate = vi.fn(); const notifyBookingChange = vi.fn();
      const svc = makeService({ create, broadcast, syncBudgetOnCreate, notifyBookingChange } as Partial<ReservationsService>);
      const body = { title: 'Hotel', type: 'lodging', create_budget_entry: { total_price: 200 } };
      expect(await new ReservationsController(svc, airtrailLink).create(user, '5', body, 'sock')).toEqual({ reservation: { id: 9 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'accommodation:created', {}, 'sock');
      expect(syncBudgetOnCreate).toHaveBeenCalledWith('5', 9, 'Hotel', 'lodging', { total_price: 200 }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:created', { reservation: { id: 9 } }, 'sock');
      expect(notifyBookingChange).toHaveBeenCalledWith('5', user.id, 'Hotel', 'lodging');
    });

    it('400s on a body id belonging to another trip, without writing', async () => {
      const create = vi.fn();
      const svc = makeService({
        create,
        referencesOutsideTrip: vi.fn().mockReturnValue(['accommodation_id']),
      } as Partial<ReservationsService>);
      const body = { title: 'Hotel', accommodation_id: 4711 };
      expect(await rejected(new ReservationsController(svc, airtrailLink).create(user, '5', body)))
        .toEqual({ status: 400, body: { error: 'Not part of this trip: accommodation_id' } });
      expect(create).not.toHaveBeenCalled();
    });

    it('400s on a body id that exists nowhere, in its own words, without writing', async () => {
      const create = vi.fn();
      const svc = makeService({
        create,
        unresolvedReferences: vi.fn().mockReturnValue(['place_id']),
      } as Partial<ReservationsService>);
      const body = { title: 'Hotel', place_id: 4711 };
      // Not 'Not part of this trip': an id that is part of nothing would send
      // the caller looking for it on another trip.
      expect(await rejected(new ReservationsController(svc, airtrailLink).create(user, '5', body)))
        .toEqual({ status: 400, body: { error: 'Unknown reference: place_id' } });
      expect(create).not.toHaveBeenCalled();
    });

    it('answers a foreign id with the older message when it is both', async () => {
      const svc = makeService({
        create: vi.fn(),
        referencesOutsideTrip: vi.fn().mockReturnValue(['place_id']),
        unresolvedReferences: vi.fn().mockReturnValue(['place_id']),
      } as Partial<ReservationsService>);
      expect(await rejected(new ReservationsController(svc, airtrailLink).create(user, '5', { title: 'Hotel', place_id: 4711 })))
        .toEqual({ status: 400, body: { error: 'Not part of this trip: place_id' } });
    });

    // #2525: an imported booking quoted in dollars. The price has to reach the linked
    // cost in dollars, at a rate frozen before anything is written.
    it('hands the budget sync the entry with its currency and frozen rate', async () => {
      const create = vi.fn().mockReturnValue({ reservation: { id: 9 }, accommodationCreated: false });
      const syncBudgetOnCreate = vi.fn();
      const withFrozenRate = vi.fn(async () => {
        expect(create).not.toHaveBeenCalled();
        return { total_price: 801.76, currency: 'USD', exchange_rate: 1.17 };
      });
      const svc = makeService({ create, syncBudgetOnCreate, withFrozenRate } as Partial<ReservationsService>);
      const body = { title: 'Aparthotel Silver', type: 'hotel', create_budget_entry: { total_price: 801.76, currency: 'usd' } };
      await new ReservationsController(svc, airtrailLink).create(user, '5', body, 'sock');
      expect(withFrozenRate).toHaveBeenCalledWith('5', { total_price: 801.76, currency: 'usd' });
      expect(syncBudgetOnCreate).toHaveBeenCalledWith('5', 9, 'Aparthotel Silver', 'hotel', { total_price: 801.76, currency: 'USD', exchange_rate: 1.17 }, 'sock');
    });
  });

  describe('PUT /positions', () => {
    // The 'positions must be an array' 400 moved to the global
    // ZodValidationPipe (ReservationPositionsDto).

    it('updates positions and broadcasts', () => {
      const updatePositions = vi.fn(); const broadcast = vi.fn();
      const svc = makeService({ updatePositions, broadcast } as Partial<ReservationsService>);
      const positions = [{ id: 1, day_plan_position: 0 }];
      expect(new ReservationsController(svc, airtrailLink).updatePositions(user, '5', { positions, day_id: 3 }, 'sock')).toEqual({ success: true });
      expect(updatePositions).toHaveBeenCalledWith('5', positions, 3);
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:positions', { positions, day_id: 3 }, 'sock');
    });
  });

  describe('PUT /:id', () => {
    it('404 when the reservation is missing', () => {
      const svc = makeService({ getReservation: vi.fn().mockReturnValue(undefined) } as Partial<ReservationsService>);
      expect(thrown(() => new ReservationsController(svc, airtrailLink).update(user, '5', '9', { title: 'X' }))).toEqual({ status: 404, body: { error: 'Reservation not found' } });
    });

    it('updates, syncs budget with current fallbacks, broadcasts + notifies', () => {
      const getReservation = vi.fn().mockReturnValue({ title: 'Old', type: 'lodging' });
      const update = vi.fn().mockReturnValue({ reservation: { id: 9 }, accommodationChanged: true });
      const broadcast = vi.fn(); const syncBudgetOnUpdate = vi.fn(); const notifyBookingChange = vi.fn();
      const svc = makeService({ getReservation, update, broadcast, syncBudgetOnUpdate, notifyBookingChange } as Partial<ReservationsService>);
      new ReservationsController(svc, airtrailLink).update(user, '5', '9', { create_budget_entry: { total_price: 50 } }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'accommodation:updated', {}, 'sock');
      expect(syncBudgetOnUpdate).toHaveBeenCalledWith('5', '9', '', undefined, 'Old', 'lodging', { total_price: 50 }, 'sock');
      expect(notifyBookingChange).toHaveBeenCalledWith('5', user.id, 'Old', 'lodging');
    });

    it('400s on a body id belonging to another trip, without writing', () => {
      const update = vi.fn();
      const svc = makeService({
        getReservation: vi.fn().mockReturnValue({ title: 'Old', type: 'lodging' }),
        update,
        referencesOutsideTrip: vi.fn().mockReturnValue(['day_id', 'place_id']),
      } as Partial<ReservationsService>);
      expect(thrown(() => new ReservationsController(svc, airtrailLink).update(user, '5', '9', { day_id: 1, place_id: 2 })))
        .toEqual({ status: 400, body: { error: 'Not part of this trip: day_id, place_id' } });
      expect(update).not.toHaveBeenCalled();
    });

    it('400s on a body id that exists nowhere, without writing', () => {
      const update = vi.fn();
      const svc = makeService({
        getReservation: vi.fn().mockReturnValue({ title: 'Old', type: 'lodging' }),
        update,
        unresolvedReferences: vi.fn().mockReturnValue(['day_id', 'place_id']),
      } as Partial<ReservationsService>);
      // The reporter's request: a foreign-key error used to reach the caller as
      // a bare 500 here.
      expect(thrown(() => new ReservationsController(svc, airtrailLink).update(user, '5', '9', { day_id: 1, place_id: 2 })))
        .toEqual({ status: 400, body: { error: 'Unknown reference: day_id, place_id' } });
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('PUT /:id/travelers', () => {
    // The 'user_ids must be an array' 400 moved to the global
    // ZodValidationPipe (ReservationTravelersDto).

    it('404 when the reservation is off-trip / missing', () => {
      const svc = makeService({ setTravelers: vi.fn().mockReturnValue(null) } as Partial<ReservationsService>);
      expect(thrown(() => new ReservationsController(svc, airtrailLink).updateTravelers(user, '5', '9', { user_ids: [1] }))).toEqual({ status: 404, body: { error: 'Reservation not found' } });
    });

    it('assigns travelers, broadcasts, and returns { travelers, reservation }', () => {
      const travelers = [{ user_id: 2, username: 'Sam', avatar: null, is_guest: 0 }];
      const reservation = { id: 9, travelers };
      const setTravelers = vi.fn().mockReturnValue({ travelers, reservation });
      const broadcast = vi.fn();
      const svc = makeService({ setTravelers, broadcast } as Partial<ReservationsService>);
      expect(new ReservationsController(svc, airtrailLink).updateTravelers(user, '5', '9', { user_ids: [2] }, 'sock')).toEqual({ travelers, reservation });
      expect(setTravelers).toHaveBeenCalledWith('9', '5', [2]);
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:travelers-updated', { reservationId: 9, travelers }, 'sock');
    });
  });

  describe('DELETE /:id', () => {
    it('404 when nothing deleted', () => {
      const broadcast = vi.fn();
      const svc = makeService({
        remove: vi.fn().mockReturnValue({ deleted: undefined, accommodationDeleted: false, deletedBudgetItemId: null, deletedBudgetItemIds: [] }),
        broadcast,
      } as Partial<ReservationsService>);
      expect(thrown(() => new ReservationsController(svc, airtrailLink).remove(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Reservation not found' } });
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('broadcasts the accommodation + budget cascade then reservation:deleted', () => {
      const remove = vi.fn().mockReturnValue({ deleted: { id: 9, title: 'Hotel', type: 'lodging', accommodation_id: 3 }, accommodationDeleted: true, deletedBudgetItemId: 7, deletedBudgetItemIds: [7] });
      const broadcast = vi.fn(); const notifyBookingChange = vi.fn();
      const svc = makeService({ remove, broadcast, notifyBookingChange } as Partial<ReservationsService>);
      expect(new ReservationsController(svc, airtrailLink).remove(user, '5', '9', 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('5', 'accommodation:deleted', { accommodationId: 3 }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:deleted', { itemId: 7 }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:deleted', { reservationId: 9 }, 'sock');
      expect(notifyBookingChange).toHaveBeenCalledWith('5', user.id, 'Hotel', 'lodging');
    });

    it('announces every expense the booking took with it, before the booking itself (#2084)', () => {
      const remove = vi.fn().mockReturnValue({ deleted: { id: 9, title: 'Flight', type: 'flight', accommodation_id: null }, accommodationDeleted: false, deletedBudgetItemId: 7, deletedBudgetItemIds: [7, 8] });
      const broadcast = vi.fn();
      const svc = makeService({ remove, broadcast } as Partial<ReservationsService>);
      new ReservationsController(svc, airtrailLink).remove(user, '5', '9', 'sock');
      expect(broadcast.mock.calls).toEqual([
        ['5', 'budget:deleted', { itemId: 7 }, 'sock'],
        ['5', 'budget:deleted', { itemId: 8 }, 'sock'],
        ['5', 'reservation:deleted', { reservationId: 9 }, 'sock'],
      ]);
    });

    it('announces no expense when the booking carried none', () => {
      const remove = vi.fn().mockReturnValue({ deleted: { id: 9, title: 'Museum', type: 'activity', accommodation_id: null }, accommodationDeleted: false, deletedBudgetItemId: null, deletedBudgetItemIds: [] });
      const broadcast = vi.fn();
      const svc = makeService({ remove, broadcast } as Partial<ReservationsService>);
      new ReservationsController(svc, airtrailLink).remove(user, '5', '9', 'sock');
      expect(broadcast.mock.calls).toEqual([['5', 'reservation:deleted', { reservationId: 9 }, 'sock']]);
    });
  });
});
