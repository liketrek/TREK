import { useAssistantStore } from '../../../store/assistantStore';

/**
 * Opens the phone's route peek on another route, or closes it, and moves the
 * light a tap on the map put on a route with it. On the phone no pointer
 * ever leaves a line, so nothing else would put that light out: the line
 * would stay lit on the map and its card in the chat after the peek is gone.
 * A light the chat itself put on (a card under the finger) is left alone.
 * Kept apart from the peek, so the trip screen can close it without loading
 * the peek's code.
 */
export function moveRoutePeek(tripId: number, toolCallId: string | null): void {
  const { mapLink, setMapHover, setRoutePeek } = useAssistantStore.getState();
  if (mapLink?.tripId === tripId && mapLink.source === 'map' && mapLink.hoveredId !== null) {
    setMapHover(tripId, toolCallId, 'map');
  }
  setRoutePeek(toolCallId === null ? null : { tripId, toolCallId });
}
