import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';

const itemsOf = (list: HTMLElement | null) => Array.from(list?.querySelectorAll('button') ?? []);

/** Room kept between an open list and the window's sides. */
const EDGE = 8;

/**
 * How a button that opens a list to pick from behaves, whatever it looks like:
 * opening moves the focus onto the current choice; the arrow keys, Home and End
 * walk the list; Escape closes it and leaves a dialog under it open; Tab closes
 * it and goes on from the button; a click beside it closes it. The caller draws
 * the button and the list and hands `currentIndex`, the choice held now.
 */
export function usePopoverList(currentIndex: number, options: { estimatedHeight?: number } = {}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const startAt = useRef(0);
  const listId = useId();
  const box = useAnchoredPosition(triggerRef, open, {
    matchWidth: false,
    estimatedHeight: options.estimatedHeight ?? 320,
  });
  const listShown = open && !!box;

  const toggle = () => {
    if (!open) startAt.current = Math.max(0, currentIndex);
    setOpen((o) => !o);
  };

  useEffect(() => {
    if (listShown) itemsOf(menuRef.current)[startAt.current]?.focus({ preventScroll: true });
  }, [listShown]);

  // The list opens from its button's start; one wider than the room beside a button near the
  // window's side moves back inside, as far as it must, before it is painted.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!listShown || !menu) return;
    menu.style.translate = '';
    const rect = menu.getBoundingClientRect();
    let shift = Math.min(0, window.innerWidth - EDGE - rect.right);
    if (rect.left + shift < EDGE) shift = EDGE - rect.left;
    if (shift) menu.style.translate = `${Math.round(shift)}px 0`;
  }, [listShown, box]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    // Captured and stopped, so the key takes back the list and not the dialog under it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  /** Closes the list after a choice and hands the focus back to the button. */
  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onListKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      // Back on the button before the browser moves on, so Tab carries on from there.
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    const items = itemsOf(menuRef.current);
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const last = items.length - 1;
    let next: number;
    if (e.key === 'ArrowDown') next = at < 0 || at === last ? 0 : at + 1;
    else if (e.key === 'ArrowUp') next = at <= 0 ? last : at - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = last;
    else return;
    e.preventDefault();
    items[next]?.focus();
  };

  return { open, box, toggle, close, onListKey, triggerRef, menuRef, listId };
}
