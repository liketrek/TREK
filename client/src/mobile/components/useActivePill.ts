import type { CSSProperties, DependencyList, RefObject } from 'react';
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
  deps: DependencyList
): CSSProperties | null {
  const [box, setBox] = useState<{ left: number; width: number; animate: boolean } | null>(null);

  useLayoutEffect(() => {
    const track = trackRef && 'current' in trackRef ? trackRef.current : trackRef;
    if (!track) return;
    const measure = () => {
      const active = track.querySelector<HTMLElement>(selector);
      if (!active) {
        setBox(null);
        return;
      }
      setBox((prev) => ({ left: active.offsetLeft, width: active.offsetWidth, animate: prev !== null }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
    // The caller names what moves the active item; the ref and selector are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  if (!box) return null;
  return {
    width: box.width,
    transform: `translateX(${box.left}px)`,
    transition: box.animate ? 'transform 320ms var(--ease-drawer), width 320ms var(--ease-drawer)' : 'none',
  };
}
