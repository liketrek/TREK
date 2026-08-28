import type { TripExchangeRate } from '@trek/shared';
import React, { useCallback, useEffect, useState } from 'react';

import { budgetApi } from '../../api/client';
import { useTranslation } from '../../i18n';
import { useToast } from '../shared/Toast';

interface PreviewRow {
  type: 'expense' | 'settlement';
  id: number;
  amount: number;
  old_exchange_rate: number;
  new_exchange_rate: number;
  trip_value_delta: number;
  selected: boolean;
}
interface Preview {
  preview_id: string;
  currency: string;
  rows: PreviewRow[];
}

export default function ExchangeRateManager({
  tripId,
  canEdit,
  onChanged,
}: {
  tripId: number | string;
  canEdit: boolean;
  onChanged?: () => void;
}): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const [rates, setRates] = useState<TripExchangeRate[]>([]);
  const [currency, setCurrency] = useState('USD');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    budgetApi
      .listExchangeRates(tripId)
      .then((result) => setRates(result.rates))
      .catch(() => setRates([]));
  }, [tripId]);
  useEffect(load, [load]);
  useEffect(() => {
    const reload = () => load();
    window.addEventListener('budget:exchange-rates-changed', reload);
    return () => window.removeEventListener('budget:exchange-rates-changed', reload);
  }, [load]);

  const validRate = Number(value) > 0 && /^[A-Za-z]{3}$/.test(currency);
  const save = async () => {
    if (!validRate) return;
    setBusy(true);
    try {
      await budgetApi.setExchangeRate(tripId, currency.toUpperCase(), Number(value), note || null);
      toast.success(t('budget.exchangeRates.saved'));
      load();
      onChanged?.();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (rate: TripExchangeRate) => {
    setBusy(true);
    try {
      await budgetApi.deleteExchangeRate(tripId, rate.currency);
      load();
      onChanged?.();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBusy(false);
    }
  };
  const makePreview = async () => {
    if (!validRate) return;
    setBusy(true);
    try {
      const result = (await budgetApi.previewExchangeRate(
        tripId,
        currency.toUpperCase(),
        Number(value),
        note || null
      )) as Preview;
      setPreview(result);
      setSelected(new Set(result.rows.filter((row) => row.selected).map((row) => `${row.type}:${row.id}`)));
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBusy(false);
    }
  };
  const apply = async () => {
    if (!preview) return;
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
      load();
      onChanged?.();
      toast.success(t('budget.exchangeRates.applied'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-edge bg-surface-card p-4">
      <div>
        <h3 className="font-semibold text-content">{t('budget.exchangeRates.title')}</h3>
        <p className="mt-1 text-xs text-content-muted">{t('budget.exchangeRates.description')}</p>
      </div>
      {rates.length > 0 && (
        <div className="space-y-2">
          {rates.map((rate) => (
            <div key={rate.currency} className="flex items-center gap-3 rounded-lg border border-edge px-3 py-2">
              <strong className="w-12 text-content">{rate.currency}</strong>
              <span className="flex-1 font-mono text-sm text-content">{rate.exchange_rate}</span>
              {rate.note && <span className="hidden truncate text-xs text-content-muted sm:block">{rate.note}</span>}
              {canEdit && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => remove(rate)}
                  className="text-xs text-danger underline"
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {canEdit && (
        <div className="grid gap-2 sm:grid-cols-[80px_1fr_1fr_auto_auto]">
          <input
            value={currency}
            onChange={(event) => setCurrency(event.target.value.toUpperCase().slice(0, 3))}
            aria-label={t('costs.currency')}
            className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm uppercase text-content"
          />
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            type="number"
            min="0"
            step="any"
            placeholder={t('budget.exchangeRates.rate')}
            className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content"
          />
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            placeholder={t('budget.exchangeRates.note')}
            className="rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-content"
          />
          <button
            type="button"
            disabled={!validRate || busy}
            onClick={save}
            className="rounded-lg border border-edge px-3 py-2 text-xs font-semibold text-content disabled:opacity-40"
          >
            {t('common.save')}
          </button>
          <button
            type="button"
            disabled={!validRate || busy}
            onClick={makePreview}
            className="rounded-lg bg-content px-3 py-2 text-xs font-semibold text-surface disabled:opacity-40"
          >
            {t('budget.exchangeRates.preview')}
          </button>
        </div>
      )}
      {preview && (
        <div className="bg-surface-subtle rounded-xl border border-edge p-3">
          <p className="text-xs font-semibold text-content">{t('budget.exchangeRates.previewTitle')}</p>
          <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
            {preview.rows.map((row) => {
              const key = `${row.type}:${row.id}`;
              return (
                <label key={key} className="flex items-center gap-2 text-xs text-content-muted">
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
                  <span>
                    {row.type} #{row.id}
                  </span>
                  <span className="ml-auto font-mono">
                    {row.old_exchange_rate} → {row.new_exchange_rate}
                  </span>
                </label>
              );
            })}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={apply}
            className="mt-3 rounded-lg bg-content px-3 py-2 text-xs font-semibold text-surface disabled:opacity-40"
          >
            {t('budget.exchangeRates.apply', { count: selected.size })}
          </button>
        </div>
      )}
    </div>
  );
}
