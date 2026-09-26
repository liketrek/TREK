import { describe, it, expect, vi } from 'vitest';
import { HttpException } from '@nestjs/common';
import { HTTP_CODE_METADATA } from '@nestjs/common/constants';
import { BudgetController } from '../../../src/nest/budget/budget.controller';
import { TRIP_PERMISSION_KEY } from '../../../src/nest/permissions/trip-access.guard';
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
    // Both write routes ask this before they write (#2084); null lets them through.
    linkRefusal: vi.fn().mockReturnValue(null),
    getBudgetItem: vi.fn().mockReturnValue(null),
    resyncLinkedPrices: vi.fn(),
    resyncReservationPrice: vi.fn(),
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

/** The trip row TripAccessGuard resolves and @Trip() hands to the settlement route. */
const tripRow = { id: 5, user_id: 42, currency: 'USD' } as never;

describe('BudgetController (parity with the legacy /api/trips/:tripId/budget route)', () => {

  it('GET / returns items', () => {
    const svc = makeService({ list: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<BudgetService>);
    expect(new BudgetController(svc).list(user, '5')).toEqual({ items: [{ id: 1 }] });
  });

  it('GET /summary/per-person + /settlement delegate', async () => {
    const settlement = vi.fn().mockReturnValue({ transfers: [] });
    const svc = makeService({
      perPersonSummary: vi.fn().mockReturnValue([{ userId: 1, owes: 10 }]),
      settlement,
    } as Partial<BudgetService>);
    expect(await new BudgetController(svc).perPerson(user, '5')).toEqual({ summary: [{ userId: 1, owes: 10 }] });
    // A trip with no currency set falls back to EUR rather than passing undefined on.
    expect(new BudgetController(svc).settlement(user, { id: 5, user_id: 42 } as never, '5', {})).toEqual({ transfers: [] });
    expect(settlement).toHaveBeenLastCalledWith('5', undefined, 'EUR', undefined);
  });

  it('GET /settlement forwards the base query and the trip currency', () => {
    const settlement = vi.fn().mockReturnValue({ transfers: [] });
    const svc = makeService({
      verifyTripAccess: vi.fn().mockReturnValue({ id: 5, user_id: 1, currency: 'USD' }),
      settlement,
    } as Partial<BudgetService>);
    new BudgetController(svc).settlement(user, tripRow, '5', { base: 'GBP' });
    expect(settlement).toHaveBeenCalledWith('5', 'GBP', 'USD', undefined);
  });

  it('GET /settlement forwards base and base_rate', () => {
    const settlement = vi.fn().mockReturnValue({ transfers: [] });
    const svc = makeService({ settlement } as Partial<BudgetService>);
    // The Zod pipe has coerced base_rate to a number by the time the handler runs.
    new BudgetController(svc).settlement(user, tripRow, '5', { base: 'EUR', base_rate: 0.61 });
    expect(settlement).toHaveBeenCalledWith('5', 'EUR', 'USD', 0.61);
  });

  describe('settlements ledger', () => {
    it('GET /settlements lists', () => {
      const svc = makeService({ listSettlements: vi.fn().mockReturnValue([{ id: 1 }]) } as Partial<BudgetService>);
      expect(new BudgetController(svc).listSettlements(user, '5')).toEqual({ settlements: [{ id: 1 }] });
    });


    // The legacy 'from_user_id, to_user_id and amount are required' 400s are now
    // produced by the global ZodValidationPipe (budget.dto.ts) before the handler
    // runs — covered by the integration suite, not constructible here.

    it('POST /settlements creates and broadcasts (amount 0 is allowed), forwarding the display currency and the settled day', async () => {
      const createSettlement = vi.fn().mockResolvedValue({ id: 3, amount: 0 });
      const broadcast = vi.fn();
      const svc = makeService({ createSettlement, broadcast } as Partial<BudgetService>);
      const res = await new BudgetController(svc).createSettlement(user, '5', { from_user_id: 1, to_user_id: 2, amount: 0, currency: 'USD', settled_at: '2026-01-05' }, 'sock');
      expect(res).toEqual({ settlement: { id: 3, amount: 0 } });
      expect(createSettlement).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 0, currency: 'USD', settled_at: '2026-01-05' }, user.id);
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:settlement-created', { settlement: { id: 3, amount: 0 } }, 'sock');
    });

    it('POST and PUT /settlements forward fallback_fx', async () => {
      const fallback_fx = { base: 'AUD', rates: { EUR: 0.61 } };
      const createSettlement = vi.fn().mockResolvedValue({ id: 3 });
      const updateSettlement = vi.fn().mockResolvedValue({ id: 3 });
      const svc = makeService({ createSettlement, updateSettlement } as Partial<BudgetService>);
      const body = { from_user_id: 1, to_user_id: 2, amount: 10, currency: 'EUR', fallback_fx };
      await new BudgetController(svc).createSettlement(user, '5', body);
      expect(createSettlement).toHaveBeenCalledWith('5', expect.objectContaining({ currency: 'EUR', fallback_fx }), user.id);
      await new BudgetController(svc).updateSettlement(user, '5', '3', body);
      expect(updateSettlement).toHaveBeenCalledWith('3', '5', expect.objectContaining({ currency: 'EUR', fallback_fx }));
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


    it('PUT /settlements/:id 404 when missing', async () => {
      const svc = makeService({ updateSettlement: vi.fn().mockResolvedValue(null) } as Partial<BudgetService>);
      expect(await thrownAsync(() => new BudgetController(svc).updateSettlement(user, '5', '7', { from_user_id: 1, to_user_id: 2, amount: 10 }))).toEqual({
        status: 404, body: { error: 'Settlement not found' },
      });
    });

    it('PUT /settlements/:id updates and broadcasts, forwarding the display currency and the settled day', async () => {
      const updateSettlement = vi.fn().mockResolvedValue({ id: 7, from_user_id: 2, to_user_id: 1, amount: 15 });
      const broadcast = vi.fn();
      const svc = makeService({ updateSettlement, broadcast } as Partial<BudgetService>);
      const res = await new BudgetController(svc).updateSettlement(user, '5', '7', { from_user_id: 2, to_user_id: 1, amount: 15, currency: 'USD', settled_at: '2026-01-06' }, 'sock');
      expect(res).toEqual({ settlement: { id: 7, from_user_id: 2, to_user_id: 1, amount: 15 } });
      expect(updateSettlement).toHaveBeenCalledWith('7', '5', { from_user_id: 2, to_user_id: 1, amount: 15, currency: 'USD', settled_at: '2026-01-06' });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:settlement-updated', { settlement: { id: 7, from_user_id: 2, to_user_id: 1, amount: 15 } }, 'sock');
    });
  });

  describe('POST /freeze-rates', () => {
    const fallback_fx = { base: 'AUD', rates: { VND: 18241.3 } };

    it('forwards fallback_fx and broadcasts per row', async () => {
      const healed = {
        items: [{ id: 7, exchange_rate: 18241.3 }, { id: 8, exchange_rate: 18241.3 }],
        settlements: [{ id: 3, exchange_rate: 18241.3 }],
        unresolved: ['XAF'],
      };
      const freezeMissingRates = vi.fn().mockResolvedValue(healed);
      const broadcast = vi.fn();
      const svc = makeService({ freezeMissingRates, broadcast } as Partial<BudgetService>);
      expect(await new BudgetController(svc).freezeRates(user, '5', { fallback_fx }, 'sock')).toEqual(healed);
      expect(freezeMissingRates).toHaveBeenCalledWith('5', fallback_fx);
      expect(broadcast.mock.calls).toEqual([
        ['5', 'budget:updated', { item: healed.items[0] }, 'sock'],
        ['5', 'budget:updated', { item: healed.items[1] }, 'sock'],
        ['5', 'budget:settlement-updated', { settlement: healed.settlements[0] }, 'sock'],
      ]);
    });

    it('answers 409 and broadcasts nothing when the trip currency changed meanwhile', async () => {
      const broadcast = vi.fn();
      const svc = makeService({ freezeMissingRates: vi.fn().mockResolvedValue(null), broadcast } as Partial<BudgetService>);
      expect(await thrownAsync(() => new BudgetController(svc).freezeRates(user, '5', {}))).toEqual({
        status: 409, body: { error: 'The trip currency changed. Reload and try again.' },
      });
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('requires budget_edit like freeze_budget_rates, and answers 200', () => {
      const handler = BudgetController.prototype.freezeRates;
      expect(Reflect.getMetadata(TRIP_PERMISSION_KEY, handler)).toBe('budget_edit');
      expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(200);
    });
  });

  describe('POST /', () => {

    // The legacy 'Name is required' 400 is now produced by the global
    // ZodValidationPipe (budgetCreateItemRequestSchema requires name) before
    // the handler runs — covered by the integration suite.

    it('creates and broadcasts', async () => {
      const create = vi.fn().mockReturnValue({ id: 9, name: 'Hotel' });
      const broadcast = vi.fn();
      const linkRefusal = vi.fn().mockReturnValue(null);
      const resyncReservationPrice = vi.fn();
      const svc = makeService({ create, broadcast, linkRefusal, resyncReservationPrice } as Partial<BudgetService>);
      expect(await new BudgetController(svc).create(user, '5', { name: 'Hotel', total_price: 200 }, 'sock')).toEqual({ item: { id: 9, name: 'Hotel' } });
      expect(linkRefusal).toHaveBeenCalledWith('5', { name: 'Hotel', total_price: 200 });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:created', { item: { id: 9, name: 'Hotel' } }, 'sock');
      // Not linked to a booking, so no booking price to work out.
      expect(resyncReservationPrice).not.toHaveBeenCalled();
    });

    it('an expense created on a booking adds to the price the booking mirrors (#2084)', async () => {
      const item = { id: 9, name: 'Seat', total_price: 15, reservation_id: 42 };
      const resyncReservationPrice = vi.fn();
      const broadcast = vi.fn();
      const svc = makeService({ create: vi.fn().mockReturnValue(item), resyncReservationPrice, broadcast } as Partial<BudgetService>);
      expect(await new BudgetController(svc).create(user, '5', { name: 'Seat', total_price: 15, reservation_id: 42 }, 'sock')).toEqual({ item });
      expect(resyncReservationPrice).toHaveBeenCalledWith('5', 42, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:created', { item }, 'sock');
    });

    // #2084: an expense can only point at a booking or a place of its own trip.
    // The body and the status are the contract the MCP tool mirrors word for word.
    it('400s on a reservation_id from another trip, without writing or broadcasting', async () => {
      const create = vi.fn();
      const broadcast = vi.fn();
      const resyncReservationPrice = vi.fn();
      const linkRefusal = vi.fn().mockReturnValue('reservation_id does not belong to this trip.');
      const svc = makeService({ create, broadcast, linkRefusal, resyncReservationPrice } as Partial<BudgetService>);
      const body = { name: 'Hotel', total_price: 200, reservation_id: 4711 };
      expect(await thrownAsync(() => new BudgetController(svc).create(user, '5', body, 'sock'))).toEqual({
        status: 400, body: { error: 'reservation_id does not belong to this trip.' },
      });
      expect(linkRefusal).toHaveBeenCalledWith('5', body);
      expect(create).not.toHaveBeenCalled();
      expect(resyncReservationPrice).not.toHaveBeenCalled();
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('400s on a place_id from another trip, without writing', async () => {
      const create = vi.fn();
      const svc = makeService({
        create,
        linkRefusal: vi.fn().mockReturnValue('place_id does not belong to this trip.'),
      } as Partial<BudgetService>);
      expect(await thrownAsync(() => new BudgetController(svc).create(user, '5', { name: 'Tickets', place_id: 4711 }))).toEqual({
        status: 400, body: { error: 'place_id does not belong to this trip.' },
      });
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe('PUT /:id', () => {
    it('404 when item missing, without resyncing any booking', async () => {
      const resyncLinkedPrices = vi.fn();
      const svc = makeService({ update: vi.fn().mockReturnValue(null), resyncLinkedPrices } as Partial<BudgetService>);
      expect(await thrownAsync(() => new BudgetController(svc).update(user, '5', '9', { name: 'X' }))).toEqual({
        status: 404, body: { error: 'Budget item not found' },
      });
      expect(resyncLinkedPrices).not.toHaveBeenCalled();
    });

    it('hands a total change to resyncLinkedPrices without snapshotting the item first', async () => {
      const updated = { id: 9, reservation_id: 42, total_price: 250 };
      const update = vi.fn().mockReturnValue(updated);
      const getBudgetItem = vi.fn();
      const resyncLinkedPrices = vi.fn();
      const broadcast = vi.fn();
      const svc = makeService({ update, getBudgetItem, resyncLinkedPrices, broadcast } as Partial<BudgetService>);
      expect(await new BudgetController(svc).update(user, '5', '9', { total_price: 250 }, 'sock')).toEqual({ item: updated });
      // No link in the body, so the booking cannot have changed and the stored row is not read.
      expect(getBudgetItem).not.toHaveBeenCalled();
      expect(resyncLinkedPrices).toHaveBeenCalledWith('5', undefined, updated, { total_price: 250 }, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:updated', { item: updated }, 'sock');
    });

    it('snapshots the item before a re-link, so the booking it leaves is resynced too', async () => {
      const calls: string[] = [];
      const getBudgetItem = vi.fn().mockImplementation(() => { calls.push('snapshot'); return { id: 9, reservation_id: 42 }; });
      const updated = { id: 9, reservation_id: 43, total_price: 80 };
      const update = vi.fn().mockImplementation(() => { calls.push('write'); return updated; });
      const resyncLinkedPrices = vi.fn();
      const svc = makeService({ update, getBudgetItem, resyncLinkedPrices } as Partial<BudgetService>);
      await new BudgetController(svc).update(user, '5', '9', { reservation_id: 43 }, 'sock');
      expect(getBudgetItem).toHaveBeenCalledWith('9', '5');
      expect(calls).toEqual(['snapshot', 'write']);
      expect(resyncLinkedPrices).toHaveBeenCalledWith('5', 42, updated, { reservation_id: 43 }, 'sock');
    });

    it('snapshots on an unlink (reservation_id null) as well', async () => {
      const getBudgetItem = vi.fn().mockReturnValue({ id: 9, reservation_id: 42 });
      const updated = { id: 9, reservation_id: null, total_price: 80 };
      const resyncLinkedPrices = vi.fn();
      const svc = makeService({ update: vi.fn().mockReturnValue(updated), getBudgetItem, resyncLinkedPrices } as Partial<BudgetService>);
      expect(await new BudgetController(svc).update(user, '5', '9', { reservation_id: null })).toEqual({ item: updated });
      expect(resyncLinkedPrices).toHaveBeenCalledWith('5', 42, updated, { reservation_id: null }, undefined);
    });

    it('400s on a reservation_id from another trip, before reading, writing or resyncing', async () => {
      const update = vi.fn();
      const getBudgetItem = vi.fn();
      const resyncLinkedPrices = vi.fn();
      const broadcast = vi.fn();
      const linkRefusal = vi.fn().mockReturnValue('reservation_id does not belong to this trip.');
      const svc = makeService({ update, getBudgetItem, resyncLinkedPrices, broadcast, linkRefusal } as Partial<BudgetService>);
      expect(await thrownAsync(() => new BudgetController(svc).update(user, '5', '9', { reservation_id: 4711 }, 'sock'))).toEqual({
        status: 400, body: { error: 'reservation_id does not belong to this trip.' },
      });
      expect(linkRefusal).toHaveBeenCalledWith('5', { reservation_id: 4711 });
      expect(getBudgetItem).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      expect(resyncLinkedPrices).not.toHaveBeenCalled();
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('400s on a place_id from another trip, without writing', async () => {
      const update = vi.fn();
      const svc = makeService({
        update,
        linkRefusal: vi.fn().mockReturnValue('place_id does not belong to this trip.'),
      } as Partial<BudgetService>);
      expect(await thrownAsync(() => new BudgetController(svc).update(user, '5', '9', { place_id: 4711 }))).toEqual({
        status: 400, body: { error: 'place_id does not belong to this trip.' },
      });
      expect(update).not.toHaveBeenCalled();
    });
  });

  describe('PUT /:id/members', () => {
    // The legacy 'user_ids must be an array' 400 is now produced by the global
    // ZodValidationPipe (budgetUpdateMembersRequestSchema) before the handler runs.

    it('404 when the item is missing', () => {
      const svc = makeService({ updateMembers: vi.fn().mockReturnValue(null) } as Partial<BudgetService>);
      expect(thrown(() => new BudgetController(svc).updateMembers(user, '5', '9', { user_ids: [2, 3] }))).toEqual({
        status: 404, body: { error: 'Budget item not found' },
      });
    });

    it('updates members and broadcasts persons count', () => {
      const updateMembers = vi.fn().mockReturnValue({ members: [{ user_id: 2 }], item: { persons: 1 } });
      const broadcast = vi.fn();
      const svc = makeService({ updateMembers, broadcast } as Partial<BudgetService>);
      const res = new BudgetController(svc).updateMembers(user, '5', '9', { user_ids: [2] }, 'sock');
      expect(res).toEqual({ members: [{ user_id: 2 }], item: { persons: 1 } });
      expect(updateMembers).toHaveBeenCalledWith('9', '5', [2]);
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:members-updated', { itemId: 9, members: [{ user_id: 2 }], persons: 1 }, 'sock');
    });
  });

  describe('PUT /:id/payers', () => {
    // The legacy 'payers must be an array' 400 is now produced by the global
    // ZodValidationPipe (budgetUpdatePayersRequestSchema) before the handler runs.

    it('404 when the item is missing', () => {
      const resyncReservationPrice = vi.fn();
      const svc = makeService({ setPayers: vi.fn().mockReturnValue(null), resyncReservationPrice } as Partial<BudgetService>);
      expect(thrown(() => new BudgetController(svc).setPayers(user, '5', '9', { payers: [{ user_id: 2, amount: 10 }] }))).toEqual({
        status: 404, body: { error: 'Budget item not found' },
      });
      expect(resyncReservationPrice).not.toHaveBeenCalled();
    });

    it('sets payers and broadcasts budget:updated', () => {
      const setPayers = vi.fn().mockReturnValue({ id: 9, payers: [{ user_id: 2, amount: 10 }] });
      const broadcast = vi.fn();
      const resyncReservationPrice = vi.fn();
      const svc = makeService({ setPayers, broadcast, resyncReservationPrice } as Partial<BudgetService>);
      const res = new BudgetController(svc).setPayers(user, '5', '9', { payers: [{ user_id: 2, amount: 10 }] }, 'sock');
      expect(res).toEqual({ item: { id: 9, payers: [{ user_id: 2, amount: 10 }] } });
      expect(setPayers).toHaveBeenCalledWith('9', '5', [{ user_id: 2, amount: 10 }]);
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:updated', { item: { id: 9, payers: [{ user_id: 2, amount: 10 }] } }, 'sock');
      expect(resyncReservationPrice).not.toHaveBeenCalled();
    });

    it('resyncs the linked booking, since the payers derive the total it mirrors (#2084)', () => {
      const item = { id: 9, reservation_id: 42, total_price: 30, payers: [{ user_id: 2, amount: 30 }] };
      const resyncReservationPrice = vi.fn();
      const broadcast = vi.fn();
      const svc = makeService({ setPayers: vi.fn().mockReturnValue(item), resyncReservationPrice, broadcast } as Partial<BudgetService>);
      expect(new BudgetController(svc).setPayers(user, '5', '9', { payers: [{ user_id: 2, amount: 30 }] }, 'sock')).toEqual({ item });
      expect(resyncReservationPrice).toHaveBeenCalledWith('5', 42, 'sock');
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:updated', { item }, 'sock');
    });
  });

  it('PUT /:id/members/:userId/paid toggles + broadcasts normalised paid flag', () => {
    const toggleMemberPaid = vi.fn().mockReturnValue({ user_id: 2, paid: 1 });
    const broadcast = vi.fn();
    const svc = makeService({ toggleMemberPaid, broadcast } as Partial<BudgetService>);
    expect(new BudgetController(svc).toggleMemberPaid(user, '5', '9', '2', { paid: true }, 'sock')).toEqual({ member: { user_id: 2, paid: 1 } });
    expect(broadcast).toHaveBeenCalledWith('5', 'budget:member-paid-updated', { itemId: 9, userId: 2, paid: 1 }, 'sock');
  });

  it('PUT /:id/members/:userId/paid broadcasts paid: 0 when toggled off', () => {
    const toggleMemberPaid = vi.fn().mockReturnValue({ user_id: 2, paid: 0 });
    const broadcast = vi.fn();
    const svc = makeService({ toggleMemberPaid, broadcast } as Partial<BudgetService>);
    new BudgetController(svc).toggleMemberPaid(user, '5', '9', '2', { paid: false }, 'sock');
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
    expect(new BudgetController(svc).reorderItems(user, '5', { orderedIds: [3, 1] }, 'sock')).toEqual({ success: true });
    expect(reorderItems).toHaveBeenCalledWith('5', [3, 1]);
    expect(new BudgetController(svc).reorderCategories(user, '5', { orderedCategories: ['food', 'fun'] }, 'sock')).toEqual({ success: true });
    expect(reorderCategories).toHaveBeenCalledWith('5', ['food', 'fun']);
  });
});
