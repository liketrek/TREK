import { useEffect, useState } from 'react';

export interface EdgeFade {
  /** Content is scrolled past the leading (or top) edge. */
  start: boolean;
  /** More content waits beyond the trailing (or bottom) edge. */
  end: boolean;
}

/** Which way a scroller runs: a strip of chips sideways, a list or a card down. */
export type FadeAxis = 'x' | 'y';

const NONE: EdgeFade = { start: false, end: false };

/**
 * Which ends of a scroller have more behind them, so it can fade out there
 * (m-fade-s / m-fade-e, m-fade-t / m-fade-b in mobile.css) instead of cutting a
 * chip or a row in half with nothing to say the content goes on. Follows
 * scrolling, every change of size (a rotation, a fold, the pane beside the map
 * opening) and every change of what it holds (a day switched, a message in).
 */
export function useEdgeFade(el: HTMLElement | null, axis: FadeAxis = 'x'): EdgeFade {
  const [fade, setFade] = useState<EdgeFade>(NONE);
  useEffect(() => {
    if (!el) return;
    const measure = () => {
      // scrollLeft runs from 0 towards the negative in a right-to-left strip.
      const scrolled = Math.abs(axis === 'x' ? el.scrollLeft : el.scrollTop);
      const room = axis === 'x' ? el.scrollWidth - el.clientWidth : el.scrollHeight - el.clientHeight;
      const next = { start: scrolled > 1, end: room - scrolled > 1 };
      setFade((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    resize?.observe(el);
    // New content changes what lies past an edge without changing the box itself.
    let frame = 0;
    const changed =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(measure);
          });
    changed?.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      el.removeEventListener('scroll', measure);
      resize?.disconnect();
      changed?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [el, axis]);
  return fade;
}

/** The mask classes for a fade state: sideways by default, `y` for a scroller that runs down. */
export function edgeFadeClass(fade: EdgeFade, axis: FadeAxis = 'x'): string {
  const [both, start, end] =
    axis === 'x' ? ['m-fade-se', 'm-fade-s', 'm-fade-e'] : ['m-fade-tb', 'm-fade-t', 'm-fade-b'];
  if (fade.start && fade.end) return both;
  if (fade.start) return start;
  if (fade.end) return end;
  return '';
}
