import { useEffect, useState, type CSSProperties } from 'react';

/** The tallest a row's ⋯ menu gets; below that it opens upwards instead. */
const ROW_MENU_MAX_H = 260;

/**
 * Where a portaled menu sits: right-aligned under its trigger, or above it when the
 * window has no room below. Fixed, because the cards around the toolbar and the rows
 * clip whatever overflows them.
 */
export function anchorMenu(trigger: HTMLElement | null): CSSProperties {
  const r = trigger?.getBoundingClientRect();
  if (!r) return { position: 'fixed', top: 0, right: 0, zIndex: 100 };
  const spaceBelow = window.innerHeight - r.bottom;
  const openUp = spaceBelow < ROW_MENU_MAX_H && r.top > spaceBelow;
  return {
    position: 'fixed',
    right: Math.max(8, window.innerWidth - r.right),
    ...(openUp ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    zIndex: 100,
  };
}

/** One entry of a popover menu, in the packing popovers' shape. */
export const MENU_ITEM =
  'flex w-full items-center gap-2.5 rounded-[9px] px-2.5 py-2 font-medium transition-colors hover:bg-surface-tertiary';

/** Re-renders while the page moves under an open, portaled menu, so it stays pinned to its trigger. */
export function useFollowTrigger(open: boolean) {
  const [, reanchor] = useState(0);
  useEffect(() => {
    if (!open) return;
    const onMove = () => reanchor((n) => n + 1);
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
    };
  }, [open]);
}
