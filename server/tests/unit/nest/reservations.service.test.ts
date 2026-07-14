import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the data + side-effect dependencies the service reaches into directly.
const { dbMock } = vi.hoisted(() => {
  const stmt = { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() };
  return { dbMock: { prepare: vi.fn(() => stmt), _stmt: stmt } };
});
vi.mock('../../../src/db/database', () => ({ db: dbMock, closeDb: () => {}, reinitialize: () => {} }));

const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn(() => true) }));
vi.mock('../../../src/services/permissions', () => ({ checkPermission }));

const { budget } = vi.hoisted(() => ({
  budget: { createBudgetItem: vi.fn(), updateBudgetItem: vi.fn(), deleteBudgetItem: vi.fn(), linkBudgetItemToReservation: vi.fn() },
}));
vi.mock('../../../src/services/budgetService', () => budget);

const { resv } = vi.hoisted(() => ({
  resv: {
    verifyTripAccess: vi.fn(), listReservations: vi.fn(), createReservation: vi.fn(), updatePositions: vi.fn(),
    getReservation: vi.fn(), updateReservation: vi.fn(), deleteReservation: vi.fn(),
    notifyBookingChange: vi.fn(),
  },
}));
vi.mock('../../../src/services/reservationService', () => resv);

import { ReservationsService } from '../../../src/nest/reservations/reservations.service';

function svc() {
  return new ReservationsService();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('ReservationsService', () => {
  it('canEdit delegates to checkPermission with reservation_edit', () => {
    svc().canEdit({ user_id: 2 } as never, { id: 1, role: 'user' } as never);
    expect(checkPermission).toHaveBeenCalledWith('reservation_edit', 'user', 2, 1, true);
  });

  it('list/create/getReservation/remove delegate to the legacy service', () => {
    resv.listReservations.mockReturnValue([{ id: 1 }]);
    expect(svc().list('5')).toEqual([{ id: 1 }]);
    svc().create('5', { title: 'X' } as never);
    expect(resv.createReservation).toHaveBeenCalledWith('5', { title: 'X' });
    svc().getReservation('9', '5');
    expect(resv.getReservation).toHaveBeenCalledWith('9', '5');
    svc().remove('9', '5');
    expect(resv.deleteReservation).toHaveBeenCalledWith('9', '5');
  });

  describe('syncBudgetOnCreate', () => {
    it('does nothing without a positive price', () => {
      svc().syncBudgetOnCreate('5', 9, 'Hotel', 'lodging', undefined, 'sock');
      svc().syncBudgetOnCreate('5', 9, 'Hotel', 'lodging', { total_price: 0 }, 'sock');
      expect(budget.linkBudgetItemToReservation).not.toHaveBeenCalled();
    });

    it('links a budget item and broadcasts budget:created', () => {
      budget.linkBudgetItemToReservation.mockReturnValue({ id: 7 });
      svc().syncBudgetOnCreate('5', 9, 'Hotel', 'lodging', { total_price: 200, category: 'Lodging' }, 'sock');
      expect(budget.linkBudgetItemToReservation).toHaveBeenCalledWith('5', 9, { name: 'Hotel', category: 'Lodging', total_price: 200 });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:created', { item: { id: 7 } }, 'sock');
    });

    it('falls back to type then "Other" for the category and swallows errors', () => {
      budget.linkBudgetItemToReservation.mockImplementation(() => { throw new Error('boom'); });
      expect(() => svc().syncBudgetOnCreate('5', 9, 'Hotel', undefined, { total_price: 50 }, 'sock')).not.toThrow();
    });
  });

  describe('syncBudgetOnUpdate', () => {
    it('deletes the linked item when the price is explicitly cleared (total_price 0)', () => {
      dbMock._stmt.get.mockReturnValueOnce({ id: 7 });
      svc().syncBudgetOnUpdate('5', '9', 'Hotel', 'lodging', 'Hotel', 'lodging', { total_price: 0 }, 'sock');
      expect(budget.deleteBudgetItem).toHaveBeenCalledWith(7, '5');
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:deleted', { itemId: 7 }, 'sock');
    });

    it('leaves the linked item alone when no budget entry is on the payload (no wipe)', () => {
      svc().syncBudgetOnUpdate('5', '9', 'Hotel', 'lodging', 'Hotel', 'lodging', undefined, 'sock');
      expect(budget.deleteBudgetItem).not.toHaveBeenCalled();
      expect(budget.updateBudgetItem).not.toHaveBeenCalled();
      expect(budget.createBudgetItem).not.toHaveBeenCalled();
    });

    it('syncs the linked expense category when the booking type changes', () => {
      dbMock._stmt.get.mockReturnValueOnce({ id: 7, category: 'other' });
      budget.updateBudgetItem.mockReturnValue({ id: 7, category: 'flights' });
      svc().syncBudgetOnUpdate('5', '9', 'X', 'flight', 'X', 'other', undefined, 'sock');
      expect(budget.updateBudgetItem).toHaveBeenCalledWith(7, '5', { category: 'flights' });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:updated', { item: { id: 7, category: 'flights' } }, 'sock');
    });

    it('updates an existing linked item when a price is provided', () => {
      dbMock._stmt.get.mockReturnValueOnce({ id: 7 }); // existing lookup
      budget.updateBudgetItem.mockReturnValue({ id: 7 });
      svc().syncBudgetOnUpdate('5', '9', 'New', 'lodging', 'Old', 'lodging', { total_price: 80 }, 'sock');
      expect(budget.updateBudgetItem).toHaveBeenCalledWith(7, '5', { name: 'New', category: 'lodging', total_price: 80 });
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:updated', { item: { id: 7 } }, 'sock');
    });

    it('creates + links a new item when none exists, using the current title fallback', () => {
      dbMock._stmt.get.mockReturnValue(undefined); // no existing
      budget.createBudgetItem.mockReturnValue({ id: 9 });
      svc().syncBudgetOnUpdate('5', '9', '', undefined, 'Old title', 'flight', { total_price: 120 }, 'sock');
      expect(budget.createBudgetItem).toHaveBeenCalledWith('5', { name: 'Old title', category: 'flight', total_price: 120 });
      expect(dbMock._stmt.run).toHaveBeenCalled(); // UPDATE budget_items SET reservation_id
      expect(broadcast).toHaveBeenCalledWith('5', 'budget:created', { item: { id: 9, reservation_id: 9 } }, 'sock');
    });
  });

  it('notifyBookingChange resolves without throwing (fire-and-forget)', () => {
    expect(() => svc().notifyBookingChange('5', { id: 1, email: 'a@b.c' } as never, 'Hotel', 'lodging')).not.toThrow();
  });
});
