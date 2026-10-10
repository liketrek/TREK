import { useTranslation } from '../i18n'
import { useSettingsStore } from '../store/settingsStore'

/**
 * The language place names and addresses are asked for (#1799): the user's own
 * choice when there is one, the app's language otherwise. A German interface
 * with English names, or local names under any interface, is a real way to
 * travel; tying the two together forced one or the other.
 */
export function placeLanguage(appLanguage: string, chosen: string | undefined | null): string {
  return chosen?.trim() ? chosen.trim() : appLanguage
}

export function usePlaceLanguage(): string {
  const { language } = useTranslation()
  const chosen = useSettingsStore(s => s.settings.place_language)
  return placeLanguage(language, chosen)
}
