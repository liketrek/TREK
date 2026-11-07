import { useEffect, useRef } from 'react';
import { useShortcutRegistry, type Shortcut } from './shortcuts';

/**
 * Registers a screen's keyboard shortcuts while it is mounted (MKeyboardHost
 * answers them). The list may be rebuilt on every render: the registry only
 * changes when a shortcut's id, name or keys do, and pressing one always runs
 * the newest handler.
 */
export function useShortcuts(owner: string, shortcuts: Shortcut[]): void {
  const latest = useRef(shortcuts);
  useEffect(() => {
    latest.current = shortcuts;
  });
  const signature = shortcuts.map((s) => [s.id, s.title, s.key, s.mod, s.shift, s.alt, s.ctrl].join('|')).join('\n');
  const setList = useShortcutRegistry((s) => s.set);
  const remove = useShortcutRegistry((s) => s.remove);
  // Re-registered when the signature changes, never for a new handler alone:
  // each registered shortcut runs whatever handler is newest when pressed.
  useEffect(() => {
    setList(
      owner,
      latest.current.map((s) => ({ ...s, run: () => latest.current.find((x) => x.id === s.id)?.run() }))
    );
  }, [owner, signature, setList]);
  useEffect(() => () => remove(owner), [owner, remove]);
}
