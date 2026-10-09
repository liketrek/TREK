export interface PlannerWaypointCoordinate {
  lat: number;
  lng: number;
}

interface PlannerWaypointDragOptions {
  element: HTMLElement;
  initial: PlannerWaypointCoordinate;
  coordinateAt: (clientX: number, clientY: number) => PlannerWaypointCoordinate;
  setPosition: (coordinate: PlannerWaypointCoordinate) => void;
  onCommit: (coordinate: PlannerWaypointCoordinate) => boolean | void;
}

const DRAG_THRESHOLD_PX = 4;

export function wirePlannerWaypointDrag({
  element,
  initial,
  coordinateAt,
  setPosition,
  onCommit,
}: PlannerWaypointDragOptions): () => void {
  let pointerId: number | null = null;
  let start: { x: number; y: number } | null = null;
  let dragged = false;
  let suppressClick = false;
  const originalTouchAction = element.style.touchAction;
  const originalUserSelect = element.style.userSelect;

  const stopMapGesture = (event: Event) => event.stopPropagation();
  const restore = () => setPosition(initial);
  const cancel = (event?: Event) => {
    if (pointerId === null) return;
    event?.stopPropagation();
    restore();
    pointerId = null;
    start = null;
    dragged = false;
    suppressClick = false;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || pointerId !== null) {
      event.stopPropagation();
      return;
    }
    event.stopPropagation();
    pointerId = event.pointerId;
    start = { x: event.clientX, y: event.clientY };
    dragged = false;
    suppressClick = false;
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is unavailable in some test DOMs and older browsers.
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId || !start) return;
    event.stopPropagation();
    if (!dragged && Math.hypot(event.clientX - start.x, event.clientY - start.y) < DRAG_THRESHOLD_PX) return;
    dragged = true;
    event.preventDefault();
    setPosition(coordinateAt(event.clientX, event.clientY));
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== pointerId || !start) return;
    event.stopPropagation();
    const travelled = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (dragged || travelled >= DRAG_THRESHOLD_PX) {
      const coordinate = coordinateAt(event.clientX, event.clientY);
      setPosition(coordinate);
      const accepted = onCommit(coordinate) !== false;
      suppressClick = true;
      if (!accepted) restore();
    }
    pointerId = null;
    start = null;
    dragged = false;
  };

  const onClickCapture = (event: MouseEvent) => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const onTouchCancel = (event: Event) => cancel(event);

  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointermove', onPointerMove);
  element.addEventListener('pointerup', onPointerUp);
  element.addEventListener('pointercancel', cancel);
  element.addEventListener('lostpointercapture', cancel);
  element.addEventListener('click', onClickCapture, true);
  element.addEventListener('mousedown', stopMapGesture);
  element.addEventListener('touchstart', stopMapGesture, { passive: true });
  element.addEventListener('touchmove', stopMapGesture, { passive: true });
  element.addEventListener('touchend', stopMapGesture, { passive: true });
  element.addEventListener('touchcancel', onTouchCancel, { passive: true });
  element.style.touchAction = 'none';
  element.style.userSelect = 'none';

  return () => {
    cancel();
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointermove', onPointerMove);
    element.removeEventListener('pointerup', onPointerUp);
    element.removeEventListener('pointercancel', cancel);
    element.removeEventListener('lostpointercapture', cancel);
    element.removeEventListener('click', onClickCapture, true);
    element.removeEventListener('mousedown', stopMapGesture);
    element.removeEventListener('touchstart', stopMapGesture);
    element.removeEventListener('touchmove', stopMapGesture);
    element.removeEventListener('touchend', stopMapGesture);
    element.removeEventListener('touchcancel', onTouchCancel);
    element.style.touchAction = originalTouchAction;
    element.style.userSelect = originalUserSelect;
  };
}
