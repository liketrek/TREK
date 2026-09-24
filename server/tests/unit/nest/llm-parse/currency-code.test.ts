import { describe, it, expect } from 'vitest';
import { toIsoCurrency } from '../../../../src/nest/llm-parse/currency-code';

describe('toIsoCurrency', () => {
  it('keeps an ISO 4217 code in any case and spacing', () => {
    expect(toIsoCurrency('EUR')).toBe('EUR');
    expect(toIsoCurrency('eur')).toBe('EUR');
    expect(toIsoCurrency('  chf ')).toBe('CHF');
    expect(toIsoCurrency('ALL')).toBe('ALL');
  });

  it('reads a value that starts with a real code as that code (#2477)', () => {
    expect(toIsoCurrency('EURials')).toBe('EUR');
    expect(toIsoCurrency('Euros')).toBe('EUR');
    expect(toIsoCurrency('EUR 89,35')).toBe('EUR');
  });

  it('maps a currency symbol that stands alone', () => {
    expect(toIsoCurrency('€')).toBe('EUR');
    expect(toIsoCurrency('£')).toBe('GBP');
    expect(toIsoCurrency('¥')).toBe('JPY');
    expect(toIsoCurrency(' $ ')).toBe('USD');
  });

  it('answers undefined for anything that is not a currency it can name', () => {
    // The lek is ALL; LEK is no code, and its prefix is none either.
    expect(toIsoCurrency('LEK')).toBeUndefined();
    expect(toIsoCurrency('XYZ')).toBeUndefined();
    // A dollar with a country in front is not guessed as USD.
    expect(toIsoCurrency('CA$')).toBeUndefined();
    expect(toIsoCurrency('US$')).toBeUndefined();
    expect(toIsoCurrency('€€')).toBeUndefined();
    expect(toIsoCurrency('')).toBeUndefined();
    expect(toIsoCurrency('   ')).toBeUndefined();
  });

  it('answers undefined for a value that is not a string', () => {
    expect(toIsoCurrency(null)).toBeUndefined();
    expect(toIsoCurrency(undefined)).toBeUndefined();
    expect(toIsoCurrency(978)).toBeUndefined();
    expect(toIsoCurrency({ code: 'EUR' })).toBeUndefined();
  });

  it('settles for the shape of a code when the runtime lists no currencies', () => {
    const none = new Set<string>();
    expect(toIsoCurrency('eur', none)).toBe('EUR');
    expect(toIsoCurrency('EURials', none)).toBe('EUR');
    expect(toIsoCurrency('XYZ', none)).toBe('XYZ');
    expect(toIsoCurrency('€', none)).toBe('EUR');
    expect(toIsoCurrency('CA$', none)).toBeUndefined();
  });
});
