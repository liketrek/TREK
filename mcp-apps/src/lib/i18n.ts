/**
 * The widgets' strings: shared's `mcpApps` domain file of every locale and
 * nothing else, since the whole locale (help pages included) would make each
 * widget document megabytes. The host names its locale as a BCP-47 tag; TREK's
 * own codes differ for two languages ('br' is pt-BR, 'gr' is el).
 */
type Strings = Record<string, string>;

const modules = import.meta.glob<{ default: Strings }>('../../../shared/src/i18n/*/mcpApps.ts', { eager: true });

const STRINGS: Record<string, Strings> = Object.fromEntries(
  Object.entries(modules).map(([file, mod]) => [file.split('/').at(-2) ?? '', mod.default])
);

/** BCP-47 tags whose TREK code is not their language subtag. */
const TAG_TO_CODE: Record<string, string> = {
  pt: 'br',
  el: 'gr',
  'zh-tw': 'zh-TW',
  'zh-hant': 'zh-TW',
  'zh-hk': 'zh-TW',
};

/** The TREK language a host locale reads in, English when TREK has none for it. */
export function trekLanguage(hostLocale: string | undefined): string {
  if (!hostLocale) return 'en';
  const tag = hostLocale.toLowerCase();
  const [language, region] = tag.split('-');
  const candidates = [
    TAG_TO_CODE[tag],
    region ? TAG_TO_CODE[`${language}-${region}`] : undefined,
    TAG_TO_CODE[language ?? ''],
    language,
  ];
  return candidates.find((code): code is string => !!code && code in STRINGS) ?? 'en';
}

export type Translate = (key: string) => string;

/** A lookup for one language that falls back to English, then to the key itself. */
export function translator(language: string): Translate {
  const strings = STRINGS[language] ?? {};
  const english = STRINGS.en ?? {};
  return (key) => strings[key] ?? english[key] ?? key;
}

/** Whether the language reads right to left. */
export function isRtl(language: string): boolean {
  return language === 'ar' || language === 'he';
}
