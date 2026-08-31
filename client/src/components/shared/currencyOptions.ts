import { FRANKFURTER_CURRENCIES } from '@trek/shared';

export interface CurrencyOption {
  value: string;
  label: string;
  isHeader?: boolean;
  searchLabel?: string;
  groupLabel?: string;
}

interface BuildCurrencyOptionsArgs {
  commonCurrencies?: readonly string[];
  availableCurrencies?: readonly string[];
  currentCurrency?: string | null;
  locale: string;
  commonLabel: string;
  otherLabel: string;
  specialOptions?: readonly CurrencyOption[];
}

export function currencyName(code: string, locale: string): string {
  try {
    return new Intl.DisplayNames([locale], { type: 'currency' }).of(code) || code;
  } catch {
    return code;
  }
}

export function currencyOption(code: string, locale: string): CurrencyOption {
  const normalized = code.toUpperCase();
  const name = currencyName(normalized, locale);
  return {
    value: normalized,
    label: name === normalized ? normalized : `${normalized} — ${name}`,
    searchLabel: `${normalized} ${name}`,
  };
}

export function buildCurrencyOptions({
  commonCurrencies = [],
  availableCurrencies = FRANKFURTER_CURRENCIES,
  currentCurrency,
  locale,
  commonLabel,
  otherLabel,
  specialOptions = [],
}: BuildCurrencyOptionsArgs): CurrencyOption[] {
  const available = [...new Set(availableCurrencies.map((code) => code.toUpperCase()))].sort();
  const availableSet = new Set(available);
  const common = commonCurrencies
    .map((code) => code.toUpperCase())
    .filter((code, index, codes) => availableSet.has(code) && codes.indexOf(code) === index);
  const commonSet = new Set(common);
  const current = (currentCurrency || '').toUpperCase();
  const other = available.filter((code) => !commonSet.has(code));

  if (current && !availableSet.has(current) && !other.includes(current)) other.push(current);
  other.sort();

  if (common.length === 0) return [...specialOptions, ...other.map((code) => currencyOption(code, locale))];

  return [
    ...specialOptions,
    { value: '__common_currencies_header__', label: commonLabel, isHeader: true },
    ...common.map((code) => ({ ...currencyOption(code, locale), groupLabel: commonLabel })),
    { value: '__other_currencies_header__', label: otherLabel, isHeader: true },
    ...other.map((code) => ({ ...currencyOption(code, locale), groupLabel: otherLabel })),
  ];
}
