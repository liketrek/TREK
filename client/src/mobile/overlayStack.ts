import { useEffect, useRef } from 'react';

/**
 * The overlays open on screen, newest last, so a way back closes the one on
 * top before it leaves the page: the iOS edge swipe (MEdgeBack) and Android's
 * back gesture (native/nativeApp.ts) both ask here first. Each entry is the
 * overlay's own close path, so an unsaved-changes question still asks.
 */
type Close = () => void;
const stack: { id: number; close: () => void }[] = [];
let nextId = 1;

/** Closes the overlay on top. False when none is open, so the caller goes back instead. */
export function closeTopOverlay(): boolean {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top.close();
  return true;
}

export function hasOpenOverlay(): boolean {
  return stack.length > 0;
}

/** Registers an overlay while `open`, with the way it closes. */
export function useOverlay(open: boolean, close: Close): void {
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    if (!open) return;
    const entry = { id: nextId++, close: () => closeRef.current() };
    stack.push(entry);
    return () => {
      const i = stack.findIndex((e) => e.id === entry.id);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [open]);
}

/** Test helper. */
export function _resetOverlayStack(): void {
  stack.length = 0;
}
