import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Tells a horizontal strip when to drop its labels and show icons only.
 *
 * A fixed breakpoint cannot do this for the navbar pill: how wide the labels
 * are depends on how many addons and page plugins are enabled and on the
 * language. So the strip is measured instead. When it overflows with labels,
 * the viewport width it would need to fit them is remembered, and the labels
 * come back once the window is at least that wide. Measuring the collapsed
 * strip would not work, since without labels it always fits.
 *
 * `itemsKey` names the current set of items. When it changes the labels are
 * shown and measured again. Besides a window resize, a change in the strip's
 * own size (a web font arriving, a larger text size) is measured too.
 */
export function useCollapseOnOverflow<T extends HTMLElement = HTMLElement>(
  itemsKey: string
): {
  ref: React.RefObject<T | null>;
  collapsed: boolean;
} {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<{ key: string; fitsFrom: number } | null>(null);
  const fitsFrom = state?.key === itemsKey ? state.fitsFrom : null;

  useLayoutEffect(() => {
    const check = () => {
      if (fitsFrom !== null) {
        if (window.innerWidth >= fitsFrom) setState(null);
        return;
      }
      const el = ref.current;
      if (!el) return;
      const overflow = el.scrollWidth - el.clientWidth;
      if (overflow > 0) setState({ key: itemsKey, fitsFrom: window.innerWidth + overflow });
    };
    check();
    window.addEventListener('resize', check);
    const el = ref.current;
    const observer = el && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    if (observer && el) {
      // The strip stops growing once it is squeezed; its items keep reporting.
      observer.observe(el);
      for (const child of Array.from(el.children)) observer.observe(child);
    }
    return () => {
      window.removeEventListener('resize', check);
      observer?.disconnect();
    };
  }, [itemsKey, fitsFrom]);

  return { ref, collapsed: fitsFrom !== null };
}
