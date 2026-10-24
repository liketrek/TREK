import type { BookSpread } from '@trek/shared';
import { useEffect } from 'react';

import { useStudioStore } from '../../store/studioStore';

/**
 * The sheet's keyboard.
 *
 * Every shortcut here is one a design tool has taught people already, and none
 * of them takes a key away from the browser while somebody is typing: in a
 * field, a text area or a text being edited on the page, the keys are the
 * field's. Nor from a control that takes the key itself: a gradient stop,
 * the angle dial or a row of the layers tree prevents its default, and the
 * assistant's window stops its keys from reaching the page, so Delete on a
 * focused stop removes the stop, not the shape. Undo and redo are the Studio
 * page's own (useJourneyStudio.ts), and every action below is one undo step
 * there.
 *
 * - Delete or Backspace: remove what is selected and not locked.
 * - Ctrl+C, Ctrl+V: copy and paste elements, onto any page (#2316).
 * - Ctrl+D: duplicate. Ctrl+A: select everything on the page.
 * - Ctrl+G, Ctrl+Shift+G: group and ungroup.
 * - Ctrl+Alt+C, Ctrl+Alt+V: copy and paste style.
 * - Ctrl+] and Ctrl+[: forward and backward, with Shift to the front and back.
 * - Arrows: nudge 1 mm, 10 mm with Shift. Holding one down is one undo step.
 * - Escape inside a group: back to the whole group selected.
 *
 * Ctrl is Cmd on a Mac throughout.
 */

const NUDGE_MM = 1;
const NUDGE_BIG_MM = 10;

const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** Whether a key press belongs to whatever has the focus rather than to the sheet. */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

/** Which of the deletable: on the page, selected, unlocked. */
const deletable = (spread: BookSpread | null, selection: string[]): string[] =>
  (spread?.elements ?? []).filter((e) => selection.includes(e.id) && !e.locked).map((e) => e.id);

type Store = ReturnType<typeof useStudioStore.getState>;

/**
 * One shortcut with Ctrl (Cmd on a Mac): whether it is this press, and what it
 * does. The first that matches runs; a press none of them takes stays the
 * browser's.
 */
interface Shortcut {
  matches: (e: KeyboardEvent, key: string, store: Store, spread: BookSpread | null) => boolean;
  run: (e: KeyboardEvent, store: Store, spreadIndex: number) => void;
}

const has = (store: Store) => store.selection.length > 0;
const BRACKETS = new Set([']', '[', '}', '{']);

const SHORTCUTS: Shortcut[] = [
  // Ctrl+Alt is AltGr on many keyboards: only the two letters it does not type are taken.
  { matches: (e, key, s) => e.altKey && key === 'c' && has(s), run: (_e, s, i) => s.copyStyle(i) },
  {
    matches: (e, key, s) => e.altKey && key === 'v' && has(s) && s.styleClip !== null,
    run: (_e, s, i) => s.pasteStyle(i),
  },
  {
    matches: (e, key, s) => !e.altKey && key === 'g' && has(s),
    run: (e, s, i) => (e.shiftKey ? s.ungroup(i) : s.group(i)),
  },
  {
    matches: (e, key, s) => !e.altKey && !e.shiftKey && key === 'd' && has(s),
    run: (_e, s, i) => s.duplicate(i, s.selection),
  },
  {
    matches: (e, key, _s, spread) => !e.altKey && !e.shiftKey && key === 'a' && !!spread?.elements.length,
    run: (_e, s, i) => s.selectAll(i),
  },
  {
    matches: (e, _key, s) => !e.altKey && BRACKETS.has(e.key) && has(s),
    run: (e, s, i) => {
      const up = e.key === ']' || e.key === '}';
      const far = up ? 'front' : 'back';
      s.raise(i, s.selection, e.shiftKey ? far : up ? 'forward' : 'backward');
    },
  },
  // Copy and paste across pages (#2316). Text selected on the page is the browser's to copy, not the book's.
  {
    matches: (e, key, s) => !e.altKey && key === 'c' && has(s) && !window.getSelection()?.toString(),
    run: (_e, s, i) => s.copy(i, s.selection),
  },
  { matches: (e, key, s) => !e.altKey && key === 'v' && s.clipboard !== null, run: (_e, s, i) => s.paste(i) },
];

/** A shortcut with Ctrl (Cmd on a Mac): answers whether it was one of ours. */
function command(e: KeyboardEvent, spreadIndex: number, spread: BookSpread | null): boolean {
  const store = useStudioStore.getState();
  const key = e.key.toLowerCase();
  const hit = SHORTCUTS.find((sc) => sc.matches(e, key, store, spread));
  hit?.run(e, store, spreadIndex);
  return !!hit;
}

/** The arrow a press is, when it moves the selection: no modifier but Shift, something selected. */
function nudgeOf(e: KeyboardEvent, store: Store): [number, number] | null {
  const arrow = ARROWS[e.key];
  if (!arrow || !store.selection.length || e.ctrlKey || e.metaKey || e.altKey) return null;
  const step = e.shiftKey ? NUDGE_BIG_MM : NUDGE_MM;
  return [arrow[0] * step, arrow[1] * step];
}

/** Delete or Backspace: what is selected and not locked goes. Answers whether the key was taken. */
function deleteSelection(e: KeyboardEvent, store: Store, spreadIndex: number, spread: BookSpread | null): boolean {
  if ((e.key !== 'Delete' && e.key !== 'Backspace') || !store.selection.length) return false;
  e.preventDefault();
  const ids = deletable(spread, store.selection);
  if (ids.length) store.removeElements(spreadIndex, ids);
  return true;
}

export function useStudioKeys(opts: { spreadIndex: number; editing: boolean }) {
  const { spreadIndex, editing } = opts;

  useEffect(() => {
    /** The arrow keys hold one gesture open while any of them is down, so holding one is one undo step. */
    let nudging = false;
    const stopNudge = () => {
      if (!nudging) return;
      nudging = false;
      useStudioStore.getState().endGesture();
    };

    const onKey = (e: KeyboardEvent) => {
      if (editing || e.defaultPrevented || isTypingTarget(e.target)) return;
      const store = useStudioStore.getState();
      // Read when the key comes, not when the effect ran: a nudge changes the
      // page, and an effect that re-ran on it would close the gesture each step.
      const spread = store.doc?.spreads[spreadIndex] ?? null;

      if (e.key === 'Escape') {
        // Out of the group first; the Studio page's own Escape sees it was taken.
        if (store.leaveGroup(spreadIndex)) e.preventDefault();
        return;
      }
      if (deleteSelection(e, store, spreadIndex, spread)) return;
      const nudge = nudgeOf(e, store);
      if (nudge) {
        e.preventDefault();
        if (store.readOnly) return;
        if (!nudging) {
          nudging = true;
          store.beginGesture();
        }
        store.nudge(spreadIndex, nudge[0], nudge[1]);
        return;
      }
      if (!(e.metaKey || e.ctrlKey)) return;
      if (command(e, spreadIndex, spread)) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (ARROWS[e.key]) stopNudge();
    };

    // On the document as the key bubbles: after every control and the assistant's window had it (React
    // listens below the document), and before the page's Escape on the window, so a step out of a group
    // is decided before the page clears the selection.
    document.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('blur', stopNudge);
    return () => {
      stopNudge();
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp, true);
      window.removeEventListener('blur', stopNudge);
    };
  }, [spreadIndex, editing]);
}
