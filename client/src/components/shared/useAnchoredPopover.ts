import { createContext, use, useCallback, useState, type RefObject } from 'react';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';

/** The scrolling content that contains a panel's dropdown triggers. */
export const PopoverBoundary = createContext<RefObject<HTMLElement | null> | null>(null);

export function useAnchoredPopover(
  anchorRef: RefObject<HTMLElement | null>,
  {
    disabled = false,
    estimatedHeight,
    matchWidth = true,
  }: {
    disabled?: boolean;
    estimatedHeight?: number;
    matchWidth?: boolean;
  }
) {
  const boundaryRef = use(PopoverBoundary);
  const bounded = !!boundaryRef;
  const unavailable = bounded && disabled;
  const [expanded, setOpen] = useState(false);
  if (unavailable && expanded) setOpen(false);
  const open = expanded && !unavailable;
  const hide = useCallback(() => setOpen(false), []);
  const box = useAnchoredPosition(anchorRef, open, {
    matchWidth: bounded || matchWidth,
    estimatedHeight,
    boundary: boundaryRef ? { ref: boundaryRef, onAnchorHidden: hide } : undefined,
  });
  return { open, box, bounded, setOpen };
}
