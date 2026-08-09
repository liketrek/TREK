import { FRANKFURTER_CURRENCIES } from '@trek/shared';
import type { CSSProperties } from 'react';
import { useTranslation } from '../../i18n';
import { useSettingsStore } from '../../store/settingsStore';
import CustomSelect from './CustomSelect';
import { buildCurrencyOptions, type CurrencyOption } from './currencyOptions';

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  availableCurrencies?: readonly string[];
  currentCurrency?: string | null;
  specialOptions?: readonly CurrencyOption[];
  placeholder?: string;
  searchable?: boolean;
  style?: CSSProperties;
  size?: 'sm' | 'md';
  disabled?: boolean;
  commonCurrencies?: readonly string[];
}

export default function CurrencySelect({
  value,
  onChange,
  availableCurrencies = FRANKFURTER_CURRENCIES,
  currentCurrency = value,
  specialOptions,
  placeholder,
  searchable = true,
  style,
  size,
  disabled,
  commonCurrencies,
}: CurrencySelectProps) {
  const storedCommon = useSettingsStore((state) => state.settings.common_currencies);
  const { locale, t } = useTranslation();
  const options = buildCurrencyOptions({
    commonCurrencies: commonCurrencies ?? storedCommon ?? [],
    availableCurrencies,
    currentCurrency,
    locale,
    commonLabel: t('settings.commonCurrencies.group'),
    otherLabel: t('settings.otherCurrencies.group'),
    specialOptions,
  });

  return (
    <CustomSelect
      value={value}
      onChange={(next) => onChange(String(next))}
      options={options}
      placeholder={placeholder}
      searchable={searchable}
      style={style}
      size={size}
      disabled={disabled}
    />
  );
}
