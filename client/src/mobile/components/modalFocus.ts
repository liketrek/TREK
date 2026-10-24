import { type KeyboardEvent, type RefObject, useEffect } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab inside a modal panel: past its last control it goes round to the
 * first, and Shift+Tab from the first one (or from the panel itself) to the
 * last. A panel with nothing to focus keeps the focus where it is.
 */
export function keepTabInside(e: KeyboardEvent, panel: HTMLElement | null): void {
  if (e.key !== 'Tab' || !panel) return;
  const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
  if (focusable.length === 0) {
    e.preventDefault();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * While `shown`, the focus sits on the modal panel (which takes it with
 * `tabIndex={-1}`); once it is no longer shown, the focus goes back to where
 * it was before.
 */
export function useModalFocus(panel: RefObject<HTMLElement | null>, shown: boolean): void {
  useEffect(() => {
    if (!shown) return;
    const previous = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => previous?.focus();
  }, [panel, shown]);
}
