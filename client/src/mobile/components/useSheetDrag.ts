import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Drag-to-dismiss for the docked bottom sheet, the way a native sheet takes it.
 *
 * Two ways in. The grab strip along the top edge answers pointers, so a mouse
 * or a pen on a narrow window can pull it too. And the sheet's content answers
 * a finger pulling down once whatever it scrolls is at its top: the gesture
 * that would otherwise only rubber-band the list carries the whole sheet, as
 * on iOS. A content drag is claimed on the first move or not at all, so the
 * list's own scroll and any horizontal scroller inside keep their gestures.
 *
 * The finger moves the panel through direct style writes, batched per frame,
 * never through React state. On release the speed over the last few events
 * decides: a flick or a pull past a third of the sheet throws it off screen
 * from where the finger let go, anything else springs back. Pulling up past
 * the rest position only stretches a little.
 */

/** Movement before a content touch is read as a drag or let go. */
const CLASSIFY_PX = 6;
/** Down must beat sideways by this much, so a horizontal scroller keeps its pan. */
const AXIS_BIAS = 1.2;
/** Pulled past this share of the sheet's height, the release dismisses. */
const DISMISS_SHARE = 0.3;
/** px/ms downward at release that dismisses on its own. */
const FLICK_V = 0.5;
/** Speed is read over this trailing window. */
const SAMPLE_MS = 80;
/** Upward pull: a fraction of the travel, capped, as a stretch rather than a move. */
const STRETCH = 0.2;
const STRETCH_MAX = 20;
export const SPRING_BACK = 'transform 280ms var(--ease-drawer)';

/** Controls that own a downward finger themselves. */
const OWNS_GESTURE = 'input[type="range"], textarea, select, [data-sheet-nodrag]';

interface Drag {
  y0: number;
  x0: number;
  samples: { y: number; t: number }[];
  claimed: boolean;
  scroller: HTMLElement | null;
}

function nearestScroller(from: EventTarget | null, stop: HTMLElement): HTMLElement | null {
  let el = from instanceof HTMLElement ? from : null;
  while (el && el !== stop) {
    const overflow = getComputedStyle(el).overflowY;
    if ((overflow === 'auto' || overflow === 'scroll') && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return null;
}

function offsetFor(dy: number): number {
  return dy >= 0 ? dy : -Math.min(STRETCH_MAX, -dy * STRETCH);
}

function sample(d: Drag, y: number, t: number): void {
  d.samples.push({ y, t });
  while (d.samples.length > 2 && t - d.samples[0].t > SAMPLE_MS) d.samples.shift();
}

export interface SheetDragOptions {
  enabled: boolean;
  panelRef: RefObject<HTMLElement | null>;
  /** Called on a dismissing release. Returns true when the sheet will close, so
   *  it can be thrown off screen; false (an unsaved-changes question) springs it back. */
  onDismiss: () => boolean;
}

export function useSheetDrag({ enabled, panelRef, onDismiss }: SheetDragOptions) {
  const drag = useRef<Drag | null>(null);
  const frame = useRef(0);
  const latest = useRef(onDismiss);
  latest.current = onDismiss;

  const write = useCallback(
    (y: number, transition: string) => {
      const el = panelRef.current;
      if (!el) return;
      el.style.transition = transition;
      el.style.transform = `translateY(${y}px)`;
    },
    [panelRef]
  );

  const follow = useCallback(
    (dy: number) => {
      cancelAnimationFrame(frame.current);
      // Written at once as well as on the next frame: the first write starts the
      // move without a frame's lag, the frame keeps a burst of events to one paint.
      write(offsetFor(dy), 'none');
      frame.current = requestAnimationFrame(() => write(offsetFor(dy), 'none'));
    },
    [write]
  );

  const release = useCallback(
    (d: Drag, lastY: number) => {
      cancelAnimationFrame(frame.current);
      const el = panelRef.current;
      if (!el) return;
      const dy = lastY - d.y0;
      const first = d.samples[0];
      const last = d.samples[d.samples.length - 1];
      const v = first && last ? (last.y - first.y) / Math.max(1, last.t - first.t) : 0;
      const height = el.offsetHeight;
      const dismiss = dy > 0 && ((height > 0 && dy > height * DISMISS_SHARE) || v > FLICK_V);
      if (dismiss && latest.current()) {
        // Off screen from where the finger let go, faster the harder the flick.
        const distance = Math.max(height, window.innerHeight - el.getBoundingClientRect().top + dy) + 24;
        const ms = Math.round(Math.min(320, Math.max(160, (distance - dy) / Math.max(v, 1.2))));
        write(distance, `transform ${ms}ms cubic-bezier(0.2, 0.8, 0.2, 1)`);
        return;
      }
      write(0, SPRING_BACK);
    },
    [panelRef, write]
  );

  // ── The grab strip: pointer events, any pointer type ──────────────────────
  const onStripPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      drag.current = {
        y0: e.clientY,
        x0: e.clientX,
        samples: [{ y: e.clientY, t: e.timeStamp }],
        claimed: true,
        scroller: null,
      };
      write(0, 'none');
    },
    [write]
  );
  const onStripPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      const d = drag.current;
      if (!d?.claimed) return;
      sample(d, e.clientY, e.timeStamp);
      follow(e.clientY - d.y0);
    },
    [follow]
  );
  const onStripPointerEnd = useCallback(
    (e: ReactPointerEvent) => {
      const d = drag.current;
      drag.current = null;
      if (!d?.claimed) return;
      const last = d.samples[d.samples.length - 1];
      release(d, Number.isFinite(e.clientY) && e.clientY !== 0 ? e.clientY : last.y);
    },
    [release]
  );

  // ── The content: touch events, claimed on the first move ──────────────────
  useEffect(() => {
    const panel = panelRef.current;
    if (!enabled || !panel) return;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        drag.current = null;
        return;
      }
      const target = e.target as Element | null;
      if (target?.closest?.('[data-sheet-grab]') || target?.closest?.(OWNS_GESTURE)) return;
      const t = e.touches[0];
      drag.current = {
        y0: t.clientY,
        x0: t.clientX,
        samples: [{ y: t.clientY, t: e.timeStamp }],
        claimed: false,
        scroller: nearestScroller(e.target, panel),
      };
    };
    const onMove = (e: TouchEvent) => {
      const d = drag.current;
      if (!d || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dy = t.clientY - d.y0;
      const dx = t.clientX - d.x0;
      if (!d.claimed) {
        if (Math.abs(dy) <= CLASSIFY_PX && Math.abs(dx) <= CLASSIFY_PX) return;
        const atTop = !d.scroller || d.scroller.scrollTop <= 0;
        if (dy > 0 && Math.abs(dy) > Math.abs(dx) * AXIS_BIAS && atTop) {
          d.claimed = true;
          // Measured from here, so the sheet does not jump by the classify slop.
          d.y0 = t.clientY;
          d.samples = [{ y: t.clientY, t: e.timeStamp }];
        } else {
          drag.current = null;
          return;
        }
      }
      if (e.cancelable) e.preventDefault();
      sample(d, t.clientY, e.timeStamp);
      follow(t.clientY - d.y0);
    };
    const onEnd = (e: TouchEvent) => {
      const d = drag.current;
      drag.current = null;
      if (!d?.claimed) return;
      const last = d.samples[d.samples.length - 1];
      release(d, e.changedTouches[0]?.clientY ?? last.y);
    };

    panel.addEventListener('touchstart', onStart, { passive: true });
    panel.addEventListener('touchmove', onMove, { passive: false });
    panel.addEventListener('touchend', onEnd, { passive: true });
    panel.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      cancelAnimationFrame(frame.current);
      panel.removeEventListener('touchstart', onStart);
      panel.removeEventListener('touchmove', onMove);
      panel.removeEventListener('touchend', onEnd);
      panel.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled, panelRef, follow, release]);

  return {
    strip: {
      'data-sheet-grab': '',
      onPointerDown: onStripPointerDown,
      onPointerMove: onStripPointerMove,
      onPointerUp: onStripPointerEnd,
      onPointerCancel: onStripPointerEnd,
    },
  };
}
