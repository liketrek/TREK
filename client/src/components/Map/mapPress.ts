/**
 * Telling a click that should put something on the map from the end of a pan,
 * a rotation or a tilt. Both map engines fire their click after short drags
 * and long holds too, which in 3D, where every look around is a drag, kept
 * dropping waypoints nobody meant to set.
 */

/** How far the pointer may travel during a press that still counts as a click. */
export const TAP_MAX_TRAVEL_PX = 4;
/** How long a press that still counts as a click may last. */
export const TAP_MAX_DURATION_MS = 300;

/** One finished press on the map. */
export interface MapPress {
  /** The farthest the first pointer got from where it went down. */
  travelPx: number;
  durationMs: number;
  /** The most pointers down at once: two fingers pinch or rotate, they never place. */
  pointers: number;
}

/**
 * Whether a press places a point. A press that was never seen (a keyboard
 * activation, a synthetic click) is left to the map, which only fires a click
 * for it on purpose.
 */
export function isPlacementTap(press: MapPress | null): boolean {
  if (!press) return true;
  return press.pointers <= 1 && press.travelPx < TAP_MAX_TRAVEL_PX && press.durationMs < TAP_MAX_DURATION_MS;
}

export interface PressTracker {
  /** The press that ended last, handed out once: the click it caused reads it, the next one does not. */
  take: () => MapPress | null;
  dispose: () => void;
}

interface Active {
  id: number;
  x: number;
  y: number;
  at: number;
  travelPx: number;
  pointers: Set<number>;
  most: number;
  cancelled: boolean;
}

/**
 * Follows the presses on an element in the capture phase, so neither engine
 * can swallow them first, and keeps the last finished one for the click that
 * follows it.
 */
export function createPressTracker(target: EventTarget, now: () => number = () => performance.now()): PressTracker {
  let active: Active | null = null;
  let last: MapPress | null = null;

  const down = (event: Event) => {
    const e = event as PointerEvent;
    if (active) {
      active.pointers.add(e.pointerId);
      active.most = Math.max(active.most, active.pointers.size);
      return;
    }
    last = null;
    active = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      at: now(),
      travelPx: 0,
      pointers: new Set([e.pointerId]),
      most: 1,
      cancelled: false,
    };
  };
  const move = (event: Event) => {
    const e = event as PointerEvent;
    if (!active || e.pointerId !== active.id) return;
    active.travelPx = Math.max(active.travelPx, Math.hypot(e.clientX - active.x, e.clientY - active.y));
  };
  const up = (event: Event) => {
    const e = event as PointerEvent;
    if (!active) return;
    if (e.pointerId === active.id && !active.cancelled) {
      move(e);
    }
    if (event.type === 'pointercancel') active.cancelled = true;
    active.pointers.delete(e.pointerId);
    if (active.pointers.size > 0) return;
    last = {
      travelPx: active.cancelled ? Number.POSITIVE_INFINITY : active.travelPx,
      durationMs: now() - active.at,
      pointers: active.most,
    };
    active = null;
  };

  const options = { capture: true, passive: true } as const;
  target.addEventListener('pointerdown', down, options);
  target.addEventListener('pointermove', move, options);
  target.addEventListener('pointerup', up, options);
  target.addEventListener('pointercancel', up, options);

  return {
    take: () => {
      const press = last;
      last = null;
      return press;
    },
    dispose: () => {
      target.removeEventListener('pointerdown', down, options);
      target.removeEventListener('pointermove', move, options);
      target.removeEventListener('pointerup', up, options);
      target.removeEventListener('pointercancel', up, options);
    },
  };
}
