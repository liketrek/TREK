import L from 'leaflet';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import { GHOST_SIZE, mountGhosts, setGhostHot, type GhostHandlers } from './assistantGhostMarker';
import type { AssistantGhost } from './mapViewContract';

interface AssistantGhostLayerProps {
  ghosts: readonly AssistantGhost[] | undefined;
  hoveredId: string | null | undefined;
  onHover?: (id: string | null) => void;
  onClick?: (id: string) => void;
}

/** Above the place pins, so a suggestion on a busy day is never buried under the stops it joins. */
const GHOST_Z_OFFSET = 900;

/**
 * The assistant's suggestions on the Leaflet map, outside the cluster group:
 * a suggestion stands on its own until it is decided. The name shows in the
 * map's own tooltip, built from text. A hover only toggles a class on the
 * element; the pins are rebuilt when the suggestions change, never on hover.
 */
export function AssistantGhostLayer({ ghosts, hoveredId, onHover, onClick }: AssistantGhostLayerProps) {
  const map = useMap();
  const handlers = useRef<GhostHandlers>({ onHover, onClick });
  useLayoutEffect(() => {
    handlers.current = { onHover, onClick };
  }, [onHover, onClick]);
  const elements = useRef<ReadonlyMap<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (!ghosts?.length) return;
    const mounted = mountGhosts(
      ghosts,
      (el, ghost) => {
        const icon = L.divIcon({ html: el, className: 'trek-ghost-pin', iconSize: [GHOST_SIZE, GHOST_SIZE] });
        const label = document.createElement('span');
        label.textContent = ghost.name;
        const marker = L.marker([ghost.lat, ghost.lng], { icon, keyboard: false, zIndexOffset: GHOST_Z_OFFSET })
          .bindTooltip(label, { direction: 'top', offset: [0, -GHOST_SIZE / 2], className: 'map-tooltip' })
          .addTo(map);
        return { remove: () => marker.remove() };
      },
      handlers
    );
    elements.current = mounted.elements;
    return () => {
      mounted.dispose();
      elements.current = new Map();
    };
  }, [ghosts, map]);

  useEffect(() => {
    setGhostHot(elements.current, hoveredId);
  }, [ghosts, hoveredId]);

  return null;
}
