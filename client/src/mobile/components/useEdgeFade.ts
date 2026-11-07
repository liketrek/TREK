import { useEffect, useState } from 'react';

export interface EdgeFade {
  /** Content is scrolled past the leading edge. */
  start: boolean;
  /** More content waits beyond the trailing edge. */
  end: boolean;
}

const NONE: EdgeFade = { start: false, end: false };

/**
 * Which ends of a horizontal scroller have more behind them, so the strip can
 * fade out there (m-fade-s / m-fade-e in mobile.css) instead of cutting a chip
 * in half with nothing to say the row goes on. Follows scrolling and every
 * change of size: a rotation, a fold, the pane beside the map opening.
 */
export function useEdgeFade(el: HTMLElement | null): EdgeFade {
  const [fade, setFade] = useState<EdgeFade>(NONE);
  useEffect(() => {
    if (!el) return;
    const measure = () => {
      // scrollLeft runs from 0 towards the negative in a right-to-left strip.
      const scrolled = Math.abs(el.scrollLeft);
      const room = el.scrollWidth - el.clientWidth;
      const next = { start: scrolled > 1, end: room - scrolled > 1 };
      setFade((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      observer?.disconnect();
    };
  }, [el]);
  return fade;
}

/** The mask classes for a fade state. */
export function edgeFadeClass(fade: EdgeFade): string {
  if (fade.start && fade.end) return 'm-fade-se';
  if (fade.start) return 'm-fade-s';
  if (fade.end) return 'm-fade-e';
  return '';
}
