import { useCallback, useEffect } from 'react';

import { useStudioStore } from '../../store/studioStore';

/** What a page drawn in a chat card spreads on its button so the Studio's page rail outlines that page. */
interface StudioPageHint {
  onPointerEnter: () => void;
  onPointerLeave: () => void;
  onFocus: () => void;
  onBlur: () => void;
}

/**
 * Pointing at a page drawn in a chat card, with the pointer or the keyboard's
 * focus, outlines the same page in the Studio's page rail (journey-studio.md
 * 4.2); leaving it, or the card going away while it points, takes the outline
 * off again. A page the open book does not hold (a new page of a design,
 * another book) outlines nothing.
 */
export function useStudioPageHint(spreadId: string): StudioPageHint {
  const setHint = useStudioStore((s) => s.setHintSpread);

  const point = useCallback(() => {
    const held = useStudioStore.getState().doc?.spreads.some((spread) => spread.id === spreadId) ?? false;
    setHint(held ? spreadId : null);
  }, [spreadId, setHint]);

  const leave = useCallback(() => {
    if (useStudioStore.getState().hintSpread === spreadId) setHint(null);
  }, [spreadId, setHint]);

  // A card that re-renders or leaves the thread while pointed at takes its outline with it.
  useEffect(() => leave, [leave]);

  return { onPointerEnter: point, onPointerLeave: leave, onFocus: point, onBlur: leave };
}
