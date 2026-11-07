import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * A callback ref that reports its element's rendered height whenever it changes, and 0
 * once the element is gone. For a card floating over something that has to keep clear of
 * it, the way the map keeps the selected pin above the place card (#2991).
 */
export function useReportedHeight(onHeight: ((height: number) => void) | undefined) {
  const observer = useRef<ResizeObserver | null>(null);
  const report = useRef(onHeight);
  useLayoutEffect(() => {
    report.current = onHeight;
  }, [onHeight]);

  const ref = useCallback((el: HTMLElement | null) => {
    observer.current?.disconnect();
    observer.current = null;
    if (!el) {
      report.current?.(0);
      return;
    }
    const publish = () => report.current?.(el.offsetHeight);
    publish();
    if (typeof ResizeObserver !== 'undefined') {
      observer.current = new ResizeObserver(publish);
      observer.current.observe(el);
    }
  }, []);

  useEffect(() => () => observer.current?.disconnect(), []);
  return ref;
}

/**
 * The element's height as state, and `measure`, the callback ref that reads it: hand
 * `measure` to the element as its `ref`.
 */
export function useMeasuredHeight() {
  const [height, setHeight] = useState(0);
  const measure = useReportedHeight(setHeight);
  return { height, measure };
}
