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
import { UnitOfWork } from '../../../src/nest/database/unit-of-work';
import type { BudgetItemsRepository } from '../../../src/db/repositories/BudgetItems.repository';
import type { BudgetItemMembersRepository } from '../../../src/db/repositories/BudgetItemMembers.repository';
import type { BudgetItemPayersRepository } from '../../../src/db/repositories/BudgetItemPayers.repository';
import type { BudgetSettlementsRepository } from '../../../src/db/repositories/BudgetSettlements.repository';
import type { BudgetCategoryOrderRepository } from '../../../src/db/repositories/BudgetCategoryOrder.repository';
import type { ReservationsRepository } from '../../../src/db/repositories/Reservations.repository';
import type { PlacesRepository } from '../../../src/db/repositories/Places.repository';
import type { TripsRepository } from '../../../src/db/repositories/Trips.repository';
import type { TripMembersRepository } from '../../../src/db/repositories/TripMembers.repository';

/**
 * There is no database behind this suite — every statement is served by the
 * prepare stub above — so the UnitOfWork is a pass-through: it runs the callback
 * as MikroORM would, with no transaction to open on.
 */
const uowStub = { transactional: <T>(fn: () => Promise<T>) => fn() } as unknown as UnitOfWork;

/**
 * Plan 3e Task 2 (budget): every SQL-touching method this suite exercises is
 * either spied-and-replaced entirely (list, getPerPersonSummary, the create
 * and update and delete wrappers, setItemPayers, insertSettlement,
 * getSettlement, applySettlementUpdate — the composite-wrapper tests only
 * assert the freeze-then-write ORDER, never the SQL itself) or, for
 * `syncReservationPrice`, still needs the `dbMock`/`prepare` stub above to
 * answer — so this repo proxies to it instead of a real
 * `ReservationsRepository`, keeping that describe block's assertions
 * (incl. "prepare throws" leading to a swallowed error) unchanged.
 */
const reservationsRepoStub = {
  getIdAndMetadata: async (id: number, tripId: unknown) => dbMock.prepare().get(id, tripId),
  setMetadata: async (id: number, metadata: string) => { dbMock.prepare().run(metadata, id); },
  getFull: async (id: number) => dbMock.prepare().get(id),
} as unknown as ReservationsRepository;

function svc(
  tripMembersRepo: TripMembersRepository = {} as unknown as TripMembersRepository,
  tripsRepo: TripsRepository = {} as unknown as TripsRepository,
  budgetItemsRepo: BudgetItemsRepository = {} as unknown as BudgetItemsRepository,
) {
  return new BudgetService(
    permissionsStub, exchangeRatesStub, new RealtimeService(), uowStub,
    budgetItemsRepo,
    {} as unknown as BudgetItemMembersRepository,
    {} as unknown as BudgetItemPayersRepository,
    {} as unknown as BudgetSettlementsRepository,
    {} as unknown as BudgetCategoryOrderRepository,
    reservationsRepoStub,
    {} as unknown as PlacesRepository,
    tripsRepo,
    tripMembersRepo,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('BudgetService', () => {
  it('verifyTripAccess resolves through TripsRepository.findAccessible', async () => {
    // Plan 4 Task 2: `verifyTripAccess` no longer rides `DatabaseService
    // .canAccessTrip` — it reads through the injected `TripsRepository`
    // directly, consistent with this suite's "no database behind it"
    // design (everything else here is a `prepare` stub).
    const findAccessible = vi.fn(async () => ({ id: 5, user_id: 2 }));
    const fakeTripsRepo = { findAccessible } as unknown as TripsRepository;
    expect(await svc(undefined, fakeTripsRepo).verifyTripAccess('5', 2)).toEqual({ id: 5, user_id: 2 });
    expect(findAccessible).toHaveBeenCalledWith('5', 2);
  });

  it('canEdit forwards the ownership flag when the user owns the trip', async () => {
    checkPermission.mockReturnValue(true);
    expect(await svc().canEdit({ user_id: 1 } as never, { id: 1, role: 'user' } as never)).toBe(true);
    expect(checkPermission).toHaveBeenCalledWith('budget_edit', 'user', 1, 1, false);
  });

  it('canEdit marks the user as a guest when they do not own the trip', async () => {
    checkPermission.mockReturnValue(false);
    expect(await svc().canEdit({ user_id: 2 } as never, { id: 1, role: 'user' } as never)).toBe(false);
    expect(checkPermission).toHaveBeenCalledWith('budget_edit', 'user', 2, 1, true);
  });

  it('broadcast forwards to the websocket helper', () => {
    svc().broadcast('5', 'budget:created', { item: { id: 1 } }, 'sock');
    expect(broadcast).toHaveBeenCalledWith('5', 'budget:created', { item: { id: 1 } }, 'sock');
  });

  it('list / perPersonSummary resolve through the folded SQL methods', async () => {
    // No row is waiting on today's rates, so none are fetched for it.
    const getCurrency = vi.fn().mockResolvedValue('EUR');
    const hasUnfrozenForeign = vi.fn().mockResolvedValue(false);
    const s = svc(
      undefined,
      { getCurrency } as unknown as TripsRepository,
      { hasUnfrozenForeign } as unknown as BudgetItemsRepository,
    );
    const listSpy = vi.spyOn(s, 'listBudgetItems').mockResolvedValue([{ id: 1 }] as never);
    expect(await s.list('5')).toEqual([{ id: 1 }]);
    expect(listSpy).toHaveBeenCalledWith('5');
    const summarySpy = vi.spyOn(s, 'getPerPersonSummary').mockResolvedValue([{ userId: 1 }] as never);
    expect(await s.perPersonSummary('5')).toEqual([{ userId: 1 }]);
    expect(summarySpy).toHaveBeenCalledWith('5', null);
    expect(hasUnfrozenForeign).toHaveBeenCalledWith('5', 'EUR');
    expect(getRates).not.toHaveBeenCalled();
  });

  describe('settlement', () => {
    it('upper-cases the explicit base and converts with the trip currency\'s own quote (#2525)', async () => {
      const s = svc();
      const calcSpy = vi.spyOn(s, 'calculateSettlement').mockResolvedValue({ transfers: [] } as never);
      getRates.mockResolvedValue({ EUR: 1, USD: 1.1 });
      await s.settlement('5', 'usd', 'eur');
      // The quote every entry rate was frozen from; the dollar's is not its exact inverse.
      expect(getRates.mock.calls).toEqual([['EUR']]);
      expect(calcSpy).toHaveBeenCalledWith('5', { base: 'USD', rates: { EUR: 1, USD: 1.1 }, tripCurrency: 'EUR' });
    });

    it('stands in the display currency\'s quote when the trip\'s cannot be fetched', async () => {
      const s = svc();
      const calcSpy = vi.spyOn(s, 'calculateSettlement').mockResolvedValue({ transfers: [] } as never);
      getRates.mockImplementation(async (b: string) => (b === 'USD' ? { USD: 1, EUR: 0.9 } : null));
      await s.settlement('5', 'USD', 'EUR');
      expect(getRates.mock.calls).toEqual([['EUR'], ['USD']]);
      expect(calcSpy).toHaveBeenCalledWith('5', { base: 'USD', rates: { USD: 1, EUR: 0.9 }, tripCurrency: 'EUR' });
    });

    it('falls back to the trip currency when no base is given', async () => {
      const s = svc();
      const calcSpy = vi.spyOn(s, 'calculateSettlement').mockResolvedValue({ transfers: [] } as never);
      getRates.mockResolvedValue(null);
      await s.settlement('5', undefined, 'gbp');
      expect(getRates.mock.calls).toEqual([['GBP']]);
      expect(calcSpy).toHaveBeenCalledWith('5', { base: 'GBP', rates: null, tripCurrency: 'GBP' });
    });

    it('falls back to EUR when neither base nor trip currency is present', async () => {
      const s = svc();
      const calcSpy = vi.spyOn(s, 'calculateSettlement').mockResolvedValue({ transfers: [] } as never);
      getRates.mockResolvedValue(null);
      await s.settlement('5', undefined, '');
      expect(getRates).toHaveBeenCalledWith('EUR');
      expect(calcSpy).toHaveBeenCalledWith('5', { base: 'EUR', rates: null, tripCurrency: 'EUR' });
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
    // Plan 4 Task 8b (U6) — the controller/RPC now hand this a gate-parsed number.
    await s.update(9, '5', { name: 'X' });
    // the item id is threaded through so an unchanged-currency edit keeps the frozen rate
    expect(freezeSpy).toHaveBeenCalledWith('5', { name: 'X' }, 9);
    expect(updateSpy).toHaveBeenCalledWith(9, '5', { name: 'X' });
  });

  it('remove / setPayers resolve through the folded SQL methods', async () => {
    const s = svc();
    const deleteSpy = vi.spyOn(s, 'deleteBudgetItem').mockResolvedValue(true);
    expect(await s.remove(9, '5')).toBe(true);
    expect(deleteSpy).toHaveBeenCalledWith(9, '5');

    const payersSpy = vi.spyOn(s, 'setItemPayers').mockResolvedValue({ id: 9 } as never);
    await s.setPayers(9, '5', [{ user_id: 2, amount: 10 }]);
    expect(payersSpy).toHaveBeenCalledWith(9, '5', [{ user_id: 2, amount: 10 }]);
  });

  describe('settlement ledger wrappers (#1445 freeze-then-write)', () => {
    // Both wrappers refuse a party who is not on the trip before they freeze
    // anything, so the roster lookup has to answer for these to reach the write
    // at all. Users 1 and 2 are the two parties every case here settles between.
    //
    // Plan 4 Task 3: `DatabaseService.rosterUserIds` inlined onto
    // `TripMembersRepository.rosterUserIds` directly — a stub repository
    // with `rosterUserIds` mocked directly, same fix as `verifyTripAccess`'s
    // test above.
    const rosterHas = (...userIds: number[]) => ({
      rosterUserIds: vi.fn().mockResolvedValue(new Set(userIds)),
    } as unknown as TripMembersRepository);

    it('createSettlement freezes the FX rate (await) before the raw insert', async () => {
      const s = svc(rosterHas(1, 2));
      const freezeSpy = vi.spyOn(s, 'freezeForeignRate').mockResolvedValue();
      const insertSpy = vi.spyOn(s, 'insertSettlement').mockReturnValue({ id: 7 } as never);
      await s.createSettlement('5', { from_user_id: 1, to_user_id: 2, amount: 10 }, 3);
      expect(freezeSpy).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 10 });
      expect(insertSpy).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 10 }, 3);
    });

    it('updateSettlement threads the stored currency through the freeze', async () => {
      const s = svc(rosterHas(1, 2));
      const freezeSpy = vi.spyOn(s, 'freezeForeignRate').mockResolvedValue();
      // Quirk fix: the stored-currency lookup is a targeted getSettlement, not
      // a full listSettlements scan.
      const getSpy = vi.spyOn(s, 'getSettlement').mockReturnValue({ id: 7, currency: 'USD' } as never);
      const applySpy = vi.spyOn(s, 'applySettlementUpdate').mockReturnValue({ id: 7 } as never);
      // Plan 4 Task 8b (U6) — the controller/MCP tool now hand this a gate-parsed number.
      await s.updateSettlement(7, '5', { from_user_id: 1, to_user_id: 2, amount: 12, currency: 'USD' });
      // the settlement's stored currency is threaded through so an unchanged-currency edit keeps the frozen rate (#1445)
      expect(getSpy).toHaveBeenCalledWith(7, '5');
      expect(freezeSpy).toHaveBeenCalledWith('5', { from_user_id: 1, to_user_id: 2, amount: 12, currency: 'USD' }, undefined, 'USD');
      expect(applySpy).toHaveBeenCalledWith(7, '5', { from_user_id: 1, to_user_id: 2, amount: 12, currency: 'USD' });
    });

    it('refuses a party who is not on the trip, before freezing or writing', async () => {
      const s = svc(rosterHas(1)); // user 2 is not on this trip
      const freezeSpy = vi.spyOn(s, 'freezeForeignRate').mockResolvedValue();
      const insertSpy = vi.spyOn(s, 'insertSettlement').mockReturnValue({ id: 7 } as never);

      await expect(s.createSettlement('5', { from_user_id: 1, to_user_id: 2, amount: 10 }, 3)).resolves.toBeNull();

      expect(freezeSpy).not.toHaveBeenCalled();
      expect(insertSpy).not.toHaveBeenCalled();
    });
  });

  describe('syncReservationPrice', () => {
    it('returns early when the reservation is not found', async () => {
      dbMock._stmt.get.mockReturnValueOnce(undefined);
      await svc().syncReservationPrice('5', 42, 250, 'sock');
      expect(dbMock._stmt.run).not.toHaveBeenCalled();
      expect(broadcast).not.toHaveBeenCalled();
    });

    it('merges into existing metadata and broadcasts reservation:updated', async () => {
      dbMock._stmt.get
        .mockReturnValueOnce({ id: 42, metadata: '{"vendor":"ACME"}' }) // lookup
        .mockReturnValueOnce({ id: 42, metadata: '{"vendor":"ACME","price":"250"}' }); // reload
      await svc().syncReservationPrice('5', 42, 250, 'sock');
      const writtenMeta = JSON.parse(dbMock._stmt.run.mock.calls[0][0] as string);
      expect(writtenMeta).toEqual({ vendor: 'ACME', price: '250' });
      expect(broadcast).toHaveBeenCalledWith('5', 'reservation:updated', { reservation: { id: 42, metadata: '{"vendor":"ACME","price":"250"}' } }, 'sock');
    });

    it('starts from an empty object when the reservation has no metadata', async () => {
      dbMock._stmt.get.mockReturnValueOnce({ id: 42, metadata: null }).mockReturnValueOnce({ id: 42 });
      await svc().syncReservationPrice('5', 42, 99, undefined);
      const writtenMeta = JSON.parse(dbMock._stmt.run.mock.calls[0][0] as string);
      expect(writtenMeta).toEqual({ price: '99' });
    });

    it('swallows errors so a sync failure never breaks the budget update', async () => {
      dbMock.prepare.mockImplementationOnce(() => { throw new Error('db gone'); });
      await expect(svc().syncReservationPrice('5', 42, 250, 'sock')).resolves.toBeUndefined();
      expect(broadcast).not.toHaveBeenCalled();
    });

    // #2084: the card names the currency beside the mirrored figure.
    it('writes the currency beside the price, upper-cased', async () => {
      dbMock._stmt.get.mockReturnValueOnce({ id: 42, metadata: '{"seat":"1A"}' }).mockReturnValueOnce({ id: 42 });
      await svc().syncReservationPrice('5', 42, 99.5, 'sock', 'usd');
      expect(JSON.parse(dbMock._stmt.run.mock.calls[0][0] as string)).toEqual({ seat: '1A', price: '99.5', priceCurrency: 'USD' });
    });

    it('drops a stored currency when the expense is in the trip currency (null)', async () => {
      dbMock._stmt.get.mockReturnValueOnce({ id: 42, metadata: '{"price":"10","priceCurrency":"CNY"}' }).mockReturnValueOnce({ id: 42 });
      await svc().syncReservationPrice('5', 42, 12, undefined, null);
      expect(JSON.parse(dbMock._stmt.run.mock.calls[0][0] as string)).toEqual({ price: '12' });
    });

    it('leaves a stored currency alone when none is passed at all', async () => {
      dbMock._stmt.get.mockReturnValueOnce({ id: 42, metadata: '{"price":"10","priceCurrency":"CNY"}' }).mockReturnValueOnce({ id: 42 });
      await svc().syncReservationPrice('5', 42, 12, undefined);
      expect(JSON.parse(dbMock._stmt.run.mock.calls[0][0] as string)).toEqual({ price: '12', priceCurrency: 'CNY' });
    });
  });

  describe('resyncLinkedPrices', () => {
    // Which bookings an update touches is pure bookkeeping over the before/after
    // link and the body; the SQL behind resyncReservationPrice is pinned in
    // budget.service.db.test.ts.
    async function resynced(
      previous: number | null | undefined,
      updated: { reservation_id?: number | null },
      data: { total_price?: number; reservation_id?: number | null },
      socketId?: string,
    ) {
      const s = svc();
      const spy = vi.spyOn(s, 'resyncReservationPrice').mockResolvedValue(undefined);
      await s.resyncLinkedPrices('5', previous, updated, data, socketId);
      return spy.mock.calls;
    }

    it('resyncs the linked booking when the total changes', async () => {
      expect(await resynced(undefined, { reservation_id: 42 }, { total_price: 250 }, 'sock')).toEqual([['5', 42, 'sock']]);
    });

    it('resyncs the linked booking on an edit that names neither the total nor the link', async () => {
      // A new currency, or payers that derive a new total, move the booking's
      // price too, and neither shows up in the two fields this looks at.
      expect(await resynced(undefined, { reservation_id: 42 }, {}, 'sock')).toEqual([['5', 42, 'sock']]);
    });

    it('leaves every booking alone when the expense is linked to none', async () => {
      expect(await resynced(undefined, { reservation_id: null }, { total_price: 250 })).toEqual([]);
      expect(await resynced(undefined, {}, {})).toEqual([]);
    });

    it('resyncs both the booking left and the booking joined on a re-link', async () => {
      expect(await resynced(42, { reservation_id: 43 }, { reservation_id: 43 }, 'sock')).toEqual([['5', 42, 'sock'], ['5', 43, 'sock']]);
    });

    it('resyncs only the booking left on an unlink', async () => {
      expect(await resynced(42, { reservation_id: null }, { reservation_id: null })).toEqual([['5', 42, undefined]]);
    });

    it('resyncs only the booking joined when the expense had none before', async () => {
      expect(await resynced(null, { reservation_id: 43 }, { reservation_id: 43, total_price: 10 })).toEqual([['5', 43, undefined]]);
    });

    it('resyncs a booking once when the expense is re-linked to the one it already had', async () => {
      expect(await resynced(42, { reservation_id: 42 }, { reservation_id: 42, total_price: 10 })).toEqual([['5', 42, undefined]]);
    });

    it('ignores the stored link when the body does not name one', async () => {
      // A total change on an expense that stays put must not touch some other booking
      // the caller happened to pass as the previous one.
      expect(await resynced(41, { reservation_id: 42 }, { total_price: 10 })).toEqual([['5', 42, undefined]]);
    });
  });
});
