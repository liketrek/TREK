import { useEffect } from 'react';
import { useNativeCapabilities } from '../../native/capabilities';
import { isNativeApp, isNativeIos } from '../../native/platform';
import { reportNativeFailure } from '../../native/reportFailure';
import { TrekShell } from '../../native/trekShell';
import { hasOpenOverlay, useHasOpenOverlay } from '../overlayStack';
import { findShortcut, toNativeCommand, useShortcutRegistry } from './shortcuts';

/**
 * Whether a modal is in front of the page: a sheet (it registers on the overlay
 * stack) or any other dialog that marks itself aria-modal. The page's shortcuts
 * wait behind it. ⌘[ while a reservation was being edited used to leave the trip
 * and drop the form without the "discard changes?" a tap on the scrim asks.
 */
function modalOpen(): boolean {
  if (hasOpenOverlay()) return true;
  // A dialog kept mounted while closed (the assistant's) is hidden, not gone.
  return Array.from(document.querySelectorAll('[aria-modal="true"]')).some((el) => !el.closest('[hidden]'));
}

/**
 * Answers the touch shell's keyboard shortcuts (useShortcuts), once for every
 * screen, in the app only. A browser keeps its own keys: there the touch shell
 * is a phone layout, and Ctrl+1 is a tab switch and Alt+← is Back.
 *
 * The binary takes the shortcuts over as native key commands when it can
 * (feature keyCommands): on iOS they show in the overlay a held ⌘ shows and in
 * the iPadOS menu bar, on Android in the system's keyboard shortcuts list. The
 * page then leaves those keys alone, so nothing runs twice. Only a shell that
 * has the feature reports it, so the feature alone decides, whatever the
 * platform. An older binary without it leaves every key to the page.
 *
 * While a sheet or dialog is open none of them run: the page listens to
 * nothing and the app's list is emptied, so a shortcut can neither navigate
 * away under an unsaved form nor open a second editor over it.
 */
export default function MKeyboardHost() {
  const lists = useShortcutRegistry((s) => s.lists);
  const { caps } = useNativeCapabilities();
  const app = isNativeApp();
  const native = app && caps.features.includes('keyCommands');
  const blocked = useHasOpenOverlay();

  useEffect(() => {
    if (!app) return;
    const apple = isNativeIos();
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || modalOpen()) return;
      const all = lists.map((l) => l.shortcuts);
      const hit = findShortcut(e, native ? all.map((l) => l.filter((s) => !s.mod && !s.ctrl)) : all, apple);
      if (!hit) return;
      e.preventDefault();
      hit.run();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lists, native, app]);

  useEffect(() => {
    if (!native) return;
    const commands = blocked
      ? []
      : lists.flatMap((l) => l.shortcuts.filter((s) => s.mod || s.ctrl).map((s) => toNativeCommand(l.owner, s)));
    TrekShell.setKeyCommands({ commands }).catch(reportNativeFailure);
  }, [lists, native, blocked]);

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    let remove: (() => Promise<void>) | null = null;
    TrekShell.addListener('keyCommand', ({ id }) => {
      // A command can still arrive from a list sent before a dialog opened.
      if (modalOpen()) return;
      const at = id.indexOf(':');
      const owner = id.slice(0, at);
      const list = useShortcutRegistry.getState().lists.find((l) => l.owner === owner);
      list?.shortcuts.find((s) => s.id === id.slice(at + 1))?.run();
    })
      .then((handle) => {
        if (cancelled) void handle.remove();
        else remove = handle.remove;
      })
      .catch(reportNativeFailure);
    return () => {
      cancelled = true;
      if (remove) void remove();
    };
  }, [native]);

  return null;
}
