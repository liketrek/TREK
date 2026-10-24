import { getIntlLanguage } from '@trek/shared';

/**
 * Country names in the reader's language, from ISO alpha-2 codes. A namer is
 * built once per language (the caller keeps it, a component in a memo) and
 * answers the code itself where the runtime knows no name or the code is
 * none, so a card never shows an empty label.
 */
export function countryNamer(language: string): (code: string) => string {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames([getIntlLanguage(language)], { type: 'region' });
  } catch {
    names = null;
  }
  return (code) => {
    const upper = code.toUpperCase();
    if (!names || !/^[A-Z]{2}$/.test(upper)) return code;
    try {
      return names.of(upper) ?? code;
    } catch {
      return code;
    }
  };
}
