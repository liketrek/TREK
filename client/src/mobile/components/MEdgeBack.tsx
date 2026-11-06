import type { RefObject } from 'react';
import { useEffect } from 'react';
import { tickHaptic } from '../../native/haptics';
import { closeTopOverlay, hasOpenOverlay } from '../overlayStack';
import { skipNextRouteTransition } from '../routeTransition';

/**
 * The swipe from the left edge that goes back, the way every iOS app has it.
 *
 * WebKit's own version slides away a screenshot of the whole page, closes no
 * sheet and fights every gesture near the edge (the day pager, swipe rows), so
 * the app turns it off (TrekBridgeViewController) and this takes over: the
 * page follows the finger, and a release past a third of the screen or a flick
 * slides it off and goes back. An open sheet closes first instead, the same
 * order Android's back gesture follows. Mounted only where the binary reports
 * the `edgeBack` feature, so an older binary keeps WebKit's.
 */

/** A touch has to start this close to the left edge. */
const EDGE_PX = 22;
/** Sideways must clearly beat vertical before the gesture is claimed. */
const CLAIM_PX = 10;
const AXIS_BIAS = 1.5;
const COMMIT_SHARE = 0.33;
const FLICK_V = 0.5;

/** react-router keeps its position in the session history on history.state. */
function canGoBack(): boolean {
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  return typeof idx === 'number' && idx > 0;
}

export default function MEdgeBack({ target, enabled }: { target: RefObject<HTMLElement | null>; enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    let start: { x: number; y: number; t: number } | null = null;
    let claimed = false;
    let overlay = false;
    let last = { x: 0, t: 0 };

    const move = (x: number, transition: string) => {
      const el = target.current;
      if (!el) return;
      el.style.transition = transition;
      el.style.transform = x ? `translateX(${x}px)` : '';
      el.style.boxShadow = x ? '-16px 0 40px -12px rgba(0,0,0,.35)' : '';
    };

    const onStart = (e: TouchEvent) => {
      claimed = false;
      start = null;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      if (t.clientX > EDGE_PX) return;
      overlay = hasOpenOverlay();
      if (!overlay && !canGoBack()) return;
      start = { x: t.clientX, y: t.clientY, t: e.timeStamp };
      last = { x: t.clientX, t: e.timeStamp };
    };

    const onMove = (e: TouchEvent) => {
      if (!start || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (!claimed) {
        if (Math.abs(dy) > CLAIM_PX && Math.abs(dy) > Math.abs(dx)) {
          start = null;
          return;
        }
        if (dx < CLAIM_PX || dx < Math.abs(dy) * AXIS_BIAS) return;
        claimed = true;
      }
      if (e.cancelable) e.preventDefault();
      last = { x: t.clientX, t: e.timeStamp };
      // An open sheet closes on release; the page itself stays put under it.
      if (!overlay) move(Math.max(0, dx), 'none');
    };

    const onEnd = (e: TouchEvent) => {
      const s = start;
      start = null;
      if (!s || !claimed) return;
      const x = e.changedTouches[0]?.clientX ?? last.x;
      const dx = Math.max(0, x - s.x);
      const v = (x - last.x) / Math.max(1, e.timeStamp - last.t) || dx / Math.max(1, e.timeStamp - s.t);
      const width = window.innerWidth;
      const commit = dx > width * COMMIT_SHARE || v > FLICK_V;
      if (!commit) {
        move(0, 'transform 260ms var(--ease-drawer), box-shadow 260ms');
        return;
      }
      tickHaptic();
      if (overlay) {
        closeTopOverlay();
        return;
      }
      move(width, 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)');
      window.setTimeout(() => {
        skipNextRouteTransition();
        window.history.back();
        // The page that comes back takes the place without a slide of its own.
        requestAnimationFrame(() => move(0, 'none'));
      }, 190);
    };

    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
      move(0, 'none');
    };
  }, [enabled, target]);
  return null;
}
