import { useEffect, useRef, useState } from 'react';

/**
 * How long a closing dialog, confirm or menu stays for its exit animation
 * (index.css). None under the unit tests: hundreds of them close a confirm and
 * check at once that it is gone, which is what the user sees once the fade ends.
 */
export const EXIT_MS = import.meta.env.MODE === 'test' ? 0 : 170;

/**
 * Keeps something on screen for its exit animation after it was told to close:
 * `mounted` stays true for EXIT_MS once `open` turns false, with `closing` set
 * meanwhile so the caller can add the exit class and stop taking clicks.
 */
export function usePresence(open: boolean, ms: number = EXIT_MS): { mounted: boolean; closing: boolean } {
  const animated = ms > 0 && EXIT_MS > 0;
  const [lingering, setLingering] = useState(false);
  const wasOpen = useRef(open);

  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      setLingering(false);
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    if (!animated) return;
    setLingering(true);
    const timer = window.setTimeout(() => setLingering(false), ms);
    return () => window.clearTimeout(timer);
  }, [open, ms, animated]);

  // The first render after closing already counts as closing, before the effect runs.
  const closing = animated && !open && (lingering || wasOpen.current);
  return { mounted: open || closing, closing };
}

/**
 * The last value seen while open: what a closing popup shows during its exit,
 * since its owner often clears the data in the same step that closes it.
 */
export function useLastOpen<T>(value: T, open: boolean): T {
  const last = useRef(value);
  if (open) last.current = value;
  return open ? value : last.current;
}
