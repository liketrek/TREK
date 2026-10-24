import { useEffect, useRef } from 'react';
import type { ViewportPadding } from '../../utils/mapViewport';
import { PLACE_POP_CLASS, PLACE_PULSE_CLASS } from './assistantGhostMarker';
import type { AssistantCamera } from './mapViewContract';

/**
 * What both renderers share when the assistant moves their camera or marks a
 * pin: the padding around what the assistant's window hides, the centre of
 * a set of points, whether the user is busy moving the map, and the classes
 * on the real pins. The renderer keeps only its own camera calls.
 */

/** How long a move the assistant asks for takes, when it animates. */
export const ASSISTANT_CAMERA_MS = 600;
/** After the user touched the map, moves they did not ask for wait this long. */
const USER_MOVE_QUIET_MS = 5000;
/** How long a pin that just arrived keeps its pop class; the animation itself is shorter. */
const POP_HOLD_MS = 400;
/** A request this young when the map mounts was meant for this map: the chat switched to it to show something. */
const FRESH_REQUEST_MS = 5000;

/** The renderer's padding, widened on the side the assistant's window covers. */
export function coverPadding(base: ViewportPadding, cover: AssistantCamera['cover']): ViewportPadding {
  if (!cover) return base;
  return { ...base, [cover.side]: Math.max(base[cover.side], cover.px) };
}

/** The middle of the points' box, [lat, lng]. */
export function centreOf(points: readonly [number, number][]): [number, number] {
  const lats = points.map(([lat]) => lat);
  const lngs = points.map(([, lng]) => lng);
  return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
}

/**
 * When the user last pressed, scrolled or touched the map. Read from the
 * input itself rather than from the map's move events, which fire for the
 * assistant's own moves just the same.
 */
export function useUserMoveClock(getContainer: () => HTMLElement | null, ready: boolean): { readonly current: number } {
  const last = useRef(0);
  useEffect(() => {
    const container = ready ? getContainer() : null;
    if (!container) return;
    const mark = () => {
      last.current = Date.now();
    };
    const events = ['pointerdown', 'wheel', 'touchstart'] as const;
    events.forEach((type) => container.addEventListener(type, mark, { passive: true }));
    return () => events.forEach((type) => container.removeEventListener(type, mark));
  }, [getContainer, ready]);
  return last;
}

/**
 * The request the camera should carry out now, or null. The one present when
 * the map mounts is skipped (it was meant for a map that is gone) unless it
 * was asked for a moment ago (the chat switched to the map to show it), as is a
 * repeated key, and a move the user did not ask for while they are moving
 * the map themselves.
 */
export function useCameraRequest(
  camera: AssistantCamera | null | undefined,
  userMovedAt: { readonly current: number }
): (run: (camera: AssistantCamera) => void) => void {
  // The request on screen when the map mounted, judged on the first run: young enough, it was meant for this map.
  const mounted = useRef(camera ?? null);
  const seen = useRef<string | null>(null);
  return (run) => {
    const first = mounted.current;
    if (first) {
      mounted.current = null;
      if (!(first.at && Date.now() - first.at < FRESH_REQUEST_MS)) seen.current = first.key;
    }
    if (!camera || camera.key === seen.current) return;
    seen.current = camera.key;
    if (camera.auto && Date.now() - userMovedAt.current < USER_MOVE_QUIET_MS) return;
    if (camera.points.length > 0) run(camera);
  };
}

/**
 * Puts the pop class on the pins of places that just arrived and the pulse
 * class on the pin the hovered suggestion is about. A frame late on purpose:
 * the GL map rebuilds its pins in the next frame after the places change.
 * A mark ends on the pin the place has then, which on the GL map may be a
 * newer element than the one marked (`carryAssistantMarks` in useAssistantMapGL).
 */
export function useAssistantMarkerClasses(
  markerEl: (placeId: number) => HTMLElement | null,
  poppedPlaceIds: readonly number[] | undefined,
  pulsePlaceId: number | null | undefined
): void {
  useEffect(() => {
    if (!poppedPlaceIds?.length) return;
    let marked: HTMLElement[] = [];
    const unmark = () =>
      [...marked, ...poppedPlaceIds.flatMap((id) => markerEl(id) ?? [])].forEach((el) =>
        el.classList.remove(PLACE_POP_CLASS)
      );
    const frame = requestAnimationFrame(() => {
      marked = poppedPlaceIds.flatMap((id) => markerEl(id) ?? []);
      marked.forEach((el) => el.classList.add(PLACE_POP_CLASS));
    });
    const timer = window.setTimeout(unmark, POP_HOLD_MS);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      unmark();
    };
  }, [markerEl, poppedPlaceIds]);

  useEffect(() => {
    if (pulsePlaceId == null) return;
    let marked: HTMLElement | null = null;
    const frame = requestAnimationFrame(() => {
      marked = markerEl(pulsePlaceId);
      marked?.classList.add(PLACE_PULSE_CLASS);
    });
    return () => {
      cancelAnimationFrame(frame);
      marked?.classList.remove(PLACE_PULSE_CLASS);
      markerEl(pulsePlaceId)?.classList.remove(PLACE_PULSE_CLASS);
    };
  }, [markerEl, pulsePlaceId]);
}
