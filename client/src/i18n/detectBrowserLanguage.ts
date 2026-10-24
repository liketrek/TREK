import { SUPPORTED_LANGUAGES } from '@trek/shared';

// Its own module so the settings store can run it at startup without importing
// the translation context, which imports the store.

// Detects the user's preferred language from browser/OS settings.
// Returns null if no supported language matches.
export function detectBrowserLanguage(): string | null {
  if (typeof navigator === 'undefined') return null;
  const browserLangs = navigator.languages?.length
    ? navigator.languages
    : navigator.language
      ? [navigator.language]
      : [];
  const supported = SUPPORTED_LANGUAGES.map((l) => l.value);

  for (const lang of browserLangs) {
    const exactMatch = supported.find((s) => s.toLowerCase() === lang.toLowerCase());
    if (exactMatch) return exactMatch;

    // pt-BR has no exact match (our code is 'br'), so map it explicitly.
    // pt-PT and bare 'pt' are NOT mapped — they fall through to null.
    if (lang.toLowerCase() === 'pt-br') return 'br';

    const prefix = lang.split('-')[0]?.toLowerCase();
    const prefixMatch = supported.find((s) => s.toLowerCase() === prefix);
    if (prefixMatch) return prefixMatch;
  }

  return null;
}
