import { useEffect } from 'react';
import { useNativeCapabilities } from '../../native/capabilities';
import { isNativeIos } from '../../native/platform';
import { reportNativeFailure } from '../../native/reportFailure';
import { TrekShell } from '../../native/trekShell';
import { findShortcut, toNativeCommand, useShortcutRegistry } from './shortcuts';

/**
 * Answers the touch shell's keyboard shortcuts (useShortcuts), once for every
 * screen. In a browser it listens for the keys itself. In the app the binary
 * takes them over as native key commands when it can (feature keyCommands),
 * which puts them in the overlay a held ⌘ shows and in the iPadOS menu bar;
 * the page then leaves those keys alone, so nothing runs twice.
 */
export default function MKeyboardHost() {
  const lists = useShortcutRegistry((s) => s.lists);
  const { caps } = useNativeCapabilities();
  const native = isNativeIos() && caps.features.includes('keyCommands');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing) return;
      const all = lists.map((l) => l.shortcuts);
      const hit = findShortcut(e, native ? all.map((l) => l.filter((s) => !s.mod && !s.ctrl)) : all);
      if (!hit) return;
      e.preventDefault();
      hit.run();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lists, native]);

  useEffect(() => {
    if (!native) return;
    const commands = lists.flatMap((l) =>
      l.shortcuts.filter((s) => s.mod || s.ctrl).map((s) => toNativeCommand(l.owner, s))
    );
    TrekShell.setKeyCommands({ commands }).catch(reportNativeFailure);
  }, [lists, native]);

  useEffect(() => {
    if (!native) return;
    let cancelled = false;
    let remove: (() => Promise<void>) | null = null;
    TrekShell.addListener('keyCommand', ({ id }) => {
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
