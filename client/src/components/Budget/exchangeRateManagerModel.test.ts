import { describe, expect, it } from 'vitest';

import { chooseInitialRateCurrency } from './exchangeRateManagerModel';

describe('chooseInitialRateCurrency', () => {
  it('prefers the first pinned currency that is used or saved in the trip', () => {
    expect(
      chooseInitialRateCurrency({
        tripCurrency: 'HKD',
        commonCurrencies: ['JPY', 'USD'],
        usedCurrencies: ['USD', 'USD'],
        savedCurrencies: ['JPY'],
      })
    ).toBe('JPY');
  });

  it('uses frequency with an alphabetical tie-break, then a saved rate', () => {
    expect(
      chooseInitialRateCurrency({
        tripCurrency: 'HKD',
        commonCurrencies: [],
        usedCurrencies: ['USD', 'EUR', 'EUR', 'USD'],
        savedCurrencies: ['JPY'],
      })
    ).toBe('EUR');
    expect(
      chooseInitialRateCurrency({
        tripCurrency: 'HKD',
        commonCurrencies: [],
        usedCurrencies: [],
        savedCurrencies: ['JPY', 'USD'],
      })
    ).toBe('JPY');
  });

  it('falls back to USD, or EUR when the trip itself uses USD', () => {
    const empty = { commonCurrencies: [], usedCurrencies: [], savedCurrencies: [] };
    expect(chooseInitialRateCurrency({ tripCurrency: 'HKD', ...empty })).toBe('USD');
    expect(chooseInitialRateCurrency({ tripCurrency: 'USD', ...empty })).toBe('EUR');
  });
});
