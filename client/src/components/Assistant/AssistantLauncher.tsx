import { Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { useTranslation } from '../../i18n';
import { assistantScopeOf } from '../../store/assistantChatKey';
import { useAssistantStore } from '../../store/assistantStore';
import Tooltip from '../shared/Tooltip';
import { useAssistantHints } from './useAssistantHints';
import { useAssistantShortcutKeys } from './useAssistantHotkey';

/** Where the floating button sits, from the window's end and bottom edges. The window grows out of it. */
export const LAUNCHER_INSET = 24;
export const LAUNCHER_SIZE = 48;

/**
 * The way into the assistant: a button in the navbar, and in the planner a
 * round one floating at the bottom end of the screen. Both open and close the
 * window; outside a trip it opens on the trip picker. Nothing shows until the
 * assistant has a connection this user can use: no setup prompt in its place.
 * The floating one carries a dot while the trip has a warning the user has
 * not been shown; opening the chat counts them as seen.
 */
export default function AssistantLauncher({
  variant,
  tripId = null,
  focusOnMount = false,
}: {
  variant: 'navbar' | 'floating';
  /** The trip the floating button stands in, for its hint dot. */
  tripId?: number | null;
  /** Takes the focus when it appears, as when the window it stands for was just closed. */
  focusOnMount?: boolean;
}) {
  const { t } = useTranslation();
  const available = useAssistantStore((s) => s.status?.available === true);
  const open = useAssistantStore((s) => s.window.open && !s.window.minimized);
  const toggle = useAssistantStore((s) => s.toggle);
  // An answer still being written in a closed window: the floating button breathes until it is opened. Only a
  // trip's chat counts: an answer still running in the Studio is not one this window opens on.
  const busy = useAssistantStore((s) =>
    !s.window.open || s.window.minimized
      ? Object.entries(s.byTrip).some(([key, c]) => c.isRunning && assistantScopeOf(Number(key)).kind === 'trip')
      : false
  );
  const keys = useAssistantShortcutKeys();
  const hints = useAssistantHints(variant === 'floating' ? tripId : null, { withStays: false });
  const floating = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focusOnMount) floating.current?.focus();
  }, [focusOnMount]);
  if (!available) return null;

  const label = t('assistant.launcher.tooltip');
  if (variant === 'navbar') {
    return (
      <Tooltip label={label} shortcut={keys}>
        <button
          type="button"
          onClick={toggle}
          aria-label={label}
          aria-pressed={open}
          className={`relative hidden h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg p-2 transition-colors sm:flex ${
            open ? 'bg-surface-selected text-content' : 'text-content-muted hover:bg-surface-hover'
          }`}
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </button>
      </Tooltip>
    );
  }

  const pointed = hints.unseenWarn > 0 ? t('assistant.launcher.withHints', { count: hints.unseenWarn }) : label;
  const openChat = () => {
    if (!open) hints.markWarnsSeen();
    toggle();
  };
  return (
    <Tooltip label={pointed} shortcut={keys} placement="top">
      <button
        ref={floating}
        type="button"
        onClick={openChat}
        aria-label={pointed}
        aria-busy={busy || undefined}
        className="trek-assistant-pop fixed z-[var(--z-nav)] flex items-center justify-center rounded-full bg-accent text-accent-text shadow-elevated transition-transform hover:scale-105 active:scale-95"
        style={{
          insetInlineEnd: LAUNCHER_INSET,
          bottom: LAUNCHER_INSET,
          width: LAUNCHER_SIZE,
          height: LAUNCHER_SIZE,
          transformOrigin: 'center',
        }}
      >
        {busy && (
          <span
            aria-hidden="true"
            className="trek-assistant-busy absolute inset-0 rounded-full border-2 border-current opacity-40"
          />
        )}
        <Sparkles size={20} aria-hidden="true" />
        {hints.unseenWarn > 0 && (
          <span
            aria-hidden="true"
            className="absolute end-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-[var(--bg-elevated)]"
          />
        )}
      </button>
    </Tooltip>
  );
}
