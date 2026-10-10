import { describe, it, expect } from 'vitest'
import { pluralFormOf, pluralGroups } from '@trek/shared'
import { SUPPORTED_LANGUAGE_CODES, type TranslationStrings } from '@trek/shared/i18n'
import en from '@trek/shared/i18n/en'

// Runtime guard for the aggregated i18n bundles. `t()` resolves keys against the
// active locale's flat dot-key map (see TranslationContext), so a key that is
// present in en but missing in another locale silently falls back to English at
// runtime — easy to ship, hard to notice. This test fails loudly when any locale
// drifts away from the en key set so translators get an explicit, diagnostic list.
//
// The shared package also runs a file-level parity check (shared/scripts), but
// that one only inspects per-domain source files; this one asserts the *merged*
// export each locale actually serves to the app. The locales come from the one
// registry, so a language added there is checked here without a second list.

const NON_EN_CODES = SUPPORTED_LANGUAGE_CODES.filter((code) => code !== 'en')

// A count-bearing string's category forms (`places.count.one`, `.few`, ...)
// differ by language on purpose: Russian needs `.few` and `.many`, Japanese
// none. They are left out of the key comparison here; the shared parity CLI
// checks each locale has exactly the forms its plural rule needs.
const groups = pluralGroups(Object.keys(en))
const isVariant = (k: string) => pluralFormOf(k, groups) !== null
const enKeys = new Set(Object.keys(en).filter((k) => !isVariant(k)))

describe('i18n locale key parity', () => {
  it('covers every supported locale but en', () => {
    expect(NON_EN_CODES.length).toBeGreaterThanOrEqual(26)
  })

  it.each(NON_EN_CODES)('%s has the exact same key set as en', async (locale) => {
    const strings = ((await import(`@trek/shared/i18n/${locale}`)) as { default: TranslationStrings }).default
    const localeKeys = new Set(Object.keys(strings).filter((k) => !isVariant(k)))
    const missing = [...enKeys].filter((k) => !localeKeys.has(k))
    const extra = [...localeKeys].filter((k) => !enKeys.has(k))

    const diagnostic =
      `Locale "${locale}" key drift vs en — ` +
      `missing ${missing.length}` +
      (missing.length ? ` (${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ', …' : ''})` : '') +
      `; extra ${extra.length}` +
      (extra.length ? ` (${extra.slice(0, 10).join(', ')}${extra.length > 10 ? ', …' : ''})` : '')

    expect(missing, diagnostic).toEqual([])
    expect(extra, diagnostic).toEqual([])
  })
})
