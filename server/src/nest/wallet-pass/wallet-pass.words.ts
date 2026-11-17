import type { WalletWords } from './wallet-pass.builder';
import { getLocaleForLanguage, SUPPORTED_LANGUAGE_CODES } from '@trek/shared/i18n';

/**
 * The labels on a booking's Wallet pass, in the user's language, from the same
 * locale tables the booking forms read (`reservations.ts` of each locale), so a
 * pass says "Sitz" where the app says "Sitz". Nothing new to translate.
 */
const KEYS: Readonly<Record<Exclude<keyof WalletWords, 'locale'>, string>> = {
  departure: 'reservations.span.departure',
  arrival: 'reservations.span.arrival',
  pickup: 'reservations.span.pickup',
  dropOff: 'reservations.span.dropOff',
  checkIn: 'reservations.meta.checkIn',
  checkOut: 'reservations.meta.checkOut',
  time: 'reservations.time',
  seat: 'reservations.meta.seat',
  platform: 'reservations.meta.platform',
  flightNumber: 'reservations.meta.flightNumber',
  trainNumber: 'reservations.meta.trainNumber',
  airline: 'reservations.meta.airline',
  confirmation: 'reservations.confirmationCode',
  location: 'reservations.locationAddress',
};

/** A language TREK has a table for; anything else is English. */
export function walletLanguage(value: unknown): string {
  return typeof value === 'string' && SUPPORTED_LANGUAGE_CODES.includes(value) ? value : 'en';
}

async function tableOf(language: string): Promise<Record<string, unknown>> {
  try {
    // A supported code only (walletLanguage), so the path is one of the package's own locale entries.
    const loaded: unknown = await import(`@trek/shared/i18n/${language}`);
    const table = (loaded as { default?: unknown } | null)?.default;
    return table !== null && typeof table === 'object' ? (table as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** The words in `language`, English where its table lacks one. */
export async function loadWalletWords(language: string): Promise<WalletWords> {
  const code = walletLanguage(language);
  const own = await tableOf(code);
  const english = code === 'en' ? own : await tableOf('en');
  const word = (key: string) => {
    const value = own[key] ?? english[key];
    return typeof value === 'string' ? value : '';
  };
  const words = { locale: getLocaleForLanguage(code) } as WalletWords;
  for (const [field, key] of Object.entries(KEYS) as [Exclude<keyof WalletWords, 'locale'>, string][]) {
    words[field] = word(key);
  }
  return words;
}
