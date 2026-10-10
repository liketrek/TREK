import type React from 'react';
import { useEffect, useRef, useState } from 'react';

/**
 * The open state, the keyboard highlight and the outside click that closes the
 * list, shared by the planner's search fields (AirportSelect, LocationSelect and
 * AddressInput). Each field keeps its own query, search and pick.
 */
export function useSuggestionDropdown() {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /** Arrow keys move the highlight over `rows`, Enter picks the highlighted row, Escape closes. */
  const handleKey = <T>(e: React.KeyboardEvent<HTMLInputElement>, rows: T[], pick: (row: T) => void) => {
    if (!open || rows.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, rows.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlight >= 0 && highlight < rows.length) {
      e.preventDefault();
      pick(rows[highlight]);
    } else if (e.key === 'Escape') setOpen(false);
  };

  return { open, setOpen, highlight, setHighlight, wrapRef, handleKey };
}
