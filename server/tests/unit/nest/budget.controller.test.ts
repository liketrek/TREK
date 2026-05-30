import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { BudgetController } from '../../../src/nest/budget/budget.controller';
import type { BudgetService } from '../../../src/nest/budget/budget.service';
import type { User } from '../../../src/types';

const user = { id: 1, role: 'user', email: 'u@example.test' } as User;
const trip = { id: 5, user_id: 1 };

function makeService(overrides: Partial<BudgetService> = {}): BudgetService {
  return {
    verifyTripAccess: vi.fn().mockReturnValue(trip),
    canEdit: vi.fn().mockReturnValue(true),
    broadcast: vi.fn(),
    syncReservationPrice: vi.fn(),
    ...overrides,
  } as unknown as BudgetService;
}

function thrown(fn: () => unknown): { status: number; body: unknown } {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpException);
    const e = err as HttpException;
    return { status: e.getStatus(), body: e.getResponse() };
  }
  throw new Error('expected the handler to throw');
}

describe('BudgetController (parity with the legacy /api/trips/:tripId/budget route)', () => {
  it('404 when the trip is not accessible', () => {
    const svc = makeService({ verifyTripAccess: vi.fn().mockReturnValue(undefined) });
    expect(thrown(() => new BudgetController(svc).list(user, '5'))).toEqual({
      status: 404, body: { error: 'Trip not found' },
    });
  });

  it('GET / returns items', () => {
    const svc = makeService({ list: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<BudgetService>);
    expect(new BudgetController(svc).list(user, '5')).toEqual({ items: [{ id: 1 }] });
  });

  it('GET /summary/per-person + /settlement delegate', () => {
    const svc = makeService({
      perPersonSummary: vi.fn().mockReturnValue([{ userId: 1, owes: 10 }]),
      settlement: vi.fn().mockReturnValue({ transfers: [] }),
    } as Partial<BudgetService>);
    expect(new BudgetController(svc).perPerson(user, '5')).toEqual({ summary: [{ userId: 1, owes: 10 }] });
    expect(new BudgetController(svc).settlement(user, '5')).toEqual({ transfers: [] });
  });

  describe('POST /', () => {
    it('403 without budget_edit', () => {
      const svc = makeService({ canEdit: vi.fn().mockReturnValue(false) });
      expect(thrown(() => new BudgetController(svc).create(user, '5', { name: 'Hotel' }))).toEqual({
        status: 403, body: { error: 'No permission' },
      });
    });

    it('400 when name missing', () => {
      expect(thrown(() => new BudgetController(makeService()).create(user, '5', {}))).toEqual({
        status: 400, body: { error: 'Name is required' },
      });
    });

    it('creates and broadcasts', () => {
      const create = vi.fn().mockReturnValue({ id: 9, name: 'Hotel' });
      const broadcast = vi.fn();
      const svc = makeService({ create, broadcast } as Partial<BudgetService>);
      expect(new BudgetController(svc).create(user, '5', { name: 'Hotel', total_price: 200 }, 'sock')).toEqual({ item: { id: 9, name: 'Hotel' } });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:created', { item: { id: 9, name: 'Hotel' } }, 'sock');
    });
  });

  describe('PUT /:id', () => {
    it('404 when item missing', () => {
      const svc = makeService({ update: vi.fn().mockReturnValue(null) } as Partial<BudgetService>);
      expect(thrown(() => new BudgetController(svc).update(user, '5', '9', { name: 'X' }))).toEqual({
        status: 404, body: { error: 'Budget item not found' },
      });
    });

    it('syncs the reservation price when a linked item changes total_price', () => {
      const update = vi.fn().mockReturnValue({ id: 9, reservation_id: 42, total_price: 250 });
      const syncReservationPrice = vi.fn();
      const broadcast = vi.fn();
      const svc = makeService({ update, syncReservationPrice, broadcast } as Partial<BudgetService>);
      new BudgetController(svc).update(user, '5', '9', { total_price: 250 }, 'sock');
      expect(syncReservationPrice).toHaveBeenCalledWith('5', 42, 250, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:updated', { item: { id: 9, reservation_id: 42, total_price: 250 } }, 'sock');
    });

    it('does not sync when the item has no linked reservation', () => {
      const update = vi.fn().mockReturnValue({ id: 9, reservation_id: null, total_price: 250 });
      const syncReservationPrice = vi.fn();
      const svc = makeService({ update, syncReservationPrice } as Partial<BudgetService>);
      new BudgetController(svc).update(user, '5', '9', { total_price: 250 });
      expect(syncReservationPrice).not.toHaveBeenCalled();
    });
  });

  describe('PUT /:id/members', () => {
    it('400 when user_ids is not an array', () => {
      expect(thrown(() => new BudgetController(makeService()).updateMembers(user, '5', '9', 'nope'))).toEqual({
        status: 400, body: { error: 'user_ids must be an array' },
      });
    });

    it('404 when the item is missing', () => {
      const svc = makeService({ updateMembers: vi.fn().mockReturnValue(null) } as Partial<BudgetService>);
      expect(thrown(() => new BudgetController(svc).updateMembers(user, '5', '9', [2, 3]))).toEqual({
        status: 404, body: { error: 'Budget item not found' },
      });
    });

    it('updates members and broadcasts persons count', () => {
      const updateMembers = vi.fn().mockReturnValue({ members: [{ user_id: 2 }], item: { persons: 1 } });
      const broadcast = vi.fn();
      const svc = makeService({ updateMembers, broadcast } as Partial<BudgetService>);
      const res = new BudgetController(svc).updateMembers(user, '5', '9', [2], 'sock');
      expect(res).toEqual({ members: [{ user_id: 2 }], item: { persons: 1 } });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:members-updated', { itemId: 9, members: [{ user_id: 2 }], persons: 1 }, 'sock');
    });
  });

  it('PUT /:id/members/:userId/paid toggles + broadcasts normalised paid flag', () => {
    const toggleMemberPaid = vi.fn().mockReturnValue({ user_id: 2, paid: 1 });
    const broadcast = vi.fn();
    const svc = makeService({ toggleMemberPaid, broadcast } as Partial<BudgetService>);
    expect(new BudgetController(svc).toggleMemberPaid(user, '5', '9', '2', true, 'sock')).toEqual({ member: { user_id: 2, paid: 1 } });
    expect(broadcast).toHaveBeenCalledWith('5', 'budget:member-paid-updated', { itemId: 9, userId: 2, paid: 1 }, 'sock');
  });

  it('DELETE /:id 404 when missing, success otherwise', () => {
    const missing = makeService({ remove: vi.fn().mockReturnValue(false) } as Partial<BudgetService>);
    expect(thrown(() => new BudgetController(missing).remove(user, '5', '9'))).toEqual({
      status: 404, body: { error: 'Budget item not found' },
    });
    const ok = makeService({ remove: vi.fn().mockReturnValue(true), broadcast: vi.fn() } as Partial<BudgetService>);
    expect(new BudgetController(ok).remove(user, '5', '9')).toEqual({ success: true });
  });

  it('PUT /reorder/items + /reorder/categories broadcast budget:reordered', () => {
    const reorderItems = vi.fn(); const reorderCategories = vi.fn(); const broadcast = vi.fn();
    const svc = makeService({ reorderItems, reorderCategories, broadcast } as Partial<BudgetService>);
    expect(new BudgetController(svc).reorderItems(user, '5', [3, 1], 'sock')).toEqual({ success: true });
    expect(reorderItems).toHaveBeenCalledWith('5', [3, 1]);
    expect(new BudgetController(svc).reorderCategories(user, '5', ['food', 'fun'], 'sock')).toEqual({ success: true });
    expect(reorderCategories).toHaveBeenCalledWith('5', ['food', 'fun']);
  });
});
