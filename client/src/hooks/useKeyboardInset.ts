import { useSyncExternalStore } from 'react';

/** How far the on-screen keyboard reaches into the layout viewport, in px; 0 when none is up. */
function readInset(): number {
  const viewport = window.visualViewport;
  if (!viewport) return 0;
  return Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop));
}

function subscribe(onChange: () => void): () => void {
  const viewport = window.visualViewport;
  if (!viewport) return () => undefined;
  viewport.addEventListener('resize', onChange);
  viewport.addEventListener('scroll', onChange);
  return () => {
    viewport.removeEventListener('resize', onChange);
    viewport.removeEventListener('scroll', onChange);
  };
}

/**
 * The height the phone's keyboard covers at the bottom of the screen, read
 * off the visual viewport. A full-screen view pads its bottom by it, so a
 * composer at the foot stays above the keys instead of under them: iOS
 * Safari lays the keyboard over the page without resizing it.
 */
export function useKeyboardInset(): number {
  return useSyncExternalStore(subscribe, readInset, () => 0);
}
