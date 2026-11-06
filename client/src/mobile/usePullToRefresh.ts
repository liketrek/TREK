import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { tickHaptic } from '../native/haptics';
import { hasOpenOverlay } from './overlayStack';

/** How far the finger must pull (after resistance) before letting go refreshes. */
export const PULL_THRESHOLD = 64;
const MAX_PULL = 110;
/** The indicator stays at least this long, so a fast answer does not just blink. */
const MIN_SPIN_MS = 450;

export type PullState = { distance: number; refreshing: boolean; armed: boolean };

/** The screen's own refresh reports its failures (a toast, its error state); the pull only lets go. */
function refreshFailed(): void {}

/**
 * Pull-to-refresh on a page whose scroller is the window, as the mobile
 * dashboard is. A downward drag that starts at the very top moves `contentRef`
 * down with resistance; past the threshold a light tick tells the finger that
 * letting go will refresh. Ignored while a sheet is open, for horizontal drags
 * (chip rows, pagers) and when the page is not scrolled to the top.
 *
 * Writes the content's transform directly during the drag, so a pull costs no
 * React render per frame; `state` only changes at the edges (armed, refreshing).
 */
export function usePullToRefresh(
  contentRef: RefObject<HTMLElement | null>,
  onRefresh: () => Promise<unknown>,
  enabled = true,
  /** The element that scrolls, where that is not the window (a screen with its own scroll box). */
  scrollerRef?: RefObject<HTMLElement | null>
): PullState {
  const [state, setState] = useState<PullState>({ distance: 0, refreshing: false, armed: false });
  const refreshRef = useRef(onRefresh);
  useLayoutEffect(() => {
    refreshRef.current = onRefresh;
  });

  useEffect(() => {
    if (!enabled) return;
    let start: { x: number; y: number } | null = null;
    let pulling = false;
    let armed = false;
    let busy = false;
    let distance = 0;
    const scrolled = () => (scrollerRef?.current ? scrollerRef.current.scrollTop : window.scrollY);

    const place = (value: number, animate: boolean) => {
      const el = contentRef.current;
      if (!el) return;
      el.style.transition = animate ? 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)' : 'none';
      el.style.transform = value > 0 ? `translate3d(0, ${value}px, 0)` : '';
    };

    const onStart = (e: TouchEvent) => {
      if (busy || e.touches.length !== 1 || scrolled() > 0 || hasOpenOverlay()) return;
      start = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      pulling = false;
    };

    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const dx = e.touches[0].clientX - start.x;
      const dy = e.touches[0].clientY - start.y;
      if (!pulling) {
        // Decide once: a sideways or upward start belongs to whatever is under the finger.
        if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy) || scrolled() > 0) {
          start = null;
          return;
        }
        pulling = true;
      }
      if (e.cancelable) e.preventDefault();
      // Resistance grows with the pull, like a rubber band.
      distance = Math.min(MAX_PULL, dy * 0.5 * (1 - Math.min(dy, 400) / 1000));
      place(distance, false);
      const nowArmed = distance >= PULL_THRESHOLD;
      if (nowArmed !== armed) {
        armed = nowArmed;
        if (armed) tickHaptic();
        setState({ distance, refreshing: false, armed });
      } else {
        setState((s) => (Math.abs(s.distance - distance) > 4 ? { ...s, distance } : s));
      }
    };

    const onEnd = () => {
      if (!start) return;
      start = null;
      if (!pulling) return;
      pulling = false;
      if (!armed) {
        distance = 0;
        place(0, true);
        setState({ distance: 0, refreshing: false, armed: false });
        return;
      }
      busy = true;
      armed = false;
      place(PULL_THRESHOLD * 0.75, true);
      setState({ distance: PULL_THRESHOLD, refreshing: true, armed: false });
      const began = Date.now();
      void Promise.resolve()
        .then(() => refreshRef.current())
        .catch(refreshFailed)
        .then(() => new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_SPIN_MS - (Date.now() - began)))))
        .then(() => {
          busy = false;
          distance = 0;
          place(0, true);
          setState({ distance: 0, refreshing: false, armed: false });
        });
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    // Not passive: once a pull has started, the page must not also scroll or bounce.
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd, { passive: true });
    window.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
      place(0, false);
    };
  }, [contentRef, enabled, scrollerRef]);

  return state;
}
