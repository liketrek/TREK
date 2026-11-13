import { useEffect, useId, useRef, useState } from 'react';

let activePickerId: symbol | null = null;
let closeActivePicker: (() => void) | null = null;

function openVacayCalendarColorPicker(id: symbol, close: () => void): void {
  if (activePickerId !== id) closeActivePicker?.();
  activePickerId = id;
  closeActivePicker = close;
}

function closeVacayCalendarColorPicker(id: symbol): void {
  if (activePickerId !== id) return;
  activePickerId = null;
  closeActivePicker = null;
}

export function useVacayCalendarColorPicker() {
  const [open, setOpen] = useState(false);
  const pickerId = useRef(Symbol());
  const pickerAttr = useId();

  const close = () => {
    setOpen(false);
    closeVacayCalendarColorPicker(pickerId.current);
  };

  const toggle = () => {
    if (open) {
      close();
      return;
    }
    openVacayCalendarColorPicker(pickerId.current, () => setOpen(false));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-vacay-color-picker]')?.getAttribute('data-vacay-color-picker') !== pickerAttr) close();
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [open, pickerAttr]);

  useEffect(() => () => closeVacayCalendarColorPicker(pickerId.current), []);

  return { open, toggle, close, pickerAttr };
}
