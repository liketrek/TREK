import {
  FRANKFURTER_CURRENCIES,
  type ExchangeRateBatchPreview,
  type ExchangeRateResolution,
  type TripExchangeRate,
} from '@trek/shared';
import { AlertTriangle, ArrowLeftRight, Trash2 } from 'lucide-react';
import React, { useEffect, useId, useMemo, useState } from 'react';

import { useTranslation } from '../../i18n';
import { exchangeRateRepo } from '../../repo/budgetRepo';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import CurrencySelect from '../shared/CurrencySelect';
import { DialogHeader, DialogShell, DialogTile, NEUTRAL_TINT } from '../shared/DialogShell';
import { NumericInput } from '../shared/NumericInput';
import { useToast } from '../shared/Toast';
import { chooseInitialRateCurrency } from './exchangeRateManagerModel';
import { displayRateToStored, formatDisplayRate } from './useItemExchangeRate';

const sourceLabel = (t: (key: string, params?: Record<string, string | number>) => string, source?: string) => {
  const known = ['identity', 'global', 'trip', 'explicit', 'legacy'].includes(source || '') ? source : 'unavailable';
  return t(`costs.exchangeRates.source.${known}`);
};

const NO_RATES: TripExchangeRate[] = [];
const NO_CURRENCIES: readonly string[] = [];

export default function ExchangeRateManager({
  tripId,
  tripCurrency,
  usedCurrencies = NO_CURRENCIES,
  canEdit,
}: {
  tripId: number | string;
  tripCurrency: string;
  usedCurrencies?: readonly string[];
  canEdit: boolean;
}): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const commonCurrencies = useSettingsStore((state) => state.settings.common_currencies);
  const remoteRevision = useTripStore((state) =>
    String(state.trip?.id) === String(tripId) ? state.exchangeRatesRevision : 0
  );
  const [localRevision, setLocalRevision] = useState(0);
  const [snapshot, setSnapshot] = useState<{ tripId: number | string; rates: TripExchangeRate[] } | null>(null);
  const [selection, setSelection] = useState<{ tripId: number | string; currency: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const normalizedTripCurrency = tripCurrency.toUpperCase();
  const rates = snapshot?.tripId === tripId ? snapshot.rates : NO_RATES;
  const availableCurrencies = useMemo(
    () => FRANKFURTER_CURRENCIES.filter((code) => code !== normalizedTripCurrency),
    [normalizedTripCurrency]
  );

  useEffect(() => {
    let active = true;
    void exchangeRateRepo.list(tripId).then(
      (result) => {
        if (active) setSnapshot({ tripId, rates: result.rates || [] });
      },
      () => {
        if (active) setSnapshot({ tripId, rates: NO_RATES });
      }
    );
    return () => {
      active = false;
    };
  }, [localRevision, remoteRevision, tripId]);

  const currency =
    selection?.tripId === tripId
      ? selection.currency
      : chooseInitialRateCurrency({
          tripCurrency: normalizedTripCurrency,
          commonCurrencies,
          usedCurrencies,
          savedCurrencies: rates.map((rate) => rate.currency),
        });
  const selectedSavedRate = rates.find((rate) => rate.currency === currency);
  const selectCurrency = (currency: string) => setSelection({ tripId, currency });
  const refresh = () => {
    const state = useTripStore.getState();
    state.refreshExchangeRates(tripId, true);
    if (String(state.trip?.id) !== String(tripId)) setLocalRevision((version) => version + 1);
  };

  const remove = async (rate: TripExchangeRate) => {
    if (!canEdit) return;
    setBusy(true);
    try {
      await exchangeRateRepo.deleteDefault(tripId, rate.currency);
      refresh();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="m-0 text-body text-content-muted">{t('costs.exchangeRates.description')}</p>
      <RateEditor
        rateContext={JSON.stringify([
          tripId,
          normalizedTripCurrency,
          currency,
          localRevision,
          remoteRevision,
          selectedSavedRate?.source_version,
          selectedSavedRate?.note,
        ])}
        tripId={tripId}
        tripCurrency={normalizedTripCurrency}
        currency={currency}
        onCurrencyChange={selectCurrency}
        availableCurrencies={availableCurrencies}
        selectedSavedRate={selectedSavedRate}
        canEdit={canEdit}
        busy={busy}
        setBusy={setBusy}
        refresh={refresh}
      />
      <div>
        <h4 className="m-0 text-body font-semibold text-content">{t('costs.exchangeRates.savedDefaults')}</h4>
        {rates.length === 0 ? (
          <p className="mt-2 text-caption text-content-faint">{t('costs.exchangeRates.noTripRates')}</p>
        ) : (
          <div className="mt-2 divide-y divide-edge">
            {rates.map((rate) => (
              <div key={rate.currency} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectCurrency(rate.currency)}
                  className="flex min-w-0 flex-1 items-center gap-3 py-2 text-start text-caption"
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

function RateEditor({
  rateContext,
  tripId,
  tripCurrency,
  currency,
  onCurrencyChange,
  availableCurrencies,
  selectedSavedRate,
  canEdit,
  busy,
  setBusy,
  refresh,
}: {
  rateContext: string;
  tripId: number | string;
  tripCurrency: string;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  availableCurrencies: readonly string[];
  selectedSavedRate: TripExchangeRate | undefined;
  canEdit: boolean;
  busy: boolean;
  setBusy: (busy: boolean) => void;
  refresh: () => void;
}): React.ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const savedNote = selectedSavedRate?.note ?? '';
  const [previousContext, setPreviousContext] = useState(rateContext);
  const [value, setValue] = useState<string | null>(null);
  const [note, setNote] = useState(savedNote);
  const [quote, setQuote] = useState<{ resolution: ExchangeRateResolution | null } | null>(null);
  const [preview, setPreview] = useState<ExchangeRateBatchPreview | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  if (previousContext !== rateContext) {
    setPreviousContext(rateContext);
    setValue(null);
    setNote(savedNote);
    setQuote(null);
    setPreview(null);
    setSelected(new Set());
  }

  useEffect(() => {
    let active = true;
    void exchangeRateRepo.resolve(tripId, currency).then(
      (resolution) => {
        if (active) setQuote({ resolution });
      },
      () => {
        if (active) setQuote({ resolution: null });
      }
    );
    return () => {
      active = false;
    };
  }, [currency, rateContext, tripId]);

  const resolution = quote?.resolution;
  const unavailable = resolution === null;
  const shown = value ?? (resolution ? formatDisplayRate(resolution.exchange_rate) : '');
  const storedRate = displayRateToStored(Number(shown));
  const validRate = storedRate !== null && currency !== tripCurrency;
  const inverse = Number(shown) > 0 ? Number((1 / Number(shown)).toPrecision(12)).toString() : null;

  const save = async () => {
    if (!canEdit || storedRate === null || currency === tripCurrency) return;
    setBusy(true);
    try {
      await exchangeRateRepo.saveDefault(tripId, currency, storedRate, note.trim() || null);
      toast.success(t('budget.exchangeRates.saved'));
      refresh();
    } catch {
      toast.error(t('costs.exchangeRates.toast.saveError'));
    } finally {
      setBusy(false);
    }
  };

  const makePreview = async () => {
    if (!canEdit || storedRate === null || currency === tripCurrency) return;
    setBusy(true);
    try {
      const result = await exchangeRateRepo.preview(tripId, currency, storedRate, note.trim() || null);
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
      await exchangeRateRepo.apply(
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
    <>
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <CurrencySelect
          value={currency}
          onChange={onCurrencyChange}
          availableCurrencies={availableCurrencies}
          currentCurrency={currency}
          size="md"
          style={{ width: '100%' }}
        />
        <div className="rounded-xl border border-edge bg-surface-input px-3 py-2">
          <div className="flex items-center gap-2 text-body">
            <span className="whitespace-nowrap text-content-muted">1 {currency} =</span>
            <NumericInput
              mode="decimal"
              value={shown}
              onValueChange={(next) => {
                setValue(next.replace(',', '.'));
                setPreview(null);
              }}
              disabled={!canEdit}
              placeholder={unavailable ? t('costs.exchangeRates.required') : '0'}
              className="min-w-0 flex-1 border-0 bg-transparent font-semibold text-content outline-none"
            />
            <span className="whitespace-nowrap text-content-muted">{tripCurrency}</span>
          </div>
          {inverse && (
            <p className="m-0 mt-1 text-caption text-content-faint">
              {t('costs.exchangeRates.inverse', {
                tripCurrency: tripCurrency,
                rate: inverse,
                currency,
              })}
            </p>
          )}
        </div>
      </div>

      <RateQuoteDetails resolution={resolution} selectedSavedRate={selectedSavedRate} />

      {canEdit && (
        <>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={500}
            placeholder={t('costs.exchangeRates.notePlaceholder')}
            className="w-full rounded-xl border border-edge bg-surface-input px-3 py-2 text-body text-content"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              disabled={!validRate || busy}
              onClick={() => void save()}
              className="rounded-lg border border-edge px-3 py-2 text-caption font-semibold text-content disabled:opacity-40"
            >
              {t('costs.exchangeRates.saveDefault')}
            </button>
            <button
              type="button"
              disabled={!validRate || busy}
              onClick={() => void makePreview()}
              className="rounded-lg bg-content px-3 py-2 text-caption font-semibold text-surface disabled:opacity-40"
            >
              {t('costs.exchangeRates.previewChanges')}
            </button>
          </div>
        </>
      )}

      {preview && (
        <div className="bg-surface-subtle rounded-xl border border-edge p-3">
          <p className="m-0 text-caption font-semibold text-content">{t('budget.exchangeRates.previewTitle')}</p>
          <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
            {preview.rows.length === 0 && (
              <p className="text-caption text-content-faint">{t('costs.exchangeRates.noMatchingItems')}</p>
            )}
            {preview.rows.map((row) => {
              const key = `${row.type}:${row.id}`;
              return (
                <label
                  key={key}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-edge px-2 py-2 text-caption text-content-muted"
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
                    {row.old_trip_value === null
                      ? t('costs.exchangeRates.awaitingConversion')
                      : row.old_trip_value.toPrecision(6)}{' '}
                    → {row.new_trip_value.toPrecision(6)}
                  </span>
                </label>
              );
            })}
          </div>
          {canEdit && (
            <button
              type="button"
              disabled={busy || selected.size === 0}
              onClick={() => void apply()}
              className="mt-3 rounded-lg bg-content px-3 py-2 text-caption font-semibold text-surface disabled:opacity-40"
            >
              {t('costs.exchangeRates.applyItems', { count: selected.size })}
            </button>
          )}
        </div>
      )}
    </>
  );
}

function RateQuoteDetails({
  resolution,
  selectedSavedRate,
}: {
  resolution?: ExchangeRateResolution | null;
  selectedSavedRate?: TripExchangeRate;
}) {
  const { t, locale } = useTranslation();
  const unavailable = resolution === null;
  const date = (valueToFormat?: string | null) => {
    if (!valueToFormat) return null;
    const parsed = new Date(valueToFormat);
    return Number.isNaN(parsed.getTime()) ? valueToFormat : parsed.toLocaleString(locale);
  };

  return (
    <div className="rounded-xl border border-edge bg-surface-secondary p-3 text-caption text-content-muted">
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
  );
}

export function ExchangeRateDialog(props: React.ComponentProps<typeof ExchangeRateManager> & { onClose: () => void }) {
  const { onClose, ...manager } = props;
  const { t } = useTranslation();
  const titleId = useId();
  return (
    <DialogShell onClose={onClose} labelledBy={titleId} header={
      <DialogHeader labelId={titleId} onClose={onClose} tint={NEUTRAL_TINT}
        title={t('costs.exchangeRates.title')} tile={<DialogTile><ArrowLeftRight size={20} /></DialogTile>} />
    }>
      <ExchangeRateManager {...manager} />
    </DialogShell>
  );
}
