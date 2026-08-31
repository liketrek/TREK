import { formatMoney } from '../../utils/formatters';
import { NumericInput } from '../shared/NumericInput';
import type { useItemExchangeRate } from './useItemExchangeRate';

type RateController = ReturnType<typeof useItemExchangeRate>;

export default function ItemExchangeRateFields({
  rate,
  currency,
  tripCurrency,
  amount,
  locale,
  t,
  mobile = false,
}: {
  rate: RateController;
  currency: string;
  tripCurrency: string;
  amount: number;
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
  mobile?: boolean;
}) {
  if (currency.toUpperCase() === tripCurrency.toUpperCase()) return null;
  const source = rate.manual
    ? t('costs.exchangeRates.manualRate')
    : t('costs.exchangeRates.suggestedLabel', {
        source: t(`costs.exchangeRates.source.${rate.suggestion?.source || 'unavailable'}`),
      });
  const converted = rate.displayRate && amount > 0 ? amount * rate.displayRate : null;
  const panelClass = mobile
    ? 'mt-2 rounded-[12px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-3 py-[9px]'
    : 'rounded-lg border border-edge bg-surface-subtle px-3 py-2';
  const muted = mobile ? 'text-m-muted' : 'text-content-muted';
  const content = mobile ? 'text-m-ink' : 'text-content';

  return (
    <div className={`${panelClass} text-xs ${muted}`}>
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap">1 {currency} =</span>
        <NumericInput
          mode="decimal"
          value={rate.value}
          onValueChange={rate.setManualValue}
          placeholder={rate.loading ? t('common.loading') : t('costs.exchangeRates.required')}
          className={`min-w-0 flex-1 border-0 bg-transparent font-semibold outline-none ${content}`}
        />
        <span className="whitespace-nowrap">{tripCurrency}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-1 text-[0.6875rem]">
        <span>{source}</span>
        {rate.suggestion?.effective_date && <span>· {rate.suggestion.effective_date}</span>}
        {rate.suggestion?.stale && <span className="text-danger">· {t('costs.exchangeRates.staleSnapshot')}</span>}
        {rate.unavailable && <span className="text-danger">· {t('costs.exchangeRates.manualRequired')}</span>}
        {converted !== null && (
          <span>
            · {formatMoney(amount, currency, locale)} ≈ {formatMoney(converted, tripCurrency, locale)}
          </span>
        )}
      </div>
      <p className="mt-1 text-[0.625rem] opacity-75">{t('costs.exchangeRates.frozenHint')}</p>
      {rate.manual && (
        <input
          value={rate.note}
          onChange={(event) => rate.setNote(event.target.value)}
          maxLength={500}
          placeholder={t('costs.exchangeRates.explicitNote')}
          className={`mt-2 w-full rounded-lg border border-edge bg-surface px-2 py-1.5 text-xs ${content}`}
        />
      )}
    </div>
  );
}
