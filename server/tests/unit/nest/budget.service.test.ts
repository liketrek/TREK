import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the data + side-effect dependencies the wrapper reaches into directly.
const { dbMock } = vi.hoisted(() => {
  const stmt = { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() };
  return { dbMock: { prepare: vi.fn(() => stmt), _stmt: stmt } };
});
vi.mock('../../../src/db/database', () => ({ db: dbMock, closeDb: () => {}, reinitialize: () => {} }));

const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

const { checkPermission } = vi.hoisted(() => ({ checkPermission: vi.fn(() => true) }));
vi.mock('../../../src/services/permissions', () => ({ checkPermission }));

const { getRates } = vi.hoisted(() => ({ getRates: vi.fn() }));
vi.mock('../../../src/services/exchangeRateService', () => ({ getRates }));

const { budget } = vi.hoisted(() => ({
  budget: {
    verifyTripAccess: vi.fn(),
    listBudgetItems: vi.fn(),
    getPerPersonSummary: vi.fn(),
    calculateSettlement: vi.fn(),
    freezeForeignRate: vi.fn(),
    createBudgetItem: vi.fn(),
    updateBudgetItem: vi.fn(),
    deleteBudgetItem: vi.fn(),
    updateMembers: vi.fn(),
    toggleMemberPaid: vi.fn(),
    setItemPayers: vi.fn(),
    listSettlements: vi.fn(() => []),
    createSettlement: vi.fn(),
    updateSettlement: vi.fn(),
    deleteSettlement: vi.fn(),
    reorderBudgetItems: vi.fn(),
    reorderBudgetCategories: vi.fn(),
  },
}));
vi.mock('../../../src/services/budgetService', () => budget);

import { BudgetService } from '../../../src/nest/budget/budget.service';

function svc() {
  return new BudgetService();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('BudgetService', () => {
  it('verifyTripAccess delegates to the legacy service', () => {
    budget.verifyTripAccess.mockReturnValue({ id: 5, user_id: 2 });
    expect(svc().verifyTripAccess('5', 2)).toEqual({ id: 5, user_id: 2 });
    expect(budget.verifyTripAccess).toHaveBeenCalledWith('5', 2);
  });

  it('canEdit forwards the ownership flag when the user owns the trip', () => {
    checkPermission.mockReturnValue(true);
    expect(svc().canEdit({ user_id: 1 } as never, { id: 1, role: 'user' } as never)).toBe(true);
    expect(checkPermission).toHaveBeenCalledWith('budget_edit', 'user', 1, 1, false);
  });

  it('canEdit marks the user as a guest when they do not own the trip', () => {
    checkPermission.mockReturnValue(false);
    expect(svc().canEdit({ user_id: 2 } as never, { id: 1, role: 'user' } as never)).toBe(false);
    expect(checkPermission).toHaveBeenCalledWith('budget_edit', 'user', 2, 1, true);
  });

  it('broadcast forwards to the websocket helper', () => {
    svc().broadcast('5', 'budget:created', { item: { id: 1 } }, 'sock');
    expect(broadcast).toHaveBeenCalledWith('5', 'budget:created', { item: { id: 1 } }, 'sock');
  });

  it('list / perPersonSummary delegate', () => {
    budget.listBudgetItems.mockReturnValue([{ id: 1 }]);
    expect(svc().list('5')).toEqual([{ id: 1 }]);
    budget.getPerPersonSummary.mockReturnValue([{ userId: 1 }]);
    expect(svc().perPersonSummary('5')).toEqual([{ userId: 1 }]);
  });

  describe('settlement', () => {
    it('upper-cases the explicit base and forwards the rates', async () => {
      getRates.mockResolvedValue({ USD: 1.1 });
      budget.calculateSettlement.mockReturnValue({ transfers: [] });
      await svc().settlement('5', 'usd', 'EUR');
      expect(getRates).toHaveBeenCalledWith('USD');
      expect(budget.calculateSettlement).toHaveBeenCalledWith('5', { base: 'USD', rates: { USD: 1.1 }, tripCurrency: 'EUR' });
    });

    it('falls back to the trip currency when no base is given', async () => {
      getRates.mockResolvedValue(null);
      await svc().settlement('5', undefined, 'gbp');
      expect(getRates).toHaveBeenCalledWith('GBP');
      expect(budget.calculateSettlement).toHaveBeenCalledWith('5', { base: 'GBP', rates: null, tripCurrency: 'gbp' });
    });

    it('falls back to EUR when neither base nor trip currency is present', async () => {
      getRates.mockResolvedValue(null);
      await svc().settlement('5', undefined, '');
      expect(getRates).toHaveBeenCalledWith('EUR');
      expect(budget.calculateSettlement).toHaveBeenCalledWith('5', { base: 'EUR', rates: null, tripCurrency: '' });
    });
  });

  it('create / update / remove / members / paid / payers delegate', async () => {
    await svc().create('5', { name: 'Hotel' } as never);
    expect(budget.createBudgetItem).toHaveBeenCalledWith('5', { name: 'Hotel' });
    await svc().update('9', '5', { name: 'X' });
    expect(budget.updateBudgetItem).toHaveBeenCalledWith('9', '5', { name: 'X' });
    svc().remove('9', '5');
    expect(budget.deleteBudgetItem).toHaveBeenCalledWith('9', '5');
    svc().updateMembers('9', '5', [2, 3]);
    expect(budget.updateMembers).toHaveBeenCalledWith('9', '5', [2, 3]);
    svc().toggleMemberPaid('9', '5', '2', true);
    expect(budget.toggleMemberPaid).toHaveBeenCalledWith('9', '5', '2', true);
    svc().setPayers('9', '5', [{ user_id: 2, amount: 10 }]);
    expect(budget.setItemPayers).toHaveBeenCalledWith('9', '5', [{ user_id: 2, amount: 10 }]);
  });

  it('settlement ledger + reorder delegate', async () => {
    svc().listSettlements('5');
    expect(budget.listSettlements).toHaveBeenCalledWith('5');
    // createSettlement freezes the FX rate (await) before delegating.
    await svc().createSettlement('5', { from_user_id: 1, to_user_id: 2, amount: 10 }, 3);
    expect(budget.freezeForeignRate).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 10 });
    expect(budget.createSettlement).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 10 }, 3);
    budget.listSettlements.mockReturnValue([{ id: 7, currency: 'USD' }] as never);
    await svc().updateSettlement('7', '5', { from_user_id: 1, to_user_id: 2, amount: 12, currency: 'USD' });
    // the settlement's stored currency is threaded through so an unchanged-currency edit keeps the frozen rate (#1445)
    expect(budget.freezeForeignRate).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 12, currency: 'USD' }, undefined, 'USD');
    expect(budget.updateSettlement).toHaveBeenCalledWith('7', '5', { from_user_id: 1, to_user_id: 2, amount: 12, currency: 'USD' });
    svc().deleteSettlement('7', '5');
    expect(budget.deleteSettlement).toHaveBeenCalledWith('7', '5');
    svc().reorderItems('5', [3, 1]);
    expect(budget.reorderBudgetItems).toHaveBeenCalledWith('5', [3, 1]);
    svc().reorderCategories('5', ['food', 'fun']);
    expect(budget.reorderBudgetCategories).toHaveBeenCalledWith('5', ['food', 'fun']);
  });

  describe('syncReservationPrice', () => {
    it('returns early when the reservation is not found', () => {
      dbMock._stmt.get.mockReturnValueOnce(undefined);
      svc().syncReservationPrice('5', 42, 250, 'sock');
      expect(dbMock._stmt.run).not.toHaveBeenCalled();
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('merges into existing metadata and broadcasts reservation:updated', () => {
      dbMock._stmt.get
        .mockReturnValueOnce({ id: 42, metadata: '{"vendor":"ACME"}' }) // lookup
        .mockReturnValueOnce({ id: 42, metadata: '{"vendor":"ACME","price":"250"}' }); // reload
      svc().syncReservationPrice('5', 42, 250, 'sock');
      const writtenMeta = JSON.parse(dbMock._stmt.run.mock.calls[0][0] as string);
      expect(writtenMeta).toEqual({ vendor: 'ACME', price: '250' });
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:updated', { reservation: { id: 42, metadata: '{"vendor":"ACME","price":"250"}' } }, 'sock');
    });

    it('starts from an empty object when the reservation has no metadata', () => {
      dbMock._stmt.get.mockReturnValueOnce({ id: 42, metadata: null }).mockReturnValueOnce({ id: 42 });
      svc().syncReservationPrice('5', 42, 99, undefined);
      const writtenMeta = JSON.parse(dbMock._stmt.run.mock.calls[0][0] as string);
      expect(writtenMeta).toEqual({ price: '99' });
    });

    it('swallows errors so a sync failure never breaks the budget update', () => {
      dbMock.prepare.mockImplementationOnce(() => { throw new Error('db gone'); });
      expect(() => svc().syncReservationPrice('5', 42, 250, 'sock')).not.toThrow();
      expect(broadcast).not.toHaveBeenCalled();
    });
  });
});
