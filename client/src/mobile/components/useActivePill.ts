import type { CSSProperties, RefObject } from 'react';
import { useLayoutEffect, useState } from 'react';

/**
 * The pill that glides under the active item of a segmented control or a chip
 * rail, the way a native segmented control moves its thumb instead of
 * repainting two buttons.
 *
 * Measures the active item inside `trackRef` (the first match of `selector`)
 * and hands back the pill's style: positioned by transform, so the glide runs
 * on the compositor. The first placement does not animate, so a screen opens
 * with the pill already in place rather than sliding in from the edge. The
 * pill sits inside the track's scroll content, so a rail that scrolls carries
 * it along.
 */
export function useActivePill(
  /** The track, as a ref or as the element itself (a callback-ref'd rail). */
  trackRef: RefObject<HTMLElement | null> | HTMLElement | null,
  selector: string,
  /** What moves the active item, as one value: a change re-measures the pill. */
  key: string | number,
  /** Follow the item across rows too (a grid of chips): the pill then also takes
   *  the item's top and height, and the caller leaves top/bottom unset. */
  rows = false
): CSSProperties | null {
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number; animate: boolean } | null>(
    null
  );

  useLayoutEffect(() => {
    const track = trackRef instanceof HTMLElement ? trackRef : (trackRef?.current ?? null);
    if (!track) return;
    const measure = () => {
      const active = track.querySelector<HTMLElement>(selector);
      if (!active) {
        setBox(null);
        return;
      }
      setBox((prev) => ({
        x: active.offsetLeft,
        y: active.offsetTop,
        width: active.offsetWidth,
        height: active.offsetHeight,
        animate: prev !== null,
      }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [trackRef, selector, key]);

  if (!box) return null;
  const transition = box.animate ? 'transform 320ms var(--ease-drawer), width 320ms var(--ease-drawer)' : 'none';
  if (rows) {
    return { top: 0, width: box.width, height: box.height, transform: `translate(${box.x}px, ${box.y}px)`, transition };
  }
  return { width: box.width, transform: `translateX(${box.x}px)`, transition };
}
