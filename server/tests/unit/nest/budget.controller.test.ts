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

async function thrownAsync(fn: () => Promise<unknown>): Promise<{ status: number; body: unknown }> {
  try {
    await fn();
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
    const settlement = vi.fn().mockReturnValue({ transfers: [] });
    const svc = makeService({
      perPersonSummary: vi.fn().mockReturnValue([{ userId: 1, owes: 10 }]),
      settlement,
    } as Partial<BudgetService>);
    expect(new BudgetController(svc).perPerson(user, '5')).toEqual({ summary: [{ userId: 1, owes: 10 }] });
    expect(new BudgetController(svc).settlement(user, '5')).toEqual({ transfers: [] });
    expect(settlement).toHaveBeenLastCalledWith('5', undefined, 'EUR');
  });

  it('GET /settlement forwards the base query and the trip currency', () => {
    const settlement = vi.fn().mockReturnValue({ transfers: [] });
    const svc = makeService({
      verifyTripAccess: vi.fn().mockReturnValue({ id: 5, user_id: 1, currency: 'USD' }),
      settlement,
    } as Partial<BudgetService>);
    new BudgetController(svc).settlement(user, '5', 'GBP');
    expect(settlement).toHaveBeenCalledWith('5', 'GBP', 'USD');
  });

  describe('settlements ledger', () => {
    it('GET /settlements lists', () => {
      const svc = makeService({ listSettlements: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<BudgetService>);
      expect(new BudgetController(svc).listSettlements(user, '5')).toEqual({ settlements: [{ id: 1 }] });
    });

    it('POST /settlements 403 without budget_edit', async () => {
      const svc = makeService({ canEdit: vi.fn().mockReturnValue(false) });
      expect(await thrownAsync(() => new BudgetController(svc).createSettlement(user, '5', { from_user_id: 1, to_user_id: 2, amount: 10 }))).toEqual({
        status: 403, body: { error: 'No permission' },
      });
    });

    it('POST /settlements 400 when a field is missing', async () => {
      const svc = makeService();
      expect(await thrownAsync(() => new BudgetController(svc).createSettlement(user, '5', { from_user_id: 1, to_user_id: 2 }))).toEqual({
        status: 400, body: { error: 'from_user_id, to_user_id and amount are required' },
      });
      expect(await thrownAsync(() => new BudgetController(svc).createSettlement(user, '5', { from_user_id: 1, amount: 5 }))).toEqual({
        status: 400, body: { error: 'from_user_id, to_user_id and amount are required' },
      });
      expect(await thrownAsync(() => new BudgetController(svc).createSettlement(user, '5', { to_user_id: 2, amount: 5 }))).toEqual({
        status: 400, body: { error: 'from_user_id, to_user_id and amount are required' },
      });
    });

    it('POST /settlements creates and broadcasts (amount 0 is allowed), forwarding the display currency', async () => {
      const createSettlement = vi.fn().mockResolvedValue({ id: 3, amount: 0 });
      const broadcast = vi.fn();
      const svc = makeService({ createSettlement, broadcast } as Partial<BudgetService>);
      const res = await new BudgetController(svc).createSettlement(user, '5', { from_user_id: 1, to_user_id: 2, amount: 0, currency: 'USD' }, 'sock');
      expect(res).toEqual({ settlement: { id: 3, amount: 0 } });
      expect(createSettlement).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 0, currency: 'USD' }, user.id);
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:settlement-created', { settlement: { id: 3, amount: 0 } }, 'sock');
    });

    it('DELETE /settlements/:id 404 when missing', () => {
      const svc = makeService({ deleteSettlement: vi.fn().mockReturnValue(false) } as Partial<BudgetService>);
      expect(thrown(() => new BudgetController(svc).deleteSettlement(user, '5', '7'))).toEqual({
        status: 404, body: { error: 'Settlement not found' },
      });
    });

    it('DELETE /settlements/:id success broadcasts the numeric id', () => {
      const broadcast = vi.fn();
      const svc = makeService({ deleteSettlement: vi.fn().mockReturnValue(true), broadcast } as Partial<BudgetService>);
      expect(new BudgetController(svc).deleteSettlement(user, '5', '7', 'sock')).toEqual({ success: true });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:settlement-deleted', { settlementId: 7 }, 'sock');
    });

    it('PUT /settlements/:id 403 without budget_edit', async () => {
      const svc = makeService({ canEdit: vi.fn().mockReturnValue(false) });
      expect(await thrownAsync(() => new BudgetController(svc).updateSettlement(user, '5', '7', { from_user_id: 1, to_user_id: 2, amount: 10 }))).toEqual({
        status: 403, body: { error: 'No permission' },
      });
    });

    it('PUT /settlements/:id 400 when a field is missing', async () => {
      const svc = makeService();
      expect(await thrownAsync(() => new BudgetController(svc).updateSettlement(user, '5', '7', { from_user_id: 1, to_user_id: 2 }))).toEqual({
        status: 400, body: { error: 'from_user_id, to_user_id and amount are required' },
      });
    });

    it('PUT /settlements/:id 404 when missing', async () => {
      const svc = makeService({ updateSettlement: vi.fn().mockResolvedValue(null) } as Partial<BudgetService>);
      expect(await thrownAsync(() => new BudgetController(svc).updateSettlement(user, '5', '7', { from_user_id: 1, to_user_id: 2, amount: 10 }))).toEqual({
        status: 404, body: { error: 'Settlement not found' },
      });
    });

    it('PUT /settlements/:id updates and broadcasts, forwarding the display currency', async () => {
      const updateSettlement = vi.fn().mockResolvedValue({ id: 7, from_user_id: 2, to_user_id: 1, amount: 15 });
      const broadcast = vi.fn();
      const svc = makeService({ updateSettlement, broadcast } as Partial<BudgetService>);
      const res = await new BudgetController(svc).updateSettlement(user, '5', '7', { from_user_id: 2, to_user_id: 1, amount: 15, currency: 'USD' }, 'sock');
      expect(res).toEqual({ settlement: { id: 7, from_user_id: 2, to_user_id: 1, amount: 15 } });
      expect(updateSettlement).toHaveBeenCalledWith('7', '5', { from_user_id: 2, to_user_id: 1, amount: 15, currency: 'USD' });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:settlement-updated', { settlement: { id: 7, from_user_id: 2, to_user_id: 1, amount: 15 } }, 'sock');
    });
  });

  describe('POST /', () => {
    it('403 without budget_edit', async () => {
      const svc = makeService({ canEdit: vi.fn().mockReturnValue(false) });
      expect(await thrownAsync(() => new BudgetController(svc).create(user, '5', { name: 'Hotel' }))).toEqual({
        status: 403, body: { error: 'No permission' },
      });
    });

    it('400 when name missing', async () => {
      expect(await thrownAsync(() => new BudgetController(makeService()).create(user, '5', {}))).toEqual({
        status: 400, body: { error: 'Name is required' },
      });
    });

    it('creates and broadcasts', async () => {
      const create = vi.fn().mockReturnValue({ id: 9, name: 'Hotel' });
      const broadcast = vi.fn();
      const svc = makeService({ create, broadcast } as Partial<BudgetService>);
      expect(await new BudgetController(svc).create(user, '5', { name: 'Hotel', total_price: 200 }, 'sock')).toEqual({ item: { id: 9, name: 'Hotel' } });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:created', { item: { id: 9, name: 'Hotel' } }, 'sock');
    });
  });

  describe('PUT /:id', () => {
    it('404 when item missing', async () => {
      const svc = makeService({ update: vi.fn().mockReturnValue(null) } as Partial<BudgetService>);
      expect(await thrownAsync(() => new BudgetController(svc).update(user, '5', '9', { name: 'X' }))).toEqual({
        status: 404, body: { error: 'Budget item not found' },
      });
    });

    it('syncs the reservation price when a linked item changes total_price', async () => {
      const update = vi.fn().mockReturnValue({ id: 9, reservation_id: 42, total_price: 250 });
      const syncReservationPrice = vi.fn();
      const broadcast = vi.fn();
      const svc = makeService({ update, syncReservationPrice, broadcast } as Partial<BudgetService>);
      await new BudgetController(svc).update(user, '5', '9', { total_price: 250 }, 'sock');
      expect(syncReservationPrice).toHaveBeenCalledWith('5', 42, 250, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:updated', { item: { id: 9, reservation_id: 42, total_price: 250 } }, 'sock');
    });

    it('does not sync when the item has no linked reservation', async () => {
      const update = vi.fn().mockReturnValue({ id: 9, reservation_id: null, total_price: 250 });
      const syncReservationPrice = vi.fn();
      const svc = makeService({ update, syncReservationPrice } as Partial<BudgetService>);
      await new BudgetController(svc).update(user, '5', '9', { total_price: 250 });
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

  describe('PUT /:id/payers', () => {
    it('400 when payers is not an array', () => {
      expect(thrown(() => new BudgetController(makeService()).setPayers(user, '5', '9', 'nope'))).toEqual({
        status: 400, body: { error: 'payers must be an array' },
      });
    });

    it('404 when the item is missing', () => {
      const svc = makeService({ setPayers: vi.fn().mockReturnValue(null) } as Partial<BudgetService>);
      expect(thrown(() => new BudgetController(svc).setPayers(user, '5', '9', [{ user_id: 2, amount: 10 }]))).toEqual({
        status: 404, body: { error: 'Budget item not found' },
      });
    });

    it('sets payers and broadcasts budget:updated', () => {
      const setPayers = vi.fn().mockReturnValue({ id: 9, payers: [{ user_id: 2, amount: 10 }] });
      const broadcast = vi.fn();
      const svc = makeService({ setPayers, broadcast } as Partial<BudgetService>);
      const res = new BudgetController(svc).setPayers(user, '5', '9', [{ user_id: 2, amount: 10 }], 'sock');
      expect(res).toEqual({ item: { id: 9, payers: [{ user_id: 2, amount: 10 }] } });
      expect(setPayers).toHaveBeenCalledWith('9', '5', [{ user_id: 2, amount: 10 }]);
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:updated', { item: { id: 9, payers: [{ user_id: 2, amount: 10 }] } }, 'sock');
    });
  });

  it('PUT /:id/members/:userId/paid toggles + broadcasts normalised paid flag', () => {
    const toggleMemberPaid = vi.fn().mockReturnValue({ user_id: 2, paid: 1 });
    const broadcast = vi.fn();
    const svc = makeService({ toggleMemberPaid, broadcast } as Partial<BudgetService>);
    expect(new BudgetController(svc).toggleMemberPaid(user, '5', '9', '2', true, 'sock')).toEqual({ member: { user_id: 2, paid: 1 } });
    expect(broadcast).toHaveBeenCalledWith('5', 'budget:member-paid-updated', { itemId: 9, userId: 2, paid: 1 }, 'sock');
  });

  it('PUT /:id/members/:userId/paid broadcasts paid: 0 when toggled off', () => {
    const toggleMemberPaid = vi.fn().mockReturnValue({ user_id: 2, paid: 0 });
    const broadcast = vi.fn();
    const svc = makeService({ toggleMemberPaid, broadcast } as Partial<BudgetService>);
    new BudgetController(svc).toggleMemberPaid(user, '5', '9', '2', false, 'sock');
    expect(broadcast).toHaveBeenCalledWith('5', 'budget:member-paid-updated', { itemId: 9, userId: 2, paid: 0 }, 'sock');
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
