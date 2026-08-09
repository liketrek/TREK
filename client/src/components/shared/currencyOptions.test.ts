import { describe, expect, it } from 'vitest';
import { buildCurrencyOptions, currencyName } from './currencyOptions';

describe('buildCurrencyOptions', () => {
  it('builds CustomSelect headers, preserves common order, sorts others, and removes duplicates', () => {
    const options = buildCurrencyOptions({
      commonCurrencies: ['JPY', 'USD', 'JPY'],
      availableCurrencies: ['USD', 'EUR', 'JPY', 'EUR'],
      locale: 'en-US',
      commonLabel: 'Common currencies',
      otherLabel: 'Other currencies',
    });

    expect(options.map((option) => option.value)).toEqual([
      '__common_currencies_header__',
      'JPY',
      'USD',
      '__other_currencies_header__',
      'EUR',
    ]);
    expect(options[0]).toMatchObject({ isHeader: true, label: 'Common currencies' });
    expect(options[1]).toMatchObject({ groupLabel: 'Common currencies' });
    expect(options[4]).toMatchObject({ groupLabel: 'Other currencies' });
  });

  it('filters common currencies by the available set and keeps a legacy current value under Other', () => {
    const options = buildCurrencyOptions({
      commonCurrencies: ['USD', 'JPY'],
      availableCurrencies: ['EUR', 'USD'],
      currentCurrency: 'BGN',
      locale: 'en-US',
      commonLabel: 'Common',
      otherLabel: 'Other',
    });
    expect(options.map((option) => option.value)).toEqual([
      '__common_currencies_header__',
      'USD',
      '__other_currencies_header__',
      'BGN',
      'EUR',
    ]);
  });

  it('uses a flat list when no common currency is effective and keeps special options first', () => {
    const options = buildCurrencyOptions({
      commonCurrencies: ['JPY'],
      availableCurrencies: ['USD', 'EUR'],
      locale: 'en-US',
      commonLabel: 'Common',
      otherLabel: 'Other',
      specialOptions: [{ value: '', label: 'Trip currency' }],
    });
    expect(options.map((option) => option.value)).toEqual(['', 'EUR', 'USD']);
    expect(options.some((option) => option.isHeader)).toBe(false);
  });

  it('includes the localized currency name in labels/search and falls back to the code', () => {
    const options = buildCurrencyOptions({
      availableCurrencies: ['USD'],
      locale: 'en-US',
      commonLabel: 'Common',
      otherLabel: 'Other',
    });
    expect(options[0]?.label).toContain('USD');
    expect(options[0]?.searchLabel).toContain(currencyName('USD', 'en-US'));
    expect(currencyName('NOT-A-CURRENCY', 'not-a-locale')).toBe('NOT-A-CURRENCY');
  });
});
