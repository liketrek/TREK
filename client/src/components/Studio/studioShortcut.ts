import { useTranslation } from '../../i18n';
import { isApplePlatform } from '../../utils/applePlatform';

/**
 * The keys of a Studio shortcut as the tooltip shows them: ⌘ and ⌥ on a Mac,
 * Ctrl and Alt elsewhere, always with the command key first. `alt` stands for
 * the option key so callers do not each decide how to spell it.
 */
export function shortcutKeys(apple: boolean, ctrl: string, keys: readonly string[]): string[] {
  const mod = apple ? '⌘' : ctrl;
  return [mod, ...keys.map((k) => (k === 'alt' ? (apple ? '⌥' : 'Alt') : k))];
}

/** `keys('⇧', 'G')` reads as ⌘ ⇧ G or Ctrl ⇧ G, for the platform the page runs on. */
export function useStudioShortcut(): (...keys: string[]) => string[] {
  const { t } = useTranslation();
  const apple = isApplePlatform();
  return (...keys) => shortcutKeys(apple, t('assistant.launcher.ctrlKey'), keys);
}
