import { useEffect, useState } from 'react';

export interface EdgeFade {
  /** Content is scrolled past the leading (or top) edge. */
  start: boolean;
  /** More content waits beyond the trailing (or bottom) edge. */
  end: boolean;
}

/** x: a horizontal strip, y: a vertical scroll box such as a form sheet's body. */
export type EdgeFadeAxis = 'x' | 'y';

const NONE: EdgeFade = { start: false, end: false };

/**
 * Which ends of a scroller have more behind them, so it can fade out there
 * (m-fade-s / m-fade-e, m-fade-t / m-fade-b in mobile.css) instead of cutting a
 * chip or a field in half with nothing to say the content goes on. Follows
 * scrolling and every change of size: a rotation, a fold, the pane beside the
 * map opening, and on the vertical axis content that grows or shrinks inside
 * a box that keeps its height.
 */
export function useEdgeFade(el: HTMLElement | null, axis: EdgeFadeAxis = 'x'): EdgeFade {
  const [fade, setFade] = useState<EdgeFade>(NONE);
  useEffect(() => {
    if (!el) return;
    const measure = () => {
      // scrollLeft runs from 0 towards the negative in a right-to-left strip.
      const scrolled = axis === 'x' ? Math.abs(el.scrollLeft) : el.scrollTop;
      const room = axis === 'x' ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
      const next = { start: scrolled > 1, end: room - scrolled > 1 };
      setFade((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(el);
    // A form's fields come and go (a booking type, a split mode), which changes
    // what there is to scroll without changing the box itself.
    const content = axis === 'y' && typeof MutationObserver !== 'undefined' ? new MutationObserver(measure) : null;
    content?.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener('scroll', measure);
      observer?.disconnect();
      content?.disconnect();
    };
  }, [el, axis]);
  return fade;
}

/** The mask classes for a fade state. */
export function edgeFadeClass(fade: EdgeFade, axis: EdgeFadeAxis = 'x'): string {
  const [both, start, end] =
    axis === 'x' ? ['m-fade-se', 'm-fade-s', 'm-fade-e'] : ['m-fade-tb', 'm-fade-t', 'm-fade-b'];
  if (fade.start && fade.end) return both;
  if (fade.start) return start;
  if (fade.end) return end;
  return '';
}
