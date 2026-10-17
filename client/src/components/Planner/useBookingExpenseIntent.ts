import { useRef } from 'react';

import type { BudgetItem } from '../../types';
import type { BookingExpenseIntent } from './bookingFormModel';

export interface BookingExpenseRemoval {
  /** Deletes the expense linked to the booking. */
  remove: (item: BudgetItem) => Promise<unknown>;
  /** Called when the delete fails. */
  onError: () => void;
}

/**
 * The expense the user asked for from a booking form, held in a ref (not state) so
 * the save started by the same click reads it. Behind the desktop booking and
 * transport dialogs and the phone's booking and transport sheets: `create` (and on
 * the desktop `edit`) note the wish and save; the form reads it with `take` at the
 * point it always did and opens the editor for the saved booking.
 */
export function useBookingExpenseIntent(submit: () => Promise<unknown>, removal?: BookingExpenseRemoval) {
  const intentRef = useRef<BookingExpenseIntent | null>(null);

  // The wish belongs to the save its click starts. A save that returns early
  // (no title) or throws never reads it, and it must not open the editor on
  // the next, unrelated save. A newer click's wish is left alone.
  const saveWith = (intent: BookingExpenseIntent) => {
    intentRef.current = intent;
    void submit().finally(() => {
      if (intentRef.current === intent) intentRef.current = null;
    });
  };

  return {
    /** Forgets a wish left from an earlier opening. */
    reset: () => {
      intentRef.current = null;
    },
    /** Reads the wish and clears it. */
    take: (): BookingExpenseIntent | null => {
      const intent = intentRef.current;
      intentRef.current = null;
      return intent;
    },
    create: () => saveWith({ create: true }),
    /** Saves the booking first, then opens the linked expense. */
    edit: (item: BudgetItem) => saveWith({ editItem: item }),
    remove: async (item: BudgetItem) => {
      if (!removal) return;
      try {
        await removal.remove(item);
      } catch {
        removal.onError();
      }
    },
  };
}
