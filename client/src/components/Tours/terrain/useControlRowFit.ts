import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * How the 3D map's bottom row fits between the side panels: `full` with every
 * label, `compact` with the layer pill on its icons, and `stacked` with the
 * grade legend on a row of its own above the dock as well.
 */
export type ControlRowFit = 'full' | 'compact' | 'stacked';

const STEPS: readonly ControlRowFit[] = ['full', 'compact', 'stacked'];

/**
 * Steps the row down while its content is wider than the room between the
 * panels, and back up once the room has grown to what the larger step
 * needed, so it never flips back and forth at one width. `height` is the
 * height the controls take from the bottom edge, every row of them, for what
 * floats above them (the via ferrata card).
 *
 * `row` is the one row that must not overflow; `stack` wraps everything the
 * fit shows, the legend's own row included.
 */
export function useControlRowFit() {
  const [row, setRow] = useState<HTMLDivElement | null>(null);
  const [stack, setStack] = useState<HTMLDivElement | null>(null);
  const [fit, setFit] = useState<ControlRowFit>('full');
  const [height, setHeight] = useState<number | null>(null);
  // The width the content needed at each step when it had to step down from it.
  const needed = useRef<Partial<Record<ControlRowFit, number>>>({});

  const check = useCallback(() => {
    if (!row) return;
    setFit((current) => {
      const index = STEPS.indexOf(current);
      const room = row.clientWidth;
      const larger = STEPS[index - 1];
      const neededLarger = larger ? needed.current[larger] : undefined;
      if (larger && neededLarger !== undefined && room >= neededLarger) return larger;
      const smaller = STEPS[index + 1];
      if (smaller && row.scrollWidth > room + 1) {
        needed.current[current] = row.scrollWidth;
        return smaller;
      }
      return current;
    });
  }, [row]);

  useLayoutEffect(() => {
    check();
  });

  useLayoutEffect(() => {
    if (!row || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => check());
    observer.observe(row);
    return () => observer.disconnect();
  }, [row, check]);

  useLayoutEffect(() => {
    if (!stack || typeof ResizeObserver === 'undefined') return;
    const measure = () => setHeight(stack.offsetHeight || null);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stack);
    return () => observer.disconnect();
  }, [stack]);

  return { fit, height, attachRow: setRow, attachStack: setStack };
}
