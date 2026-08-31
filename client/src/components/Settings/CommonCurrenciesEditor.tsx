import { COMMON_CURRENCIES_MAX, FRANKFURTER_CURRENCIES } from '@trek/shared';
import { ArrowDown, ArrowUp, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n';
import CustomSelect from '../shared/CustomSelect';
import { useToast } from '../shared/Toast';
import { currencyOption } from '../shared/currencyOptions';

interface CommonCurrenciesEditorProps {
  value: readonly string[];
  onSave: (value: string[]) => Promise<string[] | void>;
  onReset?: () => Promise<string[]>;
  mobile?: boolean;
}

export default function CommonCurrenciesEditor({
  value,
  onSave,
  onReset,
  mobile = false,
}: CommonCurrenciesEditorProps) {
  const { locale, t } = useTranslation();
  const toast = useToast();
  const [currencies, setCurrencies] = useState<string[]>([...value]);
  const [saving, setSaving] = useState(false);

  useEffect(() => setCurrencies([...value]), [value]);

  const persist = async (next: string[]) => {
    const previous = currencies;
    setCurrencies(next);
    setSaving(true);
    try {
      const saved = await onSave(next);
      if (saved) setCurrencies(saved);
    } catch (error) {
      setCurrencies(previous);
      toast.error(error instanceof Error ? error.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= currencies.length) return;
    const next = [...currencies];
    [next[index], next[target]] = [next[target], next[index]];
    void persist(next);
  };

  const remaining = FRANKFURTER_CURRENCIES.filter((code) => !currencies.includes(code)).map((code) =>
    currencyOption(code, locale)
  );

  return (
    <div className="flex flex-col gap-2" data-testid="common-currencies-editor">
      <CustomSelect
        value=""
        onChange={(next) => void persist([...currencies, String(next)])}
        options={remaining}
        placeholder={
          currencies.length >= COMMON_CURRENCIES_MAX
            ? t('settings.commonCurrencies.limit', { count: COMMON_CURRENCIES_MAX })
            : t('settings.commonCurrencies.add')
        }
        searchable
        disabled={saving || currencies.length >= COMMON_CURRENCIES_MAX}
        style={{ maxWidth: mobile ? undefined : 360 }}
      />
      {currencies.map((code, index) => (
        <div key={code} className="flex items-center gap-2 rounded-lg border border-edge bg-surface-input px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm">{currencyOption(code, locale).label}</span>
          <button
            type="button"
            disabled={saving || index === 0}
            onClick={() => move(index, -1)}
            aria-label={t('settings.commonCurrencies.moveUp', { currency: code })}
            className="text-content-muted disabled:opacity-30"
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            disabled={saving || index === currencies.length - 1}
            onClick={() => move(index, 1)}
            aria-label={t('settings.commonCurrencies.moveDown', { currency: code })}
            className="text-content-muted disabled:opacity-30"
          >
            <ArrowDown size={15} />
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist(currencies.filter((item) => item !== code))}
            aria-label={t('settings.commonCurrencies.remove', { currency: code })}
            className="text-content-muted disabled:opacity-30"
          >
            <X size={15} />
          </button>
        </div>
      ))}
      <div className="flex gap-3 text-xs">
        {currencies.length > 0 && (
          <button
            type="button"
            disabled={saving}
            onClick={() => void persist([])}
            className="text-content-faint underline"
          >
            {t('settings.commonCurrencies.clear')}
          </button>
        )}
        {onReset && (
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              const previous = currencies;
              setSaving(true);
              try {
                setCurrencies(await onReset());
              } catch (error) {
                setCurrencies(previous);
                toast.error(error instanceof Error ? error.message : t('common.error'));
              } finally {
                setSaving(false);
              }
            }}
            className="inline-flex items-center gap-1 text-content-faint underline"
          >
            <RotateCcw size={12} /> {t('settings.commonCurrencies.reset')}
          </button>
        )}
      </div>
      <p className="m-0 text-xs text-content-faint">
        {t('settings.commonCurrencies.count', { count: currencies.length, max: COMMON_CURRENCIES_MAX })}
      </p>
    </div>
  );
}
