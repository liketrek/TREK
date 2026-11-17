import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Whether a control row keeps its words or goes to its icons: it keeps them
 * while it fits the room its parent gives it (a map's bottom edge, between the
 * panels and the locate button), and goes back to them once the room has grown
 * to what the words needed, so it never flips back and forth at one width.
 *
 * `enabled` false leaves the words on and measures nothing.
 */
export function useLabelFit(enabled: boolean) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [iconsOnly, setIconsOnly] = useState(false);
  // The width the row needed with its words, once it had to give them up.
  const needed = useRef<number | null>(null);

  const check = useCallback(() => {
    const room = node?.parentElement?.clientWidth;
    if (!node || !room) return;
    setIconsOnly((current) => {
      if (current) return needed.current !== null && room >= needed.current ? false : current;
      if (node.scrollWidth > room + 1) {
        needed.current = node.scrollWidth;
        return true;
      }
      return false;
    });
  }, [node]);

  useLayoutEffect(() => {
    if (enabled) check();
  });

  useLayoutEffect(() => {
    const parent = node?.parentElement;
    if (!enabled || !parent || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => check());
    observer.observe(parent);
    return () => observer.disconnect();
  }, [enabled, node, check]);

  return { attach: setNode, iconsOnly: enabled && iconsOnly };
}
