import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { AccommodationsController } from '../../../src/nest/reservations/accommodations.controller';
import type { AccommodationsService } from '../../../src/nest/reservations/accommodations.service';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const trip = { user_id: 1 };
const refs = { place_id: 2, start_day_id: 10, end_day_id: 11 };

function makeService(overrides: Partial<AccommodationsService> = {}): AccommodationsService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue(trip),
    canEdit: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    validateRefs: vi.fn().mockReturnValue([]),
    ...overrides,
  } as unknown as AccommodationsService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try { fn(); } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected throw');
}

describe('AccommodationsController (parity with the legacy accommodations sub-router)', () => {
  it('404 when trip not accessible', () => {
    const svc = makeService({ verifyTripAccess: vi.fn().mockReturnValue(undefined) });
    expect(thrown(() => new AccommodationsController(svc).list(user, '5'))).toEqual({ status: 404, body: { error: 'Trip not found' } });
  });

  it('GET / lists (no permission gate)', () => {
    const svc = makeService({ list: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<AccommodationsService>);
    expect(new AccommodationsController(svc).list(user, '5')).toEqual({ accommodations: [{ id: 1 }] });
  });

  describe('POST /', () => {
    it('403 without day_edit', () => {
      const svc = makeService({ canEdit: vi.fn().mockReturnValue(false) });
      expect(thrown(() => new AccommodationsController(svc).create(user, '5', refs))).toEqual({ status: 403, body: { error: 'No permission' } });
    });

    it('400 when refs are missing', () => {
      expect(thrown(() => new AccommodationsController(makeService()).create(user, '5', { place_id: 2 }))).toEqual({
        status: 400, body: { error: 'place_id, start_day_id, and end_day_id are required' },
      });
    });

    it('404 with the first validateRefs error message', () => {
      const svc = makeService({ validateRefs: vi.fn().mockReturnValue([{ field: 'place_id', message: 'Place not found' }]) } as Partial<AccommodationsService>);
      expect(thrown(() => new AccommodationsController(svc).create(user, '5', refs))).toEqual({ status: 404, body: { error: 'Place not found' } });
    });

    it('creates and emits accommodation:created + reservation:created', () => {
      const create = vi.fn().mockReturnValue({ id: 9 });
      const broadcast = vi.fn();
      const svc = makeService({ create, broadcast } as Partial<AccommodationsService>);
      expect(new AccommodationsController(svc).create(user, '5', refs, 'sock')).toEqual({ accommodation: { id: 9 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'accommodation:created', { accommodation: { id: 9 } }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:created', {}, 'sock');
    });
  });

  describe('PUT /:id', () => {
    it('404 when the accommodation is missing', () => {
      const svc = makeService({ get: vi.fn().mockReturnValue(undefined) } as Partial<AccommodationsService>);
      expect(thrown(() => new AccommodationsController(svc).update(user, '5', '9', refs))).toEqual({ status: 404, body: { error: 'Accommodation not found' } });
    });

    it('updates and broadcasts', () => {
      const get = vi.fn().mockReturnValue({ id: 9 });
      const update = vi.fn().mockReturnValue({ id: 9, notes: 'x' });
      const broadcast = vi.fn();
      const svc = makeService({ get, update, broadcast } as Partial<AccommodationsService>);
      expect(new AccommodationsController(svc).update(user, '5', '9', refs, 'sock')).toEqual({ accommodation: { id: 9, notes: 'x' } });
      expect(broadcast).toHaveBeenCalledWith('5', 'accommodation:updated', { accommodation: { id: 9, notes: 'x' } }, 'sock');
    });
  });

  describe('DELETE /:id', () => {
    it('404 when missing', () => {
      const svc = makeService({ get: vi.fn().mockReturnValue(undefined) } as Partial<AccommodationsService>);
      expect(thrown(() => new AccommodationsController(svc).remove(user, '5', '9'))).toEqual({ status: 404, body: { error: 'Accommodation not found' } });
    });

    it('emits the linked reservation/budget cascade then accommodation:deleted', () => {
      const get = vi.fn().mockReturnValue({ id: 9 });
      const remove = vi.fn().mockReturnValue({ linkedReservationId: 4, deletedBudgetItemId: 7 });
      const broadcast = vi.fn();
      const svc = makeService({ get, remove, broadcast } as Partial<AccommodationsService>);
      expect(new AccommodationsController(svc).remove(user, '5', '9', 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:deleted', { reservationId: 4 }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:deleted', { itemId: 7 }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'accommodation:deleted', { accommodationId: 9 }, 'sock');
    });
  });
});
