import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { budgetApi } from '../../api/client';
import { clearExchangeRateCache } from '../../hooks/useExchangeRates';
import { localToday } from '../Planner/today';
import type { CostsSettlement } from './costsModel';
import { useSettlementForm } from './useSettlementForm';

// FE-BUDGET-SETTLEFORM-001 to FE-BUDGET-SETTLEFORM-009

vi.mock('../../api/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api/client')>()),
  budgetApi: { createSettlement: vi.fn(), updateSettlement: vi.fn() },
}));

const PEOPLE = [{ id: 1 }, { id: 2 }, { id: 3 }];
const RECORDED: CostsSettlement = {
  id: 30,
  from_user_id: 2,
  to_user_id: 3,
  amount: 4.9,
  currency: 'usd',
  created_at: '2026-07-01T10:00:00Z',
  settled_at: '2026-06-30',
  note: 'cash',
};

let onSaved: Mock<() => void>;
let toastError: Mock<(message: string) => void>;

interface Props {
  editing: CostsSettlement | null;
  open?: boolean;
}

function setup(initial: Props, oneSaveAtATime?: boolean) {
  return renderHook(
    ({ editing, open }: Props) =>
      useSettlementForm({
        tripId: 7,
        tripCurrency: 'EUR',
        base: 'EUR',
        people: PEOPLE,
        me: 1,
        editing,
        open,
        t: (key: string) => key,
        toast: { error: toastError },
        onSaved,
        oneSaveAtATime,
      }),
    { initialProps: initial }
  );
}

const createMock = () => vi.mocked(budgetApi.createSettlement);
const updateMock = () => vi.mocked(budgetApi.updateSettlement);

beforeEach(() => {
  vi.clearAllMocks();
  clearExchangeRateCache();
  onSaved = vi.fn<() => void>();
  toastError = vi.fn<(message: string) => void>();
  createMock().mockResolvedValue({});
  updateMock().mockResolvedValue({});
});

describe('useSettlementForm: where the desktop dialog starts', () => {
  it('FE-BUDGET-SETTLEFORM-001: a new payment runs from me to the first other traveller, today, in the display currency', () => {
    const { result } = setup({ editing: null });
    expect(result.current.fromId).toBe(1);
    expect(result.current.toId).toBe(2);
    expect(result.current.amount).toBe('');
    expect(result.current.currency).toBe('EUR');
    expect(result.current.day).toBe(localToday());
    expect(result.current.note).toBe('');
    expect(result.current.valid).toBe(false);
  });

  it('FE-BUDGET-SETTLEFORM-002: a reopened payment keeps its people, its currency decimals, its day and its note (#2175)', () => {
    const { result } = setup({ editing: RECORDED });
    expect(result.current.fromId).toBe(2);
    expect(result.current.toId).toBe(3);
    expect(result.current.amount).toBe('4.90');
    expect(result.current.currency).toBe('USD');
    expect(result.current.day).toBe('2026-06-30');
    expect(result.current.note).toBe('cash');
    expect(result.current.valid).toBe(true);
  });
});

describe('useSettlementForm: where the phone sheet starts', () => {
  it('FE-BUDGET-SETTLEFORM-003: the sheet starts blank while closed and fills in from the payment when it opens', () => {
    const { result, rerender } = setup({ editing: RECORDED, open: false });
    expect(result.current.fromId).toBe(1);
    expect(result.current.amount).toBe('');
    expect(result.current.currency).toBe('EUR');

    rerender({ editing: RECORDED, open: true });
    expect(result.current.fromId).toBe(2);
    expect(result.current.toId).toBe(3);
    expect(result.current.amount).toBe('4.90');
    expect(result.current.currency).toBe('USD');
    expect(result.current.day).toBe('2026-06-30');
    expect(result.current.note).toBe('cash');
  });

  it('FE-BUDGET-SETTLEFORM-004: reopening for a new payment starts over from the defaults', () => {
    const { result, rerender } = setup({ editing: RECORDED, open: true });
    act(() => result.current.setNote('typed'));
    rerender({ editing: null, open: false });
    rerender({ editing: null, open: true });
    expect(result.current.fromId).toBe(1);
    expect(result.current.toId).toBe(2);
    expect(result.current.amount).toBe('');
    expect(result.current.currency).toBe('EUR');
    expect(result.current.day).toBe(localToday());
    expect(result.current.note).toBe('');
  });
});

describe('useSettlementForm: saving', () => {
  it('FE-BUDGET-SETTLEFORM-005: records a new payment, reading a comma as the decimal mark, and trims the note', async () => {
    const { result } = setup({ editing: null });
    act(() => {
      result.current.setAmount('12,5');
      result.current.setNote('  dinner  ');
      result.current.setDay('2026-07-03');
    });
    expect(result.current.valid).toBe(true);
    await act(async () => {
      await result.current.save();
    });
    expect(createMock()).toHaveBeenCalledWith(7, {
      from_user_id: 1,
      to_user_id: 2,
      amount: 12.5,
      currency: 'EUR',
      settled_at: '2026-07-03',
      note: 'dinner',
    });
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(result.current.saving).toBe(false);
  });

  it('FE-BUDGET-SETTLEFORM-006: an edited payment is updated in place, an empty note goes as null', async () => {
    const { result } = setup({ editing: RECORDED });
    act(() => result.current.setNote('   '));
    await act(async () => {
      await result.current.save();
    });
    expect(updateMock()).toHaveBeenCalledWith(7, 30, {
      from_user_id: 2,
      to_user_id: 3,
      amount: 4.9,
      currency: 'USD',
      settled_at: '2026-06-30',
      note: null,
    });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it('FE-BUDGET-SETTLEFORM-007: nothing is sent while the form is invalid', async () => {
    const { result } = setup({ editing: null });
    act(() => {
      result.current.setAmount('10');
      result.current.setToId(1);
    });
    expect(result.current.valid).toBe(false);
    await act(async () => {
      await result.current.save();
    });
    act(() => {
      result.current.setToId(2);
      result.current.setDay('');
    });
    await act(async () => {
      await result.current.save();
    });
    expect(createMock()).not.toHaveBeenCalled();
  });

  it('FE-BUDGET-SETTLEFORM-008: a failed save toasts and leaves the form open', async () => {
    createMock().mockRejectedValueOnce(new Error('nope'));
    const { result } = setup({ editing: null });
    act(() => result.current.setAmount('3'));
    await act(async () => {
      await result.current.save();
    });
    expect(toastError).toHaveBeenCalledWith('common.unknownError');
    expect(onSaved).not.toHaveBeenCalled();
    expect(result.current.saving).toBe(false);
  });

  it('FE-BUDGET-SETTLEFORM-009: the phone ignores a second save while one is out, the desktop sends both', async () => {
    const run = async (oneSaveAtATime: boolean) => {
      createMock().mockClear();
      const pending: (() => void)[] = [];
      createMock().mockImplementation(() => new Promise((resolve) => pending.push(() => resolve({}))));
      const { result } = setup({ editing: null, open: true }, oneSaveAtATime);
      act(() => result.current.setAmount('3'));
      let first: Promise<void> = Promise.resolve();
      act(() => {
        first = result.current.save();
      });
      expect(result.current.saving).toBe(true);
      await act(async () => {
        void result.current.save();
      });
      const calls = createMock().mock.calls.length;
      await act(async () => {
        pending.forEach((resolve) => resolve());
        await first;
      });
      return calls;
    };
    expect(await run(true)).toBe(1);
    expect(await run(false)).toBe(2);
  });
});
