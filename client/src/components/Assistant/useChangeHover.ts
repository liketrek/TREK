import { type PointerEvent, useCallback, useEffect } from 'react';

import { useAssistantStore } from '../../store/assistantStore';

/**
 * Ties one change in the card to its pin on the map: resting on the row (or
 * tapping it on a touch screen) lights the pin, and resting on the pin lights
 * the row. Each row reads only whether it is the one lit, so a hover renders
 * the row it enters and the one it leaves, not the whole card.
 */
export function useChangeHover(tripId: number, toolCallId: string | null) {
  const hovered = useAssistantStore((s) =>
    toolCallId !== null && s.mapLink?.tripId === tripId && s.mapLink.hoveredId === toolCallId ? s.mapLink.source : null
  );
  const setMapHover = useAssistantStore((s) => s.setMapHover);

  const enter = useCallback(() => {
    if (toolCallId !== null) setMapHover(tripId, toolCallId, 'card');
  }, [setMapHover, tripId, toolCallId]);

  const leave = useCallback(() => {
    const link = useAssistantStore.getState().mapLink;
    // Only the row that lit the pin puts it out; the pointer may already rest on another.
    if (toolCallId !== null && link?.tripId === tripId && link.hoveredId === toolCallId) {
      setMapHover(tripId, null, 'card');
    }
  }, [setMapHover, tripId, toolCallId]);

  // A row that goes (the change was decided, the chat closed) takes its light with it.
  useEffect(() => leave, [leave]);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.pointerType === 'touch') enter();
    },
    [enter]
  );

  return {
    /** Lit from anywhere: the card, the map, a found place. */
    lit: hovered !== null,
    /** Lit from its pin on the map, where the card shows it itself. */
    litFromMap: hovered === 'map',
    handlers: { onMouseEnter: enter, onMouseLeave: leave, onFocus: enter, onBlur: leave, onPointerDown },
  };
}
