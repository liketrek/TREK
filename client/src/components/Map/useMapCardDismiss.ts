import { useEffect, type RefObject } from 'react';

/**
 * Whether a press lands in a list one of the card's own buttons has open
 * (PillSelect, CustomSelect): such a list is laid over the page outside the
 * card, but picking from it is still working in the card. Read at the press,
 * as a list opens and closes while the card stays.
 */
function inListOpenedFrom(card: HTMLElement, target: Node): boolean {
  for (const trigger of card.querySelectorAll('[aria-expanded="true"][aria-controls]')) {
    const list = document.getElementById(trigger.getAttribute('aria-controls') ?? '');
    if (list?.contains(target)) return true;
  }
  return false;
}

/**
 * Closes a card floating over the map on a press anywhere outside it and on
 * Escape, while it is open. The press outside is handed to `onOutsidePress`
 * as well, so the map under it can leave the click that follows alone (see
 * `useOutsidePressGuard`). A press on another object closes this card first,
 * and the click then opens that object's.
 */
export function useMapCardDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
  onOutsidePress?: () => void
): void {
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      const card = ref.current;
      if (card && event.target instanceof Node && (card.contains(event.target) || inListOpenedFrom(card, event.target)))
        return;
      onOutsidePress?.();
      onClose();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) onClose();
    };
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, onOutsidePress, ref]);
}
