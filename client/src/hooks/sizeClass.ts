import { useSyncExternalStore } from 'react';

/**
 * The touch shell's size classes, the web's answer to UIKit's compact and
 * regular widths.
 *
 * compact  every phone, upright or on its side, and the narrow Split View and
 *          Stage Manager windows. The shell as it has always been: the dock at
 *          the bottom, sheets rising from below, one column.
 * wide     from 600pt across and taller than a phone on its side: an iPad in
 *          any orientation or window above a third of the screen, a foldable
 *          unfolded. A navigation rail on the leading edge takes the dock's
 *          place, sheets become centred form sheets, lists get columns.
 * split    from 900pt across: room for two panes, so the trip's plan sits next
 *          to its map and settings show their sections beside the page.
 *
 * The height bound keeps a phone on its side compact: no phone is taller than
 * 500pt in landscape, no tablet or unfolded foldable is shorter.
 *
 * `tailwind.config.js` registers the same two queries as the `wide:` and
 * `split:` variants, and `index.css` reads them for the shell's own variables;
 * keep the three in step (sizeClass.test.ts holds them together).
 */
export const WIDE_QUERY = '(min-width: 600px) and (min-height: 501px)';
export const SPLIT_QUERY = '(min-width: 900px) and (min-height: 501px)';

function matches(query: string): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

function subscribe(query: string) {
  return (onChange: () => void) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
    const mq = window.matchMedia(query);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  };
}

const subscribeWide = subscribe(WIDE_QUERY);
const subscribeSplit = subscribe(SPLIT_QUERY);
const readWide = () => matches(WIDE_QUERY);
const readSplit = () => matches(SPLIT_QUERY);
const never = () => false;

/** Whether the touch shell is laid out for a wide window right now, outside React. */
export function isWideViewport(): boolean {
  return readWide();
}

/** True while the window is in the wide size class. Follows rotation, folding and resizing. */
export function useIsWide(): boolean {
  return useSyncExternalStore(subscribeWide, readWide, never);
}

/** True while the window has room for two panes side by side. */
export function useIsSplit(): boolean {
  return useSyncExternalStore(subscribeSplit, readSplit, never);
}
