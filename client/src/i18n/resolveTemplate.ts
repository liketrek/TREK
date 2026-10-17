import en from '@trek/shared/i18n/en'
import { resolvePluralKey } from '@trek/shared'
import type { TranslationStrings } from '@trek/shared/i18n'

/**
 * The template a key reads as. A numeric `count` (or `n`) picks the plural
 * form the language's own rule selects (see `@trek/shared` plural helpers):
 * `places.count.one`, `.few`, ... and the key itself as the general form.
 * The active locale is asked with its rule first; English, with English's,
 * only when the locale has none of the key's forms. A count that arrives as
 * text (in-app notification params are strings) counts when it is a plain
 * whole number.
 */
export function resolveTemplate(
  strings: TranslationStrings,
  intlLanguage: string,
  key: string,
  params?: Record<string, string | number>,
): string {
  const count = asCount(params?.count ?? params?.n)
  if (count !== undefined) {
    const own = resolvePluralKey(strings, key, count, intlLanguage)
    if (own) return strings[own] as string
    const fallback = resolvePluralKey(en, key, count, 'en')
    if (fallback) return en[fallback] as string
    return key
  }
  return (strings[key] ?? en[key] ?? key) as string
}

function asCount(raw: string | number | undefined): number | undefined {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined
  if (typeof raw === 'string' && /^\d+$/.test(raw)) return Number(raw)
  return undefined
}
