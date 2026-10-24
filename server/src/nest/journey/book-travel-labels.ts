import type { BookTravelLabels } from '@trek/shared';
import { getLocaleForLanguage, SUPPORTED_LANGUAGE_CODES } from '@trek/shared/i18n';

/**
 * The words the book engine prints on travel elements (a day chip, the
 * stations heading, the summary and countries headings, the distance mark,
 * the pros and cons of a list), in the user's language, from the same locale
 * tables the Studio reads them from (`journey.ts` of each locale). The shared
 * engine takes them handed in and never reaches for a translation table.
 */

/** The book's language as the engine formats dates and names countries in, and the words above. */
export interface BookWords {
  locale: string;
  labels: BookTravelLabels;
}

const KEYS: Readonly<Record<keyof BookTravelLabels, string>> = {
  day: 'journey.studio.day',
  stations: 'journey.studio.stations',
  summary: 'journey.studio.summary',
  countries: 'journey.studio.countries',
  distance: 'journey.studio.metric.distance',
  pros: 'journey.editor.pros',
  cons: 'journey.editor.cons',
};

/** A language TREK has a table for; anything else is English. */
export function bookLanguage(value: unknown): string {
  return typeof value === 'string' && SUPPORTED_LANGUAGE_CODES.includes(value) ? value : 'en';
}

/** The strings of one locale's table, or none when it cannot be read. */
async function tableOf(language: string): Promise<Record<string, unknown>> {
  try {
    // A supported code only (bookLanguage), so the path is one of the package's own locale entries.
    const loaded: unknown = await import(`@trek/shared/i18n/${language}`);
    const table = (loaded as { default?: unknown } | null)?.default;
    return table !== null && typeof table === 'object' ? (table as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** The words in `language`, English where its table lacks one. */
export async function loadBookWords(language: string): Promise<BookWords> {
  const code = bookLanguage(language);
  const own = await tableOf(code);
  const english = code === 'en' ? own : await tableOf('en');
  const word = (key: string) => {
    const value = own[key] ?? english[key];
    return typeof value === 'string' ? value : '';
  };
  const labels: BookTravelLabels = {
    day: word(KEYS.day),
    stations: word(KEYS.stations),
    summary: word(KEYS.summary),
    countries: word(KEYS.countries),
    distance: word(KEYS.distance),
    pros: word(KEYS.pros),
    cons: word(KEYS.cons),
  };
  return { locale: getLocaleForLanguage(code), labels };
}
