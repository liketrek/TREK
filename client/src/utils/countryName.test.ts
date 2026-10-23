// FE-UTIL-COUNTRYNAME-001 to FE-UTIL-COUNTRYNAME-002
import { describe, expect, it } from 'vitest';

import { countryNamer } from './countryName';

const countryName = (code: string, language: string) => countryNamer(language)(code);

describe('countryName', () => {
  it('FE-UTIL-COUNTRYNAME-001: a code reads as the country in the reader language, whatever its case', () => {
    expect(countryName('JP', 'en')).toBe('Japan');
    expect(countryName('fr', 'de')).toBe('Frankreich');
    const name = countryNamer('es');
    expect(name('DE')).toBe('Alemania');
  });

  it('FE-UTIL-COUNTRYNAME-002: something that is no country code stays as it came', () => {
    expect(countryName('JPN', 'en')).toBe('JPN');
    expect(countryName('', 'en')).toBe('');
    expect(countryName('JP', 'not-a-language')).toBe('Japan');
  });
});
