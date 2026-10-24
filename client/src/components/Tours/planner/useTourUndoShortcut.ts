import { useEffect } from 'react';

interface UndoShortcut {
  /** Whether the editor is open and the viewer may change it right now. */
  enabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

/** A field with its own text history: Ctrl+Z there belongs to the field, not to the waypoints. */
function typingInto(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/**
 * Ctrl/Cmd+Z undoes and Ctrl/Cmd+Shift+Z or Ctrl+Y redoes the last waypoint
 * edit, as in most editors, while the planner is open. Left alone in a text
 * field, which keeps its own history.
 */
export function useTourUndoShortcut({ enabled, canUndo, canRedo, undo, redo }: UndoShortcut) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || !(event.ctrlKey || event.metaKey) || typingInto(event.target))
        return;
      const key = event.key.toLowerCase();
      const wantsRedo = (key === 'z' && event.shiftKey) || (key === 'y' && !event.shiftKey);
      const wantsUndo = key === 'z' && !event.shiftKey;
      if (wantsRedo && canRedo) redo();
      else if (wantsUndo && canUndo) undo();
      else return;
      event.preventDefault();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [enabled, canUndo, canRedo, undo, redo]);
}
