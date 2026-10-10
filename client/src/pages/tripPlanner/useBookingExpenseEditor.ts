import { useState } from 'react';

import type { ExpensePrefill } from '../../components/Budget/CostsPanel';
import { expenseEditorFor } from '../../components/Budget/CostsPanel.helpers';
import type { BookingExpenseRequest } from '../../components/Planner/BookingCostsSection.types';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { BudgetItem } from '../../types';

interface BookingExpenseEditorOptions {
  tripId: number;
  /** The trip's own currency, the fallback when the user has no display currency set. */
  tripCurrency: string | null | undefined;
  /** A scanned receipt sent to the trip from the background tasks widget. */
  receiptExpense: ExpensePrefill | null;
  clearReceiptExpense: () => void;
}

/**
 * The expense editor the trip planner opens over itself: from a booking's Costs block
 * (save then open) and for a scanned receipt. The desktop shows it as ExpenseModal, the
 * phone as MCostSheet; both read the same editor, base currency and current user here.
 */
export function useBookingExpenseEditor(options: BookingExpenseEditorOptions) {
  const { tripId, tripCurrency, receiptExpense, clearReceiptExpense } = options;
  const meId = useAuthStore((s) => s.user?.id ?? -1);
  const displayCurrency = useSettingsStore((s) => s.settings.default_currency);
  const loadBudgetItems = useTripStore((s) => s.loadBudgetItems);
  const [bookingExpense, setBookingExpense] = useState<{ editing: BudgetItem | null; prefill?: ExpensePrefill } | null>(
    null
  );
  const openBookingExpense = (req: BookingExpenseRequest) => {
    if (req.editItem) setBookingExpense({ editing: req.editItem });
    else if (req.prefill) setBookingExpense({ editing: null, prefill: req.prefill });
  };
  const costsBase = (displayCurrency || tripCurrency || 'EUR').toUpperCase();
  // One expense editor for both openers: a booking's Costs block, and a scanned
  // receipt sent here from the background tasks widget.
  const expenseEditor = expenseEditorFor(
    bookingExpense,
    () => setBookingExpense(null),
    receiptExpense,
    clearReceiptExpense
  );
  const onExpenseSaved = () => {
    expenseEditor?.close();
    loadBudgetItems(tripId);
  };
  return { meId, costsBase, openBookingExpense, expenseEditor, onExpenseSaved };
}
