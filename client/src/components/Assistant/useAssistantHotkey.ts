import { useEffect } from 'react';

import { useTranslation } from '../../i18n';
import { isApplePlatform } from '../../utils/applePlatform';

/** Whether a key press is the assistant's shortcut: ⌘K on a Mac, Ctrl+K elsewhere, either works on both. */
export function isAssistantHotkey(e: KeyboardEvent): boolean {
  return (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k';
}

/**
 * ⌘K / Ctrl+K opens or closes the assistant. A key press something else
 * already took is left alone, and so is one while a dialog is open: the
 * shortcut must not pull a window up behind a question being asked.
 */
export function useAssistantHotkey(enabled: boolean, onToggle: () => void): void {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || !isAssistantHotkey(e)) return;
      if (document.querySelector('.trek-modal-backdrop')) return;
      e.preventDefault();
      onToggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, onToggle]);
}

/** The shortcut as the keys a tooltip shows. */
export function useAssistantShortcutKeys(): string[] {
  const { t } = useTranslation();
  return isApplePlatform() ? ['⌘', 'K'] : [t('assistant.launcher.ctrlKey'), 'K'];
}
