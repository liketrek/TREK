import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import en from '@trek/shared/i18n/en'
import type { SupportedLanguageCode } from '@trek/shared'
import {
  SUPPORTED_LANGUAGES,
  getLocaleForLanguage,
  getIntlLanguage,
  isRtlLanguage,
  escapeHtml,
  sanitizeInlineHtml,
} from '@trek/shared'
import type { TranslationStrings } from '@trek/shared/i18n'

export { SUPPORTED_LANGUAGES }

// One explicit dynamic import per locale — Vite code-splits a separate chunk per locale.
// Only the active locale is fetched; en is always available synchronously as the fallback.
const localeLoaders: Record<SupportedLanguageCode, () => Promise<{ default: TranslationStrings }>> = {
  en:      () => Promise.resolve({ default: en }),
  de:      () => import('@trek/shared/i18n/de'),
  es:      () => import('@trek/shared/i18n/es'),
  fr:      () => import('@trek/shared/i18n/fr'),
  hu:      () => import('@trek/shared/i18n/hu'),
  it:      () => import('@trek/shared/i18n/it'),
  tr:      () => import('@trek/shared/i18n/tr'),
  ru:      () => import('@trek/shared/i18n/ru'),
  zh:      () => import('@trek/shared/i18n/zh'),
  'zh-TW': () => import('@trek/shared/i18n/zh-TW'),
  nl:      () => import('@trek/shared/i18n/nl'),
  id:      () => import('@trek/shared/i18n/id'),
  ar:      () => import('@trek/shared/i18n/ar'),
  br:      () => import('@trek/shared/i18n/br'),
  cs:      () => import('@trek/shared/i18n/cs'),
  pl:      () => import('@trek/shared/i18n/pl'),
  ja:      () => import('@trek/shared/i18n/ja'),
  ko:      () => import('@trek/shared/i18n/ko'),
  uk:      () => import('@trek/shared/i18n/uk'),
  gr:      () => import('@trek/shared/i18n/gr'),
  sv:      () => import('@trek/shared/i18n/sv'),
}

// Re-export pure helpers that live in shared so downstream consumers can import them
// through this module without changing their import path.
export { getLocaleForLanguage, getIntlLanguage, isRtlLanguage }

// Detects the user's preferred language from browser/OS settings.
// Returns null if no supported language matches.
export function detectBrowserLanguage(): string | null {
  if (typeof navigator === 'undefined') return null
  const browserLangs = navigator.languages?.length
    ? navigator.languages
    : navigator.language ? [navigator.language] : []
  const supported = SUPPORTED_LANGUAGES.map(l => l.value)

  for (const lang of browserLangs) {
    const exactMatch = supported.find(s => s.toLowerCase() === lang.toLowerCase())
    if (exactMatch) return exactMatch

    // pt-BR has no exact match (our code is 'br'), so map it explicitly.
    // pt-PT and bare 'pt' are NOT mapped — they fall through to null.
    if (lang.toLowerCase() === 'pt-br') return 'br'

    const prefix = lang.split('-')[0]?.toLowerCase()
    const prefixMatch = supported.find(s => s.toLowerCase() === prefix)
    if (prefixMatch) return prefixMatch
  }

  return null
}

interface TranslationContextValue {
  t: (key: string, params?: Record<string, string | number>) => string
  /**
   * HTML-aware variant of `t()`. Use ONLY when the translated template
   * legitimately contains markup (e.g. `'Turn <strong>{title}</strong> into a Journey'`).
   *
   * Defence in depth, two layers:
   *   1. Every interpolated param is HTML-escaped before substitution, so a
   *      user-controlled value like `<script>` cannot inject markup at all.
   *   2. The fully-substituted string is then passed through
   *      `sanitizeInlineHtml`, so even if a translator ships a malformed
   *      template the runtime output is still tag-restricted.
   *
   * Prefer the `<TransHtml>` component for the typical "translate + render"
   * pattern; reach for `tHtml()` directly only when you need the raw string
   * (e.g. constructing an `aria-label`).
   */
  tHtml: (key: string, params?: Record<string, string | number>) => string
  language: string
  locale: string
}

const TranslationContext = createContext<TranslationContextValue>({
  t: (k: string) => k,
  tHtml: (k: string) => k,
  language: 'en',
  locale: 'en-US',
})

interface TranslationProviderProps {
  children: ReactNode
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const language = useSettingsStore((s) => s.settings.language) || 'en'
  const [strings, setStrings] = useState<TranslationStrings>(en)

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = isRtlLanguage(language) ? 'rtl' : 'ltr'
  }, [language])

  useEffect(() => {
    const loader = localeLoaders[language as SupportedLanguageCode]
    if (!loader) return

    let cancelled = false
    loader().then(mod => {
      if (!cancelled) setStrings(mod.default)
    })
    return () => { cancelled = true }
  }, [language])

  const value = useMemo((): TranslationContextValue => {
    function t(key: string, params?: Record<string, string | number>): string {
      let val: string = (strings[key] ?? en[key] ?? key) as string
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
        })
      }
      return val
    }

    function tHtml(key: string, params?: Record<string, string | number>): string {
      let val: string = (strings[key] ?? en[key] ?? key) as string
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          // Escape BEFORE substitution so a user-controlled value with `<` or
          // `&` cannot break out of the surrounding template's markup.
          val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), escapeHtml(String(v)))
        })
      }
      // Then re-sanitise the fully-built string: even if a translator ships a
      // template with stray `<script>` or `onclick`, the rendered output is
      // restricted to the inline tag allow-list.
      return sanitizeInlineHtml(val)
    }

    return { t, tHtml, language, locale: getLocaleForLanguage(language) }
  }, [strings, language])

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>
}

export function useTranslation(): TranslationContextValue {
  return useContext(TranslationContext)
}
