/**
 * Seam tests for the folded BudgetService: the permission/broadcast edges, the
 * controller-facing composite methods (create/update/settlement wrappers that
 * freeze the FX rate before the raw write — incl. the #1445 stored-currency
 * thread-through) and the wrapper-only syncReservationPrice SQL. The SQL-heavy
 * paths themselves are covered by budget.service.db.test.ts (real :memory: DB)
 * and budget.service.calc.test.ts (settlement math over a prepare-stub mock).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the data + side-effect dependencies the service reaches into directly.
const { dbMock } = vi.hoisted(() => {
  const stmt = { get: vi.fn(), all: vi.fn(() => []), run: vi.fn() };
  return { dbMock: { prepare: vi.fn(() => stmt), _stmt: stmt } };
});
const { canAccessTrip } = vi.hoisted(() => ({ canAccessTrip: vi.fn() }));
vi.mock('../../../src/db/database', () => ({
  db: dbMock,
  closeDb: () => {},
  reinitialize: () => {},
  canAccessTrip,
  getPlaceWithTags: () => null,
  isOwner: () => false,
}));
import { db as dbConn } from '../../../src/db/database';
import { DatabaseService } from '../../../src/nest/database/database.service';
import type { PermissionsService } from '../../../src/nest/permissions/permissions.service';

const { broadcast } = vi.hoisted(() => ({ broadcast: vi.fn() }));
vi.mock('../../../src/websocket', () => ({ broadcast }));

const checkPermission = vi.fn(() => true);
const permissionsStub = { checkPermission } as unknown as PermissionsService;

// Constructor-injected ExchangeRatesService stub (as in the pre-fold wrapper).
import type { ExchangeRatesService } from '../../../src/nest/budget/exchange-rates.service';
const getRates = vi.fn();
const exchangeRatesStub = { getRates } as unknown as ExchangeRatesService;

import { BudgetService } from '../../../src/nest/budget/budget.service';
import { RealtimeService } from '../../../src/nest/realtime/realtime.service';

function svc() {
  return new BudgetService(new DatabaseService(dbConn), permissionsStub, exchangeRatesStub, new RealtimeService());
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('BudgetService', () => {
  it('verifyTripAccess resolves through DatabaseService.canAccessTrip', () => {
    canAccessTrip.mockReturnValue({ id: 5, user_id: 2 });
    expect(svc().verifyTripAccess('5', 2)).toEqual({ id: 5, user_id: 2 });
    expect(canAccessTrip).toHaveBeenCalledWith('5', 2);
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

  it('list / perPersonSummary resolve through the folded SQL methods', () => {
    const s = svc();
    const listSpy = vi.spyOn(s, 'listBudgetItems').mockReturnValue([{ id: 1 }] as never);
    expect(s.list('5')).toEqual([{ id: 1 }]);
    expect(listSpy).toHaveBeenCalledWith('5');
    const summarySpy = vi.spyOn(s, 'getPerPersonSummary').mockReturnValue([{ userId: 1 }] as never);
    expect(s.perPersonSummary('5')).toEqual([{ userId: 1 }]);
    expect(summarySpy).toHaveBeenCalledWith('5');
  });

  describe('settlement', () => {
    it('upper-cases the explicit base and forwards the rates', async () => {
      const s = svc();
      const calcSpy = vi.spyOn(s, 'calculateSettlement').mockReturnValue({ transfers: [] } as never);
      getRates.mockResolvedValue({ USD: 1.1 });
      await s.settlement('5', 'usd', 'EUR');
      expect(getRates).toHaveBeenCalledWith('USD');
      expect(calcSpy).toHaveBeenCalledWith('5', { base: 'USD', rates: { USD: 1.1 }, tripCurrency: 'EUR' });
    });

    it('falls back to the trip currency when no base is given', async () => {
      const s = svc();
      const calcSpy = vi.spyOn(s, 'calculateSettlement').mockReturnValue({ transfers: [] } as never);
      getRates.mockResolvedValue(null);
      await s.settlement('5', undefined, 'gbp');
      expect(getRates).toHaveBeenCalledWith('GBP');
      expect(calcSpy).toHaveBeenCalledWith('5', { base: 'GBP', rates: null, tripCurrency: 'gbp' });
    });

    it('falls back to EUR when neither base nor trip currency is present', async () => {
      const s = svc();
      const calcSpy = vi.spyOn(s, 'calculateSettlement').mockReturnValue({ transfers: [] } as never);
      getRates.mockResolvedValue(null);
      await s.settlement('5', undefined, '');
      expect(getRates).toHaveBeenCalledWith('EUR');
      expect(calcSpy).toHaveBeenCalledWith('5', { base: 'EUR', rates: null, tripCurrency: '' });
    });
  });

  it('create / update freeze the FX rate before the raw write', async () => {
    const s = svc();
    const freezeSpy = vi.spyOn(s, 'freezeForeignRate').mockResolvedValue();
    const createSpy = vi.spyOn(s, 'createBudgetItem').mockReturnValue({ id: 1 } as never);
    await s.create('5', { name: 'Hotel' });
    expect(freezeSpy).toHaveBeenCalledWith('5', { name: 'Hotel' });
    expect(createSpy).toHaveBeenCalledWith('5', { name: 'Hotel' });

    const updateSpy = vi.spyOn(s, 'updateBudgetItem').mockReturnValue({ id: 9 } as never);
    await s.update('9', '5', { name: 'X' });
    // the item id is threaded through so an unchanged-currency edit keeps the frozen rate
    expect(freezeSpy).toHaveBeenCalledWith('5', { name: 'X' }, '9');
    expect(updateSpy).toHaveBeenCalledWith('9', '5', { name: 'X' });
  });

  it('remove / setPayers resolve through the folded SQL methods', () => {
    const s = svc();
    const deleteSpy = vi.spyOn(s, 'deleteBudgetItem').mockReturnValue(true);
    expect(s.remove('9', '5')).toBe(true);
    expect(deleteSpy).toHaveBeenCalledWith('9', '5');

    const payersSpy = vi.spyOn(s, 'setItemPayers').mockReturnValue({ id: 9 } as never);
    s.setPayers('9', '5', [{ user_id: 2, amount: 10 }]);
    expect(payersSpy).toHaveBeenCalledWith('9', '5', [{ user_id: 2, amount: 10 }]);
  });

  describe('settlement ledger wrappers (#1445 freeze-then-write)', () => {
    // Both wrappers refuse a party who is not on the trip before they freeze
    // anything, so the roster lookup has to answer for these to reach the write
    // at all. Users 1 and 2 are the two parties every case here settles between.
    const rosterHas = (...userIds: number[]) => dbMock._stmt.all.mockReturnValue(userIds.map(user_id => ({ user_id })));

    it('createSettlement freezes the FX rate (await) before the raw insert', async () => {
      const s = svc();
      rosterHas(1, 2);
      const freezeSpy = vi.spyOn(s, 'freezeForeignRate').mockResolvedValue();
      const insertSpy = vi.spyOn(s, 'insertSettlement').mockReturnValue({ id: 7 } as never);
      await s.createSettlement('5', { from_user_id: 1, to_user_id: 2, amount: 10 }, 3);
      expect(freezeSpy).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 10 });
      expect(insertSpy).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 10 }, 3);
    });

    it('updateSettlement threads the stored currency through the freeze', async () => {
      const s = svc();
      rosterHas(1, 2);
      const freezeSpy = vi.spyOn(s, 'freezeForeignRate').mockResolvedValue();
      // Quirk fix: the stored-currency lookup is a targeted getSettlement, not
      // a full listSettlements scan.
      const getSpy = vi.spyOn(s, 'getSettlement').mockReturnValue({ id: 7, currency: 'USD' } as never);
      const applySpy = vi.spyOn(s, 'applySettlementUpdate').mockReturnValue({ id: 7 } as never);
      await s.updateSettlement('7', '5', { from_user_id: 1, to_user_id: 2, amount: 12, currency: 'USD' });
      // the settlement's stored currency is threaded through so an unchanged-currency edit keeps the frozen rate (#1445)
      expect(getSpy).toHaveBeenCalledWith('7', '5');
      expect(freezeSpy).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 12, currency: 'USD' }, undefined, 'USD');
      expect(applySpy).toHaveBeenCalledWith('7', '5', { from_user_id: 1, to_user_id: 2, amount: 12, currency: 'USD' });
    });

    it('refuses a party who is not on the trip, before freezing or writing', async () => {
      const s = svc();
      rosterHas(1); // user 2 is not on this trip
      const freezeSpy = vi.spyOn(s, 'freezeForeignRate').mockResolvedValue();
      const insertSpy = vi.spyOn(s, 'insertSettlement').mockReturnValue({ id: 7 } as never);

      await expect(s.createSettlement('5', { from_user_id: 1, to_user_id: 2, amount: 10 }, 3)).resolves.toBeNull();

      expect(freezeSpy).not.toHaveBeenCalled();
      expect(insertSpy).not.toHaveBeenCalled();
    });
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
