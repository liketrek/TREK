import { useState } from 'react';

import { type WindowSize, useDragResize } from '../../hooks/useDragResize';

/**
 * The floating window's frame, shared by the planner's window and TREK
 * Studio's: moved by its head, resized from any edge or corner, kept inside
 * the screen and below the navbar, remembered under its own key.
 */

const MIN_SIZE: WindowSize = { width: 340, height: 420 };
const DEFAULT_SIZE: WindowSize = { width: 400, height: 600 };
/** Never closer to the screen's edge than this. */
const MARGIN = 16;
/** The default distance from the edges, and how near a corner a released window snaps into it. */
const GAP = 24;
const expandedSize = (viewport: WindowSize): WindowSize => ({
  width: Math.min(720, viewport.width - 2 * MARGIN),
  height: Math.round(viewport.height * 0.8),
});

/** The fixed navbar's height (`--nav-h`, a calc() and 0 where there is none), measured. */
function navbarHeight(): number {
  if (typeof document === 'undefined') return 0;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;height:var(--nav-h, 0px)';
  document.body.appendChild(probe);
  const height = probe.offsetHeight;
  probe.remove();
  return height;
}

/** The frame of a floating assistant window, its place and size kept under `storageKey`. */
export function useAssistantFrame(storageKey: string, topInsetPx?: number) {
  // The navbar sits on the same layer and later in the page: the head never goes under it.
  const [topInset] = useState(() => topInsetPx ?? navbarHeight());
  return useDragResize({
    storageKey,
    minSize: MIN_SIZE,
    defaultSize: DEFAULT_SIZE,
    expandedSize,
    margin: MARGIN,
    gap: GAP,
    topInset,
  });
}

/** The glass window's own classes; `active` while it is being moved or resized. */
export const FRAME_CLASS =
  'fixed z-[var(--z-nav)] flex-col overflow-visible rounded-xl border border-edge-faint bg-surface-elevated shadow-[var(--sidebar-shadow)] backdrop-blur-2xl backdrop-saturate-150';
