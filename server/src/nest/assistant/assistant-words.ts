import { resolvePluralKey } from '@trek/shared';
import { getIntlLanguage, SUPPORTED_LANGUAGE_CODES } from '@trek/shared/i18n';

/**
 * The few words the assistant writes itself, without a model (the line that
 * answers an attached file, the chips under it, a tour type's name), in the
 * user's language from the shared locale tables, English where a table has
 * no such key.
 */

type Table = Readonly<Record<string, unknown>>;

/** The supported code a request's locale reads as: itself, its language, or English. */
export function supportedLocale(locale: string): string {
  if (SUPPORTED_LANGUAGE_CODES.includes(locale)) return locale;
  const language = locale.split('-')[0] ?? 'en';
  return SUPPORTED_LANGUAGE_CODES.includes(language) ? language : 'en';
}

/**
 * The BCP 47 tag of a request's locale, for Intl: a TREK code reads as its
 * language ('br' is Brazilian Portuguese here, Breton to Intl), anything else
 * is passed through.
 */
export function intlLocale(locale: string): string {
  return SUPPORTED_LANGUAGE_CODES.includes(locale) ? getIntlLanguage(locale) : locale;
}

/** The words of one locale's table, or none when it cannot be read. */
export async function localeTable(code: string): Promise<Table> {
  try {
    // A supported code only, so the path is one of the package's own locale entries.
    const loaded: unknown = await import(`@trek/shared/i18n/${code}`);
    const words = (loaded as { default?: unknown } | null)?.default;
    return words !== null && typeof words === 'object' ? (words as Table) : {};
  } catch {
    return {};
  }
}

function filled(text: string, params: Readonly<Record<string, string | number>>): string {
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole));
}

/** One locale's words, with English behind them. */
export class AssistantWords {
  private constructor(
    private readonly code: string,
    private readonly own: Table,
    private readonly english: Table,
  ) {}

  static async of(locale: string): Promise<AssistantWords> {
    const code = supportedLocale(locale);
    const [own, english] = await Promise.all([localeTable(code), code === 'en' ? null : localeTable('en')]);
    return new AssistantWords(code, own, english ?? own);
  }

  /**
   * The string under `key` with its params filled in, as the client's t()
   * reads it: a numeric `count` picks the form of a plural group the
   * language takes for it. The key itself where no table has it. Named t()
   * so lint:i18n-keys sees the keys the server writes with.
   */
  t(key: string, params: Readonly<Record<string, string | number>> = {}): string {
    const { count } = params;
    if (typeof count !== 'number') {
      const value = this.own[key] ?? this.english[key];
      return filled(typeof value === 'string' ? value : key, params);
    }
    const own = resolvePluralKey(this.own, key, count, getIntlLanguage(this.code));
    if (own) return filled(String(this.own[own]), params);
    const english = resolvePluralKey(this.english, key, count, 'en');
    return english ? filled(String(this.english[english]), params) : key;
  }
}
