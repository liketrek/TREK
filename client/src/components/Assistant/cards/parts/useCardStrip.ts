import { useCallback, useEffect, useRef, useState } from 'react';

/** How far the strip has scrolled from either end, with the reading direction in mind. */
function edgesOf(el: HTMLElement): { start: boolean; end: boolean } {
  // A right-to-left strip scrolls into negative numbers; the distance from the start is the same either way.
  const from = Math.abs(el.scrollLeft);
  return { start: from > 4, end: from + el.clientWidth < el.scrollWidth - 4 };
}

/**
 * What a strip of cards needs to scroll well: whether there is more towards
 * either end (the edges fade there), measured again when it scrolls, when it
 * changes size and when `watch` (its content) changes, and paging by whole
 * cards.
 */
export function useCardStrip(watch: unknown) {
  const listRef = useRef<HTMLUListElement>(null);
  const [fade, setFade] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const next = edgesOf(el);
    setFade((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  useEffect(() => {
    measure();
    const el = listRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, watch]);

  /**
   * Scrolls by as many whole cards as the view holds, towards the start (-1)
   * or the end (1), so the row lands on a card edge instead of fighting its
   * snap points half way; smoothly, unless motion is turned down.
   */
  const page = (towards: -1 | 1) => {
    const el = listRef.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = card.offsetWidth + gap;
    const cards = Math.max(1, Math.floor((el.clientWidth - 32) / step));
    const rtl = getComputedStyle(el).direction === 'rtl';
    // Smooth through the strip's own scroll-behavior, which reduced motion turns off.
    el.scrollBy((rtl ? -towards : towards) * cards * step, 0);
  };

  return { listRef, fade, measure, page };
}
