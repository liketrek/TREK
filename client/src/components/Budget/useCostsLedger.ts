import { useCallback, useEffect, useEffectEvent, useMemo, useState } from 'react';

import { budgetApi } from '../../api/client';
import { useExchangeRates, withFallbackFx } from '../../hooks/useExchangeRates';
import { useTranslation } from '../../i18n';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { TripStoreState } from '../../store/tripStore';
import type { BudgetItem, Trip } from '../../types';
import { downloadBlob } from '../../utils/fileDownload';
import {
  buildCostsCsv,
  categoryBreakdown,
  computeTotals,
  filterBudgetItems,
  filterSettlements,
  myShareOf,
  settledShareOf,
  type CostsCtx,
  type CostsSegment,
  type CostsSettlementResponse,
} from './costsModel';
import { useFreezeMissingRates } from './useFreezeMissingRates';

type Translate = (key: string, params?: Record<string, string | number>) => string;
interface Toaster {
  error: (message: string) => void;
}

/**
 * The Costs ledger behind the desktop CostsPanel and the phone MCostsTab: the
 * display and trip currencies, the settlement the server nets the balances in,
 * the totals and filters over the expenses and payments, the category
 * breakdown, the CSV export and the ledger writes. Each surface lays it out
 * and keeps its own dialogs or sheets.
 *
 * Where the two differ today, the surface says which way: the desktop also
 * reads the settlement when the trip changes (`settlementOnTripChange`), leaves
 * an expense nobody paid out of my share (`skipUnfinishedShares`, #2225) and
 * writes each expense's currency into the CSV as stored (`csvCurrencyAsStored`).
 */
export function useCostsLedger({
  tripId,
  trip,
  budgetItems,
  actions,
  canEdit,
  t,
  toast,
  settlementOnTripChange = false,
  skipUnfinishedShares = false,
  csvCurrencyAsStored = false,
}: {
  tripId: number;
  trip: Trip | null | undefined;
  budgetItems: BudgetItem[];
  actions: Pick<TripStoreState, 'loadBudgetItems' | 'deleteBudgetItem'>;
  canEdit: boolean;
  t: Translate;
  toast: Toaster;
  settlementOnTripChange?: boolean;
  skipUnfinishedShares?: boolean;
  csvCurrencyAsStored?: boolean;
}) {
  const { loadBudgetItems, deleteBudgetItem } = actions;
  const { locale } = useTranslation();
  const me = useAuthStore((s) => s.user?.id ?? -1);

  // Display/base currency = the user's preferred currency (Settings), falling back
  // to the trip's own currency. Everything in Costs is converted to and shown in it.
  const displayCurrency = useSettingsStore((s) => s.settings.default_currency);
  const base = (displayCurrency || trip?.currency || 'EUR').toUpperCase();
  // Pre-rework rows stored currency = NULL, meaning "the trip's own currency".
  const tripCurrency = (trip?.currency || base).toUpperCase();
  // Anchored on the trip currency's quote, the one the server books with (#2525).
  const { convert, displayPerTrip } = useExchangeRates(base, tripCurrency);
  const ctx: CostsCtx = useMemo(
    () => ({ me, tripCurrency, displayCurrency: base, convert }),
    [me, tripCurrency, base, convert]
  );

  const [settlement, setSettlement] = useState<CostsSettlementResponse | null>(null);
  // A failed settlement read leaves `settlement` null, which the views would
  // otherwise present as "everyone is square", a balance claim we cannot make.
  const [settlementError, setSettlementError] = useState(false);

  // The browser's own figure for the display currency goes along, for the server to
  // answer in it when it cannot fetch a quote itself.
  const loadSettlement = useCallback(() => {
    budgetApi
      .settlement(tripId, base, base !== tripCurrency ? displayPerTrip : null)
      .then((s) => {
        setSettlement(s);
        setSettlementError(false);
      })
      .catch(() => setSettlementError(true));
  }, [tripId, base, tripCurrency, displayPerTrip]);

  // The items reload when the trip changes; the settlement reloads on a trip or
  // currency change and when the number of expenses changes. Further refreshes are
  // explicit after each write, so an unrelated re-render does not refetch it. The
  // count is for an expense saved outside the ledger: a scanned receipt is reviewed
  // in the trip sheets, which reload the items but cannot reach this settlement.
  const onTripChange = useEffectEvent(() => {
    void loadBudgetItems(tripId);
    if (settlementOnTripChange) loadSettlement();
  });
  useEffect(() => {
    onTripChange();
  }, [tripId, loadBudgetItems]);
  useEffect(() => {
    loadSettlement();
  }, [budgetItems.length, loadSettlement]);

  // Rows the server could not count get a rate frozen from the browser's, and the
  // settlement is read again once they count.
  useFreezeMissingRates({
    tripId,
    tripCurrency,
    canEdit,
    unconverted: settlement?.unconverted,
    onHealed: loadSettlement,
  });

  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<CostsSegment>('all');
  const [catFilter, setCatFilter] = useState(''); // '' = all categories
  const [dayFilter, setDayFilter] = useState(''); // '' = all days, else YYYY-MM-DD

  const shareOf = skipUnfinishedShares ? settledShareOf : myShareOf;
  const flows = useMemo(() => settlement?.flows || [], [settlement]);
  // `ctx` carries the rates. They can land after the expenses, and without it in the
  // deps the cards kept the sums they were first added up with while the rows moved on.
  const totals = useMemo(() => computeTotals(budgetItems, flows, ctx, shareOf), [budgetItems, flows, ctx, shareOf]);
  const filtered = useMemo(
    () => filterBudgetItems(budgetItems, { search, segment, categoryKey: catFilter, dayKey: dayFilter }, ctx, shareOf),
    [budgetItems, search, segment, catFilter, dayFilter, ctx, shareOf]
  );
  const filteredSettlements = useMemo(
    () =>
      filterSettlements(
        settlement?.settlements || [],
        { search, segment, categoryKey: catFilter, dayKey: dayFilter },
        me
      ),
    [settlement, search, segment, catFilter, dayFilter, me]
  );
  const catBreakdown = useMemo(() => categoryBreakdown(budgetItems, ctx), [budgetItems, ctx]);

  // CSV export of all expenses, the wiki-documented export that got lost in the
  // Costs rework (#1500). One row per expense, oldest first.
  const exportCsv = useCallback(() => {
    const { filename, content } = buildCostsCsv(budgetItems, {
      base,
      ctx,
      locale,
      tripTitle: trip?.title,
      t,
      currencyOf: csvCurrencyAsStored ? (e) => e.currency || tripCurrency : undefined,
    });
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, filename);
  }, [budgetItems, base, ctx, locale, trip?.title, t, csvCurrencyAsStored, tripCurrency]);

  const deleteExpense = async (id: number) => {
    try {
      await deleteBudgetItem(tripId, id);
      loadSettlement();
    } catch {
      toast.error(t('common.unknownError'));
    }
  };

  // Deleting the recorded transfer brings the suggested flow back, so it reads
  // as "undo" rather than delete.
  const undoSettlement = async (id: number) => {
    try {
      await budgetApi.deleteSettlement(tripId, id);
      loadSettlement();
    } catch {
      toast.error(t('common.unknownError'));
    }
  };

  const settleFlow = async (fromId: number, toId: number, amount: number) => {
    try {
      await budgetApi.createSettlement(
        tripId,
        withFallbackFx({ from_user_id: fromId, to_user_id: toId, amount, currency: base }, tripCurrency)
      );
      loadSettlement();
    } catch {
      toast.error(t('common.unknownError'));
    }
  };

  const settleAll = async () => {
    if (!flows.length) return;
    try {
      for (const f of flows) {
        await budgetApi.createSettlement(
          tripId,
          withFallbackFx(
            { from_user_id: f.from.user_id, to_user_id: f.to.user_id, amount: f.amount, currency: base },
            tripCurrency
          )
        );
      }
    } catch {
      toast.error(t('common.unknownError'));
    } finally {
      // Refresh even when one transfer failed: the ones created before it are real,
      // and leaving them in the flow list invites a second, doubled settle-up.
      loadSettlement();
    }
  };

  return {
    me,
    base,
    tripCurrency,
    ctx,
    settlement,
    settlementError,
    loadSettlement,
    flows,
    search,
    setSearch,
    segment,
    setSegment,
    catFilter,
    setCatFilter,
    dayFilter,
    setDayFilter,
    totals,
    filtered,
    filteredSettlements,
    catBreakdown,
    exportCsv,
    deleteExpense,
    undoSettlement,
    settleFlow,
    settleAll,
  };
}
