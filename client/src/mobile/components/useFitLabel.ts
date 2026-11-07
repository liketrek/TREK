import { useLayoutEffect, useRef } from 'react';

/** The smallest share of its size a label may shrink to. */
const MIN_SCALE = 0.72;
const STEP = 0.04;

/**
 * Fits a short label into a narrow, fixed box, such as a navigation rail
 * entry: a name in its own words, on at most two lines, whatever the language.
 *
 * The label wraps between words. A word that is still too wide for the box
 * (German "Einstellungen", Russian "Администрирование") first shrinks the
 * label, step by step down to MIN_SCALE, the way a tab bar fits its titles; a
 * name read whole beats one split over two lines. Only a word too long even
 * then is hyphenated, where the browser knows the language, and past that
 * broken anywhere. A tap target has no hover, so the whole name has to be on
 * screen.
 *
 * What it settles on is written to the element's own style: `--fit`, which the
 * element multiplies its font size with, and its hyphenation and wrapping. A
 * measurement is a fact about the laid-out element, not React state, and
 * keeping it there spares a second render of every rail entry.
 */
export function useFitLabel<T extends HTMLElement>(label: string) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const fits = () => {
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 0;
      const tooWide = el.scrollWidth > el.clientWidth + 0.5;
      const tooTall = lineHeight > 0 && el.scrollHeight > lineHeight * 2 + 1;
      return !tooWide && !tooTall;
    };
    const shrink = (hyphens: 'manual' | 'auto') => {
      el.style.hyphens = hyphens;
      let scale = 1;
      el.style.setProperty('--fit', '1');
      while (!fits() && scale - STEP >= MIN_SCALE) {
        scale = Math.round((scale - STEP) * 100) / 100;
        el.style.setProperty('--fit', String(scale));
      }
      return fits();
    };
    const measure = () => {
      if (cancelled) return;
      el.style.overflowWrap = 'normal';
      if (shrink('manual') || shrink('auto')) return;
      el.style.overflowWrap = 'anywhere';
    };
    measure();
    // The label's font may arrive after the first layout, and it measures differently.
    void document.fonts?.ready.then(measure);
    return () => {
      cancelled = true;
    };
  }, [label]);

  return ref;
}
