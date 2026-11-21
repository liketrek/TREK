import { useCallback, useState } from 'react';

const MAP_LOCK_KEY = 'trek:map-locked';

/**
 * Whether a map keeps its camera when a place or a day is picked (#2010). One
 * setting per browser for every map that offers the padlock, the trip planner
 * and the collections alike: whoever locked one expects the other to hold still too.
 */
export function useMapLock(): [boolean, () => void] {
  const [locked, setLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem(MAP_LOCK_KEY) === '1';
    } catch {
      return false;
    }
  });
  const toggle = useCallback(() => {
    setLocked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MAP_LOCK_KEY, next ? '1' : '0');
      } catch {
        /* private mode keeps it for the session */
      }
      return next;
    });
  }, []);
  return [locked, toggle];
}
