// FE-TP-BOOKEXP-001 to FE-TP-BOOKEXP-009
//
// The expense editor the trip planner opens over itself, driven straight through
// useBookingExpenseEditor. The desktop planner and the phone trip sheets render the
// same editor from it, so every case holds for both.
import { act, renderHook } from '@testing-library/react';

import { buildBudgetItem } from '../../../tests/helpers/factories';
import { resetAllStores, seedStore } from '../../../tests/helpers/store';
import type { ExpensePrefill } from '../../components/Budget/CostsPanel';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import { useBookingExpenseEditor } from './useBookingExpenseEditor';

interface Props {
  tripCurrency?: string | null;
  receiptExpense?: ExpensePrefill | null;
}

const clearReceiptExpense = vi.fn();

function renderEditor(initial: Props = {}) {
  return renderHook(
    (props: Props) =>
      useBookingExpenseEditor({
        tripId: 42,
        tripCurrency: props.tripCurrency,
        receiptExpense: props.receiptExpense ?? null,
        clearReceiptExpense,
      }),
    { initialProps: initial }
  );
}

describe('useBookingExpenseEditor', () => {
  beforeEach(() => {
    resetAllStores();
    clearReceiptExpense.mockClear();
    seedStore(useAuthStore, { user: { id: 7, username: 'maurice', email: 'm@example.com' } });
  });

  it('FE-TP-BOOKEXP-001: no editor until a booking or a receipt asks for one', () => {
    const { result } = renderEditor();
    expect(result.current.expenseEditor).toBeNull();
  });

  it('FE-TP-BOOKEXP-002: a booking opens its linked expense for editing and closes it again', () => {
    const item = buildBudgetItem({ id: 99 });
    const { result } = renderEditor();
    act(() => {
      result.current.openBookingExpense({ editItem: item });
    });
    expect(result.current.expenseEditor).toMatchObject({ key: 'booking', editing: item, prefill: undefined });
    act(() => {
      result.current.expenseEditor!.close();
    });
    expect(result.current.expenseEditor).toBeNull();
  });

  it('FE-TP-BOOKEXP-003: a booking without a linked expense opens a new one prefilled', () => {
    const { result } = renderEditor();
    act(() => {
      result.current.openBookingExpense({ prefill: { reservationId: 5, name: 'Train', amount: 30 } });
    });
    expect(result.current.expenseEditor).toMatchObject({
      key: 'booking',
      editing: null,
      prefill: { reservationId: 5, name: 'Train', amount: 30 },
    });
  });

  it('FE-TP-BOOKEXP-004: a request with neither an item nor a prefill opens nothing', () => {
    const { result } = renderEditor();
    act(() => {
      result.current.openBookingExpense({});
    });
    expect(result.current.expenseEditor).toBeNull();
  });

  it('FE-TP-BOOKEXP-005: a scanned receipt opens a new expense and its close clears the receipt', () => {
    const { result } = renderEditor({ receiptExpense: { name: 'Lunch', amount: 12 } });
    expect(result.current.expenseEditor).toMatchObject({
      key: 'receipt',
      editing: null,
      prefill: { name: 'Lunch', amount: 12 },
    });
    act(() => {
      result.current.expenseEditor!.close();
    });
    expect(clearReceiptExpense).toHaveBeenCalledTimes(1);
  });

  it('FE-TP-BOOKEXP-006: a booking request wins over a waiting receipt', () => {
    const item = buildBudgetItem({ id: 3 });
    const { result } = renderEditor({ receiptExpense: { name: 'Lunch' } });
    act(() => {
      result.current.openBookingExpense({ editItem: item });
    });
    expect(result.current.expenseEditor?.key).toBe('booking');
  });

  it('FE-TP-BOOKEXP-007: the base currency prefers the display setting, then the trip, then EUR', () => {
    seedStore(useSettingsStore, { settings: { default_currency: 'usd' } });
    const { result, rerender } = renderEditor({ tripCurrency: 'jpy' });
    expect(result.current.costsBase).toBe('USD');

    act(() => {
      seedStore(useSettingsStore, { settings: { default_currency: '' } });
    });
    rerender({ tripCurrency: 'jpy' });
    expect(result.current.costsBase).toBe('JPY');

    rerender({ tripCurrency: null });
    expect(result.current.costsBase).toBe('EUR');
  });

  it('FE-TP-BOOKEXP-008: the current user pays, an anonymous session as user -1', () => {
    const { result } = renderEditor();
    expect(result.current.meId).toBe(7);
    act(() => {
      seedStore(useAuthStore, { user: null });
    });
    expect(result.current.meId).toBe(-1);
  });

  it('FE-TP-BOOKEXP-009: a save closes the editor and reloads the trip budget', () => {
    const loadBudgetItems = vi.fn(async () => undefined);
    seedStore(useTripStore, { loadBudgetItems });
    const { result } = renderEditor();
    act(() => {
      result.current.openBookingExpense({ prefill: { reservationId: 5 } });
    });
    act(() => {
      result.current.onExpenseSaved();
    });
    expect(result.current.expenseEditor).toBeNull();
    expect(loadBudgetItems).toHaveBeenCalledWith(42);
  });
});
