import { useEffect, useEffectEvent, useState } from 'react';
import { useSearchParams } from 'react-router';

import { useTripStore } from '../../store/tripStore';
import type { BudgetItem } from '../../types';

/**
 * The links into the Costs tab that open the expense dialog, taken once and
 * then dropped from the URL so a reload or the way back does not repeat them.
 * `?expense=<id>` opens that expense the way a click on its row does: the
 * assistant's "Open in Costs" on an expense lands here, on the desktop and on
 * the phone alike. An id the store does not hold yet (an expense the
 * assistant just created, before its broadcast arrived) reads the expenses
 * once more; an id that read does not bring either is dropped without a word,
 * on a trip without any expense too. What opening means is the view's: the
 * phone opens its edit sheet only for an editor, as its rows do. With
 * `create`, the bottom bar's "+" opens an empty dialog, as on the desktop.
 */
export function useExpenseLinks(
  tripId: number | string,
  budgetItems: readonly BudgetItem[],
  open: (expense: BudgetItem | null) => void,
  { create = false }: { create?: boolean } = {}
): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const loadBudgetItems = useTripStore((state) => state.loadBudgetItems);
  // The link whose expenses were read again for it: after that read it is done, found or not.
  const [checked, setChecked] = useState<string | null>(null);
  const creating = create && searchParams.get('create') === 'expense';
  const asked = searchParams.get('expense');
  const id = asked === null ? null : Number(asked);
  const malformed = id !== null && (!Number.isInteger(id) || id <= 0);
  const found = id === null || malformed ? undefined : budgetItems.find((item) => item.id === id);
  const settled = asked !== null && (found !== undefined || malformed || checked === asked);
  const openExpense = useEffectEvent(open);
  const readAgain = useEffectEvent(() => Promise.resolve(loadBudgetItems(tripId)));

  useEffect(() => {
    if (asked === null || settled) return;
    let live = true;
    void readAgain().finally(() => {
      if (live) setChecked(asked);
    });
    return () => {
      live = false;
    };
  }, [asked, settled]);

  useEffect(() => {
    if (!creating && !settled) return;
    if (creating) openExpense(null);
    else if (found) openExpense(found);
    setSearchParams(
      (params) => {
        if (creating) params.delete('create');
        if (settled) params.delete('expense');
        return params;
      },
      { replace: true }
    );
  }, [creating, settled, found, setSearchParams]);
}
