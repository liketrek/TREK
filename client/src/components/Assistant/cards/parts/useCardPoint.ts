import { useCallback, useEffect } from 'react';

import { useAssistantStore } from '../../../../store/assistantStore';
import { useAssistantView } from '../../assistantViewContext';

/** A spot a card points at: its own key, where it is and its name; `placeId` when it is a place of the trip. */
interface CardPoint {
  ref: string;
  lat: number;
  lng: number;
  name: string;
  placeId?: number;
}

/**
 * A card's part of the map: while the pointer rests on a row its spot shows
 * as a pin (a place of the trip pulses its own pin), and a click moves the
 * map there, after the chat stepped aside where it covers the map (the
 * phone). The pin goes when the card does.
 */
export function useCardPoint() {
  const { tripId, onRevealMap } = useAssistantView();
  const requestCamera = useAssistantStore((s) => s.requestCamera);
  const setPreviewPin = useAssistantStore((s) => s.setPreviewPin);

  // Stable, so a card can take the pin away when it goes.
  const hover = useCallback(
    (point: CardPoint | null) => {
      if (point) setPreviewPin({ tripId, ...point });
      else setPreviewPin(null);
    },
    [tripId, setPreviewPin]
  );

  /** Shows the spot on the map; on the phone the chat steps aside first. */
  const show = useCallback(
    (point: { lat: number; lng: number }) => {
      onRevealMap?.();
      requestCamera(tripId, [[point.lat, point.lng]], 'pan', 'user');
    },
    [tripId, onRevealMap, requestCamera]
  );

  useEffect(() => () => setPreviewPin(null), [setPreviewPin]);

  return { hover, show };
}
