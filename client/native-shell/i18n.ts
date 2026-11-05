import { SUPPORTED_LANGUAGE_CODES } from '@trek/shared/i18n'
import type { TranslationStrings } from '@trek/shared/i18n'

// Only the native strings of every locale, not the whole UI: this page ships
// inside the app binary and shows three screens.
const bundles = import.meta.glob<TranslationStrings>('../../shared/src/i18n/*/native.ts', { eager: true, import: 'default' })

function bundleFor(code: string): TranslationStrings | undefined {
  return bundles[`../../shared/src/i18n/${code}/native.ts`]
}

export function pickLocale(preferred: readonly string[]): string {
  for (const lang of preferred) {
    const lower = lang.toLowerCase()
    if (lower === 'pt-br') return 'br'
    if (lower.startsWith('zh-tw') || lower.startsWith('zh-hk') || lower.startsWith('zh-hant')) return 'zh-TW'
    if (lower.startsWith('el')) return 'gr'
    const prefix = lower.split('-')[0]
    const match = SUPPORTED_LANGUAGE_CODES.find((code) => code.toLowerCase() === lower || code === prefix)
    if (match) return match
  }
  return 'en'
}

export function translator(code: string) {
  const strings = bundleFor(code) ?? {}
  const fallback = bundleFor('en') ?? {}
  return (key: string, params: Record<string, string> = {}): string => {
    const template = strings[key] ?? fallback[key] ?? key
    return typeof template === 'string'
      ? template.replace(/\{(\w+)\}/g, (whole, name: string) => params[name] ?? whole)
      : key
  }
}
