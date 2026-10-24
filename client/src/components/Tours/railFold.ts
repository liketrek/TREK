import { useCallback, useState } from 'react';

/**
 * Whether a card of the tours rails is folded, kept per browser so a reload
 * finds the rail as it was left. A view convenience, nothing shared: a blocked
 * or cleared storage gives every card its default again.
 */
const keyOf = (id: string) => `trek.tours.fold.${id}`;

/** The stored choice, else the card's own default. */
function readFolded(id: string, byDefault = false): boolean {
  try {
    const stored = localStorage.getItem(keyOf(id));
    return stored === null ? byDefault : stored === '1';
  } catch {
    return byDefault;
  }
}

function storeFolded(id: string, folded: boolean): void {
  try {
    localStorage.setItem(keyOf(id), folded ? '1' : '0');
  } catch {
    // Private mode or blocked storage: the card takes its default again next time.
  }
}

/** A card's folded state under `id`, remembered in this browser; `byDefault` until the user chose. */
export function useRailFold(id: string, byDefault = false) {
  const [folded, setFolded] = useState(() => readFolded(id, byDefault));
  const toggle = useCallback(() => {
    setFolded((value) => {
      storeFolded(id, !value);
      return !value;
    });
  }, [id]);
  return { folded, toggle };
}
