import { useCallback, useEffect, useRef } from 'react';

/**
 * Keeps the press that closed the card from also acting on the map.
 *
 * `arm` goes to the overlay's `onOutsidePress`; `guard` wraps the map's own
 * click handlers (adding a waypoint, say). The click that ends the closing
 * press is dropped once, and the guard is off again as soon as that click has
 * gone by, or at the next press when the first one never became a click (a
 * pan that ended off the page). A press on another ferrata keeps working: its
 * click opens that ferrata's card, which never runs a guarded handler.
 */
export function useOutsidePressGuard() {
  const armed = useRef(false);
  const disarm = useRef<(() => void) | null>(null);

  useEffect(() => () => disarm.current?.(), []);

  const arm = useCallback(() => {
    disarm.current?.();
    armed.current = true;
    let timer: number | undefined;
    const off = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener('click', afterClick, true);
      document.removeEventListener('pointerdown', nextPress, true);
      disarm.current = null;
    };
    // The map's handler runs during this click's dispatch; the guard comes off right after it.
    const afterClick = () => {
      document.removeEventListener('click', afterClick, true);
      timer = window.setTimeout(() => {
        armed.current = false;
        off();
      }, 0);
    };
    const nextPress = () => {
      armed.current = false;
      off();
    };
    document.addEventListener('click', afterClick, true);
    // Listened for from the next task on, so the press being dispatched now does not count.
    window.setTimeout(() => {
      if (armed.current && disarm.current === off) document.addEventListener('pointerdown', nextPress, true);
    }, 0);
    disarm.current = off;
  }, []);

  const guard = useCallback(<A extends unknown[]>(handler: ((...args: A) => void) | undefined) => {
    if (!handler) return undefined;
    return (...args: A) => {
      if (armed.current) {
        armed.current = false;
        return;
      }
      handler(...args);
    };
  }, []);

  return { arm, guard };
}
