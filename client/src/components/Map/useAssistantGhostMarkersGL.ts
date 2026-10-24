import { useEffect, useLayoutEffect, useRef } from 'react';
import { mountGhosts, setGhostHot, type GhostHandlers } from './assistantGhostMarker';
import { bindPinHoverLabel, mapHoverLabel } from './mapHoverLabel';
import type { AssistantGhost } from './mapViewContract';

/** The slice of the GL map the ghosts need: its box, and move events to hide the label on. */
export interface GhostMap {
  getContainer: () => HTMLElement;
  on?: (type: 'movestart', listener: () => void) => unknown;
  off?: (type: 'movestart', listener: () => void) => unknown;
}

interface GhostPinGL {
  remove: () => void;
}

interface AssistantGhostMarkersOptions<Pin extends GhostPinGL> {
  mapRef: { readonly current: GhostMap | null };
  mapReady: boolean;
  /** The pins live in the caller's ref so its render-clock reposition can reach them. */
  pinsRef: { current: Pin[] };
  attachPin: (el: HTMLElement, lng: number, lat: number) => Pin;
  ghosts: readonly AssistantGhost[] | undefined;
  hoveredId: string | null | undefined;
  onHover?: (id: string | null) => void;
  onClick?: (id: string) => void;
}

/**
 * The assistant's suggestions on the GL map, the twin of the Leaflet
 * AssistantGhostLayer on the same builder. Each ghost is a hand-positioned
 * pin; its name floats over it in the map's hover label, set as text. The
 * hover is its own small effect that toggles a class, so it never rebuilds
 * a pin.
 */
export function useAssistantGhostMarkersGL<Pin extends GhostPinGL>({
  mapRef,
  mapReady,
  pinsRef,
  attachPin,
  ghosts,
  hoveredId,
  onHover,
  onClick,
}: AssistantGhostMarkersOptions<Pin>): void {
  const handlers = useRef<GhostHandlers>({ onHover, onClick });
  useLayoutEffect(() => {
    handlers.current = { onHover, onClick };
  }, [onHover, onClick]);
  const elements = useRef<ReadonlyMap<string, HTMLElement>>(new Map());

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !ghosts?.length) return;
    const label = mapHoverLabel(map, 'assistant-ghost-label');
    const hide = () => label.hide();
    map.on?.('movestart', hide);
    const unbind: (() => void)[] = [];
    const mounted = mountGhosts(
      ghosts,
      (el, ghost) => {
        const pin = attachPin(el, ghost.lng, ghost.lat);
        pinsRef.current.push(pin);
        unbind.push(bindPinHoverLabel(el, label, map.getContainer(), { name: ghost.name, detail: null }));
        return pin;
      },
      handlers
    );
    elements.current = mounted.elements;
    return () => {
      map.off?.('movestart', hide);
      unbind.forEach((off) => off());
      mounted.dispose();
      label.remove();
      pinsRef.current = [];
      elements.current = new Map();
    };
  }, [attachPin, ghosts, mapReady, mapRef, pinsRef]);

  useEffect(() => {
    setGhostHot(elements.current, hoveredId);
  }, [ghosts, hoveredId, mapReady]);
}
