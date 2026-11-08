/**
 * The place in the trip shell's top row that a tab fills with its own controls,
 * beside the back button: the tours tab its switch between the trip's tours and
 * the editor (and the map button where the window shows the pane or the map),
 * the journal its Journey/Gallery switch and its menu. Without it those sat on
 * a row of their own under the shell's, an empty band above every such tab.
 *
 * The shell hands the node in through a callback ref; the tab portals into it.
 * Kept outside React state so the shell does not render again for it.
 */
import { useSyncExternalStore } from 'react';

let slot: HTMLElement | null = null;
const listeners = new Set<() => void>();

/** The callback ref of the shell's slot. */
export function setTabHeadSlot(node: HTMLElement | null): void {
  if (node === slot) return;
  slot = node;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The slot while the shell shows it, else null (the tab then keeps its controls on its own row). */
export function useTabHeadSlot(): HTMLElement | null {
  return useSyncExternalStore(
    subscribe,
    () => slot,
    () => null
  );
}
