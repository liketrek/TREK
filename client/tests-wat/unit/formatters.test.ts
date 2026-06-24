// Currency/location formatter branches the upstream Vitest suite doesn't cover.
import {
  currencyDecimals,
  currencyLocale,
  formatMoney,
  formatLocationName,
  dayTotalCost,
} from '../../src/utils/formatters';

describe('currencyDecimals', () => {
  it('uses 0 decimals for zero-decimal currencies and 2 otherwise', () => {
    expect(currencyDecimals('JPY')).toBe(0);
    expect(currencyDecimals('HUF')).toBe(0);
    expect(currencyDecimals('EUR')).toBe(2);
    expect(currencyDecimals('usd')).toBe(2);
  });
});

describe('currencyLocale', () => {
  it('maps known currencies to their home locale and falls back to en-US', () => {
    expect(currencyLocale('EUR')).toBe('de-DE');
    expect(currencyLocale('USD')).toBe('en-US');
    expect(currencyLocale('XYZ')).toBe('en-US');
    expect(currencyLocale('')).toBe('en-US');
  });
});

describe('formatMoney', () => {
  it('formats EUR in its German home convention regardless of app locale', () => {
    const out = formatMoney(1234.56, 'EUR', 'en-US');
    expect(out).toContain('1.234,56');
    expect(out).toContain('€');
  });

  it('formats USD with $ and comma grouping', () => {
    const out = formatMoney(1234.56, 'USD', 'de-DE');
    expect(out).toContain('$');
    expect(out).toContain('1,234.56');
  });

  it('rounds zero-decimal currencies (JPY) to whole units', () => {
    const out = formatMoney(1234.56, 'JPY', 'en-US');
    expect(out).toContain('1,235');
    expect(out).not.toMatch(/\d[.,]\d{2}\b/);
  });

  it('falls back to "<number> CODE" for a structurally invalid currency code', () => {
    expect(formatMoney(1000, 'E', 'en-US')).toBe('1,000.00 E'); // 'E' isn't a valid ISO code → Intl throws
  });
});

describe('formatLocationName', () => {
  it('returns an empty string for nullish/empty input', () => {
    expect(formatLocationName(null)).toBe('');
    expect(formatLocationName(undefined)).toBe('');
    expect(formatLocationName('')).toBe('');
  });

  it('passes short names (<=3 parts) through untouched', () => {
    expect(formatLocationName('Vienna, Austria')).toBe('Vienna, Austria');
  });

  it('collapses a verbose Nominatim string to name + postcode + country', () => {
    expect(formatLocationName('Eiffel Tower, 5, Avenue Anatole, Paris, France, 75007')).toBe('Eiffel Tower, 75007, France');
  });

  it('collapses to name + country when there is no trailing postcode, dropping dupes', () => {
    expect(formatLocationName('Louvre, Rue de Rivoli, 1st Arrondissement, Paris, France')).toBe('Louvre, France');
  });
});

describe('dayTotalCost', () => {
  it('sums the assigned place prices for the day', () => {
    const assignments = { '1': [{ place: { price: 10 } }, { place: { price: 5 } }] } as never;
    expect(dayTotalCost(1, assignments, 'EUR')).toBe('15 EUR');
  });

  it('returns null when the day has no priced assignments', () => {
    expect(dayTotalCost(2, {} as never, 'EUR')).toBeNull();
  });
});
