import { useEffect, useState } from 'react';
import { getIntlLanguage } from '../../i18n';

/** A country's name in the reader's language, from its ISO code; the code itself where none is known. */
export function useCountryNames(language: string): (code: string) => string {
  const [resolver, setResolver] = useState<(code: string) => string>(() => (code: string) => code);
  useEffect(() => {
    try {
      const dn = new Intl.DisplayNames([getIntlLanguage(language)], { type: 'region' });
      setResolver(() => (code: string) => {
        try {
          return dn.of(code) || code;
        } catch {
          return code;
        }
      });
    } catch {
      /* no region names in this runtime: the codes stand */
    }
  }, [language]);
  return resolver;
}
