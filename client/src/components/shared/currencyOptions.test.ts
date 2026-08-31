import { describe, expect, it } from 'vitest';

import { buildCurrencyOptions } from './currencyOptions';

const labels = { locale: 'en', commonLabel: 'Common currencies', otherLabel: 'Other currencies' };

describe('buildCurrencyOptions', () => {
  it('keeps common currencies in personal order and groups the alphabetical remainder', () => {
    const options = buildCurrencyOptions({
      ...labels,
      commonCurrencies: ['JPY', 'USD'],
      availableCurrencies: ['USD', 'EUR', 'JPY', 'GBP'],
    });
    expect(options.map((option) => option.value)).toEqual([
      '__common_currencies_header__',
      'JPY',
      'USD',
      '__other_currencies_header__',
      'EUR',
      'GBP',
    ]);
    expect(options[1].groupLabel).toBe('Common currencies');
    expect(options[4].groupLabel).toBe('Other currencies');
  });

  it('filters unavailable pins while keeping an unsupported current legacy value selectable', () => {
    const options = buildCurrencyOptions({
      ...labels,
      commonCurrencies: ['USD', 'JPY'],
      availableCurrencies: ['EUR', 'JPY'],
      currentCurrency: 'ABC',
    });
    expect(options.map((option) => option.value)).toEqual([
      '__common_currencies_header__',
      'JPY',
      '__other_currencies_header__',
      'ABC',
      'EUR',
    ]);
  });

  it('omits group headers when no common currencies are available', () => {
    const options = buildCurrencyOptions({
      ...labels,
      commonCurrencies: [],
      availableCurrencies: ['USD', 'EUR'],
    });
    expect(options.map((option) => option.value)).toEqual(['EUR', 'USD']);
  });
});
