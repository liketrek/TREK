import { FRANKFURTER_CURRENCIES, type ExchangeRateResolution, type TripExchangeRate } from '@trek/shared';
import { AlertTriangle, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { budgetApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import CurrencySelect from '../shared/CurrencySelect';
import { NumericInput } from '../shared/NumericInput';
import { useToast } from '../shared/Toast';
import { chooseInitialRateCurrency } from './exchangeRateManagerModel';
import { displayRateToStored, formatDisplayRate } from './useItemExchangeRate';

interface PreviewRow {
  type: 'expense' | 'settlement';
  id: number;
  amount: number;
  source: string;
  old_exchange_rate: number;
  new_exchange_rate: number;
  old_trip_value: number;
  new_trip_value: number;
  trip_value_delta: number;
  selected: boolean;
}

interface Preview {
  preview_id: string;
  currency: string;
  rows: PreviewRow[];
}

const sourceLabel = (t: (key: string, params?: Record<string, string | number>) => string, source?: string) => {
  const known = ['identity', 'global', 'trip', 'explicit', 'legacy'].includes(source || '') ? source : 'unavailable';
  return t(`costs.exchangeRates.source.${known}`);
};

export default function ExchangeRateManager({
  tripId,
  tripCurrency,
  usedCurrencies = [],
  canEdit,
  onChanged,
}: {
  tripId: number | string;
  tripCurrency: string;
  usedCurrencies?: readonly string[];
  canEdit: boolean;
  onChanged?: () => void;
}): React.ReactElement {
  const { t, locale } = useTranslation();
  const toast = useToast();
  const commonCurrencies = useSettingsStore((state) => state.settings.common_currencies);
  const normalizedTripCurrency = tripCurrency.toUpperCase();
  const fallbackCurrency = normalizedTripCurrency === 'USD' ? 'EUR' : 'USD';
  const availableCurrencies = useMemo(
    () => FRANKFURTER_CURRENCIES.filter((code) => code !== normalizedTripCurrency),
    [normalizedTripCurrency]
  );
  const [rates, setRates] = useState<TripExchangeRate[]>([]);
  const [currency, setCurrency] = useState(fallbackCurrency);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [resolution, setResolution] = useState<ExchangeRateResolution | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const userSelectedCurrency = useRef(false);
  const resolveRevision = useRef(0);

  const load = useCallback(async () => {
    try {
      const result = await budgetApi.listExchangeRates(tripId);
      const nextRates = result.rates || [];
      setRates(nextRates);
      if (!userSelectedCurrency.current) {
        setCurrency(
          chooseInitialRateCurrency({
            tripCurrency: normalizedTripCurrency,
            commonCurrencies,
            usedCurrencies,
            savedCurrencies: nextRates.map((rate) => rate.currency),
          })
        );
      }
    } catch {
      setRates([]);
    }
  }, [commonCurrencies, normalizedTripCurrency, tripId, usedCurrencies]);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    const reload = () => {
      void load();
      setRefreshVersion((version) => version + 1);
    };
    window.addEventListener('budget:exchange-rates-changed', reload);
    return () => window.removeEventListener('budget:exchange-rates-changed', reload);
  }, [load]);

  useEffect(() => {
    const revision = ++resolveRevision.current;
    setPreview(null);
    setResolution(null);
    setUnavailable(false);
    setValue('');
    const saved = rates.find((rate) => rate.currency === currency);
    setNote(saved?.note || '');
    budgetApi
      .resolveExchangeRate(tripId, currency)
      .then((next) => {
        if (resolveRevision.current !== revision) return;
        setResolution(next);
        setValue(formatDisplayRate(next.exchange_rate));
      })
      .catch(() => {
        if (resolveRevision.current !== revision) return;
        setUnavailable(true);
      });
    return () => {
      if (resolveRevision.current === revision) resolveRevision.current += 1;
    };
  }, [currency, rates, refreshVersion, tripId]);

  const selectedSavedRate = rates.find((rate) => rate.currency === currency);
  const storedRate = displayRateToStored(Number(value));
  const validRate = storedRate !== null && currency !== normalizedTripCurrency;
  const inverse = Number(value) > 0 ? Number((1 / Number(value)).toPrecision(12)).toString() : null;
  const date = (valueToFormat?: string | null) => {
    if (!valueToFormat) return null;
    const parsed = new Date(valueToFormat);
    return Number.isNaN(parsed.getTime()) ? valueToFormat : parsed.toLocaleString(locale);
  };
  const refresh = () => {
    void load();
    setRefreshVersion((version) => version + 1);
    onChanged?.();
  };

  const save = async () => {
    if (!canEdit || !validRate) return;
    setBusy(true);
    try {
      await budgetApi.setExchangeRate(tripId, currency, storedRate!, note.trim() || null);
      toast.success(t('budget.exchangeRates.saved'));
      refresh();
    } catch {
      toast.error(t('costs.exchangeRates.toast.saveError'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (rate: TripExchangeRate) => {
    if (!canEdit) return;
    setBusy(true);
    try {
      await budgetApi.deleteExchangeRate(tripId, rate.currency);
      refresh();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const makePreview = async () => {
    if (!canEdit || !validRate) return;
    setBusy(true);
    try {
      const result = (await budgetApi.previewExchangeRate(
        tripId,
        currency,
        storedRate!,
        note.trim() || null
      )) as Preview;
      setPreview(result);
      setSelected(new Set(result.rows.filter((row) => row.selected).map((row) => `${row.type}:${row.id}`)));
    } catch {
      toast.error(t('costs.exchangeRates.toast.saveError'));
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    if (!canEdit || !preview) return;
    setBusy(true);
    try {
      await budgetApi.applyExchangeRate(
        tripId,
        preview.currency,
        preview.preview_id,
        preview.rows
          .filter((row) => selected.has(`${row.type}:${row.id}`))
          .map((row) => ({ type: row.type, id: row.id }))
      );
      setPreview(null);
      refresh();
      toast.success(t('budget.exchangeRates.applied'));
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      toast.error(
        status === 409 ? t('costs.exchangeRates.toast.previewOutdated') : t('costs.exchangeRates.toast.applyError')
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="m-0 text-sm text-content-muted">{t('costs.exchangeRates.description')}</p>

      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <CurrencySelect
          value={currency}
          onChange={(next) => {
            userSelectedCurrency.current = true;
            setCurrency(next);
          }}
          availableCurrencies={availableCurrencies}
          currentCurrency={currency}
          size="md"
          style={{ width: '100%' }}
        />
        <div className="rounded-xl border border-edge bg-surface-input px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="whitespace-nowrap text-content-muted">1 {currency} =</span>
            <NumericInput
              mode="decimal"
              value={value}
              onValueChange={(next) => {
                setValue(next.replace(',', '.'));
                setPreview(null);
              }}
              disabled={!canEdit}
              placeholder={unavailable ? t('costs.exchangeRates.required') : '0'}
              className="min-w-0 flex-1 border-0 bg-transparent font-semibold text-content outline-none"
            />
            <span className="whitespace-nowrap text-content-muted">{normalizedTripCurrency}</span>
          </div>
          {inverse && (
            <p className="m-0 mt-1 text-xs text-content-faint">
              {t('costs.exchangeRates.inverse', {
                tripCurrency: normalizedTripCurrency,
                rate: inverse,
                currency,
              })}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-edge bg-surface-secondary p-3 text-xs text-content-muted">
        {resolution ? (
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <strong className="text-content">
              {t('costs.exchangeRates.sourceLabel', { source: sourceLabel(t, resolution.source) })}
            </strong>
            {resolution.effective_date && <span>· {resolution.effective_date}</span>}
            {resolution.fetched_at && (
              <span>· {t('costs.exchangeRates.fetchedAt', { date: date(resolution.fetched_at) || '' })}</span>
            )}
            {resolution.stale && (
              <span className="inline-flex items-center gap-1 text-warning">
                · <AlertTriangle size={12} /> {t('costs.exchangeRates.staleSnapshot')}
              </span>
            )}
          </div>
        ) : (
          <strong className={unavailable ? 'text-danger' : 'text-content-muted'}>
            {unavailable ? t('costs.exchangeRates.manualRequired') : t('common.loading')}
          </strong>
        )}
        {selectedSavedRate && (
          <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
            <span>{t('costs.exchangeRates.savedDefaults')}</span>
            <span>· {date(selectedSavedRate.set_at)}</span>
            {selectedSavedRate.note && <span>· {selectedSavedRate.note}</span>}
          </div>
        )}
        <p className="m-0 mt-2 text-content-faint">{t('costs.exchangeRates.frozenHint')}</p>
      </div>

      {canEdit && (
        <>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            placeholder={t('costs.exchangeRates.notePlaceholder')}
            className="w-full rounded-xl border border-edge bg-surface-input px-3 py-2 text-sm text-content"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={!validRate || busy}
              onClick={save}
              className="rounded-lg border border-edge px-3 py-2 text-xs font-semibold text-content disabled:opacity-40"
            >
              {t('costs.exchangeRates.saveDefault')}
            </button>
            <button
              type="button"
              disabled={!validRate || busy}
              onClick={makePreview}
              className="rounded-lg bg-content px-3 py-2 text-xs font-semibold text-surface disabled:opacity-40"
            >
              {t('costs.exchangeRates.previewChanges')}
            </button>
          </div>
        </>
      )}

      {preview && (
        <div className="bg-surface-subtle rounded-xl border border-edge p-3">
          <p className="m-0 text-xs font-semibold text-content">{t('budget.exchangeRates.previewTitle')}</p>
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {preview.rows.length === 0 && (
              <p className="text-xs text-content-faint">{t('costs.exchangeRates.noMatchingItems')}</p>
            )}
            {preview.rows.map((row) => {
              const key = `${row.type}:${row.id}`;
              return (
                <label
                  key={key}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-edge px-2 py-2 text-xs text-content-muted"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(key)}
                    onChange={() =>
                      setSelected((current) => {
                        const next = new Set(current);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      })
                    }
                  />
                  <span className="text-content">
                    {t(`costs.exchangeRates.item.${row.type}`)} #{row.id} · {sourceLabel(t, row.source)}
                  </span>
                  <span className="font-mono">
                    {row.old_trip_value.toPrecision(6)} → {row.new_trip_value.toPrecision(6)}
                  </span>
                </label>
              );
            })}
          </div>
          {canEdit && (
            <button
              type="button"
              disabled={busy || selected.size === 0}
              onClick={apply}
              className="mt-3 rounded-lg bg-content px-3 py-2 text-xs font-semibold text-surface disabled:opacity-40"
            >
              {t('costs.exchangeRates.applyItems', { count: selected.size })}
            </button>
          )}
        </div>
      )}

      <div>
        <h4 className="m-0 text-sm font-semibold text-content">{t('costs.exchangeRates.savedDefaults')}</h4>
        {rates.length === 0 ? (
          <p className="mt-2 text-xs text-content-faint">{t('costs.exchangeRates.noTripRates')}</p>
        ) : (
          <div className="mt-2 divide-y divide-edge">
            {rates.map((rate) => (
              <div key={rate.currency} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    userSelectedCurrency.current = true;
                    setCurrency(rate.currency);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left text-xs"
                >
                  <strong className="w-10 text-content">{rate.currency}</strong>
                  <span className="min-w-0 flex-1 text-content-muted">
                    1 {rate.currency} = {formatDisplayRate(rate.exchange_rate)} {normalizedTripCurrency}
                    {rate.note ? ` · ${rate.note}` : ''}
                  </span>
                </button>
                {canEdit && (
                  <button
                    type="button"
                    disabled={busy}
                    aria-label={t('common.delete')}
                    onClick={() => void remove(rate)}
                    className="rounded-md p-1 text-danger disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
