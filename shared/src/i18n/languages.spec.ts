import { getIntlLanguage, SUPPORTED_LANGUAGES } from './languages';

import { describe, expect, it } from 'vitest';

describe('getIntlLanguage', () => {
  it('maps the two codes that are not the BCP-47 tag of their language', () => {
    expect(getIntlLanguage('br')).toBe('pt-BR');
    expect(getIntlLanguage('gr')).toBe('el');
  });

  it('passes every other supported code through and falls back to English', () => {
    expect(getIntlLanguage('de')).toBe('de');
    expect(getIntlLanguage('zh-TW')).toBe('zh-TW');
    expect(getIntlLanguage('xx')).toBe('en');
  });

  it('gives Intl a tag it formats in the right language for every supported code', () => {
    for (const { value, locale } of SUPPORTED_LANGUAGES) {
      const primary = locale.split('-')[0];
      expect(new Intl.Locale(getIntlLanguage(value)).language, value).toBe(primary);
    }
  });
});
