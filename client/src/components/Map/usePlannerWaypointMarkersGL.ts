import { useEffect, useLayoutEffect, useRef } from 'react';

import { bindPinHoverLabel, mapHoverLabel } from './mapHoverLabel';
import type { MapViewProps } from './mapViewContract';
import { plannerPinShape } from './plannerPinShape';
import { wirePlannerWaypointDrag } from './plannerWaypointDrag';

/** The slice of the GL map the waypoint pins need: its box and screen-to-ground lookup. */
interface PlannerWaypointMap {
  getContainer: () => HTMLElement;
  unproject: (point: [number, number]) => { lat: number; lng: number };
  /** Optional so a stand-in map without events still takes the pins. */
  on?: (type: 'movestart', listener: () => void) => unknown;
  off?: (type: 'movestart', listener: () => void) => unknown;
}

/** The slice of a hand-positioned pin the waypoint markers drive. */
interface PlannerWaypointPin {
  remove: () => void;
  setLngLat: (value: [number, number]) => void;
}

interface PlannerWaypointMarkersOptions<Pin extends PlannerWaypointPin> {
  mapRef: { readonly current: PlannerWaypointMap | null };
  mapReady: boolean;
  /** The pins live in the caller's ref so its render-clock reposition can reach them. */
  pinsRef: { current: Pin[] };
  /** Puts a waypoint element on the map at the given position. */
  attachPin: (el: HTMLElement, lng: number, lat: number) => Pin;
  /** The pin's inline style for a size and selection; the renderer owns the colour. */
  pinCss: (size: number, selected: boolean) => string;
  plannerWaypoints: NonNullable<MapViewProps['plannerWaypoints']>;
  selectedPlannerWaypointId: string | null;
  onPlannerWaypointClick: MapViewProps['onPlannerWaypointClick'];
  onPlannerWaypointMove: MapViewProps['onPlannerWaypointMove'];
}

/**
 * The numbered control points of a list-first route editor, drawn as pins on the GL map.
 *
 * The handlers are read through a ref so a parent re-rendering with fresh callbacks does
 * not tear the pins down mid-drag; only a change in whether they can be dragged does.
 */
export function usePlannerWaypointMarkersGL<Pin extends PlannerWaypointPin>({
  mapRef,
  mapReady,
  pinsRef,
  attachPin,
  pinCss,
  plannerWaypoints,
  selectedPlannerWaypointId,
  onPlannerWaypointClick,
  onPlannerWaypointMove,
}: PlannerWaypointMarkersOptions<Pin>): void {
  const plannerWaypointHandlersRef = useRef({ onPlannerWaypointClick, onPlannerWaypointMove });
  useLayoutEffect(() => {
    plannerWaypointHandlersRef.current = { onPlannerWaypointClick, onPlannerWaypointMove };
  }, [onPlannerWaypointClick, onPlannerWaypointMove]);
  const plannerWaypointsDraggable = !!onPlannerWaypointMove;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    pinsRef.current.forEach((pin) => pin.remove());
    pinsRef.current = [];
    const dragCleanups: (() => void)[] = [];
    const hoverLabel = mapHoverLabel(map, 'planner-waypoint-label');
    // A label left behind by a pan or a zoom would float over the wrong spot.
    const hideOnMove = () => hoverLabel.hide();
    map.on?.('movestart', hideOnMove);
    dragCleanups.push(() => map.off?.('movestart', hideOnMove));

    for (const [index, point] of plannerWaypoints.entries()) {
      const selected = point.id === selectedPlannerWaypointId;
      const { size, text } = plannerPinShape(point, index, selected);
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = text;
      const name = point.name ?? `Waypoint ${index + 1}`;
      el.setAttribute('aria-label', name);
      el.style.cssText = `${pinCss(size, selected)};cursor:pointer;padding:0`;
      const swallow = (event: Event) => event.stopPropagation();
      const select = (event: Event) => {
        event.stopPropagation();
        plannerWaypointHandlersRef.current.onPlannerWaypointClick?.(point.id);
      };
      el.addEventListener('pointerdown', swallow);
      el.addEventListener('touchstart', swallow, { passive: true });
      el.addEventListener('click', select);
      const pin = attachPin(el, point.lng, point.lat);
      pinsRef.current.push(pin);
      dragCleanups.push(bindPinHoverLabel(el, hoverLabel, map.getContainer(), { name, detail: point.detail ?? null }));
      if (plannerWaypointsDraggable) {
        el.style.cursor = 'grab';
        dragCleanups.push(
          wirePlannerWaypointDrag({
            element: el,
            initial: { lat: point.lat, lng: point.lng },
            coordinateAt: (clientX, clientY) => {
              const rect = map.getContainer().getBoundingClientRect();
              const at = map.unproject([clientX - rect.left, clientY - rect.top]);
              return { lat: at.lat, lng: at.lng };
            },
            setPosition: ({ lat, lng }) => pin.setLngLat([lng, lat]),
            onCommit: ({ lat, lng }) =>
              plannerWaypointHandlersRef.current.onPlannerWaypointMove?.(point.id, lat, lng) ?? false,
          })
        );
      }
    }

    return () => {
      dragCleanups.forEach((cleanup) => cleanup());
      hoverLabel.remove();
      pinsRef.current.forEach((pin) => pin.remove());
      pinsRef.current = [];
    };
  }, [
    attachPin,
    mapReady,
    mapRef,
    pinCss,
    pinsRef,
    plannerWaypoints,
    plannerWaypointsDraggable,
    selectedPlannerWaypointId,
  ]);
}
