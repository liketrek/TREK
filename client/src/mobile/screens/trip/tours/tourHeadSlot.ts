/**
 * The place in the trip shell's top row that the tours tab fills with its own
 * controls: the switch between the trip's tours and the editor, and on a window
 * that shows the pane or the map, the map button. The row has the back button
 * on one side and nothing else to say on a tablet, so the tab's name made way.
 *
 * The shell hands the node in through a callback ref; the tab portals into it.
 * Kept outside React state so the shell does not render again for it.
 */
import { useSyncExternalStore } from 'react';

let slot: HTMLElement | null = null;
const listeners = new Set<() => void>();

/** The callback ref of the shell's slot. */
export function setTourHeadSlot(node: HTMLElement | null): void {
  if (node === slot) return;
  slot = node;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The slot while the shell shows it, else null (the tab then keeps its controls in its pane). */
export function useTourHeadSlot(): HTMLElement | null {
  return useSyncExternalStore(
    subscribe,
    () => slot,
    () => null
  );
}
