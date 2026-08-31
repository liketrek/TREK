import type { ExchangeRateResolution, ExchangeRateSource } from '@trek/shared';
import { useEffect, useRef, useState } from 'react';
import { budgetApi } from '../../api/client';

export interface ExistingFrozenRate {
  currency?: string | null;
  exchange_rate?: number;
  exchange_rate_source?: ExchangeRateSource;
  exchange_rate_source_version?: string | null;
  exchange_rate_effective_date?: string | null;
  exchange_rate_set_at?: string | null;
  exchange_rate_note?: string | null;
}

export const storedRateToDisplay = (storedRate: number): number | null =>
  Number.isFinite(storedRate) && storedRate > 0 ? 1 / storedRate : null;

export const displayRateToStored = (displayRate: number): number | null =>
  Number.isFinite(displayRate) && displayRate > 0 ? 1 / displayRate : null;

export const formatDisplayRate = (storedRate: number): string => {
  const displayed = storedRateToDisplay(storedRate);
  return displayed === null ? '' : Number(displayed.toPrecision(12)).toString();
};

export function useItemExchangeRate(
  tripId: number,
  currency: string,
  tripCurrency: string,
  existing?: ExistingFrozenRate | null
) {
  const currentCurrency = currency.toUpperCase();
  const accountingCurrency = tripCurrency.toUpperCase();
  const existingCurrency = existing?.currency;
  const existingRate = existing?.exchange_rate;
  const existingSource = existing?.exchange_rate_source;
  const existingSourceVersion = existing?.exchange_rate_source_version;
  const existingEffectiveDate = existing?.exchange_rate_effective_date;
  const existingSetAt = existing?.exchange_rate_set_at;
  const existingNote = existing?.exchange_rate_note;
  const hasExisting = existing !== null && existing !== undefined;
  const sameExistingCurrency = Boolean(
    hasExisting && (existingCurrency || accountingCurrency).toUpperCase() === currentCurrency
  );
  const existingResolution: ExchangeRateResolution | null =
    sameExistingCurrency && existingRate
      ? {
          trip_id: tripId,
          trip_currency: accountingCurrency,
          item_currency: currentCurrency,
          exchange_rate: existingRate,
          source: existingSource || 'legacy',
          source_version: existingSourceVersion || 'legacy',
          effective_date: existingEffectiveDate || null,
          fetched_at: existingSetAt || null,
          stale: false,
        }
      : null;
  const [suggestion, setSuggestion] = useState<ExchangeRateResolution | null>(existingResolution);
  const [value, setValue] = useState(() =>
    existingResolution ? formatDisplayRate(existingResolution.exchange_rate) : ''
  );
  const [note, setNote] = useState(existingNote || '');
  const [manual, setManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const requestRevision = useRef(0);
  const manualRevision = useRef(0);

  useEffect(() => {
    const revision = ++requestRevision.current;
    const startedManualRevision = manualRevision.current;
    const current = () => requestRevision.current === revision && manualRevision.current === startedManualRevision;
    const unchanged = hasExisting && (existingCurrency || accountingCurrency).toUpperCase() === currentCurrency;
    setManual(false);
    setUnavailable(false);
    setLoading(false);
    setNote(unchanged ? existingNote || '' : '');
    if (unchanged && existingRate) {
      const next: ExchangeRateResolution = {
        trip_id: tripId,
        trip_currency: accountingCurrency,
        item_currency: currentCurrency,
        exchange_rate: existingRate,
        source: existingSource || 'legacy',
        source_version: existingSourceVersion || 'legacy',
        effective_date: existingEffectiveDate || null,
        fetched_at: existingSetAt || null,
        stale: false,
      };
      setSuggestion(next);
      setValue(formatDisplayRate(next.exchange_rate));
      return;
    }
    if (currentCurrency === accountingCurrency) {
      setSuggestion({
        trip_id: tripId,
        trip_currency: accountingCurrency,
        item_currency: currentCurrency,
        exchange_rate: 1,
        source: 'identity',
        source_version: `identity:${accountingCurrency}`,
        effective_date: null,
        fetched_at: null,
        stale: false,
      });
      setValue('1');
      return;
    }
    setSuggestion(null);
    setValue('');
    setLoading(true);
    budgetApi
      .resolveExchangeRate(tripId, currentCurrency)
      .then((resolved) => {
        if (!current()) return;
        setSuggestion(resolved);
        setValue(formatDisplayRate(resolved.exchange_rate));
      })
      .catch(() => {
        if (!current()) return;
        setSuggestion(null);
        setValue('');
        setUnavailable(true);
      })
      .finally(() => {
        if (current()) setLoading(false);
      });
    return () => {
      if (requestRevision.current === revision) requestRevision.current += 1;
    };
  }, [
    tripId,
    currentCurrency,
    accountingCurrency,
    hasExisting,
    existingCurrency,
    existingRate,
    existingSource,
    existingSourceVersion,
    existingEffectiveDate,
    existingSetAt,
    existingNote,
  ]);

  const setManualValue = (next: string) => {
    manualRevision.current += 1;
    requestRevision.current += 1;
    setManual(true);
    setLoading(false);
    setUnavailable(false);
    setValue(next.replace(',', '.'));
  };
  const numeric = Number(value);
  const sameCurrency = currentCurrency === accountingCurrency;
  const valid = sameCurrency || (manual ? Number.isFinite(numeric) && numeric > 0 : suggestion !== null);
  const storedRate = manual ? displayRateToStored(numeric) : (suggestion?.exchange_rate ?? null);
  const write =
    manual && !sameCurrency && storedRate !== null
      ? { exchange_rate: storedRate, exchange_rate_note: note.trim() || null }
      : {};

  return {
    suggestion,
    value,
    setManualValue,
    note,
    setNote,
    manual,
    loading,
    unavailable,
    valid,
    storedRate,
    displayRate: Number.isFinite(numeric) && numeric > 0 ? numeric : null,
    write,
  };
}
