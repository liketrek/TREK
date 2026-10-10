import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { buildBudgetItem, buildTrip } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import { budgetApi } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { BudgetItem, Trip } from '../../types';
import { downloadBlob } from '../../utils/fileDownload';
import type { CostsSettlementResponse } from './costsModel';
import { useCostsLedger } from './useCostsLedger';
import { useFreezeMissingRates } from './useFreezeMissingRates';

// FE-BUDGET-LEDGER-001 to FE-BUDGET-LEDGER-012

const fx = vi.hoisted(() => ({
  // One stable converter, the way useExchangeRates hands out a memoised one: USD is half a euro.
  rates: {
    convert: (amount: number, currency: string | null | undefined) =>
      (currency || 'EUR').toUpperCase() === 'USD' ? amount * 0.5 : amount,
    displayPerTrip: 1.1,
  },
}));

vi.mock('../../hooks/useExchangeRates', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../hooks/useExchangeRates')>()),
  useExchangeRates: vi.fn(() => fx.rates),
}));
vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  budgetApi: {
    settlement: vi.fn(),
    createSettlement: vi.fn(),
    deleteSettlement: vi.fn(),
  },
}));
vi.mock('./useFreezeMissingRates', () => ({ useFreezeMissingRates: vi.fn() }));
vi.mock('../../utils/fileDownload', () => ({ downloadBlob: vi.fn() }));

type Member = NonNullable<BudgetItem['members']>[number];
type Payer = NonNullable<BudgetItem['payers']>[number];
const member = (user_id: number): Member => ({ user_id, paid: 0, username: `u${user_id}` });
const payer = (user_id: number, amount: number): Payer => ({ user_id, amount, username: `u${user_id}` });

const flow = (from: number, to: number, amount: number) => ({
  from: { user_id: from, username: `u${from}` },
  to: { user_id: to, username: `u${to}` },
  amount,
});

const SETTLEMENT: CostsSettlementResponse = {
  balances: [],
  flows: [flow(1, 2, 15), flow(3, 1, 5)],
  settlements: [{ id: 30, from_user_id: 1, to_user_id: 2, amount: 4, created_at: '2026-07-02T09:00:00Z' }],
  finalBudgets: [],
};

// I am in the split of an expense nobody has paid yet.
const unfinished = () =>
  buildBudgetItem({ id: 4, name: 'Hotel', total_price: 80, members: [member(1), member(2)], payers: [] });
const paidByBob = () =>
  buildBudgetItem({
    id: 6,
    name: 'Taxi',
    total_price: 40,
    currency: 'usd',
    members: [member(1), member(2)],
    payers: [payer(2, 40)],
    expense_date: '2026-07-01',
  });

let loadBudgetItems: Mock<(tripId: number | string) => Promise<void>>;
let deleteBudgetItem: Mock<(tripId: number | string, id: number) => Promise<void>>;
let toastError: Mock<(message: string) => void>;

interface Options {
  trip?: Trip;
  items?: BudgetItem[];
  settlementOnTripChange?: boolean;
  skipUnfinishedShares?: boolean;
  csvCurrencyAsStored?: boolean;
}

function setup(options: Options = {}) {
  const props = { tripId: 7, items: options.items ?? [unfinished(), paidByBob()] };
  return renderHook(
    ({ tripId, items }: { tripId: number; items: BudgetItem[] }) =>
      useCostsLedger({
        tripId,
        trip: options.trip ?? buildTrip({ id: 7, currency: 'EUR', title: 'Rome' }),
        budgetItems: items,
        actions: { loadBudgetItems, deleteBudgetItem },
        canEdit: true,
        t: (key: string) => key,
        toast: { error: toastError },
        settlementOnTripChange: options.settlementOnTripChange,
        skipUnfinishedShares: options.skipUnfinishedShares,
        csvCurrencyAsStored: options.csvCurrencyAsStored,
      }),
    { initialProps: props }
  );
}

const settlementMock = () => vi.mocked(budgetApi.settlement);
const createMock = () => vi.mocked(budgetApi.createSettlement);
const deleteMock = () => vi.mocked(budgetApi.deleteSettlement);

beforeEach(() => {
  resetAllStores();
  vi.clearAllMocks();
  seedStore(useAuthStore, { user: { id: 1 } });
  useSettingsStore.setState((s) => ({ settings: { ...s.settings, default_currency: '' } }));
  loadBudgetItems = vi.fn<(tripId: number | string) => Promise<void>>(async () => undefined);
  deleteBudgetItem = vi.fn<(tripId: number | string, id: number) => Promise<void>>(async () => undefined);
  toastError = vi.fn<(message: string) => void>();
  settlementMock().mockResolvedValue(SETTLEMENT);
  createMock().mockResolvedValue({});
  deleteMock().mockResolvedValue({});
});

describe('useCostsLedger: loading', () => {
  it('FE-BUDGET-LEDGER-001: loads the items and reads the settlement in the display currency', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.settlement).toEqual(SETTLEMENT));
    expect(loadBudgetItems).toHaveBeenCalledTimes(1);
    expect(loadBudgetItems).toHaveBeenCalledWith(7);
    expect(settlementMock()).toHaveBeenCalledTimes(1);
    // Display and trip currency agree, so no browser rate goes along.
    expect(settlementMock()).toHaveBeenCalledWith(7, 'EUR', null);
    expect(result.current.base).toBe('EUR');
    expect(result.current.tripCurrency).toBe('EUR');
    expect(result.current.me).toBe(1);
  });

  it('FE-BUDGET-LEDGER-002: a display currency other than the trip one sends the browser rate along', async () => {
    useSettingsStore.setState((s) => ({ settings: { ...s.settings, default_currency: 'usd' } }));
    const { result } = setup();
    await waitFor(() => expect(result.current.settlement).not.toBeNull());
    expect(result.current.base).toBe('USD');
    expect(settlementMock()).toHaveBeenCalledWith(7, 'USD', 1.1);
  });

  it('FE-BUDGET-LEDGER-003: the desktop also reads the settlement on a trip change, the phone only on the expense count', async () => {
    const desktop = setup({ settlementOnTripChange: true });
    await waitFor(() => expect(settlementMock()).toHaveBeenCalledTimes(2));
    desktop.unmount();

    settlementMock().mockClear();
    const phone = setup();
    await waitFor(() => expect(settlementMock()).toHaveBeenCalledTimes(1));
    phone.rerender({ tripId: 8, items: [unfinished(), paidByBob()] });
    // A new trip id gets a new settlement read through loadSettlement's own change.
    await waitFor(() => expect(loadBudgetItems).toHaveBeenLastCalledWith(8));
    expect(settlementMock()).toHaveBeenLastCalledWith(8, 'EUR', null);
  });

  it('FE-BUDGET-LEDGER-004: a new expense count reads the settlement again, a re-render with the same count does not', async () => {
    const { rerender } = setup();
    await waitFor(() => expect(settlementMock()).toHaveBeenCalledTimes(1));
    rerender({ tripId: 7, items: [unfinished(), paidByBob()] });
    expect(settlementMock()).toHaveBeenCalledTimes(1);
    rerender({ tripId: 7, items: [unfinished()] });
    await waitFor(() => expect(settlementMock()).toHaveBeenCalledTimes(2));
    expect(loadBudgetItems).toHaveBeenCalledTimes(1);
  });

  it('FE-BUDGET-LEDGER-005: a failed read flags the settlement as unknown until a read succeeds', async () => {
    settlementMock().mockRejectedValueOnce(new Error('offline'));
    const { result } = setup();
    await waitFor(() => expect(result.current.settlementError).toBe(true));
    expect(result.current.settlement).toBeNull();
    act(() => result.current.loadSettlement());
    await waitFor(() => expect(result.current.settlementError).toBe(false));
    expect(result.current.settlement).toEqual(SETTLEMENT);
  });

  it('FE-BUDGET-LEDGER-006: hands the unconverted rows to the rate freeze, which reads the settlement again once healed', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.settlement).not.toBeNull());
    const last = vi.mocked(useFreezeMissingRates).mock.lastCall?.[0];
    expect(last).toMatchObject({ tripId: 7, tripCurrency: 'EUR', canEdit: true, unconverted: undefined });
    act(() => last?.onHealed());
    await waitFor(() => expect(settlementMock()).toHaveBeenCalledTimes(2));
  });
});

describe('useCostsLedger: totals and filters', () => {
  it('FE-BUDGET-LEDGER-007: the desktop leaves an expense nobody paid out of my share, the phone counts it (#2225)', async () => {
    const phone = setup();
    await waitFor(() => expect(phone.result.current.settlement).not.toBeNull());
    expect(phone.result.current.totals).toEqual({
      totalSpend: 100,
      myPaid: 0,
      myShare: 50,
      owe: 15,
      owed: 5,
      outstanding: 80,
      outstandingCount: 1,
    });
    phone.unmount();

    const desktop = setup({ skipUnfinishedShares: true });
    await waitFor(() => expect(desktop.result.current.settlement).not.toBeNull());
    expect(desktop.result.current.totals.myShare).toBe(10);
    expect(desktop.result.current.flows).toEqual(SETTLEMENT.flows);
  });

  it('FE-BUDGET-LEDGER-008: the filters narrow the expenses and the payments together', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.settlement).not.toBeNull());
    expect(result.current.filtered.map((e) => e.id)).toEqual([4, 6]);
    expect(result.current.filteredSettlements.map((s) => s.id)).toEqual([30]);
    expect(result.current.catBreakdown.map((r) => r.amount)).toEqual([100]);

    act(() => result.current.setSearch('taxi'));
    expect(result.current.filtered.map((e) => e.id)).toEqual([6]);
    expect(result.current.filteredSettlements).toEqual([]);

    act(() => {
      result.current.setSearch('');
      result.current.setDayFilter('2026-07-02');
    });
    expect(result.current.filtered).toEqual([]);
    expect(result.current.filteredSettlements.map((s) => s.id)).toEqual([30]);

    act(() => {
      result.current.setDayFilter('');
      result.current.setSegment('owed');
      result.current.setCatFilter('');
    });
    expect(result.current.segment).toBe('owed');
    expect(result.current.filteredSettlements).toEqual([]);
  });
});

describe('useCostsLedger: writes', () => {
  it('FE-BUDGET-LEDGER-009: deleting an expense reads the settlement again, a failure toasts', async () => {
    const { result } = setup();
    await waitFor(() => expect(settlementMock()).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.deleteExpense(4);
    });
    expect(deleteBudgetItem).toHaveBeenCalledWith(7, 4);
    expect(settlementMock()).toHaveBeenCalledTimes(2);

    deleteBudgetItem.mockRejectedValueOnce(new Error('nope'));
    await act(async () => {
      await result.current.deleteExpense(4);
    });
    expect(toastError).toHaveBeenCalledWith('common.unknownError');
    expect(settlementMock()).toHaveBeenCalledTimes(2);
  });

  it('FE-BUDGET-LEDGER-010: undoing a payment deletes it and reads the settlement again, a failure toasts', async () => {
    const { result } = setup();
    await waitFor(() => expect(settlementMock()).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.undoSettlement(30);
    });
    expect(deleteMock()).toHaveBeenCalledWith(7, 30);
    expect(settlementMock()).toHaveBeenCalledTimes(2);

    deleteMock().mockRejectedValueOnce(new Error('nope'));
    await act(async () => {
      await result.current.undoSettlement(30);
    });
    expect(toastError).toHaveBeenCalledWith('common.unknownError');
  });

  it('FE-BUDGET-LEDGER-011: settling one flow or all of them records transfers in the display currency', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.settlement).not.toBeNull());
    await act(async () => {
      await result.current.settleFlow(1, 2, 15);
    });
    expect(createMock()).toHaveBeenCalledWith(7, { from_user_id: 1, to_user_id: 2, amount: 15, currency: 'EUR' });
    expect(settlementMock()).toHaveBeenCalledTimes(2);

    createMock().mockClear();
    // The second transfer fails: the first is real, so the settlement is still read again.
    createMock().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('nope'));
    await act(async () => {
      await result.current.settleAll();
    });
    expect(createMock()).toHaveBeenCalledTimes(2);
    expect(createMock()).toHaveBeenNthCalledWith(2, 7, { from_user_id: 3, to_user_id: 1, amount: 5, currency: 'EUR' });
    expect(toastError).toHaveBeenCalledWith('common.unknownError');
    expect(settlementMock()).toHaveBeenCalledTimes(3);
  });

  it('FE-BUDGET-LEDGER-012: the CSV writes the currency normalised, or as stored when the desktop asks', async () => {
    const readCsv = async (csvCurrencyAsStored: boolean) => {
      vi.mocked(downloadBlob).mockClear();
      const view = setup({ csvCurrencyAsStored, items: [paidByBob()] });
      act(() => view.result.current.exportCsv());
      const [blob, filename] = vi.mocked(downloadBlob).mock.calls[0];
      view.unmount();
      expect(filename).toBe('costs-Rome.csv');
      const text = await (blob as Blob).text();
      return text.split('\r\n')[1].split(';')[4];
    };
    expect(await readCsv(false)).toBe('USD');
    expect(await readCsv(true)).toBe('usd');
  });
});
