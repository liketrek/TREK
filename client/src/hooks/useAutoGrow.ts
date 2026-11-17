import { type RefObject, useLayoutEffect } from 'react';

/**
 * Grows a textarea with what is written in it, so its last line is never
 * sliced through the glyphs at the bottom edge the way a fixed `rows` height
 * cuts a fourth line. `rows` stays the least it shows. It measures again when
 * the text changes and when the field's width does (a rotation, a fold), since
 * both decide how many lines the text wraps to.
 */
export function useAutoGrow(ref: RefObject<HTMLTextAreaElement | null>, value: string): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let width = -1;
    const fit = () => {
      width = el.clientWidth;
      el.style.height = 'auto';
      // scrollHeight leaves the border out; the box is border-box.
      const border = el.offsetHeight - el.clientHeight;
      el.style.height = `${el.scrollHeight + border}px`;
    };
    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (el.clientWidth !== width) fit();
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, value]);
}
